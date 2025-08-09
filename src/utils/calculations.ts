import type { InvoiceItem, Invoice } from '@/types'

export const calculateItemTotal = (quantity: number, unitPrice: number): number => {

  if (typeof quantity !== 'number' || typeof unitPrice !== 'number') {
    console.warn('Invalid input types for calculateItemTotal:', { quantity, unitPrice })
    return 0
  }
  
  if (isNaN(quantity) || isNaN(unitPrice) || quantity < 0 || unitPrice < 0) {
    console.warn('Invalid values for calculateItemTotal:', { quantity, unitPrice })
    return 0
  }
  
  const result = quantity * unitPrice
  return isNaN(result) ? 0 : Math.round(result * 100) / 100 // Round to 2 decimal places
}

export const calculateSubtotal = (items: InvoiceItem[]): number => {
  if (!Array.isArray(items) || items.length === 0) {
    return 0
  }
  
  const subtotal = items.reduce((sum, item) => {
    const itemTotal = calculateItemTotal(item.quantity || 0, item.unitPrice || 0)
    return sum + itemTotal
  }, 0)
  
  return isNaN(subtotal) ? 0 : Math.round(subtotal * 100) / 100
}

export const calculateDiscountAmount = (amount: number, discountRate: number): number => {
  // Validate inputs
  if (typeof amount !== 'number' || typeof discountRate !== 'number') {
    console.warn('Invalid input types for calculateDiscountAmount:', { amount, discountRate })
    return 0
  }
  
  if (isNaN(amount) || isNaN(discountRate) || amount < 0 || discountRate < 0 || discountRate > 100) {
    console.warn('Invalid values for calculateDiscountAmount:', { amount, discountRate })
    return 0
  }
  
  const result = (amount * discountRate) / 100
  return isNaN(result) ? 0 : Math.round(result * 100) / 100
}

export const calculateTaxAmount = (amount: number, taxRate: number): number => {
  // Validate inputs
  if (typeof amount !== 'number' || typeof taxRate !== 'number') {
    console.warn('Invalid input types for calculateTaxAmount:', { amount, taxRate })
    return 0
  }
  
  if (isNaN(amount) || isNaN(taxRate) || amount < 0 || taxRate < 0 || taxRate > 100) {
    console.warn('Invalid values for calculateTaxAmount:', { amount, taxRate })
    return 0
  }
  
  const result = (amount * taxRate) / 100
  return isNaN(result) ? 0 : Math.round(result * 100) / 100
}

export const calculateInvoiceTotal = (
  subtotal: number,
  taxRate: number,
  discountRate: number
): {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
} => {
  // Validate inputs
  const validSubtotal = typeof subtotal === 'number' && !isNaN(subtotal) && subtotal >= 0 ? subtotal : 0
  const validTaxRate = typeof taxRate === 'number' && !isNaN(taxRate) && taxRate >= 0 && taxRate <= 100 ? taxRate : 0
  const validDiscountRate = typeof discountRate === 'number' && !isNaN(discountRate) && discountRate >= 0 && discountRate <= 100 ? discountRate : 0
  
  const discountAmount = calculateDiscountAmount(validSubtotal, validDiscountRate)
  const taxableAmount = Math.max(0, validSubtotal - discountAmount)
  const taxAmount = calculateTaxAmount(taxableAmount, validTaxRate)
  const total = Math.max(0, taxableAmount + taxAmount)

  return {
    subtotal: Math.round(validSubtotal * 100) / 100,
    discountAmount: Math.round(discountAmount * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
  }
}

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  // Validate input
  if (typeof amount !== 'number' || isNaN(amount)) {
    console.warn('Invalid amount for formatCurrency:', amount)
    return '$0.00'
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch (error) {
    console.warn('Error formatting currency:', error)
    return `$${amount.toFixed(2)}`
  }
}

export const formatPercentage = (rate: number): string => {
  return `${rate}%`
} 