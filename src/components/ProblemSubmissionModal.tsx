import React, { useState, useEffect } from 'react';
import { X, Upload, Eye, EyeOff, Trash2, Maximize2, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { Problem, Submission, User } from '../types';
import { store } from '../services/store';
import { MathView } from './MathView';
import { ImageModal } from './ImageModal';

interface ProblemSubmissionModalProps {
  problem: Problem | null;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  onOpenAuth: () => void;
}

export const ProblemSubmissionModal: React.FC<ProblemSubmissionModalProps> = ({
  problem,
  currentUser,
  isOpen,
  onClose,
  onSubmitted,
  onOpenAuth
}) => {
  const [images, setImages] = useState<string[]>([]);
  const [solutionText, setSolutionText] = useState('');
  const [showLatexPreview, setShowLatexPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingSub, setExistingSub] = useState<Submission | null>(null);

  // Lightbox Zoom state
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);

  useEffect(() => {
    if (problem && currentUser) {
      const sub = store.getMySubmission(problem.id, currentUser.id);
      setExistingSub(sub);
      if (sub) {
        setImages(sub.images || (sub.imageUrl ? [sub.imageUrl] : []));
        setSolutionText(sub.solutionText || '');
      } else {
        setImages([]);
        setSolutionText('');
      }
    } else {
      setImages([]);
      setSolutionText('');
      setExistingSub(null);
    }
    setError(null);
    setSuccess(null);
    setShowLatexPreview(false);
  }, [problem, currentUser, isOpen]);

  if (!isOpen || !problem) return null;

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
    // Clear input so user can re-upload same file if needed
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
    setError(null);
    setSuccess(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    const res = store.submitProblemSolution(problem.id, currentUser, {
      images,
      solutionText
    });

    if (res.error) {
      setError(res.error);
    } else {
      setSuccess('Votre solution a été enregistrée avec succès !');
      setTimeout(() => {
        onSubmitted();
        onClose();
      }, 900);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#0056b3] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {problem.theme}
                </span>
                <span className="text-[11px] font-extrabold text-white bg-blue-600 px-2 py-0.5 rounded">
                  {problem.points} points
                </span>
                {existingSub && (
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      existingSub.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : existingSub.status === 'rejected'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {existingSub.status === 'approved'
                      ? '✓ Validé'
                      : existingSub.status === 'rejected'
                      ? '✗ Refusé'
                      : '⏳ En attente'}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-[#0a3d75] mt-1">
                <MathView content={problem.title} />
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200/50 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto flex-1 space-y-4">
            {/* Statement Reminder */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs leading-relaxed text-slate-800 space-y-2">
              <span className="block font-bold text-slate-900 text-[11px] uppercase tracking-wide">
                Énoncé officiel :
              </span>
              {problem.statement && <MathView content={problem.statement} />}
              {problem.images && problem.images.length > 0 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-700 block mb-1">
                    Figures & Schémas du problème ({problem.images.length}) :
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {problem.images.map((img, idx) => (
                      <div key={idx} className="border border-blue-200 rounded-lg overflow-hidden bg-white">
                        <img
                          src={img}
                          alt={`Figure ${idx + 1}`}
                          className="max-h-40 w-full object-contain p-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {existingSub?.reviewReason && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="font-bold text-slate-700 block mb-0.5">Commentaire du jury :</span>
                <p className="text-slate-600">{existingSub.reviewReason}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Polycopies Upload Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    Polycopies manuscrites / Photos de vos copies
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Optionnel si vous rédigez en LaTeX ci-dessous
                  </span>
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50/50 hover:bg-slate-50 transition">
                  <input
                    type="file"
                    id="polycope-upload"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="polycope-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded-md shadow-xs text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-400 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Ajouter des photos / scans de vos pages
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Formats acceptés : PNG, JPG, JPEG. Cliquez sur une image pour l'agrandir avec le zoom.
                  </p>
                </div>

                {/* Uploaded images gallery */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative border border-slate-200 rounded-md overflow-hidden bg-slate-100 aspect-4/3 flex items-center justify-center"
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
                            className="p-1.5 bg-white text-slate-900 rounded-full shadow hover:bg-slate-100 transition"
                            title="Agrandir et zoomer (PC & mobile)"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1.5 bg-rose-600 text-white rounded-full shadow hover:bg-rose-700 transition"
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

              {/* Solution Text / LaTeX */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Rédaction LaTeX ou explications textuelles
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowLatexPreview(!showLatexPreview)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 transition"
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
                  rows={showLatexPreview ? 4 : 6}
                  value={solutionText}
                  onChange={(e) => setSolutionText(e.target.value)}
                  placeholder="Rédigez votre démonstration ici. Vous pouvez utiliser du LaTeX inline $a^2+b^2=c^2$ ou des blocs $$ \sum_{i=1}^n i $$..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none leading-relaxed"
                />

                {/* Live LaTeX Visualisation Pane */}
                {showLatexPreview && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Aperçu LaTeX en direct :
                    </span>
                    {solutionText.trim() ? (
                      <MathView content={solutionText} className="text-xs bg-white p-2.5 rounded border border-slate-200" />
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Tapez du texte ou des formules LaTeX pour les visualiser ici instantanément.
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[11px] text-slate-500">
                  {images.length > 0 && solutionText.trim()
                    ? 'Photos et texte LaTeX joints.'
                    : images.length > 0
                    ? `${images.length} page(s) manuscrite(s) jointe(s).`
                    : solutionText.trim()
                    ? 'Rédaction LaTeX prête.'
                    : 'Joignez des images ou du texte.'}
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold text-white bg-[#0056b3] hover:bg-[#0a3d75] rounded-md shadow-xs transition cursor-pointer"
                  >
                    {existingSub ? 'Mettre à jour la Copie' : 'Envoyer ma Solution'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Lightbox Zoom for polycopies */}
      <ImageModal
        images={images}
        initialIndex={zoomImageIndex}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
        title={`Polycopie - ${problem.title}`}
      />
    </>
  );
};
