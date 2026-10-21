import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { useDispatch, useSelector } from 'react-redux'

import { adminApi } from '@/api/base-api'
import authReducer, { TOKEN_KEY, signedIn, signedOut } from './auth-slice'

const listener = createListenerMiddleware()

// The token outlives a reload. Signing out also drops every cached reply,
// so the next admin never sees the last one's data.
listener.startListening({
  matcher: isAnyOf(signedIn, signedOut),
  effect: (action, api) => {
    if (signedIn.match(action)) {
      localStorage.setItem(TOKEN_KEY, action.payload)
      return
    }
    localStorage.removeItem(TOKEN_KEY)
    api.dispatch(adminApi.util.resetApiState())
  },
})

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefault) =>
    getDefault().prepend(listener.middleware).concat(adminApi.middleware),
})

// Refetches on window focus and reconnect, for queries that ask for it.
setupListeners(store.dispatch)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
