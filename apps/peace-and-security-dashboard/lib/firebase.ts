import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const initializeFirebase = () => {
    if (typeof window !== "undefined" && firebaseConfig.apiKey) {
        return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
    return null;
};

export const requestNotificationPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission === "granted") {
        const app = initializeFirebase();
        if (!app) return null;

        const messaging = getMessaging(app);
        try {
            const currentToken = await getToken(messaging, {
                vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            return currentToken;
        } catch (error) {
            console.error("An error occurred while retrieving token.", error);
            return null;
        }
    }
    return null;
};

export const onMessageListener = () => {
    const app = initializeFirebase();
    if (!app) return null;
    const messaging = getMessaging(app);
    return new Promise((resolve) => {
        onMessage(messaging, (payload) => {
            resolve(payload);
        });
    });
};
