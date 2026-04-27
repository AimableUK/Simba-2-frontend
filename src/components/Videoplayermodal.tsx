"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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
function formatTime(s: number): string {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

//  Progress bar 
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
  const pct = duration > 0 ? (current / duration) * 100 : 0;

  const calc = (clientX: number) => {
    if (!barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const p = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(p);
  };

  return (
    <div
      ref={barRef}
      onMouseDown={(e) => {
        e.stopPropagation();
        calc(e.clientX);
      }}
      className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/25 hover:h-2.5 transition-all duration-150"
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full bg-primary"
        style={{ width: `${pct}%` }}
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-primary shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `${pct}%` }}
      />
    </div>
  );
}

//  Player 
function VideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [ended, setEnded] = useState(false);
  const [ready, setReady] = useState(false);

  // Use a ref so the timer callback always reads fresh state
  const playingRef = useRef(playing);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => {
      if (playingRef.current) setShowControls(false);
    }, 3000);
  }, []);

  const showAndScheduleHide = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    },
    [],
  );

  // When playing starts, kick off the hide timer
  useEffect(() => {
    if (playing) scheduleHide();
    else {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setShowControls(true);
    }
  }, [playing, scheduleHide]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (ended) {
      v.currentTime = 0;
      setEnded(false);
    }
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [ended]);

  const seek = useCallback((pct: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = pct * v.duration;
    setEnded(false);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }, []);

  const goFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.requestFullscreen) el.requestFullscreen();
  }, []);

  const restart = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setEnded(false);
  }, []);

  // Click on the video area (not controls) → toggle play
  const handleVideoAreaClick = useCallback(
    (e: React.MouseEvent) => {
      // Only fire if clicking the video surface itself (not a button)
      if ((e.target as HTMLElement).closest("button,input")) return;
      toggle();
    },
    [toggle],
  );

  return (
    <div
      ref={containerRef}
      onMouseMove={showAndScheduleHide}
      onMouseLeave={() => {
        if (playingRef.current) setShowControls(false);
      }}
      className="relative w-full overflow-hidden rounded-2xl bg-black select-none"
      style={{ aspectRatio: "16/9" }}
    >
      {/*  Video  */}
      <video
        ref={videoRef}
        src="/simbademo.mp4"
        className="h-full w-full object-contain"
        playsInline
        preload="metadata"
        controlsList="nodownload noremoteplayback nofullscreen"
        disablePictureInPicture
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          setReady(true);
        }}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
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
      />

      {/*  Loading spinner (before metadata loaded)  */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/*  Clickable video surface (ignores control layer)  */}
      {ready && (
        <div
          className="absolute inset-0"
          style={{ bottom: "72px" }} // leave room for controls so they still receive events
          onClick={handleVideoAreaClick}
        />
      )}

      {/*  Big centre play/replay button  */}
      <AnimatePresence>
        {ready && (!playing || ended) && (
          <motion.div
            key="bigplay"
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.75 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            style={{ bottom: "72px" }}
          >
            <button
              className="pointer-events-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary shadow-2xl ring-4 ring-white/20 transition-transform hover:scale-110 active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                toggle();
              }}
            >
              {ended ? (
                <RotateCcw size={32} className="text-white" />
              ) : (
                <Play size={32} className="translate-x-0.5 text-white" />
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/*  Controls bar  */}
      <AnimatePresence>
        {ready && showControls && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.18 }}
            // stopPropagation so mouse events here don't reach the video area div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-16"
          >
            {/* Progress */}
            <div className="mb-3 px-1">
              <ProgressBar
                current={current}
                duration={duration}
                onSeek={seek}
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {/* Play / Pause / Replay */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:text-primary"
              >
                {ended ? (
                  <RotateCcw size={18} />
                ) : playing ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}
              </button>

              {/* Mute */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMute();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:text-primary"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>

              {/* Restart */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  restart();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
                title="Restart"
              >
                <RotateCcw size={14} />
              </button>

              {/* Time */}
              <span className="ml-1 font-mono text-xs tabular-nums text-white/60">
                {formatTime(current)}
                <span className="mx-1 text-white/25">/</span>
                {formatTime(duration)}
              </span>

              <div className="flex-1" />

              {/* Fullscreen */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  goFullscreen();
                }}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/50 transition-colors hover:text-white"
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

//  Modal 
export default function VideoPlayerModal({
  isOpen,
  onClose,
}: VideoPlayerModalProps) {
  // Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        // Single wrapper — backdrop click closes, inner click stops propagation
        <motion.div
          key="modal-root"
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose} // clicking the dark area closes
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

          {/* Dialog — clicks here must NOT propagate to the backdrop */}
          <motion.div
            className="relative z-10 w-full max-w-4xl"
            initial={{ scale: 0.92, y: 28 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header row */}
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">
                  Simba Supermarket
                </p>
                <p className="text-sm font-semibold text-white/75">
                  Product Demo
                </p>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close video"
              >
                <X size={18} />
              </button>
            </div>

            {/* Player mounts only when open */}
            <VideoPlayer />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
