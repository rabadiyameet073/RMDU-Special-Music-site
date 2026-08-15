import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Disc3,
  GripVertical,
  ListMusic,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Plus,
  Radio,
  Repeat,
  Repeat1,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Tv,
  Volume1,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

import bgArt from "@/assets/rmdu-bg.jpg";
import {
  fmt,
  PLAYLIST_ID,
  useYouTubePlaylist,
} from "@/hooks/useYouTubePlaylist";

const YT_PLAYLIST = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const YTM_PLAYLIST = `https://music.youtube.com/playlist?list=${PLAYLIST_ID}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RMDU Special — Vintage Worksite Radio" },
      {
        name: "description",
        content:
          "RMDU Special: an authentic vintage worksite radio with analog rotary volume dials, radio frequency tuning scale, custom queue, and dynamic song banner backgrounds.",
      },
      { property: "og:title", content: "RMDU Special — Vintage Worksite Radio" },
      {
        property: "og:description",
        content:
          "Classic analog radio controls, rotary volume dial, frequency tuning seeker, and custom music queue with dynamic banner artwork.",
      },
      { property: "og:type", content: "music.playlist" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function useClock() {
  const [now, setNow] = useState<string>("");
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date()
          .toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .toLowerCase(),
      );
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function Index() {
  const p = useYouTubePlaylist();
  const clock = useClock();
  const [queueOpen, setQueueOpen] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newSongInput, setNewSongInput] = useState("");
  const [addError, setAddError] = useState("");
  const [speedOpen, setSpeedOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isKnobDragging, setIsKnobDragging] = useState(false);

  const barRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);

  const progress = p.duration ? (p.time / p.duration) * 100 : 0;
  const currentCover = p.current?.thumbnail;

  useEffect(() => {
    if (queueOpen) {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [queueOpen, p.index]);

  const total = useMemo(() => p.tracks.length, [p.tracks.length]);
  const totalDuration = useMemo(
    () => p.tracks.reduce((acc, t) => acc + (t.duration || 0), 0),
    [p.tracks],
  );

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSongInput.trim()) return;
    setAddError("");
    const ok = await p.addTrack(newSongInput.trim());
    if (ok) {
      setNewSongInput("");
      setAddOpen(false);
    } else {
      setAddError("Invalid YouTube URL or Video ID. Please check and try again.");
    }
  };

  const handleDragStart = (i: number) => {
    setDraggedIndex(i);
  };

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === i) return;
    p.moveTrack(draggedIndex, i);
    setDraggedIndex(i);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Rotary Knob Drag Handling
  const handleKnobMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsKnobDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isKnobDragging || !knobRef.current) return;
      const rect = knobRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;

      let normalized = 0;
      if (angle >= 225 && angle <= 360) {
        normalized = (angle - 225) / 270;
      } else if (angle >= 0 && angle <= 135) {
        normalized = (angle + 135) / 270;
      } else if (angle > 135 && angle < 180) {
        normalized = 1;
      } else {
        normalized = 0;
      }
      p.setVolume(Math.round(normalized * 100));
    };

    const handleMouseUp = () => {
      if (isKnobDragging) setIsKnobDragging(false);
    };

    if (isKnobDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isKnobDragging, p]);

  // Volume knob angle calculation (-135deg to +135deg)
  const knobAngle = (p.muted ? 0 : p.volume / 100) * 270 - 135;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#140c06] font-body select-none">
      {/* Background Layer 1: Default Illustration */}
      <img
        src={bgArt}
        alt="Illustration backdrop"
        width={1920}
        height={1088}
        className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
      />

      {/* Background Layer 2: Dynamic Song Banner Ambient Backdrop with High-Fidelity Glow */}
      {currentCover && (
        <div
          className="absolute inset-0 size-full bg-cover bg-center transition-all duration-1000 transform scale-110 filter blur-3xl opacity-65 animate-ambient-glow"
          style={{ backgroundImage: `url(${currentCover})` }}
        />
      )}

      {/* Deep Vignette & Darkening Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#140c06]/85 via-[#140c06]/40 to-[#140c06]/95 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_260px_90px_#140c06]" />

      {/* Top Header with Vintage Radio Branding */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 text-xs text-foreground/80">
        <div className="flex items-center gap-3">
          <span className="font-mono-ui tabular-nums font-semibold tracking-wider text-accent drop-shadow-[0_0_8px_rgba(255,180,60,0.5)]">
            {clock}
          </span>
          <span className="h-3 w-px bg-amber-800/40" />
          <span className="flex items-center gap-2">
            <span
              className={`size-2.5 rounded-full ring-1 ring-amber-500/40 ${
                p.playing
                  ? "animate-pulse bg-amber-500 shadow-[0_0_10px_#f59e0b]"
                  : "bg-amber-950 shadow-inner"
              }`}
            />
            <span className="font-mono-ui uppercase tracking-widest text-[0.65rem] text-amber-200/80 font-bold">
              {p.playing ? "RADIO ON AIR" : "STANDBY"}
            </span>
          </span>
        </div>

        {/* Current song marquee badge */}
        {p.current && (
          <div className="hidden md:flex items-center gap-2 max-w-sm px-3.5 py-1 rounded-full border border-amber-800/40 bg-black/40 shadow-inner backdrop-blur-md">
            <Radio className="size-3 text-amber-500 animate-pulse" />
            <span className="truncate text-xs text-amber-100 font-medium">
              {p.current.title}
            </span>
            <span className="text-amber-700 text-[0.65rem]">•</span>
            <span className="truncate text-[0.65rem] text-amber-300/70">
              {p.current.author}
            </span>
          </div>
        )}

        <nav className="flex items-center gap-4">
          <a
            href={YTM_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-amber-200/70 transition-colors hover:text-amber-100 font-mono-ui text-[0.7rem]"
          >
            YouTube Music
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
          <a
            href={YT_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-amber-200/70 transition-colors hover:text-amber-100 font-mono-ui text-[0.7rem]"
          >
            YouTube
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
        </nav>
      </header>

      {/* Main Hero Center Stage */}
      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pb-28">
        <div className="relative group">
          {currentCover && (
            <div
              className="absolute -inset-8 rounded-full bg-cover bg-center filter blur-3xl opacity-45 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"
              style={{ backgroundImage: `url(${currentCover})` }}
            />
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-amber-700/50 bg-black/40 backdrop-blur-sm mb-3 shadow-md">
            <Zap className="size-3 text-amber-400" />
            <p className="font-mono-ui text-[0.7rem] uppercase tracking-[0.35em] text-accent font-semibold">
              SOLID-STATE ALL-WAVE RADIO
            </p>
          </div>
          <h1 className="font-display text-[4.5rem] leading-[0.85] tracking-tight text-foreground drop-shadow-[0_10px_35px_rgba(0,0,0,0.9)] sm:text-[7.5rem] lg:text-[10rem]">
            RMDU SPECIAL
          </h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 text-xs text-foreground/80 font-mono-ui">
          <span className="px-3 py-1 rounded-lg border border-amber-900/50 bg-[#1d1209]/80 text-amber-200/90 shadow-sm">
            📻 {total} Radio Tracks
          </span>
          {totalDuration > 0 && (
            <span className="px-3 py-1 rounded-lg border border-amber-900/50 bg-[#1d1209]/80 text-amber-200/90 shadow-sm">
              ⏱️ {fmt(totalDuration)} Total
            </span>
          )}
          <button
            onClick={() => setQueueOpen(true)}
            className="px-3.5 py-1 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-100 font-semibold transition-all inline-flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
          >
            <ListMusic className="size-3.5 text-amber-400" />
            Station Queue
          </button>
        </div>
      </main>

      {/* Video Player Floating Modal */}
      <section
        className={`absolute bottom-40 left-1/2 z-40 w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border-2 border-amber-700/50 bg-[#1c120a]/95 shadow-[0_20px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300 ${
          embedOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : "pointer-events-none translate-y-6 opacity-0 scale-95"
        }`}
      >
        <div className="flex items-center justify-between border-b border-amber-800/40 px-4 py-2.5 bg-black/40 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <Tv className="size-3.5 text-amber-500" />
            <span className="font-mono-ui text-[0.68rem] uppercase tracking-[0.2em] text-amber-100 font-semibold">
              CRT Monitor Feed
            </span>
          </div>
          <button
            onClick={() => setEmbedOpen(false)}
            aria-label="Close video player"
            className="rounded-lg p-1 text-amber-300/60 transition-colors hover:bg-white/10 hover:text-amber-100 cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div
          id="yt-player-host-wrapper"
          className="aspect-video w-full overflow-hidden rounded-b-2xl bg-black ring-1 ring-amber-900/30"
        >
          <div id="yt-player-host" className="size-full" />
        </div>
      </section>

      {/* Playlist Queue Drawer with Dynamic Song Banner Cards */}
      <section
        className={`absolute bottom-40 left-1/2 z-30 w-[min(94vw,44rem)] -translate-x-1/2 rounded-3xl border-2 border-amber-700/40 bg-[#1e130b]/95 shadow-[0_24px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300 flex flex-col ${
          queueOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : "pointer-events-none translate-y-6 opacity-0 scale-95"
        }`}
      >
        {/* Queue Header */}
        <div className="flex items-center justify-between border-b border-amber-800/40 px-5 py-3.5 bg-black/40 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <ListMusic className="size-4 text-amber-500" />
            <span className="font-mono-ui text-xs uppercase tracking-[0.18em] text-amber-100 font-bold">
              Radio Playlist Queue ({total})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen((v) => !v)}
              title="Add song to queue"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono-ui font-semibold border border-amber-700/50 bg-amber-900/30 hover:bg-amber-900/60 transition-colors text-amber-100 cursor-pointer"
            >
              <Plus className="size-3.5 text-amber-400" />
              Add Track
            </button>
            <button
              onClick={p.resetQueue}
              title="Reset queue to original playlist"
              className="p-1.5 rounded-lg text-amber-300/60 hover:text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              onClick={p.clearQueue}
              title="Clear entire queue"
              className="p-1.5 rounded-lg text-amber-300/60 hover:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>
            <span className="h-4 w-px bg-amber-800/40 mx-0.5" />
            <button
              onClick={() => setQueueOpen(false)}
              aria-label="Close queue"
              className="p-1.5 rounded-lg text-amber-300/60 hover:text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Add Song Form */}
        {addOpen && (
          <form
            onSubmit={handleAddSong}
            className="p-3 border-b border-amber-800/40 bg-black/40 flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste YouTube Video URL or ID (e.g. youtu.be/...)"
                value={newSongInput}
                onChange={(e) => setNewSongInput(e.target.value)}
                className="flex-1 rounded-xl border border-amber-800/80 bg-black/60 px-3.5 py-1.5 text-xs text-amber-100 placeholder:text-amber-600/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-amber-600 text-black font-mono-ui text-xs font-bold hover:bg-amber-500 transition-colors shrink-0 shadow cursor-pointer"
              >
                Add
              </button>
            </div>
            {addError && <p className="text-[0.7rem] text-destructive px-1">{addError}</p>}
          </form>
        )}

        {/* Queue Items List with Rich Song Banner Backgrounds */}
        <div className="max-h-[52vh] overflow-y-auto p-3 space-y-2.5">
          {p.tracks.length === 0 && (
            <div className="py-12 text-center text-amber-300/50">
              <Music className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Queue is empty</p>
              <button
                onClick={p.resetQueue}
                className="mt-3 text-xs text-amber-400 underline underline-offset-4 hover:opacity-80 cursor-pointer"
              >
                Restore default RMDU playlist
              </button>
            </div>
          )}

          {p.tracks.map((t, i) => {
            const active = i === p.index;
            return (
              <div
                key={t.videoId + "-" + i}
                ref={active ? activeRef : null}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                className={`group relative flex items-center gap-3.5 rounded-2xl p-2.5 transition-all duration-200 border overflow-hidden ${
                  active
                    ? "border-amber-500/90 bg-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40"
                    : "border-amber-900/40 hover:border-amber-700/70 bg-[#160c06]/80 hover:bg-[#22130a]"
                } ${draggedIndex === i ? "opacity-35 scale-[0.98]" : ""}`}
              >
                {/* 🌟 Song Banner Background on Every Song Card 🌟 */}
                {t.thumbnail && (
                  <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-300 pointer-events-none ${
                      active
                        ? "opacity-30 filter blur-xs scale-105"
                        : "opacity-15 filter blur-sm group-hover:opacity-25 group-hover:scale-102"
                    }`}
                    style={{ backgroundImage: `url(${t.thumbnail})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#140c06]/95 via-[#140c06]/80 to-[#140c06]/95 pointer-events-none" />

                {/* Drag Handle */}
                <div
                  className="relative z-10 cursor-grab active:cursor-grabbing text-amber-600/50 hover:text-amber-300 transition-colors p-1"
                  title="Drag to rearrange queue"
                >
                  <GripVertical className="size-4" />
                </div>

                {/* Song Banner Thumbnail with Live Equalizer */}
                <button
                  type="button"
                  onClick={() => p.playAt(i)}
                  className="relative z-10 size-14 shrink-0 rounded-xl overflow-hidden bg-black/70 border border-amber-800/70 group-hover:ring-2 group-hover:ring-amber-500/70 transition-all text-left shadow cursor-pointer"
                >
                  <img
                    src={t.thumbnail}
                    alt={t.title}
                    className="size-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                  {active && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5 backdrop-blur-[1px]">
                      <span className="w-1 bg-amber-400 rounded-full animate-eq-1" />
                      <span className="w-1 bg-amber-200 rounded-full animate-eq-2" />
                      <span className="w-1 bg-amber-400 rounded-full animate-eq-3" />
                    </div>
                  )}
                </button>

                {/* Track Info */}
                <button
                  type="button"
                  onClick={() => p.playAt(i)}
                  className="relative z-10 min-w-0 flex-1 text-left cursor-pointer"
                >
                  <p
                    className={`truncate text-xs sm:text-sm font-medium ${
                      active ? "text-amber-200 font-bold" : "text-amber-100"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="truncate text-[0.72rem] text-amber-400/70 font-mono-ui">
                    {t.author}
                  </p>
                </button>

                {/* Duration */}
                <span className="relative z-10 shrink-0 font-mono-ui text-[0.72rem] text-amber-300/70 font-medium">
                  {t.duration ? fmt(t.duration) : "--:--"}
                </span>

                {/* Reorder Up/Down & Remove */}
                <div className="relative z-10 flex items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => p.moveTrack(i, i - 1)}
                      title="Move up"
                      className="p-1 rounded text-amber-500/60 hover:text-amber-200 disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === p.tracks.length - 1}
                      onClick={() => p.moveTrack(i, i + 1)}
                      title="Move down"
                      className="p-1 rounded text-amber-500/60 hover:text-amber-200 disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => p.removeTrack(i)}
                    title="Remove from queue"
                    className="p-1.5 rounded-lg text-amber-500/50 hover:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 📻 VINTAGE WORKSITE RADIO CONSOLE (REDESIGNED BOTTOM FLOATING BAR) 📻 */}
      {/* ========================================================================= */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-2 sm:px-4">
        <div className="pointer-events-auto retro-radio-body relative flex w-full max-w-4xl flex-col rounded-3xl p-3 sm:p-4 border-2 border-amber-700/50">
          {/* 4 Corner Brass Rivets */}
          <span className="absolute top-2 left-2 size-2 rounded-full bg-amber-400/70 border border-amber-800 shadow-sm" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-amber-400/70 border border-amber-800 shadow-sm" />
          <span className="absolute bottom-2 left-2 size-2 rounded-full bg-amber-400/70 border border-amber-800 shadow-sm" />
          <span className="absolute bottom-2 right-2 size-2 rounded-full bg-amber-400/70 border border-amber-800 shadow-sm" />

          {/* Top Brass Identification Plate */}
          <div className="mb-2 flex items-center justify-between px-2 text-[0.62rem] font-mono-ui uppercase tracking-widest text-amber-400/80 border-b border-amber-800/40 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_4px_#f59e0b]" />
              <span className="font-bold text-amber-200 tracking-wider">
                ✦ SOLID-STATE ALL-WAVE RADIO • RMDU SPEC-003 ✦
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-amber-400/70 font-mono-ui font-semibold">
                VALVE TONE &bull; STEREO HI-FI
              </span>
              <span className="size-1.5 rounded-full bg-amber-500 shadow-[0_0_3px_#f59e0b]" />
            </div>
          </div>

          {/* Main Console Deck Layout */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* 1. Spinning Vinyl Record / Album Art Turntable */}
            <button
              onClick={() => setEmbedOpen((v) => !v)}
              title={embedOpen ? "Close CRT video monitor" : "Open CRT video monitor"}
              className="group relative size-13 sm:size-15 shrink-0 rounded-full bg-[#110a05] p-0.5 ring-2 ring-amber-700/60 hover:ring-amber-400 transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.85)]"
            >
              {/* Vinyl Grooves Background */}
              <div
                className={`relative size-full rounded-full overflow-hidden border border-amber-900/60 shadow-inner ${
                  p.playing ? "animate-vinyl" : "animate-vinyl-paused"
                }`}
              >
                {currentCover ? (
                  <img
                    src={currentCover}
                    alt="Song cover"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-amber-950/90 flex items-center justify-center">
                    <Disc3 className="size-7 text-amber-500/70" />
                  </div>
                )}
                {/* Center Brass Spindle Pin */}
                <div className="absolute inset-0 m-auto size-3.5 rounded-full bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-700 border border-amber-800 shadow-md flex items-center justify-center">
                  <div className="size-1.5 rounded-full bg-black/90" />
                </div>
              </div>

              {/* Hover CRT expand icon */}
              <span className="absolute inset-0 rounded-full bg-black/65 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-200">
                {embedOpen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </span>
            </button>

            {/* 2. Track Title & Artist Marquee */}
            <div className="min-w-0 max-w-[105px] sm:max-w-[155px] md:max-w-[185px]">
              <p className="truncate text-xs sm:text-sm font-bold text-amber-100 tracking-tight">
                {p.current?.title ?? (p.ready ? "Station Ready" : "Tuning Station…")}
              </p>
              <p className="truncate text-[0.68rem] text-amber-400/75 font-mono-ui font-medium">
                {p.current?.author ?? "RMDU Radio"}
              </p>
            </div>

            {/* 3. Backlit Radio Frequency Dial Scale (Track Seeker) */}
            <div className="hidden min-w-0 flex-1 flex-col gap-0.5 md:flex">
              <div
                ref={barRef}
                role="slider"
                tabIndex={0}
                aria-label="Radio Frequency Seeker"
                aria-valuenow={Math.round(progress)}
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setHoverTime(ratio * p.duration);
                }}
                onMouseLeave={() => setHoverTime(null)}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  p.seek(ratio * p.duration);
                }}
                className="group relative h-9 w-full cursor-pointer rounded-xl retro-tuner-glass border border-amber-600/50 p-1 overflow-hidden select-none"
              >
                {/* Dual AM/FM Printed Radio Frequency Scale */}
                <div className="absolute inset-x-2.5 top-0.5 flex justify-between text-[0.52rem] font-mono-ui text-amber-500/50 pointer-events-none">
                  <span>AM 530</span>
                  <span>700</span>
                  <span>1000</span>
                  <span>1300</span>
                  <span>1600 kHz</span>
                </div>
                <div className="absolute inset-x-2.5 bottom-0.5 flex justify-between text-[0.52rem] font-mono-ui text-amber-400/40 pointer-events-none">
                  <span>FM 88</span>
                  <span>92</span>
                  <span>96</span>
                  <span>100</span>
                  <span>104</span>
                  <span>108 MHz</span>
                </div>

                {/* Progress Track fill */}
                <div
                  className="absolute inset-y-1.5 left-1 rounded-lg bg-gradient-to-r from-amber-700/20 via-amber-500/30 to-amber-400/40 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />

                {/* Glowing Vintage Red Analog Tuning Needle */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 shadow-[0_0_8px_#ef4444,0_0_14px_#f97316] transition-all duration-100 pointer-events-none z-10"
                  style={{ left: `${progress}%` }}
                >
                  <div className="absolute -top-0.5 -left-1 size-2.5 rounded-full bg-red-400 border border-amber-200 shadow" />
                  <div className="absolute -bottom-0.5 -left-1 size-2.5 rounded-full bg-red-400 border border-amber-200 shadow" />
                </div>

                {/* Hover Time Tooltip */}
                {hoverTime !== null && (
                  <div
                    className="absolute -top-7 -translate-x-1/2 rounded-md bg-[#100803] border border-amber-600/70 px-1.5 py-0.5 font-mono-ui text-[0.62rem] text-amber-200 pointer-events-none shadow-lg z-20"
                    style={{
                      left: `${(hoverTime / (p.duration || 1)) * 100}%`,
                    }}
                  >
                    📻 {fmt(hoverTime)}
                  </div>
                )}
              </div>

              {/* Digital Nixie Counters & VU Meter Indicator */}
              <div className="flex items-center justify-between font-mono-ui text-[0.65rem] text-amber-400/80 px-1">
                <span>{fmt(p.time)}</span>
                <div className="flex items-center gap-1.5 text-[0.58rem] tracking-wider text-amber-500/80">
                  <Activity className={`size-3 text-amber-400 ${p.playing ? "animate-pulse text-amber-300" : "opacity-40"}`} />
                  <span>{p.playing ? "SIGNAL LOCKED • ON AIR" : "TUNER PAUSED"}</span>
                </div>
                <span>{fmt(p.duration)}</span>
              </div>
            </div>

            {/* 4. Controls Cluster: Vintage Mechanical Pushbuttons & Rotary Knob */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Shuffle Toggle Button with Jeweled Indicator Lamp */}
              <button
                onClick={() => p.setShuffle(!p.shuffle)}
                title={p.shuffle ? "Shuffle: ON" : "Shuffle: OFF"}
                aria-label="Shuffle"
                className={`retro-pushbutton relative rounded-xl p-2 transition-all cursor-pointer ${
                  p.shuffle
                    ? "text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "text-amber-400/50 hover:text-amber-200"
                }`}
              >
                <Shuffle className="size-3.5 sm:size-4" />
                {p.shuffle && (
                  <span className="absolute top-1 right-1 size-1 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
                )}
              </button>

              {/* Loop / Repeat Button (Off -> All -> One) with Vintage Lamp */}
              <button
                onClick={p.toggleRepeat}
                title={
                  p.repeatMode === "all"
                    ? "Loop Mode: REPEAT ALL"
                    : p.repeatMode === "one"
                      ? "Loop Mode: REPEAT CURRENT SONG"
                      : "Loop Mode: OFF"
                }
                aria-label="Repeat mode"
                className={`retro-pushbutton relative rounded-xl p-2 transition-all cursor-pointer ${
                  p.repeatMode !== "off"
                    ? "text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "text-amber-400/50 hover:text-amber-200"
                }`}
              >
                {p.repeatMode === "one" ? (
                  <Repeat1 className="size-3.5 sm:size-4 text-amber-300" />
                ) : (
                  <Repeat className="size-3.5 sm:size-4" />
                )}
                {p.repeatMode === "all" && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-400 shadow-[0_0_5px_#f59e0b]" />
                )}
                {p.repeatMode === "one" && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-400 shadow-[0_0_5px_#f87171]" />
                )}
              </button>

              {/* Prev Button */}
              <button
                onClick={p.prev}
                title="Previous Station"
                aria-label="Previous track"
                className="retro-pushbutton rounded-xl p-2 text-amber-200/80 hover:text-amber-100 transition-colors cursor-pointer"
              >
                <SkipBack className="size-3.5 sm:size-4" />
              </button>

              {/* Master Play/Pause Round Bakelite Pushbutton */}
              <button
                onClick={p.toggle}
                title={p.playing ? "Pause Receiver" : "Power / Play Receiver"}
                aria-label="Play or pause"
                className="retro-main-play flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full text-black transition-transform shadow-lg cursor-pointer"
              >
                {p.playing ? (
                  <Pause className="size-5 text-amber-950 fill-amber-950 stroke-[2.5]" />
                ) : (
                  <Play className="size-5 translate-x-0.5 text-amber-950 fill-amber-950 stroke-[2.5]" />
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={p.next}
                title="Next Station"
                aria-label="Next track"
                className="retro-pushbutton rounded-xl p-2 text-amber-200/80 hover:text-amber-100 transition-colors cursor-pointer"
              >
                <SkipForward className="size-3.5 sm:size-4" />
              </button>

              {/* 5. VINTAGE CIRCULAR ROTARY VOLUME KNOB DIAL */}
              <div className="relative flex flex-col items-center justify-center px-1">
                {/* Rotary Knob Face */}
                <div
                  ref={knobRef}
                  onMouseDown={handleKnobMouseDown}
                  onWheel={(e) => {
                    e.preventDefault();
                    p.setVolume(p.volume + (e.deltaY < 0 ? 5 : -5));
                  }}
                  title={`Master Volume Knob: ${p.muted ? "MUTED" : `${p.volume}%`} (Turn or Drag)`}
                  className="retro-knob relative size-10 sm:size-11 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
                >
                  {/* Fluted Rim Edge Markings */}
                  <div className="absolute inset-0 rounded-full border border-amber-600/40 pointer-events-none" />

                  {/* Rotating Dial Indicator Line */}
                  <div
                    className="absolute size-full rounded-full transition-transform duration-75 pointer-events-none"
                    style={{ transform: `rotate(${knobAngle}deg)` }}
                  >
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-amber-400 shadow-[0_0_6px_#f59e0b]" />
                  </div>

                  {/* Center Brass Cap / Mute Clicker */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      p.toggleMute();
                    }}
                    title={p.muted ? "Unmute" : "Mute (Click Center)"}
                    className="relative z-10 size-4 sm:size-4.5 rounded-full bg-gradient-to-b from-amber-500 to-amber-700 border border-amber-300 shadow-inner flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    {p.muted ? (
                      <VolumeX className="size-2 text-black" />
                    ) : (
                      <div className="size-1 rounded-full bg-black/80" />
                    )}
                  </button>
                </div>

                {/* Dial Markings below */}
                <div className="mt-0.5 flex justify-between w-full text-[0.52rem] font-mono-ui text-amber-500/70 px-0.5 font-bold">
                  <span>0</span>
                  <span>VOL</span>
                  <span>10</span>
                </div>
              </div>

              {/* 6. Vintage Tape Speed Selector (RPM / Rate Switch) */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setSpeedOpen((v) => !v)}
                  title="Radio Tape Speed Selector"
                  className="retro-pushbutton rounded-xl px-2 py-1.5 text-amber-200/80 hover:text-amber-100 font-mono-ui text-[0.65rem] font-bold cursor-pointer"
                >
                  {p.playbackRate}x
                </button>
                {speedOpen && (
                  <div className="absolute bottom-12 right-0 z-50 flex flex-col gap-1 rounded-xl border border-amber-700/60 bg-[#1e130b]/95 p-1.5 shadow-2xl backdrop-blur-xl min-w-[75px]">
                    {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          p.setPlaybackRate(rate);
                          setSpeedOpen(false);
                        }}
                        className={`px-2 py-1 rounded text-[0.7rem] font-mono-ui text-left transition-colors cursor-pointer ${
                          p.playbackRate === rate
                            ? "bg-amber-600 text-black font-bold"
                            : "text-amber-200 hover:bg-amber-900/40"
                        }`}
                      >
                        {rate}x Speed
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Radio Station Queue Toggle Button */}
              <button
                onClick={() => setQueueOpen((v) => !v)}
                title="Toggle Station Queue"
                aria-label="Toggle queue"
                className={`retro-pushbutton relative rounded-xl p-2 transition-all cursor-pointer ${
                  queueOpen
                    ? "text-amber-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
                    : "text-amber-400/60 hover:text-amber-100"
                }`}
              >
                <ListMusic className="size-3.5 sm:size-4" />
                {total > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-amber-500 font-mono-ui text-[0.55rem] font-bold text-black shadow">
                    {total}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
