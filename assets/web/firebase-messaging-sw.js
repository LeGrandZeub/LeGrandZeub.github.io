importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Configuration Firebase – utilisez exactement les mêmes valeurs que dans firebase_options.dart
const firebaseConfig = {
  apiKey: "AIzaSyCq3vbwnUxKzARVJf9hv2FZw-n0fkdWUCg",
  authDomain: "louqo-77593.firebaseapp.com",
  projectId: "louqo-77593",
  storageBucket: "louqo-77593.firebasestorage.app",
  messagingSenderId: "489535153042",
  appId: "1:489535153042:web:49ce6e1e4052d226abd74b"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// Initialisation du service Firebase Messaging
const messaging = firebase.messaging();

// Gestion des notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Notification en arrière-plan reçue :", payload);
  const notificationTitle = payload.notification?.title || "Nouvelle notification";
  const notificationOptions = {
    body: payload.notification?.body || "Vous avez une nouvelle notification.",
    icon: "/icons/Icon-192.png"  // Vérifiez que ce chemin est correct
  };
  //self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer l'événement de clic sur la notification
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification cliquée :", event.notification);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow("/");
    })
  );
});
