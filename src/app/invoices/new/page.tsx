"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DatePicker } from "@/components/ui/date-picker"
import { Combobox } from "@/components/ui/combobox"
import { Separator } from "@/components/ui/separator"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import { Plus, Trash2, Save, Eye } from "lucide-react"
import { addDays, format } from "date-fns"
import type { Invoice, InvoiceItem } from "@/types"
import { toast } from "sonner"

const invoiceItemSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  productName: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be positive"),
  total: z.number(),
})

const invoiceSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(invoiceItemSchema).min(1, "At least one item is required"),
  taxRate: z.number().min(0).max(100),
  discountRate: z.number().min(0).max(100),
  notes: z.string().optional(),
})

type InvoiceFormData = z.infer<typeof invoiceSchema>

export default function NewInvoicePage() {
  const router = useRouter()
  const { clients, products, addInvoice, invoices } = useStore()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      clientId: "",
      issueDate: new Date(),
      dueDate: addDays(new Date(), 30),
      items: [
        {
          productId: "",
          productName: "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          total: 0,
        }
      ],
      taxRate: 0,
      discountRate: 0,
      notes: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  const watchedItems = form.watch("items") || []
  const watchedTaxRate = form.watch("taxRate") || 0
  const watchedDiscountRate = form.watch("discountRate") || 0

  // Calculate totals
  const subtotal = watchedItems.reduce((sum, item) => sum + (item?.total || 0), 0)
  const discountAmount = subtotal * (watchedDiscountRate / 100)
  const taxableAmount = subtotal - discountAmount
  const taxAmount = taxableAmount * (watchedTaxRate / 100)
  const total = taxableAmount + taxAmount

  // Update item totals when quantity or unit price changes
  useEffect(() => {
    if (watchedItems && Array.isArray(watchedItems)) {
      watchedItems.forEach((item, index) => {
        if (item && typeof item.quantity === 'number' && typeof item.unitPrice === 'number') {
          const newTotal = item.quantity * item.unitPrice
          if (newTotal !== item.total) {
            form.setValue(`items.${index}.total`, newTotal)
          }
        }
      })
    }
  }, [watchedItems, form])

  const handleProductSelect = (productId: string, index: number) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      const unitPrice = product.price || 0
      const quantity = form.getValues(`items.${index}.quantity`) || 1
      form.setValue(`items.${index}.productId`, productId)
      form.setValue(`items.${index}.productName`, product.name)
      form.setValue(`items.${index}.description`, product.description)
      form.setValue(`items.${index}.unitPrice`, unitPrice)
      form.setValue(`items.${index}.total`, unitPrice * quantity)
    }
  }

  const addItem = () => {
    append({
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    })
  }

  const removeItem = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    const count = invoices.length + 1
    return `INV-${year}${month}-${String(count).padStart(4, '0')}`
  }

  const onSubmit = async (data: InvoiceFormData) => {
    setIsLoading(true)
    try {
      const selectedClient = clients.find(c => c.id === data.clientId)
      if (!selectedClient) {
        throw new Error("Client not found")
      }

      const newInvoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber: generateInvoiceNumber(),
        clientId: data.clientId,
        clientName: selectedClient.name,
        issueDate: data.issueDate,
        dueDate: data.dueDate,
        items: data.items,
        subtotal,
        taxRate: data.taxRate,
        taxAmount,
        discountRate: data.discountRate,
        discountAmount,
        total,
        status: 'draft',
        notes: data.notes,
      }

      addInvoice(newInvoice)
      toast.success("Invoice created successfully!")
      router.push(`/invoices/${newInvoice.id}`)
    } catch (error) {
      toast.error("Failed to create invoice")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedClient = clients.find(c => c.id === form.watch("clientId"))

  // Prepare client options for combobox
  const clientOptions = clients.map(client => ({
    value: client.id,
    label: `${client.name} - ${client.email}`
  }))

  // Prepare product options for combobox
  const productOptions = products.map(product => ({
    value: product.id,
    label: `${product.name} - ${product.price !== undefined ? `$${product.price.toFixed(2)}` : 'Variable pricing'}`
  }))

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
        <p className="text-muted-foreground">
          Build your invoice by selecting a client and adding products or services.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Invoice Form */}
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
              <CardDescription>
                Enter the basic information for your invoice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="clientId" className="text-sm font-medium">Client</Label>
                  <div className="mt-2">
                    <Combobox
                      options={clientOptions}
                      value={form.watch("clientId")}
                      onValueChange={(value) => form.setValue("clientId", value)}
                      placeholder="Search and select a client..."
                      searchPlaceholder="Search clients..."
                      emptyText="No clients found."
                    />
                  </div>
                  {form.formState.errors.clientId && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.clientId.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Issue Date</Label>
                    <div className="mt-2">
                      <DatePicker
                        date={form.watch("issueDate")}
                        onDateChange={(date) => form.setValue("issueDate", date || new Date())}
                        placeholder="Select issue date"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Due Date</Label>
                    <div className="mt-2">
                      <DatePicker
                        date={form.watch("dueDate")}
                        onDateChange={(date) => form.setValue("dueDate", date || addDays(new Date(), 30))}
                        placeholder="Select due date"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Items */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invoice Items</CardTitle>
                  <CardDescription>
                    Add products or services to your invoice.
                  </CardDescription>
                </div>
                <Button type="button" onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {fields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Product/Service</Label>
                        <div className="mt-2">
                          <Combobox
                            options={productOptions}
                            value={watchedItems[index]?.productId || ""}
                            onValueChange={(value) => handleProductSelect(value, index)}
                            placeholder="Search and select a product..."
                            searchPlaceholder="Search products..."
                            emptyText="No products found."
                          />
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <div className="mt-2">
                          <Textarea 
                            placeholder="Item description" 
                            {...form.register(`items.${index}.description`)}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Quantity</Label>
                        <div className="mt-2">
                          <Input
                            type="number"
                            min="1"
                            {...form.register(`items.${index}.quantity`, { 
                              valueAsNumber: true,
                              onChange: (e) => {
                                const quantity = parseInt(e.target.value) || 1
                                const unitPrice = form.getValues(`items.${index}.unitPrice`) || 0
                                form.setValue(`items.${index}.total`, quantity * unitPrice)
                              }
                            })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Unit Price ($)</Label>
                        <div className="mt-2">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            {...form.register(`items.${index}.unitPrice`, { 
                              valueAsNumber: true,
                              onChange: (e) => {
                                const unitPrice = parseFloat(e.target.value) || 0
                                const quantity = form.getValues(`items.${index}.quantity`) || 1
                                form.setValue(`items.${index}.total`, quantity * unitPrice)
                              }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        Total: ${(watchedItems[index]?.total || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tax and Discount */}
          <Card>
            <CardHeader>
              <CardTitle>Tax & Discount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Discount (%)</Label>
                  <div className="mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...form.register("discountRate", { valueAsNumber: true })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Tax Rate (%)</Label>
                  <div className="mt-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      {...form.register("taxRate", { valueAsNumber: true })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Additional notes or terms..."
                className="min-h-[100px]"
                {...form.register("notes")}
              />
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Creating Invoice..." : "Create Invoice"}
          </Button>
        </div>

        {/* Invoice Preview */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Preview</CardTitle>
              <CardDescription>
                Preview of your invoice before creating it.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Client Info */}
                {selectedClient && (
                  <div>
                    <h3 className="font-semibold mb-3">Bill To:</h3>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{selectedClient.name}</p>
                      <p className="text-muted-foreground">{selectedClient.email}</p>
                      <p className="text-muted-foreground">{selectedClient.address}</p>
                      <p className="text-muted-foreground">
                        {selectedClient.city}, {selectedClient.state} {selectedClient.zipCode}
                      </p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Issue Date:</span>
                    <span className="ml-2">{format(form.watch("issueDate"), 'MMM dd, yyyy')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <span className="ml-2">{format(form.watch("dueDate"), 'MMM dd, yyyy')}</span>
                  </div>
                </div>

                <Separator />

                {/* Items */}
                {watchedItems.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Items:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {watchedItems.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{item?.productName || "Untitled"}</p>
                                <p className="text-sm text-muted-foreground">{item?.description}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item?.quantity || 0}</TableCell>
                            <TableCell className="text-right">${(item?.unitPrice || 0).toFixed(2)}</TableCell>
                            <TableCell className="text-right">${(item?.total || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <Separator />

                {/* Totals */}
                <div className="flex justify-end">
                  <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {watchedDiscountRate > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Discount ({watchedDiscountRate}%):</span>
                        <span>-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {watchedTaxRate > 0 && (
                      <div className="flex justify-between text-muted-foreground">
                        <span>Tax ({watchedTaxRate}%):</span>
                        <span>${taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </form>
    </div>
  )
} 