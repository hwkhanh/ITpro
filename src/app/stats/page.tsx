"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { TrendingUp, Activity, Users, DollarSign, ArrowUpRight, BarChart3, LineChart } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';

export default function StatsPage() {
  const { nfts } = useMarket();

  const stats = useMemo(() => {
    // Total Sales logic: count status === 'sold'
    const soldNfts = nfts.filter(nft => nft.status === 'sold' || (nft.status === 'owned' && nft.ownerId !== nft.creator));
    const totalVolume = soldNfts.reduce((acc, curr) => acc + curr.price, 0);
    const activeUsers = new Set(nfts.flatMap(nft => [nft.creator, nft.ownerId])).size;
    
    // Group by collection logic
    const collabMap = new Map<string, {name: string, volume: number, floor: number, count: number, image: string}>();
    
    nfts.forEach(nft => {
      const col = nft.collection || 'AuraArt Originals';
      if (!collabMap.has(col)) {
        collabMap.set(col, { name: col, volume: 0, floor: nft.price, count: 0, image: nft.image });
      }
      const entry = collabMap.get(col)!;
      if (nft.status === 'sold' || (nft.status === 'owned' && nft.ownerId !== nft.creator)) {
        entry.volume += nft.price;
      }
      if (nft.price < entry.floor && (nft.status === 'available' || !nft.status)) {
        entry.floor = nft.price; // Lowest active listing price
      }
      entry.count++;
    });

    const collections = Array.from(collabMap.values()).sort((a,b) => b.volume - a.volume).slice(0, 5);

    // Group by sellers logic
    const sellerMap = new Map<string, { name: string, volume: number, sold: number, image: string }>();
    soldNfts.forEach(nft => {
      if (!sellerMap.has(nft.creator)) {
        sellerMap.set(nft.creator, { name: nft.creator, volume: 0, sold: 0, image: nft.image });
      }
      const s = sellerMap.get(nft.creator)!;
      s.volume += nft.price;
      s.sold++;
    });
    const sellers = Array.from(sellerMap.values()).sort((a, b) => b.volume - a.volume).slice(0, 4);

    return { totalVolume, soldCount: soldNfts.length, activeUsers, collections, sellers };
  }, [nfts]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 mt-4 flex-1">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-gold drop-shadow-sm mb-4">
          Market Analytics
        </h1>
        <p className="text-lg text-ivory/60 max-w-2xl">
          Track the pulse of the digital Renaissance. View real-time volume metrics, trending collections, and top collectors across the ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-[#0c1b33]/60 p-6 rounded-2xl border border-indigo-muted/50 backdrop-blur-md shadow-painting">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-navy rounded-xl border border-indigo-muted/30"><Activity className="h-5 w-5 text-gold" /></div>
           </div>
           <p className="text-sm uppercase tracking-widest text-ivory/50 mb-1">Total Volume</p>
           <p className="font-sans text-3xl font-bold text-ivory drop-shadow-sm">{stats.totalVolume.toFixed(3)} ETH</p>
        </div>
        <div className="bg-[#0c1b33]/60 p-6 rounded-2xl border border-indigo-muted/50 backdrop-blur-md shadow-painting">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-navy rounded-xl border border-indigo-muted/30"><DollarSign className="h-5 w-5 text-gold" /></div>
           </div>
           <p className="text-sm uppercase tracking-widest text-ivory/50 mb-1">Total Sales</p>
           <p className="font-sans text-3xl font-bold text-ivory drop-shadow-sm">{stats.soldCount}</p>
        </div>
        <div className="bg-[#0c1b33]/60 p-6 rounded-2xl border border-indigo-muted/50 backdrop-blur-md shadow-painting">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-navy rounded-xl border border-indigo-muted/30"><TrendingUp className="h-5 w-5 text-gold" /></div>
           </div>
           <p className="text-sm uppercase tracking-widest text-ivory/50 mb-1">Items Minted</p>
           <p className="font-sans text-3xl font-bold text-ivory drop-shadow-sm">{nfts.length}</p>
        </div>
        <div className="bg-[#0c1b33]/60 p-6 rounded-2xl border border-indigo-muted/50 backdrop-blur-md shadow-painting">
           <div className="flex justify-between items-start mb-4">
             <div className="p-3 bg-navy rounded-xl border border-indigo-muted/30"><Users className="h-5 w-5 text-gold" /></div>
           </div>
           <p className="text-sm uppercase tracking-widest text-ivory/50 mb-1">Active Accounts</p>
           <p className="font-sans text-3xl font-bold text-ivory drop-shadow-sm">{stats.activeUsers}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-12">
        <div className="xl:col-span-2 flex flex-col gap-8">
          <div className="bg-[#0c1b33]/60 p-6 sm:p-8 rounded-3xl border border-indigo-muted/50 backdrop-blur-md shadow-painting">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-bold text-ivory flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-gold" /> Top Sellers
              </h2>
            </div>
            {stats.sellers.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stats.sellers.map((seller, idx) => (
                  <Link key={idx} href={`/profile`} className="group relative flex items-center gap-4 p-4 rounded-xl border border-indigo-muted/30 bg-navy-light/20 hover:bg-navy-light/50 hover:border-gold/30 transition-all">
                    <div className="text-xl font-serif font-bold text-ivory/30 group-hover:text-gold transition-colors w-6">{idx + 1}</div>
                    <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-transparent group-hover:border-gold transition-colors bg-navy">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={seller.image} alt={seller.name} className="h-full w-full object-cover p-1 rounded-full" />
                    </div>
                    <div className="flex-1 w-24">
                      <p className="font-medium text-ivory group-hover:text-gold transition-colors truncate">{seller.name}</p>
                      <p className="text-sm text-ivory/50">{seller.sold} Items Sold</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gold drop-shadow-sm">{seller.volume.toFixed(2)} ETH</p>
                    </div>
                  </Link>
                ))}
            </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-ivory/40 italic">Transaction data logging initiated...</div>
            )}
          </div>

          <div className="bg-[#0c1b33]/60 p-6 sm:p-8 rounded-3xl border border-indigo-muted/50 backdrop-blur-md shadow-painting flex-1 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                 <LineChart className="h-10 w-10 text-ivory/20 mx-auto mb-4" />
                 <p className="font-serif text-xl font-bold text-ivory/40">Volume Trends</p>
                 <p className="text-sm text-ivory/30 mt-2">Waiting for more trade history to compute graph...</p>
              </div>
          </div>
        </div>

        <div className="bg-[#0c1b33]/60 rounded-3xl border border-indigo-muted/50 overflow-hidden shadow-painting backdrop-blur-md flex flex-col">
          <div className="p-6 border-b border-indigo-muted/30">
            <h2 className="font-serif text-2xl font-bold text-ivory flex items-center gap-3">
               Trending Collections
            </h2>
          </div>
          <div className="flex-1 overflow-x-auto">
            {stats.collections.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-navy border-b border-indigo-muted/50">
                    <th className="py-4 px-6 font-semibold text-ivory/50 uppercase tracking-widest text-xs">Collection</th>
                    <th className="py-4 px-6 font-semibold text-ivory/50 uppercase tracking-widest text-xs text-right">Volume</th>
                    <th className="py-4 px-6 font-semibold text-ivory/50 uppercase tracking-widest text-xs text-right">Floor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-muted/30">
                  {stats.collections.map((collection, idx) => (
                    <tr key={idx} className="hover:bg-navy-light/30 transition-colors group cursor-pointer">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-bold text-ivory/40">{idx + 1}</span>
                          <div className="h-10 w-10 rounded-lg overflow-hidden border border-indigo-muted bg-navy flex-shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={collection.image} alt={collection.name} className="h-full w-full object-cover" />
                          </div>
                          <p className="font-medium text-ivory group-hover:text-gold transition-colors truncate max-w-[100px] sm:max-w-[150px]">{collection.name}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <p className="font-medium text-ivory drop-shadow-sm">{collection.volume.toFixed(2)}</p>
                        <div className="flex items-center justify-end text-xs text-green-400">
                          <ArrowUpRight className="h-3 w-3 mr-1" /> Real
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-ivory/70">
                        {collection.floor}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
                <div className="flex-1 h-full min-h-[300px] flex items-center justify-center text-ivory/40">
                  Market collections forming...
                </div>
            )}
          </div>
          <div className="p-4 border-t border-indigo-muted/30 text-center bg-navy-light/10 hover:bg-navy-light/30 transition-colors cursor-pointer text-sm font-medium text-gold">
            Refresh Sync
          </div>
        </div>
      </div>
    </div>
  );
}
