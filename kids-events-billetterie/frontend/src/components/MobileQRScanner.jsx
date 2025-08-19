// Composant Scanner QR réel pour mobile
import React, { useState, useEffect, useRef } from "react";
import { Camera, X, Flashlight } from "lucide-react";

const MobileQRScanner = ({ onScan, onClose }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Demander permission caméra
  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Caméra arrière
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      setHasPermission(true);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      startScanning();
    } catch (err) {
      console.error("Erreur accès caméra:", err);
      setHasPermission(false);
      setError("Accès caméra refusé. Veuillez autoriser dans les paramètres.");
    }
  };

  // Scanner QR Code avec canvas
  const startScanning = () => {
    if (!isScanning) {
      setIsScanning(true);
      scanQRCode();
    }
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const scan = () => {
      if (!isScanning) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        // Utiliser une bibliothèque QR comme qr-scanner ou jsQR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Ici, vous devriez utiliser jsQR pour décoder
        // const code = jsQR(imageData.data, imageData.width, imageData.height);

        // Simulation pour le développement
        // En production, remplacer par la vraie détection

        setTimeout(() => {
          if (Math.random() > 0.95) {
            // Simule une détection
            const mockQRData = "KIDS_EVENT_VILLAGE_NOEL_2024";
            onScan(mockQRData);
            stopScanning();
          } else {
            requestAnimationFrame(scan);
          }
        }, 100);
      } catch (err) {
        console.error("Erreur scan QR:", err);
        requestAnimationFrame(scan);
      }
    };

    requestAnimationFrame(scan);
  };

  const stopScanning = () => {
    setIsScanning(false);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  // Interface pour permissions
  if (hasPermission === null) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 m-4 max-w-sm">
          <div className="text-center">
            <Camera size={48} className="mx-auto text-blue-600 mb-4" />
            <h3 className="text-lg font-bold mb-2">Accès à la caméra</h3>
            <p className="text-gray-600 mb-4">
              Nous avons besoin d'accéder à votre caméra pour scanner le QR
              code.
            </p>
            <div className="space-y-2">
              <button
                onClick={requestCameraPermission}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
              >
                Autoriser la caméra
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface d'erreur
  if (hasPermission === false || error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 m-4 max-w-sm">
          <div className="text-center">
            <X size={48} className="mx-auto text-red-600 mb-4" />
            <h3 className="text-lg font-bold mb-2">Erreur caméra</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <button
                onClick={requestCameraPermission}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold"
              >
                Réessayer
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-300 text-gray-700 py-3 rounded-lg font-semibold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Interface de scan
  return (
    <div className="fixed inset-0 bg-black z-50">
      <div className="relative h-full">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        <canvas ref={canvasRef} className="hidden" />

        {/* Overlay de scan */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Cadre de scan */}
            <div className="w-64 h-64 border-4 border-white border-opacity-50 relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-500"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-500"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-500"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-500"></div>
            </div>

            {/* Ligne de scan animée */}
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500 animate-bounce"></div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute top-16 left-0 right-0 text-center text-white px-4">
          <h2 className="text-xl font-bold mb-2">Scanner le QR Code</h2>
          <p className="text-sm opacity-80">
            Placez le QR code dans le cadre pour l'scanner
          </p>
        </div>

        {/* Boutons */}
        <div className="absolute bottom-16 left-0 right-0 px-4">
          <div className="flex justify-center space-x-4">
            <button
              onClick={onClose}
              className="bg-red-500 text-white p-4 rounded-full"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant PWA avec installation
const PWAInstallPrompt = () => {
  const [showInstall, setShowInstall] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === "accepted") {
        setShowInstall(false);
      }
    }
  };

  if (!showInstall) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 z-40">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="font-bold text-sm">Installer l'app</h4>
          <p className="text-xs text-gray-600">
            Accès rapide depuis votre écran d'accueil
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowInstall(false)}
            className="text-gray-500 text-xs px-2 py-1"
          >
            Plus tard
          </button>
          <button
            onClick={handleInstall}
            className="bg-blue-500 text-white text-xs px-3 py-1 rounded"
          >
            Installer
          </button>
        </div>
      </div>
    </div>
  );
};

// Configuration PWA - manifest.json
const manifestJSON = {
  name: "KIDS EVENTS - Village de Noël",
  short_name: "KIDS EVENTS",
  description: "Billetterie Village de Noël",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#16a34a",
  orientation: "portrait",
  icons: [
    {
      src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎄</text></svg>",
      sizes: "192x192",
      type: "image/svg+xml",
    },
    {
      src: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🎄</text></svg>",
      sizes: "512x512",
      type: "image/svg+xml",
    },
  ],
  categories: ["business", "entertainment"],
  lang: "fr",
};

// Service Worker pour PWA
const serviceWorkerCode = `
// Service Worker pour cache offline
const CACHE_NAME = 'kids-events-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner le cache ou faire la requête
        return response || fetch(event.request);
      })
  );
});
`;

// Hook pour gérer l'état hors-ligne
const useOfflineStatus = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  return isOffline;
};

// Composant d'alerte hors-ligne
const OfflineAlert = () => {
  const isOffline = useOfflineStatus();

  if (!isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-2 text-center text-sm z-50">
      📱 Mode hors-ligne - Certaines fonctionnalités peuvent être limitées
    </div>
  );
};

// Configuration pour package.json (dépendances supplémentaires)
const additionalDependencies = {
  // Pour scanner QR en production
  jsqr: "^1.4.0",
  "qr-scanner": "^1.4.2",

  // Pour PWA
  "workbox-webpack-plugin": "^6.6.0",

  // Pour vibrations mobiles
  "navigator.vibrate": "polyfill si nécessaire",
};

export {
  MobileQRScanner,
  PWAInstallPrompt,
  OfflineAlert,
  useOfflineStatus,
  manifestJSON,
  serviceWorkerCode,
  additionalDependencies,
};
