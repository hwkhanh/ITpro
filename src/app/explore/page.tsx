"use client";

import React, { useState, useMemo } from 'react';
import { FilterSidebar } from '@/components/FilterSidebar';
import { NFTCard } from '@/components/NFTCard';
import { useMarket } from '@/context/MarketContext';
import { Search } from 'lucide-react';

export default function ExplorePage() {
  const { nfts } = useMarket();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Recently Added');
  
  // Show only available un-purchased NFTs in marketplace explore
  const availableNFTs = nfts.filter(nft => nft.status === 'available' || !nft.status);

  // Apply Search, Filter, Sort
  const filteredNFTs = useMemo(() => {
    let result = [...availableNFTs];
    
    if (searchTerm) {
      result = result.filter(nft => 
        (nft.title && nft.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (nft.creator && nft.creator.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (nft.collection && nft.collection.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    switch(sortOption) {
      case 'Price: Low to High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Recently Added':
      default:
        // Because IDs are Firebase doc IDs, or we have createdAt we can sort by date, 
        // fallback sorting by 'createdAt' generic
        result.sort((a, b) => {
           if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
           return -1;
        });
        break;
    }
    return result;
  }, [availableNFTs, searchTerm, sortOption]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-1 mt-4">
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar />
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-indigo-muted/30">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gold drop-shadow-sm mb-4 sm:mb-0">Explore Masterpieces</h1>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Optional Inline Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ivory/50" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search masterpieces..." 
                  className="bg-navy-light/40 border border-indigo-muted/50 text-ivory focus:border-gold focus:outline-none rounded-full py-2 pl-9 pr-4 text-sm w-48 lg:w-64 transition-all" 
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ivory/60 whitespace-nowrap hidden sm:block">
                  {filteredNFTs.length} item{filteredNFTs.length !== 1 ? 's' : ''}
                </span>
                <select 
                  className="bg-[#0c1b33] border border-indigo-muted/50 rounded-xl text-sm px-4 py-2.5 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory appearance-none shadow-sm cursor-pointer hover:border-ivory/30 transition-colors"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option>Recently Added</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Highest Last Sale</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
            {filteredNFTs.length > 0 ? filteredNFTs.map(nft => (
              <NFTCard key={nft.id} id={nft.id} title={nft.title} creator={nft.creator} price={nft.price} imageUrl={nft.image} />
            )) : (
              <div className="col-span-full py-20 text-center bg-[#0c1b33]/40 border border-indigo-muted/30 rounded-3xl">
                <div className="mx-auto w-16 h-16 rounded-full bg-navy-light/50 flex items-center justify-center mb-4 border border-indigo-muted/50">
                   <Search className="h-8 w-8 text-ivory/30" />
                </div>
                <h3 className="text-xl font-bold font-serif text-ivory mb-2">No masterpieces found</h3>
                <p className="text-ivory/50">There are no artworks matching your current filters or search terms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
