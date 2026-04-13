"use client";

import React, { useState, useEffect } from 'react';
import { Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterState {
  status: string[];
  minPrice: string;
  maxPrice: string;
}

interface FilterSidebarProps {
  onFilterChange: (filters: FilterState) => void;
}

export function FilterSidebar({ onFilterChange }: FilterSidebarProps) {
  const [sections, setSections] = useState({
    status: true,
    price: true,
  });

  const [statusFilters, setStatusFilters] = useState<string[]>(['Buy Now']);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange({ status: statusFilters, minPrice, maxPrice });
  }, [statusFilters, minPrice, maxPrice, onFilterChange]);

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleStatusChange = (status: string) => {
    setStatusFilters(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <aside className="w-full lg:w-64 flex-shrink-0">
      <div className="sticky top-28 rounded-xl border border-indigo-muted/50 bg-[#0c1b33]/80 backdrop-blur-md p-5 shadow-painting">
        <div className="flex items-center gap-2 border-b border-indigo-muted/40 pb-4 mb-4">
          <Filter className="h-5 w-5 text-gold" />
          <h2 className="font-serif font-bold text-lg text-ivory">Filters</h2>
        </div>

        {/* Status */}
        <div className="mb-4 border-b border-indigo-muted/40 pb-4">
          <button 
            className="flex w-full items-center justify-between py-2 font-medium text-ivory/90 hover:text-gold transition-colors"
            onClick={() => toggleSection('status')}
          >
            <span>Availability</span>
            {sections.status ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {sections.status && (
            <div className="mt-3 space-y-3">
              {['Buy Now', 'Sold Out'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={statusFilters.includes(status)}
                    onChange={() => handleStatusChange(status)}
                    className="rounded border-indigo-muted bg-navy focus:ring-gold accent-gold" 
                  />
                  <span className="text-sm text-ivory/80 group-hover:text-ivory">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Price */}
        <div className="mb-4">
          <button 
            className="flex w-full items-center justify-between py-2 font-medium text-ivory/90 hover:text-gold transition-colors"
            onClick={() => toggleSection('price')}
          >
            <span>Price (ETH)</span>
            {sections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {sections.price && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="Min" 
                  className="w-full rounded-md border border-indigo-muted bg-navy/50 px-3 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory placeholder:text-muted-foreground"
                />
                <span className="text-ivory/50">to</span>
                <input 
                  type="number" 
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Max" 
                  className="w-full rounded-md border border-indigo-muted bg-navy/50 px-3 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory placeholder:text-muted-foreground"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
