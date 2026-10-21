import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

/** Where the admin's localMart-BE token is kept between visits. */
export const TOKEN_KEY = 'lm-admin-token'

export interface AuthState {
  /** The bearer token from POST /api/admin/auth/login; null when signed out. */
  token: string | null
}

const initialState: AuthState = { token: localStorage.getItem(TOKEN_KEY) }

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    signedIn: (state, action: PayloadAction<string>) => {
      state.token = action.payload
    },
    signedOut: (state) => {
      state.token = null
    },
  },
})

export const { signedIn, signedOut } = authSlice.actions
export const selectToken = (state: { auth: AuthState }) => state.auth.token
export default authSlice.reducer
