import { Building2, Users, AlertCircle, FileText, Search, Bell, Settings, User } from 'lucide-react'
import type { ReactNode } from 'react'
import { Input } from './ui/input'

interface LayoutProps {
  children: ReactNode
  onNavigate?: (page: 'tenants' | 'flagged' | 'directory') => void
}

export default function Layout({ children, onNavigate }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <aside className="w-72 bg-white border-r border-gray-200 shadow-xl relative flex flex-col">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">SmartDirectory</h1>
              <p className="text-xs text-gray-500 font-medium">Tenant Management</p>
            </div>
          </div>
        </div>
        
        <nav className="space-y-2 px-4 py-6 flex-1 overflow-y-auto">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Main Menu</p>
          
          <button
            onClick={() => onNavigate?.('tenants')}
            className="w-full flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3.5 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Users className="h-5 w-5" />
            </div>
            <span className="font-semibold">Tenant Registration</span>
          </button>
          
          <button
            onClick={() => onNavigate?.('flagged')}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-gray-600 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:text-orange-700 transition-all duration-200 group"
          >
            <div className="p-1.5 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
              <AlertCircle className="h-5 w-5 text-orange-600" />
            </div>
            <span className="font-medium">Flagged Emails</span>
          </button>
          
          <button
            onClick={() => onNavigate?.('directory')}
            className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-700 transition-all duration-200 group"
          >
            <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <FileText className="h-5 w-5 text-green-600" />
            </div>
            <span className="font-medium">Generate E-Directory</span>
          </button>
          
          <div className="pt-4 mt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">Settings</p>
            <button
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-gray-600 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-700 transition-all duration-200 group"
            >
              <div className="p-1.5 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <span className="font-medium">Buildings</span>
            </button>
          </div>
        </nav>
        
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100 mt-auto">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-700">Admin User</p>
              <p className="text-xs text-gray-500">admin@smartdirectory.com</p>
            </div>
          </div>
        </div>
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
