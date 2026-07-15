import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import apiClient from '@/lib/api-client'

export interface Notification {
  id: string
  title: string
  message: string
  type: string
  data: any
  isRead: boolean
  createdAt: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  loading: boolean
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
}

export const loadNotifications = createAsyncThunk('notifications/load', async () => {
  const res = await apiClient.get('/notifications')
  const notifications = res.data?.data || res.data || []
  const countRes = await apiClient.get('/notifications/unread-count')
  const unreadCount = countRes.data?.data?.count ?? countRes.data?.count ?? 0
  return { notifications, unreadCount }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(state, action: PayloadAction<Notification>) {
      state.notifications.unshift(action.payload)
    },
    setUnreadCount(state, action: PayloadAction<number>) {
      state.unreadCount = action.payload
    },
    markAsRead(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, isRead: true } : n
      )
      state.unreadCount = Math.max(0, state.unreadCount - 1)
    },
    markAllAsRead(state) {
      state.notifications = state.notifications.map((n) => ({ ...n, isRead: true }))
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadNotifications.pending, (state) => {
        state.loading = true
      })
      .addCase(loadNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload.notifications
        state.unreadCount = action.payload.unreadCount
        state.loading = false
      })
      .addCase(loadNotifications.rejected, (state) => {
        state.loading = false
      })
  },
})

export const { addNotification, setUnreadCount, markAsRead, markAllAsRead } = notificationSlice.actions

// Thunks for API calls
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markRead',
  async (id: string, { dispatch }) => {
    await apiClient.post(`/notifications/${id}/mark-read`)
    dispatch(markAsRead(id))
  }
)

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllRead',
  async (_, { dispatch }) => {
    await apiClient.post('/notifications/mark-all-read')
    dispatch(markAllAsRead())
  }
)

// Selectors
export const selectNotifications = (state: { notifications: NotificationState }) => state.notifications.notifications
export const selectUnreadCount = (state: { notifications: NotificationState }) => state.notifications.unreadCount
export const selectNotificationsLoading = (state: { notifications: NotificationState }) => state.notifications.loading

export default notificationSlice.reducer
