"use client"

import type React from "react"
import { useEffect, useRef } from "react"
import { Provider } from "react-redux"
import { makeStore, type AppStore } from "@/lib/store/store"
import { checkServer, initAuth, logout } from "@/lib/store/authSlice"
import {
  loadNotifications,
  addNotification,
  setUnreadCount,
} from "@/lib/store/notificationSlice"
import { getSocket } from "@/lib/socket"
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase"

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>()
  if (!storeRef.current) {
    storeRef.current = makeStore()
  }
  const store = storeRef.current

  // Initialize auth: check server, load stored user
  useEffect(() => {
    store.dispatch(checkServer())
    store.dispatch(initAuth())
  }, [store])

  // Idle timeout: logout after 10 minutes of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout
    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId)
      const user = store.getState().auth.user
      if (user) {
        timeoutId = setTimeout(() => {
          console.warn("User inactive for 10 minutes. Logging out.")
          store.dispatch(logout())
          window.location.href = "/"
        }, 10 * 60 * 1000)
      }
    }
    const events = ["mousedown", "mousemove", "keypress", "scroll", "touchstart"]
    const handleActivity = () => resetTimer()

    const unsubscribe = store.subscribe(() => {
      const user = store.getState().auth.user
      if (user) {
        events.forEach((e) => window.addEventListener(e, handleActivity))
        resetTimer()
      } else {
        events.forEach((e) => window.removeEventListener(e, handleActivity))
        if (timeoutId) clearTimeout(timeoutId)
      }
    })

    const user = store.getState().auth.user
    if (user) {
      events.forEach((e) => window.addEventListener(e, handleActivity))
      resetTimer()
    }

    return () => {
      unsubscribe()
      events.forEach((e) => window.removeEventListener(e, handleActivity))
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [store])

  // Socket + notifications when user logs in (track user changes via ref)
  useEffect(() => {
    let socketCleanup: (() => void) | undefined
    let prevUserId: string | undefined

    const unsubscribe = store.subscribe(() => {
      const user = store.getState().auth.user
      const userId = user?.id

      if (userId && userId !== prevUserId) {
        prevUserId = userId
        store.dispatch(loadNotifications())

        requestNotificationPermission()
          .then((token) => {
            if (token) {
              import("@/lib/api-client").then(({ default: apiClient }) => {
                apiClient.post("/notifications/fcm-token", { token })
              })
            }
          })
          .catch(() => {})

        socketCleanup?.()
        const socket = getSocket(user.id, user.role)

        const onNotification = (notification: any) => {
          store.dispatch(addNotification(notification))
        }
        const onUnreadCount = (data: { count: number }) => {
          store.dispatch(setUnreadCount(data.count))
        }

        socket.on("notification", onNotification)
        socket.on("unread_count", onUnreadCount)

        onMessageListener()?.catch(() => {})

        socketCleanup = () => {
          socket.off("notification", onNotification)
          socket.off("unread_count", onUnreadCount)
        }
      } else if (!userId && prevUserId) {
        prevUserId = undefined
        socketCleanup?.()
        socketCleanup = undefined
      }
    })

    return () => {
      unsubscribe()
      socketCleanup?.()
    }
  }, [store])

  return <Provider store={store}>{children}</Provider>
}
