// 1️⃣ Définition de la configuration Google Pay
const baseRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
};

// 2️⃣ Vérifier si on est en localhost et autoriser Google Pay
if (window.location.hostname === "localhost") {
  console.warn("⚠️ Google Pay autorisé sur localhost en mode TEST !");
  baseRequest.environment = "TEST";  // Force le mode TEST sur localhost
}

// 3️⃣ Cartes et méthodes d'authentification autorisées
const allowedCardNetworks = ["VISA", "MASTERCARD"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

// 4️⃣ Configuration de la tokenisation pour SumUp
const tokenizationSpecification = {
  type: 'PAYMENT_GATEWAY',
  parameters: {
    gateway: 'sumup', // ✅ SumUp comme passerelle de paiement
    gatewayMerchantId: 'MC797RN3' // ✅ Remplace par ton vrai merchant ID SumUp
  }
};

// 5️⃣ Définition des méthodes de paiement autorisées
const allowedPaymentMethods = [
  {
    type: 'CARD',
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks,
    },
    tokenizationSpecification: tokenizationSpecification,
  }
];

// 6️⃣ Fonction pour récupérer un client Google Pay initialisé
let paymentsClient = null;

function getGooglePaymentsClient() {
  if (paymentsClient === null) {
    console.log("📌 Initialisation de Google PaymentsClient...");
    try {
      paymentsClient = new google.payments.api.PaymentsClient({
        environment: baseRequest.environment || 'TEST', // ✅ Utilisation de TEST si non défini
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation de Google Pay :", error);
      return null;
    }
  }
  return paymentsClient;
}

// 7️⃣ Vérifier si Google Pay est disponible et afficher le bouton
function displayGooglePayButton(amount) {
  console.log("🔎 Vérification de Google Pay...");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay client non initialisé.");
    return;
  }

  client.isReadyToPay({
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: allowedPaymentMethods
  })
    .then(function(response) {
      console.log("🔍 Réponse Google Pay :", response);

      if (response.result) {
        console.log("✅ Google Pay est disponible. Ajout du bouton...");

        const container = document.getElementById('google-pay-container');
        if (container) {
          container.innerHTML = ""; // ✅ Nettoie le container pour éviter les doublons

          const button = client.createButton({
            onClick: () => onGooglePayButtonClicked(amount),
            buttonColor: 'black',
            buttonType: 'long'
          });

          container.appendChild(button);
        } else {
          console.error("❌ Élément 'google-pay-container' introuvable.");
        }
      } else {
        console.error("❌ Google Pay non disponible.");
      }
    })
    .catch(function(err) {
      console.error("❌ Erreur lors de la vérification de Google Pay :", err);
    });
}

// 8️⃣ Fonction pour générer dynamiquement la requête de paiement
function getPaymentDataRequest(amount) {
  return {
    ...baseRequest,
    allowedPaymentMethods: allowedPaymentMethods,
    merchantInfo: {
      merchantName: 'Louqo',
    },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: amount.toFixed(2),
      currencyCode: 'EUR'
    }
  };
}

// 9️⃣ Fonction appelée lors du clic sur le bouton Google Pay
function onGooglePayButtonClicked(amount) {
  console.log("🛒 Paiement Google Pay demandé pour :", amount, "EUR");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google PaymentsClient non initialisé.");
    return;
  }

  const paymentDataRequest = getPaymentDataRequest(amount);
  
  // ✅ Ouvre le paiement dans un nouvel onglet
  const newWindow = window.open('', '_blank');
  
  client.loadPaymentData(paymentDataRequest)
    .then(function(paymentData) {
      console.log("✅ Données de paiement Google Pay reçues :", paymentData);
      sendPaymentTokenToFlutter(paymentData);
      if (newWindow) {
        newWindow.close();
      }
    })
    .catch(function(err) {
      console.error("❌ Erreur Google Pay :", err);
      if (newWindow) {
        newWindow.close();
      }
    });
}

// 🔟 Fonction pour envoyer le token Google Pay à Flutter via JavaScriptChannel
function sendPaymentTokenToFlutter(paymentData) {
  const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
  console.log("🎯 Token Google Pay :", paymentToken);

  if (window.PaymentResponseChannel) {
    window.PaymentResponseChannel.postMessage(JSON.stringify({
      type: "GOOGLE_PAY",
      token: paymentToken
    }));
  } else {
    console.error("❌ Flutter PaymentResponseChannel introuvable.");
  }
}

// 1️⃣1️⃣ Expose la fonction globalement pour que Flutter puisse l’appeler
window.displayGooglePayButton = displayGooglePayButton;
