import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowUpDown,
  ArrowUpRight,
  ArrowUpToLine,
  Box,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
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
  Trash2,
  Tv,
  VolumeX,
  X,
  Zap,
} from "lucide-react";

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
      { title: "RMDU Special — 3D Vintage Audio Receiver" },
      {
        name: "description",
        content:
          "RMDU Special: an authentic 3D interactive vintage all-wave radio receiver with rotatable 3D cabinet, telescopic antenna, multi-band frequency tuner, and live playback controls.",
      },
      { property: "og:title", content: "RMDU Special — 3D Vintage Audio Receiver" },
      {
        property: "og:description",
        content:
          "Rotate and inspect the 3D vintage radio cabinet, extend the telescopic antenna, turn the analog rotary volume dial, and tune live music stations.",
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
  const [threeDOpen, setThreeDOpen] = useState(false);
  const [rotX, setRotX] = useState(-8);
  const [rotY, setRotY] = useState(18);
  const [zoom, setZoom] = useState(1);
  const [antennaExtended, setAntennaExtended] = useState(true);
  const [antennaAngle, setAntennaAngle] = useState(30);
  const [is3DDragging, setIs3DDragging] = useState(false);
  const drag3DStartRef = useRef({ x: 0, y: 0, rx: -8, ry: 18 });

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

  // 3D Radio Orbit Dragging System
  const handle3DMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, [role="slider"], a')) return;
    setIs3DDragging(true);
    drag3DStartRef.current = { x: e.clientX, y: e.clientY, rx: rotX, ry: rotY };
  };

  useEffect(() => {
    const handle3DMouseMove = (e: MouseEvent) => {
      if (!is3DDragging) return;
      const dx = e.clientX - drag3DStartRef.current.x;
      const dy = e.clientY - drag3DStartRef.current.y;
      setRotY(drag3DStartRef.current.ry + dx * 0.45);
      setRotX(Math.max(-55, Math.min(55, drag3DStartRef.current.rx - dy * 0.45)));
    };

    const handle3DMouseUp = () => {
      if (is3DDragging) setIs3DDragging(false);
    };

    if (is3DDragging) {
      window.addEventListener("mousemove", handle3DMouseMove);
      window.addEventListener("mouseup", handle3DMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handle3DMouseMove);
      window.removeEventListener("mouseup", handle3DMouseUp);
    };
  }, [is3DDragging]);

  const knobAngle = (p.muted ? 0 : p.volume / 100) * 270 - 135;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0c0d10] font-body select-none">
      {/* ========================================================================= */}
      {/* BACKGROUND SYSTEM: FULLSCREEN RMDU.JPG WHEN IDLE vs DYNAMIC SONG BANNER */}
      {/* ========================================================================= */}

      {/* Layer 1: Standby / Idle Fullscreen Background with RMDU Artwork */}
      <div
        className={`absolute inset-0 size-full transition-all duration-700 ${
          p.playing ? "opacity-20 filter blur-md" : "opacity-100"
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
          className={`absolute inset-0 size-full bg-cover bg-center transition-all duration-700 ${
            p.playing ? "opacity-65 filter blur-xl" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${currentCover})` }}
        />
      )}

      {/* Solid Dark Atmosphere Overlays (No Gradients) */}
      <div className="absolute inset-0 bg-[#0c0d10]/75 pointer-events-none" />

      {/* ========================================================================= */}
      {/* TOP HEADER BAR: STATION STATUS & 3D RADIO VIEW BUTTON */}
      {/* ========================================================================= */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between border-b border-[#282c35] bg-[#111317]/90 px-5 py-2.5 text-xs text-zinc-300 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="font-mono-ui tabular-nums font-semibold tracking-wider text-zinc-200">
            {clock}
          </span>
          <span className="h-3 w-px bg-[#333844]" />
          <span className="flex items-center gap-2">
            <span
              className={`size-2 ${
                p.playing ? "bg-emerald-500 animate-pulse" : "bg-zinc-700"
              }`}
            />
            <span className="font-mono-ui uppercase tracking-widest text-[0.65rem] text-zinc-300 font-bold">
              {p.playing ? "RADIO ON AIR" : "STANDBY"}
            </span>
          </span>
        </div>

        {/* Current Song Marquee Badge */}
        {p.current && (
          <div className="hidden md:flex items-center gap-2 max-w-sm px-3 py-1 border border-[#2e3340] bg-[#161820]">
            <Radio className="size-3 text-emerald-400" />
            <span className="truncate text-xs text-zinc-100 font-medium">
              {p.current.title}
            </span>
            <span className="text-zinc-600 text-[0.65rem]">/</span>
            <span className="truncate text-[0.65rem] text-zinc-400 font-mono-ui">
              {p.current.author}
            </span>
          </div>
        )}

        <nav className="flex items-center gap-3 sm:gap-4">
          {/* 3D VINTAGE RADIO BUTTON */}
          <button
            onClick={() => setThreeDOpen(true)}
            title="Inspect, rotate, and interact with the 3D Vintage Radio Cabinet"
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d4af37] hover:bg-[#fde047] text-zinc-950 font-mono-ui font-bold text-xs border border-amber-300 transition-colors shadow-md cursor-pointer"
          >
            <Box className="size-3.5 text-zinc-950" />
            3D RADIO VIEW
          </button>

          <a
            href={YTM_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-100 font-mono-ui text-[0.7rem]"
          >
            YouTube Music
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
          <a
            href={YT_PLAYLIST}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-zinc-400 transition-colors hover:text-zinc-100 font-mono-ui text-[0.7rem]"
          >
            YouTube
            <ArrowUpRight className="size-3" aria-hidden="true" />
          </a>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* CENTER STAGE: STATION TITLE & QUICK STATS */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center pb-28">
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-zinc-700 bg-[#111317]/95 mb-3 shadow-md">
            <Zap className="size-3 text-zinc-300" />
            <p className="font-mono-ui text-[0.68rem] uppercase tracking-[0.25em] text-zinc-300 font-semibold">
              SOLID-STATE ALL-WAVE RADIO / RMDU SPEC-003
            </p>
          </div>
          <h1 className="font-display text-[4.5rem] leading-[0.85] tracking-tight text-zinc-100 sm:text-[7.5rem] lg:text-[10rem]">
            RMDU SPECIAL
          </h1>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-zinc-300 font-mono-ui">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#2e3340] bg-[#14161d] text-zinc-300">
            <Disc3 className="size-3 text-zinc-400" />
            {total} TRACKS
          </span>
          {totalDuration > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#2e3340] bg-[#14161d] text-zinc-300">
              <Clock className="size-3 text-zinc-400" />
              {fmt(totalDuration)} DURATION
            </span>
          )}
          <button
            onClick={() => setQueueOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#1e222b] hover:bg-[#272c38] border border-[#3d4454] text-zinc-100 font-semibold transition-colors cursor-pointer"
          >
            <ListMusic className="size-3.5 text-zinc-300" />
            QUEUE [{total}]
          </button>
          <button
            onClick={() => setThreeDOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-[#2b1f14] hover:bg-[#3d2f20] border border-[#78350f] text-amber-200 font-semibold transition-colors cursor-pointer"
          >
            <Box className="size-3.5 text-amber-400" />
            INSPECT 3D
          </button>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 🌟 3D INTERACTIVE VINTAGE RADIO CABINET MODAL 🌟 */}
      {/* ========================================================================= */}
      {threeDOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl overflow-hidden select-none">
          {/* Top 3D Control Strip */}
          <div className="flex items-center justify-between border-b border-[#3d2f20] bg-[#130f0a] px-5 py-3 text-xs text-amber-200">
            <div className="flex items-center gap-3">
              <Box className="size-4 text-amber-400" />
              <div>
                <h2 className="font-mono-ui text-xs font-bold uppercase tracking-widest text-amber-100">
                  RMDU 3D VINTAGE FIELD RADIO • TYPE RM-003
                </h2>
                <p className="text-[0.62rem] text-amber-400/70 font-mono-ui">
                  Drag to rotate in 3D • Scroll to zoom • Click controls to operate
                </p>
              </div>
            </div>

            {/* Quick 3D View Presets */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono-ui text-[0.68rem]">
              <button
                onClick={() => { setRotX(0); setRotY(0); setZoom(1); }}
                className="px-2.5 py-1 bg-[#241a11] hover:bg-[#38281b] border border-[#4a3826] text-amber-200 cursor-pointer"
              >
                Front View
              </button>
              <button
                onClick={() => { setRotX(-12); setRotY(24); setZoom(1); }}
                className="px-2.5 py-1 bg-[#241a11] hover:bg-[#38281b] border border-[#4a3826] text-amber-200 cursor-pointer"
              >
                3/4 Angle
              </button>
              <button
                onClick={() => { setRotX(-35); setRotY(0); setZoom(1); }}
                className="px-2.5 py-1 bg-[#241a11] hover:bg-[#38281b] border border-[#4a3826] text-amber-200 cursor-pointer"
              >
                Top Down
              </button>
              <button
                onClick={() => { setRotX(0); setRotY(90); setZoom(1); }}
                className="px-2.5 py-1 bg-[#241a11] hover:bg-[#38281b] border border-[#4a3826] text-amber-200 cursor-pointer"
              >
                Side Profile
              </button>
              <button
                onClick={() => setAntennaExtended((v) => !v)}
                className={`px-2.5 py-1 border cursor-pointer ${
                  antennaExtended
                    ? "bg-amber-800 text-amber-100 border-amber-500"
                    : "bg-[#241a11] text-amber-300 border-[#4a3826]"
                }`}
              >
                📡 Antenna: {antennaExtended ? "EXTENDED" : "COLLAPSED"}
              </button>
            </div>

            <button
              onClick={() => setThreeDOpen(false)}
              className="p-1.5 bg-[#2b1f14] hover:bg-[#42301f] border border-[#543e27] text-amber-200 hover:text-white cursor-pointer"
              aria-label="Close 3D View"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* 3D Interactive Stage Canvas */}
          <div
            onMouseDown={handle3DMouseDown}
            onWheel={(e) => {
              e.preventDefault();
              setZoom((prev) => Math.max(0.65, Math.min(1.5, prev + (e.deltaY < 0 ? 0.05 : -0.05))));
            }}
            className="perspective-1200 relative flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden"
          >
            {/* Ambient Ground Grid Plate */}
            <div
              className="absolute w-[800px] h-[800px] rounded-full opacity-20 pointer-events-none"
              style={{
                background: "radial-gradient(circle, #f59e0b 0%, transparent 70%)",
                transform: "translateY(220px) rotateX(90deg)",
              }}
            />

            {/* 3D Radio Chassis Root Box */}
            <div
              className="radio-3d-chassis preserve-3d relative"
              style={{
                width: "480px",
                height: "300px",
                transform: `scale(${zoom}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
              }}
            >
              {/* ========================================================= */}
              {/* 📡 TELESCOPIC CHROME ANTENNA (EXTENDS FROM TOP-LEFT) 📡 */}
              {/* ========================================================= */}
              <div
                className="absolute preserve-3d pointer-events-auto cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  setAntennaExtended((v) => !v);
                }}
                style={{
                  top: "-15px",
                  left: "35px",
                  transform: "translateZ(30px)",
                }}
                title="Click to extend / collapse antenna"
              >
                {/* Antenna Swivel Base Joint */}
                <div className="size-4 rounded-full bg-zinc-400 border border-zinc-700 shadow-md" />

                {/* Telescopic Antenna Shaft with Multi-Stage Segments */}
                <div
                  className="origin-bottom transition-all duration-500"
                  style={{
                    transform: `rotate(${antennaAngle}deg) scaleY(${antennaExtended ? 1 : 0.25})`,
                  }}
                >
                  {/* Segment 1 (Base Tube) */}
                  <div className="w-2.5 h-20 telescopic-antenna border border-zinc-500 rounded-t-sm relative">
                    {/* Segment 2 (Middle Tube) */}
                    <div className="w-2 h-20 telescopic-antenna border border-zinc-500 rounded-t-sm absolute -top-20 left-0.5">
                      {/* Segment 3 (Top Tube) */}
                      <div className="w-1.5 h-24 telescopic-antenna border border-zinc-500 rounded-t-sm absolute -top-24 left-[1px]">
                        {/* Red Antenna Tip Ball */}
                        <div className="size-3 rounded-full bg-red-600 border border-red-300 absolute -top-2.5 -left-[3px] shadow-md" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 📻 FACE 1: FRONT PANEL (SPEAKER, CASSETTE, DIALS, TUNER) 📻 */}
              {/* ========================================================= */}
              <div
                className="chassis-face chassis-face-front w-[480px] h-[300px] p-3.5 flex flex-col justify-between"
                style={{ transform: "translateZ(75px)" }}
              >
                {/* Top Speaker Cloth Grille & Model Badge */}
                <div className="flex gap-3 h-[130px]">
                  {/* Acoustic Woven Speaker Cloth Area */}
                  <div className="retro-speaker-cloth flex-1 p-2 flex flex-col justify-between shadow-inner relative overflow-hidden">
                    <div className="flex items-center justify-between text-[0.55rem] font-mono-ui text-amber-300 font-bold tracking-widest border-b border-amber-900/60 pb-0.5">
                      <span>RMDU SPECIAL VALVES</span>
                      <div className="flex items-center gap-1">
                        <span className={`size-1.5 ${p.playing ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"}`} />
                        <span>HI-FI STEREO</span>
                      </div>
                    </div>

                    {/* Speaker Mesh Louver Bars */}
                    <div className="flex flex-col justify-around h-16 opacity-40">
                      <div className="h-[2px] bg-amber-600/40 w-full" />
                      <div className="h-[2px] bg-amber-600/40 w-full" />
                      <div className="h-[2px] bg-amber-600/40 w-full" />
                      <div className="h-[2px] bg-amber-600/40 w-full" />
                    </div>

                    <div className="flex justify-between items-center text-[0.52rem] font-mono-ui text-amber-400">
                      <span>TYPE RM-003</span>
                      <span className="text-[0.48rem] text-amber-500">SOLID STATE RECEIVER</span>
                    </div>
                  </div>

                  {/* Cassette Deck Viewing Compartment */}
                  <div className="w-[150px] border-2 border-[#4a3826] bg-[#0c0906] p-1.5 flex flex-col justify-between shadow-inner relative">
                    <div className="flex justify-between text-[0.50rem] font-mono-ui text-amber-400 font-bold">
                      <span>CASSETTE DECK</span>
                      <span>AUTO STOP</span>
                    </div>

                    {/* Spinning Cassette Tape Spools Window */}
                    <div className="relative h-14 bg-zinc-950 border border-amber-900/60 overflow-hidden flex items-center justify-around px-2">
                      {currentCover && (
                        <img
                          src={currentCover}
                          alt="Cover"
                          className="absolute inset-0 size-full object-cover opacity-20 filter blur-[1px]"
                        />
                      )}
                      {/* Left Spool */}
                      <div className={`size-6 rounded-full border-2 border-amber-400 bg-zinc-900 flex items-center justify-center relative ${p.playing ? "animate-spool" : "animate-spool-paused"}`}>
                        <div className="size-2 rounded-full bg-amber-500" />
                        <div className="absolute w-full h-[1px] bg-amber-200/60" />
                        <div className="absolute h-full w-[1px] bg-amber-200/60" />
                      </div>
                      {/* Tape bridge */}
                      <div className="h-[2px] w-5 bg-zinc-600" />
                      {/* Right Spool */}
                      <div className={`size-6 rounded-full border-2 border-amber-400 bg-zinc-900 flex items-center justify-center relative ${p.playing ? "animate-spool" : "animate-spool-paused"}`}>
                        <div className="size-2 rounded-full bg-amber-500" />
                        <div className="absolute w-full h-[1px] bg-amber-200/60" />
                        <div className="absolute h-full w-[1px] bg-amber-200/60" />
                      </div>
                    </div>

                    <div className="truncate text-[0.58rem] text-amber-200 font-medium text-center">
                      {p.current?.title ?? "Standby"}
                    </div>
                  </div>
                </div>

                {/* Middle: Multi-Band Glass Radio Frequency Scale */}
                <div
                  role="slider"
                  tabIndex={0}
                  aria-label="3D Radio Tuner Scale"
                  aria-valuenow={Math.round(progress)}
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    p.seek(ratio * p.duration);
                  }}
                  className="retro-multi-tuner-glass h-12 p-1 relative overflow-hidden cursor-pointer select-none"
                >
                  <div className="flex flex-col justify-between h-full text-[0.44rem] font-mono-ui text-[#e6ca65] px-1 leading-none">
                    <div className="flex justify-between font-bold text-[#fde047]">
                      <span className="text-[#d4af37]">AM</span>
                      <span>1600</span><span>1400</span><span>1200</span><span>1000</span><span>800</span><span>600</span><span>550 kHz</span>
                    </div>
                    <div className="flex justify-between text-[#ca8a04]">
                      <span className="text-[#a16207]">KANAL</span>
                      <span>40</span><span>35</span><span>30</span><span>25</span><span>20</span><span>15</span><span>10</span>
                    </div>
                    <div className="flex justify-between font-bold text-[#fef08a] border-t border-amber-900/60 pt-0.5">
                      <span className="text-[#eab308]">FM</span>
                      <span>88</span><span>92</span><span>96</span><span>100</span><span>104</span><span>108 MHz</span>
                    </div>
                  </div>

                  {/* Red Tuning Needle */}
                  <div
                    className="absolute top-0 bottom-0 w-[2px] bg-[#ef4444] transition-all duration-100 pointer-events-none z-10"
                    style={{ left: `${progress}%` }}
                  >
                    <div className="absolute top-0 -left-[2px] w-1.5 h-1 bg-[#ef4444]" />
                    <div className="absolute bottom-0 -left-[2px] w-1.5 h-1 bg-[#ef4444]" />
                  </div>
                </div>

                {/* Bottom Controls: Dials & Piano Keys */}
                <div className="flex items-center gap-2">
                  {/* Left Volume Dial */}
                  <div
                    onWheel={(e) => {
                      e.preventDefault();
                      p.setVolume(p.volume + (e.deltaY < 0 ? 5 : -5));
                    }}
                    title="Volume (Scroll or Click)"
                    className="size-11 rounded-full bg-[#f59e0b] border-2 border-black flex items-center justify-center relative cursor-pointer shrink-0 shadow-inner"
                  >
                    <div
                      className="size-6 rounded-full bg-[#1c1813] border border-black flex items-center justify-center"
                      style={{ transform: `rotate(${knobAngle}deg)` }}
                    >
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-[2px] h-2.5 bg-black" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); p.toggleMute(); }}
                      className="absolute size-2.5 rounded-full bg-[#3d2f20] border border-amber-400"
                    />
                  </div>

                  {/* Piano Keys Bar */}
                  <div className="flex-1 flex gap-1">
                    <button
                      onClick={p.prev}
                      title="Previous"
                      className="retro-piano-key flex-1 py-1 text-[0.60rem] font-bold font-mono-ui flex items-center justify-center cursor-pointer"
                    >
                      ⏮
                    </button>
                    <button
                      onClick={p.toggle}
                      title={p.playing ? "Pause" : "Play"}
                      className={`retro-piano-key flex-[1.4] py-1 text-[0.65rem] font-bold font-mono-ui flex items-center justify-center cursor-pointer ${
                        p.playing ? "active-key bg-[#dfd8c5]" : ""
                      }`}
                    >
                      {p.playing ? "⏸ PAUSE" : "▶ PLAY"}
                    </button>
                    <button
                      onClick={p.next}
                      title="Next"
                      className="retro-piano-key flex-1 py-1 text-[0.60rem] font-bold font-mono-ui flex items-center justify-center cursor-pointer"
                    >
                      ⏭
                    </button>
                    <button
                      onClick={() => p.setShuffle(!p.shuffle)}
                      title="Shuffle"
                      className={`retro-piano-key flex-1 py-1 text-[0.60rem] font-bold font-mono-ui flex items-center justify-center cursor-pointer ${
                        p.shuffle ? "active-key bg-[#d8f3dc]" : ""
                      }`}
                    >
                      🔀
                    </button>
                    <button
                      onClick={p.toggleRepeat}
                      title="Loop"
                      className={`retro-piano-key flex-1 py-1 text-[0.60rem] font-bold font-mono-ui flex items-center justify-center cursor-pointer ${
                        p.repeatMode !== "off" ? "active-key bg-[#fee2e2]" : ""
                      }`}
                    >
                      🔁
                    </button>
                  </div>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 📻 FACE 2: BACK PANEL (VENTS, BATTERY, AC/DC SWITCH) 📻 */}
              {/* ========================================================= */}
              <div
                className="chassis-face chassis-face-back w-[480px] h-[300px] p-6 flex flex-col justify-between text-[#856b50]"
                style={{ transform: "rotateY(180deg) translateZ(75px)" }}
              >
                <div className="flex justify-between border-b border-[#3d2f20] pb-2">
                  <div className="font-mono-ui text-xs font-bold text-amber-200">
                    RMDU VALVE CHASSIS • TYPE 003
                  </div>
                  <div className="font-mono-ui text-[0.60rem]">220V AC / 12V DC • 50-60Hz</div>
                </div>

                {/* Perforated Backboard Cooling Vent Area */}
                <div className="border border-[#3d2f20] p-3 bg-black/40 flex flex-col gap-1.5">
                  <div className="text-[0.55rem] font-mono-ui text-center text-amber-400">
                    CAUTION: RISK OF ELECTRIC SHOCK • DO NOT OPEN COVER
                  </div>
                  <div className="flex justify-between px-4 text-[0.50rem] font-mono-ui">
                    <span>EXT ANTENNA: 75Ω / 300Ω</span>
                    <span>EARTH GROUND</span>
                    <span>TAPE OUT: 0dB</span>
                  </div>
                </div>

                {/* Battery Compartment Cover */}
                <div className="border-2 border-[#3d2f20] bg-[#1a140e] p-2 flex justify-between items-center text-xs font-mono-ui">
                  <span>BATTERY COMPARTMENT (6 × 1.5V D-CELL)</span>
                  <span className="border border-[#4a3826] px-2 py-0.5 text-[0.60rem] bg-black">LATCH</span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 📻 FACE 3: TOP PANEL (CARRYING HANDLE & VENTILATION) 📻 */}
              {/* ========================================================= */}
              <div
                className="chassis-face chassis-face-top w-[480px] h-[150px] p-3 flex flex-col justify-between"
                style={{ transform: "rotateX(90deg) translateZ(75px)" }}
              >
                {/* Top Chrome Carrying Handle */}
                <div className="w-full flex items-center justify-center my-auto">
                  <div className="w-[320px] h-6 bg-[#1a1510] border-2 border-zinc-500 shadow-md flex items-center justify-between px-3">
                    <div className="size-3 bg-zinc-400 border border-black rounded-full" />
                    <span className="font-mono-ui text-[0.55rem] font-bold text-zinc-300 tracking-widest">
                      RMDU SOLID-STATE
                    </span>
                    <div className="size-3 bg-zinc-400 border border-black rounded-full" />
                  </div>
                </div>

                <div className="flex justify-between text-[0.50rem] font-mono-ui text-amber-400 border-t border-[#4a3826] pt-1">
                  <span>TOP COOLING LOUVERS</span>
                  <span>ANTENNA SWIVEL JOINT</span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* 📻 FACE 4: BOTTOM PANEL (SOLID RUBBER FEET) 📻 */}
              {/* ========================================================= */}
              <div
                className="chassis-face chassis-face-bottom w-[480px] h-[150px] p-4 flex justify-between items-center"
                style={{ transform: "rotateX(-90deg) translateZ(225px)" }}
              >
                <div className="size-5 rounded-full bg-zinc-900 border-2 border-black" />
                <div className="size-5 rounded-full bg-zinc-900 border-2 border-black" />
                <div className="font-mono-ui text-[0.60rem] text-zinc-600">SERIAL NO: RMDU-2026-VINTAGE</div>
                <div className="size-5 rounded-full bg-zinc-900 border-2 border-black" />
                <div className="size-5 rounded-full bg-zinc-900 border-2 border-black" />
              </div>

              {/* ========================================================= */}
              {/* 📻 FACE 5: LEFT SIDE PANEL (WOOD / STEEL STRAP LUG) 📻 */}
              {/* ========================================================= */}
              <div
                className="chassis-face chassis-face-left w-[150px] h-[300px] p-3 flex flex-col justify-between items-center"
                style={{ transform: "rotateY(-90deg) translateZ(75px)" }}
              >
                <div className="size-4 rounded-full bg-amber-400 border border-black shadow-md mt-4" />
                <div className="font-mono-ui text-[0.55rem] text-amber-300 font-bold -rotate-90 tracking-widest">
                  TELEFUNKEN
                </div>
                <div className="w-8 h-4 border border-[#4a3826] bg-black/50 text-[0.45rem] font-mono-ui text-center text-amber-400 flex items-center justify-center">
                  12V DC
                </div>
              </div>

              {/* ========================================================= */}
              {/* 📻 FACE 6: RIGHT SIDE PANEL (FINE TUNING THUMBWHEEL) 📻 */}
              {/* ========================================================= */}
              <div
                className="chassis-face chassis-face-right w-[150px] h-[300px] p-3 flex flex-col justify-between items-center"
                style={{ transform: "rotateY(90deg) translateZ(405px)" }}
              >
                <div className="size-4 rounded-full bg-amber-400 border border-black shadow-md mt-4" />
                
                {/* Knurled Side Tuning Thumbwheel */}
                <div
                  onWheel={(e) => {
                    e.preventDefault();
                    p.seek(p.time + (e.deltaY < 0 ? 5 : -5));
                  }}
                  title="Side Tuning Dial (Scroll)"
                  className="w-5 h-20 bg-[#1c1813] border-2 border-[#5c4724] rounded-sm flex flex-col justify-around items-center cursor-pointer shadow-lg py-1"
                >
                  <div className="w-full h-[1px] bg-amber-400/40" />
                  <div className="w-full h-[1px] bg-amber-400/40" />
                  <div className="w-full h-[1px] bg-amber-400/40" />
                  <div className="w-full h-[1px] bg-amber-400/40" />
                </div>

                <div className="font-mono-ui text-[0.50rem] text-amber-300">TUNING</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CRT MONITOR VIDEO FEED FLOATING MODAL */}
      {/* ========================================================================= */}
      <section
        className={`absolute bottom-36 left-1/2 z-40 w-[min(92vw,34rem)] -translate-x-1/2 border border-zinc-700 bg-[#111317] shadow-2xl transition-all duration-200 ${
          embedOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2 bg-[#0c0d10]">
          <div className="flex items-center gap-2">
            <Tv className="size-3.5 text-zinc-300" />
            <span className="font-mono-ui text-[0.68rem] uppercase tracking-[0.2em] text-zinc-200 font-semibold">
              CRT Monitor Feed / CH-01
            </span>
          </div>
          <button
            onClick={() => setEmbedOpen(false)}
            aria-label="Close video player"
            className="p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
        <div
          id="yt-player-host-wrapper"
          className="aspect-video w-full overflow-hidden bg-black border-t border-zinc-800"
        >
          <div id="yt-player-host" className="size-full" />
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PLAYLIST QUEUE DRAWER: REARRANGE, REMOVE, SHUFFLE & TRACK CARDS */}
      {/* ========================================================================= */}
      <section
        className={`absolute bottom-36 left-1/2 z-30 w-[min(94vw,46rem)] -translate-x-1/2 border border-zinc-700 bg-[#111317] shadow-2xl transition-all duration-200 flex flex-col ${
          queueOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-4 opacity-0"
        }`}
      >
        {/* Queue Header & Action Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-[#0c0d10]">
          <div className="flex items-center gap-2.5">
            <ListMusic className="size-4 text-zinc-300" />
            <span className="font-mono-ui text-xs uppercase tracking-[0.18em] text-zinc-100 font-bold">
              Station Queue [{total}]
            </span>
            {totalDuration > 0 && (
              <span className="hidden sm:inline font-mono-ui text-[0.7rem] text-zinc-400">
                / {fmt(totalDuration)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Add Track Button */}
            <button
              onClick={() => setAddOpen((v) => !v)}
              title="Add YouTube song to queue"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-mono-ui font-semibold border border-zinc-600 bg-[#1d2028] hover:bg-[#282c38] transition-colors text-zinc-100 cursor-pointer"
            >
              <Plus className="size-3.5 text-zinc-300" />
              Add Track
            </button>

            {/* Shuffle Queue Order */}
            <button
              onClick={p.shuffleQueue}
              title="Randomize / Shuffle entire queue order"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Shuffle className="size-3.5" />
            </button>

            {/* Reverse Queue Order */}
            <button
              onClick={p.reverseQueue}
              title="Reverse queue order"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <ArrowUpDown className="size-3.5" />
            </button>

            {/* Reset to Original Playlist */}
            <button
              onClick={p.resetQueue}
              title="Reset queue to original playlist"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
            </button>

            {/* Clear Entire Queue */}
            <button
              onClick={p.clearQueue}
              title="Clear all songs from queue"
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
            >
              <Trash2 className="size-3.5" />
            </button>

            <span className="h-4 w-px bg-zinc-800 mx-0.5" />

            {/* Close Queue Drawer */}
            <button
              onClick={() => setQueueOpen(false)}
              aria-label="Close queue"
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Add Song Form Panel */}
        {addOpen && (
          <form
            onSubmit={handleAddSong}
            className="p-3 border-b border-zinc-800 bg-[#0e1014] flex flex-col gap-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste YouTube Link or Video ID (e.g. youtu.be/... or watch?v=...)"
                value={newSongInput}
                onChange={(e) => setNewSongInput(e.target.value)}
                className="flex-1 border border-zinc-700 bg-black px-3.5 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-400 font-mono-ui"
              />
              <button
                type="submit"
                disabled={isAdding}
                className="px-4 py-1.5 bg-zinc-200 text-black font-mono-ui text-xs font-bold hover:bg-white disabled:opacity-50 transition-colors shrink-0 cursor-pointer"
              >
                {isAdding ? "Adding…" : "Add to Queue"}
              </button>
            </div>
            {addError && <p className="text-[0.7rem] text-red-400 px-1 font-mono-ui">{addError}</p>}
          </form>
        )}

        {/* Queue Items List with Dynamic Banner Artwork on Every Song Card */}
        <div className="max-h-[50vh] overflow-y-auto p-3 space-y-1.5">
          {p.tracks.length === 0 && (
            <div className="py-12 text-center text-zinc-500 font-mono-ui">
              <Music className="size-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">Queue is currently empty</p>
              <button
                onClick={p.resetQueue}
                className="mt-3 text-xs text-zinc-300 underline underline-offset-4 hover:text-white cursor-pointer"
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
                className={`group relative flex items-center gap-3 p-2 transition-colors border overflow-hidden ${
                  active
                    ? "border-zinc-400 bg-[#1c202a]"
                    : "border-zinc-800/80 hover:border-zinc-600 bg-[#13151b] hover:bg-[#181b22]"
                } ${draggedIndex === i ? "opacity-35" : ""}`}
              >
                {/* Dynamic Song Banner Background */}
                {t.thumbnail && (
                  <div
                    className={`absolute inset-0 bg-cover bg-center pointer-events-none ${
                      active
                        ? "opacity-25 filter blur-[1px]"
                        : "opacity-10 filter blur-sm group-hover:opacity-15"
                    }`}
                    style={{ backgroundImage: `url(${t.thumbnail})` }}
                  />
                )}
                <div className="absolute inset-0 bg-[#0c0d10]/80 pointer-events-none" />

                {/* Drag Handle for Reordering */}
                <div
                  className="relative z-10 cursor-grab active:cursor-grabbing text-zinc-500 hover:text-zinc-200 transition-colors p-1"
                  title="Drag to rearrange queue"
                >
                  <GripVertical className="size-4" />
                </div>

                {/* Song Banner Thumbnail with Live Equalizer */}
                <button
                  type="button"
                  onClick={() => p.playAt(i)}
                  className="relative z-10 size-12 shrink-0 overflow-hidden bg-black border border-zinc-700 transition-all text-left cursor-pointer"
                >
                  <img
                    src={t.thumbnail}
                    alt={t.title}
                    className="size-full object-cover"
                  />
                  {active && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-0.5">
                      <span className="w-1 bg-zinc-200 animate-eq-1" />
                      <span className="w-1 bg-zinc-400 animate-eq-2" />
                      <span className="w-1 bg-zinc-200 animate-eq-3" />
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
                      active ? "text-white font-bold" : "text-zinc-200"
                    }`}
                  >
                    {t.title}
                  </p>
                  <p className="truncate text-[0.70rem] text-zinc-400 font-mono-ui">
                    {t.author}
                  </p>
                </button>

                {/* Duration */}
                <span className="relative z-10 shrink-0 font-mono-ui text-[0.70rem] text-zinc-400 font-medium">
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
                      className="p-0.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors cursor-pointer"
                    >
                      <ChevronUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={i === p.tracks.length - 1}
                      onClick={() => p.moveTrack(i, i + 1)}
                      title="Move down one position"
                      className="p-0.5 text-zinc-500 hover:text-zinc-200 disabled:opacity-20 transition-colors cursor-pointer"
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
                      className="hidden sm:inline-flex p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
                    >
                      <ArrowUpToLine className="size-3.5" />
                    </button>
                  )}

                  {/* Remove Track from Queue */}
                  <button
                    type="button"
                    onClick={() => p.removeTrack(i)}
                    title="Remove from queue"
                    className="p-1 text-zinc-500 hover:text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
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
      {/* 📻 VINTAGE ALL-WAVE RADIO & CASSETTE CONSOLE (GROUNDED IN USER REFERENCES) 📻 */}
      {/* ========================================================================= */}
      <div className="pointer-events-none fixed inset-x-0 bottom-2 z-50 flex justify-center px-2 sm:px-4">
        <div className="pointer-events-auto retro-radio-body relative flex w-full max-w-4xl flex-col p-3 text-zinc-200">
          {/* 4 Vintage Metallic Corner Brackets */}
          <span className="absolute top-1 left-1 size-2.5 border-t-2 border-l-2 border-amber-600/60 pointer-events-none" />
          <span className="absolute top-1 right-1 size-2.5 border-t-2 border-r-2 border-amber-600/60 pointer-events-none" />
          <span className="absolute bottom-1 left-1 size-2.5 border-b-2 border-l-2 border-amber-600/60 pointer-events-none" />
          <span className="absolute bottom-1 right-1 size-2.5 border-b-2 border-r-2 border-amber-600/60 pointer-events-none" />

          {/* Top Chassis Header Strip: Wood Trim + Valve & Cassette Indicator */}
          <div className="mb-2 flex items-center justify-between border-b border-[#3d2f20] pb-1 px-1 text-[0.62rem] font-mono-ui uppercase tracking-widest text-[#d4af37]">
            <div className="flex items-center gap-2">
              <span className={`size-2 ${p.playing ? "bg-emerald-400 animate-pulse" : "bg-zinc-700"}`} />
              <span className="font-bold tracking-wider text-amber-200">
                TELEFUNKEN / RMDU ALL-WAVE VALVE RECEIVER • TYPE RM-003
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline text-amber-300/80 font-semibold">
                HI-FI STEREO / KANAL-03
              </span>
              <div className="flex items-center gap-1.5 px-2 py-0.5 border border-amber-800/60 bg-[#120d08]">
                <span className="text-[0.55rem] text-amber-500 font-bold">TAPE</span>
                <span className="font-mono-ui text-amber-300 font-bold">
                  {p.current ? String(p.index + 1).padStart(3, "0") : "000"}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Row: Cassette Spool Window / Multi-Band Tuner Scale / Dual Vintage Dials */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* 1. Vintage Cassette Deck Viewing Window (with Live Spinning Tape Spools & Album Art) */}
            <div className="relative size-12 sm:size-14 shrink-0 border-2 border-[#4a3826] bg-[#0f0b07] p-0.5 shadow-inner">
              <button
                onClick={() => setEmbedOpen((v) => !v)}
                title={embedOpen ? "Close CRT Monitor Feed" : "Open CRT Monitor Feed"}
                className="relative size-full overflow-hidden block group cursor-pointer"
              >
                {currentCover ? (
                  <img
                    src={currentCover}
                    alt="Current Track"
                    className="size-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
                  />
                ) : (
                  <div className="size-full bg-zinc-900 flex items-center justify-center">
                    <Disc3 className="size-6 text-zinc-400" />
                  </div>
                )}

                {/* Cassette Tape Spools Overlay */}
                <div className="absolute inset-0 bg-black/50 flex items-center justify-around px-1 pointer-events-none">
                  {/* Left Spool */}
                  <div
                    className={`size-4 sm:size-5 rounded-full border border-amber-300/80 bg-zinc-950 flex items-center justify-center ${
                      p.playing ? "animate-spool" : "animate-spool-paused"
                    }`}
                  >
                    <div className="size-1.5 bg-amber-400 rounded-full" />
                    <div className="absolute w-full h-[1px] bg-amber-200/50" />
                    <div className="absolute h-full w-[1px] bg-amber-200/50" />
                  </div>
                  {/* Tape connecting bridge */}
                  <div className="h-[2px] w-3 bg-zinc-600" />
                  {/* Right Spool */}
                  <div
                    className={`size-4 sm:size-5 rounded-full border border-amber-300/80 bg-zinc-950 flex items-center justify-center ${
                      p.playing ? "animate-spool" : "animate-spool-paused"
                    }`}
                  >
                    <div className="size-1.5 bg-amber-400 rounded-full" />
                    <div className="absolute w-full h-[1px] bg-amber-200/50" />
                    <div className="absolute h-full w-[1px] bg-amber-200/50" />
                  </div>
                </div>

                <span className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-amber-200">
                  {embedOpen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                </span>
              </button>
            </div>

            {/* 2. Track Title & Station Info */}
            <div className="min-w-0 max-w-[95px] sm:max-w-[140px] md:max-w-[160px]">
              <p className="truncate text-xs sm:text-sm font-bold text-amber-100 tracking-tight">
                {p.current?.title ?? (p.ready ? "Station Ready" : "Tuning Station…")}
              </p>
              <p className="truncate text-[0.68rem] text-amber-400/80 font-mono-ui font-medium">
                {p.current?.author ?? "RMDU Special"}
              </p>
            </div>

            {/* 3. Authentic Multi-Band Glass Radio Tuner (AM / SW / FM / KANAL Scales) */}
            <div className="hidden min-w-0 flex-1 flex-col gap-0.5 md:flex">
              <div
                ref={barRef}
                role="slider"
                tabIndex={0}
                aria-label="Multi-Band Frequency Seeker"
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
                className="group relative h-11 flex-1 cursor-pointer retro-multi-tuner-glass p-1 select-none overflow-hidden"
              >
                {/* Horizontal Scale Bands Background */}
                <div className="flex flex-col justify-between h-full text-[0.48rem] font-mono-ui text-[#e6ca65] pointer-events-none px-1 tracking-wider leading-none">
                  {/* Band 1: AM Scale */}
                  <div className="flex justify-between font-bold text-[#fde047]">
                    <span className="text-[#d4af37]">AM</span>
                    <span>1600</span>
                    <span>1400</span>
                    <span>1200</span>
                    <span>1000</span>
                    <span>800</span>
                    <span>700</span>
                    <span>600</span>
                    <span>550 kHz</span>
                  </div>

                  {/* Band 2: KANAL Scale */}
                  <div className="flex justify-between text-[#ca8a04]">
                    <span className="text-[#a16207]">KANAL</span>
                    <span>40</span>
                    <span>35</span>
                    <span>30</span>
                    <span>25</span>
                    <span>20</span>
                    <span>15</span>
                    <span>10</span>
                  </div>

                  {/* Band 3: FM Stereo Frequency Scale */}
                  <div className="flex justify-between font-bold text-[#fef08a] border-t border-amber-900/60 pt-0.5">
                    <span className="text-[#eab308]">FM</span>
                    <span>88</span>
                    <span>92</span>
                    <span>96</span>
                    <span>100</span>
                    <span>104</span>
                    <span>108 MHz</span>
                  </div>
                </div>

                {/* Light Track Fill */}
                <div
                  className="absolute inset-y-0 left-0 bg-amber-500/10 pointer-events-none"
                  style={{ width: `${progress}%` }}
                />

                {/* Authentic Vintage Dual-Line Red/Gold Tuning Needle */}
                <div
                  className="absolute top-0 bottom-0 w-[2px] bg-[#ef4444] transition-all duration-100 pointer-events-none z-10"
                  style={{ left: `${progress}%` }}
                >
                  <div className="absolute top-0 -left-[3px] w-2 h-1 bg-[#ef4444] border border-amber-200" />
                  <div className="absolute bottom-0 -left-[3px] w-2 h-1 bg-[#ef4444] border border-amber-200" />
                </div>

                {/* Hover Time Tooltip */}
                {hoverTime !== null && (
                  <div
                    className="absolute -top-7 -translate-x-1/2 bg-[#1c150c] border border-[#78350f] px-2 py-0.5 font-mono-ui text-[0.62rem] text-amber-200 pointer-events-none shadow-xl z-20 flex items-center gap-1"
                    style={{ left: `${(hoverTime / (p.duration || 1)) * 100}%` }}
                  >
                    <Radio className="size-3 text-amber-400" />
                    {fmt(hoverTime)}
                  </div>
                )}
              </div>

              {/* Time Counters and Signal Lock */}
              <div className="flex items-center justify-between font-mono-ui text-[0.62rem] text-amber-200/80 px-1">
                <span>{fmt(p.time)}</span>
                <div className="flex items-center gap-1.5 text-[0.55rem] tracking-wider text-amber-400">
                  <Activity
                    className={`size-3 ${
                      p.playing ? "animate-pulse text-emerald-400" : "text-amber-700"
                    }`}
                  />
                  <span>
                    {p.playing
                      ? `SIGNAL LOCKED • ${p.repeatMode === "one" ? "LOOP 1" : p.repeatMode === "all" ? "LOOP ALL" : "FM STEREO"}`
                      : "TUNER STANDBY"}
                  </span>
                </div>
                <span>{fmt(p.duration)}</span>
              </div>
            </div>

            {/* 4. Left Dial: LAUTSTÄRKE (Vintage Circular Yellow Master Volume Dial) */}
            <div className="relative flex flex-col items-center justify-center px-0.5">
              <div
                ref={knobRef}
                onMouseDown={handleKnobMouseDown}
                onWheel={(e) => {
                  e.preventDefault();
                  p.setVolume(p.volume + (e.deltaY < 0 ? 5 : -5));
                }}
                title={`LAUTSTÄRKE (Volume): ${p.muted ? "MUTED" : `${p.volume}%`} (Turn / Drag)`}
                className="relative size-12 sm:size-13 rounded-full bg-[#f59e0b] border-2 border-[#2b1f14] shadow-inner flex items-center justify-center select-none cursor-grab active:cursor-grabbing overflow-hidden"
              >
                {/* Circular Dial Scale Markings */}
                <svg className="absolute inset-0 size-full pointer-events-none" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="41"
                    fill="none"
                    stroke="#1c1917"
                    strokeWidth="1.5"
                    strokeDasharray="193 258"
                    strokeDashoffset="-32"
                  />
                  {Array.from({ length: 11 }).map((_, i) => {
                    const angle = -135 + i * 27;
                    const rad = (angle - 90) * (Math.PI / 180);
                    const isMajor = i % 2 === 0;
                    const len = isMajor ? 7 : 4;
                    const x1 = 50 + 41 * Math.cos(rad);
                    const y1 = 50 + 41 * Math.sin(rad);
                    const x2 = 50 + (41 - len) * Math.cos(rad);
                    const y2 = 50 + (41 - len) * Math.sin(rad);
                    return (
                      <line
                        key={i}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#1c1917"
                        strokeWidth={isMajor ? "2" : "1"}
                      />
                    );
                  })}
                  <text x="21" y="78" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">0</text>
                  <text x="14" y="52" fontSize="7" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">2</text>
                  <text x="26" y="27" fontSize="7" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">4</text>
                  <text x="74" y="27" fontSize="7" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">6</text>
                  <text x="86" y="52" fontSize="7" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">8</text>
                  <text x="79" y="78" fontSize="8" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">10</text>
                  <text x="50" y="23" fontSize="6" fontWeight="bold" fontFamily="monospace" fill="#1c1917" textAnchor="middle">VOL</text>
                </svg>

                {/* Center Bakelite Knob with Rotating Mechanical Pointer Needle */}
                <div
                  className="relative size-6 sm:size-7 rounded-full bg-[#181512] border-2 border-black shadow-md flex items-center justify-center transition-transform duration-75 pointer-events-none"
                  style={{ transform: `rotate(${knobAngle}deg)` }}
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-[2.5px] h-3.5 bg-black border-l border-amber-200 shadow-sm" />
                  <div className="absolute inset-0 rounded-full border border-amber-900/60" />
                </div>

                {/* Center Metal Cap / Mute Clicker */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    p.toggleMute();
                  }}
                  title={p.muted ? "Unmute Volume" : "Mute (Click Center)"}
                  className="absolute z-10 size-3 sm:size-3.5 rounded-full bg-[#3d2f20] hover:bg-[#523f2b] border border-amber-500/70 flex items-center justify-center cursor-pointer shadow-inner"
                >
                  {p.muted ? (
                    <VolumeX className="size-2 text-red-400" />
                  ) : (
                    <div className="size-1 rounded-full bg-amber-400" />
                  )}
                </button>
              </div>
              <span className="mt-0.5 text-[0.46rem] font-mono-ui text-amber-400/80 font-bold uppercase tracking-wider">
                {p.muted ? "MUTED" : `${p.volume}%`}
              </span>
            </div>

            {/* 5. Right Dial: ABSTIMMUNG (Tape Speed / Tuning Switch Dial) */}
            <div className="relative hidden lg:flex flex-col items-center justify-center px-0.5">
              <button
                onClick={() => setSpeedOpen((v) => !v)}
                title="ABSTIMMUNG (Tape Speed Selector)"
                className="retro-knurled-dial size-10 sm:size-11 rounded-full flex flex-col items-center justify-center text-amber-200 hover:text-amber-100 transition-transform active:scale-95 cursor-pointer relative"
              >
                <div className="size-5 rounded-full bg-[#d4af37] border border-[#5c4724] flex items-center justify-center text-[#1c1813] font-bold text-[0.55rem] font-mono-ui shadow-inner">
                  {p.playbackRate}x
                </div>
                <div className="absolute -bottom-1 text-[0.45rem] font-mono-ui text-[#d4af37] font-bold">
                  SPEED
                </div>
              </button>

              {speedOpen && (
                <div className="absolute bottom-14 right-0 z-50 flex flex-col gap-1 border border-amber-800/80 bg-[#1a140e] p-1 shadow-2xl min-w-[80px]">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        p.setPlaybackRate(rate);
                        setSpeedOpen(false);
                      }}
                      className={`px-2 py-1 text-[0.68rem] font-mono-ui text-left transition-colors cursor-pointer ${
                        p.playbackRate === rate
                          ? "bg-amber-800 text-amber-100 font-bold"
                          : "text-amber-300 hover:bg-amber-950/60"
                      }`}
                    >
                      {rate}x Speed
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Lower Authentic Piano-Key Mechanical Switches Bar (From Image 2) */}
          <div className="mt-2.5 pt-2 border-t border-[#3d2f20] flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto pb-0.5">
            {/* EJECT / QUEUE KEY */}
            <button
              onClick={() => setQueueOpen((v) => !v)}
              title="⏏ EJECT / STATION QUEUE"
              className={`retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer ${
                queueOpen ? "active-key" : ""
              }`}
            >
              <ListMusic className="size-3.5 text-zinc-900" />
              <span className="hidden sm:inline text-[0.65rem]">QUEUE</span>
              {total > 0 && (
                <span className="text-[0.60rem] bg-zinc-900 text-amber-200 px-1 font-bold">
                  {total}
                </span>
              )}
            </button>

            {/* REWIND 10s KEY */}
            <button
              onClick={() => p.skipBackward(10)}
              title="◀◀ REWIND 10 SECONDS"
              className="retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer"
            >
              <Rewind className="size-3.5 text-zinc-900" />
              <span className="hidden md:inline text-[0.65rem]">-10s</span>
            </button>

            {/* PREV STATION KEY */}
            <button
              onClick={p.prev}
              title="⏮ PREVIOUS STATION"
              className="retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer"
            >
              <SkipBack className="size-3.5 text-zinc-900" />
              <span className="hidden md:inline text-[0.65rem]">PREV</span>
            </button>

            {/* MASTER PLAY / PAUSE MECHANICAL KEY */}
            <button
              onClick={p.toggle}
              title={p.playing ? "⏸ PAUSE RECEIVER" : "▶ PLAY RECEIVER"}
              className={`retro-piano-key flex-[1.4] py-1.5 px-2.5 flex items-center justify-center gap-1.5 text-xs font-mono-ui font-bold cursor-pointer ${
                p.playing ? "active-key bg-[#dfd8c5]" : ""
              }`}
            >
              {p.playing ? (
                <>
                  <Pause className="size-4 text-zinc-950 fill-zinc-950" />
                  <span className="text-[0.70rem] tracking-wider">PAUSE</span>
                </>
              ) : (
                <>
                  <Play className="size-4 text-zinc-950 fill-zinc-950 translate-x-0.5" />
                  <span className="text-[0.70rem] tracking-wider">PLAY</span>
                </>
              )}
            </button>

            {/* NEXT STATION KEY */}
            <button
              onClick={p.next}
              title="⏭ NEXT STATION"
              className="retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer"
            >
              <SkipForward className="size-3.5 text-zinc-900" />
              <span className="hidden md:inline text-[0.65rem]">NEXT</span>
            </button>

            {/* FORWARD 10s KEY */}
            <button
              onClick={() => p.skipForward(10)}
              title="▶▶ FAST FORWARD 10 SECONDS"
              className="retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer"
            >
              <FastForward className="size-3.5 text-zinc-900" />
              <span className="hidden md:inline text-[0.65rem]">+10s</span>
            </button>

            {/* SHUFFLE TOGGLE KEY */}
            <button
              onClick={() => p.setShuffle(!p.shuffle)}
              title={p.shuffle ? "SHUFFLE ON" : "SHUFFLE OFF"}
              className={`retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer ${
                p.shuffle ? "active-key bg-[#d8f3dc] text-emerald-950 border-emerald-600" : ""
              }`}
            >
              <Shuffle className={`size-3.5 ${p.shuffle ? "text-emerald-800" : "text-zinc-900"}`} />
              <span className="hidden md:inline text-[0.65rem]">SHUF</span>
            </button>

            {/* LOOP REPEAT MODE KEY */}
            <div className="relative flex-1">
              <button
                onClick={p.toggleRepeat}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setRepeatMenuOpen((v) => !v);
                }}
                title={`REPEAT MODE: ${p.repeatMode.toUpperCase()}`}
                className={`retro-piano-key w-full py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer ${
                  p.repeatMode !== "off" ? "active-key bg-[#fee2e2] text-red-950 border-red-600" : ""
                }`}
              >
                {p.repeatMode === "one" ? (
                  <Repeat1 className="size-3.5 text-red-700" />
                ) : (
                  <Repeat className={`size-3.5 ${p.repeatMode === "all" ? "text-amber-800" : "text-zinc-900"}`} />
                )}
                <span className="hidden md:inline text-[0.65rem]">LOOP</span>
              </button>

              {repeatMenuOpen && (
                <div className="absolute bottom-12 right-0 z-50 flex flex-col gap-1 border border-amber-800 bg-[#18130e] p-1 shadow-2xl min-w-[110px]">
                  <button
                    onClick={() => {
                      p.setRepeatMode("all");
                      setRepeatMenuOpen(false);
                    }}
                    className={`px-2 py-1 text-[0.68rem] font-mono-ui text-left transition-colors cursor-pointer ${
                      p.repeatMode === "all"
                        ? "bg-amber-800 text-white font-bold"
                        : "text-amber-300 hover:bg-amber-950/60"
                    }`}
                  >
                    Repeat All
                  </button>
                  <button
                    onClick={() => {
                      p.setRepeatMode("one");
                      setRepeatMenuOpen(false);
                    }}
                    className={`px-2 py-1 text-[0.68rem] font-mono-ui text-left transition-colors cursor-pointer ${
                      p.repeatMode === "one"
                        ? "bg-amber-800 text-white font-bold"
                        : "text-amber-300 hover:bg-amber-950/60"
                    }`}
                  >
                    Repeat One
                  </button>
                  <button
                    onClick={() => {
                      p.setRepeatMode("off");
                      setRepeatMenuOpen(false);
                    }}
                    className={`px-2 py-1 text-[0.68rem] font-mono-ui text-left transition-colors cursor-pointer ${
                      p.repeatMode === "off"
                        ? "bg-amber-800 text-white font-bold"
                        : "text-amber-300 hover:bg-amber-950/60"
                    }`}
                  >
                    Repeat Off
                  </button>
                </div>
              )}
            </div>

            {/* CRT MONITOR FEED TOGGLE KEY */}
            <button
              onClick={() => setEmbedOpen((v) => !v)}
              title="📺 CRT MONITOR VIDEO FEED"
              className={`retro-piano-key flex-1 py-1.5 px-2 flex items-center justify-center gap-1 text-xs font-mono-ui font-bold cursor-pointer ${
                embedOpen ? "active-key" : ""
              }`}
            >
              <Tv className="size-3.5 text-zinc-900" />
              <span className="hidden md:inline text-[0.65rem]">CRT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
