import { create } from 'zustand'
import type { Company, Client, Product, Invoice, AppData, AppSettings } from '@/types'
import { IndexedDBService } from '@/services/indexedDBService'

interface AppState {
  // Company
  company: Company
  setCompany: (company: Company) => void
  
  // Clients
  clients: Client[]
  addClient: (client: Client) => void
  updateClient: (id: string, client: Partial<Client>) => void
  deleteClient: (id: string) => void
  
  // Products
  products: Product[]
  addProduct: (product: Product) => void
  updateProduct: (id: string, product: Partial<Product>) => void
  deleteProduct: (id: string) => void
  
  // Invoices
  invoices: Invoice[]
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, invoice: Partial<Invoice>) => void
  deleteInvoice: (id: string) => void
  
  // Settings
  settings: AppSettings
  setSettings: (settings: AppSettings) => void
  
  // Current invoice being edited
  currentInvoice: Partial<Invoice> | null
  setCurrentInvoice: (invoice: Partial<Invoice> | null) => void

  // Data management
  exportData: () => void
  importData: (data: AppData) => void
  clearAllData: () => void
  
  // Initialize data from IndexedDB
  initializeData: () => Promise<void>
  
  // Loading state
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

const initialCompany: Company = {
  name: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  logo: '',
}

const initialSettings: AppSettings = {
  smtp: {
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromName: '',
    fromEmail: ''
  },
  emailTemplates: [
    {
      id: 'default-invoice',
      name: 'Default Invoice Email',
      subject: 'Invoice {{invoiceNumber}} from {{companyName}}',
      body: '<h2>Invoice {{invoiceNumber}}</h2>\n<p>Dear {{clientName}},</p>\n<p>Please find attached your invoice for the amount of ${{total}}.</p>\n<p>Due date: {{dueDate}}</p>\n<p>Thank you for your business!</p>\n<br>\n<p>Best regards,<br>{{companyName}}</p>',
      type: 'invoice'
    },
    {
      id: 'default-reminder',
      name: 'Default Payment Reminder',
      subject: 'Payment Reminder - Invoice {{invoiceNumber}}',
      body: '<h2>Payment Reminder</h2>\n<p>Dear {{clientName}},</p>\n<p>This is a friendly reminder that invoice {{invoiceNumber}} for ${{total}} is still pending payment.</p>\n<p>Due date: {{dueDate}}</p>\n<p>Please process the payment at your earliest convenience.</p>\n<br>\n<p>Best regards,<br>{{companyName}}</p>',
      type: 'reminder'
    },
    {
      id: 'default-overdue',
      name: 'Default Overdue Notice',
      subject: 'OVERDUE: Invoice {{invoiceNumber}}',
      body: '<h2>Overdue Payment Notice</h2>\n<p>Dear {{clientName}},</p>\n<p><strong>URGENT:</strong> Invoice {{invoiceNumber}} for ${{total}} is now overdue.</p>\n<p>Original due date: {{dueDate}}</p>\n<p>Please contact us immediately to resolve this matter.</p>\n<br>\n<p>Best regards,<br>{{companyName}}</p>',
      type: 'overdue'
    }
  ]
}

export const useStore = create<AppState>((set, get) => ({
  // Company initial state
  company: initialCompany,
  setCompany: async (company) => {
    set({ company })
    await IndexedDBService.setCompany(company)
  },
  
  // Clients
  clients: [],
  addClient: async (client) => {
    set((state) => ({ clients: [...state.clients, client] }))
    await IndexedDBService.addClient(client)
  },
  updateClient: async (id, updatedClient) => {
    set((state) => ({
      clients: state.clients.map(client => 
        client.id === id ? { ...client, ...updatedClient } : client
      )
    }))
    await IndexedDBService.updateClient(id, updatedClient)
  },
  deleteClient: async (id) => {
    set((state) => ({
      clients: state.clients.filter(client => client.id !== id)
    }))
    await IndexedDBService.deleteClient(id)
  },
  
  // Products
  products: [],
  addProduct: async (product) => {
    set((state) => ({ products: [...state.products, product] }))
    await IndexedDBService.addProduct(product)
  },
  updateProduct: async (id, updatedProduct) => {
    set((state) => ({
      products: state.products.map(product => 
        product.id === id ? { ...product, ...updatedProduct } : product
      )
    }))
    await IndexedDBService.updateProduct(id, updatedProduct)
  },
  deleteProduct: async (id) => {
    set((state) => ({
      products: state.products.filter(product => product.id !== id)
    }))
    await IndexedDBService.deleteProduct(id)
  },
  
  // Invoices
  invoices: [],
  addInvoice: async (invoice) => {
    set((state) => ({ invoices: [...state.invoices, invoice] }))
    await IndexedDBService.addInvoice(invoice)
  },
  updateInvoice: async (id, updatedInvoice) => {
    set((state) => ({
      invoices: state.invoices.map(invoice => 
        invoice.id === id ? { ...invoice, ...updatedInvoice } : invoice
      )
    }))
    await IndexedDBService.updateInvoice(id, updatedInvoice)
  },
  deleteInvoice: async (id) => {
    set((state) => ({
      invoices: state.invoices.filter(invoice => invoice.id !== id)
    }))
    await IndexedDBService.deleteInvoice(id)
  },
  
  // Settings
  settings: initialSettings,
  setSettings: async (settings) => {
    set({ settings })
    await IndexedDBService.setSettings(settings)
  },
  
  // Current invoice
  currentInvoice: null,
  setCurrentInvoice: (invoice) => set({ currentInvoice: invoice }),

  // Loading state
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading }),

  // Initialize data from IndexedDB
  initializeData: async () => {
    set({ isLoading: true })
    try {
      const [company, clients, products, invoices, settings] = await Promise.all([
        IndexedDBService.getCompany(),
        IndexedDBService.getClients(),
        IndexedDBService.getProducts(),
        IndexedDBService.getInvoices(),
        IndexedDBService.getSettings()
      ])

      set({
        company: company || initialCompany,
        clients: clients || [],
        products: products || [],
        invoices: invoices || [],
        settings: settings || initialSettings,
        isLoading: false
      })
    } catch (error) {
      console.error('Error initializing data:', error)
      set({ isLoading: false })
    }
  },

  // Data management
  exportData: async () => {
    await IndexedDBService.exportData()
  },

  importData: async (data: AppData) => {
    set({ isLoading: true })
    try {
      await IndexedDBService.importData(data)
      // Reload data after import
      await get().initializeData()
    } catch (error) {
      console.error('Error importing data:', error)
      set({ isLoading: false })
    }
  },

  clearAllData: async () => {
    set({ isLoading: true })
    try {
      await IndexedDBService.clearAllData()
      set({
        company: initialCompany,
        clients: [],
        products: [],
        invoices: [],
        settings: initialSettings,
        currentInvoice: null,
        isLoading: false
      })
    } catch (error) {
      console.error('Error clearing data:', error)
      set({ isLoading: false })
    }
  },
})) 