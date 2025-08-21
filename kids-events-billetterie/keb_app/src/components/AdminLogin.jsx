// src/components/AdminLogin.jsx
import React, { useState } from "react";
import { Lock, ArrowLeft } from "lucide-react";

const AdminLogin = ({ onLogin, onBack }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Vérification simple - à remplacer par une vérification plus sécurisée
    if (username === "admin" && password === "admin123") {
      localStorage.setItem("adminAuthenticated", "true");
      onLogin();
    } else {
      setError("Identifiants incorrects");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Connexion Admin</h2>
          <button
            onClick={onBack}
            className="flex items-center space-x-1 text-blue-500 hover:text-blue-600"
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600"
          >
            <div className="flex items-center justify-center space-x-2">
              <Lock size={16} />
              <span>Se connecter</span>
            </div>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
