"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Building2, Mail, Database, Save, Upload, Download, Trash2, TestTube, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import type { Company, AppSettings } from "@/types"

const companySchema = z.object({
  name: z.string().min(1, "Company name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().optional(),
  country: z.string().min(1, "Country is required"),
  phone: z.string().optional(),
  email: z.string().email("Invalid email address"),
  website: z.string().optional(),
  taxId: z.string().optional(),
})

const smtpSchema = z.object({
  host: z.string().min(1, "SMTP host is required"),
  port: z.number().min(1, "Port must be a positive number").max(65535, "Port must be less than 65536"),
  secure: z.boolean(),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  fromName: z.string().min(1, "From name is required"),
  fromEmail: z.string().email("Invalid email address"),
})

type CompanyFormData = z.infer<typeof companySchema>
type SMTPFormData = z.infer<typeof smtpSchema>

export default function SettingsPage() {
  const { company, setCompany, settings, setSettings, isLoading, exportData, importData, clearAllData } = useStore()
  const [isSubmittingCompany, setIsSubmittingCompany] = useState(false)
  const [isSubmittingSMTP, setIsSubmittingSMTP] = useState(false)
  const [isTestingEmail, setIsTestingEmail] = useState(false)
  const [emailTestResult, setEmailTestResult] = useState<'success' | 'error' | null>(null)

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company.name || "",
      address: company.address || "",
      city: company.city || "",
      state: company.state || "",
      zipCode: company.zipCode || "",
      country: company.country || "",
      phone: company.phone || "",
      email: company.email || "",
      website: company.website || "",
      taxId: company.taxId || "",
    },
  })

  const smtpForm = useForm<SMTPFormData>({
    resolver: zodResolver(smtpSchema),
    defaultValues: {
      host: settings.smtp.host || "",
      port: settings.smtp.port || 587,
      secure: settings.smtp.secure || false,
      username: settings.smtp.username || "",
      password: settings.smtp.password || "",
      fromName: settings.smtp.fromName || "",
      fromEmail: settings.smtp.fromEmail || "",
    },
  })

  const onSubmitCompany = async (data: CompanyFormData) => {
    setIsSubmittingCompany(true)
    try {
      await setCompany(data as Company)
      toast.success("Company information updated successfully!")
    } catch (error) {
      toast.error("Failed to update company information")
    } finally {
      setIsSubmittingCompany(false)
    }
  }

  const onSubmitSMTP = async (data: SMTPFormData) => {
    setIsSubmittingSMTP(true)
    try {
      const updatedSettings: AppSettings = {
        ...settings,
        smtp: data,
      }
      await setSettings(updatedSettings)
      toast.success("SMTP settings updated successfully!")
      setEmailTestResult(null) // Reset test result when settings change
    } catch (error) {
      toast.error("Failed to update SMTP settings")
    } finally {
      setIsSubmittingSMTP(false)
    }
  }

  const testEmailSettings = async () => {
    setIsTestingEmail(true)
    setEmailTestResult(null)
    
    try {
      // Get current form values
      const formData = smtpForm.getValues()
      
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtpSettings: formData,
          testEmail: formData.fromEmail,
        }),
      })

      if (response.ok) {
        setEmailTestResult('success')
        toast.success("Test email sent successfully!")
      } else {
        setEmailTestResult('error')
        toast.error("Failed to send test email. Please check your settings.")
      }
    } catch (error) {
      setEmailTestResult('error')
      toast.error("Failed to test email settings")
    } finally {
      setIsTestingEmail(false)
    }
  }

  const handleExportData = async () => {
    try {
      await exportData()
      toast.success("Data exported successfully!")
    } catch (error) {
      toast.error("Failed to export data")
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await importData(data)
      toast.success("Data imported successfully!")
      
      // Reset forms with new data
      companyForm.reset({
        name: data.company?.name || "",
        address: data.company?.address || "",
        city: data.company?.city || "",
        state: data.company?.state || "",
        zipCode: data.company?.zipCode || "",
        country: data.company?.country || "",
        phone: data.company?.phone || "",
        email: data.company?.email || "",
        website: data.company?.website || "",
        taxId: data.company?.taxId || "",
      })
      
      smtpForm.reset({
        host: data.settings?.smtp?.host || "",
        port: data.settings?.smtp?.port || 587,
        secure: data.settings?.smtp?.secure || false,
        username: data.settings?.smtp?.username || "",
        password: data.settings?.smtp?.password || "",
        fromName: data.settings?.smtp?.fromName || "",
        fromEmail: data.settings?.smtp?.fromEmail || "",
      })
    } catch (error) {
      toast.error("Failed to import data. Please check the file format.")
    }
    
    // Reset the input
    event.target.value = ""
  }

  const handleClearAllData = async () => {
    if (confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      try {
        await clearAllData()
        toast.success("All data cleared successfully!")
        
        // Reset forms
        companyForm.reset()
        smtpForm.reset()
      } catch (error) {
        toast.error("Failed to clear data")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <Skeleton className="h-12 w-full mb-6" />

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your company information, email settings, and manage your data.
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Update your company details that will appear on invoices and emails.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...companyForm}>
                <form onSubmit={companyForm.handleSubmit(onSubmitCompany)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={companyForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="company@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input placeholder="+1 (555) 123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Street Address *</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Business Street" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State/Province *</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP/Postal Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country *</FormLabel>
                          <FormControl>
                            <Input placeholder="United States" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={companyForm.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Tax ID Number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" disabled={isSubmittingCompany} className="w-full sm:w-auto">
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmittingCompany ? "Saving..." : "Save Company Information"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Settings
              </CardTitle>
              <CardDescription>
                Configure SMTP settings for sending invoices and reminders via email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...smtpForm}>
                <form onSubmit={smtpForm.handleSubmit(onSubmitSMTP)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={smtpForm.control}
                      name="host"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SMTP Host *</FormLabel>
                          <FormControl>
                            <Input placeholder="smtp.gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smtpForm.control}
                      name="port"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Port *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="587" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smtpForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username *</FormLabel>
                          <FormControl>
                            <Input placeholder="your-email@gmail.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smtpForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="App password or email password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smtpForm.control}
                      name="fromName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Your Company Name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={smtpForm.control}
                      name="fromEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>From Email *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="noreply@yourcompany.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" disabled={isSubmittingSMTP} className="w-full sm:w-auto">
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmittingSMTP ? "Saving..." : "Save Email Settings"}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={testEmailSettings}
                      disabled={isTestingEmail || !smtpForm.formState.isValid}
                      className="w-full sm:w-auto"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {isTestingEmail ? "Testing..." : "Test Email Settings"}
                    </Button>
                  </div>

                  {emailTestResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-md ${
                      emailTestResult === 'success' 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {emailTestResult === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      <span className="text-sm">
                        {emailTestResult === 'success' 
                          ? 'Email settings are working correctly!' 
                          : 'Email test failed. Please check your settings.'
                        }
                      </span>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>
                Export, import, or clear your application data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-medium">Export Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Download all your data as a JSON file for backup purposes.
                  </p>
                  <Button onClick={handleExportData} variant="outline" className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-medium">Import Data</h3>
                  <p className="text-sm text-muted-foreground">
                    Restore your data from a previously exported JSON file.
                  </p>
                  <div className="relative">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleImportData}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-red-600">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">
                    Permanently delete all your data. This action cannot be undone.
                  </p>
                  <Button onClick={handleClearAllData} variant="destructive" className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Data
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 