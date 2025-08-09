export const generateId = (): string => {
  return crypto.randomUUID()
}

export const generateInvoiceNumber = (existingInvoicesCount: number): string => {
  const year = new Date().getFullYear()
  const month = String(new Date().getMonth() + 1).padStart(2, '0')
  const count = existingInvoicesCount + 1
  return `INV-${year}${month}-${String(count).padStart(4, '0')}`
}

export const generateSKU = (name: string, category: string): string => {
  const nameCode = name.substring(0, 3).toUpperCase()
  const categoryCode = category.substring(0, 3).toUpperCase()
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `${categoryCode}-${nameCode}-${randomNum}`
} 