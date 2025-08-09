import type { AppData } from '@/types'
import { APP_VERSION } from '@/constants'

export class DataService {
  static exportData(data: {
    company: any
    clients: any[]
    products: any[]
    invoices: any[]
  }): string {
    const exportData: AppData = {
      ...data,
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
    }

    return JSON.stringify(exportData, null, 2)
  }

  static downloadData(data: string, filename?: string): void {
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename || `byte-invoice-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  static async importData(file: File): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as AppData
          
          // Validate the imported data structure
          if (!this.validateImportData(data)) {
            throw new Error('Invalid data format')
          }
          
          // Convert date strings back to Date objects
          const processedData = this.processImportedData(data)
          resolve(processedData)
        } catch (error) {
          reject(new Error('Failed to parse import file: ' + (error as Error).message))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsText(file)
    })
  }

  private static validateImportData(data: any): data is AppData {
    return (
      data &&
      typeof data === 'object' &&
      data.company &&
      Array.isArray(data.clients) &&
      Array.isArray(data.products) &&
      Array.isArray(data.invoices) &&
      data.version &&
      data.exportDate
    )
  }

  private static processImportedData(data: AppData): AppData {
    // Convert date strings back to Date objects for invoices
    const processedInvoices = data.invoices.map(invoice => ({
      ...invoice,
      issueDate: new Date(invoice.issueDate),
      dueDate: new Date(invoice.dueDate),
    }))

    return {
      ...data,
      invoices: processedInvoices,
    }
  }

  static createBackup(data: {
    company: any
    clients: any[]
    products: any[]
    invoices: any[]
  }): void {
    const exportedData = this.exportData(data)
    this.downloadData(exportedData)
  }
} 