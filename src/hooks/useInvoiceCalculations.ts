import { useMemo } from 'react'
import type { InvoiceItem } from '@/types'
import { calculateInvoiceTotal, calculateSubtotal } from '@/utils/calculations'

export const useInvoiceCalculations = (
  items: InvoiceItem[],
  taxRate: number,
  discountRate: number
) => {
  return useMemo(() => {
    const subtotal = calculateSubtotal(items)
    return calculateInvoiceTotal(subtotal, taxRate, discountRate)
  }, [items, taxRate, discountRate])
} 