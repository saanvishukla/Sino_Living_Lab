import { Building2, Users, AlertCircle, FileText, Search, Bell, Settings, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { Input } from './ui/input'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      <aside className="w-64 border-r bg-card shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SmartDirectory</h1>
              <p className="text-xs text-muted-foreground">Management</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-1 px-3 py-4">
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2.5 text-white shadow-md"
          >
            <Users className="h-5 w-5" />
            <span className="font-medium">Tenant Registration</span>
          </a>
          
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <AlertCircle className="h-5 w-5" />
            <span>Flagged Emails</span>
          </a>
          
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <FileText className="h-5 w-5" />
            <span>Generate E-Directory</span>
          </a>
          
          <a
            href="#"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <Building2 className="h-5 w-5" />
            <span>Buildings</span>
          </a>
        </nav>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search anything..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5 text-gray-600" />
            </button>
            <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
            </button>
          </div>
        </header>
        <div className="p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  )
}
