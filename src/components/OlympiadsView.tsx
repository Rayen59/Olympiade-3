import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Olympiad, OlympiadSubmission, User } from '../types';
import { store } from '../services/store';
import { ImageModal } from './ImageModal';
import { MathView } from './MathView';
import { AdminOlympiadModal } from './AdminOlympiadModal';
import {
  Award,
  Clock,
  FileDown,
  Upload,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Maximize2,
  Trash2,
  Play,
  Eye,
  EyeOff,
  Trophy,
  FileText,
  Smartphone,
  ShieldCheck,
  Edit3,
  Sliders,
  Sparkles,
  DownloadCloud,
  Share2,
  Copy,
  Check,
  MessageCircle,
  Unlock,
  CheckCheck
} from 'lucide-react';

interface OlympiadsViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const OlympiadsView: React.FC<OlympiadsViewProps> = ({ currentUser, onOpenAuth, onOpenAdmin }) => {
  const [olympiads, setOlympiads] = useState<Olympiad[]>(() => store.getOlympiads());
  const [selectedOlyId, setSelectedOlyId] = useState<string>(() => {
    const list = store.getOlympiads();
    return list[0]?.id || '';
  });
  const [mySubmission, setMySubmission] = useState<OlympiadSubmission | null>(null);

  // Active View Tab: 'exam' (subject, timer & submission) | 'results' (leaderboard & cutoffs)
  const [activeSection, setActiveSection] = useState<'exam' | 'results'>('exam');

  // Admin Modal State
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Exam Countdown Timer State
  const [examStartTime, setExamStartTime] = useState<number | null>(() => {
    const active = store.getOlympiads()[0];
    if (active && currentUser) {
      return store.getExamStartTime(active.id, currentUser.id);
    }
    return null;
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [examStartedNotification, setExamStartedNotification] = useState(false);

  // Candidate Submission Form State
  const [images, setImages] = useState<string[]>([]);
  const [solutionNotes, setSolutionNotes] = useState('');
  const [showLatexPreview, setShowLatexPreview] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Zoom Lightbox
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);

  // Memoized Active Olympiad
  const activeOly = useMemo(() => {
    return (selectedOlyId ? olympiads.find((o) => o.id === selectedOlyId) : olympiads[0]) || olympiads[0];
  }, [olympiads, selectedOlyId]);

  // Refresh data on store updates
  const reloadData = useCallback(() => {
    const list = store.getOlympiads();
    setOlympiads(list);
    const activeId = selectedOlyId || list[0]?.id || '';
    if (activeId && currentUser) {
      const sub = store.getMyOlympiadSubmission(activeId, currentUser.id);
      setMySubmission(sub);
      const st = store.getExamStartTime(activeId, currentUser.id);
      setExamStartTime(st);
    }
  }, [currentUser, selectedOlyId]);

  useEffect(() => {
    reloadData();
    return store.subscribe(reloadData);
  }, [reloadData]);

  // Synchronize submission state when active Olympiad or user changes
  useEffect(() => {
    if (activeOly && currentUser) {
      const sub = store.getMyOlympiadSubmission(activeOly.id, currentUser.id);
      setMySubmission(sub);
      if (sub) {
        setImages(sub.images || []);
        setSolutionNotes(sub.solutionNotes || '');
      } else {
        setImages([]);
        setSolutionNotes('');
      }
      const st = store.getExamStartTime(activeOly.id, currentUser.id);
      setExamStartTime(st);
    } else {
      setMySubmission(null);
      setImages([]);
      setSolutionNotes('');
      setExamStartTime(null);
    }
  }, [activeOly?.id, currentUser?.id]);

  // Countdown Interval Effect
  useEffect(() => {
    if (!activeOly || !examStartTime) {
      setSecondsRemaining(null);
      return;
    }

    const totalSeconds = (activeOly.totalDurationMinutes || 240) * 60;

    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - examStartTime) / 1000);
      const remaining = Math.max(0, totalSeconds - elapsed);
      setSecondsRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [examStartTime, activeOly?.id, activeOly?.totalDurationMinutes]);

