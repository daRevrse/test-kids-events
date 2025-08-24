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
  Wifi,
  WifiOff,
  AlertTriangle,
} from "lucide-react";

// Import des services API et composants
import {
  eventService,
  promoService,
  ticketService,
  paymentService,
  apiUtils,
} from "./services/api";

import AdminDashboard from "./components/AdminDashboard";

// Hook pour gestion du localStorage avec fallback
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
    try {
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error("Erreur localStorage:", error);
    }
  };

  return [value, setStoredValue];
};

// Hook pour vérifier la connectivité
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

// Composant d'alerte de connectivité
const ConnectivityAlert = ({ isOnline, apiWorking }) => {
  if (isOnline && apiWorking) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm text-white ${
        !isOnline ? "bg-red-500" : "bg-orange-500"
      }`}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center space-x-2">
          <WifiOff size={16} />
          <span>Mode hors-ligne - Fonctionnalités limitées</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle size={16} />
          <span>Problème de connexion API - Utilisation du cache local</span>
        </div>
      )}
    </div>
  );
};

// Composant principal
export default function TicketingApp() {
  // États principaux
  const [currentView, setCurrentView] = useState("qr-scan");
  const [selectedTickets, setSelectedTickets] = useState(1);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currentTicket, setCurrentTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // États pour les données
  const [events, setEvents] = useState([]);
  const [currentEvent, setCurrentEvent] = useState(null);

  // États pour la connectivité
  const isOnline = useOnlineStatus();
  const [apiWorking, setApiWorking] = useState(true);

  // Cache local pour mode hors-ligne
  const [localTickets, setLocalTickets] = useLocalStorage("tickets", []);

  // Codes promo par défaut (fallback)
  const defaultPromoCodes = {
    NOEL2024: { reduction: 10, actif: true },
    FAMILLE: { reduction: 15, minBillets: 4, actif: true },
    EARLY: { reduction: 20, actif: true },
  };

  // Charger les événements au démarrage
  useEffect(() => {
    loadEvents();
    testAPIConnection();
  }, []);

  // Test de connectivité API
  const testAPIConnection = async () => {
    try {
      const result = await apiUtils.testConnection();
      setApiWorking(result.success);
      if (!result.success) {
        console.warn("API non accessible, utilisation du cache local");
      }
    } catch (error) {
      setApiWorking(false);
      console.error("Test API failed:", error);
    }
  };

  // Charger les événements
  const loadEvents = async () => {
    try {
      if (isOnline && apiWorking) {
        const eventsData = await eventService.getEvents();
        setEvents(eventsData);
        setCurrentEvent(eventsData[0] || null);

        // Sauvegarder en cache
        localStorage.setItem("cached_events", JSON.stringify(eventsData));
      } else {
        // Utiliser le cache
        const cachedEvents = JSON.parse(
          localStorage.getItem("cached_events") || "[]"
        );
        if (cachedEvents.length > 0) {
          setEvents(cachedEvents);
          setCurrentEvent(cachedEvents[0]);
        } else {
          // Événement par défaut
          const defaultEvent = {
            id: 1,
            nom: "Village de Noël KIDS EVENTS",
            prix_unitaire: 5000,
            stock_restant: 200,
            date_event: "2024-12-25",
          };
          setEvents([defaultEvent]);
          setCurrentEvent(defaultEvent);
        }
      }
    } catch (error) {
      console.error("Erreur chargement événements:", error);
      setError("Erreur lors du chargement des événements");
    }
  };

  // Validation code promo
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setError("Veuillez entrer un code promo");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (isOnline && apiWorking) {
        // Utiliser l'API
        const result = await promoService.validatePromo(
          promoCode.toUpperCase(),
          selectedTickets
        );
        setPromoDiscount(result.pourcentage);
        alert(`✅ Code appliqué ! Réduction de ${result.pourcentage}%`);
      } else {
        // Utiliser les codes par défaut
        const code = defaultPromoCodes[promoCode.toUpperCase()];
        if (code && code.actif) {
          if (code.minBillets && selectedTickets < code.minBillets) {
            setError(`Ce code nécessite minimum ${code.minBillets} billets`);
            return;
          }
          setPromoDiscount(code.reduction);
          alert(`✅ Code appliqué ! Réduction de ${code.reduction}%`);
        } else {
          setError("Code promo invalide");
          setPromoCode("");
          setPromoDiscount(0);
        }
      }
    } catch (error) {
      console.error("Erreur validation promo:", error);
      setError(error.response?.data?.error || "Erreur validation code promo");
      setPromoCode("");
      setPromoDiscount(0);
    } finally {
      setLoading(false);
    }
  };

  // Calculer le prix total
  const calculateTotalPrice = () => {
    if (!currentEvent) return 0;
    const basePrice = currentEvent.prix_unitaire || 5000;
    return (basePrice * selectedTickets * (100 - promoDiscount)) / 100;
  };

  // Générer un ticket
  const generateTicket = async (paymentType, additionalData = {}) => {
    if (!currentEvent) {
      throw new Error("Aucun événement sélectionné");
    }

    const ticketData = {
      eventId: currentEvent.id,
      nombreBillets: selectedTickets,
      typePaiement: paymentType,
      codePromo: promoCode || null,
      prixUnitaire: currentEvent.prix_unitaire || 5000,
      ...additionalData,
    };

    try {
      if (isOnline && apiWorking) {
        // Utiliser l'API
        const result = await ticketService.createTicket(ticketData);
        return {
          id: result.ticketId,
          codeUnique: result.codeUnique,
          qrCode: result.qrCode,
          prixTotal: result.prixTotal,
          reduction: result.reduction,
          statut: result.statut,
          eventId: currentEvent.id,
          nombreBillets: selectedTickets,
          typePaiement: paymentType,
          codePromo: promoCode,
          dateCreation: new Date().toISOString(),
        };
      } else {
        // Mode hors-ligne - générer localement
        const ticket = {
          id: `OFFLINE_TICKET_${Date.now()}`,
          codeUnique: `${currentEvent.id}-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          qrCode: `QR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          prixTotal: calculateTotalPrice(),
          reduction: promoDiscount,
          statut: paymentType === "mobile-money" ? "confirmed" : "pending",
          eventId: currentEvent.id,
          nombreBillets: selectedTickets,
          typePaiement: paymentType,
          codePromo: promoCode,
          dateCreation: new Date().toISOString(),
          isOffline: true,
        };

        // Sauvegarder localement
        const newTickets = [...localTickets, ticket];
        setLocalTickets(newTickets);

        return ticket;
      }
    } catch (error) {
      console.error("Erreur génération ticket:", error);
      throw new Error(
        error.response?.data?.error || "Erreur lors de la génération du ticket"
      );
    }
  };

  // Simulation paiement Mobile Money
  const simulateMobileMoneyPayment = async (provider) => {
    setLoading(true);
    setError("");

    try {
      if (isOnline && apiWorking) {
        // Utiliser l'API pour la simulation
        const paymentData = {
          provider,
          montant: calculateTotalPrice(),
          numero: `${
            provider === "MTN" ? "70" : provider === "MOOV" ? "96" : "90"
          }123456`,
        };

        const paymentResult = await paymentService.simulateMobileMoneyPayment(
          paymentData
        );

        if (paymentResult.success) {
          const ticket = await generateTicket("mobile-money", {
            mobileMoneyProvider: provider,
            transactionId: paymentResult.transactionId,
          });

          setCurrentTicket(ticket);
          setCurrentView("ticket-generated");
        } else {
          throw new Error(paymentResult.message || "Échec du paiement");
        }
      } else {
        // Simulation hors-ligne
        setTimeout(async () => {
          try {
            const ticket = await generateTicket("mobile-money");
            setCurrentTicket(ticket);
            setCurrentView("ticket-generated");
          } catch (error) {
            setError(error.message);
          } finally {
            setLoading(false);
          }
        }, 2000);
        return; // Sort de la fonction pour éviter le setLoading(false) en bas
      }
    } catch (error) {
      console.error("Erreur paiement Mobile Money:", error);
      setError(error.message || "Erreur lors du paiement");
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const resetForm = () => {
    setSelectedTickets(1);
    setPromoCode("");
    setPromoDiscount(0);
    setCurrentTicket(null);
    setError("");
    setPaymentMethod("");
  };

  // Composant Scan QR
  const QRScanView = () => (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-green-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
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

          {/* Indicateur de statut API */}
          <div
            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs mb-4 ${
              isOnline && apiWorking
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {isOnline && apiWorking ? (
              <Wifi size={12} />
            ) : (
              <WifiOff size={12} />
            )}
            <span>
              {isOnline && apiWorking ? "En ligne" : "Mode hors-ligne"}
            </span>
          </div>

          <button
            onClick={() => setCurrentView("ticket-selection")}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors mb-4"
          >
            Acheter des billets
          </button>

          <button
            onClick={() => setCurrentView("admin")}
            className="w-full bg-blue-500 text-white py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            Accès Admin
          </button>
        </div>
      </div>
    </div>
  );

  // Composant Sélection Billets
  const TicketSelectionView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">
            Sélection des billets
          </h2>

          {currentEvent && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900">
                {currentEvent.nom}
              </h3>
              <p className="text-sm text-blue-700">
                Prix: {currentEvent.prix_unitaire?.toLocaleString()} FCFA
              </p>
              {currentEvent.stock_restant && (
                <p className="text-xs text-blue-600">
                  Stock disponible: {currentEvent.stock_restant}
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Nombre de billets
            </label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => {
                  setSelectedTickets(Math.max(1, selectedTickets - 1));
                  setError("");
                }}
                className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center text-xl font-bold"
              >
                -
              </button>
              <span className="text-2xl font-bold w-8 text-center">
                {selectedTickets}
              </span>
              <button
                onClick={() => {
                  setSelectedTickets(selectedTickets + 1);
                  setError("");
                }}
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
                onChange={(e) => {
                  setPromoCode(e.target.value.toUpperCase());
                  setError("");
                }}
                placeholder="NOEL2024"
                className="flex-1 p-3 border border-gray-300 rounded-lg"
                disabled={loading}
              />
              <button
                onClick={validatePromoCode}
                disabled={loading || !promoCode.trim()}
                className="px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "..." : "Valider"}
              </button>
            </div>
            {promoDiscount > 0 && (
              <p className="text-green-600 text-sm mt-2">
                ✅ Réduction de {promoDiscount}% appliquée
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex justify-between mb-2">
              <span>Prix unitaire:</span>
              <span>
                {currentEvent?.prix_unitaire?.toLocaleString() || "5,000"} FCFA
              </span>
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
                    ((currentEvent?.prix_unitaire || 5000) *
                      selectedTickets *
                      promoDiscount) /
                    100
                  ).toLocaleString()}{" "}
                  FCFA
                </span>
              </div>
            )}
            <hr className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{calculateTotalPrice().toLocaleString()} FCFA</span>
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
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
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
              {calculateTotalPrice().toLocaleString()} FCFA
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Composant Mobile Money
  const MobileMoneyView = () => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-center">Mobile Money</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

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
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-yellow-500 cursor-pointer transition-colors"
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
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
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
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 cursor-pointer transition-colors"
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
              {calculateTotalPrice().toLocaleString()} FCFA
            </div>
          </div>

          {!isOnline && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Mode hors-ligne: Le ticket sera généré localement et devra
                être synchronisé plus tard.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Composant Paiement Cash
  const CashPaymentView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <Banknote size={48} className="mx-auto text-green-600 mb-4" />
          <h2 className="text-xl font-bold mb-4">Paiement en espèces</h2>
          <div className="bg-green-50 p-4 rounded-lg mb-6">
            <div className="text-lg font-semibold">Montant à payer:</div>
            <div className="text-2xl font-bold text-green-600">
              {calculateTotalPrice().toLocaleString()} FCFA
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Présentez-vous à la caisse avec le montant exact. Votre ticket sera
            généré après validation du paiement par notre équipe.
          </p>
          <button
            onClick={async () => {
              try {
                const ticket = await generateTicket("cash");
                setCurrentTicket(ticket);
                setCurrentView("ticket-pending");
              } catch (error) {
                setError(error.message);
              }
            }}
            className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600"
          >
            Confirmer - Aller à la caisse
          </button>
        </div>
      </div>
    </div>
  );

  // Composant Paiement Carte
  const CardPaymentView = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-red-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <CreditCard size={48} className="mx-auto text-blue-600 mb-4" />
          <h2 className="text-xl font-bold mb-4">Paiement par carte</h2>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="text-lg font-semibold">Montant à payer:</div>
            <div className="text-2xl font-bold text-blue-600">
              {calculateTotalPrice().toLocaleString()} FCFA
            </div>
          </div>
          <p className="text-gray-600 mb-6">
            Dirigez-vous vers le TPE à l'accueil pour effectuer votre paiement
            par carte bancaire. Votre ticket sera généré après validation.
          </p>
          <button
            onClick={async () => {
              try {
                const ticket = await generateTicket("card");
                setCurrentTicket(ticket);
                setCurrentView("ticket-pending");
              } catch (error) {
                setError(error.message);
              }
            }}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
          >
            Confirmer - Aller au TPE
          </button>
        </div>
      </div>
    </div>
  );

  // Composant Ticket Généré
  const TicketGeneratedView = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-red-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
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
                <p className="text-xs text-gray-500 font-mono break-all">
                  {currentTicket.qrCode}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ID Ticket:</span>
                  <span className="font-mono text-xs">{currentTicket.id}</span>
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
                {currentTicket.isOffline && (
                  <div className="text-orange-600 text-xs mt-2">
                    ⚠️ Ticket créé hors-ligne - Synchronisation requise
                  </div>
                )}
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
                resetForm();
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

  // Composant Ticket En Attente
  const TicketPendingView = () => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50 p-4">
      <ConnectivityAlert isOnline={isOnline} apiWorking={apiWorking} />

      <div className="max-w-md mx-auto mt-8">
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
              <div className="font-mono text-sm bg-white p-2 rounded break-all">
                {currentTicket.id}
              </div>
              <div className="mt-2 text-sm text-gray-600">
                {currentTicket.nombreBillets} billet(s) -{" "}
                {currentTicket.prixTotal.toLocaleString()} FCFA
              </div>
              {currentTicket.isOffline && (
                <div className="text-orange-600 text-xs mt-2">
                  ⚠️ Ticket créé hors-ligne
                </div>
              )}
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
              onClick={() => {
                setCurrentView("qr-scan");
                resetForm();
              }}
              className="w-full bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600"
            >
              Nouveau ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Navigation entre les vues
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
        return (
          <AdminDashboard
            onBack={() => setCurrentView("qr-scan")}
            isOnline={isOnline}
            apiWorking={apiWorking}
          />
        );
      default:
        return <QRScanView />;
    }
  };

  return <div className="font-sans">{renderCurrentView()}</div>;
}
