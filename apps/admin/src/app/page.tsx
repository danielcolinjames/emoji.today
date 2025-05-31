import { AuthWrapper } from '@/components/AuthWrapper'
import { Dashboard } from '@/components/Dashboard'

export default function AdminPage() {
  return (
    <AuthWrapper>
      <Dashboard />
    </AuthWrapper>
  )
} 