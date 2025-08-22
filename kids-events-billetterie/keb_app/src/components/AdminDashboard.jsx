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
  Ticket,
} from "lucide-react";

import { adminService, ticketService } from "../services/api";

const AdminDashboard = ({ onBack, isOnline = true, apiWorking = true }) => {
  const [stats, setStats] = useState({
    totalTickets: { count: 0 },
    pendingTickets: { count: 0 },
    totalRevenue: { total: 0 },
    ticketsPending: [],
    ticketsRecent: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scannedTicket, setScannedTicket] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);

  useEffect(() => {
    const isAuthenticated =
      localStorage.getItem("adminAuthenticated") === "true";
    if (!isAuthenticated) {
      // Rediriger vers la page de login ou accueil
      if (onBack) onBack();
      return;
    }
  }, [onBack]);

  const handleLogout = () => {
    localStorage.removeItem("adminAuthenticated");
    if (onBack) onBack();
  };

  // Charger les statistiques
  const loadStats = async () => {
    setLoading(true);
    setError("");

    try {
      if (isOnline && apiWorking) {
        const data = await adminService.getStats();
        console.log("API Stats data:", data);

        // Vérifier et normaliser la structure des données
        setStats({
          totalTickets: data.totalTickets || { count: 0 },
          pendingTickets: data.pendingTickets || { count: 0 },
          totalRevenue: data.totalRevenue || { total: 0 },
          ticketsPending: Array.isArray(data.ticketsPending)
            ? data.ticketsPending
            : [],
          ticketsRecent: Array.isArray(data.ticketsRecent)
            ? data.ticketsRecent
            : [],
        });
      } else {
        // Mode hors-ligne - utiliser les données locales
        const localTickets = JSON.parse(
          localStorage.getItem("tickets") || "[]"
        );
        const localTransactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );

        const confirmedTickets = localTickets.filter(
          (t) => t.statut === "confirmed"
        );
        const pendingTickets = localTickets.filter(
          (t) => t.statut === "pending"
        );
        const completedTransactions = localTransactions.filter(
          (t) => t.statut === "completed"
        );

        setStats({
          totalTickets: { count: confirmedTickets.length },
          pendingTickets: { count: pendingTickets.length },
          totalRevenue: {
            total: completedTransactions.reduce(
              (sum, t) => sum + (t.montant || 0),
              0
            ),
          },
          ticketsPending: pendingTickets.slice(-10),
          ticketsRecent: confirmedTickets.slice(-10).reverse(),
        });
      }
    } catch (err) {
      console.error("Erreur chargement stats:", err);
      setError("Impossible de charger les statistiques");

      // En cas d'erreur, définir des valeurs par défaut
      setStats({
        totalTickets: { count: 0 },
        pendingTickets: { count: 0 },
        totalRevenue: { total: 0 },
        ticketsPending: [],
        ticketsRecent: [],
      });
    } finally {
      setLoading(false);
    }
  };

  // Valider un ticket
  const validateTicket = async (ticketId, action) => {
    try {
      if (isOnline && apiWorking) {
        await ticketService.validateTicket(ticketId, action);
      } else {
        // Mode hors-ligne - mettre à jour localement
        const localTickets = JSON.parse(
          localStorage.getItem("tickets") || "[]"
        );
        const updatedTickets = localTickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                statut: action === "approve" ? "confirmed" : "rejected",
                dateValidation: new Date().toISOString(),
              }
            : ticket
        );
        localStorage.setItem("tickets", JSON.stringify(updatedTickets));

        // Mettre à jour les transactions locales
        const localTransactions = JSON.parse(
          localStorage.getItem("transactions") || "[]"
        );
        const updatedTransactions = localTransactions.map((transaction) =>
          transaction.ticketId === ticketId
            ? {
                ...transaction,
                statut: action === "approve" ? "completed" : "failed",
              }
            : transaction
        );
        localStorage.setItem(
          "transactions",
          JSON.stringify(updatedTransactions)
        );
      }

      // Recharger les stats
      await loadStats();

      const actionText = action === "approve" ? "approuvé" : "rejeté";
      alert(`✅ Ticket ${actionText} avec succès`);
    } catch (err) {
      console.error("Erreur validation ticket:", err);
      setError(`Erreur lors de la validation: ${err.message}`);
    }
  };

  // Vérifier un ticket à l'entrée
  const verifyTicketForEntry = async () => {
    if (!scannedTicket.trim()) {
      setError("Veuillez entrer un ID ou QR code");
      return;
    }

    setVerificationResult(null);
    setError("");

    try {
      if (isOnline && apiWorking) {
        const result = await ticketService.verifyTicket({
          ticketId: scannedTicket,
          // qrCode: scannedTicket,
        });
        setVerificationResult(result);
      } else {
        // Mode hors-ligne - vérifier localement
        const localTickets = JSON.parse(
          localStorage.getItem("tickets") || "[]"
        );
        const ticket = localTickets.find(
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
      }
    } catch (err) {
      console.error("Erreur vérification ticket:", err);
      setError(`Erreur vérification: ${err.message}`);
    }

    setScannedTicket("");
  };

  useEffect(() => {
    loadStats();
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
              <div className="flex items-center space-x-2 mt-2">
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
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={loadStats}
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
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tickets confirmés</p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.totalTickets?.count || 0}
                </p>
              </div>
              <Ticket className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenus totaux</p>
                <p className="text-3xl font-bold text-green-600">
                  {(stats.totalRevenue?.total || 0).toLocaleString()} F
                </p>
              </div>
              <TrendingUp className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats.pendingTickets?.count || 0}
                </p>
              </div>
              <Clock className="text-orange-600" size={32} />
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

        {/* Tickets en attente */}
        {Array.isArray(stats.ticketsPending) &&
          stats.ticketsPending.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">
                ⏳ Tickets en attente ({stats.ticketsPending.length})
              </h2>

              <div className="space-y-4">
                {stats.ticketsPending.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="border border-orange-200 rounded-lg p-4 bg-orange-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-mono text-sm text-gray-600">
                          {ticket.id}
                        </p>
                        <p className="font-semibold">
                          {ticket.nombre_billets || ticket.nombreBillets}{" "}
                          billet(s) -{" "}
                          {(
                            ticket.prix_total || ticket.prixTotal
                          )?.toLocaleString()}{" "}
                          FCFA
                        </p>
                        <p className="text-sm text-gray-600">
                          Paiement:{" "}
                          {ticket.type_paiement || ticket.typePaiement}
                          {(ticket.code_promo || ticket.codePromo) &&
                            ` • Code: ${ticket.code_promo || ticket.codePromo}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          Créé:{" "}
                          {new Date(
                            ticket.date_creation || ticket.dateCreation
                          ).toLocaleString("fr-FR")}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => validateTicket(ticket.id, "approve")}
                          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center space-x-1"
                        >
                          <CheckCircle size={16} />
                          <span>Approuver</span>
                        </button>
                        <button
                          onClick={() => validateTicket(ticket.id, "reject")}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center space-x-1"
                        >
                          <XCircle size={16} />
                          <span>Rejeter</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Tickets récents */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">
            ✅ Tickets récents confirmés
          </h2>

          {!Array.isArray(stats.ticketsRecent) ||
          stats.ticketsRecent.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun ticket confirmé
            </p>
          ) : (
            <div className="space-y-2">
              {stats.ticketsRecent.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-green-200 rounded-lg p-3 bg-green-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-mono text-sm text-gray-600">
                        {ticket.id}
                      </p>
                      <p className="text-sm">
                        {ticket.nombre_billets || ticket.nombreBillets}{" "}
                        billet(s) -{" "}
                        {(
                          ticket.prix_total || ticket.prixTotal
                        )?.toLocaleString()}{" "}
                        FCFA
                      </p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {ticket.date_validation || ticket.dateValidation
                        ? new Date(
                            ticket.date_validation || ticket.dateValidation
                          ).toLocaleString("fr-FR")
                        : "Date non disponible"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
