import React from 'react';
import { Problem } from '../types';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  problem: Problem | null;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  problem
}) => {
  if (!isOpen || !problem) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-100" />
            <h3 className="font-bold text-sm sm:text-base">Confirmer la suppression</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-700 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer définitivement ce problème de la banque officielle ?
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                {problem.theme}
              </span>
              <span>•</span>
              <span>{problem.points} points</span>
              {problem.problemNumber && (
                <>
                  <span>•</span>
                  <span>N° {problem.problemNumber}</span>
                </>
              )}
            </div>
            <h4 className="font-bold text-xs text-slate-900">{problem.title}</h4>
          </div>

          <p className="text-[11px] text-rose-600 italic">
            Attention : Cette action est irréversible.
          </p>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            Annuler
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Supprimer définitivement
          </button>
        </div>
      </div>
    </div>
  );
};
