importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js");

// 🔥 Remplace ces valeurs par celles de ton projet Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCq3vbwnUxKzARVJf9hv2FZw-n0fkdWUCg",
  authDomain: "louqo-77593.firebaseapp.com",
  projectId: "louqo-77593",
  storageBucket: "louqo-77593.firebasestorage.app",
  messagingSenderId: "489535153042",
  appId: "1:489535153042:web:49ce6e1e4052d226abd74b",
};

// 📌 Initialisation de Firebase
firebase.initializeApp(firebaseConfig);

// ✅ Initialisation du service Firebase Messaging
const messaging = firebase.messaging();

// 📩 Gestion des notifications en arrière-plan
messaging.onBackgroundMessage((payload) => {
  console.log("📩 Notification en arrière-plan reçue :", payload);

  const notificationTitle = payload.notification?.title || "Nouvelle notification";
  const notificationOptions = {
    body: payload.notification?.body || "Vous avez une nouvelle notification.",
    icon: "/icons/Icon-192.png"
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// ✅ Écoute l'événement de clic sur la notification
self.addEventListener("notificationclick", (event) => {
  console.log("🔔 Notification cliquée :", event.notification);

  event.notification.close(); // Ferme la notification
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus(); // Ramène la page en avant si elle est déjà ouverte
      } else {
        clients.openWindow("/"); // Ouvre la page de ton application si elle est fermée
      }
    })
  );
});
