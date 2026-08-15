import { useCallback, useEffect, useRef, useState } from "react";

export const PLAYLIST_ID = "PLLfbObQLXADU";

export type RepeatMode = "off" | "all" | "one";

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
  stopVideo: () => void;
  nextVideo: () => void;
  previousVideo: () => void;
  loadVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  cueVideoById: (options: { videoId: string; startSeconds?: number }) => void;
  seekTo: (seconds: number, allow: boolean) => void;
  setVolume: (v: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaylist: () => string[] | null;
  getPlaylistIndex: () => number;
  playVideoAt: (index: number) => void;
  getVideoData: () => { title?: string; author?: string; video_id?: string };
};

interface YTGlobal {
  Player: new (
    elementId: string,
    config: {
      height?: string;
      width?: string;
      playerVars?: Record<string, unknown>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}

declare global {
  interface Window {
    YT?: YTGlobal;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT?.Player) return resolve();
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

type Meta = { title?: string; author?: string; thumbnail_url?: string };

export async function fetchMeta(videoId: string): Promise<Meta> {
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
    );
    if (!res.ok) return {};
    const json = (await res.json()) as {
      title?: string;
      author_name?: string;
      thumbnail_url?: string;
    };
    return {
      title: json.title,
      author: json.author_name,
      thumbnail_url: json.thumbnail_url,
    };
  } catch {
    return {};
  }
}

export function extractYouTubeId(urlOrId: string): string | null {
  const trimmed = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const match = trimmed.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

export function useYouTubePlaylist() {
  const playerRef = useRef<YTPlayer | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [index, setIndex] = useState(0);
  const [tracks, setTracks] = useState<Track[]>([
    {
      videoId: "W_jLgW3t3hY",
      title: "Asfar Hussain | Nahin Milta",
      author: "Walnut Studios",
      thumbnail: "https://i.ytimg.com/vi/W_jLgW3t3hY/hqdefault.jpg",
      duration: 282,
    },
  ]);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(282);
  const [muted, setMuted] = useState(false);
  const [volume, setVolumeState] = useState(100);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("all");
  const [playbackRate, setPlaybackRateState] = useState(1);

  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;

  const indexRef = useRef(index);
  indexRef.current = index;

  const repeatModeRef = useRef<RepeatMode>(repeatMode);
  repeatModeRef.current = repeatMode;

  const shuffleRef = useRef<boolean>(shuffle);
  shuffleRef.current = shuffle;

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
        author: "RMDU Special",
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
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
              if (t) {
                copy[at] = {
                  ...t,
                  title: m.title || t.title,
                  author: m.author || t.author,
                  thumbnail:
                    m.thumbnail_url || `https://i.ytimg.com/vi/${t.videoId}/hqdefault.jpg`,
                };
              }
            });
            return copy;
          });
        }
      })();
      return next;
    });
  }, []);

  const playAt = useCallback((targetIndex: number) => {
    const currentTracks = tracksRef.current;
    if (targetIndex < 0 || targetIndex >= currentTracks.length) return;
    const targetTrack = currentTracks[targetIndex];
    setIndex(targetIndex);
    const p = playerRef.current;
    if (p && targetTrack) {
      p.loadVideoById({ videoId: targetTrack.videoId, startSeconds: 0 });
      setPlaying(true);
    }
  }, []);

  const next = useCallback(() => {
    const currentTracks = tracksRef.current;
    const currentIndex = indexRef.current;
    if (!currentTracks.length) return;

    if (shuffleRef.current && currentTracks.length > 1) {
      let r = currentIndex;
      while (r === currentIndex) {
        r = Math.floor(Math.random() * currentTracks.length);
      }
      playAt(r);
      return;
    }

    if (currentIndex < currentTracks.length - 1) {
      playAt(currentIndex + 1);
    } else if (repeatModeRef.current === "all") {
      playAt(0);
    }
  }, [playAt]);

  const prev = useCallback(() => {
    const currentTracks = tracksRef.current;
    const currentIndex = indexRef.current;
    if (!currentTracks.length) return;

    if (time > 3) {
      playerRef.current?.seekTo(0, true);
      return;
    }

    if (currentIndex > 0) {
      playAt(currentIndex - 1);
    } else if (repeatModeRef.current === "all") {
      playAt(currentTracks.length - 1);
    }
  }, [playAt, time]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let disposed = false;

    void loadApi().then(() => {
      if (disposed) return;
      const YT = window.YT;
      if (!YT) return;

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
            playerRef.current = player;
            setReady(true);
            syncPlaylist();
          },
          onStateChange: (e: { data: number }) => {
            // 1 = PLAYING, 2 = PAUSED, 0 = ENDED, 3 = BUFFERING
            if (e.data === 1) {
              setPlaying(true);
            } else if (e.data === 2) {
              setPlaying(false);
            } else if (e.data === 0) {
              // Video Ended
              const currentRepeat = repeatModeRef.current;
              if (currentRepeat === "one") {
                playerRef.current?.seekTo(0, true);
                playerRef.current?.playVideo();
              } else {
                next();
              }
            }

            const p = playerRef.current;
            if (!p) return;
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

        // Update current track duration
        const curIdx = indexRef.current;
        if (curIdx >= 0 && d > 0) {
          setTracks((cur) => {
            const t = cur[curIdx];
            if (!t || t.duration === Math.round(d)) return cur;
            const copy = [...cur];
            copy[curIdx] = { ...t, duration: Math.round(d) };
            return copy;
          });
        }
      }, 500);
    });

    return () => {
      disposed = true;
      if (interval) clearInterval(interval);
    };
  }, [syncPlaylist, next]);

  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) {
      p.pauseVideo();
    } else {
      if (!tracks.length) return;
      p.playVideo();
    }
  }, [playing, tracks.length]);

  const seek = useCallback((s: number) => {
    playerRef.current?.seekTo(s, true);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(100, v));
    setVolumeState(clamped);
    const p = playerRef.current;
    if (p) {
      p.setVolume(clamped);
      if (clamped === 0) {
        p.mute();
        setMuted(true);
      } else {
        p.unMute();
        setMuted(false);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    setMuted((m) => {
      if (m) {
        p.unMute();
        if (volume === 0) {
          setVolumeState(50);
          p.setVolume(50);
        }
      } else {
        p.mute();
      }
      return !m;
    });
  }, [volume]);

  const setPlaybackRate = useCallback((rate: number) => {
    setPlaybackRateState(rate);
    playerRef.current?.setPlaybackRate(rate);
  }, []);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "off") return "all";
      if (prev === "all") return "one";
      return "off";
    });
  }, []);

  const moveTrack = useCallback((fromIndex: number, toIndex: number) => {
    setTracks((prev) => {
      if (
        fromIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex < 0 ||
        toIndex >= prev.length ||
        fromIndex === toIndex
      ) {
        return prev;
      }
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);

      // Adjust index
      setIndex((cur) => {
        if (cur === fromIndex) return toIndex;
        if (fromIndex < cur && toIndex >= cur) return cur - 1;
        if (fromIndex > cur && toIndex <= cur) return cur + 1;
        return cur;
      });

      return copy;
    });
  }, []);

  const removeTrack = useCallback(
    (targetIndex: number) => {
      setTracks((prev) => {
        if (targetIndex < 0 || targetIndex >= prev.length) return prev;
        const copy = prev.filter((_, i) => i !== targetIndex);

        setIndex((cur) => {
          if (copy.length === 0) {
            playerRef.current?.stopVideo();
            setPlaying(false);
            return 0;
          }
          if (targetIndex === cur) {
            const nextIdx = targetIndex >= copy.length ? 0 : targetIndex;
            const nextTrack = copy[nextIdx];
            if (nextTrack) {
              playerRef.current?.loadVideoById({
                videoId: nextTrack.videoId,
                startSeconds: 0,
              });
            }
            return nextIdx;
          }
          if (targetIndex < cur) {
            return cur - 1;
          }
          return cur;
        });

        return copy;
      });
    },
    [],
  );

  const addTrack = useCallback(
    async (urlOrId: string): Promise<boolean> => {
      const videoId = extractYouTubeId(urlOrId);
      if (!videoId) return false;

      const meta = await fetchMeta(videoId);
      const newTrack: Track = {
        videoId,
        title: meta.title || `Track ${tracks.length + 1}`,
        author: meta.author || "RMDU Special",
        thumbnail:
          meta.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        duration: 0,
      };

      setTracks((prev) => [...prev, newTrack]);
      return true;
    },
    [tracks.length],
  );

  const clearQueue = useCallback(() => {
    setTracks([]);
    setIndex(0);
    playerRef.current?.stopVideo();
    setPlaying(false);
  }, []);

  const resetQueue = useCallback(() => {
    syncPlaylist();
  }, [syncPlaylist]);

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
    volume,
    shuffle,
    repeatMode,
    playbackRate,
    setShuffle,
    setRepeatMode,
    toggleRepeat,
    setVolume,
    setPlaybackRate,
    toggle,
    next,
    prev,
    playAt,
    seek,
    toggleMute,
    moveTrack,
    removeTrack,
    addTrack,
    clearQueue,
    resetQueue,
  };
}

export function fmt(sec: number) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
