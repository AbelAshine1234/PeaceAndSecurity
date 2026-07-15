// Import and configure the Firebase SDK
// These scripts are made available when the app is served or deployed on Firebase Hosting
// If you're not using Firebase Hosting, you can check the standard way to import them
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCSKJNN4_Iohgh1lFlCB2EB1ZeXwz9_f04",
    authDomain: "eco-guard-aca14.firebaseapp.com",
    projectId: "eco-guard-aca14",
    storageBucket: "eco-guard-aca14.firebasestorage.app",
    messagingSenderId: "885056501229",
    appId: "1:885056501229:web:28034512e1f7a2aaa763e4"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.svg'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
