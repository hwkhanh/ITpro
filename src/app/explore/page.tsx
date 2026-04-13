"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { FilterSidebar } from '@/components/FilterSidebar';
import { NFTCard } from '@/components/NFTCard';
import { useMarket } from '@/context/MarketContext';
import { Search } from 'lucide-react';

export default function ExplorePage() {
  const { nfts } = useMarket();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('Recently Added');
  
  // State for sidebar filters
  const [filters, setFilters] = useState({
    status: ['Buy Now'], // default
    minPrice: '',
    maxPrice: ''
  });

  const handleFilterChange = useCallback((newFilters: any) => {
    setFilters(newFilters);
  }, []);

  // Apply Search, Filter, Sort
  const filteredNFTs = useMemo(() => {
    // Start with all NFTs, not just available ones, so we can filter by 'Sold Out'
    let result = [...nfts];
    
    // 1. Sidebar Filters
    if (filters.status.length > 0) {
      result = result.filter(nft => {
        const isAvailable = nft.status === 'available' || !nft.status;
        const isSoldOut = nft.status === 'owned';
        
        if (filters.status.includes('Buy Now') && isAvailable) return true;
        if (filters.status.includes('Sold Out') && isSoldOut) return true;
        return false;
      });
    } else {
      result = []; // If no status selected, show none, or show all? usually show none.
    }

    if (filters.minPrice) {
      result = result.filter(nft => nft.price >= Number(filters.minPrice));
    }
    if (filters.maxPrice) {
      result = result.filter(nft => nft.price <= Number(filters.maxPrice));
    }

    // 2. Search Term
    if (searchTerm) {
      result = result.filter(nft => 
        (nft.title && nft.title.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (nft.creator && nft.creator.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (nft.collection && nft.collection.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    // 3. Sort
    switch(sortOption) {
      case 'Price: Low to High':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'Price: High to Low':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Highest Last Sale':
        // Just a placeholder, fallback to high to low for now
        result.sort((a, b) => b.price - a.price);
        break;
      case 'Oldest Added':
        result.sort((a, b) => {
           if (a.createdAt && b.createdAt) return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
           return 1;
        });
        break;
      case 'Recently Added':
      default:
        result.sort((a, b) => {
           if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
           return -1;
        });
        break;
    }
    return result;
  }, [nfts, searchTerm, sortOption, filters]);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 flex-1 mt-4">
      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar onFilterChange={handleFilterChange} />
        
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-indigo-muted/30">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-gold drop-shadow-sm mb-4 sm:mb-0">Explore Masterpieces</h1>
            
            <div className="flex items-center gap-4 w-full sm:w-auto">
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
                  <option>Oldest Added</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
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
