#!/bin/bash

# 🎄 Script d'installation KIDS EVENTS Billetterie
# Usage: bash install.sh

echo "🎄 =================================="
echo "   KIDS EVENTS - Village de Noël"
echo "   Installation automatique"
echo "=================================="
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
success() { echo -e "${GREEN}✅ $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }

# Vérification des prérequis
info "Vérification des prérequis..."

if ! command -v node &> /dev/null; then
    error "Node.js n'est pas installé. Veuillez installer Node.js 16+ depuis https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    error "Node.js version 16+ requis. Version actuelle: $(node -v)"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "npm n'est pas installé."
    exit 1
fi

success "Node.js $(node -v) et npm $(npm -v) détectés"

# Création de la structure du projet
info "Création de la structure du projet..."

PROJECT_NAME="kids-events-billetterie"
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Structure des dossiers
mkdir -p backend/{database,public,logs,routes,models}
mkdir -p frontend/{src/{components,pages,utils,assets},public}

success "Structure du projet créée"

# Configuration du Backend
info "Configuration du backend..."

cd backend

# package.json backend
cat > package.json << EOL
{
  "name": "kids-events-billetterie-backend",
  "version": "1.0.0",
  "description": "API de billetterie pour KIDS EVENTS Village de Noël",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "setup": "node setup.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6",
    "uuid": "^9.0.1",
    "qrcode": "^1.5.3",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "keywords": ["billetterie", "kids-events", "mobile-money", "togo"],
  "license": "MIT"
}
EOL

# .env backend
cat > .env << EOL
NODE_ENV=development
PORT=3000
DATABASE_URL=./database/tickets.db
ADMIN_PASSWORD=admin123
JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || echo "fallback-secret-key-$(date +%s)")
EOL

# Script setup.js
cat > setup.js << 'EOL'
const fs = require('fs');
console.log('🚀 Initialisation de la base de données...');

const directories = ['database', 'public/qrcodes', 'logs'];
directories.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Dossier créé: ${dir}`);
  }
});

console.log('✅ Configuration terminée');
EOL

info "Installation des dépendances backend..."
npm install --silent

success "Backend configuré"

# Configuration du Frontend
info "Configuration du frontend..."

cd ../frontend

# package.json frontend
cat > package.json << EOL
{
  "name": "kids-events-billetterie-frontend",
  "version": "1.0.0",
  "description": "Interface de billetterie KIDS EVENTS",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "lucide-react": "^0.263.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.15",
    "postcss": "^8.4.29",
    "tailwindcss": "^3.3.3",
    "vite": "^4.4.5"
  }
}
EOL

# vite.config.js
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
EOL

# tailwind.config.js
cat > tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'kids-red': '#dc2626',
        'kids-green': '#16a34a',
        'kids-orange': '#ea580c'
      }
    }
  },
  plugins: []
}
EOL

# postcss.config.js
cat > postcss.config.js << 'EOL'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# index.html
cat > index.html << 'EOL'
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>KIDS EVENTS - Village de Noël</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎄</text></svg>" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOL

# src/main.jsx
mkdir -p src
cat > src/main.jsx << 'EOL'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOL

# src/index.css
cat > src/index.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    background: linear-gradient(135deg, #fef2f2 0%, #f0fdf4 100%);
    min-height: 100vh;
  }
}
EOL

# src/App.jsx (Version simplifiée pour commencer)
cat > src/App.jsx << 'EOL'
import React, { useState } from 'react';
import { QrCode, Scan, Users } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('home');

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 text-center">
          <div className="text-6xl mb-4">🎄</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Village de Noël</h1>
          <h2 className="text-lg text-gray-600 mb-8">KIDS EVENTS</h2>
          
          <div className="space-y-4">
            <button className="w-full bg-green-500 text-white py-4 rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center">
              <QrCode className="mr-2" />
              Scanner QR Code
            </button>
            
            <button className="w-full bg-blue-500 text-white py-4 rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center">
              <Users className="mr-2" />
              Accès Admin
            </button>
          </div>
          
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              ✅ Installation réussie !<br/>
              🚀 Prêt pour le développement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
EOL

info "Installation des dépendances frontend..."
npm install --silent

success "Frontend configuré"

# Retour au dossier racine et création des scripts
cd ..

# Script de démarrage
cat > start.sh << 'EOL'
#!/bin/bash

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎄 KIDS EVENTS - Démarrage des services${NC}"

# Fonction pour tuer les processus en arrière-plan à la fin
cleanup() {
    echo -e "\n${BLUE}Arrêt des services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT

# Démarrage du backend
echo -e "${GREEN}🚀 Démarrage du backend (port 3000)...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Attendre que le backend démarre
sleep 3

# Démarrage du frontend
echo -e "${GREEN}🚀 Démarrage du frontend (port 5173)...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

# Attendre que le frontend démarre
sleep 2

echo -e "${GREEN}✅ Services démarrés !${NC}"
echo ""
echo -e "${BLUE}📱 Frontend: http://localhost:5173${NC}"
echo -e "${BLUE}🔧 Backend:  http://localhost:3000${NC}"
echo ""
echo -e "${BLUE}Appuyez sur Ctrl+C pour arrêter${NC}"

# Attendre indéfiniment
wait
EOL

chmod +x start.sh

# README.md
cat > README.md << 'EOL'
# 🎄 KIDS EVENTS - Système de Billetterie

## 🚀 Démarrage rapide

```bash
# Démarrer tous les services
./start.sh

# Ou manuellement:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend  
cd frontend && npm run dev
```

## 📱 Accès
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Admin**: http://localhost:5173 (bouton "Accès Admin")

## 🛠 Développement

### Structure
```
kids-events-billetterie/
├── backend/           # API Node.js
├── frontend/          # Interface React
├── start.sh          # Script de démarrage
└── README.md
```

### Prochaines étapes
1. Remplacer `src/App.jsx` par l'application complète
2. Ajouter `server.js` dans le backend
3. Tester les fonctionnalités
4. Configurer Mobile Money (production)

### Commandes utiles
```bash
# Backend
cd backend
npm run dev          # Mode développement
npm run setup        # Initialisation DB

# Frontend
cd frontend
npm run dev          # Mode développement
npm run build        # Build production
```

## 📞 Support
Pour questions: support@kids-events.tg
EOL

success "Installation terminée !"
echo ""
info "📁 Projet créé dans: $(pwd)"
info "🚀 Démarrer avec: ./start.sh"
echo ""
warning "Prochaines étapes:"
echo "   1. cd $PROJECT_NAME"
echo "   2. ./start.sh"
echo "   3. Ouvrir http://localhost:5173"
echo ""
info "💡 Remplacez les fichiers App.jsx et server.js par les versions complètes"
echo ""
success "🎄 Bon développement !"