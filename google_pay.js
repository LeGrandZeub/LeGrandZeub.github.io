// 1️⃣ Définition de la configuration Google Pay
const baseRequest = {
  apiVersion: 2,
  apiVersionMinor: 0,
};

const allowedCardNetworks = ["VISA", "MASTERCARD"];
const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];

// 2️⃣ Configuration de la tokenisation pour SumUp
const tokenizationSpecification = {
  type: 'PAYMENT_GATEWAY',
  parameters: {
    gateway: 'sumup', // ✅ SumUp comme passerelle de paiement
    gatewayMerchantId: 'MC797RN3' // ✅ Remplace par ton vrai merchant ID SumUp
  }
};

// 3️⃣ Définition des méthodes de paiement autorisées
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

// 4️⃣ Fonction pour récupérer un client Google Pay initialisé
let paymentsClient = null;

function getGooglePaymentsClient() {
  if (paymentsClient === null) {
    console.log("📌 Initialisation de Google PaymentsClient...");
    try {
      paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation de Google Pay :", error);
      return null;
    }
  }
  return paymentsClient;
}

// 5️⃣ Vérifier si Google Pay est disponible et afficher le bouton
function displayGooglePayButton(amount) {
  console.log("🔎 Vérification de Google Pay...");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay client non initialisé.");
    return;
  }

  client.isReadyToPay({ allowedPaymentMethods })
    .then(function(response) {
      console.log("🔍 Google Pay response:", response); // ✅ Debug response
      if (response.result) {
        console.log("✅ Google Pay est disponible. Ajout du bouton...");

        // Évite de créer plusieurs boutons en réinitialisant `google-pay-container`
        const container = document.getElementById('google-pay-container');
        if (container) {
          container.innerHTML = ""; // ✅ Nettoie le container
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

// 6️⃣ Fonction pour générer dynamiquement la requête de paiement
function getPaymentDataRequest(amount) {
  return {
    ...baseRequest,
    allowedPaymentMethods: allowedPaymentMethods,
    merchantInfo: {
      merchantName: 'Louqo',
    },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: amount.toFixed(2), // ✅ Montant dynamique depuis Flutter
      currencyCode: 'EUR'
    }
  };
}

// 7️⃣ Fonction appelée lors du clic sur le bouton Google Pay
function onGooglePayButtonClicked(amount) {
  console.log("🛒 Paiement Google Pay demandé pour :", amount, "EUR");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google PaymentsClient non initialisé.");
    return;
  }

  const paymentDataRequest = getPaymentDataRequest(amount);

  // ✅ Ouvre un nouvel onglet avant d'exécuter Google Pay pour éviter les blocages
  const newTab = window.open("about:blank", "_blank");

  client.loadPaymentData(paymentDataRequest)
    .then(function(paymentData) {
      console.log("✅ Données de paiement Google Pay reçues :", paymentData);
      sendPaymentTokenToFlutter(paymentData);
    })
    .catch(function(err) {
      console.error("❌ Erreur Google Pay :", err);

      // ✅ Redirige vers une page Google Pay si la popup est bloquée
      const googlePayUrl = "https://pay.google.com/gp/w/u/0/home/signup";
      if (newTab) {
        newTab.location.href = googlePayUrl;
      } else {
        window.open(googlePayUrl, "_blank");
      }
    });
}

// 8️⃣ Fonction pour envoyer le token Google Pay à Flutter via JavaScriptChannel
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

// 9️⃣ Expose la fonction globalement pour que Flutter puisse l’appeler
window.displayGooglePayButton = displayGooglePayButton;
