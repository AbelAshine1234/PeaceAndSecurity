import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { User } from '@/lib/auth'
import { UserRole } from '@/lib/enums'
import { DEFAULT_PERMISSIONS_BY_ROLE } from '@/lib/permissions'
import { API_CONFIG } from '@/lib/api-config'

interface AuthState {
  user: User | null
  loading: boolean
  isServerActive: boolean
  isCheckingServer: boolean
}

const initialState: AuthState = {
  user: null,
  loading: true,
  isServerActive: true,
  isCheckingServer: true,
}

export const checkServer = createAsyncThunk('auth/checkServer', async () => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 1500)
  try {
    await fetch(`${API_CONFIG.BASE_URL}auth/user/pre-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@peaceandsecurity.com' }),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return true
  } catch {
    clearTimeout(timeoutId)
    return false
  }
})

export const initAuth = createAsyncThunk('auth/init', async () => {
  let user: User | null = null
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { user = JSON.parse(stored) } catch { localStorage.removeItem('user') }
    }
  }
  return user
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<User | null>) {
      state.user = action.payload
      if (typeof window !== 'undefined') {
        if (action.payload) localStorage.setItem('user', JSON.stringify(action.payload))
        else localStorage.removeItem('user')
      }
    },
    logout(state) {
      state.user = null
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
      }
    },
    loginWithData(state, action: PayloadAction<User>) {
      state.user = action.payload
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(action.payload))
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkServer.fulfilled, (state, action) => {
        state.isServerActive = action.payload
        state.isCheckingServer = false
      })
      .addCase(checkServer.rejected, (state) => {
        state.isServerActive = false
        state.isCheckingServer = false
      })
      .addCase(checkServer.pending, (state) => {
        state.isCheckingServer = true
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.user = action.payload
        state.loading = false
      })
      .addCase(initAuth.rejected, (state) => {
        state.loading = false
      })
  },
})

export const { setUser, logout, loginWithData } = authSlice.actions

// Selectors
export const selectUser = (state: { auth: AuthState }) => state.auth.user
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.loading
export const selectIsServerActive = (state: { auth: AuthState }) => state.auth.isServerActive
export const selectIsCheckingServer = (state: { auth: AuthState }) => state.auth.isCheckingServer

export const selectCanAccess = (requiredRoles: UserRole[]) => (state: { auth: AuthState }) => {
  const user = state.auth.user
  if (!user) return false
  return requiredRoles.includes(user.role)
}

export const selectHasPermission = (permission: string) => (state: { auth: AuthState }) => {
  const user = state.auth.user
  let currentRole: string | undefined = user?.role
  if (!currentRole && typeof window !== 'undefined') {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { currentRole = JSON.parse(stored).role } catch { }
    }
  }
  if (!currentRole) return false
  const roleName = currentRole.toString().toUpperCase()
  if (roleName === 'SYSTEM_SUPER_ADMIN' || roleName === 'SYSTEM_ADMIN' || roleName.includes('ADMIN')) return true
  if (user?.permissions && Array.isArray(user.permissions)) {
    if (user.permissions.includes(permission)) return true
  }
  const defaultPerms = DEFAULT_PERMISSIONS_BY_ROLE[currentRole] || DEFAULT_PERMISSIONS_BY_ROLE[roleName] || []
  return defaultPerms.includes(permission)
}

export default authSlice.reducer
