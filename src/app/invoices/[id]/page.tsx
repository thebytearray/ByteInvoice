"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ArrowLeft, Download, Edit, Trash2, Send, Mail } from "lucide-react"
import { format } from "date-fns"
import { InvoicePDFDownload } from "@/components/InvoicePDF"
import { EmailService } from "@/services/emailService"
import { toast } from "sonner"
import Link from "next/link"

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { invoices, updateInvoice, deleteInvoice, company, clients, settings } = useStore()
  const [sendingEmail, setSendingEmail] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const invoiceId = params.id as string
  const invoice = invoices.find(inv => inv.id === invoiceId)
  const client = clients.find(c => c.id === invoice?.clientId)

  if (!invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invoice Not Found</h1>
          <p className="text-muted-foreground mb-4">
            The invoice you're looking for doesn't exist.
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800'
      case 'sent': return 'bg-blue-100 text-blue-800'
      case 'overdue': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusChange = (newStatus: string) => {
    updateInvoice(invoice.id, { status: newStatus as any })
  }

  const handleDelete = () => {
    deleteInvoice(invoice.id)
    setDeleteDialogOpen(false)
    router.push("/invoices")
  }

  const handleSendInvoice = async () => {
    if (!client) {
      toast.error("Client information not found")
      return
    }

    setSendingEmail(true)
    try {
      const template = settings.emailTemplates.find(t => t.type === 'invoice')
      const success = await EmailService.sendInvoice(invoice, client, company, settings.smtp, template)
      
      if (success) {
        await updateInvoice(invoice.id, { 
          emailSent: true,
          status: invoice.status === 'draft' ? 'sent' : invoice.status
        })
        toast.success("Invoice sent successfully!")
      } else {
        toast.error("Failed to send invoice. Please check your SMTP settings.")
      }
    } catch (error) {
      console.error("Error sending invoice:", error)
      toast.error("Failed to send invoice")
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <Button variant="ghost" asChild className="self-start">
              <Link href="/invoices">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Invoices
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Invoice {invoice.invoiceNumber}
              </h1>
              <p className="text-muted-foreground">
                Created on {format(new Date(invoice.issueDate), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
            <Select value={invoice.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            <Badge className={getStatusColor(invoice.status)}>
              {invoice.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mb-8 flex flex-col space-y-2 sm:flex-row sm:flex-wrap sm:gap-2 sm:space-y-0">
        {client && (
          <InvoicePDFDownload invoice={invoice} company={company} client={client} />
        )}
        
        <Button 
          variant="outline" 
          onClick={handleSendInvoice}
          disabled={sendingEmail || !client}
          className="w-full sm:w-auto"
        >
          <Mail className="h-4 w-4 mr-2" />
          {sendingEmail ? "Sending..." : "Send Invoice"}
        </Button>

        <Button variant="outline" asChild className="w-full sm:w-auto">
          <Link href={`/invoices/edit/${invoice.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Invoice
          </Link>
        </Button>
        
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogTrigger>
          <DialogContent className="mx-4 max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Invoice</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete invoice {invoice.invoiceNumber}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} className="w-full sm:w-auto">
                Delete Invoice
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Invoice Content */}
      <Card>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="flex flex-col space-y-6 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-start sm:space-y-0 sm:space-x-4">
                {company.logo && (
                  <img
                    src={company.logo}
                    alt="Company Logo"
                    className="w-12 h-12 sm:w-16 sm:h-16 object-contain self-start"
                  />
                )}
                {company.name && (
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold">{company.name}</h2>
                    {company.address && <p className="text-sm sm:text-base text-muted-foreground">{company.address}</p>}
                    {(company.city || company.state || company.zipCode) && (
                      <p className="text-sm sm:text-base text-muted-foreground">
                        {[company.city, company.state, company.zipCode].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {company.email && <p className="text-sm sm:text-base text-muted-foreground">{company.email}</p>}
                    {company.phone && <p className="text-sm sm:text-base text-muted-foreground">{company.phone}</p>}
                  </div>
                )}
              </div>
              <div className="text-left lg:text-right">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">INVOICE</h1>
                <p className="text-lg sm:text-xl text-muted-foreground">#{invoice.invoiceNumber}</p>
              </div>
            </div>

            <Separator />

            {/* Invoice Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Bill To */}
              {client && (
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Bill To:</h3>
                  <div className="space-y-1">
                    <p className="font-medium">{client.name}</p>
                    <p className="text-sm sm:text-base text-muted-foreground">{client.address}</p>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {client.city}, {client.state} {client.zipCode}
                    </p>
                    <p className="text-sm sm:text-base text-muted-foreground">{client.email}</p>
                    {client.phone && <p className="text-sm sm:text-base text-muted-foreground">{client.phone}</p>}
                  </div>
                </div>
              )}

              {/* Invoice Info */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-3">Invoice Details:</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm sm:text-base text-muted-foreground">Issue Date:</span>
                    <span className="text-sm sm:text-base">{format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm sm:text-base text-muted-foreground">Due Date:</span>
                    <span className="text-sm sm:text-base">{format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base text-muted-foreground">Status:</span>
                    <Badge className={getStatusColor(invoice.status)}>
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Items Table */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold mb-4">Items:</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Description</TableHead>
                      <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                      <TableHead className="text-right min-w-[100px]">Unit Price</TableHead>
                      <TableHead className="text-right min-w-[100px]">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm sm:text-base">{item.productName}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">{item.description}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-sm sm:text-base">{item.quantity}</TableCell>
                        <TableCell className="text-right text-sm sm:text-base">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-sm sm:text-base font-medium">${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span>Subtotal:</span>
                  <span>${invoice.subtotal.toFixed(2)}</span>
                </div>
                {invoice.discountRate > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                    <span>Discount ({invoice.discountRate}%):</span>
                    <span>-${invoice.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                {invoice.taxRate > 0 && (
                  <div className="flex justify-between text-sm sm:text-base text-muted-foreground">
                    <span>Tax ({invoice.taxRate}%):</span>
                    <span>${invoice.taxAmount.toFixed(2)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg sm:text-xl font-bold">
                  <span>Total:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            {invoice.notes && (
              <>
                <Separator />
                <div>
                  <h3 className="text-base sm:text-lg font-semibold mb-3">Notes:</h3>
                  <p className="text-sm sm:text-base text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p>
                </div>
              </>
            )}

            {/* Footer */}
            <Separator />
            <div className="text-center text-sm text-muted-foreground">
              <p>Thank you for your business!</p>
              {company.website && (
                <p className="mt-1">{company.website}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 