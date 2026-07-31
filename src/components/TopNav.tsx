"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Shuffle } from "lucide-react";
import { Logo, Wordmark } from "./Logo";
import { SearchOverlay } from "./SearchOverlay";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/live", label: "Live TV" },
  { href: "/time-machine", label: "Time Machine" },
  { href: "/mood", label: "Mood" },
  { href: "/roulette", label: "Roulette" },
  { href: "/my-list", label: "My List" },
];

export function TopNav() {
  const pathname = usePathname();
  const [solid, setSolid] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        solid ? "bg-bg/85 backdrop-blur-xl" : "bg-gradient-to-b from-black/70 to-transparent"
      }`}
    >
      <nav className="flex items-center gap-3 px-4 py-3 sm:gap-6 sm:px-8">
        <Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
          <Logo size={28} />
          <Wordmark className="text-lg" />
        </Link>

        <ul className="ml-2 hidden items-center gap-1 text-sm sm:flex">
          {LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition-colors ${
                    active ? "bg-white/12 text-ink" : "text-muted hover:text-ink"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/roulette"
            aria-label="Surprise me"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/8 text-muted transition-all hover:rotate-180 hover:bg-white/15 hover:text-ink"
          >
            <Shuffle size={16} />
          </Link>
          <SearchOverlay />
        </div>
      </nav>

      <ul className="flex gap-1 overflow-x-auto px-4 pb-2 text-xs sm:hidden">
        {LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="rounded-full bg-white/8 px-3 py-1.5 text-muted"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}
