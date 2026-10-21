import React, { useState, useEffect } from 'react';
import { Olympiad } from '../types';
import { store } from '../services/store';
import {
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  FileDown,
  Sparkles,
  Smartphone,
  Save,
  RotateCcw
} from 'lucide-react';

interface AdminOlympiadModalProps {
  isOpen: boolean;
  onClose: () => void;
  olympiad: Olympiad | null;
  onUpdated: () => void;
}

export const AdminOlympiadModal: React.FC<AdminOlympiadModalProps> = ({
  isOpen,
  onClose,
  olympiad,
  onUpdated
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [totalMinutes, setTotalMinutes] = useState(240);
  const [problemCount, setProblemCount] = useState(4);
  const [pointsPerProblem, setPointsPerProblem] = useState(7);

  // PDF Upload State
  const [pdfDataUrl, setPdfDataUrl] = useState<string>('');
  const [pdfFileName, setPdfFileName] = useState<string>('');
  const [pdfFileSize, setPdfFileSize] = useState<string>('');
  const [isPdfModified, setIsPdfModified] = useState(false);

  // Options
  const [resetTimers, setResetTimers] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (olympiad) {
      setTitle(olympiad.title);
      setDescription(olympiad.description || '');
      setTotalMinutes(olympiad.totalDurationMinutes || olympiad.durationHours * 60 + (olympiad.durationMinutes || 0) || 240);
      setProblemCount(olympiad.problemCount || 4);
      setPointsPerProblem(olympiad.pointsPerProblem || 7);
      setPdfDataUrl(olympiad.pdfUrl || '');
      setPdfFileName(olympiad.pdfTitle || 'Sujet_Officiel_Olympiade_MK.pdf');
      setPdfFileSize(olympiad.pdfFileSize || '');
      setIsPdfModified(false);
      setResetTimers(false);
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [olympiad, isOpen]);

  if (!isOpen || !olympiad) return null;

  // Format bytes to human readable string
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Ko';
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Veuillez sélectionner un document au format PDF valide.');
      return;
    }

    // Limit check (e.g. 20MB for localStorage base64)
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Le fichier PDF dépasse 15 Mo. Veuillez choisir un fichier compressé ou plus léger.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const result = loadEvent.target?.result as string;
      if (result) {
        setPdfDataUrl(result);
        setPdfFileName(file.name);
        setPdfFileSize(formatFileSize(file.size));
        setIsPdfModified(true);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Erreur lors de la lecture du fichier PDF depuis votre appareil.');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleTestDownload = () => {
    if (!pdfDataUrl) return;
    const link = document.createElement('a');
    link.href = pdfDataUrl;
    link.download = pdfFileName || 'sujet.pdf';
    link.target = '_blank';
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePresetMinutes = (mins: number) => {
    setTotalMinutes(mins);
  };

  const formatHoursAndMinutes = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h === 0) return `${m} minute${m > 1 ? 's' : ''}`;
    if (m === 0) return `${h} heure${h > 1 ? 's' : ''}`;
    return `${h}h ${m.toString().padStart(2, '0')}min`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!title.trim()) {
      setErrorMsg('Le titre de la session est obligatoire.');
      return;
    }

    if (totalMinutes < 1) {
      setErrorMsg('La durée doit être d’au moins 1 minute.');
      return;
    }

    if (!pdfDataUrl) {
      setErrorMsg('Veuillez importer un fichier PDF pour le sujet officiel.');
      return;
    }

    const totalPts = problemCount * pointsPerProblem;

    store.updateOlympiad(olympiad.id, {
      title: title.trim(),
      description: description.trim(),
      totalDurationMinutes: totalMinutes,
      durationHours: Math.floor(totalMinutes / 60),
      durationMinutes: totalMinutes % 60,
      problemCount: Number(problemCount),
      pointsPerProblem: Number(pointsPerProblem),
      totalPoints: totalPts,
      pdfUrl: pdfDataUrl,
      pdfTitle: pdfFileName,
      pdfFileSize: pdfFileSize || undefined,
      pdfUpdatedAt: new Date().toISOString()
    });

    if (resetTimers) {
      store.resetExamTimer(olympiad.id);
    }

    setSuccessMsg('Olympiade mise à jour avec succès !');
    setTimeout(() => {
      onUpdated();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-[#0056b3] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                Gestion Rapide : Sujet PDF & Durée en Minutes
              </h2>
              <p className="text-xs text-slate-200">
                Importation directe depuis téléphone/PC & modification du chronomètre
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* ================= 1. DIRECT PDF IMPORT ================= */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0056b3]" />
                1. Sujet Officiel PDF (Import depuis Téléphone ou PC)
              </label>
              {isPdfModified && (
                <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Nouveau fichier sélectionné
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500">
              Sélectionnez directement votre document PDF stocké sur votre téléphone ou ordinateur portable. Pas besoin d'héberger sur un lien externe.
            </p>

            {/* Upload Zone */}
            <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-xl p-4 bg-white text-center transition">
              <input
                type="file"
                id="admin-pdf-input"
                accept="application/pdf,.pdf"
                onChange={handlePdfFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0056b3] flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <label
                    htmlFor="admin-pdf-input"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#0056b3] hover:bg-[#0a3d75] text-white font-bold rounded-lg shadow-xs cursor-pointer text-xs transition"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    Choisir le PDF depuis mon Téléphone / Appareil
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Formats acceptés : PDF (.pdf) • Taille max : 15 Mo
                  </p>
                </div>
              </div>
            </div>

            {/* Current Selected PDF Card */}
            {pdfDataUrl && (
              <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-black shrink-0 border border-rose-100">
                    PDF
                  </div>
                  <div className="truncate">
                    <span className="font-bold text-slate-900 block truncate text-xs">
                      {pdfFileName || 'Sujet_Officiel_Olympiade.pdf'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {pdfFileSize ? `Taille : ${pdfFileSize} • ` : ''}
                      {pdfDataUrl.startsWith('data:') ? 'Fichier embarqué' : 'Fichier système'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleTestDownload}
                    className="px-2.5 py-1.5 text-xs font-bold text-[#0056b3] hover:text-[#0a3d75] bg-blue-50 hover:bg-blue-100 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Télécharger et tester le PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Tester / Ouvrir
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ================= 2. MINUTES & DURATION SETTINGS ================= */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                2. Durée de l'Épreuve en Minutes
              </label>

              <span className="font-mono font-black text-sm text-[#0056b3] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                {totalMinutes} min ({formatHoursAndMinutes(totalMinutes)})
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Ajustez facilement les minutes allouées pour cette olympiade. Le chronomètre des participants se basera exactement sur cette durée.
            </p>

            {/* Quick Presets Buttons */}
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Raccourcis rapides :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '30 min', val: 30 },
                  { label: '60 min (1h)', val: 60 },
                  { label: '90 min (1h30)', val: 90 },
                  { label: '120 min (2h)', val: 120 },
                  { label: '180 min (3h)', val: 180 },
                  { label: '240 min (4h)', val: 240 },
                  { label: '300 min (5h)', val: 300 }
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => handlePresetMinutes(item.val)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      totalMinutes === item.val
                        ? 'bg-[#0056b3] text-white border-[#0056b3] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Minutes Input & Slider */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre de minutes personnalisé :
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={totalMinutes}
                    onChange={(e) => setTotalMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono focus:ring-2 focus:ring-[#0056b3] outline-hidden"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">
                    minutes
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Curseur de réglage rapide :
                </label>
                <input
                  type="range"
                  min={10}
                  max={480}
                  step={5}
                  value={totalMinutes}
                  onChange={(e) => setTotalMinutes(parseInt(e.target.value) || 60)}
                  className="w-full mt-2 accent-[#0056b3] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>10 min</span>
                  <span>120 min (2h)</span>
                  <span>240 min (4h)</span>
                  <span>480 min (8h)</span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= 3. SESSION DETAILS ================= */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              3. Détails & Problèmes de la Session
            </label>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Titre officiel de l'olympiade :
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Olympiade Mathématique MK - Session 2026"
                className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[#0056b3] outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Description / Consignes officielles :
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Épreuve officielle d'olympiades. Sujet comportant 4 problèmes notés sur 7 points chacun..."
                className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#0056b3] outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Nombre de problèmes :
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={problemCount}
                  onChange={(e) => setProblemCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Points par problème :
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={pointsPerProblem}
                  onChange={(e) => setPointsPerProblem(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Total points épreuve :
                </label>
                <div className="p-2 bg-blue-50 border border-blue-200 text-[#0056b3] font-black rounded-lg text-xs">
                  {problemCount * pointsPerProblem} points
                </div>
              </div>
            </div>
          </div>

          {/* Reset Countdown Timers Option */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="reset-timers-check"
              checked={resetTimers}
              onChange={(e) => setResetTimers(e.target.checked)}
              className="mt-0.5 accent-[#0056b3] cursor-pointer"
            />
            <label htmlFor="reset-timers-check" className="text-xs text-amber-950 font-semibold cursor-pointer">
              <span className="font-bold flex items-center gap-1 text-amber-900">
                <RotateCcw className="w-3.5 h-3.5" />
                Réinitialiser les chronomètres des participants pour cette session
              </span>
              <span className="block text-[10px] text-amber-800 font-normal mt-0.5">
                Cochez cette case si vous venez de changer la durée en minutes ou le sujet et voulez permettre aux candidats de recommencer le décompte avec le nouveau temps.
              </span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500">
              {isPdfModified ? 'Nouveau PDF prêt à être déployé.' : 'Sujet actuel conservé.'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-bold text-white bg-[#0056b3] hover:bg-[#0a3d75] rounded-xl shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Enregistrer & Appliquer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
