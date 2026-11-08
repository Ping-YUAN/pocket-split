import type { Expense, Participant } from '../types'

export type Settlement = {
  from: string
  to: string
  amount: number
}

export type ParticipantSummary = {
  name: string
  totalPaid: number
  totalOwed: number
  net: number
}

export type DebtCalculationResult = {
  totalSpent: number
  averagePerPerson: number
  balances: Record<string, number>
  participantData: ParticipantSummary[]
  settlements: Settlement[]
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export function calculateDebts({
  participants = [],
  expenses = [],
  preferredPayerId = '',
}: {
  participants?: Participant[]
  expenses?: Expense[]
  preferredPayerId?: string
}): DebtCalculationResult {
  const balances: Record<string, { totalPaid: number; totalOwed: number; net: number }> = participants.reduce(
    (accumulator, participant) => {
      accumulator[participant.id] = {
        totalPaid: 0,
        totalOwed: 0,
        net: 0,
      }
      return accumulator
    },
    {} as Record<string, { totalPaid: number; totalOwed: number; net: number }>,
  )

  const participantNameLookup = new Map(participants.map((participant) => [participant.id, participant.name]))
  let totalSpent = 0

  expenses.forEach((expense) => {
    const amount = Number(expense.amount) || 0
    totalSpent += amount

    if (balances[expense.payerId]) {
      balances[expense.payerId].totalPaid += amount
    }

    const selectedParticipants = expense.participantIds.length
      ? [...new Set(expense.participantIds.filter((participantId) => participantId in balances))]
      : participants.map((participant) => participant.id)
    const splitParticipants = selectedParticipants.length ? selectedParticipants : participants.map((participant) => participant.id)
    const splitAmount = splitParticipants.length ? amount / splitParticipants.length : 0

    splitParticipants.forEach((participantId) => {
      if (balances[participantId]) {
        balances[participantId].totalOwed += splitAmount
      }
    })
  })

  Object.keys(balances).forEach((participantId) => {
    balances[participantId].net = roundCurrency(
      balances[participantId].totalPaid - balances[participantId].totalOwed,
    )
  })

  const creditors = Object.entries(balances)
    .filter(([, data]) => data.net > 0.01)
    .map(([participantId, data]) => ({
      id: participantId,
      name: participantNameLookup.get(participantId) ?? participantId,
      amount: roundCurrency(data.net),
    }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = Object.entries(balances)
    .filter(([, data]) => data.net < -0.01)
    .map(([participantId, data]) => ({
      id: participantId,
      name: participantNameLookup.get(participantId) ?? participantId,
      amount: roundCurrency(Math.abs(data.net)),
    }))
    .sort((a, b) => a.amount - b.amount)

  const settlements: Settlement[] = []
  const preferredDebtorIndex = debtors.findIndex((debtor) => debtor.id === preferredPayerId)
  const preferredDebtor = preferredDebtorIndex >= 0 ? debtors.splice(preferredDebtorIndex, 1)[0] : undefined

  if (preferredDebtor && creditors.length > 1 && preferredDebtor.amount >= 0.02) {
    const [firstCreditor, secondCreditor] = creditors
    const debtCents = Math.round(preferredDebtor.amount * 100)
    const firstCreditorCents = Math.round(firstCreditor.amount * 100)
    const secondCreditorCents = Math.round(secondCreditor.amount * 100)
    const lowerFirstPayment = Math.max(1, debtCents - secondCreditorCents)
    const upperFirstPayment = Math.min(firstCreditorCents, debtCents - 1)

    if (firstCreditorCents + secondCreditorCents >= debtCents) {
      const firstPaymentCents = Math.max(
        lowerFirstPayment,
        Math.min(upperFirstPayment, Math.ceil(debtCents / 2)),
      )
      const secondPaymentCents = debtCents - firstPaymentCents
      const firstAmount = firstPaymentCents / 100
      const secondAmount = secondPaymentCents / 100

      settlements.push(
        { from: preferredDebtor.name, to: firstCreditor.name, amount: firstAmount },
        { from: preferredDebtor.name, to: secondCreditor.name, amount: secondAmount },
      )
      firstCreditor.amount = roundCurrency(firstCreditor.amount - firstAmount)
      secondCreditor.amount = roundCurrency(secondCreditor.amount - secondAmount)
      preferredDebtor.amount = 0
    }
  }

  if (preferredDebtor && preferredDebtor.amount > 0.01) {
    debtors.unshift(preferredDebtor)
  }

  let debtorIndex = 0
  let creditorIndex = 0
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex]
    const creditor = creditors[creditorIndex]
    const transferAmount = Math.min(debtor.amount, creditor.amount)

    if (transferAmount <= 0.01) {
      debtorIndex += 1
      creditorIndex += 1
      continue
    }

    settlements.push({
      from: debtor.name,
      to: creditor.name,
      amount: roundCurrency(transferAmount),
    })

    debtor.amount = roundCurrency(debtor.amount - transferAmount)
    creditor.amount = roundCurrency(creditor.amount - transferAmount)

    if (debtor.amount <= 0.01) {
      debtorIndex += 1
    }

    if (creditor.amount <= 0.01) {
      creditorIndex += 1
    }
  }

  return {
    totalSpent: roundCurrency(totalSpent),
    averagePerPerson: participants.length ? roundCurrency(totalSpent / participants.length) : 0,
    balances: Object.fromEntries(
      participants.map((participant) => [participant.name, roundCurrency(balances[participant.id]?.net ?? 0)]),
    ),
    participantData: participants.map((participant) => ({
      name: participant.name,
      totalPaid: roundCurrency(balances[participant.id]?.totalPaid ?? 0),
      totalOwed: roundCurrency(balances[participant.id]?.totalOwed ?? 0),
      net: roundCurrency(balances[participant.id]?.net ?? 0),
    })),
    settlements,
  }
}
