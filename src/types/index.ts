export interface Participant {
  id: string
  name: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  payerId: string
  participantIds: string[]
  date: string
}

export interface Gathering {
  id: string
  name: string
  participants: Participant[]
  expenses: Expense[]
  createdAt: string
}

export interface DebtTransfer {
  from: string
  to: string
  amount: number
}
