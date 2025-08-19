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
