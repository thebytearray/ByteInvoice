import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import type { SMTPSettings } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const { smtpSettings, emailData } = await request.json()

    console.log('=== Email API Debug ===')
    console.log('SMTP Settings:', {
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      username: smtpSettings.username,
      fromName: smtpSettings.fromName,
      fromEmail: smtpSettings.fromEmail
    })
    console.log('Email Data:', {
      to: emailData.to,
      subject: emailData.subject,
      hasAttachments: !!emailData.attachments,
      attachmentCount: emailData.attachments?.length || 0
    })

    // Validate required fields
    if (!smtpSettings.host || !smtpSettings.username || !smtpSettings.password) {
      return NextResponse.json(
        { error: 'SMTP configuration is incomplete' },
        { status: 400 }
      )
    }

    // Process attachments to ensure they are proper Buffers
    let processedAttachments = undefined
    if (emailData.attachments && emailData.attachments.length > 0) {
      console.log('Processing attachments...')
      processedAttachments = emailData.attachments.map((attachment: any, index: number) => {
        console.log(`Attachment ${index}:`, {
          filename: attachment.filename,
          contentType: attachment.contentType,
          contentIsBuffer: Buffer.isBuffer(attachment.content),
          contentType_actual: typeof attachment.content,
          contentKeys: attachment.content ? Object.keys(attachment.content) : 'null'
        })

        // If content is a serialized Buffer object, convert it back to Buffer
        let content = attachment.content
        if (content && typeof content === 'object' && content.type === 'Buffer' && Array.isArray(content.data)) {
          console.log('Converting serialized Buffer back to Buffer')
          content = Buffer.from(content.data)
        } else if (content && !Buffer.isBuffer(content)) {
          console.log('Converting content to Buffer')
          content = Buffer.from(content)
        }

        return {
          filename: attachment.filename,
          content: content,
          contentType: attachment.contentType || 'application/pdf'
        }
      })
      console.log('Processed attachments:', processedAttachments.length)
    }

    // Create transporter
    console.log('Creating transporter...')
    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port: smtpSettings.port,
      secure: smtpSettings.secure,
      auth: {
        user: smtpSettings.username,
        pass: smtpSettings.password,
      },
    })

    // Verify transporter
    console.log('Verifying transporter...')
    await transporter.verify()
    console.log('Transporter verified successfully')

    // Send email
    console.log('Sending email...')
    const mailOptions = {
      from: `"${smtpSettings.fromName}" <${smtpSettings.fromEmail}>`,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      attachments: processedAttachments,
    }

    console.log('Mail options:', {
      from: mailOptions.from,
      to: mailOptions.to,
      subject: mailOptions.subject,
      hasAttachments: !!mailOptions.attachments,
      attachmentCount: mailOptions.attachments?.length || 0
    })

    const info = await transporter.sendMail(mailOptions)

    console.log('Email sent successfully:', info.messageId)
    console.log('=== End Email API Debug ===')

    return NextResponse.json({ success: true, messageId: info.messageId })
  } catch (error: any) {
    console.error('=== Email API Error ===')
    console.error('Error sending email:', error)
    console.error('Error details:', {
      name: error?.name,
      message: error?.message,
      code: error?.code,
      command: error?.command
    })
    console.error('=== End Email API Error ===')
    return NextResponse.json(
      { error: 'Failed to send email', details: error?.message || 'Unknown error' },
      { status: 500 }
    )
  }
} 