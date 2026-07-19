import Link from 'next/link'
import { RegisterForm } from '@/components/auth/register-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Noesis</h1>
          <p className="text-muted-foreground">Crea tu cuenta</p>
        </div>
        <RegisterForm />
        <OAuthButtons />
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tienes cuenta?{' '}
          <Link
            href="/login"
            className="font-medium text-primary hover:underline"
          >
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
