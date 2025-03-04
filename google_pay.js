// 1️⃣ Définition de la configuration Google Pay
const baseRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
};

// 2️⃣ Vérification et correction de l'environnement sécurisé
if (window.location.protocol !== "https:") {
  console.warn("⚠️ Google Pay doit être utilisé en HTTPS ! Essayez GitHub Pages ou un serveur local sécurisé.");
}

// 3️⃣ Cartes et méthodes d'authentification autorisées
const allowedCardNetworks = ["VISA", "MASTERCARD"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

// 4️⃣ Configuration de la tokenisation pour SumUp
const tokenizationSpecification = {
  type: 'PAYMENT_GATEWAY',
  parameters: {
    gateway: 'sumup',
    gatewayMerchantId: 'MC797RN3'
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

// 6️⃣ Initialisation du client Google Pay
let paymentsClient = null;
function getGooglePaymentsClient() {
  if (paymentsClient === null) {
    console.log("📌 Initialisation de Google PaymentsClient...");
    try {
      paymentsClient = new google.payments.api.PaymentsClient({
        environment: 'TEST',
        merchantInfo: {
          merchantName: "Louqo",
        },
        paymentDataCallbacks: {
          onPaymentAuthorized: onPaymentAuthorized
        }
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
        container.innerHTML = ""; // Nettoie le container

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

// 8️⃣ Génération dynamique de la requête de paiement
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

// 9️⃣ Clic sur le bouton Google Pay
function onGooglePayButtonClicked(amount) {
  console.log("🛒 Paiement Google Pay demandé pour :", amount, "EUR");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google PaymentsClient non initialisé.");
    return;
  }

  const paymentDataRequest = getPaymentDataRequest(amount);

  // ✅ Force l'utilisation du mode "overlay" pour éviter les popups bloquées
  client.loadPaymentData(paymentDataRequest)
  .then(function(paymentData) {
    console.log("✅ Données de paiement Google Pay reçues :", paymentData);
    sendPaymentTokenToFlutter(paymentData);
  })
  .catch(function(err) {
    console.error("❌ Erreur Google Pay :", err);
  });
}

// 🔟 Gère l'autorisation du paiement
function onPaymentAuthorized(paymentData) {
  console.log("💳 Paiement autorisé :", paymentData);

  sendPaymentTokenToFlutter(paymentData);
  return { transactionState: 'SUCCESS' };
}

// 🔟 Envoi du token Google Pay à Flutter via JavaScriptChannel
function sendPaymentTokenToFlutter(paymentData) {
  if (!paymentData || !paymentData.paymentMethodData) {
    console.error("❌ Données de paiement invalides !");
    return;
  }

  const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
  console.log("🎯 Token Google Pay :", paymentToken);

  // ✅ Vérifie que Flutter est bien en écoute avant d'envoyer
  if (window.opener) {
    window.opener.postMessage(JSON.stringify({
      type: "GOOGLE_PAY",
      token: paymentToken
    }), "*"); // Utilisation de "*" au lieu de "null" pour éviter l'erreur de targetOrigin
  } else {
    console.error("❌ Aucune fenêtre parent trouvée pour envoyer le token !");
  }
}

// 1️⃣1️⃣ Expose la fonction globalement pour que Flutter puisse l’appeler
window.displayGooglePayButton = displayGooglePayButton;
