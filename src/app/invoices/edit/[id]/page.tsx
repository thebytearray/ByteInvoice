"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
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
import { ArrowLeft, Plus, Trash2, Save } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import type { InvoiceItem } from "@/types"

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const { invoices, updateInvoice, clients, products } = useStore()
  
  const invoiceId = params.id as string
  const invoice = invoices.find(inv => inv.id === invoiceId)
  
  const [clientId, setClientId] = useState("")
  const [issueDate, setIssueDate] = useState<Date>(new Date())
  const [dueDate, setDueDate] = useState<Date>(new Date())
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [taxRate, setTaxRate] = useState(0)
  const [discountRate, setDiscountRate] = useState(0)
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<'draft' | 'sent' | 'paid' | 'overdue'>('draft')

  useEffect(() => {
    if (invoice) {
      setClientId(invoice.clientId)
      setIssueDate(new Date(invoice.issueDate))
      setDueDate(new Date(invoice.dueDate))
      setItems(invoice.items)
      setTaxRate(invoice.taxRate)
      setDiscountRate(invoice.discountRate)
      setNotes(invoice.notes || "")
      setStatus(invoice.status)
    }
  }, [invoice])

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The invoice you're trying to edit doesn't exist.
          </p>
          <Button asChild>
            <Link href="/invoices">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoices
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      productId: "",
      productName: "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }
    setItems([...items, newItem])
  }

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    
    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice
    }
    
    if (field === 'productId') {
      const product = products.find(p => p.id === value)
      if (product) {
        updatedItems[index].productName = product.name
        updatedItems[index].description = product.description
        updatedItems[index].unitPrice = product.price || 0
        updatedItems[index].total = updatedItems[index].quantity * (product.price || 0)
      }
    }
    
    setItems(updatedItems)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = subtotal * (taxRate / 100)
    const discountAmount = subtotal * (discountRate / 100)
    const total = subtotal + taxAmount - discountAmount
    
    return { subtotal, taxAmount, discountAmount, total }
  }

  const handleSave = async () => {
    const { subtotal, taxAmount, discountAmount, total } = calculateTotals()
    const selectedClient = clients.find(c => c.id === clientId)
    
    if (!selectedClient) {
      toast.error("Please select a client")
      return
    }
    
    if (items.length === 0) {
      toast.error("Please add at least one item")
      return
    }

    try {
      await updateInvoice(invoice.id, {
        clientId,
        clientName: selectedClient.name,
        issueDate,
        dueDate,
        items,
        subtotal,
        taxRate,
        taxAmount,
        discountRate,
        discountAmount,
        total,
        status,
        notes,
      })

      toast.success("Invoice updated successfully!")
      router.push(`/invoices/${invoice.id}`)
    } catch (error) {
      toast.error("Failed to update invoice")
    }
  }

  const { subtotal, taxAmount, discountAmount, total } = calculateTotals()

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
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href={`/invoices/${invoice.id}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Invoice
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
            <p className="text-muted-foreground">
              Invoice #{invoice.invoiceNumber}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client and Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client">Client</Label>
                  <Combobox
                    options={clientOptions}
                    value={clientId}
                    onValueChange={setClientId}
                    placeholder="Search and select a client..."
                    searchPlaceholder="Search clients..."
                    emptyText="No clients found."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Issue Date</Label>
                  <DatePicker
                    date={issueDate}
                    onDateChange={(date) => date && setIssueDate(date)}
                    placeholder="Select issue date"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <DatePicker
                    date={dueDate}
                    onDateChange={(date) => date && setDueDate(date)}
                    placeholder="Select due date"
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Invoice Items</CardTitle>
                <Button onClick={addItem} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2 space-y-2">
                        <Label>Product/Service</Label>
                        <Combobox
                          options={productOptions}
                          value={item.productId}
                          onValueChange={(value) => updateItem(index, 'productId', value)}
                          placeholder="Search and select a product..."
                          searchPlaceholder="Search products..."
                          emptyText="No products found."
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={item.description}
                          onChange={(e) => updateItem(index, 'description', e.target.value)}
                          placeholder="Item description"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Price ($)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        Total: ${item.total.toFixed(2)}
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
                <div className="space-y-2">
                  <Label>Discount (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={discountRate}
                    onChange={(e) => setDiscountRate(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tax Rate (%)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  />
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes or terms..."
                className="min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invoice Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount ({discountRate}%):</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({taxRate}%):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 