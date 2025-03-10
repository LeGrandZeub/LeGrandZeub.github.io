// ✅ 1️⃣ Définition de la configuration Google Pay
const baseRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
};

// ✅ 2️⃣ Vérification de l'environnement sécurisé
if (window.location.protocol !== "https:") {
  console.warn("⚠️ Google Pay doit être utilisé en HTTPS ! Essayez GitHub Pages ou un serveur local sécurisé.");
}

// ✅ 3️⃣ Cartes et méthodes d'authentification autorisées
const allowedCardNetworks = ["VISA", "MASTERCARD"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

// ✅ 4️⃣ Configuration de la tokenisation pour SumUp
const tokenizationSpecification = {
  type: "PAYMENT_GATEWAY",
  parameters: {
    gateway: "sumup",
    gatewayMerchantId: "MC797RN3", // Remplace avec ton Merchant ID SumUp
  },
};

// ✅ 5️⃣ Définition des méthodes de paiement autorisées
const allowedPaymentMethods = [
  {
    type: "CARD",
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks,
    },
    tokenizationSpecification: tokenizationSpecification,
  },
];

// ✅ 6️⃣ Déclaration du client Google Pay (initialisé après le chargement du SDK)
let paymentsClient = null;

// ✅ 7️⃣ Fonction qui s'exécute APRES le chargement du SDK Google Pay
function onGooglePayLoaded() {
  console.log("✅ Google Pay SDK chargé !");
  checkGooglePayAvailability();
}

// ✅ 8️⃣ Fonction qui initialise Google Pay uniquement après le chargement du SDK
function getGooglePaymentsClient() {
  if (!window.google || !window.google.payments) {
    console.error("❌ L'API Google Pay n'est pas disponible !");
    return null;
  }

  if (paymentsClient === null) {
    console.log("📌 Initialisation de Google PaymentsClient...");
    try {
      paymentsClient = new google.payments.api.PaymentsClient({
        environment: "TEST",
        merchantInfo: {
          merchantName: "Louqo",
          merchantId: "BCR2DN4T777KLZBX", // Remplace avec ton vrai Merchant ID
        },
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation de Google Pay :", error);
      return null;
    }
  }
  return paymentsClient;
}

// ✅ 9️⃣ Vérifier si Google Pay est disponible
function checkGooglePayAvailability() {
  console.log("🔎 Vérification de Google Pay...");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay client non initialisé.");
    return;
  }

  client
    .isReadyToPay({
      apiVersion: 2,
      apiVersionMinor: 0,
      allowedPaymentMethods: allowedPaymentMethods,
    })
    .then(function (response) {
      console.log("🔍 Réponse Google Pay :", response);

      if (response.result) {
        console.log("✅ Google Pay est disponible. Ajout du bouton...");
        displayGooglePayButton();
      } else {
        console.warn("❌ Google Pay non disponible sur ce navigateur.");
      }
    })
    .catch(function (err) {
      console.error("❌ Erreur lors de la vérification de Google Pay :", err);
    });
}

// ✅ 🔟 Affichage du bouton Google Pay après confirmation de disponibilité
function displayGooglePayButton() {
  console.log("📌 Affichage du bouton Google Pay...");

  let container = document.getElementById("googlePayButtonContainer");

  if (!container) {
    console.error("❌ Conteneur du bouton Google Pay introuvable. Vérification dans 500ms...");
    setTimeout(displayGooglePayButton, 500); // Réessaye après 500ms
    return;
  }

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay client non initialisé.");
    return;
  }

  const button = client.createButton({
    onClick: function () {
      console.log("🛒 Clic sur le bouton Google Pay !");
      processGooglePayPayment();
    },
  });

  container.innerHTML = ""; // Nettoie le conteneur avant d'ajouter le bouton
  container.appendChild(button);
}

// ✅ 1️⃣1️⃣ Simulation de paiement Google Pay
function processGooglePayPayment() {
  console.log("🚀 Paiement Google Pay en cours...");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay client non initialisé.");
    return;
  }

  const paymentDataRequest = {
    ...baseRequest,
    allowedPaymentMethods: allowedPaymentMethods,
    merchantInfo: {
      merchantName: "Louqo",
      merchantId: "BCR2DN4T777KLZBX",
    },
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPrice: "1.00", // À adapter dynamiquement
      currencyCode: "EUR",
    },
  };

  client
    .loadPaymentData(paymentDataRequest)
    .then(function (paymentData) {
      console.log("✅ Paiement Google Pay réussi :", paymentData);
      alert("Paiement réussi !");
    })
    .catch(function (err) {
      console.warn("⚠️ Paiement Google Pay annulé ou échoué :", err);
    });
}

// ✅ Forcer l'exécution après le chargement du DOM
document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ DOM entièrement chargé, lancement de checkGooglePayAvailability...");
  checkGooglePayAvailability();
});
