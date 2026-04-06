"use client";
import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { NFTCard } from '@/components/NFTCard';
import { useMarket } from '@/context/MarketContext';
import { HeroSection } from '@/components/hero/HeroSection';

export default function Home() {
  const { nfts } = useMarket();

  const availableNFTs = nfts.filter(nft => nft.status === 'available' || !nft.status);
  const trendingNFTs  = [...availableNFTs].sort((a, b) => b.price - a.price).slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">

      {/* ── 3D Animated Hero ───────────────────────────── */}
      <HeroSection />

      {/* ── Trending Section ───────────────────────────── */}
      <section className="container mx-auto px-4 py-20 sm:px-6 lg:px-8 mt-12 bg-indigo-muted/5 rounded-3xl border border-indigo-muted/20">
        <div className="flex justify-between items-end mb-10 border-b border-indigo-muted/40 pb-4">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-gold drop-shadow-sm">Trending Masterpieces</h2>
            <p className="text-ivory/70 mt-2">The most sought-after painterly pieces this week</p>
          </div>
          <Link href="/explore">
            <Button variant="ghost" className="hidden sm:flex group text-ivory">
              View All <span className="ml-2 group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8 auto-rows-max min-h-[400px]">
          {trendingNFTs.length > 0 ? trendingNFTs.map(nft => (
            <NFTCard key={nft.id} id={nft.id} title={nft.title} creator={nft.creator} price={nft.price} imageUrl={nft.image} />
          )) : (
            <div className="col-span-full py-10 text-center text-ivory/50">
              No trending items to show at the moment.
            </div>
          )}
        </div>
        <div className="mt-8 sm:hidden">
          <Link href="/explore">
            <Button variant="outline" className="w-full">View All Actions</Button>
          </Link>
        </div>
      </section>

      {/* ── Drops / Top Collections ────────────────────── */}
      <section className="mt-20 border-y border-indigo-muted/30 bg-[#0c1b33]/40 backdrop-blur-sm py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold text-gold drop-shadow-sm mb-8">Notable Exhibitions</h2>
              <div className="space-y-6">
                <div className="text-ivory/40 border border-indigo-muted/30 border-dashed rounded-xl p-8 flex items-center justify-center min-h-[150px]">
                  No active exhibitions currently scheduled.
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold text-gold drop-shadow-sm mb-8">Top Artists</h2>
              <div className="bg-[#0c1b33]/60 rounded-2xl border border-indigo-muted/50 overflow-hidden shadow-painting p-8 text-center min-h-[250px] flex items-center justify-center">
                <p className="text-ivory/40">Artist leaderboard data is currently gathering...</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
