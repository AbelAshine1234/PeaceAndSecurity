"use client"

import { useCallback } from "react"
import { useAppSelector, useAppDispatch } from "@/lib/store/hooks"
import {
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/store/notificationSlice"

export const useNotifications = () => {
  const dispatch = useAppDispatch()
  const notifications = useAppSelector(selectNotifications)
  const unreadCount = useAppSelector(selectUnreadCount)
  const loading = useAppSelector(selectNotificationsLoading)

  const markAsRead = useCallback(
    (id: string) => {
      dispatch(markNotificationAsRead(id))
    },
    [dispatch]
  )

  const markAllAsRead = useCallback(() => {
    dispatch(markAllNotificationsAsRead())
  }, [dispatch])

  return { notifications, unreadCount, markAsRead, markAllAsRead, loading }
}
