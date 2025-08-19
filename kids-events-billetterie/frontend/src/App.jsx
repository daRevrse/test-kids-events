import React, { useState, useEffect } from "react";
import {
  QrCode,
  Scan,
  CreditCard,
  Smartphone,
  Banknote,
  Check,
  X,
  Users,
  TrendingUp,
} from "lucide-react";

// Simulateur de base de données locale
const localDB = {
  tickets: JSON.parse(localStorage.getItem("tickets") || "[]"),
  events: JSON.parse(
    localStorage.getItem("events") ||
      '[{"id":1,"nom":"Village de Noël KIDS EVENTS","prix":5000,"stock":200}]'
  ),
  transactions: JSON.parse(localStorage.getItem("transactions") || "[]"),
  codes: {
    NOEL2024: { reduction: 10, actif: true },
    FAMILLE: { reduction: 15, minBillets: 4, actif: true },
    EARLY: { reduction: 20, actif: true },
  },
};

// Générateur QR Code simulé
const generateQRCode = (data) => {
  return `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Hook pour persistance locale
const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setStoredValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
  };

  return [value, setStoredValue];
};

// Composant principal
export default function TicketingApp() {
  const [currentView, setCurrentView] = useState("qr-scan");
  const [selectedTickets, setSelectedTickets] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useLocalStorage("tickets", []);
  const [transactions, setTransactions] = useLocalStorage("transactions", []);

  const event = localDB.events[0];
  const basePrice = event.prix;
  const totalPrice =
    (basePrice * selectedTickets * (100 - promoDiscount)) / 100;

  // Validation code promo
  const validatePromoCode = () => {
    const code = localDB.codes[promoCode.toUpperCase()];
    if (code && code.actif) {
      if (code.minBillets && selectedTickets < code.minBillets) {
        alert(`Ce code nécessite minimum ${code.minBillets} billets`);
        return;
      }
      setPromoDiscount(code.reduction);
      alert(`Code appliqué ! Réduction de ${code.reduction}%`);
    } else {
      alert("Code promo invalide");
      setPromoCode("");
      setPromoDiscount(0);
    }
  };

  // Génération ticket
  const generateTicket = (paymentType) => {
    const ticket = {
      id: `TICKET_${Date.now()}`,
      eventId: event.id,
      qrCode: generateQRCode(),
      nombreBillets: selectedTickets,
      prixTotal: totalPrice,
      typePaiement: paymentType,
      codePromo: promoCode || null,
      statut: paymentType === "mobile-money" ? "confirmed" : "pending",
      dateCreation: new Date().toISOString(),
      dateValidation:
        paymentType === "mobile-money" ? new Date().toISOString() : null,
    };

    const newTickets = [...tickets, ticket];
    setTickets(newTickets);

    const transaction = {
      id: `TRANS_${Date.now()}`,
      ticketId: ticket.id,
      montant: totalPrice,
      methode: paymentType,
      statut: paymentType === "mobile-money" ? "completed" : "pending",
    };

    const newTransactions = [...transactions, transaction];
    setTransactions(newTransactions);

    return ticket;
  };

  // Simulation paiement Mobile Money
  const simulateMobileMoneyPayment = (provider) => {
    setLoading(true);
    const numbers = {
      MTN: "70123456",
      MOOV: "96123456",
      TOGOCOM: "90123456",
    };

    // Simulation délai réseau
    setTimeout(() => {
      const ticket = generateTicket("mobile-money");
      setCurrentTicket(ticket);
      setCurrentView("ticket-generated");
      setLoading(false);
    }, 3000);

    return numbers[provider];
  };

  // Composant Scan QR
  const QRScanView = () => (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-red-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <QrCode size={32} />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            Village de Noël
          </h1>
          <h2 className="text-lg text-gray-600 mb-6">KIDS EVENTS</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-6">
            <Scan size={48} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500">
              Scannez le QR code pour acheter vos billets
            </p>
          </div>

          <button
            onClick={() => setCurrentView("ticket-selection")}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Simuler scan QR Code
          </button>
        </div>
      </div>
    </div>
  );

  // Composant Sélection Billets
  const TicketSelectionView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">
            Sélection des billets
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Nombre de billets
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() =>
                  setSelectedTickets(Math.max(1, selectedTickets - 1))
                }
                className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <span className="text-2xl font-bold w-8 text-center">
                {selectedTickets}
              </span>
              <button
                onClick={() => setSelectedTickets(selectedTickets + 1)}
                className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-xl font-bold"
              >
                +
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Code de réduction (optionnel)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                placeholder="NOEL2024"
                className="flex-1 p-3 border border-gray-300 rounded-lg"
              />
              <button
                onClick={validatePromoCode}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Valider
              </button>
            </div>
            {promoDiscount > 0 && (
              <p className="text-green-600 text-sm mt-2">
                ✓ Réduction de {promoDiscount}% appliquée
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between mb-2">
              <span>Prix unitaire:</span>
              <span>{basePrice.toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Quantité:</span>
              <span>{selectedTickets}</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Réduction ({promoDiscount}%):</span>
                <span>
                  -
                  {(
                    (basePrice * selectedTickets * promoDiscount) /
                    100
                  ).toLocaleString()}{" "}
                  FCFA
                </span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{totalPrice.toLocaleString()} FCFA</span>
            </div>
          </div>

          <button
            onClick={() => setCurrentView("payment-selection")}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            Continuer vers le paiement
          </button>
        </div>
      </div>
    </div>
  );

  // Composant Sélection Paiement
  const PaymentSelectionView = () => (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">
            Mode de paiement
          </h2>

          <div className="space-y-4">
            <button
              onClick={() => {
                setPaymentMethod("cash");
                setCurrentView("cash-payment");
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 flex items-center space-x-4"
            >
              <Banknote className="text-green-600" size={24} />
              <div className="text-left">
                <div className="font-semibold">Espèces (Cash)</div>
                <div className="text-sm text-gray-500">
                  Paiement à la caisse
                </div>
              </div>
            </button>

            <button
              onClick={() => {
                setPaymentMethod("card");
                setCurrentView("card-payment");
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 flex items-center space-x-4"
            >
              <CreditCard className="text-blue-600" size={24} />
              <div className="text-left">
                <div className="font-semibold">Carte bancaire</div>
                <div className="text-sm text-gray-500">TPE à l'accueil</div>
              </div>
            </button>

            <button
              onClick={() => {
                setPaymentMethod("mobile-money");
                setCurrentView("mobile-money-selection");
              }}
              className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 flex items-center space-x-4"
            >
              <Smartphone className="text-orange-600" size={24} />
              <div className="text-left">
                <div className="font-semibold">Mobile Money</div>
                <div className="text-sm text-gray-500">MTN, Moov, Togocom</div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium">Récapitulatif:</div>
            <div className="text-lg font-bold">
              {totalPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Composant Mobile Money
  const MobileMoneyView = () => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">Mobile Money</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
              <p>Traitement du paiement en cours...</p>
              <p className="text-sm text-gray-500 mt-2">Veuillez patienter</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div
                onClick={() => simulateMobileMoneyPayment("MTN")}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold">
                    MTN
                  </div>
                  <div>
                    <div className="font-semibold">MTN Mobile Money</div>
                    <div className="text-sm text-gray-500">Composez *133#</div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => simulateMobileMoneyPayment("MOOV")}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                    MOOV
                  </div>
                  <div>
                    <div className="font-semibold">Moov Money</div>
                    <div className="text-sm text-gray-500">Composez *555#</div>
                  </div>
                </div>
              </div>

              <div
                onClick={() => simulateMobileMoneyPayment("TOGOCOM")}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    TCEL
                  </div>
                  <div>
                    <div className="font-semibold">Togocom</div>
                    <div className="text-sm text-gray-500">Composez *890#</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 p-4 bg-orange-50 rounded-lg">
            <div className="text-sm font-medium mb-2">Montant à payer:</div>
            <div className="text-2xl font-bold text-orange-600">
              {totalPrice.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Composant Ticket Généré
  const TicketGeneratedView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-green-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Check size={32} />
          </div>

          <h2 className="text-xl font-bold mb-4 text-green-600">
            Paiement confirmé !
          </h2>

          {currentTicket && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
                <QrCode size={64} className="mx-auto mb-2" />
                <p className="text-xs text-gray-500">
                  QR Code: {currentTicket.qrCode}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ID Ticket:</span>
                  <span className="font-mono">{currentTicket.id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Nombre de billets:</span>
                  <span>{currentTicket.nombreBillets}</span>
                </div>
                <div className="flex justify-between">
                  <span>Prix total:</span>
                  <span className="font-semibold">
                    {currentTicket.prixTotal.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Mode de paiement:</span>
                  <span className="capitalize">
                    {currentTicket.typePaiement.replace("-", " ")}
                  </span>
                </div>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 mb-6">
            Présentez ce QR code à l'entrée de l'événement
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentView("qr-scan");
                setSelectedTickets(1);
                setPromoCode("");
                setPromoDiscount(0);
                setCurrentTicket(null);
              }}
              className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
            >
              Nouveau ticket
            </button>

            <button
              onClick={() => setCurrentView("admin")}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
            >
              Accès Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Vue Admin
  const AdminView = () => {
    const [scanMode, setScanMode] = useState(false);
    const [scannedTicket, setScannedTicket] = useState("");

    const pendingTickets = tickets.filter((t) => t.statut === "pending");
    const confirmedTickets = tickets.filter((t) => t.statut === "confirmed");
    const totalRevenue = transactions
      .filter((t) => t.statut === "completed")
      .reduce((sum, t) => sum + t.montant, 0);

    const validateTicket = (ticketId, action) => {
      const updatedTickets = tickets.map((ticket) =>
        ticket.id === ticketId
          ? {
              ...ticket,
              statut: action === "approve" ? "confirmed" : "rejected",
              dateValidation: new Date().toISOString(),
            }
          : ticket
      );
      setTickets(updatedTickets);

      const updatedTransactions = transactions.map((transaction) =>
        transaction.ticketId === ticketId
          ? {
              ...transaction,
              statut: action === "approve" ? "completed" : "failed",
            }
          : transaction
      );
      setTransactions(updatedTransactions);
    };

    const scanTicketForEntry = () => {
      const ticket = tickets.find(
        (t) => t.qrCode === scannedTicket || t.id === scannedTicket
      );
      if (ticket) {
        if (ticket.statut === "confirmed") {
          alert(
            `✓ Ticket valide - ${ticket.nombreBillets} personne(s) - Accès autorisé`
          );
        } else {
          alert(`✗ Ticket non confirmé - Statut: ${ticket.statut}`);
        }
      } else {
        alert("✗ Ticket introuvable");
      }
      setScannedTicket("");
    };

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <button
                onClick={() => setCurrentView("qr-scan")}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
              >
                Retour Client
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm text-gray-600">Tickets vendus</div>
                    <div className="text-xl font-bold">
                      {confirmedTickets.length}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <TrendingUp className="text-green-600 mr-2" />
                  <div>
                    <div className="text-sm text-gray-600">Revenus</div>
                    <div className="text-xl font-bold">
                      {totalRevenue.toLocaleString()} FCFA
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white mr-2">
                    !
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">En attente</div>
                    <div className="text-xl font-bold">
                      {pendingTickets.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scanner */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-3">Scanner ticket d'entrée</h3>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={scannedTicket}
                  onChange={(e) => setScannedTicket(e.target.value)}
                  placeholder="ID ou QR Code du ticket"
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <button
                  onClick={scanTicketForEntry}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                >
                  <Scan className="mr-2" size={20} />
                  Vérifier
                </button>
              </div>
            </div>

            {/* Tickets en attente de validation */}
            {pendingTickets.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-4">
                  Tickets en attente de validation ({pendingTickets.length})
                </h3>
                <div className="space-y-3">
                  {pendingTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-orange-50 border border-orange-200 rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-mono text-sm text-gray-600">
                            {ticket.id}
                          </div>
                          <div className="font-semibold">
                            {ticket.nombreBillets} billet(s) -{" "}
                            {ticket.prixTotal.toLocaleString()} FCFA
                          </div>
                          <div className="text-sm text-gray-600">
                            Paiement: {ticket.typePaiement} • Créé:{" "}
                            {new Date(ticket.dateCreation).toLocaleString(
                              "fr-FR"
                            )}
                          </div>
                          {ticket.codePromo && (
                            <div className="text-xs text-blue-600">
                              Code promo: {ticket.codePromo}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => validateTicket(ticket.id, "approve")}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center"
                          >
                            <Check size={16} className="mr-1" />
                            Valider
                          </button>
                          <button
                            onClick={() => validateTicket(ticket.id, "reject")}
                            className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center"
                          >
                            <X size={16} className="mr-1" />
                            Rejeter
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des tickets confirmés */}
            <div>
              <h3 className="font-semibold mb-4">
                Tickets confirmés ({confirmedTickets.length})
              </h3>
              {confirmedTickets.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Aucun ticket confirmé
                </p>
              ) : (
                <div className="space-y-2">
                  {confirmedTickets
                    .slice(-10)
                    .reverse()
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-green-50 border border-green-200 rounded-lg p-3"
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-mono text-sm text-gray-600">
                              {ticket.id}
                            </div>
                            <div className="text-sm">
                              {ticket.nombreBillets} billet(s) -{" "}
                              {ticket.prixTotal.toLocaleString()} FCFA
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(ticket.dateValidation).toLocaleString(
                              "fr-FR"
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  {confirmedTickets.length > 10 && (
                    <p className="text-center text-gray-500 text-sm">
                      ...et {confirmedTickets.length - 10} autres
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Vues pour Cash et Carte (simples)
  const CashPaymentView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <Banknote size={48} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-bold mb-4">Paiement en espèces</h2>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <div className="text-lg font-semibold">Montant à payer:</div>
            <div className="text-2xl font-bold text-green-600">
              {totalPrice.toLocaleString()} FCFA
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Présentez-vous à la caisse avec le montant exact. Votre ticket sera
            généré après validation du paiement par notre équipe.
          </p>
          <button
            onClick={() => {
              const ticket = generateTicket("cash");
              setCurrentTicket(ticket);
              setCurrentView("ticket-pending");
            }}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Confirmer - Aller à la caisse
          </button>
        </div>
      </div>
    </div>
  );

  const CardPaymentView = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <CreditCard size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-bold mb-4">Paiement par carte</h2>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="text-lg font-semibold">Montant à payer:</div>
            <div className="text-2xl font-bold text-blue-600">
              {totalPrice.toLocaleString()} FCFA
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Dirigez-vous vers le TPE à l'accueil pour effectuer votre paiement
            par carte bancaire. Votre ticket sera généré après validation.
          </p>
          <button
            onClick={() => {
              const ticket = generateTicket("card");
              setCurrentTicket(ticket);
              setCurrentView("ticket-pending");
            }}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
          >
            Confirmer - Aller au TPE
          </button>
        </div>
      </div>
    </div>
  );

  const TicketPendingView = () => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="bg-orange-500 text-white rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-bold mb-4 text-orange-600">
            Paiement en attente
          </h2>
          {currentTicket && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="text-sm font-medium mb-2">Votre ticket:</div>
              <div className="font-mono text-sm bg-white p-2 rounded">
                {currentTicket.id}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {currentTicket.nombreBillets} billet(s) -{" "}
                {currentTicket.prixTotal.toLocaleString()} FCFA
              </div>
            </div>
          )}
          <p className="text-gray-600 mb-6">
            Votre demande de ticket est enregistrée. Effectuez votre paiement et
            attendez la validation de notre équipe.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setCurrentView("admin")}
              className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600"
            >
              Vérifier le statut (Admin)
            </button>
            <button
              onClick={() => setCurrentView("qr-scan")}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
            >
              Nouveau ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Router principal
  const renderCurrentView = () => {
    switch (currentView) {
      case "qr-scan":
        return <QRScanView />;
      case "ticket-selection":
        return <TicketSelectionView />;
      case "payment-selection":
        return <PaymentSelectionView />;
      case "cash-payment":
        return <CashPaymentView />;
      case "card-payment":
        return <CardPaymentView />;
      case "mobile-money-selection":
        return <MobileMoneyView />;
      case "ticket-generated":
        return <TicketGeneratedView />;
      case "ticket-pending":
        return <TicketPendingView />;
      case "admin":
        return <AdminView />;
      default:
        return <QRScanView />;
    }
  };

  return <div className="font-sans">{renderCurrentView()}</div>;
}
