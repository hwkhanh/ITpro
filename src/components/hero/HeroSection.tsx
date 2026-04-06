"use client";

import React, { useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useMarket } from "@/context/MarketContext";

const VIDEO_URL =
  "https://kzutwmptkifbxkmzfxxk.supabase.co/storage/v1/object/public/Auraart/131539-750733744.mp4";

/* ── Particles ─────────────────────────────────────────── */
const DOTS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  s: 3 + (i % 4) * 1.8,
  l: `${(i * 6.2 + 4) % 92}%`,
  b: `${(i * 8 + 6) % 55}%`,
  d: `${5 + (i % 4) * 1.4}s`,
  delay: `${(i * 0.45) % 5}s`,
}));

function Particles() {
  return (
    <>
      {DOTS.map((p) => (
        <span key={p.id} className="hero-particle"
          style={{ width: p.s, height: p.s, left: p.l, bottom: p.b, animationDuration: p.d, animationDelay: p.delay }} />
      ))}
    </>
  );
}

/* ── 3D NFT Card ───────────────────────────────────────── */
function Card3D() {
  const { nfts } = useMarket();
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);

  const avail = nfts.filter((n) => n.status === "available" || !n.status);
  const feat = [...avail].sort(
    (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
  )[0];

  const title = feat?.title ?? "Madonna of the Astral Bloom";
  const price = feat?.price ?? 4.5;
  const artist = feat?.creator ?? "0x7E1A…A9F4";
  const image = feat?.image ?? "https://images.unsplash.com/photo-1618365908648-e71bd5716cba?auto=format&fit=crop&q=80&w=800";
  const href = feat ? `/nft/${feat.id}` : "/explore";
  const buy = feat ? `/checkout?direct=${feat.id}` : "/checkout";

  const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const wrap = wrapRef.current, inner = innerRef.current;
    if (!wrap || !inner) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const r = wrap.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
      const dy = (e.clientY - r.top - r.height / 2) / (r.height / 2);
      inner.style.transform = `rotateX(${-dy * 12}deg) rotateY(${dx * 12}deg) translateZ(18px)`;
      inner.style.boxShadow = `${-dx * 18}px ${dy * 8}px 50px rgba(247,208,2,${0.1 + Math.abs(dx) * 0.22}), 0 24px 60px rgba(0,0,0,0.85)`;
    });
  }, []);

  const onLeave = useCallback(() => {
    const inner = innerRef.current;
    if (inner) { inner.style.transform = ""; inner.style.boxShadow = ""; }
  }, []);

  return (
    <div ref={wrapRef} className="card-3d-wrapper w-full" onMouseMove={onMove} onMouseLeave={onLeave}>
      {/* Orbit dots */}
      <div className="absolute -inset-8 pointer-events-none" aria-hidden>
        <div className="orbit-dot" style={{ animationDuration: "9s" }} />
        <div className="orbit-dot" style={{ animationDuration: "9s", animationDelay: "-4.5s", background: "#F9A03F", boxShadow: "0 0 8px rgba(249,160,63,0.85)" }} />
      </div>

      <div ref={innerRef} className="card-3d-inner rounded-2xl overflow-hidden card-glow-pulse">
        <div className="card-float">
          {/* Artwork */}
          <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
            <Link href={href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image} alt={title} loading="lazy"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110 cursor-pointer" />
            </Link>
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(135deg,rgba(255,255,255,0.1) 0%,transparent 55%,rgba(0,0,0,0.15) 100%)", zIndex: 2 }} />
            {/* AI badge */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-gold/40 rounded-full px-3 py-1 overflow-hidden" style={{ zIndex: 10 }}>
              <div className="badge-sweep-inner" />
              <span className="relative z-10 text-[10px] font-bold text-gold uppercase tracking-widest">✦ AI·Secured</span>
            </div>
            {/* Live */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm border border-white/15 rounded-full px-2.5 py-1" style={{ zIndex: 10 }}>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              <span className="text-[10px] font-medium text-white/70 uppercase tracking-widest">Live</span>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gradient-to-b from-[#08101f] to-[#030712] border-t border-white/10 px-4 py-4">
            <div className="flex items-start justify-between mb-2.5">
              <div className="min-w-0 flex-1">
                <h3 className="font-serif text-base font-bold text-ivory leading-snug truncate">{title}</h3>
                <p className="text-muted-foreground text-[11px] mt-0.5 truncate">
                  by {artist.length > 20 ? artist.substring(0, 18) + "…" : artist}
                </p>
              </div>
              <span className="ml-2 mt-0.5 flex-shrink-0 h-5 w-5 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <svg className="h-2.5 w-2.5" viewBox="0 0 12 12" fill="none" stroke="#F7D002" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 6l3 3 5-5" />
                </svg>
              </span>
            </div>
            <div className="flex items-center justify-between pt-2.5 border-t border-white/8">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-0.5">Price</p>
                <p className="gold-shimmer-text font-bold text-lg leading-none">{price} ETH</p>
              </div>
              <Link href={buy}>
                <Button variant="gold" className="rounded-full text-sm font-bold px-5 py-2 shadow-glow-gold hover:shadow-glow-gold-lg">
                  Acquire
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Stat ─────────────────────────────────────────────── */
function Stat({ value, label, delay }: { value: string | number; label: string; delay: string }) {
  return (
    <div className="stat-num" style={{ animationDelay: delay }}>
      <p className="font-serif font-bold text-gold leading-none" style={{ fontSize: "clamp(1.4rem, 2vw, 1.8rem)" }}>{value}</p>
      <p style={{ fontSize: "11px", fontWeight: 500, color: "rgba(253,251,247,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: "0.25rem" }}>{label}</p>
    </div>
  );
}

/* ── MAIN ─────────────────────────────────────────────── */
export function HeroSection() {
  const { nfts } = useMarket();
  const bgRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number>(0);

  const artworkCount = nfts.length;
  const artistCount = Array.from(new Set(nfts.map((n) => n.creator))).length;
  const soldCount = nfts.filter((n) => n.status === "sold").length;

  /* Subtle background parallax */
  const onMouseMove = useCallback((e: MouseEvent) => {
    const bg = bgRef.current;
    if (!bg) return;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const dx = (e.clientX / window.innerWidth - 0.5) * 18;
      const dy = (e.clientY / window.innerHeight - 0.5) * 10;
      bg.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
    });
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(raf.current);
    };
  }, [onMouseMove]);

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "calc(100vh - 80px)" }}>

      {/* ── Video (parallax wrapper) ───────────────── */}
      <div ref={bgRef} className="absolute will-change-transform" style={{ inset: "-4%", transition: "transform 0.09s linear" }}>
        <video autoPlay loop muted playsInline preload="auto" className="w-full h-full object-cover"
          style={{ filter: "brightness(0.50) saturate(1.1)" }}>
          <source src={VIDEO_URL} type="video/mp4" />
        </video>
      </div>

      {/* ── Vignette: left side CLEAR, only right + top/bottom darkened ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        zIndex: 1,
        background: `
          linear-gradient(to right, transparent 48%, rgba(3,7,18,0.60) 100%),
          linear-gradient(to top,   rgba(3,7,18,0.88) 0%, transparent 22%),
          linear-gradient(to bottom,rgba(3,7,18,0.46) 0%, transparent 16%)
        `,
      }} />

      {/* ── Particles ─────────────────────────────── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <Particles />
      </div>

      {/* ── Content ───────────────────────────────── */}
      {/*
        Pure inline-flex row. No Tailwind grid — cannot break.
        Left col flex:1 (grows), Right col fixed clamp width.
      */}
      <div className="relative" style={{ zIndex: 10, minHeight: "calc(100vh - 80px)", display: "flex", alignItems: "center" }}>
        <div style={{
          width: "100%",
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "clamp(2rem, 5vh, 4rem) clamp(1.5rem, 5vw, 5rem)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "clamp(2rem, 5vw, 4rem)",
        }}>

          {/* ── LEFT: text ────────────────────────── */}
          <div style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", gap: "1.2rem" }}>

            {/* Eyebrow */}
            <div className="hero-fade-1 inline-flex self-start items-center gap-2 bg-gold/10 border border-gold/35 backdrop-blur-sm rounded-full px-4 py-1.5 overflow-hidden relative">
              <div className="badge-sweep-inner" />
              <span className="relative z-10 font-bold text-gold uppercase" style={{ fontSize: "11px", letterSpacing: "0.13em" }}>
                ✦ AI-Secured Gallery · Season 2026
              </span>
            </div>

            {/* Headline */}
            <h1 className="hero-fade-2 font-serif font-black" style={{ fontSize: "clamp(2rem, 3.2vw, 3.8rem)", lineHeight: 1.06, color: "#FDFBF7", margin: 0 }}>
              Collect <span className="gold-shimmer-text italic">Eternal</span>
              <br />Digital Beauty
            </h1>

            {/* Tagline */}
            <p className="hero-fade-3" style={{ fontSize: "clamp(0.82rem, 1.05vw, 0.98rem)", lineHeight: 1.75, color: "rgba(253,251,247,0.62)", maxWidth: "440px", margin: 0 }}>
              Where Starry Night elegance meets the future of cryptography. Aura is the
              premier AI-secured gallery for authenticated digital masterpieces, verified
              and protected beyond the visible spectrum.
            </p>

            {/* CTAs */}
            <div className="hero-fade-4" style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
              <Link href="/explore">
                <Button variant="default" size="lg"
                  className="rounded-full font-bold shadow-glow-gold hover:shadow-glow-gold-lg hover:scale-[1.04] transition-all duration-200"
                  style={{ padding: "0.8rem 1.75rem", fontSize: "0.875rem" }}>
                  Explore Gallery
                </Button>
              </Link>
              <Link href="/create">
                <Button variant="outline" size="lg"
                  className="rounded-full border-gold/45 text-gold hover:bg-gold/10 hover:border-gold/70 hover:scale-[1.04] backdrop-blur-sm transition-all duration-200"
                  style={{ padding: "0.8rem 1.75rem", fontSize: "0.875rem" }}>
                  Create Art
                </Button>
              </Link>
            </div>

            {/* Trust */}
            <div className="hero-fade-4" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.4rem 0.7rem", fontSize: "11px", color: "rgba(253,251,247,0.36)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <svg style={{ width: 11, height: 11, fill: "#F7D002" }} viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 1a9 9 0 100 18A9 9 0 0010 1zm3.83 5.41L9 11.24 6.17 8.41a1 1 0 00-1.41 1.41l3.5 3.5a1 1 0 001.41 0l5.5-5.5a1 1 0 00-1.41-1.41z" clipRule="evenodd" />
                </svg>
                Steganography Protected
              </span>
              <span style={{ width: 1, height: 11, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                <svg style={{ width: 11, height: 11, color: "#F7D002" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Blockchain Verified
              </span>
              <span style={{ width: 1, height: 11, background: "rgba(255,255,255,0.15)", display: "inline-block" }} />
              <span>GradientBoosting AI</span>
            </div>

            {/* Stats */}
            <div className="hero-fade-5" style={{ display: "flex", alignItems: "center", gap: "1.5rem", paddingTop: "1.2rem", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
              <Stat value={artworkCount || "–"} label="Artworks" delay="0.9s" />
              <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.1)" }} />
              <Stat value={artistCount || "–"} label="Artists" delay="1.1s" />
              <div style={{ width: 1, height: 30, background: "rgba(255,255,255,0.1)" }} />
              <Stat value={soldCount} label="Sold" delay="1.3s" />
            </div>
          </div>

          {/* ── RIGHT: card (fixed width) ──────────── */}
          <div style={{ flexShrink: 0, width: "clamp(210px, 26vw, 300px)", position: "relative" }}>
            <div style={{ position: "absolute", inset: "-1.5rem", background: "radial-gradient(circle, rgba(247,208,2,0.11), rgba(42,59,92,0.14))", filter: "blur(48px)", borderRadius: "50%", pointerEvents: "none" }} />
            <Card3D />
          </div>

        </div>
      </div>

      {/* ── Bottom fade ───────────────────────────── */}
      <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ height: "6rem", zIndex: 3, background: "linear-gradient(to bottom, transparent, #030712)" }} />
    </section>
  );
}
