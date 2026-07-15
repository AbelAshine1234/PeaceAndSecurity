import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import notificationReducer from './notificationSlice'

export const makeStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
      notifications: notificationReducer,
    },
  })

export type AppStore = ReturnType<typeof makeStore>
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']
