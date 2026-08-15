import { useCallback, useEffect, useRef, useState } from "react";

export const PLAYLIST_ID = "PLLfbObQLXADU";

export type Track = {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: number;
};

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  seekTo: (seconds: number, allow: boolean) => void;
  setVolume: (v: number) => void;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaylist: () => string[] | null;
  getPlaylistIndex: () => number;
  playVideoAt: (index: number) => void;
  getVideoData: () => { title?: string; author?: string; video_id?: string };
};

declare global {
  interface Window {
    YT?: unknown;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadApi(): Promise<void> {
  return new Promise((resolve) => {
    const w = window as unknown as { YT?: { Player?: unknown } };
    if (w.YT?.Player) return resolve();
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (!document.getElementById("yt-iframe-api")) {
      const s = document.createElement("script");
      s.id = "yt-iframe-api";
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

type Meta = { title?: string | undefined; author?: string | undefined };

async function fetchMeta(videoId: string): Promise<Meta> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
    );
    if (!res.ok) return {};
    const json = (await res.json()) as { title?: string; author_name?: string };
    return { title: json.title, author: json.author_name };
  } catch {
    return {};
  }
}

export function useYouTubePlaylist() {
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  const syncPlaylist = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const ids = p.getPlaylist() ?? [];
    if (!ids.length) return;
    setTracks((prev) => {
      if (prev.length === ids.length && prev[0]?.videoId === ids[0]) return prev;
      const next: Track[] = ids.map((id, i) => ({
        videoId: id,
        title: `Track ${i + 1}`,
        author: "R.M.D.U _003",
        thumbnail: `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        duration: 0,
      }));
      void (async () => {
        for (let i = 0; i < ids.length; i += 6) {
          const slice = ids.slice(i, i + 6);
          const metas = await Promise.all(slice.map((id) => fetchMeta(id)));
          setTracks((cur) => {
            const copy = [...cur];
            metas.forEach((m, j) => {
              const at = i + j;
              const t = copy[at];
              if (t && m.title) {
                copy[at] = { ...t, title: m.title, author: m.author ?? t.author };
              }
            });
            return copy;
          });
        }
      })();
      return next;
    });
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let disposed = false;

    void loadApi().then(() => {
      if (disposed) return;
      const YT = (window as unknown as { YT: any }).YT;
      const player = new YT.Player("yt-player-host", {
        height: "180",
        width: "320",
        playerVars: {
          listType: "playlist",
          list: PLAYLIST_ID,
          autoplay: 0,
          controls: 0,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            playerRef.current = player as YTPlayer;
            setReady(true);
            syncPlaylist();
          },
          onStateChange: (e: { data: number }) => {
            setPlaying(e.data === 1);
            const p = playerRef.current;
            if (!p) return;
            syncPlaylist();
            setIndex(p.getPlaylistIndex());
            setDuration(p.getDuration() || 0);
          },
        },
      });

      interval = setInterval(() => {
        const p = playerRef.current;
        if (!p) return;
        setTime(p.getCurrentTime() || 0);
        const d = p.getDuration() || 0;
        setDuration(d);
        setIndex(p.getPlaylistIndex());
        setTracks((cur) => {
          const i = p.getPlaylistIndex();
          const t = cur[i];
          if (i < 0 || !t || !d || t.duration === Math.round(d)) return cur;
          const copy = [...cur];
          copy[i] = { ...t, duration: Math.round(d) };
          return copy;
        });
      }, 500);
    });

    return () => {
      disposed = true;
      if (interval) clearInterval(interval);
    };
  }, [syncPlaylist]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo();
    else p.playVideo();
  }, [playing]);

  const next = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (shuffle && tracks.length > 1) {
      let r = index;
      while (r === index) r = Math.floor(Math.random() * tracks.length);
      p.playVideoAt(r);
    } else p.nextVideo();
  }, [shuffle, tracks.length, index]);

  const prev = useCallback(() => playerRef.current?.previousVideo(), []);
  const playAt = useCallback((i: number) => playerRef.current?.playVideoAt(i), []);
  const seek = useCallback((s: number) => playerRef.current?.seekTo(s, true), []);
  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    setMuted((m) => {
      if (m) p.unMute();
      else p.mute();
      return !m;
    });
  }, []);

  const current = tracks[index];

  return {
    ready,
    playing,
    tracks,
    index,
    current,
    time,
    duration,
    muted,
    shuffle,
    setShuffle,
    toggle,
    next,
    prev,
    playAt,
    seek,
    toggleMute,
  };
}

export function fmt(sec: number) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
