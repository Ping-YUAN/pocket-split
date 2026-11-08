import type { CurrencyCode } from '../types'

export const CURRENCY_OPTIONS: { code: CurrencyCode; label: string }[] = [
  { code: 'EUR', label: 'Euro (€)' },
  { code: 'USD', label: 'US Dollar ($)' },
  { code: 'GBP', label: 'British Pound (£)' },
  { code: 'JPY', label: 'Japanese Yen (¥)' },
  { code: 'CNY', label: 'Chinese Yuan (¥)' },
  { code: 'CHF', label: 'Swiss Franc (CHF)' },
  { code: 'CAD', label: 'Canadian Dollar (CA$)' },
  { code: 'AUD', label: 'Australian Dollar (A$)' },
  { code: 'NZD', label: 'New Zealand Dollar (NZ$)' },
]

export const isCurrencyCode = (value: unknown): value is CurrencyCode =>
  CURRENCY_OPTIONS.some((option) => option.code === value)

export const createCurrencyFormatter = (currency: CurrencyCode) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const getCurrencySymbol = (currency: CurrencyCode) =>
  createCurrencyFormatter(currency).formatToParts(0).find((part) => part.type === 'currency')?.value ?? currency
