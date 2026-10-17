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
}: {
  participants?: Participant[]
  expenses?: Expense[]
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

    const selectedParticipants = expense.participantIds.length ? expense.participantIds : participants.map((participant) => participant.id)
    const splitAmount = selectedParticipants.length ? amount / selectedParticipants.length : 0

    selectedParticipants.forEach((participantId) => {
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
      name: participantNameLookup.get(participantId) ?? participantId,
      amount: roundCurrency(data.net),
    }))
    .sort((a, b) => b.amount - a.amount)

  const debtors = Object.entries(balances)
    .filter(([, data]) => data.net < -0.01)
    .map(([participantId, data]) => ({
      name: participantNameLookup.get(participantId) ?? participantId,
      amount: roundCurrency(Math.abs(data.net)),
    }))
    .sort((a, b) => a.amount - b.amount)

  const settlements: Settlement[] = []
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
