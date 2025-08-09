import Dexie, { Table } from 'dexie'
import type { Company, Client, Product, Invoice, AppSettings } from '@/types'

export interface DBCompany extends Company {
  id?: number
}

export interface DBClient extends Client {}

export interface DBProduct extends Product {}

export interface DBInvoice extends Invoice {}

export interface DBSettings extends AppSettings {
  id?: number
}

export class ByteInvoiceDB extends Dexie {
  company!: Table<DBCompany>
  clients!: Table<DBClient>
  products!: Table<DBProduct>
  invoices!: Table<DBInvoice>
  settings!: Table<DBSettings>

  constructor() {
    super('ByteInvoiceDB')
    this.version(1).stores({
      company: '++id, name, email',
      clients: 'id, name, email, city, country',
      products: 'id, name, sku, category, price',
      invoices: 'id, invoiceNumber, clientId, clientName, status, issueDate, dueDate, total',
      settings: '++id'
    })
  }
}

export const db = new ByteInvoiceDB()

export class IndexedDBService {

  static async getCompany(): Promise<Company | null> {
    const company = await db.company.orderBy('id').last()
    return company || null
  }

  static async setCompany(company: Company): Promise<void> {
    await db.company.clear()
    await db.company.add(company)
  }


  static async getClients(): Promise<Client[]> {
    return await db.clients.toArray()
  }

  static async addClient(client: Client): Promise<void> {
    await db.clients.add(client)
  }

  static async updateClient(id: string, updates: Partial<Client>): Promise<void> {
    await db.clients.update(id, updates)
  }

  static async deleteClient(id: string): Promise<void> {
    await db.clients.delete(id)
  }


  static async getProducts(): Promise<Product[]> {
    return await db.products.toArray()
  }

  static async addProduct(product: Product): Promise<void> {
    await db.products.add(product)
  }

  static async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    await db.products.update(id, updates)
  }

  static async deleteProduct(id: string): Promise<void> {
    await db.products.delete(id)
  }

  static async getInvoices(): Promise<Invoice[]> {
    const invoices = await db.invoices.toArray()
    return invoices.map(invoice => ({
      ...invoice,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
      lastReminderSent: invoice.lastReminderSent ? new Date(invoice.lastReminderSent) : undefined
    }))
  }

  static async addInvoice(invoice: Invoice): Promise<void> {
    await db.invoices.add(invoice)
  }

  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<void> {
    await db.invoices.update(id, updates)
  }

  static async deleteInvoice(id: string): Promise<void> {
    await db.invoices.delete(id)
  }


  static async getSettings(): Promise<AppSettings | null> {
    const settings = await db.settings.orderBy('id').last()
    return settings || null
  }

  static async setSettings(settings: AppSettings): Promise<void> {
    await db.settings.clear()
    await db.settings.add(settings)
  }


  static async exportData() {
    const [company, clients, products, invoices, settings] = await Promise.all([
      this.getCompany(),
      this.getClients(),
      this.getProducts(),
      this.getInvoices(),
      this.getSettings()
    ])

    const data = {
      company: company || {
        name: '',
        address: '',
        city: '',
        state: '',
        country: '',
        email: ''
      },
      clients,
      products,
      invoices,
      settings: settings || {
        smtp: {
          host: '',
          port: 587,
          secure: false,
          username: '',
          password: '',
          fromName: '',
          fromEmail: ''
        },
        emailTemplates: []
      },
      version: '1.0.0',
      exportDate: new Date().toISOString()
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `byte-invoice-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  static async importData(data: any): Promise<void> {
    await db.transaction('rw', [db.company, db.clients, db.products, db.invoices, db.settings], async () => {
      await Promise.all([
        db.company.clear(),
        db.clients.clear(),
        db.products.clear(),
        db.invoices.clear(),
        db.settings.clear()
      ])

      if (data.company) await db.company.add(data.company)
      if (data.clients?.length) await db.clients.bulkAdd(data.clients)
      if (data.products?.length) await db.products.bulkAdd(data.products)
      if (data.invoices?.length) await db.invoices.bulkAdd(data.invoices)
      if (data.settings) await db.settings.add(data.settings)
    })
  }

  static async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.company, db.clients, db.products, db.invoices, db.settings], async () => {
      await Promise.all([
        db.company.clear(),
        db.clients.clear(),
        db.products.clear(),
        db.invoices.clear(),
        db.settings.clear()
      ])
    })
  }
} 