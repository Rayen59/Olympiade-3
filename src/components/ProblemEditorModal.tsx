import React, { useState, useEffect, useRef } from 'react';
import { Problem, OlympiadTheme } from '../types';
import { OLYMPIAD_THEMES } from '../data/problemsData';
import { store } from '../services/store';
import { MathView } from './MathView';
import {
  X,
  PlusCircle,
  Edit3,
  Eye,
  Code2,
  Columns,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Upload,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

interface ProblemEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  problemToEdit: Problem | null;
  defaultTheme?: OlympiadTheme;
  onSaved: (problem: Problem) => void;
}

function extractProblemNumber(id: string): string {
  const parts = id.split('-');
  if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
    return parts[1];
  }
  return '';
}

export const ProblemEditorModal: React.FC<ProblemEditorModalProps> = ({
  isOpen,
  onClose,
  problemToEdit,
  defaultTheme,
  onSaved
}) => {
  const [theme, setTheme] = useState<OlympiadTheme>(defaultTheme || 'Théorie des Nombres');
  const [problemNumber, setProblemNumber] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [points, setPoints] = useState<number>(15);
  const [statement, setStatement] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');
  const [error, setError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (problemToEdit) {
        setTheme(problemToEdit.theme);
        setProblemNumber(problemToEdit.problemNumber || extractProblemNumber(problemToEdit.id));
        setTitle(problemToEdit.title);
        setPoints(problemToEdit.points);
        setStatement(problemToEdit.statement || '');
        setImages(problemToEdit.images || []);
      } else {
        setTheme(defaultTheme || 'Théorie des Nombres');
        setProblemNumber('');
        setTitle('');
        setPoints(15);
        setStatement('');
        setImages([]);
      }
      setError(null);
    }
  }, [problemToEdit, defaultTheme, isOpen]);

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

  const insertLatexSnippet = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setStatement((prev) => prev + before + after);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.substring(start, end);

    const replacement = before + (selected || '') + after;
    const nextVal = current.substring(0, start) + replacement + current.substring(end);
    setStatement(nextVal);

    setTimeout(() => {
      textarea.focus();
      const cursorTarget = start + before.length + (selected ? selected.length : 0);
      textarea.setSelectionRange(cursorTarget, cursorTarget);
    }, 10);
  };

  const handleQuickInsert = (type: string) => {
    switch (type) {
      case 'inline':
        insertLatexSnippet('$', '$');
        break;
      case 'display':
        insertLatexSnippet('\n$$\n', '\n$$\n');
        break;
      case 'frac':
        insertLatexSnippet('\\frac{', '}{b}');
        break;
      case 'sqrt':
        insertLatexSnippet('\\sqrt{', '}');
        break;
      case 'sum':
        insertLatexSnippet('\\sum_{k=1}^{n} ');
        break;
      case 'prod':
        insertLatexSnippet('\\prod_{i=1}^{n} ');
        break;
      case 'forall':
        insertLatexSnippet('\\forall ');
        break;
      case 'exists':
        insertLatexSnippet('\\exists ');
        break;
      case 'inN':
        insertLatexSnippet('\\in \\mathbb{N}');
        break;
      case 'inR':
        insertLatexSnippet('\\in \\mathbb{R}');
        break;
      case 'inZ':
        insertLatexSnippet('\\in \\mathbb{Z}');
        break;
      case 'mod':
        insertLatexSnippet(' \\pmod{');
        break;
      case 'le':
        insertLatexSnippet(' \\le ');
        break;
      case 'ge':
        insertLatexSnippet(' \\ge ');
        break;
      case 'neq':
        insertLatexSnippet(' \\ne ');
        break;
      case 'alpha':
        insertLatexSnippet('\\alpha');
        break;
      case 'binom':
        insertLatexSnippet('\\binom{n}{k}');
        break;
      default:
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    const trimmedStatement = statement.trim();

    if (!trimmedTitle) {
      setError('Veuillez saisir un titre pour le problème.');
      return;
    }

    if (!trimmedStatement && images.length === 0) {
      setError('Veuillez rédiger un énoncé en texte LaTeX OU ajouter au moins une image (figure géométrique, capture, schéma).');
      return;
    }

    if (points <= 0 || isNaN(points)) {
      setError('Le nombre de points doit être un nombre strictement positif.');
      return;
    }

    if (problemToEdit) {
      const updated = store.updateProblem(problemToEdit.id, {
        theme,
        problemNumber: problemNumber.trim() || undefined,
        title: trimmedTitle,
        points: Number(points),
        statement: trimmedStatement,
        images,
        difficulty: `${points} pts`
      });

      if (updated) {
        onSaved(updated);
        onClose();
      } else {
        setError('Erreur lors de la modification du problème.');
      }
    } else {
      const created = store.createProblem({
        theme,
        problemNumber: problemNumber.trim() || undefined,
        title: trimmedTitle,
        points: Number(points),
        statement: trimmedStatement,
        images,
        difficulty: `${points} pts`
      });

      onSaved(created);
      onClose();
    }
  };

  const PRESET_POINTS = [15, 30, 45, 60, 75];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-linear-to-r from-[#0a3d75] to-[#0056b3] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {problemToEdit ? (
              <Edit3 className="w-5 h-5 text-amber-300" />
            ) : (
              <PlusCircle className="w-5 h-5 text-emerald-300" />
            )}
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {problemToEdit
                  ? `Modifier le Problème : ${problemToEdit.title}`
                  : 'Nouveau Problème Olympique'}
              </h2>
              <p className="text-xs text-blue-100">
                Administration • 5 Thèmes majeurs • Rendu KaTeX en direct
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Thème des 5 thèmes & Numéro du problème */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Theme Selection */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Thématique d'Olympiade (5 Thèmes Officiels) <span className="text-rose-500">*</span>
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as OlympiadTheme)}
                className="w-full text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-hidden"
              >
                {OLYMPIAD_THEMES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Problem Number */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Numéro du Problème
              </label>
              <input
                type="text"
                value={problemNumber}
                onChange={(e) => setProblemNumber(e.target.value)}
                placeholder="ex: 12, P-05, etc."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-hidden"
              />
              <span className="text-[10px] text-slate-400 block mt-0.5">
                Identifiant affiché (optionnel)
              </span>
            </div>
          </div>

          {/* Row 2: Titre du problème */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Titre du Problème <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="ex: Divisibilité et Valuation p-adique de 2^{2^n} + 1"
              className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-hidden font-medium"
              required
            />
          </div>

          {/* Row 3: Nombre de points */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de Points <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                min="1"
                max="1000"
                value={points}
                onChange={(e) => setPoints(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-24 text-xs font-bold px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-hidden"
                required
              />
              <span className="text-xs text-slate-500">points</span>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 ml-2">
                <span className="text-[11px] text-slate-400 font-medium">Préréglages :</span>
                {PRESET_POINTS.map((pt) => (
                  <button
                    type="button"
                    key={pt}
                    onClick={() => setPoints(pt)}
                    className={`text-[11px] px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      points === pt
                        ? 'bg-[#0056b3] text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {pt} pts
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Latex Statement & Live Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="block text-xs font-bold text-slate-700">
                Énoncé Mathématique (LaTeX) <span className="text-rose-500">*</span>
              </label>

              {/* View Mode Switches */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('split')}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === 'split' ? 'bg-white shadow-2xs text-[#0056b3]' : 'text-slate-600'
                  }`}
                  title="Côte à côte"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Partagé</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('edit')}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === 'edit' ? 'bg-white shadow-2xs text-[#0056b3]' : 'text-slate-600'
                  }`}
                  title="Code seul"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Code</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('preview')}
                  className={`px-2 py-1 rounded-md font-semibold flex items-center gap-1 transition ${
                    viewMode === 'preview' ? 'bg-white shadow-2xs text-[#0056b3]' : 'text-slate-600'
                  }`}
                  title="Prévisualisation seule"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Aperçu</span>
                </button>
              </div>
            </div>

            {/* LaTeX Insertion Toolbar */}
            <div className="flex items-center gap-1 flex-wrap p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
              <span className="text-slate-400 font-semibold px-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> Symboles :
              </span>
              <button
                type="button"
                onClick={() => handleQuickInsert('inline')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono font-bold cursor-pointer"
                title="Formule en ligne"
              >
                $...$
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('display')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono font-bold cursor-pointer"
                title="Formule centrée"
              >
                $$...$$
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('frac')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Fraction"
              >
                \frac&#123;a&#125;&#123;b&#125;
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('sqrt')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Racine"
              >
                \sqrt&#123;x&#125;
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('sum')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Somme"
              >
                \sum
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('prod')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Produit"
              >
                \prod
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('forall')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Quel que soit (∀)"
              >
                \forall
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('exists')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Il existe (∃)"
              >
                \exists
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('inN')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Entiers naturels (ℕ)"
              >
                \mathbb&#123;N&#125;
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('inR')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Réels (ℝ)"
              >
                \mathbb&#123;R&#125;
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('le')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Inférieur ou égal (≤)"
              >
                \le
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('ge')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Supérieur ou égal (≥)"
              >
                \ge
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('mod')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Modulo"
              >
                \pmod
              </button>
              <button
                type="button"
                onClick={() => handleQuickInsert('binom')}
                className="px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded font-mono cursor-pointer"
                title="Coefficient binomial"
              >
                \binom&#123;n&#125;&#123;k&#125;
              </button>
            </div>

            {/* Split / Single Viewport Area */}
            <div
              className={`grid gap-3 ${
                viewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
              }`}
            >
              {/* Textarea Editor */}
              {(viewMode === 'split' || viewMode === 'edit') && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span>Code Source LaTeX :</span>
                    <span className="font-mono text-[10px]">
                      {statement.length} caractères
                    </span>
                  </div>
                  <textarea
                    ref={textareaRef}
                    rows={8}
                    value={statement}
                    onChange={(e) => setStatement(e.target.value)}
                    placeholder="Rédigez l'énoncé du problème ici... Utilisez $...$ pour les formules inline (ex: $a^2 + b^2 = c^2$) ou $$...$$ pour les équations centrées. (Optionnel si vous téléversez une image de l'énoncé)."
                    className="w-full text-xs font-mono p-3 bg-slate-900 text-slate-100 rounded-xl border border-slate-700 focus:ring-2 focus:ring-[#0056b3] focus:border-transparent outline-hidden resize-y leading-relaxed"
                  />
                </div>
              )}

              {/* Live KaTeX Preview Box */}
              {(viewMode === 'split' || viewMode === 'preview') && (
                <div className="flex flex-col">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                    <span className="flex items-center gap-1 text-emerald-700">
                      <Eye className="w-3.5 h-3.5" /> Prévisualisation KaTeX & Figures en Direct :
                    </span>
                    <span className="text-[10px] text-slate-400">Rendu temps réel</span>
                  </div>
                  <div className="w-full min-h-[190px] max-h-[340px] overflow-y-auto p-4 bg-slate-50 border-2 border-dashed border-blue-200 rounded-xl space-y-3">
                    {/* Render Problem Title with LaTeX */}
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Titre rendu en LaTeX :</span>
                      <div className="font-bold text-xs text-slate-900">
                        <MathView content={title.trim() || 'Titre du problème...'} />
                      </div>
                    </div>

                    {statement.trim() ? (
                      <div className="border-l-3 border-[#0056b3] pl-3 py-1 bg-white rounded-r shadow-2xs">
                        <MathView content={statement} className="text-xs leading-relaxed" />
                      </div>
                    ) : images.length === 0 ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center text-slate-400">
                        <HelpCircle className="w-7 h-7 text-slate-300 mb-1" />
                        <p className="text-xs font-medium">L'aperçu de l'énoncé apparaîtra ici</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Tapez du texte LaTeX ou téléversez une image/schéma ci-dessous.
                        </p>
                      </div>
                    ) : null}

                    {/* Images in preview */}
                    {images.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                          Figures / Schémas attachés ({images.length}) :
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {images.map((img, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-2xs">
                              <img src={img} alt={`Preview ${idx + 1}`} className="w-full h-24 object-contain bg-slate-100" />
                              <div className="p-1 text-[10px] text-center font-bold text-slate-600 bg-slate-50 border-t border-slate-200">
                                Figure {idx + 1}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Row 5: Images / Schémas géométriques / Figures (User request: option to share only images, only text, or both) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#0056b3]" />
                Images, Schémas ou Figures Géométriques du Problème
              </label>
              <span className="text-[11px] text-slate-500">
                (Images seules acceptées OU combinées avec le texte LaTeX)
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-300 rounded-lg shadow-2xs text-xs font-bold text-slate-700 hover:text-blue-700 hover:border-blue-400 transition">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Sélectionner des images / figures</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                {images.length === 0
                  ? 'Aucune image jointe pour ce problème'
                  : `${images.length} image(s) jointe(s)`}
              </span>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white aspect-4/3 flex items-center justify-center shadow-2xs"
                  >
                    <img
                      src={img}
                      alt={`Figure ${idx + 1}`}
                      className="w-full h-full object-contain p-1"
                    />
                    <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                      Fig. {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-90 hover:opacity-100 transition shadow-xs cursor-pointer"
                      title="Supprimer cette figure"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-[#0056b3] hover:bg-[#0a3d75] rounded-xl shadow-xs hover:shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              {problemToEdit ? (
                <>
                  <Edit3 className="w-4 h-4" />
                  Mettre à jour le Problème
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  Publier le Problème
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
