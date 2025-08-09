import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import React from 'react'
import type { Invoice, Client, Company } from '@/types'

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  companySection: {
    flexDirection: 'row',
    flex: 1,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  companyInfo: {
    flex: 1,
  },
  invoiceInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    marginBottom: 3,
  },
  billTo: {
    marginBottom: 20,
  },
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    padding: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCol1: {
    flex: 3,
  },
  tableCol2: {
    flex: 1,
    textAlign: 'center',
  },
  tableCol3: {
    flex: 1,
    textAlign: 'right',
  },
  tableCol4: {
    flex: 1,
    textAlign: 'right',
  },
  totals: {
    alignItems: 'flex-end',
    marginTop: 20,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontWeight: 'bold',
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: 'bold',
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
  },
  notes: {
    marginTop: 30,
  },
})

interface InvoicePDFProps {
  invoice: Invoice
  company: Company
  client: Client
}

const InvoicePDFDocument = ({ invoice, company, client }: InvoicePDFProps) => {
  const subtotal = invoice.subtotal
  const taxAmount = invoice.taxAmount
  const total = invoice.total - (client.advancePayment || 0)

  return React.createElement(Document, {},
    React.createElement(Page, { size: "A4", style: styles.page },
      // Header
      React.createElement(View, { style: styles.header },
        React.createElement(View, { style: styles.companySection },
          company.logo && React.createElement(Image, { style: styles.logo, src: company.logo }),
          React.createElement(View, { style: styles.companyInfo },
            React.createElement(Text, { style: styles.title }, company.name),
            React.createElement(Text, { style: styles.text }, company.address || ''),
            React.createElement(Text, { style: styles.text }, `${company.city || ''}, ${company.state || ''} ${company.zipCode || ''}`),
            React.createElement(Text, { style: styles.text }, company.country || ''),
            company.phone && React.createElement(Text, { style: styles.text }, `Phone: ${company.phone}`),
            React.createElement(Text, { style: styles.text }, `Email: ${company.email}`),
            company.website && React.createElement(Text, { style: styles.text }, `Website: ${company.website}`),
            company.taxId && React.createElement(Text, { style: styles.text }, `Tax ID: ${company.taxId}`)
          )
        ),
        React.createElement(View, { style: styles.invoiceInfo },
          React.createElement(Text, { style: styles.title }, "INVOICE"),
          React.createElement(Text, { style: styles.text }, `Invoice #: ${invoice.invoiceNumber}`),
          React.createElement(Text, { style: styles.text }, `Date: ${new Date(invoice.issueDate).toLocaleDateString()}`),
          React.createElement(Text, { style: styles.text }, `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`),
          React.createElement(Text, { style: styles.text }, `Status: ${invoice.status}`)
        )
      ),

      // Bill To
      React.createElement(View, { style: styles.billTo },
        React.createElement(Text, { style: styles.subtitle }, "Bill To:"),
        React.createElement(Text, { style: styles.text }, client.name),
        React.createElement(Text, { style: styles.text }, client.address || ''),
        React.createElement(Text, { style: styles.text }, `${client.city || ''}, ${client.state || ''} ${client.zipCode || ''}`),
        React.createElement(Text, { style: styles.text }, client.country || ''),
        React.createElement(Text, { style: styles.text }, `Email: ${client.email}`),
        client.phone && React.createElement(Text, { style: styles.text }, `Phone: ${client.phone}`)
      ),

      // Items Table
      React.createElement(View, { style: styles.table },
        React.createElement(View, { style: styles.tableHeader },
          React.createElement(Text, { style: styles.tableCol1 }, "Description"),
          React.createElement(Text, { style: styles.tableCol2 }, "Qty"),
          React.createElement(Text, { style: styles.tableCol3 }, "Rate"),
          React.createElement(Text, { style: styles.tableCol4 }, "Amount")
        ),
        ...invoice.items.map((item: any, index: number) =>
          React.createElement(View, { key: index, style: styles.tableRow },
            React.createElement(Text, { style: styles.tableCol1 }, item.description),
            React.createElement(Text, { style: styles.tableCol2 }, item.quantity.toString()),
            React.createElement(Text, { style: styles.tableCol3 }, `$${item.unitPrice.toFixed(2)}`),
            React.createElement(Text, { style: styles.tableCol4 }, `$${item.total.toFixed(2)}`)
          )
        )
      ),

      // Totals
      React.createElement(View, { style: styles.totals },
        React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, {}, "Subtotal:"),
          React.createElement(Text, {}, `$${invoice.subtotal.toFixed(2)}`)
        ),
        invoice.taxRate > 0 && React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, {}, `Tax (${invoice.taxRate}%):`),
          React.createElement(Text, {}, `$${invoice.taxAmount.toFixed(2)}`)
        ),
        invoice.discountAmount > 0 && React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, {}, "Discount:"),
          React.createElement(Text, {}, `-$${invoice.discountAmount.toFixed(2)}`)
        ),
        (client.advancePayment && client.advancePayment > 0) && React.createElement(View, { style: styles.totalRow },
          React.createElement(Text, {}, "Advance Payment:"),
          React.createElement(Text, {}, `-$${client.advancePayment.toFixed(2)}`)
        ),
        React.createElement(View, { style: [styles.totalRow, styles.grandTotal] },
          React.createElement(Text, { style: styles.totalLabel }, "Total:"),
          React.createElement(Text, { style: styles.totalLabel }, `$${(invoice.total - (client.advancePayment || 0)).toFixed(2)}`)
        )
      ),

      // Notes
      invoice.notes && React.createElement(View, { style: styles.notes },
        React.createElement(Text, { style: styles.subtitle }, "Notes:"),
        React.createElement(Text, { style: styles.text }, invoice.notes)
      )
    )
  )
}

