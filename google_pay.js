console.log("📌 Initialisation du script Google Pay...");

// ✅ Configuration Google Pay
const googlePayClient = new google.payments.api.PaymentsClient({
  environment: "PRODUCTION", // Utiliser "TEST" pour les tests
});

// ✅ Vérifier si Google Pay est disponible sur le navigateur
function checkGooglePayAvailability() {
  console.log("🔎 Vérification de Google Pay...");

  const paymentRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
        },
      },
    ],
  };

  googlePayClient
    .isReadyToPay(paymentRequest)
    .then((response) => {
      if (response.result) {
        console.log("✅ Google Pay est disponible.");
        prefillCardWithGooglePay();
      } else {
        console.log("❌ Google Pay n'est pas disponible.");
      }
    })
    .catch((error) => {
      console.error("❌ Erreur Google Pay :", error);
    });
}

// ✅ Pré-remplir les champs de la carte avec Google Pay
function prefillCardWithGooglePay() {
  console.log("📝 Pré-remplissage des champs de carte avec Google Pay...");

  const paymentDataRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
    allowedPaymentMethods: [
      {
        type: "CARD",
        parameters: {
          allowedAuthMethods: ["PAN_ONLY", "CRYPTOGRAM_3DS"],
          allowedCardNetworks: ["VISA", "MASTERCARD", "AMEX"],
        },
        tokenizationSpecification: {
          type: "PAYMENT_GATEWAY",
          parameters: {
            gateway: "example", // Remplacer par ton fournisseur de paiement (ex: "sumup")
            gatewayMerchantId: "exampleMerchantId",
          },
        },
      },
    ],
    transactionInfo: {
      totalPriceStatus: "FINAL",
      totalPrice: "1.00", // 💰 Mettre ici le montant réel
      currencyCode: "EUR",
    },
    merchantInfo: {
      merchantName: "Louqo",
      merchantId: "BCR2DN4T5Y3JH3P", // Remplace par ton vrai Merchant ID Google Pay
    },
  };

  googlePayClient
    .loadPaymentData(paymentDataRequest)
    .then((paymentData) => {
      console.log("✅ Données de paiement récupérées :", paymentData);
      fillCardFields(paymentData.paymentMethodData);
    })
    .catch((error) => {
      console.error("❌ Erreur lors du remplissage des champs de carte :", error);
    });
}

// ✅ Remplir les champs carte dans SumUp
function fillCardFields(paymentMethodData) {
  console.log("🎯 Remplissage des champs avec Google Pay...");

  if (!paymentMethodData || !paymentMethodData.info) {
    console.error("❌ Aucune donnée de carte disponible.");
    return;
  }

  const cardDetails = paymentMethodData.info;

  // Exemple : remplir les champs dans SumUp (remplace ces IDs si besoin)
  document.querySelector("#sumup-card-number").value = cardDetails.cardDetails || "";
  document.querySelector("#sumup-card-expiry").value = cardDetails.expirationMonth + "/" + cardDetails.expirationYear;
  document.querySelector("#sumup-card-cvv").value = ""; // Google Pay ne fournit pas le CVV pour des raisons de sécurité

  console.log("✅ Champs de carte pré-remplis !");
}

// ✅ Exécuter la vérification de Google Pay dès le chargement
window.onload = function () {
  checkGooglePayAvailability();
};
