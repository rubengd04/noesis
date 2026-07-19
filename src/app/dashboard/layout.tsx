import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
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
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <span className="text-lg font-bold">Noesis</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {user.email}
          </span>
        </div>
      </header>
      <main className="container mx-flex-1 mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
