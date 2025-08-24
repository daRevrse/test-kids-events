import { createContext, useContext, useEffect, useState } from "react";
import { apiUtils } from "../services/api";
import { AlertTriangle, WifiOff } from "lucide-react";

// --- HOOKS --- //
const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
};

const useApiStatus = () => {
  const [apiWorking, setApiWorking] = useState(true);

  const testAPIConnection = async () => {
    try {
      const result = await apiUtils.testConnection();
      setApiWorking(result.success);
      if (!result.success)
        console.warn("API non accessible, utilisation du cache local");
    } catch (error) {
      setApiWorking(false);
      console.error("Test API failed:", error);
    }
  };

  useEffect(() => {
    testAPIConnection();

    // 🔄 Reteste toutes les 30 sec si tu veux
    // const interval = setInterval(testAPIConnection, 30000);
    // return () => clearInterval(interval);
  }, []);

  return apiWorking;
};

// --- CONTEXT --- //
const ConnectivityContext = createContext();

export const ConnectivityProvider = ({ children }) => {
  const isOnline = useOnlineStatus();
  const apiWorking = useApiStatus();

  return (
    <ConnectivityContext.Provider value={{ isOnline, apiWorking }}>
      {children}
    </ConnectivityContext.Provider>
  );
};

// Hook pour utiliser le contexte
export const useConnectivity = () => useContext(ConnectivityContext);

// --- ALERT COMPONENT --- //
export const ConnectivityAlert = () => {
  const { isOnline, apiWorking } = useConnectivity();

  if (isOnline && apiWorking) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 p-2 text-center text-sm text-white ${
        !isOnline ? "bg-red-500" : "bg-orange-500"
      }`}
    >
      {!isOnline ? (
        <div className="flex items-center justify-center space-x-2">
          <WifiOff size={16} />
          <span>Mode hors-ligne - Fonctionnalités limitées</span>
        </div>
      ) : (
        <div className="flex items-center justify-center space-x-2">
          <AlertTriangle size={16} />
          <span>Problème de connexion API - Utilisation du cache local</span>
        </div>
      )}
    </div>
  );
};
