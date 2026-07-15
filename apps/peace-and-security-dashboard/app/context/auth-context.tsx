"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type User, validateCredentials } from "@/lib/auth"
import { UserRole } from "@/lib/enums"
import { API_CONFIG } from "@/lib/api-config"

import { DEFAULT_PERMISSIONS_BY_ROLE } from "@/lib/permissions";

interface AuthContextType {
  user: User | null
  loading: boolean
  isServerActive: boolean
  isCheckingServer: boolean
  login: (email?: string, password?: string, phoneNumber?: string) => Promise<void>
  loginWithData: (user: User) => void
  logout: () => void
  canAccess: (requiredRoles: UserRole[]) => boolean
  hasPermission: (permission: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isServerActive, setIsServerActive] = useState(true)
  const [isCheckingServer, setIsCheckingServer] = useState(true)

  const checkServer = async () => {
    try {
      setIsCheckingServer(true)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5s timeout

      // BASE_URL already includes /api, so just ping /auth/user/pre-login
      await fetch(`${API_CONFIG.BASE_URL}auth/user/pre-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'superadmin@ecoguard.com' }),
        signal: controller.signal
      }).catch(err => { throw err; });

      clearTimeout(timeoutId);
      setIsServerActive(true)
    } catch (error) {
      // Server unreachable — allow app to continue, dashboard will show retry
      setIsServerActive(false)
    } finally {
      setIsCheckingServer(false)
    }
  }

  useEffect(() => {
    const initAuth = async () => {
      // 1. Check server status first
      await checkServer()

      // 2. Load stored user
      if (typeof window !== 'undefined') {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser))
          } catch (error) {
            localStorage.removeItem("user")
          }
        }
      }
      setLoading(false)
    }

    initAuth()

  }, [])

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (user) {
        timeoutId = setTimeout(() => {
          console.warn("User inactive for 10 minutes. Logging out.");
          logout();
          window.location.href = "/";
        }, 10 * 60 * 1000); // 10 minutes
      }
    };

    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"];
    const handleActivity = () => resetTimer();

    if (user) {
      events.forEach((event) => window.addEventListener(event, handleActivity));
      resetTimer();
    }

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user]);

  const login = async (email?: string, password: string = "", phoneNumber?: string) => {
    try {
      const validatedUser = await validateCredentials(email, password, phoneNumber)
      if (validatedUser) {
        setUser(validatedUser)
        if (typeof window !== 'undefined') {
          localStorage.setItem("user", JSON.stringify(validatedUser))
        }
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Login failed";
      throw error;
    }
  }

  const loginWithData = (userData: User) => {
    setUser(userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem("user", JSON.stringify(userData));
    }
  }


  const logout = () => {
    const { authService } = require('@/lib/services/auth-service')
    authService.logout()
    setUser(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem("user")
    }
  }

  const canAccess = (requiredRoles: UserRole[]) => {
    if (!user) return false
    return requiredRoles.includes(user.role)
  }

  const hasPermission = (permission: string): boolean => {
    // 1. Get role from state or localStorage
    let currentRole: string | undefined = user?.role;
    if (!currentRole && typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      if (stored) {
        try { currentRole = JSON.parse(stored).role; } catch (e) { }
      }
    }

    if (!currentRole) return false;

    const roleName = currentRole.toString().toUpperCase();

    // 2. Full access for Admin roles
    if (
      roleName === 'SYSTEM_SUPER_ADMIN' ||
      roleName === 'SYSTEM_ADMIN' ||
      roleName.includes('ADMIN')
    ) {
      return true;
    }

    // 3. Specific permissions
    if (user?.permissions && Array.isArray(user.permissions)) {
      if (user.permissions.includes(permission)) return true;
    }

    // 4. Default permissions from config
    const defaultPerms = DEFAULT_PERMISSIONS_BY_ROLE[currentRole] ||
      DEFAULT_PERMISSIONS_BY_ROLE[roleName] || [];
    return defaultPerms.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isServerActive,
      isCheckingServer,
      login,
      loginWithData,
      logout,
      canAccess,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  )
}



export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
