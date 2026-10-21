import React from 'react';
import { ArrowLeft, BookOpen, Award, BookMarked, MessageSquare, Trophy, ShieldAlert, User as UserIcon, LogOut } from 'lucide-react';
import { AppTab, User } from '../types';

interface NavbarProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onGoBack: () => void;
  canGoBack: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuth,
  onLogout,
  onGoBack,
  canGoBack
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-12 flex items-center justify-between gap-2">
        {/* Left: Reliable Back Button & Brand Badge */}
        <div className="flex items-center gap-2">
          <button
            onClick={onGoBack}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition ${
              canGoBack
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 cursor-pointer shadow-xs active:scale-95'
                : 'bg-slate-50 text-slate-400 border-slate-200 cursor-default'
            }`}
            title="Revenir en arrière"
            aria-label="Revenir en arrière"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Retour</span>
          </button>

          <div
            onClick={() => onSelectTab('problems')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-gradient-to-br from-[#0056b3] to-[#2563eb] text-white text-[11px] font-black px-2 py-0.5 rounded shadow-xs tracking-wider">
              MK
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-bold text-[#0a3d75] tracking-tight group-hover:text-blue-700 transition">
                MK Olympiades
              </span>
            </div>
          </div>
        </div>

        {/* Center: Main Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => onSelectTab('problems')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition ${
              activeTab === 'problems'
                ? 'bg-blue-50 text-[#0056b3] border-b-2 border-[#0056b3]'
                : 'text-slate-600 hover:text-[#0056b3] hover:bg-slate-50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Problèmes
          </button>

          <button
            onClick={() => onSelectTab('olympiads')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition ${
              activeTab === 'olympiads'
                ? 'bg-blue-50 text-[#0056b3] border-b-2 border-[#0056b3]'
                : 'text-slate-600 hover:text-[#0056b3] hover:bg-slate-50'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Olympiade Officielle
          </button>

          <button
            onClick={() => onSelectTab('courses')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition ${
              activeTab === 'courses'
                ? 'bg-blue-50 text-[#0056b3] border-b-2 border-[#0056b3]'
                : 'text-slate-600 hover:text-[#0056b3] hover:bg-slate-50'
            }`}
          >
            <BookMarked className="w-3.5 h-3.5" />
            Cours Isolés
          </button>

          <button
            onClick={() => onSelectTab('forum')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition ${
              activeTab === 'forum'
                ? 'bg-blue-50 text-[#0056b3] border-b-2 border-[#0056b3]'
                : 'text-slate-600 hover:text-[#0056b3] hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Forum (LaTeX)
          </button>

          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`px-2.5 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition ${
              activeTab === 'leaderboard'
                ? 'bg-blue-50 text-[#0056b3] border-b-2 border-[#0056b3]'
                : 'text-slate-600 hover:text-[#0056b3] hover:bg-slate-50'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            Classement
          </button>

          {currentUser?.role === 'admin' && (
            <button
              onClick={() => onSelectTab('admin')}
              className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1.5 transition ${
                activeTab === 'admin'
                  ? 'bg-rose-50 text-rose-700 border-b-2 border-rose-600'
                  : 'text-rose-600 hover:bg-rose-50'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin
            </button>
          )}
        </nav>

        {/* Right: User Pill / Auth */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onSelectTab('profile')}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full border transition cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                }`}
                title="Consulter mon profil"
              >
                <div
                  style={{ backgroundColor: currentUser.avatarColor || '#0056b3' }}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-xs"
                >
                  {currentUser.username.substring(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-[#0a3d75] max-w-[90px] truncate">
                  {currentUser.username}
                </span>
                <span className="text-[10px] font-bold bg-[#0056b3] text-white px-1.5 py-0.2 rounded-full">
                  {currentUser.points} pts
                </span>
              </button>

              <button
                onClick={onLogout}
                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                title="Se déconnecter"
                aria-label="Déconnexion"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="inline-flex items-center gap-1.5 bg-[#0056b3] hover:bg-[#0a3d75] text-white text-xs font-bold px-3 py-1 rounded-md shadow-xs transition"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>Connexion</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 bg-slate-50/90 px-2 py-1 overflow-x-auto text-[11px] font-semibold text-slate-600">
        <button
          onClick={() => onSelectTab('problems')}
          className={`px-2 py-1 rounded ${activeTab === 'problems' ? 'text-[#0056b3] font-bold bg-white' : ''}`}
        >
          Problèmes
        </button>
        <button
          onClick={() => onSelectTab('olympiads')}
          className={`px-2 py-1 rounded ${activeTab === 'olympiads' ? 'text-[#0056b3] font-bold bg-white' : ''}`}
        >
          Olympiade
        </button>
        <button
          onClick={() => onSelectTab('courses')}
          className={`px-2 py-1 rounded ${activeTab === 'courses' ? 'text-[#0056b3] font-bold bg-white' : ''}`}
        >
          Cours
        </button>
        <button
          onClick={() => onSelectTab('forum')}
          className={`px-2 py-1 rounded ${activeTab === 'forum' ? 'text-[#0056b3] font-bold bg-white' : ''}`}
        >
          Forum
        </button>
        <button
          onClick={() => onSelectTab('leaderboard')}
          className={`px-2 py-1 rounded ${activeTab === 'leaderboard' ? 'text-[#0056b3] font-bold bg-white' : ''}`}
        >
          Classement
        </button>
        {currentUser?.role === 'admin' && (
          <button
            onClick={() => onSelectTab('admin')}
            className={`px-2 py-1 rounded text-rose-600 font-bold ${activeTab === 'admin' ? 'bg-white' : ''}`}
          >
            Admin
          </button>
        )}
      </div>
    </header>
  );
};
