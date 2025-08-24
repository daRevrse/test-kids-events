// src/components/TicketController.jsx
import React, { useState } from "react";
import { Scan, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { ticketService } from "../services/api";

const TicketController = ({ onBack }) => {
  const [scannedCode, setScannedCode] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const verifyTicket = async () => {
    if (!scannedCode.trim()) return;

    setLoading(true);
    setVerificationResult(null);

    try {
      const result = await ticketService.verifyTicket({
        // qrCode: scannedCode,
        ticketId: scannedCode,
      });

      setVerificationResult(result);
    } catch (error) {
      setVerificationResult({
        valid: false,
        message: "Erreur de vérification: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">Contrôle d'accès</h1>
            <button
              onClick={onBack}
              className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
            >
              <ArrowLeft size={16} />
              <span>Retour</span>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Scanner un QR code ou saisir l'ID
              </label>
              <input
                type="text"
                value={scannedCode}
                onChange={(e) => setScannedCode(e.target.value)}
                placeholder="Scanner ou coller le code..."
                className="w-full p-3 border border-gray-300 rounded-lg"
                onKeyPress={(e) => e.key === "Enter" && verifyTicket()}
              />
            </div>

            <button
              onClick={verifyTicket}
              disabled={loading || !scannedCode.trim()}
              className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <Scan size={20} />
              )}
              <span>{loading ? "Vérification..." : "Vérifier le ticket"}</span>
            </button>

            {verificationResult && (
              <div
                className={`p-4 rounded-lg border ${
                  verificationResult.valid
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  {verificationResult.valid ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <XCircle className="text-red-600" size={20} />
                  )}
                  <span
                    className={`font-semibold ${
                      verificationResult.valid
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {verificationResult.message}
                  </span>
                </div>

                {verificationResult.valid && verificationResult.ticket && (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• ID: {verificationResult.ticket.id}</p>
                    <p>
                      • Personnes: {verificationResult.ticket.nombreBillets}
                    </p>
                    <p>
                      • Montant:{" "}
                      {verificationResult.ticket.prixTotal?.toLocaleString()}{" "}
                      FCFA
                    </p>
                    <p>• Paiement: {verificationResult.ticket.typePaiement}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Instructions:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Scanner le QR code du ticket</li>
              <li>• Ou saisir manuellement l'ID du ticket</li>
              <li>• Appuyer sur Entrée ou le bouton "Vérifier"</li>
              <li>• Autoriser l'accès si le ticket est valide</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketController;
