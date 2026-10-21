import React, { useState, useEffect } from 'react';
import { AppTab, User } from './types';
import { store } from './services/store';
import { Navbar } from './components/Navbar';
import { ProblemsView } from './components/ProblemsView';
import { OlympiadsView } from './components/OlympiadsView';
import { CoursesView } from './components/CoursesView';
import { ForumView } from './components/ForumView';
import { LeaderboardView } from './components/LeaderboardView';
import { UserProfileView } from './components/UserProfileView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { ErrorBoundary } from './components/ErrorBoundary';

const VALID_TABS: AppTab[] = ['problems', 'olympiads', 'courses', 'forum', 'leaderboard', 'profile', 'admin'];

function getTabFromHash(): AppTab {
  try {
    const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0].trim();
    if (VALID_TABS.includes(raw as AppTab)) {
      return raw as AppTab;
    }
  } catch {
    // ignore
  }
  return 'problems';
}

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AppTab>(() => getTabFromHash());
  // Robust navigation history stack so back button works reliably
  const [historyStack, setHistoryStack] = useState<AppTab[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(store.getCurrentUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    const handleStoreChange = () => {
      setCurrentUser(store.getCurrentUser());
    };
    return store.subscribe(handleStoreChange);
  }, []);

  // Hash-based routing to preserve tab on refresh and support browser back/forward
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState({ tab: currentTab }, '', `#${currentTab}`);
    }

    const handleHashSync = () => {
      const tab = getTabFromHash();
      setCurrentTab((prev) => {
        if (prev !== tab) {
          return tab;
        }
        return prev;
      });
    };

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);

    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  const handleSelectTab = (newTab: AppTab) => {
    if (newTab === currentTab) return;
    setHistoryStack((prev) => [...prev, currentTab]);
    setCurrentTab(newTab);
    window.location.hash = newTab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    // If currently inside a forum topic detail (#forum?topic=...), return to main forum list first
    if (window.location.hash.includes('?topic=')) {
      window.location.hash = '#forum';
      return;
    }

    if (historyStack.length > 0) {
      const prevTab = historyStack[historyStack.length - 1];
      setHistoryStack((prev) => prev.slice(0, prev.length - 1));
      setCurrentTab(prevTab);
      window.location.hash = prevTab;
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      if (currentTab !== 'problems') {
        setCurrentTab('problems');
        window.location.hash = 'problems';
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canGoBack =
    window.location.hash.includes('?topic=') ||
    historyStack.length > 0 ||
    currentTab !== 'problems';

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-[#0f172a]">
      {/* Navbar with reliable back button */}
      <Navbar
        activeTab={currentTab}
        onSelectTab={handleSelectTab}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={() => {
          store.logout();
          setCurrentUser(null);
          if (currentTab === 'profile' || currentTab === 'admin') {
            handleSelectTab('problems');
          }
        }}
        onGoBack={handleGoBack}
        canGoBack={canGoBack}
      />

      {/* Main Content View with Error Boundary */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5">
        <ErrorBoundary fallbackTitle="Une erreur est survenue lors de l'affichage">
          {currentTab === 'problems' && (
            <ProblemsView
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentTab === 'olympiads' && (
            <OlympiadsView
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
              onOpenAdmin={() => handleSelectTab('admin')}
            />
          )}

          {currentTab === 'courses' && <CoursesView />}

          {currentTab === 'forum' && (
            <ForumView
              currentUser={currentUser}
              onOpenAuth={() => setIsAuthModalOpen(true)}
            />
          )}

          {currentTab === 'leaderboard' && <LeaderboardView />}
        </ErrorBoundary>

        {currentTab === 'profile' && currentUser && (
          <UserProfileView
            currentUser={currentUser}
            onLogout={() => {
              store.logout();
              setCurrentUser(null);
              handleSelectTab('problems');
            }}
            onGoBack={handleGoBack}
          />
        )}

        {currentTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel currentUser={currentUser} />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-10 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#0a3d75]">MK Olympiades</span>
            <span>•</span>
            <span>Portail des Mathématiques Avancées</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => handleSelectTab('courses')}
              className="hover:text-blue-700 transition"
            >
              Théorie & Cours
            </button>
            <button
              onClick={() => handleSelectTab('forum')}
              className="hover:text-blue-700 transition"
            >
              Forum LaTeX
            </button>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setCurrentUser(store.getCurrentUser());
        }}
      />
    </div>
  );
};
