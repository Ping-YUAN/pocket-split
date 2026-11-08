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
  currency: CurrencyCode
  preferredPayerId: string
}

export type CurrencyCode = 'EUR' | 'USD' | 'GBP' | 'JPY' | 'CNY' | 'CHF' | 'CAD' | 'AUD' | 'NZD'

export interface DebtTransfer {
  from: string
  to: string
  amount: number
}
