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
    gatewayMerchantId: 'M7D76C3A' // ✅ Remplacé par ton vrai merchant ID
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
        environment: 'PRODUCTION', // ✅ Passé en production
        merchantInfo: {
          merchantName: "Louqo",
          merchantId: "BCR2DN4T777KLZBX" // ✅ Ton vrai merchant ID
        }
      });
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation de Google Pay :", error);
      return null;
    }
  }
  return paymentsClient;
}

// 7️⃣ Vérifier si Google Pay est disponible pour pré-remplir les champs de carte
function checkGooglePayAvailability() {
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
      console.log("✅ Google Pay est disponible. Pré-remplissage activé.");

      // ✅ Auto-remplissage des champs carte via Google Pay
      autofillCardDetails();
    } else {
      console.warn("❌ Google Pay non disponible sur ce navigateur.");
    }
  })
  .catch(function(err) {
    console.error("❌ Erreur lors de la vérification de Google Pay :", err);
  });
}

// 8️⃣ Récupère et pré-remplit les informations de carte bancaire
function autofillCardDetails() {
  console.log("📝 Demande d'auto-remplissage des cartes...");

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay Client non initialisé.");
    return;
  }

  const paymentDataRequest = {
    ...baseRequest,
    allowedPaymentMethods: allowedPaymentMethods,
    merchantInfo: {
      merchantName: "Louqo",
      merchantId: "BCR2DN4T777KLZBX"
    },
    transactionInfo: {
      totalPriceStatus: 'NOT_CURRENTLY_KNOWN',
      currencyCode: 'EUR'
    }
  };

  client.loadPaymentData(paymentDataRequest)
  .then(function(paymentData) {
    console.log("✅ Données de paiement Google Pay reçues :", paymentData);
    
    const cardInfo = paymentData.paymentMethodData.info;
    const billingAddress = cardInfo.billingAddress;

    // ✅ Pré-remplissage des champs du formulaire
    document.getElementById("cardNumber").value = cardInfo.cardDetails || "";
    document.getElementById("cardNetwork").value = cardInfo.cardNetwork || "";
    document.getElementById("cardName").value = billingAddress.name || "";
    document.getElementById("cardExpiry").value = billingAddress.expirationMonth + "/" + billingAddress.expirationYear || "";
    
    console.log("🎯 Champs de carte pré-remplis !");
  })
  .catch(function(err) {
    console.warn("⚠️ Impossible de pré-remplir les champs avec Google Pay :", err);
  });
}

function launchGooglePay(totalPrice) {
  console.log("🛒 Lancement de Google Pay avec montant :", parseFloat(totalPrice).toFixed(2));

  const client = getGooglePaymentsClient();
  if (!client) {
    console.error("❌ Google Pay Client non initialisé.");
    return;
  }

  const paymentDataRequest = {
    ...baseRequest,
    allowedPaymentMethods: allowedPaymentMethods,
    merchantInfo: {
      merchantName: "Louqo",
      merchantId: "BCR2DN4T777KLZBX"
    },
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPrice: parseFloat(totalPrice).toFixed(2), // ✅ Vérification du format
      currencyCode: 'EUR'
    }
  };

  client.loadPaymentData(paymentDataRequest)
    .then(function(paymentData) {

      if (!paymentData || !paymentData.paymentMethodData || 
          !paymentData.paymentMethodData.tokenizationData || 
          !paymentData.paymentMethodData.tokenizationData.token) {
        console.error("❌ Erreur : Token Google Pay introuvable !");
        return;
      }

      const rawToken = paymentData.paymentMethodData.tokenizationData.token;
      console.log("🔍 Raw Token JSON :", rawToken);

      // 🔥 Vérifie que rawToken est bien un JSON et extrait `signedMessage`
      let parsedToken;
      try {
        parsedToken = JSON.parse(rawToken);
        console.log("📦 Token JSON bien parsé :", parsedToken);
      } catch (error) {
        console.error("❌ Erreur lors du parsing du token JSON :", error);
      }

      const paymentToken = parsedToken ? parsedToken.signedMessage : null;

      if (!paymentToken) {
        console.error("❌ Erreur : Impossible d'extraire `signedMessage` du token !");
        return;
      }

      console.log("🔑 Token Google Pay extrait :", paymentToken);

      // 🧾 Envoi du token au back-end pour validation du paiement via SumUp
      fetch("/api/payments/googlepay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          googlePayToken: paymentToken,
          amount: parseFloat(totalPrice).toFixed(2),
          currency: "EUR"
        })
      })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log("✅ Paiement validé par SumUp :", data);
            if (window.postMessage) {
              window.postMessage({ type: "paymentSuccess", token: JSON.stringify(paymentToken) }, "*");
            }
          } else {
            console.error("❌ Erreur de paiement confirmée par SumUp :", data.error);
            if (window.postMessage) {
              window.postMessage({ type: "paymentError", error: data.error }, "*");
            }
          }
        })
        .catch(error => {
          console.error("❌ Erreur réseau ou serveur pendant validation SumUp :", error);
          if (window.postMessage) {
            window.postMessage({ type: "paymentError", error: error.message }, "*");
          }
        });

    })
    .catch(function(err) {
      console.warn("⚠️ Paiement annulé ou échoué :", err);
    });
}

// 🔟 Expose la fonction pour Flutter
window.launchGooglePay = launchGooglePay;


// 🔟 Expose la fonction globalement pour que Flutter puisse l’appeler
window.checkGooglePayAvailability = checkGooglePayAvailability;
