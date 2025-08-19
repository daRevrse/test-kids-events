// server.js
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { v4: uuidv4 } = require("uuid");
const QRCode = require("qrcode");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Base de données SQLite
const db = new sqlite3.Database("./database/tickets.db");

// Initialisation de la base de données
const initDatabase = () => {
  db.serialize(() => {
    // Table des événements
    db.run(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        date_event DATE,
        prix_unitaire REAL NOT NULL,
        stock_total INTEGER NOT NULL,
        stock_restant INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Table des tickets
    db.run(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        event_id INTEGER NOT NULL,
        code_unique TEXT UNIQUE NOT NULL,
        qr_code TEXT NOT NULL,
        nombre_billets INTEGER NOT NULL,
        prix_total REAL NOT NULL,
        type_paiement TEXT NOT NULL,
        code_promo TEXT,
        statut TEXT DEFAULT 'pending',
        date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
        date_validation DATETIME,
        FOREIGN KEY(event_id) REFERENCES events(id)
      )
    `);

    // Table des transactions
    db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        montant REAL NOT NULL,
        methode_paiement TEXT NOT NULL,
        statut TEXT DEFAULT 'pending',
        mobile_money_provider TEXT,
        mobile_money_numero TEXT,
        reference_externe TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY(ticket_id) REFERENCES tickets(id)
      )
    `);

    // Table des codes de réduction
    db.run(`
      CREATE TABLE IF NOT EXISTS codes_reduction (
        code TEXT PRIMARY KEY,
        pourcentage INTEGER NOT NULL,
        min_billets INTEGER DEFAULT 1,
        max_utilisations INTEGER DEFAULT -1,
        utilisations_actuelles INTEGER DEFAULT 0,
        actif BOOLEAN DEFAULT 1,
        date_debut DATE,
        date_fin DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insertion des données de test
    db.get("SELECT COUNT(*) as count FROM events", (err, row) => {
      if (row.count === 0) {
        db.run(`
          INSERT INTO events (nom, date_event, prix_unitaire, stock_total, stock_restant)
          VALUES ('Village de Noël KIDS EVENTS', '2024-12-25', 5000, 200, 200)
        `);
      }
    });

    // Insertion des codes promo de test
    db.get("SELECT COUNT(*) as count FROM codes_reduction", (err, row) => {
      if (row.count === 0) {
        const codes = [
          ["NOEL2024", 10, 1, -1],
          ["FAMILLE", 15, 4, -1],
          ["EARLY", 20, 1, 50],
        ];

        codes.forEach(([code, pourcentage, minBillets, maxUtil]) => {
          db.run(
            `
            INSERT INTO codes_reduction (code, pourcentage, min_billets, max_utilisations)
            VALUES (?, ?, ?, ?)
          `,
            [code, pourcentage, minBillets, maxUtil]
          );
        });
      }
    });
  });
};

// Génération QR Code
const generateQRCode = async (data) => {
  try {
    const qrString = await QRCode.toDataURL(JSON.stringify(data));
    return qrString;
  } catch (err) {
    console.error("Erreur génération QR Code:", err);
    return null;
  }
};

// Routes API

// 1. Récupération des événements
app.get("/api/events", (req, res) => {
  db.all("SELECT * FROM events WHERE stock_restant > 0", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// 2. Validation code de réduction
app.post("/api/validate-promo", (req, res) => {
  const { code, nombreBillets } = req.body;

  db.get(
    `
    SELECT * FROM codes_reduction 
    WHERE code = ? AND actif = 1 
    AND (date_debut IS NULL OR date_debut <= date('now'))
    AND (date_fin IS NULL OR date_fin >= date('now'))
    AND (max_utilisations = -1 OR utilisations_actuelles < max_utilisations)
  `,
    [code.toUpperCase()],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: "Code promo invalide ou expiré" });
      }

      if (row.min_billets > nombreBillets) {
        return res.status(400).json({
          error: `Ce code nécessite minimum ${row.min_billets} billets`,
          minBillets: row.min_billets,
        });
      }

      res.json({
        code: row.code,
        pourcentage: row.pourcentage,
        valid: true,
      });
    }
  );
});

// 3. Création d'un ticket
app.post("/api/tickets", async (req, res) => {
  const { eventId, nombreBillets, typePaiement, codePromo, prixUnitaire } =
    req.body;

  const ticketId = `TICKET_${Date.now()}_${uuidv4().substr(0, 8)}`;
  const codeUnique = `${eventId}-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Calcul du prix avec réduction
  let prixTotal = prixUnitaire * nombreBillets;
  let reduction = 0;

  if (codePromo) {
    const promoResult = await new Promise((resolve) => {
      db.get(
        `
        SELECT * FROM codes_reduction 
        WHERE code = ? AND actif = 1
      `,
        [codePromo.toUpperCase()],
        (err, row) => {
          resolve(row);
        }
      );
    });

    if (promoResult && promoResult.min_billets <= nombreBillets) {
      reduction = promoResult.pourcentage;
      prixTotal = (prixTotal * (100 - reduction)) / 100;
    }
  }

  // Génération QR Code
  const qrData = {
    ticketId,
    eventId,
    nombreBillets,
    codeUnique,
    timestamp: new Date().toISOString(),
  };

  const qrCode = await generateQRCode(qrData);

  // Insertion du ticket
  db.run(
    `
    INSERT INTO tickets (
      id, event_id, code_unique, qr_code, nombre_billets, 
      prix_total, type_paiement, code_promo, statut
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      ticketId,
      eventId,
      codeUnique,
      qrCode,
      nombreBillets,
      prixTotal,
      typePaiement,
      codePromo,
      typePaiement === "mobile-money" ? "confirmed" : "pending",
    ],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Création de la transaction
      const transactionId = `TRANS_${Date.now()}_${uuidv4().substr(0, 8)}`;

      db.run(
        `
      INSERT INTO transactions (
        id, ticket_id, montant, methode_paiement, statut
      ) VALUES (?, ?, ?, ?, ?)
    `,
        [
          transactionId,
          ticketId,
          prixTotal,
          typePaiement,
          typePaiement === "mobile-money" ? "completed" : "pending",
        ],
        (err) => {
          if (err) {
            console.error("Erreur création transaction:", err);
          }
        }
      );

      // Mise à jour du stock si confirmé
      if (typePaiement === "mobile-money") {
        db.run(
          `
        UPDATE events SET stock_restant = stock_restant - ? WHERE id = ?
      `,
          [nombreBillets, eventId]
        );
      }

      res.status(201).json({
        ticketId,
        codeUnique,
        qrCode,
        prixTotal,
        reduction,
        statut: typePaiement === "mobile-money" ? "confirmed" : "pending",
      });
    }
  );
});

// 4. Validation manuelle des tickets (Admin)
app.put("/api/tickets/:ticketId/validate", (req, res) => {
  const { ticketId } = req.params;
  const { action } = req.body; // 'approve' ou 'reject'

  const newStatut = action === "approve" ? "confirmed" : "rejected";

  db.run(
    `
    UPDATE tickets 
    SET statut = ?, date_validation = CURRENT_TIMESTAMP 
    WHERE id = ?
  `,
    [newStatut, ticketId],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Mise à jour de la transaction
      db.run(
        `
      UPDATE transactions 
      SET statut = ?, completed_at = CURRENT_TIMESTAMP 
      WHERE ticket_id = ?
    `,
        [action === "approve" ? "completed" : "failed", ticketId]
      );

      // Mise à jour du stock si approuvé
      if (action === "approve") {
        db.get(
          `
        SELECT event_id, nombre_billets FROM tickets WHERE id = ?
      `,
          [ticketId],
          (err, ticket) => {
            if (ticket) {
              db.run(
                `
            UPDATE events SET stock_restant = stock_restant - ? WHERE id = ?
          `,
                [ticket.nombre_billets, ticket.event_id]
              );
            }
          }
        );
      }

      res.json({ success: true, statut: newStatut });
    }
  );
});

// 5. Vérification ticket à l'entrée
app.post("/api/tickets/verify", (req, res) => {
  const { qrCode, ticketId } = req.body;

  let query = "";
  let params = [];

  if (qrCode) {
    query = "SELECT * FROM tickets WHERE qr_code = ?";
    params = [qrCode];
  } else if (ticketId) {
    query = "SELECT * FROM tickets WHERE id = ? OR code_unique = ?";
    params = [ticketId, ticketId];
  } else {
    return res.status(400).json({ error: "QR Code ou ID ticket requis" });
  }

  db.get(query, params, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!row) {
      return res.status(404).json({
        valid: false,
        message: "Ticket introuvable",
      });
    }

    if (row.statut === "confirmed") {
      res.json({
        valid: true,
        ticket: {
          id: row.id,
          nombreBillets: row.nombre_billets,
          prixTotal: row.prix_total,
          typePaiement: row.type_paiement,
          dateValidation: row.date_validation,
        },
        message: `Ticket valide - ${row.nombre_billets} personne(s) - Accès autorisé`,
      });
    } else {
      res.json({
        valid: false,
        ticket: row,
        message: `Ticket non confirmé - Statut: ${row.statut}`,
      });
    }
  });
});

// 6. Dashboard admin - statistiques
app.get("/api/admin/stats", (req, res) => {
  const queries = {
    totalTickets:
      "SELECT COUNT(*) as count FROM tickets WHERE statut = 'confirmed'",
    pendingTickets:
      "SELECT COUNT(*) as count FROM tickets WHERE statut = 'pending'",
    totalRevenue:
      "SELECT SUM(montant) as total FROM transactions WHERE statut = 'completed'",
    ticketsPending: `
      SELECT t.*, e.nom as event_nom 
      FROM tickets t 
      JOIN events e ON t.event_id = e.id 
      WHERE t.statut = 'pending' 
      ORDER BY t.date_creation DESC
    `,
    ticketsRecent: `
      SELECT t.*, e.nom as event_nom 
      FROM tickets t 
      JOIN events e ON t.event_id = e.id 
      WHERE t.statut = 'confirmed' 
      ORDER BY t.date_validation DESC 
      LIMIT 10
    `,
  };

  const results = {};
  let completed = 0;
  const total = Object.keys(queries).length;

  Object.entries(queries).forEach(([key, query]) => {
    db.all(query, (err, rows) => {
      if (err) {
        results[key] = { error: err.message };
      } else {
        results[key] = key.includes("Tickets") ? rows : rows[0] || {};
      }

      completed++;
      if (completed === total) {
        res.json(results);
      }
    });
  });
});

// 7. Simulation Mobile Money (pour développement)
app.post("/api/mobile-money/simulate", (req, res) => {
  const { provider, montant, numero } = req.body;

  // Simulation d'un délai réseau
  setTimeout(() => {
    const success = Math.random() > 0.1; // 90% de succès

    if (success) {
      res.json({
        success: true,
        transactionId: `MM_${provider}_${Date.now()}`,
        message: `Paiement de ${montant} FCFA confirmé via ${provider}`,
        numero: numero,
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Échec du paiement Mobile Money",
      });
    }
  }, Math.random() * 3000 + 1000); // Entre 1 et 4 secondes
});

// 8. Webhook Mobile Money (pour production)
app.post("/api/webhook/mobile-money", (req, res) => {
  const { transactionId, status, ticketId, provider } = req.body;

  if (status === "SUCCESS") {
    db.run(
      `
      UPDATE tickets 
      SET statut = 'confirmed', date_validation = CURRENT_TIMESTAMP 
      WHERE id = ?
    `,
      [ticketId],
      (err) => {
        if (err) {
          console.error("Erreur mise à jour ticket:", err);
          return res.status(500).json({ error: "Erreur traitement webhook" });
        }

        // Mise à jour transaction
        db.run(
          `
        UPDATE transactions 
        SET statut = 'completed', completed_at = CURRENT_TIMESTAMP,
            reference_externe = ?
        WHERE ticket_id = ?
      `,
          [transactionId, ticketId]
        );

        res.json({ success: true });
      }
    );
  } else {
    res.status(400).json({ error: "Transaction échouée" });
  }
});

// Initialisation
initDatabase();

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📊 API disponible sur http://localhost:${PORT}/api`);
});

module.exports = app;
