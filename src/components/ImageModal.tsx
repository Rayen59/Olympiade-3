import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

interface ImageModalProps {
  images: string[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const ImageModal: React.FC<ImageModalProps> = ({
  images,
  initialIndex = 0,
  isOpen,
  onClose,
  title = 'Polycopie / Document'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialTouchDistanceRef = useRef<number | null>(null);
  const initialTouchZoomRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((prev) => Math.min(Number((prev + 0.35).toFixed(2)), 5));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((prev) => {
      const next = Math.max(Number((prev - 0.35).toFixed(2)), 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  }, []);

  const handleRotate = useCallback(() => {
    setRotation((prev) => (prev + 90) % 360);
  }, []);

  const handleToggleFitZoom = useCallback(() => {
    setZoom((prev) => {
      if (prev > 1.05) {
        setPosition({ x: 0, y: 0 });
        return 1;
      }
      return 2.5;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    resetTransform();
  }, [images.length, resetTransform]);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    resetTransform();
  }, [images.length, resetTransform]);

  // Sync index and reset transforms on open or index change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransform();
    }
  }, [initialIndex, isOpen, resetTransform]);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Keyboard navigation on PC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && images.length > 1) handleNext();
      if (e.key === 'ArrowLeft' && images.length > 1) handlePrev();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
      if (e.key === '0') resetTransform();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, images.length, handleNext, handlePrev, handleZoomIn, handleZoomOut, resetTransform, onClose]);

  // Wheel zoom on PC
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      setZoom((prev) => Math.min(Number((prev + 0.25).toFixed(2)), 5));
    } else {
      setZoom((prev) => {
        const next = Math.max(Number((prev - 0.25).toFixed(2)), 0.5);
        if (next <= 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse Drag / Pan on PC
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handling for Mobile Phones (Pinch-to-zoom + Touch Pan + Double-tap)
  const getTouchDistance = (t1: React.Touch, t2: React.Touch) => {
    const dx = t1.clientX - t2.clientX;
    const dy = t1.clientY - t2.clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: Start Pinch-to-zoom
      setIsDragging(false);
      initialTouchDistanceRef.current = getTouchDistance(e.touches[0], e.touches[1]);
      initialTouchZoomRef.current = zoom;
    } else if (e.touches.length === 1) {
      // 1 finger: Check for double tap
      const now = Date.now();
      if (now - lastTapRef.current < 300) {
        // Double-tap detected on mobile!
        handleToggleFitZoom();
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      // Pan with 1 finger if zoomed
      if (zoom > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialTouchDistanceRef.current !== null) {
      // Pinch to zoom calculation
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / initialTouchDistanceRef.current;
      const targetZoom = Math.min(Math.max(initialTouchZoomRef.current * scale, 0.5), 5);
      setZoom(Number(targetZoom.toFixed(2)));
    } else if (e.touches.length === 1 && isDragging && zoom > 1) {
      // Pan image with finger
      e.preventDefault();
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      initialTouchDistanceRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
      if (zoom <= 1) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex flex-col select-none touch-none">
      {/* Top Toolbar */}
      <div className="h-14 sm:h-16 px-3 sm:px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 pr-2">
          <h3 className="font-bold text-xs sm:text-sm truncate max-w-[180px] sm:max-w-md text-slate-100">
            {title}
          </h3>
          {images.length > 1 && (
            <span className="text-[10px] sm:text-xs bg-slate-800/90 border border-slate-700 px-2 py-0.5 rounded-full text-slate-300 font-mono shrink-0">
              {currentIndex + 1} / {images.length}
            </span>
          )}
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom stepper */}
          <div className="flex items-center bg-slate-800/95 rounded-lg p-0.5 sm:p-1 border border-slate-700 shadow-inner">
            <button
              onClick={handleZoomOut}
              className="p-1.5 sm:p-2 hover:bg-slate-700 active:bg-slate-600 rounded text-slate-200 hover:text-white transition cursor-pointer touch-manipulation"
              title="Zoom arrière (-)"
              aria-label="Zoom arrière"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={handleToggleFitZoom}
              className="text-[10px] sm:text-xs px-1.5 sm:px-2 font-mono text-blue-300 font-bold hover:text-white transition cursor-pointer touch-manipulation min-w-[42px] sm:min-w-[50px] text-center"
              title="Cliquer pour basculer 100% / 250%"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              className="p-1.5 sm:p-2 hover:bg-slate-700 active:bg-slate-600 rounded text-slate-200 hover:text-white transition cursor-pointer touch-manipulation"
              title="Zoom avant (+)"
              aria-label="Zoom avant"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          <button
            onClick={handleRotate}
            className="p-1.5 sm:p-2 bg-slate-800/95 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer touch-manipulation"
            title="Pivoter 90°"
            aria-label="Pivoter"
          >
            <RotateCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={resetTransform}
            className="p-1.5 sm:p-2 bg-slate-800/95 hover:bg-slate-700 active:bg-slate-600 rounded-lg border border-slate-700 text-slate-200 hover:text-white transition cursor-pointer touch-manipulation"
            title="Réinitialiser le zoom (0)"
            aria-label="Réinitialiser"
          >
            <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-lg transition ml-1 cursor-pointer touch-manipulation shadow-sm"
            title="Fermer (Échap)"
            aria-label="Fermer"
          >
            <X className="w-4 h-4 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Viewport (Responsive PC mouse + Phone touch) */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleToggleFitZoom}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={`flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-6 touch-none ${
          zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
        }`}
      >
        {/* Navigation arrows for multi-image polycopies */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 text-white border border-slate-700 backdrop-blur transition z-20 cursor-pointer shadow-lg touch-manipulation"
              title="Page précédente"
              aria-label="Page précédente"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 active:bg-slate-700 text-white border border-slate-700 backdrop-blur transition z-20 cursor-pointer shadow-lg touch-manipulation"
              title="Page suivante"
              aria-label="Page suivante"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        <img
          src={currentImage}
          alt={title}
          draggable={false}
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.18s cubic-bezier(0.2, 0, 0, 1)'
          }}
          className="max-h-[82vh] max-w-[94vw] object-contain shadow-2xl rounded pointer-events-none select-none"
        />

        {/* Mobile / PC gesture helper badge */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/85 border border-slate-700/80 text-slate-300 text-[10px] sm:text-xs pointer-events-none backdrop-blur shadow flex items-center gap-1.5 whitespace-nowrap">
          <Maximize2 className="w-3 h-3 text-blue-400" />
          <span>
            {zoom > 1
              ? 'Glissez pour déplacer • Double-clic/tap pour réinitialiser'
              : 'Pincez sur mobile ou utilisez la molette sur PC pour zoomer'}
          </span>
        </div>
      </div>

      {/* Quick bottom touch bar for mobile phones */}
      <div className="sm:hidden h-12 bg-slate-900/90 border-t border-slate-800 flex items-center justify-around px-4 z-20 shrink-0">
        <button
          onClick={handleZoomOut}
          className="p-2 text-slate-200 active:text-white flex items-center gap-1 text-xs"
        >
          <ZoomOut className="w-4 h-4 text-slate-300" />
          <span>-</span>
        </button>
        <button
          onClick={handleToggleFitZoom}
          className="px-3 py-1 bg-slate-800 rounded-md border border-slate-700 text-xs font-mono font-bold text-blue-400 active:scale-95 transition"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={handleZoomIn}
          className="p-2 text-slate-200 active:text-white flex items-center gap-1 text-xs"
        >
          <ZoomIn className="w-4 h-4 text-slate-300" />
          <span>+</span>
        </button>
        <button
          onClick={handleRotate}
          className="p-2 text-slate-200 active:text-white"
          title="Pivoter"
        >
          <RotateCw className="w-4 h-4 text-slate-300" />
        </button>
        <button
          onClick={resetTransform}
          className="p-2 text-slate-200 active:text-white"
          title="Réinitialiser"
        >
          <RefreshCw className="w-4 h-4 text-slate-300" />
        </button>
      </div>
    </div>
  );
};
