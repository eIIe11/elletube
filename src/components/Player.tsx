"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  title: string;
  storageKey?: string;
  poster?: string;
  live?: boolean;
};

const RESUME_PREFIX = "elletube:progress:";

export function Player({ src, title, storageKey, poster, live = false }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Attach the stream: native HLS where supported, hls.js elsewhere, plain file otherwise.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setError(null);
    setReady(false);

    const isHls = src.includes(".m3u8");
    let destroy: (() => void) | undefined;

    if (!isHls || video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
    } else {
      let cancelled = false;
      import("hls.js").then(({ default: Hls }) => {
        if (cancelled || !Hls.isSupported()) {
          if (!cancelled) setError("This browser cannot play the stream.");
          return;
        }
        const hls = new Hls({
          lowLatencyMode: live,
          enableWorker: true,
          backBufferLength: live ? 30 : 90,
          maxBufferLength: 30,
        });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setError("This stream is unavailable right now.");
        });
        destroy = () => hls.destroy();
      });
      return () => {
        cancelled = true;
        destroy?.();
      };
    }

    return () => {
      destroy?.();
    };
  }, [src, live]);

  // Resume position for on-demand titles.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !storageKey || live) return;
    const key = RESUME_PREFIX + storageKey;

    const onLoaded = () => {
      const saved = Number(localStorage.getItem(key) ?? 0);
      if (saved > 30 && video.duration && saved < video.duration - 60) {
        video.currentTime = saved;
      }
      setReady(true);
    };
    const onTime = () => {
      if (video.currentTime > 15) {
        localStorage.setItem(key, String(Math.floor(video.currentTime)));
      }
    };
    const onEnded = () => localStorage.removeItem(key);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("ended", onEnded);
    };
  }, [storageKey, live]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const video = videoRef.current;
      if (!video) return;
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      )
        return;
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          if (video.paused) void video.play();
          else video.pause();
          break;
        case "ArrowRight":
          video.currentTime += e.shiftKey ? 30 : 10;
          break;
        case "ArrowLeft":
          video.currentTime -= e.shiftKey ? 30 : 10;
          break;
        case "ArrowUp":
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case "ArrowDown":
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case "m":
          video.muted = !video.muted;
          break;
        case "f":
          if (document.fullscreenElement) void document.exitFullscreen();
          else void video.parentElement?.requestFullscreen();
          break;
        case "p":
          if (document.pictureInPictureElement) void document.exitPictureInPicture();
          else void video.requestPictureInPicture?.();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
      <video
        ref={videoRef}
        controls
        autoPlay
        playsInline
        poster={poster}
        preload="metadata"
        title={title}
        className="h-full w-full bg-black"
        onCanPlay={() => setReady(true)}
        onError={() => setError("This title could not be loaded.")}
      />
      {!ready && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-white/20 border-t-[var(--accent)]" />
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 px-6 text-center">
          <p className="text-sm text-ink/85">{error}</p>
          <p className="text-xs text-muted">
            Open streams occasionally go offline. Try another title or channel.
          </p>
        </div>
      )}
    </div>
  );
}
