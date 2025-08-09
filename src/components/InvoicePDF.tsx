"use client"

import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import type { Invoice, Company, Client } from '@/types'

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

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companySection}>
            {company.logo && (
              <Image style={styles.logo} src={company.logo} />
            )}
            <View style={styles.companyInfo}>
              <Text style={styles.title}>{company.name}</Text>
              <Text style={styles.text}>{company.address}</Text>
              <Text style={styles.text}>{company.city}, {company.state} {company.zipCode}</Text>
              <Text style={styles.text}>{company.country}</Text>
              {company.phone && <Text style={styles.text}>Phone: {company.phone}</Text>}
              <Text style={styles.text}>Email: {company.email}</Text>
              {company.website && <Text style={styles.text}>Website: {company.website}</Text>}
              {company.taxId && <Text style={styles.text}>Tax ID: {company.taxId}</Text>}
            </View>
          </View>
          <View style={styles.invoiceInfo}>
            <Text style={styles.title}>INVOICE</Text>
            <Text style={styles.text}>Invoice #: {invoice.invoiceNumber}</Text>
            <Text style={styles.text}>Date: {new Date(invoice.issueDate).toLocaleDateString()}</Text>
            <Text style={styles.text}>Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</Text>
            <Text style={styles.text}>Status: {invoice.status}</Text>
          </View>
        </View>

        {/* Bill To */}
        <View style={styles.billTo}>
          <Text style={styles.subtitle}>Bill To:</Text>
          <Text style={styles.text}>{client.name}</Text>
          <Text style={styles.text}>{client.address}</Text>
          <Text style={styles.text}>{client.city}, {client.state} {client.zipCode}</Text>
          <Text style={styles.text}>{client.country}</Text>
          <Text style={styles.text}>Email: {client.email}</Text>
          {client.phone && <Text style={styles.text}>Phone: {client.phone}</Text>}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCol1}>Description</Text>
            <Text style={styles.tableCol2}>Qty</Text>
            <Text style={styles.tableCol3}>Rate</Text>
            <Text style={styles.tableCol4}>Amount</Text>
          </View>
          {invoice.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={styles.tableCol1}>{item.description}</Text>
              <Text style={styles.tableCol2}>{item.quantity}</Text>
              <Text style={styles.tableCol3}>${item.unitPrice.toFixed(2)}</Text>
              <Text style={styles.tableCol4}>${item.total.toFixed(2)}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>${subtotal.toFixed(2)}</Text>
          </View>
          {invoice.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text>Discount:</Text>
              <Text>-${invoice.discountAmount.toFixed(2)}</Text>
            </View>
          )}
          {client.advancePayment && client.advancePayment > 0 && (
            <View style={styles.totalRow}>
              <Text>Advance Payment:</Text>
              <Text>-${client.advancePayment.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text>Tax ({invoice.taxRate}%):</Text>
            <Text>${taxAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalLabel}>${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.subtitle}>Notes:</Text>
            <Text style={styles.text}>{invoice.notes}</Text>
          </View>
        )}
      </Page>
    </Document>
  )
}

export const InvoicePDFDownload = ({ invoice, company, client }: InvoicePDFProps) => {
  return (
    <PDFDownloadLink
      document={<InvoicePDFDocument invoice={invoice} company={company} client={client} />}
      fileName={`invoice-${invoice.invoiceNumber}.pdf`}
    >
      {({ loading }: { loading: boolean }) => (
        <Button disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? 'Generating PDF...' : 'Download PDF'}
        </Button>
      )}
    </PDFDownloadLink>
  )
} 