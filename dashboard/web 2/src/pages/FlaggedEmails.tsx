import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle, Trash2, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'

interface FlaggedEmail {
  id: string
  subject: string
  sender: string
  receivedAt: string
  htmlContent: string
  errorMessage: string
  status: 'pending' | 'resolved' | 'archived'
  createdAt: string
  resolvedAt?: string
}

export default function FlaggedEmails() {
  const [emails, setEmails] = useState<FlaggedEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [viewDialog, setViewDialog] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState<FlaggedEmail | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/flagged-emails')
      const data = await response.json()
      
      if (data.success) {
        setEmails(data.data)
      }
    } catch (err) {
      console.error('Error fetching flagged emails:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/flagged-emails/${id}/resolve`, {
        method: 'PUT'
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchEmails()
      }
    } catch (err) {
      console.error('Error resolving email:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/flagged-emails/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        await fetchEmails()
      }
    } catch (err) {
      console.error('Error deleting email:', err)
    }
  }

  const pendingEmails = emails.filter(e => e.status === 'pending')
  const resolvedEmails = emails.filter(e => e.status === 'resolved')

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading flagged emails...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Flagged Emails</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review emails that failed to process automatically
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <AlertCircle className="h-6 w-6" />
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Pending Review</p>
            <p className="text-3xl font-bold">{pendingEmails.length}</p>
            <p className="text-white/60 text-xs mt-2">Awaiting manual review</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-white/20 rounded-lg">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
          <div>
            <p className="text-white/80 text-sm mb-1">Resolved</p>
            <p className="text-3xl font-bold">{resolvedEmails.length}</p>
            <p className="text-white/60 text-xs mt-2">Successfully processed</p>
          </div>
        </div>
      </div>

      <Card className="shadow-md">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
          <CardTitle className="text-xl">Pending Emails</CardTitle>
          <CardDescription>
            {pendingEmails.length} email{pendingEmails.length !== 1 ? 's' : ''} need review
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingEmails.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-5xl mb-4">✅</div>
              <p className="text-muted-foreground font-medium">No pending emails</p>
              <p className="text-sm text-muted-foreground mt-1">All emails processed successfully</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingEmails.map((email) => (
                <div key={email.id} className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium">{email.subject}</h3>
                      <p className="text-sm text-muted-foreground mt-1">From: {email.sender}</p>
                      <p className="text-sm text-red-600 mt-2">
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        {email.errorMessage}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Received: {new Date(email.receivedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedEmail(email)
                          setViewDialog(true)
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleResolve(email.id)}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleDelete(email.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          {selectedEmail && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">Subject</p>
                <p className="text-sm text-muted-foreground">{selectedEmail.subject}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Sender</p>
                <p className="text-sm text-muted-foreground">{selectedEmail.sender}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm text-red-600">{selectedEmail.errorMessage}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">HTML Content Preview</p>
                <div className="max-h-96 overflow-auto border rounded p-4 bg-gray-50">
                  <pre className="text-xs whitespace-pre-wrap">{selectedEmail.htmlContent.substring(0, 2000)}</pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
