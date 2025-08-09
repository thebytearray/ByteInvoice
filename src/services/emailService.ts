import type { SMTPSettings, EmailTemplate, Invoice, Client, Company } from '@/types'

export interface EmailData {
  to: string
  subject: string
  html: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export class EmailService {
  static async sendEmail(smtpSettings: SMTPSettings, emailData: EmailData): Promise<boolean> {
    try {
      console.log('Sending email with SMTP settings:', smtpSettings)
      console.log('Email data:', emailData)
      
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpSettings,
          emailData,
        }),
      })

      return response.ok
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }

  static async generateInvoicePDF(invoice: Invoice, client: Client, company: Company): Promise<Buffer | null> {
    try {
      console.log('=== PDF Generation Debug ===')
      console.log('Generating PDF for invoice:', invoice.invoiceNumber || invoice.id)
      
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoice,
          client,
          company,
        }),
      })

      console.log('PDF API response status:', response.status)
      console.log('PDF API response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to generate PDF:', response.statusText, errorText)
      return null
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      console.log('PDF generated successfully, buffer size:', buffer.length)
      console.log('=== End PDF Generation Debug ===')
      
      return buffer
    } catch (error) {
      console.error('=== PDF Generation Error ===')
      console.error('Error generating PDF:', error)
      console.error('=== End PDF Generation Error ===')
      return null
    }
  }

  static async sendInvoice(
    invoice: Invoice,
    client: Client,
    company: Company,
    smtpSettings: SMTPSettings,
    template?: EmailTemplate
  ): Promise<boolean> {
    console.log('=== Send Invoice Debug ===')
    console.log('Sending invoice:', invoice.invoiceNumber || invoice.id, 'to:', client.email)
    
    // Validate required data
    if (!invoice || !client || !company) {
      console.error('Missing required data for sending invoice')
      return false
    }
    
    if (!client.email || !client.email.includes('@')) {
      console.error('Invalid client email address:', client.email)
      return false
    }
    
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
      console.error('Incomplete SMTP settings')
      return false
    }
    
    const variables: Record<string, string> = {}
    variables['invoiceNumber'] = invoice.invoiceNumber || invoice.id || 'N/A'
    variables['clientName'] = client.name || 'Valued Customer'
    variables['companyName'] = company.name || 'Your Company'
    variables['total'] = (invoice.total || 0).toFixed(2)
    variables['dueDate'] = invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'
    variables['issueDate'] = invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString() : 'N/A'
    variables['clientEmail'] = client.email || ''
    variables['companyEmail'] = company.email || ''
    variables['companyPhone'] = company.phone || ''
    variables['companyAddress'] = company.address || ''
    variables['companyWebsite'] = company.website || ''
    variables['invoiceStatus'] = invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Draft'

    let statusMessage = ''
    let statusColor = '#2563eb'
    let urgencyLevel = ''
    
    switch (invoice.status) {
      case 'paid':
        statusMessage = 'Thank you for your payment! This invoice has been marked as paid.'
        statusColor = '#16a34a'
        urgencyLevel = 'confirmation'
        break
      case 'overdue':
        statusMessage = 'This invoice is now overdue. Please arrange payment as soon as possible to avoid any service interruptions.'
        statusColor = '#dc2626'
        urgencyLevel = 'urgent'
        break
      case 'sent':
        statusMessage = 'This invoice is awaiting payment. Please review the details and process payment by the due date.'
        statusColor = '#ea580c'
        urgencyLevel = 'normal'
        break
      default:
        statusMessage = 'Please review the attached invoice and process payment by the due date.'
        statusColor = '#2563eb'
        urgencyLevel = 'normal'
    }

    variables['statusMessage'] = statusMessage
    variables['statusColor'] = statusColor
    variables['urgencyLevel'] = urgencyLevel

    const defaultSubject = invoice.status === 'paid' 
      ? 'Payment Confirmation - Invoice {{invoiceNumber}} from {{companyName}}'
      : invoice.status === 'overdue'
      ? '⚠️ OVERDUE: Invoice {{invoiceNumber}} - Immediate Action Required'
      : 'Invoice {{invoiceNumber}} from {{companyName}} - Due {{dueDate}}'

    const defaultBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{invoiceNumber}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, {{statusColor}}, {{statusColor}}dd);
            color: white; 
            padding: 32px 24px; 
            text-align: center;
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px;
        }
        .header p { 
            font-size: 16px; 
            opacity: 0.9;
        }
        .content { 
            padding: 32px 24px;
        }
        .greeting { 
            font-size: 18px; 
            margin-bottom: 24px; 
            color: #1f2937;
        }
        .status-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
            background-color: {{statusColor}}15;
            color: {{statusColor}};
            border: 2px solid {{statusColor}}30;
        }
        .invoice-details { 
            background: #f8fafc; 
            border-radius: 8px; 
            padding: 24px; 
            margin: 24px 0;
            border-left: 4px solid {{statusColor}};
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .detail-row:last-child { 
            margin-bottom: 0; 
            padding-top: 12px; 
            border-top: 2px solid #e5e7eb; 
            font-weight: 700; 
            font-size: 18px;
        }
        .detail-label { 
            color: #6b7280; 
            font-weight: 500;
        }
        .detail-value { 
            font-weight: 600; 
            color: #1f2937;
        }
        .message { 
            background: {{statusColor}}08; 
            border: 1px solid {{statusColor}}20; 
            border-radius: 8px; 
            padding: 20px; 
            margin: 24px 0;
        }
        .cta-button { 
            display: inline-block; 
            background: {{statusColor}}; 
            color: white; 
            padding: 14px 28px; 
            text-decoration: none; 
            border-radius: 8px; 
            font-weight: 600; 
            margin: 24px 0;
            transition: all 0.2s;
        }
        .cta-button:hover { 
            background: {{statusColor}}dd; 
            transform: translateY(-1px);
        }
        .footer { 
            background: #f8fafc; 
            padding: 24px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
        }
        .footer p { 
            color: #6b7280; 
            font-size: 14px; 
            margin-bottom: 8px;
        }
        .contact-info { 
            margin-top: 16px; 
            padding-top: 16px; 
            border-top: 1px solid #e5e7eb;
        }
        .contact-info p { 
            margin-bottom: 4px;
        }
        @media (max-width: 600px) {
            .container { 
                margin: 0; 
                border-radius: 0;
            }
            .header { 
                padding: 24px 16px;
            }
            .header h1 { 
                font-size: 24px;
            }
            .content { 
                padding: 24px 16px;
            }
            .invoice-details { 
                padding: 16px;
            }
            .detail-row { 
                flex-direction: column; 
                gap: 4px;
            }
            .detail-value { 
                text-align: left;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{companyName}}</h1>
            <p>Professional Invoice Services</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Dear {{clientName}},
            </div>
            
            <div class="status-badge">
                Status: {{invoiceStatus}}
            </div>
            
            <p>I hope this message finds you well. We are writing to provide you with the details of invoice {{invoiceNumber}}.</p>
            
            <div class="invoice-details">
                <div class="detail-row">
                    <span class="detail-label">Invoice Number:</span>
                    <span class="detail-value">{{invoiceNumber}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Issue Date:</span>
                    <span class="detail-value">{{issueDate}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Due Date:</span>
                    <span class="detail-value">{{dueDate}}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Total Amount:</span>
                    <span class="detail-value">\${{total}}</span>
                </div>
            </div>
            
            <div class="message">
                <p><strong>{{statusMessage}}</strong></p>
            </div>
            
            <p>The complete invoice details are attached to this email as a PDF document. Please review the itemized breakdown and don't hesitate to reach out if you have any questions about the charges.</p>
            
            <p>We truly appreciate your business and the trust you place in our services. Your prompt attention to this invoice helps us continue providing you with excellent service.</p>
        </div>
        
        <div class="footer">
            <p><strong>{{companyName}}</strong></p>
            <p>{{companyAddress}}</p>
            <div class="contact-info">
                <p>📧 {{companyEmail}}</p>
                <p>📞 {{companyPhone}}</p>
                <p>🌐 {{companyWebsite}}</p>
            </div>
            <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                This is an automated message. Please do not reply directly to this email.
                For inquiries, please contact us at {{companyEmail}}.
            </p>
        </div>
    </div>
</body>
</html>`

    const subject = this.replaceTemplateVariables(
      template?.subject || defaultSubject,
      variables
    )
    
    const body = this.replaceTemplateVariables(
      template?.body || defaultBody,
      variables
    )

    const emailData: EmailData = {
      to: client.email,
      subject,
      html: body,
    }

    try {
      console.log('Generating PDF attachment...')
      const pdfBuffer = await this.generateInvoicePDF(invoice, client, company)
      if (pdfBuffer) {
        console.log('PDF generated, adding as attachment')
        emailData.attachments = [{
          filename: `invoice-${invoice.invoiceNumber || invoice.id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }]
        console.log('Attachment added:', {
          filename: emailData.attachments[0].filename,
          contentType: emailData.attachments[0].contentType,
          contentSize: pdfBuffer.length,
          isBuffer: Buffer.isBuffer(pdfBuffer)
        })
      } else {
        console.log('PDF generation failed, sending email without attachment')
      }
    } catch (error) {
      console.error('Error generating PDF attachment:', error)
    }

    console.log('Sending email with data:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: !!emailData.attachments,
      attachmentCount: emailData.attachments?.length || 0
    })

    const result = await this.sendEmail(smtpSettings, emailData)
    console.log('Email send result:', result)
    console.log('=== End Send Invoice Debug ===')
    
    return result
  }

  static async sendReminder(
    invoice: Invoice,
    client: Client,
    company: Company,
    smtpSettings: SMTPSettings,
    template?: EmailTemplate
  ): Promise<boolean> {

    const variables: Record<string, string> = {}
    variables['invoiceNumber'] = invoice.invoiceNumber || invoice.id
    variables['clientName'] = client.name
    variables['companyName'] = company.name || 'Your Company'
    variables['total'] = invoice.total.toFixed(2)
    variables['dueDate'] = new Date(invoice.dueDate).toLocaleDateString()
    variables['issueDate'] = new Date(invoice.issueDate).toLocaleDateString()
    variables['clientEmail'] = client.email
    variables['companyEmail'] = company.email || ''
    variables['companyPhone'] = company.phone || ''
    variables['companyAddress'] = company.address || ''
    variables['companyWebsite'] = company.website || ''

    const defaultSubject = '💡 Friendly Reminder: Invoice {{invoiceNumber}} Payment Due'
    const defaultBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Reminder - Invoice {{invoiceNumber}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #ea580c, #ea580cdd);
            color: white; 
            padding: 32px 24px; 
            text-align: center;
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px;
        }
        .content { 
            padding: 32px 24px;
        }
        .reminder-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
            background-color: #ea580c15;
            color: #ea580c;
            border: 2px solid #ea580c30;
        }
        .invoice-details { 
            background: #fef3f2; 
            border-radius: 8px; 
            padding: 24px; 
            margin: 24px 0;
            border-left: 4px solid #ea580c;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .detail-row:last-child { 
            margin-bottom: 0; 
            padding-top: 12px; 
            border-top: 2px solid #e5e7eb; 
            font-weight: 700; 
            font-size: 18px;
        }
        .footer { 
            background: #f8fafc; 
            padding: 24px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
        }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header { padding: 24px 16px; }
            .content { padding: 24px 16px; }
            .detail-row { flex-direction: column; gap: 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>💡 Payment Reminder</h1>
            <p>{{companyName}}</p>
        </div>
        
        <div class="content">
            <div class="reminder-badge">
                Friendly Reminder
            </div>
            
            <p>Dear {{clientName}},</p>
            
            <p>I hope you're doing well! This is a gentle reminder that invoice {{invoiceNumber}} for \${{total}} is still pending payment.</p>
            
            <div class="invoice-details">
                <div class="detail-row">
                    <span>Invoice Number:</span>
                    <span><strong>{{invoiceNumber}}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Due Date:</span>
                    <span><strong>{{dueDate}}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Amount Due:</span>
                    <span><strong>\${{total}}</strong></span>
                </div>
            </div>
            
            <p>We understand that things can get busy, and payments can sometimes slip through the cracks. If you've already processed this payment, please disregard this message, and thank you!</p>
            
            <p>If you have any questions about this invoice or need to discuss payment arrangements, please don't hesitate to reach out. We're here to help and appreciate your business.</p>
            
            <p>Thank you for your attention to this matter and for being a valued client.</p>
        </div>
        
        <div class="footer">
            <p><strong>{{companyName}}</strong></p>
            <p>📧 {{companyEmail}} | 📞 {{companyPhone}}</p>
        </div>
    </div>
</body>
</html>`

    const subject = this.replaceTemplateVariables(
      template?.subject || defaultSubject,
      variables
    )
    
    const body = this.replaceTemplateVariables(
      template?.body || defaultBody,
      variables
    )

    const emailData: EmailData = {
      to: client.email,
      subject,
      html: body,
    }

    return this.sendEmail(smtpSettings, emailData)
  }

  static async sendOverdueNotice(
    invoice: Invoice,
    client: Client,
    company: Company,
    smtpSettings: SMTPSettings,
    template?: EmailTemplate
  ): Promise<boolean> {
    const variables: Record<string, string> = {}
    variables['invoiceNumber'] = invoice.invoiceNumber || invoice.id
    variables['clientName'] = client.name
    variables['companyName'] = company.name || 'Your Company'
    variables['total'] = invoice.total.toFixed(2)
    variables['dueDate'] = new Date(invoice.dueDate).toLocaleDateString()
    variables['issueDate'] = new Date(invoice.issueDate).toLocaleDateString()
    variables['clientEmail'] = client.email
    variables['companyEmail'] = company.email || ''
    variables['companyPhone'] = company.phone || ''
    variables['companyAddress'] = company.address || ''
    variables['companyWebsite'] = company.website || ''

    // Calculate days overdue
    const daysOverdue = Math.max(0, Math.floor((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
    variables['daysOverdue'] = daysOverdue.toString()

    const defaultSubject = '🚨 URGENT: Overdue Payment - Invoice {{invoiceNumber}} Requires Immediate Attention'
    const defaultBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Overdue Notice - Invoice {{invoiceNumber}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6; 
            color: #374151; 
            background-color: #f9fafb;
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header { 
            background: linear-gradient(135deg, #dc2626, #dc2626dd);
            color: white; 
            padding: 32px 24px; 
            text-align: center;
        }
        .header h1 { 
            font-size: 28px; 
            font-weight: 700; 
            margin-bottom: 8px;
        }
        .content { 
            padding: 32px 24px;
        }
        .urgent-badge {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 24px;
            background-color: #dc262615;
            color: #dc2626;
            border: 2px solid #dc262630;
        }
        .invoice-details { 
            background: #fef2f2; 
            border-radius: 8px; 
            padding: 24px; 
            margin: 24px 0;
            border-left: 4px solid #dc2626;
        }
        .detail-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 12px;
            flex-wrap: wrap;
        }
        .detail-row:last-child { 
            margin-bottom: 0; 
            padding-top: 12px; 
            border-top: 2px solid #e5e7eb; 
            font-weight: 700; 
            font-size: 18px;
            color: #dc2626;
        }
        .urgent-message {
            background: #fef2f2;
            border: 2px solid #dc2626;
            border-radius: 8px;
            padding: 20px;
            margin: 24px 0;
            text-align: center;
        }
        .footer { 
            background: #f8fafc; 
            padding: 24px; 
            text-align: center; 
            border-top: 1px solid #e5e7eb;
        }
        @media (max-width: 600px) {
            .container { margin: 0; border-radius: 0; }
            .header { padding: 24px 16px; }
            .content { padding: 24px 16px; }
            .detail-row { flex-direction: column; gap: 4px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 OVERDUE NOTICE</h1>
            <p>{{companyName}}</p>
        </div>
        
        <div class="content">
            <div class="urgent-badge">
                URGENT - IMMEDIATE ACTION REQUIRED
            </div>
            
            <p>Dear {{clientName}},</p>
            
            <div class="urgent-message">
                <p><strong>This invoice is now OVERDUE and requires immediate attention.</strong></p>
            </div>
            
            <p>Despite our previous communications, invoice {{invoiceNumber}} remains unpaid and is now past its due date. This matter requires your urgent attention to avoid any potential service interruptions or additional fees.</p>
            
            <div class="invoice-details">
                <div class="detail-row">
                    <span>Invoice Number:</span>
                    <span><strong>{{invoiceNumber}}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Original Due Date:</span>
                    <span><strong>{{dueDate}}</strong></span>
                </div>
                <div class="detail-row">
                    <span>Days Overdue:</span>
                    <span><strong>{{daysOverdue}} days</strong></span>
                </div>
                <div class="detail-row">
                    <span>Outstanding Amount:</span>
                    <span><strong>\${{total}}</strong></span>
                </div>
            </div>
            
            <p><strong>IMMEDIATE ACTION REQUIRED:</strong></p>
            <ul style="margin: 16px 0; padding-left: 20px;">
                <li>Please process payment immediately to avoid service interruption</li>
                <li>Contact us within 48 hours if you need to discuss payment arrangements</li>
                <li>Provide proof of payment if this invoice has already been paid</li>
            </ul>
            
            <p>We value our business relationship and want to resolve this matter promptly. Please contact us immediately at {{companyEmail}} or {{companyPhone}} to discuss this overdue account.</p>
            
            <p>We appreciate your immediate attention to this urgent matter.</p>
        </div>
        
        <div class="footer">
            <p><strong>{{companyName}}</strong></p>
            <p>📧 {{companyEmail}} | 📞 {{companyPhone}}</p>
            <p style="margin-top: 12px; color: #dc2626; font-weight: 600;">
                URGENT: Please respond within 48 hours
            </p>
        </div>
    </div>
</body>
</html>`

    const subject = this.replaceTemplateVariables(
      template?.subject || defaultSubject,
      variables
    )
    
    const body = this.replaceTemplateVariables(
      template?.body || defaultBody,
      variables
    )

    const emailData: EmailData = {
      to: client.email,
      subject,
      html: body,
    }

    return this.sendEmail(smtpSettings, emailData)
  }

  static replaceTemplateVariables(
    template: string,
    variables: Record<string, string>
  ): string {
    let result = template
    
    console.log('=== Template Replacement Debug ===')
    console.log('Original template:', template)
    console.log('Variables object:', variables)
    
    // Use for...in loop instead of Object.entries to avoid any potential issues
    for (const key in variables) {
      if (variables.hasOwnProperty(key)) {
        const value = variables[key]
        const regex = new RegExp(`{{${key}}}`, 'g')
        console.log(`Replacing {{${key}}} with "${value}"`)
        const beforeReplace = result
        result = result.replace(regex, value || '')
        if (beforeReplace !== result) {
          console.log(`Replacement successful for ${key}`)
        } else {
          console.log(`No replacement made for ${key}`)
        }
      }
    }
    
    console.log('Final result:', result)
    console.log('=== End Template Replacement Debug ===')
    return result
  }
}
