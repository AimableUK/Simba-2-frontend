"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
} from "lucide-react";

//  Types
interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

//  Helpers
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

//  Custom progress bar
function ProgressBar({
  current,
  duration,
  onSeek,
}: {
  current: number;
  duration: number;
  onSeek: (pct: number) => void;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(pct);
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      className="group relative h-1 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-2"
    >
      {/* filled */}
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all"
        style={{ width: `${pct}%` }}
      />
      {/* thumb */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full bg-primary opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

//  The actual player (loaded lazily)
function VideoPlayer({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [ended, setEnded] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-hide controls
  const resetHideTimer = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setShowControls(true);
    hideTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [playing]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (ended) {
      v.currentTime = 0;
      setEnded(false);
    }
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const handleSeek = (pct: number) => {
    const v = videoRef.current;
    if (!v || !duration) return;
    v.currentTime = pct * duration;
    setEnded(false);
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const fullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
  };

  const restart = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play();
    setPlaying(true);
    setEnded(false);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => {
        if (playing) setShowControls(false);
      }}
    >
      {/* Video element  no controls, no download */}
      <video
        ref={videoRef}
        src="/simbademo.mp4"
        className="h-full w-full object-contain"
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onPlay={() => {
          setPlaying(true);
          setEnded(false);
        }}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
          setShowControls(true);
        }}
        playsInline
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        preload="metadata"
      />

      {/* Big centre play button (only when paused / before play) */}
      <AnimatePresence>
        {(!playing || ended) && (
          <motion.button
            key="bigplay"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            onClick={toggle}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-xl ring-4 ring-white/20 transition-transform hover:scale-110">
              {ended ? (
                <RotateCcw size={32} className="text-white" />
              ) : (
                <Play size={32} className="translate-x-0.5 text-white" />
              )}
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Clickable overlay to play/pause */}
      {playing && (
        <div className="absolute inset-0 cursor-pointer" onClick={toggle} />
      )}

      {/* Controls bar */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-4 pt-10"
          >
            {/* Progress */}
            <div className="mb-3">
              <ProgressBar
                current={current}
                duration={duration}
                onSeek={handleSeek}
              />
            </div>

            {/* Buttons row */}
            <div className="flex items-center gap-3">
              {/* Play / Pause */}
              <button
                onClick={toggle}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:text-primary"
              >
                {playing ? (
                  <Pause size={18} />
                ) : ended ? (
                  <RotateCcw size={18} />
                ) : (
                  <Play size={18} />
                )}
              </button>

              {/* Mute */}
              <button
                onClick={toggleMute}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:text-primary"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Restart */}
              <button
                onClick={restart}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
              >
                <RotateCcw size={15} />
              </button>

              {/* Time */}
              <span className="ml-1 font-mono text-xs text-white/70">
                {formatTime(current)}
                <span className="mx-1 text-white/30">/</span>
                {formatTime(duration)}
              </span>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Fullscreen */}
              <button
                onClick={fullscreen}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white"
                title="Fullscreen"
              >
                <Maximize2 size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

//  Modal wrapper
export default function VideoPlayerModal({
  isOpen,
  onClose,
}: VideoPlayerModalProps) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
          />

          {/* Dialog */}
          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
            // Prevent closing when clicking inside the dialog itself
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-w-4xl">
              {/* Close button */}
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-white/40">
                    Simba Supermarket
                  </p>
                  <p className="text-sm font-medium text-white/80">
                    Product Demo
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lazy-loaded player  only mounts when modal is open */}
              <Suspense
                fallback={
                  <div
                    className="flex w-full items-center justify-center rounded-2xl bg-zinc-900"
                    style={{ aspectRatio: "16/9" }}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-xs text-white/40">Loading video…</p>
                    </div>
                  </div>
                }
              >
                <VideoPlayer onClose={onClose} />
              </Suspense>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
