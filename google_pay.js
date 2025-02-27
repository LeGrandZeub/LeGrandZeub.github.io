// google_pay.js

// 1. Définir la configuration de base pour Google Pay
const baseRequest = {
    apiVersion: 2,
    apiVersionMinor: 0,
  };
  
  // 2. Définir les réseaux de cartes et les méthodes d’authentification autorisées
  const allowedCardNetworks = ["VISA", "MASTERCARD"];
  const allowedCardAuthMethods = ["PAN_ONLY", "CRYPTOGRAM_3DS"];
  
  // 3. Configurer la tokenization pour SumUp
  const tokenizationSpecification = {
    type: 'PAYMENT_GATEWAY',
    parameters: {
      gateway: 'sumup', // Indique que SumUp est utilisé comme passerelle
      gatewayMerchantId: 'MC797RN3' // Remplacez par votre ID marchand SumUp
    }
  };
  
  // 4. Définir les méthodes de paiement autorisées
  const allowedPaymentMethods = [{
    type: 'CARD',
    parameters: {
      allowedAuthMethods: allowedCardAuthMethods,
      allowedCardNetworks: allowedCardNetworks,
    },
    tokenizationSpecification: tokenizationSpecification,
  }];
  
  // 5. Construire l'objet PaymentDataRequest complet
  const paymentDataRequest = Object.assign({}, baseRequest);
  paymentDataRequest.allowedPaymentMethods = allowedPaymentMethods;
  paymentDataRequest.merchantInfo = {
    merchantId: 'YOUR_GOOGLE_MERCHANT_ID',  // Optionnel selon vos besoins
    merchantName: 'Louqo'        // Remplacez par le nom de votre entreprise
  };
  paymentDataRequest.transactionInfo = {
    totalPriceStatus: 'FINAL',
    totalPrice: '1.00',   // Ce montant devra être dynamique selon la commande
    currencyCode: 'EUR'   // Changez selon la devise souhaitée (par ex. EUR)
  };
  
  // 6. Initialiser l'instance PaymentsClient en mode TEST
  const paymentsClient = new google.payments.api.PaymentsClient({ environment: 'TEST' });
  
  // 7. Vérifier si Google Pay est disponible et afficher le bouton
  paymentsClient.isReadyToPay({ allowedPaymentMethods: allowedPaymentMethods })
    .then(function(response) {
      if (response.result) {
        const button = paymentsClient.createButton({
          onClick: onGooglePayButtonClicked,
          buttonColor: 'black',
          buttonType: 'long'
        });
        const container = document.getElementById('google-pay-container');
        if (container) {
          container.appendChild(button);
        } else {
          console.error('Élément avec l\'ID "google-pay-container" introuvable.');
        }
      } else {
        console.error('Google Pay n\'est pas disponible.');
      }
    })
    .catch(function(err) {
      console.error("Erreur lors de la vérification de la disponibilité de Google Pay :", err);
    });
  
  // 8. Fonction appelée lors du clic sur le bouton Google Pay
  function onGooglePayButtonClicked() {
    paymentsClient.loadPaymentData(paymentDataRequest)
      .then(function(paymentData) {
        console.log("Données de paiement reçues :", paymentData);
        // Traitez le paiement en envoyant le token à votre backend
        processGooglePayPayment(paymentData);
      })
      .catch(function(err) {
        console.error("Erreur lors du chargement des données de paiement :", err);
      });
  }
  
  // 9. Fonction de traitement du paiement : envoi du token à votre backend pour finaliser le paiement via SumUp
  function processGooglePayPayment(paymentData) {
    // Extraire le token de paiement. La structure peut varier en fonction de la configuration.
    const paymentToken = paymentData.paymentMethodData.tokenizationData.token;
    console.log("Token de paiement :", paymentToken);
  
    // Exemple : Envoyer ce token à votre backend via une requête fetch
    fetch('/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentToken: paymentToken,
        // Ajoutez d'autres données pertinentes, comme le montant ou les détails de la commande
      })
    })
    .then(response => response.json())
    .then(data => {
      console.log("Paiement traité avec succès :", data);
      // Redirigez l'utilisateur vers une page de confirmation, par exemple
    })
    .catch(error => {
      console.error("Erreur lors du traitement du paiement :", error);
    });
  }
  