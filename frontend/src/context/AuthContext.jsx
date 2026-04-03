import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.user || null)
    } catch (error) {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const processCallback = useCallback(async (token) => {
    const { data } = await api.post('/auth/callback', { token })
    setUser(data.user || null)
    return data.user || null
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      processCallback,
      reloadUser: loadMe,
      logout,
    }),
    [user, loading, processCallback, loadMe, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return ctx
}
