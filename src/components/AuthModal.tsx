import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, AlertCircle } from 'lucide-react';
import { store } from '../services/store';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'login') {
      const res = store.login(email, password);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
        onClose();
      }
    } else {
      const res = store.register(username, email, password);
      if (res.error) {
        setError(res.error);
      } else {
        onSuccess();
        onClose();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-[#0056b3] text-white font-extrabold text-xs px-2 py-0.5 rounded">MK</div>
            <h2 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Connexion Académique' : 'Inscription Candidat'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            Portail des Mathématiques Avancées • MK Olympiades
          </p>

          <div className="flex border-b border-slate-200 mb-5">
            <button
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                mode === 'login'
                  ? 'border-[#0056b3] text-[#0056b3]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Se Connecter
            </button>
            <button
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 pb-2.5 text-xs font-bold transition border-b-2 ${
                mode === 'register'
                  ? 'border-[#0056b3] text-[#0056b3]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Créer un Compte
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom / Pseudonyme</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: Gauss Junior"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Adresse E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@universite.org"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mot de Passe</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0056b3] hover:bg-[#0a3d75] text-white font-bold py-2.5 rounded-lg text-xs shadow-sm transition mt-2 cursor-pointer"
            >
              {mode === 'login' ? 'Connexion' : 'Finaliser l’Inscription'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
