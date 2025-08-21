// src/components/TicketHistory.jsx
import React, { useState, useEffect } from "react";
import { Download, Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { localTicketService, ticketService } from "../services/api";

const TicketHistory = ({ onBack }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTickets = () => {
    const history = localTicketService.getTicketHistory();
    history.forEach((ticket) => {
      ticketService.getTicketById(ticket.id).then((response) => {
        const updatedTicket = { ...ticket, ...response };
        localTicketService.saveTicketToHistory(updatedTicket);
      });
    });
    const updatedHistory = localTicketService.getTicketHistory();
    setTickets(
      updatedHistory.sort(
        (a, b) => new Date(b.dateCreation) - new Date(a.dateCreation)
      )
    );

    setLoading(false);
    console.log("history", history);
    console.log("updatedHistory", updatedHistory);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const downloadTicket = (ticket) => {
    // À implémenter - génération PDF
    console.log("Télécharger ticket:", ticket);
    alert("Fonctionnalité de téléchargement PDF à implémenter");
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
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Retour
            </button>
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
                      </div>

                      <p className="font-mono text-sm text-gray-600 mb-1">
                        ID: {ticket.id}
                      </p>
                      <p className="font-semibold">
                        {ticket.nombreBillets} billet(s) -{" "}
                        {ticket.prixTotal?.toLocaleString()} FCFA
                      </p>
                      <p className="text-sm text-gray-600">
                        Paiement: {ticket.typePaiement}
                        {ticket.codePromo && ` • Code: ${ticket.codePromo}`}
                      </p>
                      <p className="text-xs text-gray-500">
                        Créé le:{" "}
                        {new Date(ticket.dateCreation).toLocaleString("fr-FR")}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      {ticket.statut === "confirmed" && (
                        <button
                          onClick={() => downloadTicket(ticket)}
                          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                          title="Télécharger PDF"
                        >
                          <Download size={16} />
                        </button>
                      )}
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