  const isExamTimeExpired = secondsRemaining !== null && secondsRemaining <= 0;

  // Requirement: Countdown automatically starts when downloading the subject
  const handleDownloadAndStartExam = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (!activeOly) return;

    // Start timer automatically if not started
    if (!examStartTime) {
      const st = store.startExam(activeOly.id, currentUser.id);
      setExamStartTime(st);
      setExamStartedNotification(true);
    }

    // Trigger PDF download
    const link = document.createElement('a');
    link.href = activeOly.pdfUrl;
    link.download = activeOly.pdfTitle || 'Sujet_Officiel_Olympiade_MK.pdf';
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          setImages((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenZoom = (index: number) => {
    setZoomImageIndex(index);
    setZoomModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!activeOly) return;

    if (isExamTimeExpired) {
      setSubmitError('Le temps officiel est terminé. Vous ne pouvez plus envoyer de copie pour cette épreuve.');
      return;
    }

    const res = store.submitOlympiadCopies(activeOly.id, currentUser, {
      images,
      solutionNotes
    });

    if (res.error) {
      setSubmitError(res.error);
    } else {
      setSubmitSuccess('Vos copies ont été transmises au jury officiel avec succès !');
      setMySubmission(res.submission || null);
    }
  };

  // Share link copy state
  const [copiedLink, setCopiedLink] = useState(false);

  // Admin inline cutoffs post-correction
  const [adminGoldCutoff, setAdminGoldCutoff] = useState<number>(activeOly?.goldCutoff || 24);
  const [adminSilverCutoff, setAdminSilverCutoff] = useState<number>(activeOly?.silverCutoff || 18);
  const [adminBronzeCutoff, setAdminBronzeCutoff] = useState<number>(activeOly?.bronzeCutoff || 12);
  const [adminMentionCutoff, setAdminMentionCutoff] = useState<number>(activeOly?.honorableMentionCutoff || 7);
  const [cutoffSuccessMsg, setCutoffSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeOly) {
      setAdminGoldCutoff(activeOly.goldCutoff);
      setAdminSilverCutoff(activeOly.silverCutoff);
      setAdminBronzeCutoff(activeOly.bronzeCutoff);
      setAdminMentionCutoff(activeOly.honorableMentionCutoff);
    }
  }, [activeOly?.id, activeOly?.goldCutoff, activeOly?.silverCutoff, activeOly?.bronzeCutoff, activeOly?.honorableMentionCutoff]);

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}${window.location.pathname}#olympiads`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {
      // fallback
    });
  };

  const getWhatsAppShareUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}#olympiads`;
    const text = `🏆 Participez à l'Olympiade Mathématique MK : "${activeOly?.title || 'Session Officielle'}" (${activeOly?.totalDurationMinutes || 240} min, ${activeOly?.totalPoints || 28} pts).\nTéléchargez le sujet et déposez vos copies ici : ${url}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  const handleSaveCutoffsFromOlympiad = () => {
    if (!activeOly) return;
    store.updateOlympiadMedalCutoffs(activeOly.id, {
      gold: Number(adminGoldCutoff),
      silver: Number(adminSilverCutoff),
      bronze: Number(adminBronzeCutoff),
      mention: Number(adminMentionCutoff)
    });
    setCutoffSuccessMsg('Barème officiel des médailles enregistré ! Les médailles ont été recalculées en temps réel.');
    setTimeout(() => setCutoffSuccessMsg(null), 3500);
  };

  const handleTogglePublish = () => {
    if (!activeOly) return;
    store.toggleOlympiadResults(activeOly.id, !activeOly.resultsPublished);
  };

  const formatTimer = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationDisplay = (totalMins: number) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    if (h === 0) return `${m} min`;
    if (m === 0) return `${h}h (${totalMins} min)`;
    return `${h}h ${m}min (${totalMins} min)`;
  };

  const leaderboardData = activeOly ? store.getOlympiadLeaderboard(activeOly.id) : { locked: true, rankings: [] };
  const adminSubmissionsCount = activeOly ? store.getOlympiadSubmissionsForAdmin(activeOly.id).length : 0;

  return (
    <div className="space-y-5">
      {/* ================= ADMIN FAST ACCESS BANNER ================= */}
      {/* Requirement: Easy entry for admin to submit/upload PDF from phone and modify minutes */}
      {currentUser?.role === 'admin' && activeOly && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 p-4 sm:p-5 rounded-2xl shadow-md border border-amber-400/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-slate-950 text-amber-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                <ShieldCheck className="w-3 h-3" /> Mode Administrateur
              </span>
              <span className="text-xs font-black text-amber-950">
                • Entrée Simplifiée Sujet & Chronomètre
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-950 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-950" />
              Importer le Sujet PDF depuis votre Téléphone & Gérer la Durée
            </h2>
            <p className="text-xs text-amber-950/90 max-w-2xl font-medium">
              Téléversez directement le document PDF officiel de l'olympiade depuis votre appareil (sans lien externe) et ajustez les minutes de l'épreuve en un clic.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(true)}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs font-black rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>Importer PDF & Modifier Minutes</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdmin}
              className="px-3.5 py-2.5 bg-white/30 hover:bg-white/40 text-slate-950 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
            >
              <Award className="w-3.5 h-3.5" />
              <span>Notations & Palmarès</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= ADMIN POST-CORRECTION MEDAL CUTOFFS & REAL-TIME PUBLICATION ================= */}
      {currentUser?.role === 'admin' && activeOly && (
        <div className="bg-white border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                  ⚖️ Jury Officiel
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Barème Minimal des Médailles (Post-Correction) & Publication Instantanée
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Ajustez les seuils minimaux de points nécessaires pour décrocher les médailles. Toutes les copies notées sont recalculées en temps réel.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleTogglePublish}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  activeOly.resultsPublished
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                }`}
              >
                {activeOly.resultsPublished ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Palmarès Ouvert au Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Palmarès Verrouillé (En Délibération)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-3 py-1.5 text-xs font-bold bg-[#0056b3] text-white hover:bg-[#0a3d75] rounded-xl transition flex items-center gap-1 cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Corriger les Copies ({adminSubmissionsCount})</span>
              </button>
            </div>
          </div>

          {cutoffSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2 font-semibold animate-in fade-in">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cutoffSuccessMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3">
              <label className="block text-[10px] uppercase font-bold text-amber-900 mb-1">🥇 Seuil Or (pts min)</label>
              <input
                type="number"
                min="0"
                max={activeOly.totalPoints}
                value={adminGoldCutoff}
                onChange={(e) => setAdminGoldCutoff(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white p-2 text-xs font-bold border border-amber-300 rounded-lg text-amber-950 focus:ring-2 focus:ring-amber-500 outline-none"
              />
              <span className="text-[10px] text-amber-800/80 mt-1 block font-mono">Total : {activeOly.totalPoints} pts</span>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-xl p-3">
              <label className="block text-[10px] uppercase font-bold text-slate-800 mb-1">🥈 Seuil Argent (pts min)</label>
              <input
                type="number"
                min="0"
                max={activeOly.totalPoints}
                value={adminSilverCutoff}
                onChange={(e) => setAdminSilverCutoff(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white p-2 text-xs font-bold border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-[10px] text-slate-600 mt-1 block font-mono">Total : {activeOly.totalPoints} pts</span>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
              <label className="block text-[10px] uppercase font-bold text-orange-900 mb-1">🥉 Seuil Bronze (pts min)</label>
              <input
                type="number"
                min="0"
                max={activeOly.totalPoints}
                value={adminBronzeCutoff}
                onChange={(e) => setAdminBronzeCutoff(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white p-2 text-xs font-bold border border-orange-300 rounded-lg text-orange-950 focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <span className="text-[10px] text-orange-800/80 mt-1 block font-mono">Total : {activeOly.totalPoints} pts</span>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <label className="block text-[10px] uppercase font-bold text-blue-900 mb-1">🎖️ Mention Hon. (pts min)</label>
              <input
                type="number"
                min="0"
                max={activeOly.totalPoints}
                value={adminMentionCutoff}
                onChange={(e) => setAdminMentionCutoff(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full bg-white p-2 text-xs font-bold border border-blue-300 rounded-lg text-blue-950 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <span className="text-[10px] text-blue-800/80 mt-1 block font-mono">Total : {activeOly.totalPoints} pts</span>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={handleSaveCutoffsFromOlympiad}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Enregistrer les Notes Minimales & Recalculer les Médailles</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= EASY SHARING & RECIPIENT WORKFLOW BAR ================= */}
      {activeOly && (
        <div className="bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                <Share2 className="w-3 h-3" /> Partage de l'Olympiade
              </span>
              <span className="text-xs font-bold text-blue-950">
                Lien officiel pour compétiteurs & enseignants
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900">
              Partager cette épreuve en un clic aux candidats
            </h3>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Le participant télécharge le sujet PDF officiel, son chronomètre s'enclenche automatiquement, il soumet ses copies manuscrites ou LaTeX, puis consulte ses médailles et son classement dès publication par le jury.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button
              type="button"
              onClick={handleCopyShareLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-300'
              }`}
              title="Copier le lien direct vers cette Olympiade"
            >
              {copiedLink ? (
                <>
                  <CheckCheck className="w-3.5 h-3.5 text-white" />
                  <span>Lien Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-blue-600" />
                  <span>Copier le Lien Direct</span>
                </>
              )}
            </button>

            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Envoyer l'épreuve par WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Partager sur WhatsApp</span>
            </a>
          </div>
        </div>
      )}

      {/* Sessions Selector Tabs (if multiple sessions exist) */}
      {olympiads.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {olympiads.map((oly) => (
            <button
              key={oly.id}
              onClick={() => {
                setSelectedOlyId(oly.id);
                setSubmitError(null);
                setSubmitSuccess(null);
              }}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap cursor-pointer ${
                activeOly?.id === oly.id
                  ? 'bg-[#0056b3] text-white border-[#0056b3] shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {oly.title}
            </button>
          ))}
        </div>
      )}

      {activeOly && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          {/* Olympiad Hero Banner */}
          <div className="p-5 sm:p-7 bg-gradient-to-r from-slate-950 via-[#0a2540] to-[#0056b3] text-white">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <span className="text-xs font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded shadow-xs">
                Session Officielle MK
              </span>

              {currentUser?.role === 'admin' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdminModalOpen(true)}
                    className="text-xs bg-amber-400/90 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Modifier Sujet PDF & Minutes</span>
                  </button>
                  <button
                    type="button"
                    onClick={onOpenAdmin}
                    className="text-xs bg-white/20 hover:bg-white/30 text-white font-bold px-3 py-1 rounded-lg backdrop-blur-xs transition cursor-pointer"
                  >
                    ⚙️ Jury & Délibérations
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black mb-2">{activeOly.title}</h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-3xl mb-5">
              {activeOly.description}
            </p>

            {/* Crucial Info Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-white/15">
              {/* Duration Card with quick admin edit */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 relative group">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                    Durée officielle
                  </span>
                  {currentUser?.role === 'admin' && (
                    <button
                      type="button"
                      onClick={() => setIsAdminModalOpen(true)}
                      className="text-[10px] text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
                    >
                      Modifier
                    </button>
                  )}
                </div>
                <span className="text-sm sm:text-base font-black text-white">
                  {formatDurationDisplay(activeOly.totalDurationMinutes || 240)}
                </span>
                <span className="block text-[10px] text-slate-300/80 mt-0.5 font-mono">
                  {activeOly.totalDurationMinutes || 240} minutes de composition
                </span>
              </div>

              {/* Problem Count Card */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3">
                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Nombre de problèmes
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {activeOly.problemCount} Problèmes
                </span>
                <span className="block text-[10px] text-slate-300/80 mt-0.5">
                  Épreuve générale d'olympiade
                </span>
              </div>

              {/* Points Card */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3">
                <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                  Barème total
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {activeOly.totalPoints} points
                </span>
                <span className="block text-[10px] text-slate-300/80 mt-0.5">
                  {activeOly.pointsPerProblem} pts par exercice
                </span>
              </div>

              {/* Official PDF Subject Card */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="block text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                      Sujet officiel PDF
                    </span>
                    {currentUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => setIsAdminModalOpen(true)}
                        className="text-[10px] text-amber-300 hover:text-amber-200 underline font-bold cursor-pointer"
                      >
                        Changer PDF
                      </button>
                    )}
                  </div>
                  <span className="text-xs font-bold text-amber-300 truncate block">
                    {activeOly.pdfTitle || 'Sujet_Officiel_Olympiade.pdf'}
                  </span>
                  {activeOly.pdfFileSize && (
                    <span className="block text-[10px] text-slate-300/80">
                      Taille : {activeOly.pdfFileSize}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleDownloadAndStartExam}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-amber-300 hover:text-amber-200 underline mt-1.5 cursor-pointer text-left"
                  title="Télécharger le sujet (active automatiquement le chronomètre)"
                >
                  <FileDown className="w-3.5 h-3.5 shrink-0" />
                  <span>Télécharger Sujet PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* ================= MAIN CONTENT SECTION WITH WELL-ORGANIZED TABS ================= */}
          <div className="p-5 sm:p-7 space-y-6">
            {/* Notification Banner when started upon download */}
            {examStartedNotification && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Sujet officiel téléchargé !</span> Le chronomètre de{' '}
                    <strong>{activeOly.totalDurationMinutes} minutes</strong> a démarré automatiquement. Vous pouvez composer et déposer votre copie avant la fin du temps imparti.
                  </div>
                </div>
                <button
                  onClick={() => setExamStartedNotification(false)}
                  className="text-emerald-700 hover:text-emerald-950 font-bold px-2 py-1 rounded hover:bg-emerald-100 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Navigation Tabs between Exam & Results for superior organization */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                type="button"
                onClick={() => setActiveSection('exam')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeSection === 'exam'
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>1. Sujet, Chronomètre & Copies</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection('results')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer ${
                  activeSection === 'results'
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>2. Palmarès & Classement Officiel</span>
                {leaderboardData.rankings.length > 0 && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {leaderboardData.rankings.length}
                  </span>
                )}
              </button>
            </div>

            {/* ================= TAB 1: EXAM, COUNTDOWN & SUBMISSION ================= */}
            {activeSection === 'exam' && (
              <div className="space-y-6">
                {/* Countdown Timer Block */}
                <div className="p-4 sm:p-5 rounded-2xl border bg-slate-50 border-slate-200 flex flex-wrap items-center justify-between gap-4">
                  <div className="max-w-md">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#0056b3]" />
                      Chronomètre d'Épreuve Officielle
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {examStartTime
                        ? isExamTimeExpired
                          ? 'L’épreuve officielle est terminée. Le chronomètre est arrivé à terme.'
                          : 'Le chronomètre décompte le temps restant pour rédiger et téléverser vos copies.'
                        : `Durée officielle : ${activeOly.totalDurationMinutes} minutes. Le chronomètre démarre automatiquement dès le téléchargement du sujet officiel.`}
                    </p>
                  </div>

                  <div>
                    {examStartTime ? (
                      <div className="flex items-center gap-3 flex-wrap">
                        <div
                          className={`font-mono text-xl sm:text-2xl font-black px-4 py-2 rounded-xl border shadow-inner ${
                            isExamTimeExpired
                              ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse'
                              : secondsRemaining && secondsRemaining < 900
                              ? 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                              : 'bg-slate-950 text-white border-slate-900'
                          }`}
                        >
                          {secondsRemaining !== null ? formatTimer(secondsRemaining) : '--:--:--'}
                        </div>

                        {isExamTimeExpired ? (
                          <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" /> Temps Écoulé
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> En cours
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={handleDownloadAndStartExam}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0056b3] hover:text-[#0a3d75] underline cursor-pointer ml-1"
                          title="Re-télécharger le fichier du sujet"
                        >
                          <FileDown className="w-3.5 h-3.5" /> Re-télécharger PDF
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={handleDownloadAndStartExam}
                          className="inline-flex items-center gap-2 bg-[#0056b3] hover:bg-[#0a3d75] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs hover:shadow-md transition cursor-pointer"
                        >
                          <FileDown className="w-4 h-4" />
                          Télécharger le Sujet & Démarrer le Chronomètre
                        </button>
                        <span className="text-[11px] text-slate-500 italic hidden sm:inline">
                          (Démarrage automatique)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Candidate Submission Card */}
                <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#0a3d75] flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Dépôt de Copies et Évaluation Personnelle
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Transmettez vos copies manuscrites (photos) et/ou votre rédaction LaTeX.
                      </p>
                    </div>

                    {mySubmission && (
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-lg ${
                          mySubmission.status === 'graded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {mySubmission.status === 'graded' ? '✓ Copie Notée par le Jury' : '⏳ Copie Reçue (En correction)'}
                      </span>
                    )}
                  </div>

                  {/* Candidate Graded Results Card */}
                  {mySubmission && mySubmission.status === 'graded' && (
                    <div className="p-4 sm:p-5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200 pb-2.5">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-emerald-800">Note Officielle :</span>
                          <p className="text-lg font-black text-emerald-950">
                            {mySubmission.overallScore} / {activeOly.totalPoints} points
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-emerald-800">Distinction :</span>
                          <p className="text-base font-extrabold text-emerald-950">
                            {activeOly.resultsPublished || currentUser?.role === 'admin'
                              ? mySubmission.medal
                              : 'Note validée (Médailles officielles en attente de délibération)'}
                          </p>
                        </div>
                      </div>

                      {/* Problem Scores Breakdown */}
                      <div>
                        <span className="font-bold text-emerald-900 block mb-1.5">Détail des notes par problème :</span>
                        <div className="flex gap-2 flex-wrap">
                          {Array.from({ length: activeOly.problemCount }).map((_, i) => {
                            const key = `P${i + 1}`;
                            const score = mySubmission.problemScores?.[key] ?? 0;
                            return (
                              <div
                                key={key}
                                className="bg-white border border-emerald-200 rounded-lg px-3 py-1.5 text-center shadow-2xs"
                              >
                                <span className="block text-[10px] text-slate-500 font-bold">Problème {i + 1}</span>
                                <span className="font-black text-emerald-800">
                                  {score} / {activeOly.pointsPerProblem} pts
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {mySubmission.feedback && (
                        <div className="pt-2 border-t border-emerald-200">
                          <span className="font-bold text-emerald-900 block mb-0.5">Appréciation du jury :</span>
                          <p className="text-slate-700 italic">{mySubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Candidate Form */}
                  {isExamTimeExpired ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
                      <div>
                        <span className="font-bold block text-sm">Temps officiel écoulé !</span>
                        <p className="mt-0.5">
                          L'épreuve est terminée et le chronomètre est à zéro. Le formulaire de soumission est verrouillé
                          afin de garantir l'équité sportive et académique.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {submitError && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      {submitSuccess && (
                        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="font-bold">{submitSuccess}</span>
                        </div>
                      )}

                      {/* Polycopies Upload (Optional if text provided) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Upload className="w-3.5 h-3.5 text-blue-600" />
                            Photos / Scans des Copies Manuscrites
                          </label>
                          <span className="text-[11px] text-slate-400">
                            (Images seules OU texte LaTeX seul acceptés)
                          </span>
                        </div>

                        <div className="border-2 border-dashed border-slate-300 hover:border-blue-400 rounded-xl p-4 text-center bg-slate-50/50 hover:bg-slate-50 transition">
                          <input
                            type="file"
                            id="oly-images-upload"
                            multiple
                            accept="image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                          <label
                            htmlFor="oly-images-upload"
                            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-xl shadow-xs text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-400 transition"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Ajouter des photos de vos feuilles d'examen
                          </label>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Cliquez sur une photo pour l'ouvrir dans la visionneuse avec zoom haute résolution.
                          </p>
                        </div>

                        {images.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                            {images.map((img, idx) => (
                              <div
                                key={idx}
                                className="group relative border border-slate-200 rounded-xl overflow-hidden bg-slate-100 aspect-4/3 flex items-center justify-center"
                              >
                                <img
                                  src={img}
                                  alt={`Page ${idx + 1}`}
                                  className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition"
                                  onClick={() => handleOpenZoom(idx)}
                                />
                                <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                                  p.{idx + 1}
                                </span>
                                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenZoom(idx)}
                                    className="p-1.5 bg-white text-slate-900 rounded-full shadow hover:bg-slate-100 transition cursor-pointer"
                                    title="Agrandir et zoomer (PC & mobile)"
                                  >
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImage(idx)}
                                    className="p-1.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition cursor-pointer"
                                    title="Supprimer cette page"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* LaTeX or text solution notes (Optional if images provided) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
                            Rédaction LaTeX de vos solutions
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowLatexPreview(!showLatexPreview)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 transition cursor-pointer"
                          >
                            {showLatexPreview ? (
                              <>
                                <EyeOff className="w-3 h-3" /> Masquer la prévisualisation
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" /> Visualiser le LaTeX ($...$)
                              </>
                            )}
                          </button>
                        </div>

                        <textarea
                          rows={showLatexPreview ? 4 : 5}
                          value={solutionNotes}
                          onChange={(e) => setSolutionNotes(e.target.value)}
                          placeholder="Vous pouvez rédiger vos réponses ou démonstrations en LaTeX ici (ex: P1: soit $x, y \in \mathbb{N}$...)"
                          className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                        />

                        {showLatexPreview && (
                          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Aperçu LaTeX en direct :
                            </span>
                            {solutionNotes.trim() ? (
                              <MathView content={solutionNotes} className="text-xs bg-white p-2.5 rounded-lg border border-slate-200" />
                            ) : (
                              <p className="text-xs text-slate-400 italic">
                                Tapez du texte ou du LaTeX pour voir le rendu mathématique ici.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                        <span className="text-[11px] text-slate-500">
                          {images.length > 0 && solutionNotes.trim()
                            ? `${images.length} image(s) + rédaction LaTeX.`
                            : images.length > 0
                            ? `${images.length} page(s) de copies manuscrites.`
                            : solutionNotes.trim()
                            ? 'Rédaction LaTeX prête.'
                            : 'Téléversez des photos OU rédigez en LaTeX.'}
                        </span>

                        <button
                          type="submit"
                          className="px-5 py-2.5 text-xs font-bold text-white bg-[#0056b3] hover:bg-[#0a3d75] rounded-xl shadow-xs transition cursor-pointer"
                        >
                          {mySubmission ? 'Mettre à jour mes Copies' : 'Transmettre mes Copies au Jury'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* ================= TAB 2: LEADERBOARD & MEDAL CUTOFFS ================= */}
            {activeSection === 'results' && (
              <div className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-white space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Palmarès & Classement Officiel de l'Olympiade
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Résultats de la session avec médailles d'Or, Argent, Bronze et Mentions Honorables.
                  </p>
                </div>

                {leaderboardData.locked && currentUser?.role !== 'admin' ? (
                  <div className="p-6 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
                    <Lock className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-amber-900 mb-1">
                      Délibérations du Jury en Cours
                    </h4>
                    <p className="text-xs text-amber-700 max-w-md mx-auto leading-relaxed">
                      Les corrections et délibérations officielles sont en cours. Les barèmes minimaux de médailles et le
                      classement final seront rendus publics dès la clôture des notations par l'administrateur.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Medal Cutoffs Banner */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <span className="block text-[10px] uppercase font-bold text-amber-800">🥇 Or (Gold)</span>
                        <span className="font-black text-amber-950 text-sm">≥ {activeOly.goldCutoff} pts</span>
                      </div>
                      <div className="bg-slate-100 border border-slate-300 rounded-xl p-3">
                        <span className="block text-[10px] uppercase font-bold text-slate-700">🥈 Argent (Silver)</span>
                        <span className="font-black text-slate-900 text-sm">≥ {activeOly.silverCutoff} pts</span>
                      </div>
                      <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                        <span className="block text-[10px] uppercase font-bold text-orange-800">🥉 Bronze</span>
                        <span className="font-black text-orange-950 text-sm">≥ {activeOly.bronzeCutoff} pts</span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                        <span className="block text-[10px] uppercase font-bold text-blue-800">🎖️ Mention</span>
                        <span className="font-black text-blue-950 text-sm">≥ {activeOly.honorableMentionCutoff} pts</span>
                      </div>
                    </div>

                    {leaderboardData.rankings.length === 0 ? (
                      <p className="text-xs text-slate-400 italic text-center py-6">
                        Aucune copie notée pour le moment.
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3 w-16 text-center">Rang</th>
                              <th className="p-3">Candidat</th>
                              <th className="p-3">Distinction Officielle</th>
                              <th className="p-3">Notes par Exercice</th>
                              <th className="p-3 text-right">Note Totale</th>
                              <th className="p-3">Appréciation du Jury</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 bg-white">
                            {leaderboardData.rankings.map((cand, idx) => (
                              <tr key={cand.id} className="hover:bg-slate-50/80 transition">
                                <td className="p-3 font-bold font-mono text-center text-slate-700">
                                  {idx === 0 ? (
                                    <span className="inline-block bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-black">🥇 1</span>
                                  ) : idx === 1 ? (
                                    <span className="inline-block bg-slate-200 text-slate-900 px-2 py-0.5 rounded font-black">🥈 2</span>
                                  ) : idx === 2 ? (
                                    <span className="inline-block bg-orange-100 text-orange-950 px-2 py-0.5 rounded font-black">🥉 3</span>
                                  ) : (
                                    <span className="inline-block text-slate-600 font-bold">#{idx + 1}</span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="font-bold text-slate-900">{cand.username}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{cand.userEmail}</div>
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`inline-block font-extrabold px-2.5 py-1 rounded-lg text-xs ${
                                      cand.medal.includes('Or')
                                        ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                        : cand.medal.includes('Argent')
                                        ? 'bg-slate-200 text-slate-900 border border-slate-300'
                                        : cand.medal.includes('Bronze')
                                        ? 'bg-orange-100 text-orange-950 border border-orange-300'
                                        : cand.medal.includes('Mention')
                                        ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                        : 'bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {cand.medal}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {Array.from({ length: activeOly.problemCount }).map((_, pIdx) => {
                                      const key = `P${pIdx + 1}`;
                                      const score = cand.problemScores?.[key] ?? 0;
                                      return (
                                        <span
                                          key={key}
                                          className="text-[10px] font-mono px-2 py-0.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-700"
                                          title={`Problème ${pIdx + 1} : ${score}/${activeOly.pointsPerProblem}`}
                                        >
                                          {key}: <strong className="text-[#0056b3]">{score}</strong>/{activeOly.pointsPerProblem}
                                        </span>
                                      );
                                    })}
                                  </div>
                                </td>
                                <td className="p-3 text-right">
                                  <span className="font-black text-sm text-[#0056b3]">
                                    {cand.overallScore}
                                  </span>
                                  <span className="text-slate-400 text-xs"> / {activeOly.totalPoints} pts</span>
                                </td>
                                <td className="p-3 max-w-xs">
                                  <p className="text-xs text-slate-600 italic line-clamp-2" title={cand.feedback}>
                                    {cand.feedback || 'Aucune remarque saisie.'}
                                  </p>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox Zoom for Olympiad copies */}
      <ImageModal
        images={images}
        initialIndex={zoomImageIndex}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
        title={`Copie d'examen - ${activeOly?.title || 'Olympiade MK'}`}
      />

      {/* Fast Admin Olympiad Configuration Modal (PDF Upload from Phone & Duration in Minutes) */}
      <AdminOlympiadModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        olympiad={activeOly || null}
        onUpdated={reloadData}
      />
    </div>
  );
};
