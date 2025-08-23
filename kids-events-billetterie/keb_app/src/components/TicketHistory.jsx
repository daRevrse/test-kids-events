// src/components/TicketHistory.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Download,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { localTicketService, ticketService } from "../services/api";

const TicketHistory = ({ onBack }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(null);
  const ticketRefs = useRef({});

  const loadTickets = async () => {
    setLoading(true);

    try {
      const history = localTicketService.getTicketHistory();

      // On attend que toutes les requêtes soient finies
      const updatedTickets = await Promise.all(
        history.map(async (ticket) => {
          try {
            const response = await ticketService.getTicketById(ticket.id);
            const updatedTicket = { ...response };
            localTicketService.saveTicketToHistory(updatedTicket);
            return updatedTicket;
          } catch (err) {
            console.error("Erreur mise à jour ticket:", err);
            return ticket; // au pire on garde l’ancien
          }
        })
      );

      // On trie après avoir tout récupéré
      const sorted = updatedTickets.sort(
        (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)
      );

      setTickets(sorted);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const downloadTicket = async (ticket) => {
    setGeneratingPDF(ticket.id);
    try {
      await ticketService.generateTicketPDF(ticket);
      // Une fois le PDF généré, on recharge la liste
      // await loadTickets();
    } catch (error) {
      console.error("Erreur génération PDF:", error);
      alert("Erreur lors de la génération du PDF: " + error.message);
    } finally {
      setGeneratingPDF(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="text-green-600" size={16} />;
      case "rejected":
        return <XCircle className="text-red-600" size={16} />;
      default:
        return <Clock className="text-orange-600" size={16} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "confirmed":
        return "Confirmé";
      case "rejected":
        return "Rejeté";
      default:
        return "En attente";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Mes Tickets</h1>
            <div className="flex justify-between items-center px-1">
              <button
                onClick={loadTickets}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-500 rounded-lg hover:text-blue-600"
              >
                <RefreshCw size={16} />
              </button>
              <button
                onClick={onBack}
                className="px-4 py-2 bg-white text-gray-500 rounded-lg hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                Aucun ticket dans votre historique
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getStatusIcon(ticket.statut)}
                        <span
                          className={`font-semibold ${
                            ticket.statut === "confirmed"
                              ? "text-green-600"
                              : ticket.statut === "rejected"
                              ? "text-red-600"
                              : "text-orange-600"
                          }`}
                        >
                          {getStatusText(ticket.statut)}
                        </span>
                        <div className="flex space-x-2">
                          {ticket.statut === "confirmed" && (
                            <button
                              onClick={() => downloadTicket(ticket)}
                              disabled={generatingPDF === ticket.id}
                              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                              title="Télécharger PDF"
                            >
                              {generatingPDF === ticket.id ? (
                                <RefreshCw size={16} className="animate-spin" />
                              ) : (
                                <>
                                  <Download size={16} />
                                  <span className="ml-1 text-sm sm:text-lg">
                                    Télécharger
                                  </span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="font-mono text-sm text-gray-600 mb-1">
                        ID: {ticket.id}
                      </p>
                      <p className="font-semibold">
                        {ticket.nombreBillets} billet(s) -{" "}
                        {ticket.prixTotal?.toLocaleString()} FCFA
                      </p>
                      {ticket.event_nom ? (
                        <p className="text-sm text-gray-600">
                          {ticket.event_nom}
                        </p>
                      ) : null}
                      <p className="text-sm text-gray-600">
                        Paiement: {ticket.typePaiement}
                        {ticket.codePromo && ` • Code: ${ticket.codePromo}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Créé le:{" "}
                        {new Date(ticket.dateCreation).toLocaleString("fr-FR")}
                      </p>
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

export default TicketHistory;
