import { useState } from 'react'
import Layout from './components/Layout'
import TenantRegistration from './pages/TenantRegistration'
import FlaggedEmails from './pages/FlaggedEmails'
import EDirectory from './pages/EDirectory'

function App() {
  const [currentPage, setCurrentPage] = useState<'tenants' | 'flagged' | 'directory'>('tenants')

  return (
    <Layout onNavigate={setCurrentPage}>
      {currentPage === 'tenants' && <TenantRegistration />}
      {currentPage === 'flagged' && <FlaggedEmails />}
      {currentPage === 'directory' && <EDirectory />}
    </Layout>
  )
}

export default App
