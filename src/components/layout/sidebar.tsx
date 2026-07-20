'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  History,
  Compass,
  Settings,
  User,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'


interface SidebarProps {
  userEmail: string
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/quizzes', label: 'Quizzes', icon: FileText },
  { href: '/quizzes/new', label: 'Crear Quiz', icon: PlusCircle },
  { href: '/history', label: 'Historial', icon: History },
  { href: '/explore', label: 'Explorar', icon: Compass },
]

const bottomItems = [
  { href: '/settings', label: 'Ajustes', icon: Settings },
]

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string): boolean {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="text-lg font-bold">
          Noesis
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <Separator />

      <div className="space-y-1 px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground" title={userEmail}>
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate max-w-[160px]">{userEmail}</span>
        </div>
        {bottomItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                isActive(item.href)
                  ? 'bg-accent text-accent-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </div>
    </div>
  )

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 z-40 flex h-16 w-full items-center border-b bg-background px-4">
        <Sheet>
          <SheetTrigger render={<Button variant="ghost" size="icon" />}>
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú</span>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navegación</SheetTitle>
            <SheetDescription className="sr-only">Menú de navegación principal</SheetDescription>
            {sidebarContent}
          </SheetContent>
        </Sheet>
        <Link href="/dashboard" className="ml-2 text-lg font-bold">
          Noesis
        </Link>
      </div>

      {/* Desktop sidebar — visible from lg up */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:fixed lg:inset-y-0">
        {sidebarContent}
      </aside>

      {/* Spacer for mobile header */}
      <div className="lg:hidden h-16" />
    </>
  )
}
