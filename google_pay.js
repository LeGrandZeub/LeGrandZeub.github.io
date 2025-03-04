// 1️⃣ Définition de la configuration Google Pay
const baseRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
};

// 2️⃣ Vérification et correction de l'environnement sécurisé
if (window.location.protocol !== "https:") {
  console.warn("⚠️ Google Pay doit être utilisé en HTTPS ! Essayez ngrok ou un serveur local sécurisé.");
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

  // ✅ Ouvre Google Pay dans un **nouvel onglet** au lieu d'une popup
  alert("Google Pay va s'ouvrir dans un nouvel onglet.");
  const newWindow = window.open('about:blank', '_blank');
  
  if (!newWindow) {
    console.error("❌ Impossible d'ouvrir un nouvel onglet. Vérifie les permissions du navigateur.");
    return;
  }

  client.loadPaymentData(paymentDataRequest)
    .then(function(paymentData) {
      console.log("✅ Données de paiement Google Pay reçues :", paymentData);
      sendPaymentTokenToFlutter(paymentData);

      // ✅ Ferme l'onglet une fois le paiement validé
      if (newWindow) {
        newWindow.close();
      }
    })
    .catch(function(err) {
      console.error("❌ Erreur Google Pay :", err);
      
      // ❌ Ferme l'onglet si une erreur survient
      if (newWindow) {
        newWindow.close();
      }
    });
}

// 🔟 Envoi du token Google Pay à Flutter via JavaScriptChannel
function sendPaymentTokenToFlutter(paymentData) {
  if (!paymentData || !paymentData.paymentMethodData) {
    console.error("❌ Données de paiement invalides !");
    return;
  }

  const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
  console.log("🎯 Token Google Pay :", paymentToken);

  // ✅ Vérifie si Flutter peut recevoir les données
  if (window.PaymentResponseChannel) {
    console.log("📡 Envoi du token à Flutter...");
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
