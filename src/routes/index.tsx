import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  ListMusic,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import bgArt from "@/assets/rmdu-bg.jpg";
import { fmt, PLAYLIST_ID, useYouTubePlaylist } from "@/hooks/useYouTubePlaylist";

const YT_PLAYLIST = `https://www.youtube.com/playlist?list=${PLAYLIST_ID}`;
const YTM_PLAYLIST = `https://music.youtube.com/playlist?list=${PLAYLIST_ID}`;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RMDU Special — One Screen Radio" },
      {
        name: "description",
        content:
          "RMDU Special: a single-screen radio with a floating player, full playlist queue and quick links to YouTube and YouTube Music.",
      },
      { property: "og:title", content: "RMDU Special — One Screen Radio" },
      {
        property: "og:description",
        content:
          "One screen, one playlist, one floating player. Stream the RMDU Special set straight from YouTube.",
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
  const barRef = useRef<HTMLDivElement | null>(null);

  const progress = p.duration ? (p.time / p.duration) * 100 : 0;
  const cover = p.current?.thumbnail;

  const activeRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    if (queueOpen) activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [queueOpen, p.index]);

  const total = useMemo(() => p.tracks.length, [p.tracks.length]);

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background font-body">
      <img
        src={bgArt}
        alt="Illustration of a mason laying bricks on a village street at golden hour"
        width={1920}
        height={1088}
        className="absolute inset-0 size-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/75 via-background/25 to-background/95" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_240px_80px_var(--background)]" />

      {/* Top bar */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 text-xs text-foreground/80">
        <span className="font-mono-ui tabular-nums">{clock}</span>
        <span className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${p.playing ? "animate-pulse bg-primary" : "bg-muted-foreground"}`}
          />
          <span className="text-foreground/70">{p.playing ? "on air" : "standby"}</span>
        </span>
        <nav className="flex items-center gap-4">
          <a
            href={YTM_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            YouTube Music
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
          <a
            href={YT_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
          >
            YouTube
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <p className="font-mono-ui text-[0.7rem] uppercase tracking-[0.4em] text-accent">
          worksite radio
        </p>
        <h1 className="mt-3 font-display text-[4.5rem] leading-[0.85] tracking-tight text-foreground drop-shadow-[0_6px_24px_oklch(0.1_0.02_60/0.7)] sm:text-[8rem] lg:text-[11rem]">
          RMDU SPECIAL
        </h1>
        <p className="mt-5 max-w-md text-sm text-foreground/75">
          {total ? `${total} tracks` : "Tracks"} straight from YouTube. Skip through the set
          below or open the playlist in your app.
        </p>
      </main>

      {/* Embedded YouTube drawer */}
      <section
        className={`absolute bottom-32 left-1/2 z-40 w-[min(92vw,32rem)] -translate-x-1/2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-float)] backdrop-blur-xl transition-all duration-300 ${
          embedOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-mono-ui text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            Video Player
          </span>
          <button
            onClick={() => setEmbedOpen(false)}
            aria-label="Close video player"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div id="yt-player-host-wrapper" className="aspect-video w-full overflow-hidden rounded-b-2xl">
          <div id="yt-player-host" className="size-full" />
        </div>
      </section>

      {/* Queue drawer */}
      <section
        className={`absolute bottom-32 left-1/2 z-30 w-[min(92vw,38rem)] -translate-x-1/2 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-bg)] shadow-[var(--shadow-float)] backdrop-blur-xl transition-all duration-300 ${
          queueOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-mono-ui text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            Playlist Queue ({total})
          </span>
          <button
            onClick={() => setQueueOpen(false)}
            aria-label="Close queue"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="max-h-[46vh] overflow-y-auto p-2">
          {p.tracks.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Loading playlist…
            </p>
          )}
          {p.tracks.map((t, i) => {
            const active = i === p.index;
            return (
              <button
                key={t.videoId + i}
                ref={active ? activeRef : null}
                onClick={() => p.playAt(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                  active
                    ? "border-l-2 border-primary bg-primary/25"
                    : "border-l-2 border-transparent hover:bg-secondary/60"
                }`}
              >
                <span
                  className={`w-5 shrink-0 text-right font-mono-ui text-xs ${active ? "text-primary-foreground" : "text-muted-foreground"}`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">
                    {t.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {t.author}
                  </span>
                </span>
                <span className="shrink-0 font-mono-ui text-xs text-muted-foreground">
                  {t.duration ? fmt(t.duration) : "--:--"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Floating player */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        <div className="pointer-events-auto flex w-full max-w-3xl items-center gap-4 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] py-2 pl-2 pr-3 shadow-[var(--shadow-float)] backdrop-blur-xl">
          <button
            onClick={() => setEmbedOpen((v) => !v)}
            title="Show video"
            className="size-14 shrink-0 overflow-hidden rounded-full bg-secondary ring-1 ring-border"
          >
            {cover ? (
              <img src={cover} alt="" className="size-full object-cover" />
            ) : (
              <span className="flex size-full items-center justify-center text-muted-foreground">
                <ListMusic className="size-5" />
              </span>
            )}
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">
              {p.current?.title ?? (p.ready ? "Ready to play" : "Loading playlist…")}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {p.current?.author ?? "RMDU Special"}
            </p>
          </div>

          <div className="hidden min-w-0 flex-1 flex-col gap-1 sm:flex">
            <div
              ref={barRef}
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuenow={Math.round(progress)}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                p.seek(ratio * p.duration);
              }}
              className="group h-1.5 w-full cursor-pointer rounded-full bg-secondary"
            >
              <div
                className="relative h-full rounded-full bg-[image:var(--gradient-warm)]"
                style={{ width: `${progress}%` }}
              >
                <span className="absolute -right-1.5 top-1/2 size-3 -translate-y-1/2 rounded-full bg-accent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
            </div>
            <div className="flex justify-center gap-1.5 font-mono-ui text-[0.7rem] text-muted-foreground">
              <span>{fmt(p.time)}</span>
              <span className="opacity-50">/</span>
              <span>{fmt(p.duration)}</span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => p.setShuffle(!p.shuffle)}
              title="Shuffle"
              aria-label="Shuffle"
              className={`rounded-full p-2 transition-colors ${p.shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Shuffle className="size-4" />
            </button>
            <button
              onClick={p.prev}
              title="Previous"
              aria-label="Previous track"
              className="rounded-full p-2 text-foreground/80 transition-colors hover:text-foreground"
            >
              <SkipBack className="size-4" />
            </button>
            <button
              onClick={p.toggle}
              title="Play or pause"
              aria-label="Play or pause"
              className="flex size-11 items-center justify-center rounded-full bg-[image:var(--gradient-warm)] text-primary-foreground transition-transform hover:scale-105 active:scale-95"
            >
              {p.playing ? (
                <Pause className="size-5" />
              ) : (
                <Play className="size-5 translate-x-px" />
              )}
            </button>
            <button
              onClick={p.next}
              title="Next"
              aria-label="Next track"
              className="rounded-full p-2 text-foreground/80 transition-colors hover:text-foreground"
            >
              <SkipForward className="size-4" />
            </button>
            <button
              onClick={p.toggleMute}
              title="Mute"
              aria-label="Mute"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {p.muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
            <button
              onClick={() => setQueueOpen((v) => !v)}
              title="Queue"
              aria-label="Toggle queue"
              className={`rounded-full p-2 transition-colors ${queueOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <ListMusic className="size-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
