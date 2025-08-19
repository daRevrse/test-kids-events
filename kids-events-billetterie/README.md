# 🎄 KIDS EVENTS - Système de Billetterie

Système de billetterie moderne pour le Village de Noël avec support Mobile Money (Togo).

## 🚀 Démarrage rapide

### Backend

```bash
# Installation
cd backend
npm install
npm run setup

# Démarrage
npm run dev
# ➡️ http://localhost:3000
```

### Frontend

```bash
# Installation
cd frontend
npm install

# Démarrage
npm run dev
# ➡️ http://localhost:5173
```

## 📱 Fonctionnalités

### Pour les clients

- ✅ Scan QR Code pour accès rapide
- ✅ Sélection nombre de billets
- ✅ Codes de réduction automatiques
- ✅ Paiement Cash, Carte, Mobile Money
- ✅ Ticket numérique avec QR Code

### Pour l'administration

- ✅ Dashboard temps réel
- ✅ Validation manuelle (Cash/Carte)
- ✅ Scanner de vérification entrée
- ✅ Statistiques de vente
- ✅ Gestion codes promo

### Mobile Money

- ✅ MTN Mobile Money
- ✅ Moov Money
- ✅ Togocom
- ✅ Confirmation automatique

## 🛠 Stack technique

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express + SQLite
- **QR Codes**: qrcode.js
- **UI**: Lucide React icons

## 📊 Base de données

```sql
- events (événements)
- tickets (billets)
- transactions (paiements)
- codes_reduction (codes promo)
```

## 🔧 Configuration

### Variables d'environnement

```bash
NODE_ENV=development
PORT=3000
DATABASE_URL=./database/tickets.db
ADMIN_PASSWORD=admin123
```

### Codes promo par défaut

- `NOEL2024`: 10% de réduction
- `FAMILLE`: 15% de réduction (min 4 billets)
- `EARLY`: 20% de réduction

## 🚀 Déploiement

### Local (Gratuit)

- SQLite intégré
- Pas de coûts d'hébergement
- Idéal pour tests et démos

### Production

- **Frontend**: Vercel/Netlify (~gratuit)
- **Backend**: Railway/Render (~10€/mois)
- **Base**: PostgreSQL (~10€/mois)
- **Mobile Money**: APIs officielles

## 📞 Support

Pour questions techniques:

- 📧 Email: support@kids-events.tg
- 📱 WhatsApp: +228 XX XX XX XX

---

**Développé avec ❤️ pour KIDS EVENTS Togo**