export async function POST(request: NextRequest) {
  try {
    const { invoice, client, company } = await request.json()

    console.log('=== PDF Generation API Debug ===')
    console.log('Received data:', { 
      hasInvoice: !!invoice, 
      hasClient: !!client, 
      hasCompany: !!company,
      invoiceId: invoice?.id,
      clientName: client?.name,
      companyName: company?.name
    })

    // Validate required data
    if (!invoice || !client || !company) {
      console.error('Missing required data:', { invoice: !!invoice, client: !!client, company: !!company })
      return NextResponse.json(
        { error: 'Missing required data: invoice, client, or company' },
        { status: 400 }
      )
    }

    // Validate invoice data
    if (!invoice.items || !Array.isArray(invoice.items) || invoice.items.length === 0) {
      console.error('Invalid invoice items:', invoice.items)
      return NextResponse.json(
        { error: 'Invoice must have at least one item' },
        { status: 400 }
      )
    }

    // Validate client data
    if (!client.name || !client.email) {
      console.error('Invalid client data:', { name: client.name, email: client.email })
      return NextResponse.json(
        { error: 'Client must have name and email' },
        { status: 400 }
      )
    }

    // Validate company data
    if (!company.name) {
      console.error('Invalid company data:', { name: company.name })
      return NextResponse.json(
        { error: 'Company must have a name' },
        { status: 400 }
      )
    }

    console.log('Validation passed, generating PDF...')

    // Generate PDF buffer directly
    const pdfBuffer = await renderToBuffer(
      React.createElement(Document, {},
        React.createElement(Page, { size: "A4", style: styles.page },
          // Header
          React.createElement(View, { style: styles.header },
            React.createElement(View, { style: styles.companySection },
              company.logo && React.createElement(Image, { style: styles.logo, src: company.logo }),
              React.createElement(View, { style: styles.companyInfo },
                React.createElement(Text, { style: styles.title }, company.name),
                React.createElement(Text, { style: styles.text }, company.address || ''),
                React.createElement(Text, { style: styles.text }, `${company.city || ''}, ${company.state || ''} ${company.zipCode || ''}`),
                React.createElement(Text, { style: styles.text }, company.country || ''),
                company.phone && React.createElement(Text, { style: styles.text }, `Phone: ${company.phone}`),
                React.createElement(Text, { style: styles.text }, `Email: ${company.email}`),
                company.website && React.createElement(Text, { style: styles.text }, `Website: ${company.website}`),
                company.taxId && React.createElement(Text, { style: styles.text }, `Tax ID: ${company.taxId}`)
              )
            ),
            React.createElement(View, { style: styles.invoiceInfo },
              React.createElement(Text, { style: styles.title }, "INVOICE"),
              React.createElement(Text, { style: styles.text }, `Invoice #: ${invoice.invoiceNumber}`),
              React.createElement(Text, { style: styles.text }, `Date: ${new Date(invoice.issueDate).toLocaleDateString()}`),
              React.createElement(Text, { style: styles.text }, `Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`),
              React.createElement(Text, { style: styles.text }, `Status: ${invoice.status}`)
            )
          ),

          // Bill To
          React.createElement(View, { style: styles.billTo },
            React.createElement(Text, { style: styles.subtitle }, "Bill To:"),
            React.createElement(Text, { style: styles.text }, client.name),
            React.createElement(Text, { style: styles.text }, client.address || ''),
            React.createElement(Text, { style: styles.text }, `${client.city || ''}, ${client.state || ''} ${client.zipCode || ''}`),
            React.createElement(Text, { style: styles.text }, client.country || ''),
            React.createElement(Text, { style: styles.text }, `Email: ${client.email}`),
            client.phone && React.createElement(Text, { style: styles.text }, `Phone: ${client.phone}`)
          ),

          // Items Table
          React.createElement(View, { style: styles.table },
            React.createElement(View, { style: styles.tableHeader },
              React.createElement(Text, { style: styles.tableCol1 }, "Description"),
              React.createElement(Text, { style: styles.tableCol2 }, "Qty"),
              React.createElement(Text, { style: styles.tableCol3 }, "Rate"),
              React.createElement(Text, { style: styles.tableCol4 }, "Amount")
            ),
            ...invoice.items.map((item: any, index: number) =>
              React.createElement(View, { key: index, style: styles.tableRow },
                React.createElement(Text, { style: styles.tableCol1 }, item.description),
                React.createElement(Text, { style: styles.tableCol2 }, item.quantity.toString()),
                React.createElement(Text, { style: styles.tableCol3 }, `$${item.unitPrice.toFixed(2)}`),
                React.createElement(Text, { style: styles.tableCol4 }, `$${item.total.toFixed(2)}`)
              )
            )
          ),

          // Totals
          React.createElement(View, { style: styles.totals },
            React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, {}, "Subtotal:"),
              React.createElement(Text, {}, `$${invoice.subtotal.toFixed(2)}`)
            ),
            invoice.taxRate > 0 && React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, {}, `Tax (${invoice.taxRate}%):`),
              React.createElement(Text, {}, `$${invoice.taxAmount.toFixed(2)}`)
            ),
            invoice.discountAmount > 0 && React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, {}, "Discount:"),
              React.createElement(Text, {}, `-$${invoice.discountAmount.toFixed(2)}`)
            ),
            (client.advancePayment && client.advancePayment > 0) && React.createElement(View, { style: styles.totalRow },
              React.createElement(Text, {}, "Advance Payment:"),
              React.createElement(Text, {}, `-$${client.advancePayment.toFixed(2)}`)
            ),
            React.createElement(View, { style: [styles.totalRow, styles.grandTotal] },
              React.createElement(Text, { style: styles.totalLabel }, "Total:"),
              React.createElement(Text, { style: styles.totalLabel }, `$${(invoice.total - (client.advancePayment || 0)).toFixed(2)}`)
            )
          ),

          // Notes
          invoice.notes && React.createElement(View, { style: styles.notes },
            React.createElement(Text, { style: styles.subtitle }, "Notes:"),
            React.createElement(Text, { style: styles.text }, invoice.notes)
          )
        )
      )
    )

    // Return the PDF as a response
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber || invoice.id}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
} 