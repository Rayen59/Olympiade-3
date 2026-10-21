import React, { useState } from 'react';
import { User, Submission, OlympiadSubmission } from '../types';
import { store } from '../services/store';
import { ImageModal } from './ImageModal';
import { MathView } from './MathView';
import {
  User as UserIcon,
  Award,
  BookOpen,
  Calendar,
  Trash2,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Maximize2,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface UserProfileViewProps {
  currentUser: User;
  onLogout: () => void;
  onGoBack: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ currentUser, onLogout, onGoBack }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Zoom Lightbox
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomTitle, setZoomTitle] = useState('Polycopie');

  const submissions = store.getUserSubmissions(currentUser.id);
  const olympiadSubs = store.getUserOlympiadSubmissions(currentUser.id);

  const handleDeleteAccount = () => {
    const res = store.deleteAccount(currentUser.id);
    if (res.error) {
      setDeleteError(res.error);
    } else {
      onLogout();
      onGoBack();
    }
  };

  const handleOpenZoom = (images: string[], title: string) => {
    setZoomImages(images);
    setZoomTitle(title);
    setZoomModalOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Profile Card Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3.5">
            <div
              style={{ backgroundColor: currentUser.avatarColor || '#0056b3' }}
              className="w-14 h-14 rounded-full text-white font-extrabold text-xl flex items-center justify-center shadow-sm"
            >
              {currentUser.username.substring(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900">{currentUser.username}</h1>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    currentUser.role === 'admin'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'Administrateur' : 'Candidat Officiel'}
                </span>
              </div>
              <p className="text-xs text-slate-500">{currentUser.email}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Points</span>
            <span className="text-2xl font-black text-[#0056b3]">{currentUser.points} pts</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Problèmes Validés</span>
            <span className="text-sm font-extrabold text-slate-800">
              {currentUser.solvedCount || currentUser.solvedProblems.length}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Copies Déposées</span>
            <span className="text-sm font-extrabold text-slate-800">{submissions.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Sessions Olympiades</span>
            <span className="text-sm font-extrabold text-slate-800">{olympiadSubs.length}</span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Statut du Compte</span>
            <span className="text-xs font-extrabold text-emerald-700">
              {currentUser.banned ? 'Suspendu' : 'Actif & En Règle'}
            </span>
          </div>
        </div>

        {/* Bio */}
        {currentUser.bio && (
          <p className="text-xs text-slate-600 mt-3.5 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            « {currentUser.bio} »
          </p>
        )}
      </div>

      {/* Official Olympiad Results Report */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#0a3d75] flex items-center gap-2">
          <Award className="w-4 h-4 text-blue-600" />
          Rapports d'Épreuves Olympiques
        </h2>

        {olympiadSubs.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            Vous n'avez pas encore soumis de copie pour une olympiade officielle.
          </p>
        ) : (
          <div className="space-y-3">
            {olympiadSubs.map((os) => {
              const oly = store.getOlympiadById(os.olympiadId);
              return (
                <div key={os.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <span className="font-bold text-slate-900 text-sm">{oly?.title || 'Olympiade MK'}</span>
                    <span
                      className={`font-bold px-2.5 py-0.5 rounded text-[11px] ${
                        os.status === 'graded' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {os.status === 'graded' ? '✓ Corrigée' : '⏳ En cours de correction'}
                    </span>
                  </div>

                  {os.status === 'graded' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">Note Attribuée :</span>
                        <span className="font-black text-sm text-blue-700">
                          {os.overallScore} / {oly?.totalPoints || 28} points
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">Distinction :</span>
                        <span className="font-bold text-emerald-800">
                          {oly?.resultsPublished || currentUser.role === 'admin'
                            ? os.medal
                            : 'Note enregistrée (Délibérations officielles en cours)'}
                        </span>
                      </div>

                      {os.feedback && (
                        <div className="pt-2 border-t border-slate-200 text-slate-600 italic">
                          « {os.feedback} »
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-slate-500 italic">
                      Vos copies manuscrites sont entre les mains des correcteurs. La note apparaîtra ici dès délibération.
                    </p>
                  )}

                  {os.images && os.images.length > 0 && (
                    <div className="pt-2 border-t border-slate-200 flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold">Copies jointes :</span>
                      <button
                        type="button"
                        onClick={() => handleOpenZoom(os.images, `Copies - ${oly?.title}`)}
                        className="text-xs text-blue-600 hover:text-blue-800 underline font-semibold flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3" /> Voir {os.images.length} page(s)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Problem Submissions History */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#0a3d75] flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Historique des Soumissions de Problèmes
        </h2>

        {submissions.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            Aucun problème soumis pour le moment.
          </p>
        ) : (
          <div className="space-y-2.5">
            {submissions.map((sub) => (
              <div
                key={sub.id}
                className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{sub.problemTitle}</span>
                    <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                      {sub.category}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">{sub.points} pts</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {sub.images && sub.images.length > 0 && (
                      <button
                        type="button"
                        onClick={() => handleOpenZoom(sub.images, `Copie - ${sub.problemTitle}`)}
                        className="text-blue-600 hover:text-blue-800 text-[11px] underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Maximize2 className="w-3 h-3" /> {sub.images.length} photo(s) soumise(s)
                      </button>
                    )}

                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        sub.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : sub.status === 'rejected'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {sub.status === 'approved'
                        ? '✓ Validé'
                        : sub.status === 'rejected'
                        ? '✗ Refusé (Correction possible)'
                        : '⏳ En attente'}
                    </span>
                  </div>
                </div>

                {/* Admin Explanation / Review feedback with LaTeX */}
                {sub.reviewReason && (
                  <div className="p-2.5 bg-white border border-slate-200 rounded-md space-y-1">
                    <span className="font-bold text-slate-500 text-[10px] uppercase block flex items-center gap-1">
                      {sub.status === 'rejected' ? (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-600" />
                          <span className="text-rose-700 font-bold">Raison du refus de l'administrateur :</span>
                        </>
                      ) : (
                        <span>Note du jury :</span>
                      )}
                    </span>
                    <div className="text-slate-800 leading-relaxed text-[11px]">
                      <MathView content={sub.reviewReason} />
                    </div>
                  </div>
                )}

                {/* Admin correction photos / diagrams if attached */}
                {sub.reviewImages && sub.reviewImages.length > 0 && (
                  <div className="pt-1">
                    <span className="font-bold text-rose-800 text-[10px] block mb-1 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-rose-600" />
                      Schémas / Photos de correction transmis par l'administrateur ({sub.reviewImages.length}) :
                    </span>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {sub.reviewImages.map((img, rIdx) => (
                        <div
                          key={rIdx}
                          onClick={() => handleOpenZoom(sub.reviewImages || [], `Correction administrateur - ${sub.problemTitle}`)}
                          className="relative border border-rose-300 rounded-md overflow-hidden cursor-pointer hover:border-rose-500 shrink-0 shadow-2xs group bg-white"
                        >
                          <img src={img} alt="Correction" className="h-14 w-20 object-cover" />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <span className="bg-slate-900/80 text-white text-[9px] px-1 py-0.5 rounded font-semibold flex items-center gap-0.5">
                              <Maximize2 className="w-2.5 h-2.5" />
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Account Settings / Delete */}
      <div className="bg-white border border-rose-100 rounded-xl p-5 shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wide">Zone de Danger</h3>
        <p className="text-xs text-slate-500">
          Supprimer définitivement votre compte et effacer vos soumissions.
        </p>

        {deleteError && (
          <p className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded">{deleteError}</p>
        )}

        {deleteConfirm ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg space-y-2">
            <p className="text-xs text-rose-800 font-bold">
              Êtes-vous absolument sûr ? Cette opération est irréversible.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded transition"
              >
                Confirmer la suppression
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300 transition"
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            disabled={currentUser.email === 'admin12@gmail.com'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer mon compte définitivement
          </button>
        )}
      </div>

      {/* Lightbox Zoom */}
      <ImageModal
        images={zoomImages}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
        title={zoomTitle}
      />
    </div>
  );
};
