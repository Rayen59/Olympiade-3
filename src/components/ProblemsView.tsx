import React, { useState, useMemo, useEffect } from 'react';
import { Problem, User, OlympiadTheme } from '../types';
import { OLYMPIAD_THEMES } from '../data/problemsData';
import { store } from '../services/store';
import { MathView } from './MathView';
import { ProblemSubmissionModal } from './ProblemSubmissionModal';
import { ProblemEditorModal } from './ProblemEditorModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ImageModal } from './ImageModal';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Plus,
  Edit3,
  Trash2,
  ShieldAlert,
  Image as ImageIcon,
  Maximize2,
  Lock
} from 'lucide-react';

interface ProblemsViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

export const ProblemsView: React.FC<ProblemsViewProps> = ({ currentUser, onOpenAuth }) => {
  const [selectedTheme, setSelectedTheme] = useState<string>('all');
  const [selectedPoints, setSelectedPoints] = useState<number | 'all'>('all');
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tick, setTick] = useState(0);

  // Admin state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [problemToEdit, setProblemToEdit] = useState<Problem | null>(null);
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Subscribe to store updates
  useEffect(() => {
    return store.subscribe(() => {
      setTick((t) => t + 1);
    });
  }, []);

  const problems = useMemo(() => {
    return store.getProblems(selectedTheme, selectedPoints);
  }, [selectedTheme, selectedPoints, tick]);

  const userSubmissions = useMemo(() => {
    if (!currentUser) return {};
    const subs = store.getUserSubmissions(currentUser.id);
    const map: Record<string, typeof subs[0]> = {};
    subs.forEach((s) => {
      map[s.problemId] = s;
    });
    return map;
  }, [currentUser, tick]);

  const handleOpenProblem = (p: Problem) => {
    setActiveProblem(p);
    setIsModalOpen(true);
  };

  const handleCreateProblem = () => {
    setProblemToEdit(null);
    setIsEditorOpen(true);
  };

  const handleEditProblem = (p: Problem, e: React.MouseEvent) => {
    e.stopPropagation();
    setProblemToEdit(p);
    setIsEditorOpen(true);
  };

  const handleDeletePrompt = (p: Problem, e: React.MouseEvent) => {
    e.stopPropagation();
    setProblemToDelete(p);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (problemToDelete) {
      store.deleteProblem(problemToDelete.id);
      setProblemToDelete(null);
      setTick((t) => t + 1);
    }
  };

  // Lightbox Zoom state for problem figures
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [zoomTitle, setZoomTitle] = useState('');

  const getPointsBadgeColor = (points: number) => {
    switch (points) {
      case 15:
        return 'bg-linear-to-r from-emerald-600 to-emerald-700 text-white';
      case 30:
        return 'bg-linear-to-r from-sky-600 to-sky-700 text-white';
      case 45:
        return 'bg-linear-to-r from-blue-600 to-blue-700 text-white';
      case 60:
        return 'bg-linear-to-r from-indigo-600 to-indigo-700 text-white';
      case 75:
        return 'bg-linear-to-r from-rose-600 to-rose-700 text-white';
      default:
        return 'bg-linear-to-r from-slate-700 to-slate-800 text-white';
    }
  };

  const getThemeBadge = (theme: OlympiadTheme) => {
    switch (theme) {
      case 'Théorie des Nombres':
        return {
          icon: '🔢',
          label: 'Théorie des Nombres',
          badgeClass: 'bg-indigo-50 border-indigo-200 text-indigo-700'
        };
      case 'Géométrie':
        return {
          icon: '📐',
          label: 'Géométrie',
          badgeClass: 'bg-emerald-50 border-emerald-200 text-emerald-700'
        };
      case 'Combinatoire':
        return {
          icon: '🎲',
          label: 'Combinatoire',
          badgeClass: 'bg-amber-50 border-amber-200 text-amber-800'
        };
      case 'Inégalités':
        return {
          icon: '⚖️',
          label: 'Inégalités',
          badgeClass: 'bg-cyan-50 border-cyan-200 text-cyan-800'
        };
      case 'Équations Fonctionnelles':
        return {
          icon: '⚡',
          label: 'Équations Fonctionnelles',
          badgeClass: 'bg-purple-50 border-purple-200 text-purple-700'
        };
      default:
        return {
          icon: '📘',
          label: theme,
          badgeClass: 'bg-blue-50 border-blue-200 text-[#0056b3]'
        };
    }
  };

  const extractProblemNum = (id: string): string => {
    const parts = id.split('-');
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      return parts[1];
    }
    return '';
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0a3d75] flex items-center gap-2">
            <span>📘 Banque Officielle de Problèmes Olympiques</span>
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Problèmes classés par thématique : Théorie des Nombres, Géométrie, Combinatoire, Inégalités et Équations Fonctionnelles.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleCreateProblem}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            Ajouter un Problème
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-[#0a3d75]">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="w-4 h-4 text-[#0056b3]" />
            <span>Mode Administrateur actif : Vous pouvez poster, modifier et supprimer des problèmes avec aperçu LaTeX en direct.</span>
          </div>
          <span className="font-bold text-[11px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
            {problems.length} problèmes enregistrés
          </span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-3">
        {/* Theme Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Thème :</span>
          <button
            onClick={() => setSelectedTheme('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedTheme === 'all'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tous
          </button>
          {OLYMPIAD_THEMES.map((theme) => (
            <button
              key={theme}
              onClick={() => setSelectedTheme(theme)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedTheme === theme
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {theme}
            </button>
          ))}
        </div>

        {/* Points Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-[11px] font-bold uppercase text-slate-400 mr-1">Points :</span>
          <button
            onClick={() => setSelectedPoints('all')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
              selectedPoints === 'all'
                ? 'bg-[#0056b3] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tous
          </button>
          {[15, 30, 45, 60, 75].map((pts) => (
            <button
              key={pts}
              onClick={() => setSelectedPoints(pts)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition cursor-pointer ${
                selectedPoints === pts
                  ? 'bg-[#0056b3] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {pts} pts
            </button>
          ))}
          <span className="ml-auto text-xs text-slate-400 font-mono">
            {problems.length} problème(s) affiché(s)
          </span>
        </div>
      </div>

      {/* Problems Grid */}
      {problems.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-500">
          <p className="text-sm font-semibold">Aucun problème ne correspond aux critères sélectionnés.</p>
          {isAdmin && (
            <button
              onClick={handleCreateProblem}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0056b3] text-white text-xs font-bold rounded-lg hover:bg-[#0a3d75] transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Créer un premier problème dans cette catégorie
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {problems.map((problem) => {
            const sub = userSubmissions[problem.id];
            const numLabel = problem.problemNumber || extractProblemNum(problem.id);
            const themeInfo = getThemeBadge(problem.theme);

            return (
              <div
                key={problem.id}
                className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between relative group"
              >
                <div>
                  {/* Badges Bar */}
                  <div className="flex items-center justify-between gap-2 mb-2.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {numLabel && (
                        <span className="text-[11px] font-mono font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          N° {numLabel}
                        </span>
                      )}
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${themeInfo.badgeClass}`}>
                        <span>{themeInfo.icon}</span>
                        <span>{themeInfo.label}</span>
                      </span>
                      {problem.images && problem.images.length > 0 && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-blue-600" />
                          <span>{problem.images.length} fig.</span>
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-md shadow-2xs ${getPointsBadgeColor(
                        problem.points
                      )}`}
                    >
                      {problem.points} points
                    </span>
                  </div>

                  {/* Problem Title Rendered in LaTeX */}
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base mb-2.5 leading-snug">
                    <MathView content={problem.title} />
                  </h3>

                  {/* Math Statement (if text is present) */}
                  {problem.statement && (
                    <div className="p-3.5 bg-slate-50/80 rounded-xl text-xs leading-relaxed text-slate-700 border-l-3 border-[#0056b3] mb-3">
                      <MathView content={problem.statement} />
                    </div>
                  )}

                  {/* Problem Figures / Images Gallery (if images present) */}
                  {problem.images && problem.images.length > 0 && (
                    <div className="mb-3 space-y-1.5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {problem.images.map((img, idx) => (
                          <div
                            key={idx}
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomImages(problem.images || []);
                              setZoomIndex(idx);
                              setZoomTitle(`${problem.title} - Figure ${idx + 1}`);
                              setIsImageModalOpen(true);
                            }}
                            className="group/img relative border border-slate-200 rounded-lg overflow-hidden bg-slate-100 aspect-4/3 flex items-center justify-center cursor-pointer hover:border-blue-400 transition shadow-2xs"
                          >
                            <img
                              src={img}
                              alt={`Figure ${idx + 1}`}
                              className="w-full h-full object-contain p-1 group-hover/img:scale-105 transition"
                            />
                            <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                              <span className="p-1 bg-white/95 text-slate-900 rounded-full shadow-xs">
                                <Maximize2 className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              Fig.{idx + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action and status */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  {/* Status for regular user */}
                  <div>
                    {sub ? (
                      <div className="flex items-center gap-1.5 text-xs font-semibold">
                        {sub.status === 'approved' ? (
                          <span className="text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Lock className="w-3.5 h-3.5" /> Validé & Clôturé (+{sub.points} pts)
                          </span>
                        ) : sub.status === 'rejected' ? (
                          <span className="text-rose-700 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" /> Refusé (Correction possible)
                          </span>
                        ) : (
                          <span className="text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Clock className="w-3.5 h-3.5" /> En cours de correction
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Non soumis</span>
                    )}
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1.5">
                    {isAdmin && (
                      <>
                        <button
                          onClick={(e) => handleEditProblem(problem, e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition cursor-pointer"
                          title="Modifier ce problème"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={(e) => handleDeletePrompt(problem, e)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition cursor-pointer"
                          title="Supprimer ce problème"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>Supprimer</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleOpenProblem(problem)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer ${
                        sub?.status === 'approved'
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                          : sub?.status === 'rejected'
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : sub?.status === 'pending'
                          ? 'bg-slate-700 hover:bg-slate-800 text-white'
                          : 'bg-[#0056b3] hover:bg-[#0a3d75] text-white'
                      }`}
                    >
                      {sub?.status === 'approved' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Voir Copie (Clôturée)</span>
                        </>
                      ) : sub?.status === 'rejected' ? (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Corriger / Renvoyer</span>
                        </>
                      ) : sub?.status === 'pending' ? (
                        <>
                          <Clock className="w-3.5 h-3.5" />
                          <span>Voir Copie (En attente)</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Soumettre</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* User Submission Modal */}
      <ProblemSubmissionModal
        problem={activeProblem}
        currentUser={currentUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmitted={() => setTick((t) => t + 1)}
        onOpenAuth={onOpenAuth}
      />

      {/* Admin Problem Editor Modal */}
      <ProblemEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setProblemToEdit(null);
        }}
        problemToEdit={problemToEdit}
        defaultTheme={selectedTheme !== 'all' ? (selectedTheme as OlympiadTheme) : undefined}
        onSaved={() => {
          setTick((t) => t + 1);
        }}
      />

      {/* Admin Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProblemToDelete(null);
        }}
        problem={problemToDelete}
        onConfirm={handleConfirmDelete}
      />

      {/* Lightbox for Problem Figures */}
      <ImageModal
        images={zoomImages}
        initialIndex={zoomIndex}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        title={zoomTitle}
      />
    </div>
  );
};
