export function Logo({ size = 32, animated = true }: { size?: number; animated?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="et-grad" x1="0" y1="0" x2="48" y2="48">
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-2)" />
        </linearGradient>
      </defs>
      <rect x="2" y="6" width="44" height="36" rx="11" fill="url(#et-grad)" />
      <rect x="6" y="10" width="36" height="28" rx="8" fill="#07070a" opacity="0.82" />
      <path d="M20 18.5v11l9.5-5.5-9.5-5.5Z" fill="#fff">
        {animated && (
          <animate
            attributeName="opacity"
            values="1;0.55;1"
            dur="2.6s"
            repeatCount="indefinite"
          />
        )}
      </path>
      <circle cx="24" cy="44.5" r="1.6" fill="url(#et-grad)" />
    </svg>
  );
}

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      Elle
      <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
        Tube
      </span>
    </span>
  );
}
