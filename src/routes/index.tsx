import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpDown,
  ArrowUpRight,
  ArrowUpToLine,
  ChevronDown,
  ChevronUp,
  Disc3,
  FastForward,
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
  Rewind,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Trash2,
  Tv,
  Volume1,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

import logoArt from "@/assets/logo.png";
import rmduArt from "@/assets/rmdu.jpg";
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
          "RMDU Special: an authentic vintage worksite radio with analog rotary volume dials, radio frequency tuning scale, custom queue with drag & drop reordering, and dynamic song banner backgrounds.",
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
  const [isAdding, setIsAdding] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [repeatMenuOpen, setRepeatMenuOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [isKnobDragging, setIsKnobDragging] = useState(false);

  const barRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);
  const knobRef = useRef<HTMLDivElement | null>(null);

  const progress = p.duration ? (p.time / p.duration) * 100 : 0;
  const currentCover = p.current?.thumbnail || p.tracks[0]?.thumbnail;

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
    if (!newSongInput.trim() || isAdding) return;
    setAddError("");
    setIsAdding(true);
    try {
      const ok = await p.addTrack(newSongInput.trim());
      if (ok) {
        setNewSongInput("");
        setAddOpen(false);
      } else {
        setAddError("Invalid YouTube URL or Video ID. Please check and try again.");
      }
    } catch {
      setAddError("Failed to fetch song details. Please try again.");
    } finally {
      setIsAdding(false);
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
    <div className="relative h-screen w-full overflow-hidden bg-[#120a05] font-body select-none">
      {/* ========================================================================= */}
      {/* 🌟 BACKGROUND SYSTEM: FULLSCREEN RMDU.JPG WHEN IDLE vs DYNAMIC SONG BANNER WHEN PLAYING 🌟 */}
      {/* ========================================================================= */}

      {/* Layer 1: Standby / Idle Fullscreen Background with RMDU Artwork */}
      <div
        className={`absolute inset-0 size-full transition-all duration-1000 ${
          p.playing ? "opacity-20 scale-105 filter blur-md" : "opacity-100 scale-100"
        }`}
      >
        <img
          src={rmduArt}
          alt="RMDU Special Background"
          className="size-full object-cover object-center"
        />
      </div>

      {/* Layer 2: Dynamic Full-Screen Song Banner Ambient Backdrop (Active when Playing) */}
      {currentCover && (
        <div
          className={`absolute inset-0 size-full bg-cover bg-center transition-all duration-1000 transform scale-105 ${
            p.playing ? "opacity-70 filter blur-xl" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${currentCover})` }}
        />
      )}

      {/* Deep Vignette & Contrast Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0f1013]/70 via-[#0f1013]/35 to-[#0f1013]/85 pointer-events-none" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_240px_90px_#0f1013]" />

      {/* ========================================================================= */}
      {/* 📻 TOP HEADER BAR: STATION STATUS & EXTERNAL PLAYLIST LINKS 📻 */}
      {/* ========================================================================= */}
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

        {/* Current Song Marquee Badge */}
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

      {/* ========================================================================= */}
      {/* 📻 CENTER STAGE: STATION TITLE & QUICK STATS 📻 */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pb-28">
        <div className="relative group">
          {currentCover && (
            <div
              className="absolute -inset-8 rounded-full bg-cover bg-center filter blur-3xl opacity-35 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
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
            Station Queue ({total})
          </button>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 📺 CRT MONITOR VIDEO FEED FLOATING MODAL 📺 */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* 📜 PLAYLIST QUEUE DRAWER: REARRANGE, REMOVE, SHUFFLE & BANNER CARDS 📜 */}
      {/* ========================================================================= */}
      <section
        className={`absolute bottom-40 left-1/2 z-30 w-[min(94vw,46rem)] -translate-x-1/2 rounded-3xl border-2 border-amber-700/40 bg-[#1a1007]/95 shadow-[0_24px_60px_rgba(0,0,0,0.95)] backdrop-blur-2xl transition-all duration-300 flex flex-col ${
          queueOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : "pointer-events-none translate-y-6 opacity-0 scale-95"
        }`}
      >
        {/* Queue Header & Action Bar */}
        <div className="flex items-center justify-between border-b border-amber-800/40 px-5 py-3.5 bg-black/50 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <ListMusic className="size-4 text-amber-500" />
            <span className="font-mono-ui text-xs uppercase tracking-[0.18em] text-amber-100 font-bold">
              Radio Queue ({total})
            </span>
            {totalDuration > 0 && (
              <span className="hidden sm:inline font-mono-ui text-[0.7rem] text-amber-400/60">
                • {fmt(totalDuration)} Total
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Add Track Button */}
            <button
              onClick={() => setAddOpen((v) => !v)}
              title="Add YouTube song to queue"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono-ui font-semibold border border-amber-700/50 bg-amber-900/40 hover:bg-amber-900/70 transition-colors text-amber-100 cursor-pointer shadow-sm"
            >
              <Plus className="size-3.5 text-amber-400" />
              Add Track
            </button>

            {/* Shuffle Queue Order */}
            <button
              onClick={p.shuffleQueue}
              title="Randomize / Shuffle entire queue order"
              className="p-1.5 rounded-lg text-amber-300/70 hover:text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Shuffle className="size-3.5" />
            </button>

            {/* Reverse Queue Order */}
            <button
              onClick={p.reverseQueue}
              title="Reverse queue order"
              className="p-1.5 rounded-lg text-amber-300/70 hover:text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="size-3.5" />
            </button>

            {/* Reset to Original Playlist */}
            <button
              onClick={p.resetQueue}
              title="Reset queue to original playlist"
              className="p-1.5 rounded-lg text-amber-300/70 hover:text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>

            {/* Clear Entire Queue */}
            <button
              onClick={p.clearQueue}
              title="Clear all songs from queue"
              className="p-1.5 rounded-lg text-amber-300/70 hover:text-destructive hover:bg-destructive/15 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-amber-800/40 mx-0.5" />

            {/* Close Queue Drawer */}
            <button
              onClick={() => setQueueOpen(false)}
              aria-label="Close queue"
              className="p-1.5 rounded-lg text-amber-300/60 hover:text-amber-100 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Add Song Form Panel */}
        {addOpen && (
          <form
            onSubmit={handleAddSong}
            className="p-3 border-b border-amber-800/40 bg-black/40 flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste YouTube Link or Video ID (e.g. youtu.be/... or watch?v=...)"
                value={newSongInput}
                onChange={(e) => setNewSongInput(e.target.value)}
                className="flex-1 rounded-xl border border-amber-800/80 bg-black/60 px-3.5 py-1.5 text-xs text-amber-100 placeholder:text-amber-600/60 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-1.5 rounded-xl bg-amber-600 text-black font-mono-ui text-xs font-bold hover:bg-amber-500 disabled:opacity-50 transition-colors shrink-0 shadow cursor-pointer"
              >
                {isAdding ? "Adding…" : "Add to Queue"}
              </button>
            </div>
            {addError && <p className="text-[0.7rem] text-destructive px-1">{addError}</p>}
          </form>
        )}

        {/* Queue Items List with Dynamic Banner Artwork on Every Song Card */}
        <div className="max-h-[52vh] overflow-y-auto p-3 space-y-2.5">
          {p.tracks.length === 0 && (
            <div className="py-12 text-center text-amber-300/50">
              <Music className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Queue is currently empty</p>
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
                className={`group relative flex items-center gap-3 rounded-2xl p-2.5 transition-all duration-200 border overflow-hidden ${
                  active
                    ? "border-amber-500/90 bg-amber-500/20 shadow-[0_0_25px_rgba(245,158,11,0.25)] ring-1 ring-amber-400/40"
                    : "border-amber-900/40 hover:border-amber-700/70 bg-[#160c06]/80 hover:bg-[#22130a]"
                } ${draggedIndex === i ? "opacity-35 scale-[0.98]" : ""}`}
              >
                {/* 🌟 Dynamic Song Banner Background on Every Song Card 🌟 */}
                {t.thumbnail && (
                  <div
                    className={`absolute inset-0 bg-cover bg-center transition-all duration-300 pointer-events-none ${
                      active
                        ? "opacity-35 filter blur-[2px] scale-105"
                        : "opacity-15 filter blur-sm group-hover:opacity-25 group-hover:scale-102"
                    }`}
                    style={{ backgroundImage: `url(${t.thumbnail})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-[#120a05]/95 via-[#120a05]/80 to-[#120a05]/95 pointer-events-none" />

                {/* Drag Handle for Reordering */}
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

                {/* Track Title and Artist */}
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
                  <p className="truncate text-[0.72rem] text-amber-400/75 font-mono-ui">
                    {t.author}
                  </p>
                </button>

                {/* Duration */}
                <span className="relative z-10 shrink-0 font-mono-ui text-[0.72rem] text-amber-300/70 font-medium">
                  {t.duration ? fmt(t.duration) : "--:--"}
                </span>

                {/* Rearrange Up/Down/Top & Remove Controls */}
                <div className="relative z-10 flex items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => p.moveTrack(i, i - 1)}
                      title="Move up one position"
                      className="p-1 rounded text-amber-500/60 hover:text-amber-200 disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === p.tracks.length - 1}
                      onClick={() => p.moveTrack(i, i + 1)}
                      title="Move down one position"
                      className="p-1 rounded text-amber-500/60 hover:text-amber-200 disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  {/* Move to Top */}
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => p.moveTrackToTop(i)}
                      title="Move to top of queue"
                      className="hidden sm:inline-flex p-1.5 rounded-lg text-amber-500/50 hover:text-amber-200 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <ArrowUpToLine className="size-3.5" />
                    </button>
                  )}

                  {/* Remove Track from Queue */}
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
      {/* 📻 VINTAGE WORKSITE RADIO CONSOLE (BOTTOM RETRO DECK) 📻 */}
      {/* ========================================================================= */}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-2 sm:px-4">
        <div className="pointer-events-auto retro-radio-body relative flex w-full max-w-4xl flex-col rounded-2xl p-3 sm:p-3.5">
          {/* 4 Corner Machined Chassis Screws */}
          <span className="absolute top-2 left-2 size-2 rounded-full bg-zinc-600 border border-zinc-400/80 shadow-inner flex items-center justify-center pointer-events-none">
            <span className="w-1 h-[1px] bg-zinc-900" />
          </span>
          <span className="absolute top-2 right-2 size-2 rounded-full bg-zinc-600 border border-zinc-400/80 shadow-inner flex items-center justify-center pointer-events-none">
            <span className="w-1 h-[1px] bg-zinc-900" />
          </span>
          <span className="absolute bottom-2 left-2 size-2 rounded-full bg-zinc-600 border border-zinc-400/80 shadow-inner flex items-center justify-center pointer-events-none">
            <span className="w-1 h-[1px] bg-zinc-900" />
          </span>
          <span className="absolute bottom-2 right-2 size-2 rounded-full bg-zinc-600 border border-zinc-400/80 shadow-inner flex items-center justify-center pointer-events-none">
            <span className="w-1 h-[1px] bg-zinc-900" />
          </span>

          {/* Top Vintage Identification Header Strip */}
          <div className="mb-2 flex items-center justify-between px-2 text-[0.62rem] font-mono-ui uppercase tracking-widest text-zinc-400 border-b border-zinc-800 pb-1.5">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
              <span className="font-bold text-zinc-200 tracking-wider">
                ✦ SOLID-STATE FM-AM RECEIVER • RMDU-003 ✦
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-zinc-400 font-mono-ui font-semibold">
                STEREO HI-FI &bull; VALVE TONE
              </span>
              <span className="size-1.5 rounded-full bg-red-500 shadow-[0_0_4px_#ef4444]" />
            </div>
          </div>

          {/* Main Console Deck Layout */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* 1. Spinning Vinyl Record / Album Art Turntable */}
            <button
              onClick={() => setEmbedOpen((v) => !v)}
              title={embedOpen ? "Close CRT video monitor" : "Open CRT video monitor"}
              className="group relative size-12 sm:size-14 shrink-0 rounded-full bg-zinc-950 p-0.5 border border-zinc-700 hover:border-zinc-400 transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
            >
              {/* Vinyl Grooves Background */}
              <div
                className={`relative size-full rounded-full overflow-hidden border border-zinc-800 shadow-inner ${
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
                  <div className="size-full bg-zinc-900 flex items-center justify-center">
                    <Disc3 className="size-6 text-zinc-400" />
                  </div>
                )}
                {/* Center Machined Spindle */}
                <div className="absolute inset-0 m-auto size-3 rounded-full bg-zinc-400 border border-zinc-600 shadow-sm flex items-center justify-center">
                  <div className="size-1 rounded-full bg-zinc-950" />
                </div>
              </div>

              {/* Hover CRT Expand Icon */}
              <span className="absolute inset-0 rounded-full bg-black/70 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-zinc-200">
                {embedOpen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
              </span>
            </button>

            {/* 2. Track Title & Artist Marquee */}
            <div className="min-w-0 max-w-[100px] sm:max-w-[150px] md:max-w-[180px]">
              <p className="truncate text-xs sm:text-sm font-bold text-zinc-100 tracking-tight">
                {p.current?.title ?? (p.ready ? "Station Ready" : "Tuning Station…")}
              </p>
              <p className="truncate text-[0.68rem] text-zinc-400 font-mono-ui font-medium">
                {p.current?.author ?? "RMDU Radio"}
              </p>
            </div>

            {/* 3. Backlit Radio Frequency Dial Scale (Track Seeker) */}
            <div className="hidden min-w-0 flex-1 flex-col gap-0.5 md:flex">
              <div className="flex items-center gap-1.5">
                {/* Quick Skip Backward 10s */}
                <button
                  onClick={() => p.skipBackward(10)}
                  title="Rewind 10 seconds"
                  className="retro-pushbutton p-1 rounded-md text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <Rewind className="size-3.5" />
                </button>

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
                  className="group relative h-10 flex-1 cursor-pointer rounded-lg retro-tuner-glass p-1 overflow-hidden select-none"
                >
                  {/* Top FM Printed Radio Frequency Scale */}
                  <div className="absolute inset-x-2.5 top-0.5 flex justify-between text-[0.52rem] font-mono-ui font-bold text-zinc-300 pointer-events-none tracking-wider">
                    <span>FM 88</span>
                    <span>92</span>
                    <span>96</span>
                    <span>100</span>
                    <span>104</span>
                    <span>108 MHz</span>
                  </div>

                  {/* Analog Frequency Scale Ruler with Vertical Precision Ticks */}
                  <div className="absolute inset-x-2.5 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
                    <div className="w-full flex items-center justify-between h-3 border-y border-zinc-800 px-0.5">
                      {Array.from({ length: 41 }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`${
                            idx % 5 === 0
                              ? "h-2.5 w-[1.5px] bg-zinc-300"
                              : idx % 2 === 0
                                ? "h-1.5 w-[1px] bg-zinc-500"
                                : "h-1 w-[1px] bg-zinc-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Bottom AM Printed Radio Frequency Scale */}
                  <div className="absolute inset-x-2.5 bottom-0.5 flex justify-between text-[0.50rem] font-mono-ui text-zinc-400 pointer-events-none tracking-wider">
                    <span>AM 530</span>
                    <span>700</span>
                    <span>1000</span>
                    <span>1300</span>
                    <span>1600 kHz</span>
                  </div>

                  {/* Clean subtle track fill */}
                  <div
                    className="absolute inset-y-1 left-1 rounded bg-white/[0.04] transition-all duration-100 pointer-events-none"
                    style={{ width: `${progress}%` }}
                  />

                  {/* Vintage Red Analog Tuning Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-[#ff3333] shadow-[0_0_8px_rgba(255,50,50,0.85)] transition-all duration-100 pointer-events-none z-10"
                    style={{ left: `${progress}%` }}
                  >
                    <div className="absolute top-0 -left-[2px] w-1.5 h-1 bg-[#ff3333] border border-white/60 shadow-sm" />
                    <div className="absolute bottom-0 -left-[2px] w-1.5 h-1 bg-[#ff3333] border border-white/60 shadow-sm" />
                  </div>

                  {/* Hover Time Tooltip */}
                  {hoverTime !== null && (
                    <div
                      className="absolute -top-7 -translate-x-1/2 rounded bg-zinc-900 border border-zinc-700 px-1.5 py-0.5 font-mono-ui text-[0.62rem] text-zinc-100 pointer-events-none shadow-lg z-20"
                      style={{
                        left: `${(hoverTime / (p.duration || 1)) * 100}%`,
                      }}
                    >
                      📻 {fmt(hoverTime)}
                    </div>
                  )}
                </div>

                {/* Quick Skip Forward 10s */}
                <button
                  onClick={() => p.skipForward(10)}
                  title="Forward 10 seconds"
                  className="retro-pushbutton p-1 rounded-md text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <FastForward className="size-3.5" />
                </button>
              </div>

              {/* Monospace Counters & Signal Indicator */}
              <div className="flex items-center justify-between font-mono-ui text-[0.65rem] text-zinc-400 px-1">
                <span className="text-zinc-300">{fmt(p.time)}</span>
                <div className="flex items-center gap-1.5 text-[0.58rem] tracking-wider text-zinc-400">
                  <Activity
                    className={`size-3 ${
                      p.playing ? "animate-pulse text-emerald-400" : "text-zinc-600"
                    }`}
                  />
                  <span>
                    {p.playing
                      ? `SIGNAL LOCKED • ${p.repeatMode === "one" ? "LOOP ONE" : p.repeatMode === "all" ? "LOOP ALL" : "FM STEREO"}`
                      : "TUNER PAUSED"}
                  </span>
                </div>
                <span className="text-zinc-300">{fmt(p.duration)}</span>
              </div>
            </div>

            {/* 4. Controls Cluster: Vintage Mechanical Pushbuttons, Loop Controls & Rotary Volume Knob */}
            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              {/* Shuffle Toggle Button with Jeweled Indicator Lamp */}
              <button
                onClick={() => p.setShuffle(!p.shuffle)}
                title={p.shuffle ? "Shuffle: ON (Randomizing tracks)" : "Shuffle: OFF"}
                aria-label="Shuffle"
                className={`retro-pushbutton relative rounded-lg p-2 transition-all cursor-pointer ${
                  p.shuffle
                    ? "text-zinc-100 border-zinc-500 bg-zinc-800"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <Shuffle className="size-3.5 sm:size-4" />
                {p.shuffle && (
                  <span className="absolute top-1 right-1 size-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
                )}
              </button>

              {/* Loop / Repeat Options Button (Off -> All -> One) with Vintage Lamp */}
              <div className="relative">
                <button
                  onClick={p.toggleRepeat}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setRepeatMenuOpen((v) => !v);
                  }}
                  title={
                    p.repeatMode === "all"
                      ? "Loop Mode: REPEAT ALL (Click to loop current song)"
                      : p.repeatMode === "one"
                        ? "Loop Mode: REPEAT CURRENT SONG (Click to turn off)"
                        : "Loop Mode: OFF (Click to loop all)"
                  }
                  aria-label="Repeat mode"
                  className={`retro-pushbutton relative rounded-lg p-2 transition-all cursor-pointer ${
                    p.repeatMode !== "off"
                      ? "text-zinc-100 border-zinc-500 bg-zinc-800"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {p.repeatMode === "one" ? (
                    <Repeat1 className="size-3.5 sm:size-4 text-zinc-100" />
                  ) : (
                    <Repeat className="size-3.5 sm:size-4" />
                  )}
                  {p.repeatMode === "all" && (
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#f59e0b]" />
                  )}
                  {p.repeatMode === "one" && (
                    <span className="absolute top-1 right-1 size-1.5 rounded-full bg-red-400 shadow-[0_0_4px_#f87171]" />
                  )}
                </button>

                {/* Repeat Mode Quick Selection Menu */}
                {repeatMenuOpen && (
                  <div className="absolute bottom-12 left-0 z-50 flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl backdrop-blur-xl min-w-[120px]">
                    <button
                      onClick={() => {
                        p.setRepeatMode("all");
                        setRepeatMenuOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-[0.7rem] font-mono-ui text-left transition-colors cursor-pointer flex items-center justify-between ${
                        p.repeatMode === "all"
                          ? "bg-zinc-700 text-white font-bold"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span>Repeat All</span>
                      <Repeat className="size-3" />
                    </button>
                    <button
                      onClick={() => {
                        p.setRepeatMode("one");
                        setRepeatMenuOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-[0.7rem] font-mono-ui text-left transition-colors cursor-pointer flex items-center justify-between ${
                        p.repeatMode === "one"
                          ? "bg-zinc-700 text-white font-bold"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span>Repeat One</span>
                      <Repeat1 className="size-3" />
                    </button>
                    <button
                      onClick={() => {
                        p.setRepeatMode("off");
                        setRepeatMenuOpen(false);
                      }}
                      className={`px-2.5 py-1 rounded text-[0.7rem] font-mono-ui text-left transition-colors cursor-pointer flex items-center justify-between ${
                        p.repeatMode === "off"
                          ? "bg-zinc-700 text-white font-bold"
                          : "text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <span>Repeat Off</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Prev Button */}
              <button
                onClick={p.prev}
                title="Previous Station"
                aria-label="Previous track"
                className="retro-pushbutton rounded-lg p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <SkipBack className="size-3.5 sm:size-4" />
              </button>

              {/* Master Play/Pause Round Machined Pushbutton */}
              <button
                onClick={p.toggle}
                title={p.playing ? "Pause Receiver" : "Power / Play Receiver"}
                aria-label="Play or pause"
                className="retro-main-play flex size-11 sm:size-12 shrink-0 items-center justify-center rounded-full text-zinc-950 transition-all shadow-md cursor-pointer"
              >
                {p.playing ? (
                  <Pause className="size-5 text-zinc-950 fill-zinc-950 stroke-[2.5]" />
                ) : (
                  <Play className="size-5 translate-x-0.5 text-zinc-950 fill-zinc-950 stroke-[2.5]" />
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={p.next}
                title="Next Station"
                aria-label="Next track"
                className="retro-pushbutton rounded-lg p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <SkipForward className="size-3.5 sm:size-4" />
              </button>

              {/* 5. VINTAGE MACHINED ROTARY VOLUME KNOB */}
              <div className="relative flex flex-col items-center justify-center px-1">
                {/* Rotary Knob Face */}
                <div
                  ref={knobRef}
                  onMouseDown={handleKnobMouseDown}
                  onWheel={(e) => {
                    e.preventDefault();
                    p.setVolume(p.volume + (e.deltaY < 0 ? 5 : -5));
                  }}
                  title={`Master Volume: ${p.muted ? "MUTED" : `${p.volume}%`} (Turn or Drag)`}
                  className="retro-knob relative size-10 sm:size-11 rounded-full cursor-grab active:cursor-grabbing flex items-center justify-center select-none"
                >
                  {/* Fluted Rim Edge Markings */}
                  <div className="absolute inset-0 rounded-full border border-zinc-500/50 pointer-events-none" />

                  {/* Rotating Dial Indicator Line */}
                  <div
                    className="absolute size-full rounded-full transition-transform duration-75 pointer-events-none"
                    style={{ transform: `rotate(${knobAngle}deg)` }}
                  >
                    <div className="absolute top-0.5 left-1/2 -translate-x-1/2 w-1 h-3 rounded-full bg-zinc-200 shadow-sm" />
                  </div>

                  {/* Center Metal Cap / Mute Clicker */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      p.toggleMute();
                    }}
                    title={p.muted ? "Unmute" : "Mute (Click Center)"}
                    className="relative z-10 size-4 sm:size-4.5 rounded-full bg-zinc-500 hover:bg-zinc-400 border border-zinc-300 shadow-inner flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                  >
                    {p.muted ? (
                      <VolumeX className="size-2 text-zinc-950" />
                    ) : (
                      <div className="size-1 rounded-full bg-zinc-900" />
                    )}
                  </button>
                </div>

                {/* Dial Markings below */}
                <div className="mt-0.5 flex justify-between w-full text-[0.50rem] font-mono-ui text-zinc-400 px-0.5 font-bold">
                  <span>0</span>
                  <span>VOL</span>
                  <span>10</span>
                </div>
              </div>

              {/* 6. Tape Speed Selector (RPM / Playback Rate Switch) */}
              <div className="relative hidden lg:block">
                <button
                  onClick={() => setSpeedOpen((v) => !v)}
                  title="Radio Tape Speed Selector"
                  className="retro-pushbutton rounded-lg px-2 py-1.5 text-zinc-300 hover:text-white font-mono-ui text-[0.65rem] font-bold cursor-pointer"
                >
                  {p.playbackRate}x
                </button>
                {speedOpen && (
                  <div className="absolute bottom-12 right-0 z-50 flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-900 p-1.5 shadow-2xl backdrop-blur-xl min-w-[75px]">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => {
                          p.setPlaybackRate(rate);
                          setSpeedOpen(false);
                        }}
                        className={`px-2 py-1 rounded text-[0.7rem] font-mono-ui text-left transition-colors cursor-pointer ${
                          p.playbackRate === rate
                            ? "bg-zinc-700 text-white font-bold"
                            : "text-zinc-300 hover:bg-zinc-800"
                        }`}
                      >
                        {rate}x Speed
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 7. Radio Station Queue Toggle Button with Total Count Badge */}
              <button
                onClick={() => setQueueOpen((v) => !v)}
                title="Toggle Station Queue & Song Banners"
                aria-label="Toggle queue"
                className={`retro-pushbutton relative rounded-lg p-2 transition-all cursor-pointer ${
                  queueOpen
                    ? "text-zinc-100 border-zinc-500 bg-zinc-800"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ListMusic className="size-3.5 sm:size-4" />
                {total > 0 && (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-zinc-100 font-mono-ui text-[0.55rem] font-bold text-zinc-950 shadow">
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
