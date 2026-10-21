import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { selectToken } from '@/store/auth-slice'
import { useAppSelector } from '@/store/store'

/**
 * Guards the signed-in routes. Without a token it sends the admin to /login,
 * remembering where they were headed so sign-in can bring them back. A token
 * the server rejects (expired, disabled account) is cleared by the API layer,
 * which lands here too.
 */
export default function RequireAuth() {
  const token = useAppSelector(selectToken)
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}
