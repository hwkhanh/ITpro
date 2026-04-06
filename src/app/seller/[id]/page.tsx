"use client";

import React, { useMemo, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { BadgeCheck, Copy, Globe, Share2 } from 'lucide-react';
import { NFTCard } from '@/components/NFTCard';
import { useMarket } from '@/context/MarketContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SellerProfilePage() {
  const params = useParams();
  const id = params?.id as string; // The wallet address
  const { nfts } = useMarket();

  // Dynamically calculate stats based on their wallet address
  const stats = useMemo(() => {
    const created = nfts.filter(n => n.creator === id);
    const sold = created.filter(n => n.status === 'sold' || (n.status === 'owned' && n.ownerId !== n.creator));
    const volume = sold.reduce((acc, curr) => acc + curr.price, 0);
    const owned = nfts.filter(n => n.ownerId === id && n.status === 'owned');
    return { created, soldCount: sold.length, volume, owned };
  }, [nfts, id]);

  const shortAddress = id ? `${id.substring(0, 6)}...${id.substring(id.length - 4)}` : 'Unknown';

  const [sellerProfile, setSellerProfile] = useState<any>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (id) {
        try {
          const snap = await getDoc(doc(db, 'users', id));
          if (snap.exists()) {
            setSellerProfile(snap.data());
          }
        } catch (error) {
          console.error("Error fetching seller profile:", error);
        }
      }
    }
    fetchProfile();
  }, [id]);

  const username = sellerProfile?.username || `Collector ${shortAddress}`;
  const bio = sellerProfile?.bio || "A digital art aficionado and verified participant in the AuraArt ecosystem.";
  
  // Use valid real Unsplash photo IDs as fallback to prevent broken images
  const coverImage = sellerProfile?.coverUrl || "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&q=80&w=2000";
  const avatarImage = sellerProfile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300";

  return (
    <div className="min-h-screen bg-transparent flex-1 mb-20">
      <div className="h-64 sm:h-80 w-full relative">
        <div className="absolute inset-0 bg-bordeaux/20 mix-blend-overlay z-10"></div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c1b33] to-transparent z-20"></div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-30 -mt-20">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-end mb-12">
          {/* Avatar */}
          <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-full border-4 border-[#0c1b33] overflow-hidden shadow-painting bg-[#0c1b33]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarImage} alt="Avatar" className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 w-full flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ivory flex items-center gap-3 drop-shadow-sm">
                {username} <BadgeCheck className="h-7 w-7 text-gold drop-shadow-sm" />
              </h1>
              <div className="flex items-center gap-4 mt-2 text-ivory/60 text-sm">
                <span className="flex items-center gap-1 hover:text-ivory cursor-pointer transition-colors" title={id}>
                  {shortAddress} <Copy className="h-3 w-3" />
                </span>
                <span>Active Member</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="h-10 w-10 rounded-full border border-indigo-muted flex items-center justify-center text-ivory/70 hover:text-gold hover:border-gold/50 transition-colors bg-[#0c1b33]/60 backdrop-blur-md">
                <Globe className="h-4 w-4" />
              </button>
              <button className="h-10 w-10 rounded-full border border-indigo-muted flex items-center justify-center text-ivory/70 hover:text-gold hover:border-gold/50 transition-colors bg-[#0c1b33]/60 backdrop-blur-md">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="max-w-3xl mb-12">
          <p className="text-ivory/80 leading-relaxed italic">
            "{bio}"
          </p>
          <div className="flex gap-8 mt-6 border-y border-indigo-muted/30 py-4">
            <div>
              <p className="text-2xl font-bold text-ivory">{stats.created.length}</p>
              <p className="text-xs uppercase tracking-widest text-ivory/50">Created</p>
            </div>
            <div className="w-px bg-indigo-muted/30"></div>
            <div>
              <p className="text-2xl font-bold text-ivory">{stats.soldCount}</p>
              <p className="text-xs uppercase tracking-widest text-ivory/50">Sold</p>
            </div>
            <div className="w-px bg-indigo-muted/30"></div>
            <div>
              <p className="text-2xl font-bold text-gold drop-shadow-sm">{stats.volume.toFixed(3)} ETH</p>
              <p className="text-xs uppercase tracking-widest text-ivory/50">Volume</p>
            </div>
          </div>
        </div>

        {/* Collection Grid */}
        <div>
          <h2 className="font-serif text-2xl font-bold text-ivory mb-8">Collection</h2>
          {stats.created.length === 0 && stats.owned.length === 0 ? (
             <div className="text-center py-20 bg-[#0c1b33]/40 rounded-2xl border border-indigo-muted/50 border-dashed">
                <p className="text-ivory/50">This collector hasn't minted or bought any artworks yet.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...stats.created, ...stats.owned].filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i).map(nft => (
                <NFTCard
                  key={nft.id}
                  id={nft.id}
                  title={nft.title}
                  creator={nft.creator}
                  price={nft.price}
                  imageUrl={nft.image}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
