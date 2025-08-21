// src/services/api.js
import axios from "axios";

// Configuration de base pour l'API
const API_BASE_URL = import.meta.env.PROD
  ? window.location.origin // En production, même domaine
  : "http://localhost:8888"; // En développement local avec Netlify Dev

// Instance axios configurée
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes pour les fonctions Netlify
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur pour les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);

    // Gestion des erreurs réseau
    if (!error.response) {
      throw new Error("Problème de connexion réseau");
    }

    // Gestion des erreurs serveur
    if (error.response.status >= 500) {
      throw new Error("Erreur serveur. Veuillez réessayer plus tard.");
    }

    throw error;
  }
);

// Dans services/api.js - ajoutez ces fonctions
export const localTicketService = {
  // Sauvegarder ticket localement
  saveTicketToHistory(ticket) {
    try {
      const history = JSON.parse(localStorage.getItem("ticketHistory") || "[]");
      const existingIndex = history.findIndex((t) => t.id === ticket.id);

      if (existingIndex >= 0) {
        history[existingIndex] = ticket;
      } else {
        history.push(ticket);
      }

      localStorage.setItem("ticketHistory", JSON.stringify(history));
      return true;
    } catch (error) {
      console.error("Erreur sauvegarde historique:", error);
      return false;
    }
  },

  // Récupérer historique
  getTicketHistory() {
    try {
      return JSON.parse(localStorage.getItem("ticketHistory") || "[]");
    } catch (error) {
      console.error("Erreur lecture historique:", error);
      return [];
    }
  },

  // Mettre à jour statut ticket
  updateTicketStatus(ticketId, status) {
    try {
      const history = JSON.parse(localStorage.getItem("ticketHistory") || "[]");
      const updatedHistory = history.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, statut: status } : ticket
      );
      localStorage.setItem("ticketHistory", JSON.stringify(updatedHistory));
      return true;
    } catch (error) {
      console.error("Erreur mise à jour statut:", error);
      return false;
    }
  },
};

// Service API pour les événements
export const eventService = {
  // Récupérer tous les événements
  async getEvents() {
    try {
      const response = await api.get("/api/events");
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      throw error;
    }
  },
};

// Service API pour les codes promo
export const promoService = {
  // Valider un code promo
  async validatePromo(code, nombreBillets) {
    try {
      const response = await api.post("/api/validate-promo", {
        code,
        nombreBillets,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur validation code promo:", error);
      throw error;
    }
  },
};

// Service API pour les tickets
export const ticketService = {
  // Créer un nouveau ticket
  async createTicket(ticketData) {
    try {
      const response = await api.post("/api/tickets", ticketData);
      return response.data;
    } catch (error) {
      console.error("Erreur création ticket:", error);
      throw error;
    }
  },

  // Valider un ticket (admin)
  async validateTicket(ticketId, action) {
    try {
      const response = await api.put(`/api/tickets/${ticketId}/validate`, {
        action, // 'approve' ou 'reject'
      });
      return response.data;
    } catch (error) {
      console.error("Erreur validation ticket:", error);
      throw error;
    }
  },

  // Vérifier un ticket à l'entrée
  async verifyTicket(verificationData) {
    try {
      const response = await api.post("/api/tickets/verify", verificationData);
      return response.data;
    } catch (error) {
      console.error("Erreur vérification ticket:", error);
      throw error;
    }
  },

  // Récupérer un ticket par ID
  async getTicketById(ticketId) {
    try {
      const response = await api.get(`/api/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération du ticket:", error);
      throw error;
    }
  },
};

// Service API pour les paiements Mobile Money
export const paymentService = {
  // Simulation paiement Mobile Money
  async simulateMobileMoneyPayment(paymentData) {
    try {
      const response = await api.post(
        "/api/mobile-money/simulate",
        paymentData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur simulation Mobile Money:", error);
      throw error;
    }
  },

  // Webhook Mobile Money (pour les intégrations réelles)
  async handleMobileMoneyWebhook(webhookData) {
    try {
      const response = await api.post("/api/webhook/mobile-money", webhookData);
      return response.data;
    } catch (error) {
      console.error("Erreur webhook Mobile Money:", error);
      throw error;
    }
  },
};

// Service API pour l'administration
export const adminService = {
  // Récupérer les statistiques admin
  async getStats() {
    try {
      const response = await api.get("/api/admin/stats");
      return response.data;
    } catch (error) {
      console.error("Erreur récupération stats:", error);
      throw error;
    }
  },
};

// Utilitaires
export const apiUtils = {
  // Test de connectivité API
  async testConnection() {
    try {
      const response = await api.get("/api/events");
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Récupérer l'URL de base de l'API
  getBaseURL() {
    return API_BASE_URL;
  },
};

export default api;
