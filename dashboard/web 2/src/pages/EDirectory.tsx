import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Download, Eye, Filter } from 'lucide-react'

interface Tenant {
  id: string
  unit?: string
  former_tenant___existing_tenant?: string
  new_tenant?: string
  remarks?: string
  email?: string
  createdAt?: string
  [key: string]: any
}

export default function EDirectory() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [directoryTitle, setDirectoryTitle] = useState('Tenant Directory')
  const [includeEmail, setIncludeEmail] = useState(true)
  const [includeRemarks, setIncludeRemarks] = useState(true)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/tenants')
      const data = await response.json()
      
      if (data.success) {
        setTenants(data.data)
        // Select all by default
        setSelectedTenants(new Set(data.data.map((t: Tenant) => t.id)))
      }
    } catch (err) {
      console.error('Error fetching tenants:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleTenant = (id: string) => {
    const newSelected = new Set(selectedTenants)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedTenants(newSelected)
  }

  const toggleAll = () => {
    if (selectedTenants.size === tenants.length) {
      setSelectedTenants(new Set())
    } else {
      setSelectedTenants(new Set(tenants.map(t => t.id)))
    }
  }

  const exportToPDF = () => {
    const selectedData = tenants.filter(t => selectedTenants.has(t.id))
    
    // Create a simple HTML table for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${directoryTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #4F46E5; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>${directoryTitle}</h1>
          <p style="text-align: center; color: #666;">Generated on ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Unit</th>
                <th>Existing Tenant</th>
                <th>New Tenant</th>
                ${includeEmail ? '<th>Email</th>' : ''}
                ${includeRemarks ? '<th>Remarks</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${selectedData.map((tenant, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${tenant.unit || 'N/A'}</td>
                  <td>${tenant.former_tenant___existing_tenant || 'N/A'}</td>
                  <td>${tenant.new_tenant || 'N/A'}</td>
                  ${includeEmail ? `<td>${tenant.email || 'N/A'}</td>` : ''}
                  ${includeRemarks ? `<td>${tenant.remarks || 'N/A'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Total Entries: ${selectedData.length}</p>
            <p>SmartDirectory Management System</p>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.print()
  }

  const exportToCSV = () => {
    const selectedData = tenants.filter(t => selectedTenants.has(t.id))
    
    const headers = ['#', 'Unit', 'Existing Tenant', 'New Tenant']
    if (includeEmail) headers.push('Email')
    if (includeRemarks) headers.push('Remarks')
    
    const csvContent = [
      headers.join(','),
      ...selectedData.map((tenant, index) => {
        const row = [
          index + 1,
          `"${tenant.unit || 'N/A'}"`,
          `"${tenant.former_tenant___existing_tenant || 'N/A'}"`,
          `"${tenant.new_tenant || 'N/A'}"`
        ]
        if (includeEmail) row.push(`"${tenant.email || 'N/A'}"`)
        if (includeRemarks) row.push(`"${tenant.remarks || 'N/A'}"`)
        return row.join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${directoryTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const selectedData = tenants.filter(t => selectedTenants.has(t.id))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tenants...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Generate E-Directory</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Create and export professional tenant directories
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Directory Settings</CardTitle>
              <CardDescription>Customize your directory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Directory Title</Label>
                <Input
                  id="title"
                  value={directoryTitle}
                  onChange={(e) => setDirectoryTitle(e.target.value)}
                  placeholder="Tenant Directory"
                />
              </div>

              <div className="space-y-2">
                <Label>Include Fields</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeEmail}
                      onChange={(e) => setIncludeEmail(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Email Address</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeRemarks}
                      onChange={(e) => setIncludeRemarks(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Remarks</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700"
                  onClick={exportToPDF}
                  disabled={selectedTenants.size === 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700"
                  onClick={exportToCSV}
                  disabled={selectedTenants.size === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>{selectedTenants.size}</strong> of <strong>{tenants.length}</strong> tenants selected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tenant Selection Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Select Tenants</CardTitle>
                  <CardDescription>Choose which tenants to include</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={toggleAll}>
                  <Filter className="h-4 w-4 mr-2" />
                  {selectedTenants.size === tenants.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {tenants.map((tenant) => (
                  <div
                    key={tenant.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedTenants.has(tenant.id)
                        ? 'bg-blue-50 border-blue-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleTenant(tenant.id)}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedTenants.has(tenant.id)}
                        onChange={() => {}}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">Unit {tenant.unit || 'N/A'}</span>
                          {tenant.remarks && (
                            <span className="text-xs px-2 py-0.5 rounded bg-gray-200">
                              {tenant.remarks}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {tenant.former_tenant___existing_tenant || tenant.new_tenant || 'No tenant name'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Section */}
      {selectedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview
            </CardTitle>
            <CardDescription>Preview of your directory export</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Existing Tenant</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">New Tenant</th>
                    {includeEmail && <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>}
                    {includeRemarks && <th className="px-4 py-3 text-left text-sm font-semibold">Remarks</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedData.slice(0, 10).map((tenant, index) => (
                    <tr key={tenant.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium">{tenant.unit || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{tenant.former_tenant___existing_tenant || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{tenant.new_tenant || 'N/A'}</td>
                      {includeEmail && <td className="px-4 py-3 text-sm text-muted-foreground">{tenant.email || 'N/A'}</td>}
                      {includeRemarks && <td className="px-4 py-3 text-sm">{tenant.remarks || 'N/A'}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              {selectedData.length > 10 && (
                <div className="px-4 py-3 bg-gray-50 text-sm text-muted-foreground text-center">
                  ... and {selectedData.length - 10} more entries
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
