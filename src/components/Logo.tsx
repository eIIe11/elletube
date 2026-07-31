/* eslint-disable @next/next/no-img-element */

/** The BooTube bear. A plain <img> so it renders identically in nav, splash and OG. */
export function Logo({ size = 32 }: { size?: number; animated?: boolean }) {
  return (
    <img
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className="shrink-0 select-none object-contain"
      style={{ width: size, height: size }}
    />
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      Boo
      <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
        Tube
      </span>
    </span>
  );
}
