"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "../context/auth-context";
import { getSocket } from "@/lib/socket";

import apiClient from "@/lib/api-client";
import { requestNotificationPermission, onMessageListener } from "@/lib/firebase";


interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    data: any;
    isRead: boolean;
    createdAt: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadNotifications();
            registerFcmToken();

            const socket = getSocket(user.id, user.role);

            socket.on("notification", (notification: Notification) => {
                setNotifications((prev) => [notification, ...prev]);
            });

            socket.on("unread_count", (data: { count: number }) => {
                setUnreadCount(data.count);
            });

            // Firebase foreground listener
            const unsubscribeOnMessage = onMessageListener()?.then((payload: any) => {
                if (payload) {
                    console.log("Foreground message received:", payload);
                    // Socket already handles this in most cases, but we can do it here too if needed
                }
            });

            return () => {
                socket.off("notification");
                socket.off("unread_count");
            };
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            setLoading(true);
            const res = await apiClient.get("/notifications");
            // Backend wraps data in a ServiceResponse shape: { success: true, data: [...] }
            setNotifications(res.data?.data || res.data || []);

            const countRes = await apiClient.get("/notifications/unread-count");
            setUnreadCount(countRes.data?.data?.count ?? countRes.data?.count ?? 0);
        } catch (error) {
            console.error("Failed to load notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const registerFcmToken = async () => {
        try {
            const token = await requestNotificationPermission();
            if (token) {
                await apiClient.post("/notifications/fcm-token", { token });
                console.log("FCM Token registered successfully");
            }
        } catch (error) {
            console.error("Failed to register FCM token:", error);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await apiClient.post(`/notifications/${id}/mark-read`);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await apiClient.post("/notifications/mark-all-read");
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <NotificationContext.Provider
            value={{ notifications, unreadCount, markAsRead, markAllAsRead, loading }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error("useNotifications must be used within a NotificationProvider");
    }
    return context;
};
