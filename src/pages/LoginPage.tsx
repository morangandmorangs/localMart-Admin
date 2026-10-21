import { useState, type FormEvent } from 'react'
import { AlertCircle, Loader2, LogIn, ShieldCheck } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'

import { useLoginMutation } from '@/api/auth-api'
import { isApiError } from '@/api/base-api'
import PasswordInput from '@/components/PasswordInput'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { selectToken, signedIn } from '@/store/auth-slice'
import { useAppDispatch, useAppSelector } from '@/store/store'

/**
 * Where to go after signing in: the page RequireAuth was guarding, if it is
 * a path in this app, else the dashboard.
 */
const returnPath = (state: unknown): string => {
  const from: unknown =
    typeof state === 'object' && state !== null ? Reflect.get(state, 'from') : undefined
  return typeof from === 'string' && from.startsWith('/') && !from.startsWith('//') ? from : '/'
}

/** Signs an admin in against localMart-BE (POST /api/admin/auth/login). */
export default function LoginPage() {
  const dispatch = useAppDispatch()
  const token = useAppSelector(selectToken)
  const location = useLocation()
  const [login, { isLoading }] = useLoginMutation()
  const [error, setError] = useState<string | null>(null)

  // Signed in (just now, or already): on to where they were going.
  if (token) return <Navigate to={returnPath(location.state)} replace />

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setError(null)
    try {
      const session = await login({
        email: String(form.get('email') ?? ''),
        password: String(form.get('password') ?? ''),
      }).unwrap()
      dispatch(signedIn(session.token))
    } catch (err) {
      setError(isApiError(err) ? err.message : 'Sign-in failed. Try again.')
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm overflow-hidden">
        <div aria-hidden className="mt-[calc(var(--card-spacing)*-1)] h-1 bg-linear-to-r from-primary to-secondary" />
        <CardHeader>
          <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-linear-to-br from-primary to-secondary text-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </div>
          <CardTitle>Local Mart Admin</CardTitle>
          <CardDescription>Sign in with your admin account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={onSubmit}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="username" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput id="password" name="password" autoComplete="current-password" required />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle aria-hidden />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" aria-hidden /> : <LogIn aria-hidden />}
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
