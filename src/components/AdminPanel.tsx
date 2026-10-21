import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Olympiad, Submission, OlympiadSubmission, Problem, OlympiadTheme, ForumTopic } from '../types';
import { OLYMPIAD_THEMES } from '../data/problemsData';
import { store } from '../services/store';
import { MathView } from './MathView';
import { ImageModal } from './ImageModal';
import { ProblemEditorModal } from './ProblemEditorModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AdminOlympiadModal } from './AdminOlympiadModal';
import {
  ShieldAlert,
  Award,
  BookOpen,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  Maximize2,
  AlertCircle,
  FileQuestion,
  Edit3,
  Search,
  Smartphone,
  Upload,
  FileText,
  Clock,
  MessageSquare
} from 'lucide-react';

interface AdminPanelProps {
  currentUser: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ currentUser }) => {
  const [subTab, setSubTab] = useState<'problems' | 'olympiads' | 'submissions' | 'users' | 'forum'>('problems');
  const [olympiads, setOlympiads] = useState<Olympiad[]>(() => store.getOlympiads());
  const [selectedOlyId, setSelectedOlyId] = useState<string>(() => {
    const list = store.getOlympiads();
    return list[0]?.id || '';
  });

  // Forum Moderation
  const [allForumTopics, setAllForumTopics] = useState<ForumTopic[]>([]);
  const [forumCategoryFilter, setForumCategoryFilter] = useState<string>('all');
  const [forumSearch, setForumSearch] = useState<string>('');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Problems Bank Management
  const [allProblems, setAllProblems] = useState<Problem[]>([]);
  const [probThemeFilter, setProbThemeFilter] = useState<string>('all');
  const [probPointsFilter, setProbPointsFilter] = useState<number | 'all'>('all');
  const [probSearch, setProbSearch] = useState<string>('');
  const [isProblemEditorOpen, setIsProblemEditorOpen] = useState(false);
  const [problemToEdit, setProblemToEdit] = useState<Problem | null>(null);
  const [problemToDelete, setProblemToDelete] = useState<Problem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Problem submissions filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]);

  // Users
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [banUserId, setBanUserId] = useState<string>('');
  const [banDuration, setBanDuration] = useState<string>('1_day');
  const [banReason, setBanReason] = useState<string>('');

  // Grading Modal/Form for Olympiad Candidate
  const [gradingSub, setGradingSub] = useState<OlympiadSubmission | null>(null);
  const [problemScores, setProblemScores] = useState<Record<string, number>>({});
  const [gradingFeedback, setGradingFeedback] = useState<string>('');

  // Cutoffs editor post-correction (Requirement: admin posts medal cutoffs after correction)
  const [goldCutoff, setGoldCutoff] = useState<number>(24);
  const [silverCutoff, setSilverCutoff] = useState<number>(18);
  const [bronzeCutoff, setBronzeCutoff] = useState<number>(12);
  const [mentionCutoff, setMentionCutoff] = useState<number>(7);
  const [cutoffsSavedAlert, setCutoffsSavedAlert] = useState(false);

  // Edit Olympiad Modal State
  const [isAdminOlyModalOpen, setIsAdminOlyModalOpen] = useState(false);

  // New Olympiad Creation
  const [isCreatingOly, setIsCreatingOly] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTotalMinutes, setNewTotalMinutes] = useState(240);
  const [newProbCount, setNewProbCount] = useState(4);
  const [newPtsPerProb, setNewPtsPerProb] = useState(7);
  const [newPdfDataUrl, setNewPdfDataUrl] = useState('/assets/olympiade_mk_sujet_officiel.pdf');
  const [newPdfFileName, setNewPdfFileName] = useState('Sujet_Officiel_Olympiade.pdf');
  const [newPdfFileSize, setNewPdfFileSize] = useState('');

  // Zoom Lightbox
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomTitle, setZoomTitle] = useState('Polycopie');

  const reload = useCallback(() => {
    const olys = store.getOlympiads();
    setOlympiads(olys);
    setAllSubmissions(store.getAllSubmissions());
    setAllUsers(store.getUsers());
    setAllProblems(store.getProblems());
    setAllForumTopics(store.getForumTopics());
  }, []);

  useEffect(() => {
    reload();
    return store.subscribe(reload);
  }, [reload]);

  const activeOly = useMemo(() => {
    return olympiads.find((o) => o.id === selectedOlyId) || olympiads[0];
  }, [olympiads, selectedOlyId]);

  useEffect(() => {
    if (activeOly) {
      setGoldCutoff(activeOly.goldCutoff);
      setSilverCutoff(activeOly.silverCutoff);
      setBronzeCutoff(activeOly.bronzeCutoff);
      setMentionCutoff(activeOly.honorableMentionCutoff);
    }
  }, [activeOly?.id, activeOly?.goldCutoff, activeOly?.silverCutoff, activeOly?.bronzeCutoff, activeOly?.honorableMentionCutoff]);

  const olySubmissions = activeOly ? store.getOlympiadSubmissionsForAdmin(activeOly.id) : [];

  const handleOpenZoom = (images: string[], title: string) => {
    setZoomImages(images);
    setZoomTitle(title);
    setZoomModalOpen(true);
  };

  const handleToggleResults = (val: boolean) => {
    if (!activeOly) return;
    store.toggleOlympiadResults(activeOly.id, val);
  };

  const handleSaveCutoffs = () => {
    if (!activeOly) return;
    store.updateOlympiadMedalCutoffs(activeOly.id, {
      gold: goldCutoff,
      silver: silverCutoff,
      bronze: bronzeCutoff,
      mention: mentionCutoff
    });
    setCutoffsSavedAlert(true);
    setTimeout(() => setCutoffsSavedAlert(false), 3000);
  };

  const handleStartGrading = (sub: OlympiadSubmission) => {
    setGradingSub(sub);
    const initialScores: Record<string, number> = {};
    for (let i = 1; i <= (activeOly?.problemCount || 4); i++) {
      const key = `P${i}`;
      initialScores[key] = sub.problemScores?.[key] ?? 0;
    }
    setProblemScores(initialScores);
    setGradingFeedback(sub.feedback || 'Très bonne démonstration.');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOly || !gradingSub) return;
    store.gradeOlympiadSubmission(activeOly.id, gradingSub.id, problemScores, gradingFeedback);
    setGradingSub(null);
  };

  const handleReviewProblemSub = (subId: string, status: 'approved' | 'rejected') => {
    store.reviewSubmission(subId, status);
  };

  const handleBanUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banUserId) return;
    store.banUser(banUserId, banDuration, banReason);
    setBanReason('');
  };

  const handleUnbanUser = (userId: string) => {
    store.unbanUser(userId);
  };

  const handleCreateNewOly = (e: React.FormEvent) => {
    e.preventDefault();
    const totalPts = newProbCount * newPtsPerProb;
    const durationHours = Math.floor(newTotalMinutes / 60);
    const durationMinutes = newTotalMinutes % 60;
    const created = store.createOlympiad({
      title: newTitle.trim(),
      description: newDesc.trim() || `Olympiade officielle MK de ${newTotalMinutes} minutes.`,
      durationHours,
      durationMinutes,
      totalDurationMinutes: newTotalMinutes,
      problemCount: newProbCount,
      pointsPerProblem: newPtsPerProb,
      totalPoints: totalPts,
      goldCutoff: Math.round(totalPts * 0.85),
      silverCutoff: Math.round(totalPts * 0.65),
      bronzeCutoff: Math.round(totalPts * 0.45),
      honorableMentionCutoff: Math.max(1, newPtsPerProb),
      pdfUrl: newPdfDataUrl || '/assets/olympiade_mk_sujet_officiel.pdf',
      pdfTitle: newPdfFileName || 'Sujet_Olympiade_MK.pdf',
      pdfFileSize: newPdfFileSize || undefined,
      status: 'active',
      resultsPublished: false
    });
    setIsCreatingOly(false);
    setSelectedOlyId(created.id);
  };

  // Filtered problem submissions
  const filteredSubmissions = allSubmissions.filter((s) => {
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-rose-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-rose-800 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Panneau d'Administration Officiel MK
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Gestion des sessions d'olympiades, correction détaillée par problème, publication du palmarès et modération académique.
          </p>
        </div>

        <button
          onClick={() => {
            if (confirm('Réinitialiser la plateforme à l’état vierge officiel ?')) {
              store.resetToVirgin();
            }
          }}
          className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold px-3 py-1.5 rounded-lg border border-rose-200 transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Projet Vierge (Reset)
        </button>
      </div>

      {/* Admin Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-3 pt-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('problems')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            subTab === 'problems'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileQuestion className="w-4 h-4" />
          Banque de Problèmes ({allProblems.length})
        </button>

        <button
          onClick={() => setSubTab('olympiads')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            subTab === 'olympiads'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          Olympiades & Notations ({olySubmissions.length})
        </button>

        <button
          onClick={() => setSubTab('submissions')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            subTab === 'submissions'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Copies Problèmes ({allSubmissions.filter((s) => s.status === 'pending').length} en attente)
        </button>

        <button
          onClick={() => setSubTab('users')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            subTab === 'users'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          Utilisateurs & Suspensions ({allUsers.length})
        </button>

        <button
          onClick={() => setSubTab('forum')}
          className={`px-4 py-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
            subTab === 'forum'
              ? 'border-rose-600 text-rose-700'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Modération Forum ({allForumTopics.length})
        </button>
      </div>

      {/* ================= TAB 0: PROBLEMS BANK MANAGEMENT ================= */}
      {subTab === 'problems' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <FileQuestion className="w-4 h-4 text-[#0056b3]" />
                  Gestion des Problèmes Mathématiques (5 Thèmes)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Création, édition en direct avec LaTeX ($...$, $$...$$), réglage des points et suppression.
                </p>
              </div>

              <button
                onClick={() => {
                  setProblemToEdit(null);
                  setIsProblemEditorOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition cursor-pointer self-start sm:self-auto shrink-0"
              >
                <Plus className="w-4 h-4" />
                Nouveau Problème
              </button>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={probSearch}
                  onChange={(e) => setProbSearch(e.target.value)}
                  placeholder="Rechercher par titre, numéro, énoncé..."
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0056b3] outline-hidden"
                />
              </div>

              {/* Theme filter */}
              <div>
                <select
                  value={probThemeFilter}
                  onChange={(e) => setProbThemeFilter(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0056b3] outline-hidden"
                >
                  <option value="all">Tous les 5 thèmes</option>
                  {OLYMPIAD_THEMES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Points filter */}
              <div>
                <select
                  value={probPointsFilter}
                  onChange={(e) =>
                    setProbPointsFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#0056b3] outline-hidden"
                >
                  <option value="all">Tous les points</option>
                  {[15, 30, 45, 60, 75].map((pts) => (
                    <option key={pts} value={pts}>
                      {pts} points
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problems list */}
            {(() => {
              const filtered = allProblems.filter((p) => {
                if (probThemeFilter !== 'all' && p.theme !== probThemeFilter) return false;
                if (probPointsFilter !== 'all' && p.points !== probPointsFilter) return false;
                if (probSearch.trim()) {
                  const q = probSearch.toLowerCase();
                  const inTitle = p.title.toLowerCase().includes(q);
                  const inNum = (p.problemNumber || '').toLowerCase().includes(q);
                  const inId = p.id.toLowerCase().includes(q);
                  const inStatement = p.statement.toLowerCase().includes(q);
                  if (!inTitle && !inNum && !inId && !inStatement) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    Aucun problème ne correspond aux filtres.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between">
                    <span>{filtered.length} problème(s) trouvé(s)</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filtered.map((prob) => {
                      const numLabel =
                        prob.problemNumber ||
                        (prob.id.split('-').length >= 2 && !isNaN(Number(prob.id.split('-')[1]))
                          ? prob.id.split('-')[1]
                          : prob.id);

                      return (
                        <div
                          key={prob.id}
                          className="p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-2xs transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap text-xs">
                              <span className="font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                                N° {numLabel}
                              </span>
                              <span className="font-bold text-[#0056b3] bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                                {prob.theme}
                              </span>
                              <span className="font-extrabold text-white bg-slate-700 px-2 py-0.5 rounded text-[11px]">
                                {prob.points} pts
                              </span>
                              {prob.images && prob.images.length > 0 && (
                                <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded text-[11px]">
                                  📷 {prob.images.length} fig.
                                </span>
                              )}
                            </div>

                            <h3 className="font-bold text-sm text-slate-900">
                              <MathView content={prob.title} />
                            </h3>

                            <div className="p-2.5 bg-slate-50 rounded-lg text-xs text-slate-700 border-l-2 border-[#0056b3] max-h-28 overflow-y-auto space-y-2">
                              {prob.statement && <MathView content={prob.statement} />}
                              {prob.images && prob.images.length > 0 && (
                                <div className="flex gap-2 overflow-x-auto py-1">
                                  {prob.images.map((img, i) => (
                                    <img
                                      key={i}
                                      src={img}
                                      alt={`Fig ${i + 1}`}
                                      className="h-14 w-auto rounded border border-slate-200 bg-white object-contain cursor-pointer"
                                      onClick={() => handleOpenZoom(prob.images || [], `${prob.title} - Fig ${i + 1}`)}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            <button
                              onClick={() => {
                                setProblemToEdit(prob);
                                setIsProblemEditorOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                              title="Modifier ce problème"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => {
                                setProblemToDelete(prob);
                                setIsDeleteModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                              title="Supprimer ce problème"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                              <span>Supprimer</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ================= TAB 1: OLYMPIADS & GRADING ================= */}
      {subTab === 'olympiads' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Session active :</label>
                <select
                  value={selectedOlyId}
                  onChange={(e) => setSelectedOlyId(e.target.value)}
                  className="p-1.5 text-xs border border-slate-300 rounded-md font-semibold bg-white"
                >
                  {olympiads.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {activeOly && (
                  <button
                    type="button"
                    onClick={() => setIsAdminOlyModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-50 text-amber-900 hover:bg-amber-100 px-3 py-1.5 rounded-lg border border-amber-300 transition cursor-pointer"
                    title="Modifier la durée en minutes et importer un PDF depuis votre téléphone ou PC"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-amber-700" />
                    Modifier Sujet PDF & Minutes
                  </button>
                )}

                <button
                  onClick={() => setIsCreatingOly(true)}
                  className="inline-flex items-center gap-1 text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Nouvelle Session
                </button>

                {activeOly && (
                  <button
                    onClick={() => handleToggleResults(!activeOly.resultsPublished)}
                    className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
                      activeOly.resultsPublished
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {activeOly.resultsPublished ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" /> Palmarès Ouvert au Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" /> Palmarès Verrouillé (En Délibération)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Requirement: Admin sets/updates medal cutoffs post-grading */}
            {activeOly && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase">
                      Barème Minimal des Médailles (Post-Correction)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Fixez les seuils de points nécessaires après délibération du jury. Les candidats verront ces seuils lorsque le palmarès sera publié.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCutoffs}
                    className="px-3 py-1 text-xs font-bold bg-[#0056b3] text-white rounded shadow-xs hover:bg-blue-700 transition"
                  >
                    Enregistrer les Seuils
                  </button>
                </div>

                {cutoffsSavedAlert && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-lg flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Barème des médailles enregistré ! Les médailles ont été recalculées instantanément.</span>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-amber-800 mb-1">🥇 Seuil Or (pts)</label>
                    <input
                      type="number"
                      value={goldCutoff}
                      onChange={(e) => setGoldCutoff(parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 mb-1">🥈 Seuil Argent (pts)</label>
                    <input
                      type="number"
                      value={silverCutoff}
                      onChange={(e) => setSilverCutoff(parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-orange-800 mb-1">🥉 Seuil Bronze (pts)</label>
                    <input
                      type="number"
                      value={bronzeCutoff}
                      onChange={(e) => setBronzeCutoff(parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-blue-800 mb-1">🎖️ Mention Hon. (pts)</label>
                    <input
                      type="number"
                      value={mentionCutoff}
                      onChange={(e) => setMentionCutoff(parseInt(e.target.value) || 0)}
                      className="w-full p-1.5 text-xs border border-slate-300 rounded font-bold"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submissions to grade */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Copies Reçues pour cette Session ({olySubmissions.length})
            </h3>

            {olySubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4">Aucune copie reçue pour cette épreuve.</p>
            ) : (
              <div className="space-y-3">
                {olySubmissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{sub.username}</span>
                        <span className="text-[11px] text-slate-400">{sub.userEmail}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            sub.status === 'graded'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status === 'graded' ? `✓ Noté (${sub.overallScore} pts)` : '⏳ À Noter'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 mt-1">
                        <span>{sub.images ? sub.images.length : 0} page(s) de polycopies</span>
                        {sub.solutionNotes && <span>• Notes LaTeX fournies</span>}
                        {sub.status === 'graded' && <span className="font-bold text-slate-800">• {sub.medal}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {sub.images && sub.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleOpenZoom(sub.images, `Copies de ${sub.username}`)}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1 shadow-2xs"
                        >
                          <Maximize2 className="w-3.5 h-3.5" /> Voir Copies ({sub.images.length})
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleStartGrading(sub)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition"
                      >
                        {sub.status === 'graded' ? 'Modifier la Note' : 'Noter la Copie'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PROBLEM COPIES REVIEW ================= */}
      {subTab === 'submissions' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Statut :</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="p-1.5 text-xs border border-slate-300 rounded font-semibold bg-white"
              >
                <option value="pending">⏳ En attente ({allSubmissions.filter((s) => s.status === 'pending').length})</option>
                <option value="approved">✅ Validées ({allSubmissions.filter((s) => s.status === 'approved').length})</option>
                <option value="rejected">❌ Refusées ({allSubmissions.filter((s) => s.status === 'rejected').length})</option>
                <option value="all">Toutes ({allSubmissions.length})</option>
              </select>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-slate-600">Catégorie :</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-1.5 text-xs border border-slate-300 rounded font-semibold bg-white"
              >
                <option value="all">Toutes</option>
                <option value="Théorie des Nombres">Théorie des Nombres</option>
                <option value="Géométrie">Géométrie</option>
                <option value="Combinatoire">Combinatoire</option>
                <option value="Inégalités">Inégalités</option>
                <option value="Équations Fonctionnelles">Équations Fonctionnelles</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-xs text-slate-400">
                Aucune copie ne correspond à ce filtre.
              </div>
            ) : (
              filteredSubmissions.map((sub) => (
                <div key={sub.id} className="bg-white border border-slate-200 rounded-xl p-4.5 shadow-xs space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{sub.problemTitle}</span>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {sub.category}
                        </span>
                        <span className="text-[10px] font-extrabold text-white bg-blue-600 px-2 py-0.5 rounded">
                          {sub.points} pts
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        Candidat : <strong>{sub.username}</strong> ({sub.userEmail}) • {new Date(sub.submittedAt).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {sub.status === 'approved' ? '✓ Validé' : sub.status === 'rejected' ? '✗ Refusé' : '⏳ En attente'}
                    </span>
                  </div>

                  {/* Written solution text with LaTeX */}
                  {sub.solutionText && (
                    <div className="p-3 bg-slate-50 rounded-lg text-xs border border-slate-200 leading-relaxed">
                      <span className="block font-bold text-slate-500 text-[10px] uppercase mb-1">
                        Démonstration rédigée :
                      </span>
                      <MathView content={sub.solutionText} />
                    </div>
                  )}

                  {/* Polycopies images */}
                  {sub.images && sub.images.length > 0 && (
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600 mb-1.5">
                        Pages manuscrites ({sub.images.length}) :
                      </span>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {sub.images.map((img, i) => (
                          <div
                            key={i}
                            onClick={() => handleOpenZoom(sub.images, `${sub.problemTitle} - ${sub.username}`)}
                            className="relative border border-slate-200 rounded overflow-hidden cursor-pointer hover:border-blue-400 group shrink-0"
                          >
                            <img src={img} alt="Copie" className="h-24 w-32 object-cover" />
                            <span className="absolute bottom-1 right-1 bg-slate-900/80 text-white text-[9px] px-1 rounded">
                              p.{i + 1}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Validation attribue immédiatement +{sub.points} pts au profil du candidat.
                    </span>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReviewProblemSub(sub.id, 'rejected')}
                        className="px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md transition"
                      >
                        Refuser (0 pt)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReviewProblemSub(sub.id, 'approved')}
                        className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition"
                      >
                        Valider (+{sub.points} pts)
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 3: USERS & BANS ================= */}
      {subTab === 'users' && (
        <div className="space-y-4">
          {/* Ban Form */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wide text-rose-800 mb-3">
              Suspendre un Candidat (Plagiat ou Fraude)
            </h3>
            <form onSubmit={handleBanUser} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Candidat :</label>
                <select
                  value={banUserId}
                  onChange={(e) => setBanUserId(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold bg-white"
                >
                  <option value="">Sélectionner un utilisateur</option>
                  {allUsers
                    .filter((u) => u.role !== 'admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({u.email})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Durée :</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded font-semibold bg-white"
                >
                  <option value="1_day">1 Jour</option>
                  <option value="3_days">3 Jours</option>
                  <option value="7_days">7 Jours</option>
                  <option value="1_month">1 Mois</option>
                  <option value="permanent">Définitif (Permanent)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif :</label>
                <input
                  type="text"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Ex: Copie textuelle d'un solutionnaire..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!banUserId}
                  className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded shadow-xs transition disabled:opacity-50"
                >
                  Appliquer la Suspension
                </button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Rôle</th>
                    <th className="p-3 text-center">Points</th>
                    <th className="p-3">Statut Disciplinaire</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="p-3">
                        <span className="font-bold text-slate-900 block">{u.username}</span>
                        <span className="text-[10px] text-slate-400">{u.email}</span>
                      </td>
                      <td className="p-3 font-semibold">{u.role}</td>
                      <td className="p-3 text-center font-bold text-blue-700">{u.points} pts</td>
                      <td className="p-3">
                        {u.banned ? (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Suspendu ({u.banUntil === 'permanent' ? 'Permanent' : 'Temporaire'})
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Actif
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        {u.banned && u.role !== 'admin' && (
                          <button
                            type="button"
                            onClick={() => handleUnbanUser(u.id)}
                            className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition"
                          >
                            Lever la suspension
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: FORUM MODERATION ================= */}
      {subTab === 'forum' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-rose-600" />
                  Modération du Forum & Discussions LaTeX
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gérez tous les sujets publiés par la communauté, examinez les formules LaTeX, les photos et supprimez tout contenu inapproprié.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200">
                  Total : {allForumTopics.length} sujet(s)
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par titre, auteur ou contenu..."
                  value={forumSearch}
                  onChange={(e) => setForumSearch(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden"
                />
              </div>

              <div>
                <select
                  value={forumCategoryFilter}
                  onChange={(e) => setForumCategoryFilter(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-hidden bg-white"
                >
                  <option value="all">Toutes les catégories</option>
                  <option value="Théorie des Nombres">Théorie des Nombres</option>
                  <option value="Géométrie">Géométrie</option>
                  <option value="Combinatoire">Combinatoire</option>
                  <option value="Inégalités">Inégalités</option>
                  <option value="Équations Fonctionnelles">Équations Fonctionnelles</option>
                  <option value="Général">Général</option>
                </select>
              </div>
            </div>

            {/* Topics List */}
            {(() => {
              const filtered = allForumTopics.filter((t) => {
                if (forumCategoryFilter !== 'all' && t.category !== forumCategoryFilter) return false;
                if (forumSearch.trim()) {
                  const q = forumSearch.toLowerCase();
                  const inTitle = t.title.toLowerCase().includes(q);
                  const inAuthor = t.authorName.toLowerCase().includes(q);
                  const inContent = t.content.toLowerCase().includes(q);
                  if (!inTitle && !inAuthor && !inContent) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    Aucun sujet de forum ne correspond aux critères de recherche.
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {filtered.map((topic) => {
                    const topicImgs = topic.images && topic.images.length > 0
                      ? topic.images
                      : (topic.imageUrl ? [topic.imageUrl] : []);
                    const isExpanded = expandedTopicId === topic.id;

                    return (
                      <div
                        key={topic.id}
                        className="p-4 bg-white border border-slate-200 hover:border-slate-300 rounded-xl shadow-xs space-y-3 transition"
                      >
                        {/* Topic Header */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                              {topic.category}
                            </span>
                            <span className="text-xs font-semibold text-slate-700">
                              Par <strong className="text-slate-900">{topic.authorName}</strong>
                            </span>
                            <span className="text-[11px] text-slate-400">
                              • {new Date(topic.createdAt).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-400">{topic.views} vues</span>
                            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                              💬 {topic.replies?.length || 0}
                            </span>

                            {/* Admin Delete Topic Button */}
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Voulez-vous vraiment supprimer le sujet "${topic.title}" et toutes ses réponses ?`)) {
                                  store.deleteForumTopic(topic.id, currentUser);
                                  reload();
                                }
                              }}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                              title="Supprimer ce sujet de discussion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Supprimer sujet</span>
                            </button>
                          </div>
                        </div>

                        {/* Title with LaTeX */}
                        <div className="font-bold text-sm text-slate-900">
                          <MathView content={topic.title} />
                        </div>

                        {/* Body / LaTeX statement */}
                        {topic.content && (
                          <div className="p-3 bg-slate-50 rounded-lg text-xs leading-relaxed text-slate-700 border border-slate-100">
                            <MathView content={topic.content} />
                          </div>
                        )}

                        {/* Attached Photos with Zoom */}
                        {topicImgs.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {topicImgs.map((img, idx) => (
                              <div
                                key={idx}
                                className="relative group border border-slate-200 rounded overflow-hidden bg-slate-50 cursor-pointer max-w-[120px]"
                                onClick={() => handleOpenZoom(topicImgs, `${topic.title} - Photo ${idx + 1}`)}
                              >
                                <img
                                  src={img}
                                  alt={`Illustration ${idx + 1}`}
                                  className="h-20 w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                  <Maximize2 className="w-3.5 h-3.5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Expand / View Replies */}
                        {topic.replies && topic.replies.length > 0 && (
                          <div className="pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                              className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? 'Masquer les réponses' : `Afficher les ${topic.replies.length} réponse(s)`}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-2.5 pl-3 border-l-2 border-blue-200">
                                {topic.replies.map((reply) => {
                                  const rImgs = reply.images && reply.images.length > 0
                                    ? reply.images
                                    : (reply.imageUrl ? [reply.imageUrl] : []);

                                  return (
                                    <div
                                      key={reply.id}
                                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5"
                                    >
                                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                                        <span className="font-bold text-[#0056b3]">{reply.authorName}</span>
                                        <div className="flex items-center gap-2">
                                          <span>
                                            {new Date(reply.createdAt).toLocaleDateString('fr-FR', {
                                              day: 'numeric',
                                              month: 'short',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </span>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (window.confirm('Voulez-vous supprimer cette réponse ?')) {
                                                store.deleteForumReply(topic.id, reply.id, currentUser);
                                                reload();
                                              }
                                            }}
                                            className="text-rose-600 hover:text-rose-800 p-0.5"
                                            title="Supprimer la réponse"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>

                                      {reply.content && (
                                        <div className="text-slate-800">
                                          <MathView content={reply.content} />
                                        </div>
                                      )}

                                      {rImgs.length > 0 && (
                                        <div className="flex gap-2 pt-1">
                                          {rImgs.map((img, rIdx) => (
                                            <img
                                              key={rIdx}
                                              src={img}
                                              alt="Réponse illustration"
                                              className="h-16 w-16 object-cover rounded border border-slate-200 cursor-pointer"
                                              onClick={() => handleOpenZoom(rImgs, `Réponse de ${reply.authorName}`)}
                                            />
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL: GRADING OLYMPIAD CANDIDATE */}
      {gradingSub && activeOly && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  Notation : {gradingSub.username}
                </h3>
                <span className="text-[11px] text-slate-400">{activeOly.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setGradingSub(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: activeOly.problemCount }).map((_, i) => {
                  const key = `P${i + 1}`;
                  return (
                    <div key={key}>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Problème {i + 1} (sur {activeOly.pointsPerProblem} pts)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={activeOly.pointsPerProblem}
                        value={problemScores[key] ?? 0}
                        onChange={(e) =>
                          setProblemScores((prev) => ({
                            ...prev,
                            [key]: parseInt(e.target.value) || 0
                          }))
                        }
                        className="w-full p-2 border border-slate-300 rounded font-bold"
                      />
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Appréciation officielle du jury :
                </label>
                <textarea
                  rows={3}
                  value={gradingFeedback}
                  onChange={(e) => setGradingFeedback(e.target.value)}
                  placeholder="Commentaire de correction..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded shadow-xs"
                >
                  Enregistrer la Note & Attribuer Médaille
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE NEW OLYMPIAD MODAL */}
      {isCreatingOly && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Publier une Nouvelle Session d'Olympiade</h3>
            <form onSubmit={handleCreateNewOly} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Titre officiel :</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Olympiade Mathématique MK - Session de Printemps"
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Description :</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Description de l'épreuve..."
                  className="w-full p-2 border border-slate-300 rounded"
                />
              </div>

              {/* Duration in Minutes with Presets */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Durée de l'Épreuve en Minutes :
                  </label>
                  <span className="font-mono font-bold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    {newTotalMinutes} min ({Math.floor(newTotalMinutes / 60)}h{newTotalMinutes % 60 > 0 ? ` ${newTotalMinutes % 60}min` : ''})
                  </span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {[60, 120, 180, 240, 300].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setNewTotalMinutes(m)}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded border transition cursor-pointer ${
                        newTotalMinutes === m
                          ? 'bg-[#0056b3] text-white border-[#0056b3]'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m} min
                    </button>
                  ))}
                </div>

                <input
                  type="number"
                  min={1}
                  max={1440}
                  value={newTotalMinutes}
                  onChange={(e) => setNewTotalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs font-bold font-mono"
                  placeholder="Minutes (ex: 240)"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Nombre Problèmes :</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newProbCount}
                    onChange={(e) => setNewProbCount(parseInt(e.target.value) || 4)}
                    className="w-full p-2 border border-slate-300 rounded font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-1">Pts / Problème :</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newPtsPerProb}
                    onChange={(e) => setNewPtsPerProb(parseInt(e.target.value) || 7)}
                    className="w-full p-2 border border-slate-300 rounded font-bold"
                  />
                </div>
              </div>

              {/* Direct PDF Upload from Phone or PC */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="block text-[11px] font-bold text-slate-800 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Importer le Sujet PDF depuis votre Téléphone / Appareil :
                </label>

                <div className="border border-dashed border-blue-300 bg-white rounded-lg p-3 text-center">
                  <input
                    type="file"
                    id="new-oly-pdf-upload"
                    accept="application/pdf,.pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const res = ev.target?.result as string;
                        if (res) {
                          setNewPdfDataUrl(res);
                          setNewPdfFileName(file.name);
                          const k = 1024;
                          const s = ['Octets', 'Ko', 'Mo'];
                          const i = Math.floor(Math.log(file.size) / Math.log(k));
                          setNewPdfFileSize(parseFloat((file.size / Math.pow(k, i)).toFixed(1)) + ' ' + s[i]);
                        }
                      };
                      reader.readAsDataURL(file);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />

                  <label
                    htmlFor="new-oly-pdf-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0056b3] hover:bg-[#0a3d75] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Choisir un fichier PDF sur le téléphone
                  </label>

                  <div className="mt-2 text-[11px] text-slate-600 truncate font-medium">
                    {newPdfFileName ? (
                      <span className="text-emerald-700 font-bold flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {newPdfFileName} {newPdfFileSize ? `(${newPdfFileSize})` : ''}
                      </span>
                    ) : (
                      'Aucun fichier sélectionné (utilise le sujet officiel par défaut)'
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingOly(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded font-semibold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded shadow-xs cursor-pointer"
                >
                  Créer l'Olympiade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Olympiad Edit Modal (PDF from phone & minutes) */}
      <AdminOlympiadModal
        isOpen={isAdminOlyModalOpen}
        onClose={() => setIsAdminOlyModalOpen(false)}
        olympiad={activeOly || null}
        onUpdated={() => reload()}
      />

      {/* Lightbox Zoom for admin */}
      <ImageModal
        images={zoomImages}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
        title={zoomTitle}
      />

      {/* Problem Editor Modal */}
      <ProblemEditorModal
        isOpen={isProblemEditorOpen}
        onClose={() => {
          setIsProblemEditorOpen(false);
          setProblemToEdit(null);
        }}
        problemToEdit={problemToEdit}
        defaultTheme={probThemeFilter !== 'all' ? (probThemeFilter as OlympiadTheme) : undefined}
        onSaved={() => {
          reload();
        }}
      />

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setProblemToDelete(null);
        }}
        problem={problemToDelete}
        onConfirm={() => {
          if (problemToDelete) {
            store.deleteProblem(problemToDelete.id);
            setProblemToDelete(null);
            reload();
          }
        }}
      />
    </div>
  );
};
