import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ForumTopic, ForumReply, User } from '../types';
import { store } from '../services/store';
import { MathView } from './MathView';
import { ImageModal } from './ImageModal';
import {
  MessageSquare,
  Plus,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Trash2,
  Maximize2,
  Clock,
  User as UserIcon,
  ChevronLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  Code,
  ShieldAlert,
  Sparkles,
  Search
} from 'lucide-react';

interface ForumViewProps {
  currentUser: User | null;
  onOpenAuth: () => void;
}

const LATEX_SNIPPETS = [
  { label: 'Fraction', code: '$\\frac{a}{b}$' },
  { label: 'Puissance', code: '$x^n$' },
  { label: 'Racine', code: '$\\sqrt{x}$' },
  { label: 'Somme', code: '$\\sum_{k=1}^n k$' },
  { label: 'Produit', code: '$\\prod_{k=1}^n k$' },
  { label: 'Intégrale', code: '$\\int_{a}^{b} f(x) dx$' },
  { label: 'Modulo', code: '$a \\equiv b \\pmod{m}$' },
  { label: 'Inégalité', code: '$a \\le b$' },
  { label: 'Système', code: '$$\\begin{cases} x+y=1 \\\\ x-y=0 \\end{cases}$$' }
];

export const ForumView: React.FC<ForumViewProps> = ({ currentUser, onOpenAuth }) => {
  const [topics, setTopics] = useState<ForumTopic[]>(() => store.getForumTopics());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extract initial topic from URL hash if provided (#forum?topic=xyz)
  const getInitialTopicId = (): string | null => {
    try {
      const hash = window.location.hash;
      const match = hash.match(/[?&]topic=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {}
    return null;
  };

  const [activeTopicId, setActiveTopicId] = useState<string | null>(getInitialTopicId);

  // New Topic Modal State
  const [isNewTopicOpen, setIsNewTopicOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Théorie des Nombres');
  const [newContent, setNewContent] = useState('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [showNewTopicLatexPreview, setShowNewTopicLatexPreview] = useState(false);
  const [topicError, setTopicError] = useState<string | null>(null);

  // Reply State
  const [replyContent, setReplyContent] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [showReplyLatexPreview, setShowReplyLatexPreview] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [replySuccess, setReplySuccess] = useState<string | null>(null);

  // Lightbox Zoom for forum images (PC mouse wheel/drag & Mobile pinch-to-zoom)
  const [zoomImages, setZoomImages] = useState<string[]>([]);
  const [zoomIndex, setZoomIndex] = useState(0);
  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [zoomTitle, setZoomTitle] = useState('Image du forum');

  // Delete confirmation modals
  const [topicToDelete, setTopicToDelete] = useState<ForumTopic | null>(null);
  const [replyToDelete, setReplyToDelete] = useState<{ topicId: string; replyId: string } | null>(null);

  const topicTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

  const reloadTopics = () => {
    const list = store.getForumTopics(selectedCategory);
    setTopics(list);
  };

  useEffect(() => {
    reloadTopics();
    return store.subscribe(reloadTopics);
  }, [selectedCategory]);

  // Sync activeTopicId with URL hash changes (browser back/forward)
  useEffect(() => {
    const handleHashSync = () => {
      try {
        const hash = window.location.hash;
        if (hash.startsWith('#forum')) {
          const match = hash.match(/[?&]topic=([^&]+)/);
          const topicIdFromHash = match && match[1] ? decodeURIComponent(match[1]) : null;
          setActiveTopicId((prev) => (prev !== topicIdFromHash ? topicIdFromHash : prev));
        }
      } catch {}
    };

    window.addEventListener('hashchange', handleHashSync);
    window.addEventListener('popstate', handleHashSync);
    return () => {
      window.removeEventListener('hashchange', handleHashSync);
      window.removeEventListener('popstate', handleHashSync);
    };
  }, []);

  const handleSelectTopic = (id: string | null) => {
    setActiveTopicId(id);
    if (id) {
      window.location.hash = `#forum?topic=${encodeURIComponent(id)}`;
    } else {
      window.location.hash = '#forum';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeTopic = activeTopicId ? store.getForumTopicById(activeTopicId) : null;

  // Safely increment view count once when entering a topic
  useEffect(() => {
    if (activeTopicId && activeTopic) {
      store.incrementTopicViews(activeTopicId);
    }
  }, [activeTopicId]);

  // If topic ID no longer exists (e.g. deleted), revert cleanly to list
  useEffect(() => {
    if (activeTopicId && !activeTopic) {
      handleSelectTopic(null);
    }
  }, [activeTopicId, activeTopic]);

  // Filter topics by category and search query
  const filteredTopics = useMemo(() => {
    let list = topics.filter(Boolean);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.content && t.content.toLowerCase().includes(q)) ||
          (t.authorName && t.authorName.toLowerCase().includes(q)) ||
          (t.category && t.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [topics, searchQuery]);

  const handleOpenImageZoom = (imgs: string[], index = 0, title?: string) => {
    if (!imgs || imgs.length === 0) return;
    setZoomImages(imgs);
    setZoomIndex(index);
    setZoomTitle(title || 'Document / Photo');
    setZoomModalOpen(true);
  };

  const insertSnippet = (
    snippet: string,
    ref: React.RefObject<HTMLTextAreaElement | null>,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const textarea = ref.current;
    if (!textarea) {
      setter((prev) => (prev ? prev + ' ' + snippet : snippet));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    const nextVal = val.substring(0, start) + snippet + val.substring(end);
    setter(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length, start + snippet.length);
    }, 50);
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const result = loadEvent.target?.result as string;
        if (result) {
          setter((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    setTopicError(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!newTitle.trim()) {
      setTopicError('Veuillez fournir un titre pour votre sujet.');
      return;
    }

    if (!newContent.trim() && newImages.length === 0) {
      setTopicError('Veuillez écrire du texte LaTeX ou joindre au moins une photo/image.');
      return;
    }

    const res = store.createForumTopic(currentUser, {
      title: newTitle,
      category: newCategory,
      content: newContent,
      images: newImages,
      imageUrl: newImages[0] || null
    });

    if (res.error) {
      setTopicError(res.error);
    } else {
      setIsNewTopicOpen(false);
      setNewTitle('');
      setNewContent('');
      setNewImages([]);
      setShowNewTopicLatexPreview(false);
      if (res.topic) handleSelectTopic(res.topic.id);
    }
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    setReplyError(null);
    setReplySuccess(null);

    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!activeTopicId) return;

    if (!replyContent.trim() && replyImages.length === 0) {
      setReplyError('Votre réponse doit contenir du texte LaTeX ou au moins une image.');
      return;
    }

    const res = store.replyToForumTopic(activeTopicId, currentUser, {
      content: replyContent,
      images: replyImages,
      imageUrl: replyImages[0] || null
    });

    if (res.error) {
      setReplyError(res.error);
    } else {
      setReplyContent('');
      setReplyImages([]);
      setShowReplyLatexPreview(false);
      setReplySuccess('Votre réponse a été publiée avec succès !');
      setTimeout(() => setReplySuccess(null), 3000);
    }
  };

  const handleConfirmDeleteTopic = () => {
    if (!topicToDelete) return;
    const res = store.deleteForumTopic(topicToDelete.id, currentUser);
    if (res.error) {
      alert(res.error);
    } else {
      if (activeTopicId === topicToDelete.id) {
        handleSelectTopic(null);
      }
      setTopicToDelete(null);
      reloadTopics();
    }
  };

  const handleConfirmDeleteReply = () => {
    if (!replyToDelete) return;
    const res = store.deleteForumReply(replyToDelete.topicId, replyToDelete.replyId, currentUser);
    if (res.error) {
      alert(res.error);
    } else {
      setReplyToDelete(null);
      reloadTopics();
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-[#0a3d75] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Forum Mathématique & Discussions LaTeX
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            Partagez des réflexions avec formules LaTeX (<code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[11px]">$...$</code> et <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700 font-mono text-[11px]">$$...$$</code>) ou simplement des photos de démonstrations géométriques.
          </p>
        </div>

        <button
          onClick={() => {
            if (!currentUser) onOpenAuth();
            else setIsNewTopicOpen(true);
          }}
          className="inline-flex items-center gap-1.5 bg-[#0056b3] hover:bg-[#0a3d75] text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nouveau Sujet
        </button>
      </div>

      {/* Categories Bar & Search Input */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-1">
          {['all', 'Général', 'Théorie des Nombres', 'Géométrie', 'Combinatoire', 'Inégalités', 'Équations Fonctionnelles'].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  handleSelectTopic(null);
                }}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#0056b3] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'all' ? 'Toutes les catégories' : cat}
              </button>
            )
          )}
        </div>

        {/* Quick Search in Topics */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher formule, sujet..."
            className="w-full pl-8 pr-7 py-1 text-xs bg-white border border-slate-300 rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* DETAIL VIEW OF TOPIC */}
      {activeTopic ? (
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <button
              onClick={() => handleSelectTopic(null)}
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Revenir à la liste des discussions
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
                {activeTopic.category}
              </span>
              {/* Admin or Author Delete Topic Button */}
              {(isAdmin || (currentUser && currentUser.id === activeTopic.authorId)) && (
                <button
                  onClick={() => setTopicToDelete(activeTopic)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                  title="Supprimer définitivement ce sujet"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isAdmin ? 'Supprimer (Admin)' : 'Supprimer'}</span>
                </button>
              )}
            </div>
          </div>

          <div>
            {/* Title rendered with MathView for LaTeX equations */}
            <div className="text-base sm:text-lg font-black text-slate-900 mb-2">
              <MathView content={activeTopic.title} />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
              <span className="font-semibold text-slate-700">{activeTopic.authorName}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(activeTopic.createdAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
              <span>•</span>
              <span>{activeTopic.views} vues</span>
            </div>

            {/* Topic Body with LaTeX and/or Photos */}
            <div className="p-4 bg-slate-50 rounded-xl text-xs sm:text-sm leading-relaxed border border-slate-200 space-y-4">
              {activeTopic.content ? (
                <MathView content={activeTopic.content} />
              ) : (
                <div className="text-slate-500 italic text-xs">
                  [Démonstration partagée sous forme de photo ci-dessous]
                </div>
              )}

              {/* Attached Photos with Mobile Pinch-to-Zoom & PC Wheel/Drag */}
              {(() => {
                const topicImgs = activeTopic.images && activeTopic.images.length > 0
                  ? activeTopic.images
                  : (activeTopic.imageUrl ? [activeTopic.imageUrl] : []);

                if (topicImgs.length === 0) return null;

                return (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="block text-[11px] font-bold text-slate-600 mb-2">
                      {topicImgs.length > 1 ? `Photos jointes (${topicImgs.length}) :` : 'Photo jointe :'}
                    </span>
                    <div className="flex flex-wrap gap-3">
                      {topicImgs.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative group border border-slate-200 rounded-lg overflow-hidden bg-white max-w-sm shadow-xs hover:shadow-md transition cursor-pointer"
                          onClick={() => handleOpenImageZoom(topicImgs, idx, activeTopic.title)}
                        >
                          <img
                            src={imgUrl}
                            alt={`Photo jointe ${idx + 1}`}
                            className="max-h-72 object-contain block mx-auto"
                          />
                          <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <span className="bg-slate-900/80 text-white text-xs px-2.5 py-1 rounded-md flex items-center gap-1 backdrop-blur-xs font-semibold">
                              <Maximize2 className="w-3.5 h-3.5" />
                              Zoomer (PC / Mobile)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Replies Thread */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Réponses ({activeTopic.replies ? activeTopic.replies.length : 0})
            </h3>

            {activeTopic.replies && activeTopic.replies.length > 0 ? (
              <div className="space-y-3">
                {activeTopic.replies.map((reply) => {
                  const replyImgs = reply.images && reply.images.length > 0
                    ? reply.images
                    : (reply.imageUrl ? [reply.imageUrl] : []);

                  return (
                    <div key={reply.id} className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs space-y-2 relative group hover:border-slate-300 transition">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
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
                          {/* Admin or Author Delete Reply Button */}
                          {(isAdmin || (currentUser && currentUser.id === reply.authorId)) && (
                            <button
                              onClick={() => setReplyToDelete({ topicId: activeTopic.id, replyId: reply.id })}
                              className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                              title="Supprimer cette réponse"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {reply.content && (
                        <div className="text-slate-800 leading-relaxed">
                          <MathView content={reply.content} />
                        </div>
                      )}

                      {replyImgs.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-2">
                          {replyImgs.map((imgUrl, rIdx) => (
                            <div
                              key={rIdx}
                              className="relative group/img border border-slate-200 rounded overflow-hidden bg-slate-50 cursor-pointer max-w-xs shadow-2xs"
                              onClick={() => handleOpenImageZoom(replyImgs, rIdx, `Réponse de ${reply.authorName}`)}
                            >
                              <img
                                src={imgUrl}
                                alt="Réponse illustration"
                                className="max-h-48 object-contain"
                              />
                              <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition">
                                <span className="bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                                  <Maximize2 className="w-3 h-3" /> Zoom
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic py-2">
                Aucune réponse pour le moment. Soyez le premier à répondre ou à poser votre question !
              </p>
            )}

            {/* Reply Section: Guest prompt or full Form */}
            {!currentUser ? (
              <div className="pt-4 border-t border-slate-200">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl text-center space-y-2">
                  <div className="text-xs font-bold text-[#0a3d75] flex items-center justify-center gap-1.5">
                    <UserIcon className="w-4 h-4 text-blue-600" />
                    <span>Vous souhaitez répondre ou poser une question sur ce sujet ?</span>
                  </div>
                  <p className="text-[11px] text-slate-600 max-w-md mx-auto">
                    La lecture du forum est 100% libre. Pour soumettre une réponse rédigée en LaTeX ou partager une photo de démonstration, connectez-vous ou créez votre compte gratuit.
                  </p>
                  <button
                    onClick={onOpenAuth}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0056b3] hover:bg-[#0a3d75] text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    Se connecter / Créer un compte
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendReply} className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    Votre Réponse (Texte LaTeX ou Photo ou les deux)
                  </label>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReplyLatexPreview(!showReplyLatexPreview)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 transition cursor-pointer"
                    >
                      {showReplyLatexPreview ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Masquer l'aperçu
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Visualiser le LaTeX ($...$)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* LaTeX quick insert chips */}
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
                    <Code className="w-3 h-3 text-blue-600" />
                    Raccourcis LaTeX :
                  </span>
                  {LATEX_SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => insertSnippet(s.code, replyTextareaRef, setReplyContent)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 rounded text-[11px] text-slate-700 font-mono transition cursor-pointer"
                      title={`Insérer ${s.code}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {replyError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{replyError}</span>
                  </div>
                )}

                {replySuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{replySuccess}</span>
                  </div>
                )}

                <textarea
                  ref={replyTextareaRef}
                  rows={3}
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Rédigez votre réponse ici. Vous pouvez utiliser des formules LaTeX ($...$, $$...$$) ou seulement joindre une photo ci-dessous..."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed bg-white"
                />

                {/* Live LaTeX Visualisation Pane */}
                {showReplyLatexPreview && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Visualisation LaTeX avant envoi :
                    </span>
                    {replyContent.trim() ? (
                      <MathView content={replyContent} className="text-xs bg-white p-2.5 rounded border border-slate-200" />
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Tapez des formules LaTeX ($...$) pour voir le rendu mathématique instantané.
                      </p>
                    )}
                  </div>
                )}

                {/* Photos upload & submit row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="file"
                      id="forum-reply-imgs"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageUpload(e, setReplyImages)}
                      className="hidden"
                    />
                    <label
                      htmlFor="forum-reply-imgs"
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                      Joindre photo(s)
                    </label>

                    {/* Image thumbnails */}
                    {replyImages.map((img, idx) => (
                      <div key={idx} className="relative inline-block border border-blue-200 rounded bg-blue-50 p-1">
                        <img
                          src={img}
                          alt="Aperçu"
                          className="w-10 h-10 object-cover rounded cursor-pointer"
                          onClick={() => handleOpenImageZoom(replyImages, idx, 'Aperçu réponse')}
                        />
                        <button
                          type="button"
                          onClick={() => setReplyImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                          title="Retirer"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0056b3] hover:bg-[#0a3d75] text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Envoyer la Réponse
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : (
        /* TOPICS LIST */
        <div className="space-y-2.5">
          {filteredTopics.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs space-y-2">
              {searchQuery ? (
                <>
                  <p>Aucune discussion ne correspond à votre recherche « <span className="font-bold text-slate-700">{searchQuery}</span> ».</p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs font-bold text-blue-700 hover:underline cursor-pointer"
                  >
                    Effacer la recherche
                  </button>
                </>
              ) : (
                <p>Aucun sujet dans cette catégorie. Cliquez sur "Nouveau Sujet" pour lancer une discussion.</p>
              )}
            </div>
          ) : (
            filteredTopics.map((t) => {
              const topicImgs = t.images && t.images.length > 0
                ? t.images
                : (t.imageUrl ? [t.imageUrl] : []);

              return (
                <div
                  key={t.id}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-xl p-4 shadow-xs hover:shadow-sm transition flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleSelectTopic(t.id)}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold text-[#0056b3] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {t.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          {new Date(t.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short'
                          })}
                        </span>
                        {/* Admin or Author Delete Topic from List */}
                        {(isAdmin || (currentUser && currentUser.id === t.authorId)) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTopicToDelete(t);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition cursor-pointer"
                            title="Supprimer ce sujet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Title with LaTeX support */}
                    <div className="font-bold text-sm text-slate-900 group-hover:text-blue-700 transition mb-1.5">
                      <MathView content={t.title} />
                    </div>

                    <div className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {t.content ? (
                        t.content.replace(/\$\$[\s\S]*?\$\$/g, '[Formule LaTeX]').replace(/\$[^$\n]+?\$/g, '[LaTeX]')
                      ) : (
                        <span className="italic text-slate-400">[Démonstration en photo]</span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2.5 mt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-600">
                      <UserIcon className="w-3 h-3 text-slate-400" />
                      <span>{t.authorName}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      {topicImgs.length > 0 && (
                        <span className="text-blue-600 font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {topicImgs.length > 1 ? `${topicImgs.length} photos` : 'Photo'}
                        </span>
                      )}
                      <span>{t.views ?? 0} vues</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded group-hover:bg-blue-100 transition">
                        💬 {t.replies ? t.replies.length : 0} réponses
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* NEW TOPIC MODAL (Allows Text-only, Photo-only, or Both!) */}
      {isNewTopicOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden my-auto relative max-h-[92vh] flex flex-col">
            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600" />
                Créer un Nouveau Sujet (LaTeX et/ou Photos)
              </h2>
              <button
                onClick={() => setIsNewTopicOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTopic} className="p-5 overflow-y-auto flex-1 space-y-3.5">
              {topicError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{topicError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titre du sujet (LaTeX supporté avec <code className="text-blue-600 font-mono">$...$</code>)
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Preuve que $\sum_{k=1}^n k^3 = (\frac{n(n+1)}{2})^2$ ou Question Géométrie"
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer"
                >
                  <option value="Théorie des Nombres">Théorie des Nombres</option>
                  <option value="Géométrie">Géométrie</option>
                  <option value="Combinatoire">Combinatoire</option>
                  <option value="Inégalités">Inégalités</option>
                  <option value="Équations Fonctionnelles">Équations Fonctionnelles</option>
                  <option value="Général">Général & Méthodes</option>
                </select>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Contenu & Démonstrations (Optionnel si vous joignez une photo)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewTopicLatexPreview(!showNewTopicLatexPreview)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 transition cursor-pointer"
                  >
                    {showNewTopicLatexPreview ? (
                      <>
                        <EyeOff className="w-3 h-3" /> Masquer l'aperçu
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" /> Visualiser le LaTeX ($...$)
                      </>
                    )}
                  </button>
                </div>

                {/* LaTeX Snippet Chips */}
                <div className="flex items-center gap-1.5 flex-wrap bg-slate-50 p-2 rounded-lg border border-slate-200 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 mr-1">
                    <Code className="w-3 h-3 text-blue-600" />
                    Raccourcis :
                  </span>
                  {LATEX_SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => insertSnippet(s.code, topicTextareaRef, setNewContent)}
                      className="px-2 py-0.5 bg-white hover:bg-blue-50 border border-slate-300 hover:border-blue-300 rounded text-[11px] text-slate-700 font-mono transition cursor-pointer"
                      title={`Insérer ${s.code}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                <textarea
                  ref={topicTextareaRef}
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Exposez votre question, lemme ou démonstration. Vous pouvez utiliser du LaTeX ($...$, $$...$$), ou laisser vide et joindre seulement des photos ci-dessous."
                  className="w-full p-2.5 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                />

                {/* Live LaTeX Visualisation Pane */}
                {showNewTopicLatexPreview && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Visualisation LaTeX avant envoi :
                    </span>
                    {newContent.trim() ? (
                      <MathView content={newContent} className="text-xs bg-white p-2.5 rounded border border-slate-200" />
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Tapez du texte ou du LaTeX ($...$) pour le voir mis en forme ici.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Photos upload (Photos-only or with LaTeX) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Photos / Schémas (Optionnel si vous avez saisi du texte, ou envoyez des photos uniquement)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    id="new-topic-imgs"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageUpload(e, setNewImages)}
                    className="hidden"
                  />
                  <label
                    htmlFor="new-topic-imgs"
                    className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-md border border-slate-300 transition"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                    Choisir des photos
                  </label>

                  {newImages.map((img, idx) => (
                    <div key={idx} className="relative inline-block border border-blue-200 rounded bg-blue-50 p-1">
                      <img
                        src={img}
                        alt="Aperçu nouveau sujet"
                        className="w-12 h-12 object-cover rounded cursor-pointer"
                        onClick={() => handleOpenImageZoom(newImages, idx, 'Aperçu photo')}
                      />
                      <button
                        type="button"
                        onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow hover:bg-rose-700"
                        title="Retirer cette photo"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTopicOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#0056b3] hover:bg-[#0a3d75] rounded-md shadow-xs transition cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Publier la Discussion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE TOPIC MODAL (Admin or Author) */}
      {topicToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-100" />
                <h3 className="font-bold text-sm">Supprimer la discussion</h3>
              </div>
              <button
                onClick={() => setTopicToDelete(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-700 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement cette discussion et toutes ses réponses ?
              </p>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800">
                <MathView content={topicToDelete.title} />
              </div>
              <p className="text-[11px] text-rose-600 italic">
                Cette action est immédiate et irréversible.
              </p>
            </div>

            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setTopicToDelete(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteTopic}
                className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Supprimer Définitivement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE REPLY MODAL (Admin or Author) */}
      {replyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-100" />
                <h3 className="font-bold text-sm">Supprimer la réponse</h3>
              </div>
              <button
                onClick={() => setReplyToDelete(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-2">
              <p className="text-xs text-slate-700">
                Êtes-vous sûr de vouloir supprimer cette réponse ?
              </p>
            </div>

            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setReplyToDelete(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDeleteReply}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom for forum images (Smooth PC Wheel/Pan & Phone Pinch-to-Zoom) */}
      <ImageModal
        images={zoomImages}
        initialIndex={zoomIndex}
        isOpen={zoomModalOpen}
        onClose={() => setZoomModalOpen(false)}
        title={zoomTitle}
      />
    </div>
  );
};
