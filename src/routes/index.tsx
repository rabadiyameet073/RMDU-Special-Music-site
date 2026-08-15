import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  GripVertical,
  ListMusic,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  RotateCcw,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Trash2,
  Volume1,
  Volume2,
  VolumeX,
  X,
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
      { title: "RMDU Special — One Screen Radio" },
      {
        name: "description",
        content:
          "RMDU Special: a single-screen radio with custom song queue, dynamic song banner backgrounds, loop modes, and YouTube streaming.",
      },
      { property: "og:title", content: "RMDU Special — One Screen Radio" },
      {
        property: "og:description",
        content:
          "One screen, customized playlist queue, dynamic song banner artwork, and loop playback.",
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
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const barRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background font-body select-none">
      {/* Background Layer: Default Art */}
      <img
        src={bgArt}
        alt="Illustration backdrop"
        width={1920}
        height={1088}
        className="absolute inset-0 size-full object-cover transition-opacity duration-1000"
      />

      {/* Dynamic Song Banner Ambient Background */}
      {currentCover && (
        <div
          className="absolute inset-0 size-full bg-cover bg-center transition-all duration-1000 transform scale-105 filter blur-3xl opacity-60 animate-ambient-glow"
          style={{ backgroundImage: `url(${currentCover})` }}
        />
      )}

      {/* Deep Vignette & Darkening Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/40 to-background/95 backdrop-blur-[2px]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_260px_90px_var(--background)]" />

      {/* Top Header */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 text-xs text-foreground/80">
        <div className="flex items-center gap-3">
          <span className="font-mono-ui tabular-nums font-semibold tracking-wider text-accent">
            {clock}
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-2">
            <span
              className={`size-2 rounded-full ${
                p.playing
                  ? "animate-pulse bg-primary shadow-[0_0_8px_var(--color-primary)]"
                  : "bg-muted-foreground"
              }`}
            />
            <span className="font-mono-ui uppercase tracking-widest text-[0.65rem] text-foreground/75">
              {p.playing ? "ON AIR" : "STANDBY"}
            </span>
          </span>
        </div>

        {/* Current song quick marquee if playing */}
        {p.current && (
          <div className="hidden md:flex items-center gap-2 max-w-sm px-3 py-1 rounded-full border border-border/40 bg-black/20 backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-primary animate-ping" />
            <span className="truncate text-xs text-foreground/90 font-medium">
              {p.current.title}
            </span>
            <span className="text-muted-foreground text-[0.65rem]">•</span>
            <span className="truncate text-[0.65rem] text-muted-foreground">
              {p.current.author}
            </span>
          </div>
        )}

        <nav className="flex items-center gap-4">
          <a
            href={YTM_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground font-mono-ui text-[0.7rem]"
          >
            YouTube Music
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
          <a
            href={YT_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground font-mono-ui text-[0.7rem]"
          >
            YouTube
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
        </nav>
      </header>

      {/* Main Hero Center Stage */}
      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pb-20">
        <div className="relative group">
          {currentCover && (
            <div
              className="absolute -inset-8 rounded-full bg-cover bg-center filter blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-700 pointer-events-none"
              style={{ backgroundImage: `url(${currentCover})` }}
            />
          )}
          <p className="font-mono-ui text-[0.75rem] uppercase tracking-[0.45em] text-accent mb-2 drop-shadow-sm">
            WORKSITE RADIO &bull; RMDU
          </p>
          <h1 className="font-display text-[4.5rem] leading-[0.85] tracking-tight text-foreground drop-shadow-[0_8px_32px_oklch(0.1_0.02_60/0.8)] sm:text-[7.5rem] lg:text-[10rem]">
            RMDU SPECIAL
          </h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-foreground/80 font-mono-ui">
          <span className="px-2.5 py-1 rounded-md border border-border/50 bg-secondary/40 backdrop-blur-md">
            {total} Tracks In Queue
          </span>
          {totalDuration > 0 && (
            <span className="px-2.5 py-1 rounded-md border border-border/50 bg-secondary/40 backdrop-blur-md">
              {fmt(totalDuration)} Total Time
            </span>
          )}
          <button
            onClick={() => setQueueOpen(true)}
            className="px-3 py-1 rounded-md bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary-foreground font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <ListMusic className="size-3.5" />
            Manage Queue
          </button>
        </div>
      </main>

      {/* Video Player Floating Modal */}
      <section
        className={`absolute bottom-32 left-1/2 z-40 w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-float)] backdrop-blur-2xl transition-all duration-300 ${
          embedOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : "pointer-events-none translate-y-6 opacity-0 scale-95"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5 bg-black/20 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" />
            <span className="font-mono-ui text-[0.68rem] uppercase tracking-[0.2em] text-foreground/90 font-medium">
              YouTube Video Stream
            </span>
          </div>
          <button
            onClick={() => setEmbedOpen(false)}
            aria-label="Close video player"
            className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div
          id="yt-player-host-wrapper"
          className="aspect-video w-full overflow-hidden rounded-b-2xl bg-black"
        >
          <div id="yt-player-host" className="size-full" />
        </div>
      </section>

      {/* Playlist Queue Drawer */}
      <section
        className={`absolute bottom-32 left-1/2 z-30 w-[min(94vw,42rem)] -translate-x-1/2 rounded-3xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-float)] backdrop-blur-2xl transition-all duration-300 flex flex-col ${
          queueOpen
            ? "pointer-events-auto translate-y-0 opacity-100 scale-100"
            : "pointer-events-none translate-y-6 opacity-0 scale-95"
        }`}
      >
        {/* Queue Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5 bg-black/20 rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <ListMusic className="size-4 text-accent" />
            <span className="font-mono-ui text-xs uppercase tracking-[0.18em] text-foreground font-semibold">
              Playing Queue ({total})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAddOpen((v) => !v)}
              title="Add song to queue"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono-ui font-medium border border-border/60 bg-secondary/50 hover:bg-secondary transition-colors text-foreground"
            >
              <Plus className="size-3.5" />
              Add Song
            </button>
            <button
              onClick={p.resetQueue}
              title="Reset queue to original playlist"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              onClick={p.clearQueue}
              title="Clear entire queue"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="size-3.5" />
            </button>
            <span className="h-4 w-px bg-border/60 mx-0.5" />
            <button
              onClick={() => setQueueOpen(false)}
              aria-label="Close queue"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Add Song Form Popdown */}
        {addOpen && (
          <form
            onSubmit={handleAddSong}
            className="p-3 border-b border-border/50 bg-black/30 flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste YouTube Video URL or ID (e.g. youtu.be/...)"
                value={newSongInput}
                onChange={(e) => setNewSongInput(e.target.value)}
                className="flex-1 rounded-xl border border-border/80 bg-background/80 px-3.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-mono-ui text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0"
              >
                Add
              </button>
            </div>
            {addError && <p className="text-[0.7rem] text-destructive px-1">{addError}</p>}
          </form>
        )}

        {/* Queue Items List */}
        <div className="max-h-[50vh] overflow-y-auto p-3 space-y-2">
          {p.tracks.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Music className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Queue is empty</p>
              <button
                onClick={p.resetQueue}
                className="mt-3 text-xs text-primary underline underline-offset-4 hover:opacity-80"
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
                className={`group relative flex items-center gap-3 rounded-2xl p-2 transition-all duration-200 border overflow-hidden ${
                  active
                    ? "border-primary/80 bg-primary/20 shadow-[0_4px_20px_var(--color-primary)]"
                    : "border-border/40 hover:border-border/80 bg-secondary/30 hover:bg-secondary/60"
                } ${draggedIndex === i ? "opacity-40 scale-[0.98]" : ""}`}
              >
                {/* Song Banner Background Inside Card */}
                {t.thumbnail && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-15 filter blur-sm pointer-events-none group-hover:opacity-25 transition-opacity"
                    style={{ backgroundImage: `url(${t.thumbnail})` }}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/90 pointer-events-none" />

                {/* Drag Handle */}
                <div
                  className="relative z-10 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-foreground/90 transition-colors p-1"
                  title="Drag to rearrange"
                >
                  <GripVertical className="size-3.5" />
                </div>

                {/* Song Banner Thumbnail */}
                <button
                  type="button"
                  onClick={() => p.playAt(i)}
                  className="relative z-10 size-12 shrink-0 rounded-xl overflow-hidden bg-black/40 border border-border/60 group-hover:ring-1 group-hover:ring-primary/60 transition-all text-left"
                >
                  <img
                    src={t.thumbnail}
                    alt=""
                    className="size-full object-cover group-hover:scale-105 transition-transform"
                  />
                  {active && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-0.5">
                      <span className="w-1 bg-primary rounded-full animate-eq-1" />
                      <span className="w-1 bg-accent rounded-full animate-eq-2" />
                      <span className="w-1 bg-primary rounded-full animate-eq-3" />
                    </div>
                  )}
                </button>

                {/* Track Info */}
                <button
                  type="button"
                  onClick={() => p.playAt(i)}
                  className="relative z-10 min-w-0 flex-1 text-left"
                >
                  <p
                    className={`truncate text-xs sm:text-sm font-medium ${
                      active ? "text-primary-foreground font-bold" : "text-foreground"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="truncate text-[0.7rem] text-muted-foreground">
                    {t.author}
                  </p>
                </button>

                {/* Duration */}
                <span className="relative z-10 shrink-0 font-mono-ui text-[0.7rem] text-muted-foreground">
                  {t.duration ? fmt(t.duration) : "--:--"}
                </span>

                {/* Quick Reorder Up/Down buttons & Remove */}
                <div className="relative z-10 flex items-center gap-1">
                  <div className="flex flex-col">
                    <button
                      type="button"
                      disabled={i === 0}
                      onClick={() => p.moveTrack(i, i - 1)}
                      title="Move up"
                      className="p-1 rounded text-muted-foreground/60 hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === p.tracks.length - 1}
                      onClick={() => p.moveTrack(i, i + 1)}
                      title="Move down"
                      className="p-1 rounded text-muted-foreground/60 hover:text-foreground disabled:opacity-20 transition-colors"
                    >
                      <ChevronDown className="size-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => p.removeTrack(i)}
                    title="Remove from queue"
                    className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/15 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Floating Bottom Music Bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-4xl items-center gap-3 sm:gap-4 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2.5 pl-3 pr-4 shadow-[var(--shadow-float)] backdrop-blur-2xl">
          {/* Cover & Video Embed Button */}
          <button
            onClick={() => setEmbedOpen((v) => !v)}
            title={embedOpen ? "Hide video" : "Show video"}
            className="group relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-full bg-secondary ring-2 ring-primary/40 hover:ring-primary transition-all cursor-pointer shadow-md"
          >
            {currentCover ? (
              <img
                src={currentCover}
                alt=""
                className="size-full object-cover group-hover:scale-110 transition-transform"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-muted-foreground">
                <Music className="size-5" />
              </span>
            )}
            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
              {embedOpen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </span>
          </button>

          {/* Title and Author */}
          <div className="min-w-0 flex-1 max-w-[140px] sm:max-w-[200px] md:max-w-xs">
            <p className="truncate text-xs sm:text-sm font-bold text-foreground">
              {p.current?.title ?? (p.ready ? "Ready to play" : "Loading playlist…")}
            </p>
            <p className="truncate text-[0.7rem] text-muted-foreground">
              {p.current?.author ?? "RMDU Special"}
            </p>
          </div>

          {/* Scrubber and Timing */}
          <div className="hidden min-w-0 flex-1 flex-col gap-1 sm:flex">
            <div
              ref={barRef}
              role="slider"
              tabIndex={0}
              aria-label="Seek"
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
              className="group relative h-2 w-full cursor-pointer rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
            >
              <div
                className="relative h-full rounded-full bg-[image:var(--gradient-warm)] transition-all duration-100"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute -right-1.5 top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-accent ring-2 ring-primary/80 opacity-0 transition-opacity group-hover:opacity-100 shadow-md" />
              </div>
              {hoverTime !== null && (
                <div
                  className="absolute -top-7 -translate-x-1/2 rounded bg-black/90 px-1.5 py-0.5 font-mono-ui text-[0.65rem] text-white pointer-events-none shadow"
                  style={{
                    left: `${(hoverTime / (p.duration || 1)) * 100}%`,
                  }}
                >
                  {fmt(hoverTime)}
                </div>
              )}
            </div>
            <div className="flex justify-between font-mono-ui text-[0.68rem] text-muted-foreground px-0.5">
              <span>{fmt(p.time)}</span>
              <span>{fmt(p.duration)}</span>
            </div>
          </div>

          {/* Controls Cluster */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            {/* Shuffle Button */}
            <button
              onClick={() => p.setShuffle(!p.shuffle)}
              title={p.shuffle ? "Shuffle: On" : "Shuffle: Off"}
              aria-label="Shuffle"
              className={`rounded-full p-2 transition-all ${
                p.shuffle
                  ? "text-primary bg-primary/20 ring-1 ring-primary/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              <Shuffle className="size-4" />
            </button>

            {/* Loop / Repeat Button with all 3 states (Off -> All -> One) */}
            <button
              onClick={p.toggleRepeat}
              title={
                p.repeatMode === "all"
                  ? "Loop Mode: Repeat All"
                  : p.repeatMode === "one"
                    ? "Loop Mode: Repeat Current Song"
                    : "Loop Mode: Off"
              }
              aria-label="Repeat mode"
              className={`rounded-full p-2 transition-all relative ${
                p.repeatMode === "all"
                  ? "text-primary bg-primary/20 ring-1 ring-primary/60"
                  : p.repeatMode === "one"
                    ? "text-accent bg-accent/20 ring-1 ring-accent/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              {p.repeatMode === "one" ? (
                <Repeat1 className="size-4" />
              ) : (
                <Repeat className="size-4" />
              )}
            </button>

            {/* Previous */}
            <button
              onClick={p.prev}
              title="Previous"
              aria-label="Previous track"
              className="rounded-full p-2 text-foreground/80 transition-colors hover:text-foreground hover:bg-white/10"
            >
              <SkipBack className="size-4" />
            </button>

            {/* Play/Pause Main Button */}
            <button
              onClick={p.toggle}
              title={p.playing ? "Pause" : "Play"}
              aria-label="Play or pause"
              className="flex size-11 sm:size-12 items-center justify-center rounded-full bg-[image:var(--gradient-warm)] text-primary-foreground transition-transform hover:scale-105 active:scale-95 shadow-[0_0_20px_var(--color-primary)]"
            >
              {p.playing ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 translate-x-0.5" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={p.next}
              title="Next"
              aria-label="Next track"
              className="rounded-full p-2 text-foreground/80 transition-colors hover:text-foreground hover:bg-white/10"
            >
              <SkipForward className="size-4" />
            </button>

            {/* Volume Popover Button */}
            <div className="relative">
              <button
                onClick={() => setVolumeOpen((v) => !v)}
                title={`Volume: ${p.muted ? "Muted" : `${p.volume}%`}`}
                aria-label="Volume"
                className={`rounded-full p-2 transition-colors ${
                  p.muted
                    ? "text-destructive hover:bg-destructive/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/10"
                }`}
              >
                {p.muted || p.volume === 0 ? (
                  <VolumeX className="size-4" />
                ) : p.volume < 50 ? (
                  <Volume1 className="size-4" />
                ) : (
                  <Volume2 className="size-4" />
                )}
              </button>

              {volumeOpen && (
                <div className="absolute bottom-12 right-0 z-50 flex items-center gap-2.5 rounded-2xl border border-border bg-popover/95 p-3 shadow-xl backdrop-blur-xl min-w-[140px]">
                  <button
                    onClick={p.toggleMute}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {p.muted ? <VolumeX className="size-3.5" /> : <Volume2 className="size-3.5" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.muted ? 0 : p.volume}
                    onChange={(e) => p.setVolume(Number(e.target.value))}
                    className="h-1.5 w-24 cursor-pointer accent-primary"
                  />
                  <span className="font-mono-ui text-[0.65rem] text-muted-foreground w-6 text-right">
                    {p.muted ? "0%" : `${p.volume}%`}
                  </span>
                </div>
              )}
            </div>

            {/* Playback Speed Popover */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setSpeedOpen((v) => !v)}
                title="Playback Speed"
                className="rounded-full p-2 text-muted-foreground hover:text-foreground hover:bg-white/10 font-mono-ui text-[0.7rem]"
              >
                {p.playbackRate}x
              </button>
              {speedOpen && (
                <div className="absolute bottom-12 right-0 z-50 flex flex-col gap-1 rounded-xl border border-border bg-popover/95 p-1.5 shadow-xl backdrop-blur-xl min-w-[70px]">
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        p.setPlaybackRate(rate);
                        setSpeedOpen(false);
                      }}
                      className={`px-2 py-1 rounded text-xs font-mono-ui text-left transition-colors ${
                        p.playbackRate === rate
                          ? "bg-primary text-primary-foreground font-bold"
                          : "text-foreground hover:bg-secondary"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Queue Toggle Button with Badge */}
            <button
              onClick={() => setQueueOpen((v) => !v)}
              title="Toggle Queue"
              aria-label="Toggle queue"
              className={`relative rounded-full p-2 transition-all ${
                queueOpen
                  ? "text-primary bg-primary/20 ring-1 ring-primary/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/10"
              }`}
            >
              <ListMusic className="size-4" />
              {total > 0 && (
                <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary font-mono-ui text-[0.55rem] font-bold text-primary-foreground shadow">
                  {total}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
