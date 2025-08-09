import { useMemo } from 'react'
import type { Invoice, Client, Product, DashboardStats } from '@/types'
import { INVOICE_STATUS } from '@/constants'


export const isInvoiceOverdue = (invoice: Invoice): boolean => {
  if (invoice.status === 'paid' || invoice.status === 'overdue') {
    return false 
  }
  
  const today = new Date()
  const dueDate = new Date(invoice.dueDate)
  

  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  
  return dueDate < today
}


export const getInvoicesWithUpdatedStatus = (invoices: Invoice[]): Invoice[] => {
  return invoices.map(invoice => {
    if (isInvoiceOverdue(invoice) && invoice.status === 'sent') {
      return { ...invoice, status: 'overdue' as const }
    }
    return invoice
  })
}

export const useDashboardStats = (
  invoices: Invoice[],
  clients: Client[],
  products: Product[]
): DashboardStats => {
  return useMemo(() => {
    const updatedInvoices = getInvoicesWithUpdatedStatus(invoices)
    
    const totalRevenue = updatedInvoices
      .filter(invoice => invoice.status === INVOICE_STATUS.PAID)
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0)

    const pendingAmount = updatedInvoices
      .filter(invoice => invoice.status === INVOICE_STATUS.SENT)
      .reduce((sum, invoice) => sum + (invoice.total || 0), 0)

    const paidInvoices = updatedInvoices.filter(invoice => invoice.status === INVOICE_STATUS.PAID).length
    const sentInvoices = updatedInvoices.filter(invoice => invoice.status === INVOICE_STATUS.SENT).length

    return {
      totalRevenue,
      pendingAmount,
      totalClients: clients.length,
      totalProducts: products.length,
      totalInvoices: updatedInvoices.length,
      paidInvoices,
      sentInvoices,
    }
  }, [invoices, clients, products])
} 