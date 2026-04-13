"use client";
import React, { useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { NFTCard } from '@/components/NFTCard';
import { useMarket } from '@/context/MarketContext';
import { HeroSection } from '@/components/hero/HeroSection';

export default function Home() {
  const { nfts } = useMarket();

  const availableNFTs = nfts.filter(nft => nft.status === 'available' || !nft.status);
  const trendingNFTs  = [...availableNFTs].sort((a, b) => b.price - a.price).slice(0, 4);

  // Derive Notable Exhibitions
  const collectionsData = useMemo(() => {
    const map = new Map<string, { count: number; image: string }>();
    nfts.forEach(nft => {
        const colName = nft.collection || "AuraArt Originals";
        const existing = map.get(colName);
        if (existing) {
            existing.count += 1;
        } else {
            map.set(colName, { count: 1, image: nft.image });
        }
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [nfts]);

  // Derive Top Artists
  const artistsData = useMemo(() => {
    const map = new Map<string, { count: number; volume: number }>();
    nfts.forEach(nft => {
        if (!nft.creator) return;
        const existing = map.get(nft.creator);
        if (existing) {
            existing.count += 1;
            existing.volume += nft.price;
        } else {
            map.set(nft.creator, { count: 1, volume: nft.price });
        }
    });
    return Array.from(map.entries())
      .map(([address, data]) => ({ address, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 4);
  }, [nfts]);

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
      <section className="mt-20 border-y border-indigo-muted/30 bg-[#0c1b33]/40 backdrop-blur-sm py-20 shadow-painting">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-16">
            
            {/* Notable Exhibitions */}
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold text-gold drop-shadow-sm mb-8">Notable Exhibitions</h2>
              
              {collectionsData.length > 0 ? (
                <div className="space-y-4">
                  {collectionsData.map((col, i) => (
                    <div key={i} className="flex gap-5 p-4 rounded-2xl border border-indigo-muted/30 bg-[#0c1b33]/60 hover:bg-indigo-muted/20 hover:border-gold/30 transition-all duration-300 group cursor-pointer shadow-sm">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 overflow-hidden rounded-xl border border-ivory/10">
                        <img src={col.image} alt={col.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                        <h3 className="text-xl font-serif text-ivory font-bold group-hover:text-gold transition-colors">{col.name}</h3>
                        <p className="text-sm text-ivory/60 mt-1">{col.count} Masterpiece{col.count > 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center text-gold/60 group-hover:text-gold pr-4">
                        <span className="group-hover:translate-x-2 transition-transform">&rarr;</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-ivory/40 border border-indigo-muted/30 border-dashed rounded-xl p-8 flex items-center justify-center min-h-[150px]">
                  No active exhibitions currently scheduled.
                </div>
              )}
            </div>

            {/* Top Artists */}
            <div className="flex-1">
              <h2 className="font-serif text-3xl font-bold text-gold drop-shadow-sm mb-8">Top Artists</h2>
              
              <div className="bg-[#0c1b33]/60 rounded-2xl border border-indigo-muted/50 overflow-hidden shadow-painting p-6">
                {artistsData.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {artistsData.map((artist, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-indigo-muted/30">
                        <div className="w-8 h-8 rounded-full bg-navy-light/50 flex items-center justify-center font-bold text-gold shrink-0 border border-gold/20 shadow-glow-gold">
                            {idx + 1}
                        </div>
                        
                        {/* CSS-Gradient Avatar instead of fixed images */}
                        <div 
                          className="w-12 h-12 rounded-full shadow-sm shrink-0"
                          style={{
                              background: `linear-gradient(135deg, #${artist.address.substring(2,8)}, #${artist.address.substring(artist.address.length - 6)})`
                          }}
                        />
                        
                        <div className="flex-1 overflow-hidden">
                            <p className="text-ivory font-medium font-mono text-sm truncate">{artist.address.substring(0,6)}...{artist.address.substring(artist.address.length-4)}</p>
                            <p className="text-xs text-ivory/50 mt-1">{artist.count} Items Created</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gold font-mono font-bold text-lg">{artist.volume.toFixed(2)} ETH</p>
                            <p className="text-xs text-green-400">Total Vol</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-ivory/40 text-center py-12">Artist leaderboard data is currently gathering...</p>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
