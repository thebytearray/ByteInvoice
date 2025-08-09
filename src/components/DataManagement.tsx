"use client"

import { useState, useRef } from 'react'
import { useStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DataService } from '@/services/dataService'
import { Download, Upload, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DataManagement() {
  const { exportData, importData, clearAllData } = useStore()
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  const [showClearDialog, setShowClearDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    try {
      exportData()
      setImportStatus({
        type: 'success',
        message: 'Data exported successfully!'
      })
      setTimeout(() => setImportStatus({ type: null, message: '' }), 3000)
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: 'Failed to export data'
      })
    }
  }

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    setImportStatus({ type: null, message: '' })

    try {
      const importedData = await DataService.importData(file)
      importData(importedData)
      setImportStatus({
        type: 'success',
        message: `Data imported successfully! Imported ${importedData.clients.length} clients, ${importedData.products.length} products, and ${importedData.invoices.length} invoices.`
      })
    } catch (error) {
      setImportStatus({
        type: 'error',
        message: (error as Error).message
      })
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleClearData = () => {
    clearAllData()
    setShowClearDialog(false)
    setImportStatus({
      type: 'success',
      message: 'All data cleared successfully!'
    })
    setTimeout(() => setImportStatus({ type: null, message: '' }), 3000)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>
            Export your data for backup or import data from a previous backup.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importStatus.type && (
            <Alert className={importStatus.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
              {importStatus.type === 'error' ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
              <AlertDescription className={importStatus.type === 'error' ? 'text-red-800' : 'text-green-800'}>
                {importStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Data */}
            <div className="space-y-2">
              <Label>Export Data</Label>
              <p className="text-sm text-muted-foreground">
                Download all your data as a JSON file for backup.
              </p>
              <Button onClick={handleExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Import Data */}
            <div className="space-y-2">
              <Label htmlFor="import-file">Import Data</Label>
              <p className="text-sm text-muted-foreground">
                Upload a previously exported JSON file to restore your data.
              </p>
              <div className="space-y-2">
                <Input
                  id="import-file"
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline" 
                  className="w-full"
                  disabled={isImporting}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Choose File to Import'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions that will permanently delete your data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All Data
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete all your data.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="mb-2">This will permanently delete all your:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Company information</li>
                    <li>Clients</li>
                    <li>Products</li>
                    <li>Invoices</li>
                  </ul>
                  <p className="mt-4">
                    <strong>Make sure you have exported your data before proceeding.</strong>
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowClearDialog(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleClearData}>
                  Yes, Clear All Data
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  )
} 