import { z } from 'zod'
import { VALIDATION_MESSAGES } from '@/constants'

export const companySchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  address: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  city: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  state: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  zipCode: z.string().optional(),
  country: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  phone: z.string().optional(),
  email: z.string().email(VALIDATION_MESSAGES.INVALID_EMAIL),
  website: z.string().optional(),
  taxId: z.string().optional(),
  logo: z.string().optional(), // Base64 data URL from file upload
})

export const clientSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  email: z.string().email(VALIDATION_MESSAGES.INVALID_EMAIL),
  phone: z.string().optional(),
  address: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  city: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  state: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  zipCode: z.string().optional(),
  country: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
})

export const productSchema = z.object({
  name: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  description: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  price: z.number().min(0, VALIDATION_MESSAGES.POSITIVE_NUMBER).optional(),
  sku: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  category: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
})

export const invoiceItemSchema = z.object({
  productId: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  productName: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  description: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  quantity: z.number().min(1, VALIDATION_MESSAGES.MIN_QUANTITY),
  unitPrice: z.number().min(0, VALIDATION_MESSAGES.POSITIVE_NUMBER),
  total: z.number(),
})

export const invoiceSchema = z.object({
  clientId: z.string().min(1, VALIDATION_MESSAGES.REQUIRED_FIELD),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  taxRate: z.number().min(0).max(100, VALIDATION_MESSAGES.MAX_PERCENTAGE),
  discountRate: z.number().min(0).max(100, VALIDATION_MESSAGES.MAX_PERCENTAGE),
  notes: z.string().optional(),
})

export type CompanyFormData = z.infer<typeof companySchema>
export type ClientFormData = z.infer<typeof clientSchema>
export type ProductFormData = z.infer<typeof productSchema>
export type InvoiceFormData = z.infer<typeof invoiceSchema> 