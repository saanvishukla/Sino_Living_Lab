import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Pencil, Trash2, Building2, Users, TrendingUp, TrendingDown, Mail } from 'lucide-react'

interface Tenant {
  id: string
  unit?: string
  former_tenant___existing_tenant?: string
  new_tenant?: string
  remarks?: string
  column_5?: string
  email?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

export default function TenantRegistration() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
      } else {
        setError('Failed to fetch tenants')
      }
    } catch (err) {
      setError('Error connecting to API')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = 
      tenant.former_tenant___existing_tenant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.new_tenant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tenant.remarks?.toLowerCase().includes(searchQuery.toLowerCase())
    
    return matchesSearch
  })

  const totalRecords = tenants.length

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-destructive text-4xl mb-4">⚠️</div>
          <p className="text-destructive font-medium">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tenant Registration</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View and manage all tenant registrations from email submissions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              <span>9%</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Total Tenants</p>
            <p className="text-3xl font-bold">{tenants.length}</p>
            <p className="text-white/60 text-xs mt-2">From last month</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Building2 className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              <span>2%</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Total Records</p>
            <p className="text-3xl font-bold">{totalRecords}</p>
            <p className="text-white/60 text-xs mt-2">All entries</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <Mail className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" />
              <span>5%</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">New Registrations</p>
            <p className="text-3xl font-bold">{Math.floor(tenants.length * 0.3)}</p>
            <p className="text-white/60 text-xs mt-2">This month</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div className="flex items-center gap-1 text-sm bg-white/20 px-2 py-1 rounded-full">
              <TrendingDown className="h-3 w-3" />
              <span>11%</span>
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Pending Reviews</p>
            <p className="text-3xl font-bold">0</p>
            <p className="text-white/60 text-xs mt-2">Awaiting approval</p>
          </div>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Tenant Directory</CardTitle>
              <CardDescription className="mt-1">
                {filteredTenants.length} of {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} shown
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export
              </Button>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, unit, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-5xl mb-4">🔍</div>
              <p className="text-muted-foreground font-medium">No tenants found</p>
              <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/30 rounded-t-lg border-b">
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-foreground">#</p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-foreground">Unit</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-foreground">Existing Tenant</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-foreground">New Tenant</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-foreground">Email Address</p>
                </div>
                <div className="col-span-1">
                  <p className="text-sm font-semibold text-foreground">Remarks</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-semibold text-foreground">Registered</p>
                </div>
                <div className="col-span-1 text-right">
                  <p className="text-sm font-semibold text-foreground">Actions</p>
                </div>
              </div>
              
              <div className="space-y-3 mt-3">
                {filteredTenants.map((tenant, index) => (
                  <div key={tenant.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-1">
                        <p className="text-sm font-medium text-muted-foreground">{index + 1}</p>
                      </div>
                      
                      <div className="col-span-1">
                        <p className="font-medium text-sm">{tenant.unit || 'N/A'}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="font-medium text-sm">{tenant.former_tenant___existing_tenant || 'N/A'}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-sm">{tenant.new_tenant || 'N/A'}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">{tenant.email || 'N/A'}</p>
                      </div>
                      
                      <div className="col-span-1">
                        <p className="text-sm">{tenant.remarks || 'N/A'}</p>
                      </div>
                      
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">
                          {tenant.createdAt ? new Date(tenant.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          }) : 'N/A'}
                        </p>
                      </div>
                      
                      <div className="col-span-1 flex justify-end gap-2">
                        <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover:bg-green-50 hover:text-green-600 hover:border-green-300">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="hover:bg-red-50 hover:text-red-600 hover:border-red-300">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
