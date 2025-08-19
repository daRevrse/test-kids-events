const fs = require("fs");
const path = require("path");

console.log("🚀 Initialisation du projet KIDS EVENTS Billetterie...\n");

// Création des dossiers nécessaires
const directories = ["database", "public", "public/qrcodes", "logs"];

directories.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`✅ Dossier créé: ${dir}`);
  }
});

// Création du fichier .env s'il n'existe pas
if (!fs.existsSync(".env")) {
  const envContent = `NODE_ENV=development
PORT=3000
DATABASE_URL=./database/tickets.db
JWT_SECRET=${
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  }
ADMIN_PASSWORD=admin123
`;
  fs.writeFileSync(".env", envContent);
  console.log("✅ Fichier .env créé");
}

// Vérification des dépendances
const packageJson = require("./package.json");
console.log(`\n📦 Projet: ${packageJson.name} v${packageJson.version}`);

console.log("\n🎯 Prochaines étapes:");
console.log("1. npm install (pour installer les dépendances)");
console.log("2. npm run dev (pour démarrer le serveur)");
console.log("3. Ouvrir http://localhost:3000 dans votre navigateur");

console.log("\n📱 Pour le frontend:");
console.log("1. cd frontend && npm install");
console.log("2. npm run dev");
console.log("3. Ouvrir http://localhost:5173");
