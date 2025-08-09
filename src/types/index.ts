export interface Company {
  name: string
  address: string
  city: string
  state: string
  zipCode?: string
  country: string
  phone?: string
  email: string
  website?: string
  taxId?: string
  logo?: string
}

export interface SMTPSettings {
  host: string
  port: number
  secure: boolean
  username: string
  password: string
  fromName: string
  fromEmail: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'invoice' | 'reminder' | 'overdue'
}

export interface AppSettings {
  smtp: SMTPSettings
  emailTemplates: EmailTemplate[]
}

export interface Client {
  id: string
  name: string
  email: string
  phone?: string
  address: string
  city: string
  state: string
  zipCode?: string
  country: string
  advancePayment?: number
}

export interface Product {
  id: string
  name: string
  description: string
  price?: number
  sku: string
  category: string
}

export interface InvoiceItem {
  productId: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Invoice {
  id: string
  invoiceNumber: string
  clientId: string
  clientName: string
  issueDate: Date
  dueDate: Date
  items: InvoiceItem[]
  subtotal: number
  taxRate: number
  taxAmount: number
  discountRate: number
  discountAmount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  notes?: string
  emailSent?: boolean
  lastReminderSent?: Date
}

export interface AppData {
  company: Company
  clients: Client[]
  products: Product[]
  invoices: Invoice[]
  settings: AppSettings
  version: string
  exportDate: string
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export interface DashboardStats {
  totalRevenue: number
  pendingAmount: number
  totalClients: number
  totalProducts: number
  totalInvoices: number
  paidInvoices: number
  sentInvoices: number
}

export interface RevenueData {
  month: string
  revenue: number
  invoices: number
} 