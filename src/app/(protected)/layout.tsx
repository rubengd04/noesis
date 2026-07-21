import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Breadcrumbs } from '@/components/layout/breadcrumbs'
import { Toaster } from 'sonner'

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar userEmail={user.email ?? ''} />
      <main className="flex-1 px-6 lg:px-10 py-8 lg:ml-64">
        <Breadcrumbs />
        {children}
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
