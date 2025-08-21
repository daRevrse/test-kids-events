import React, { useState, useEffect } from "react";
import {
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Scan,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff,
  Check,
  X,
} from "lucide-react";

import { adminService, ticketService } from "../services/api";

const AdminDashboard = ({ onBack, isOnline, apiWorking }) => {
  // États pour les données locales (comme dans l'ancienne version)
  const [tickets, setTickets] = useState([]);
  const [transactions, setTransactions] = useState([]);

  // États pour l'interface
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scannedTicket, setScannedTicket] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  // Charger les données (version hybride)
  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      if (isOnline && apiWorking) {
        // Essayer de charger depuis l'API
        try {
          const apiData = await adminService.getStats();
          console.log("API Data received:", apiData);

          // Extraire les tickets depuis les données API
          const allTickets = [
            ...(Array.isArray(apiData.ticketsPending)
              ? apiData.ticketsPending
              : []),
            ...(Array.isArray(apiData.ticketsRecent)
              ? apiData.ticketsRecent
              : []),
          ];

          setTickets(allTickets);

          // Pour les transactions, on peut les reconstituer ou utiliser les données locales
          const localTransactions = JSON.parse(
            localStorage.getItem("transactions") || "[]"
          );
          setTransactions(localTransactions);
        } catch (apiError) {
          console.warn("API failed, falling back to local data:", apiError);
          loadLocalData();
        }
      } else {
        loadLocalData();
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Erreur lors du chargement des données");
      loadLocalData(); // Fallback vers les données locales
    } finally {
      setLoading(false);
    }
  };

  // Charger les données locales
  const loadLocalData = () => {
    const localTickets = JSON.parse(localStorage.getItem("tickets") || "[]");
    const localTransactions = JSON.parse(
      localStorage.getItem("transactions") || "[]"
    );

    console.log("Loading local data:", {
      tickets: localTickets.length,
      transactions: localTransactions.length,
    });

    setTickets(localTickets);
    setTransactions(localTransactions);
  };

  // Calculer les statistiques (comme dans l'ancienne version)
  const pendingTickets = tickets.filter((t) => t.statut === "pending");
  const confirmedTickets = tickets.filter((t) => t.statut === "confirmed");
  const totalRevenue = transactions
    .filter((t) => t.statut === "completed")
    .reduce((sum, t) => sum + (t.montant || 0), 0);

  // Valider un ticket (version améliorée)
  const validateTicket = async (ticketId, action) => {
    try {
      if (isOnline && apiWorking) {
        // Essayer l'API d'abord
        try {
          await ticketService.validateTicket(ticketId, action);
        } catch (apiError) {
          console.warn("API validation failed, updating locally:", apiError);
        }
      }

      // Mettre à jour localement dans tous les cas
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
      localStorage.setItem("tickets", JSON.stringify(updatedTickets));

      const updatedTransactions = transactions.map((transaction) =>
        transaction.ticketId === ticketId
          ? {
              ...transaction,
              statut: action === "approve" ? "completed" : "failed",
            }
          : transaction
      );
      setTransactions(updatedTransactions);
      localStorage.setItem("transactions", JSON.stringify(updatedTransactions));

      const actionText = action === "approve" ? "approuvé" : "rejeté";
      alert(`✅ Ticket ${actionText} avec succès`);
    } catch (err) {
      console.error("Error validating ticket:", err);
      setError(`Erreur lors de la validation: ${err.message}`);
    }
  };

  // Vérifier un ticket à l'entrée (version améliorée)
  const verifyTicketForEntry = async () => {
    if (!scannedTicket.trim()) {
      setError("Veuillez entrer un ID ou QR code");
      return;
    }

    setVerificationResult(null);
    setError("");

    try {
      if (isOnline && apiWorking) {
        // Essayer l'API d'abord
        try {
          const result = await ticketService.verifyTicket({
            ticketId: scannedTicket,
            qrCode: scannedTicket,
          });
          setVerificationResult(result);
          setScannedTicket("");
          return;
        } catch (apiError) {
          console.warn("API verification failed, checking locally:", apiError);
        }
      }

      // Vérification locale
      const ticket = tickets.find(
        (t) =>
          t.id === scannedTicket ||
          t.qrCode === scannedTicket ||
          t.codeUnique === scannedTicket
      );

      if (ticket) {
        if (ticket.statut === "confirmed") {
          setVerificationResult({
            valid: true,
            ticket: {
              id: ticket.id,
              nombreBillets: ticket.nombreBillets,
              prixTotal: ticket.prixTotal,
              typePaiement: ticket.typePaiement,
            },
            message: `Ticket valide - ${ticket.nombreBillets} personne(s) - Accès autorisé`,
          });
        } else {
          setVerificationResult({
            valid: false,
            ticket,
            message: `Ticket non confirmé - Statut: ${ticket.statut}`,
          });
        }
      } else {
        setVerificationResult({
          valid: false,
          message: "Ticket introuvable",
        });
      }
    } catch (err) {
      console.error("Error verifying ticket:", err);
      setError(`Erreur vérification: ${err.message}`);
    }

    setScannedTicket("");
  };

  useEffect(() => {
    loadData();
  }, [isOnline, apiWorking]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw
            className="animate-spin mx-auto mb-4 text-blue-600"
            size={48}
          />
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Alerte de connectivité */}
      {(!isOnline || !apiWorking) && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm text-white ${
            !isOnline ? "bg-red-500" : "bg-orange-500"
          }`}
        >
          <div className="flex items-center justify-center space-x-2">
            {!isOnline ? <WifiOff size={16} /> : <AlertTriangle size={16} />}
            <span>
              {!isOnline ? "Mode hors-ligne" : "API non disponible"} - Données
              locales uniquement
            </span>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto mt-8">
        {/* En-tête */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                {isOnline && apiWorking ? (
                  <>
                    <Wifi size={16} className="text-green-600" />
                    <span className="text-sm text-green-600">En ligne</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-orange-600" />
                    <span className="text-sm text-orange-600">Hors-ligne</span>
                  </>
                )}
                <span className="text-xs text-gray-500">
                  {tickets.length} tickets • {transactions.length} transactions
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadData}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <RefreshCw size={16} />
                <span>Actualiser</span>
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Retour Client
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Statistiques (style de l'ancienne version) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="text-blue-600 mr-2" size={32} />
              <div>
                <div className="text-sm text-gray-600">Tickets vendus</div>
                <div className="text-3xl font-bold text-blue-600">
                  {confirmedTickets.length}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="text-green-600 mr-2" size={32} />
              <div>
                <div className="text-sm text-gray-600">Revenus totaux</div>
                <div className="text-3xl font-bold text-green-600">
                  {totalRevenue.toLocaleString()} F
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Clock className="text-orange-600 mr-2" size={32} />
              <div>
                <div className="text-sm text-gray-600">En attente</div>
                <div className="text-3xl font-bold text-orange-600">
                  {pendingTickets.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scanner d'entrée */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎫 Contrôle d'accès</h2>

          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              value={scannedTicket}
              onChange={(e) => setScannedTicket(e.target.value)}
              placeholder="Scanner ou saisir l'ID du ticket..."
              className="flex-1 p-3 border border-gray-300 rounded-lg"
              onKeyPress={(e) => e.key === "Enter" && verifyTicketForEntry()}
            />
            <button
              onClick={verifyTicketForEntry}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            >
              <Scan size={20} />
              <span>Vérifier</span>
            </button>
          </div>

          {verificationResult && (
            <div
              className={`p-4 rounded-lg border ${
                verificationResult.valid
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                {verificationResult.valid ? (
                  <CheckCircle className="text-green-600" size={20} />
                ) : (
                  <XCircle className="text-red-600" size={20} />
                )}
                <span
                  className={`font-semibold ${
                    verificationResult.valid ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {verificationResult.message}
                </span>
              </div>

              {verificationResult.valid && verificationResult.ticket && (
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• ID: {verificationResult.ticket.id}</p>
                  <p>• Personnes: {verificationResult.ticket.nombreBillets}</p>
                  <p>
                    • Montant:{" "}
                    {verificationResult.ticket.prixTotal?.toLocaleString()} FCFA
                  </p>
                  <p>• Paiement: {verificationResult.ticket.typePaiement}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tickets en attente (style ancien) */}
        {pendingTickets.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">
              ⏳ Tickets en attente de validation ({pendingTickets.length})
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
                        {ticket.nombreBillets || ticket.nombre_billets}{" "}
                        billet(s) -{" "}
                        {(
                          ticket.prixTotal || ticket.prix_total
                        )?.toLocaleString()}{" "}
                        FCFA
                      </div>
                      <div className="text-sm text-gray-600">
                        Paiement: {ticket.typePaiement || ticket.type_paiement}{" "}
                        • Créé:{" "}
                        {new Date(
                          ticket.dateCreation || ticket.date_creation
                        ).toLocaleString("fr-FR")}
                      </div>
                      {(ticket.codePromo || ticket.code_promo) && (
                        <div className="text-xs text-blue-600">
                          Code promo: {ticket.codePromo || ticket.code_promo}
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

        {/* Tickets confirmés (style ancien) */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-bold mb-4">
            ✅ Tickets confirmés ({confirmedTickets.length})
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
                          {ticket.nombreBillets || ticket.nombre_billets}{" "}
                          billet(s) -{" "}
                          {(
                            ticket.prixTotal || ticket.prix_total
                          )?.toLocaleString()}{" "}
                          FCFA
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {ticket.dateValidation || ticket.date_validation
                          ? new Date(
                              ticket.dateValidation || ticket.date_validation
                            ).toLocaleString("fr-FR")
                          : "Date non disponible"}
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
  );
};

export default AdminDashboard;
