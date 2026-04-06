"use client";

import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronUp, ShieldAlert, ShieldCheck } from 'lucide-react';

export function FilterSidebar() {
  const [sections, setSections] = useState({
    status: true,
    price: true,
  });

  const toggleSection = (section: keyof typeof sections) => {
    setSections(prev => ({ ...prev, [section]: !prev[section] }));
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
            <span>Status</span>
            {sections.status ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {sections.status && (
            <div className="mt-3 space-y-3">
              {['Buy Now', 'On Auction', 'New', 'Has Offers'].map(status => (
                <label key={status} className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="rounded border-indigo-muted bg-navy focus:ring-gold accent-gold" />
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
            <span>Price</span>
            {sections.price ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          
          {sections.price && (
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-3">
                <select className="bg-navy-light/50 border border-indigo-muted rounded-md text-sm px-2 py-1.5 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold flex-1 text-ivory">
                  <option>ETH</option>
                  <option>USD</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full rounded-md border border-indigo-muted bg-navy/50 px-3 py-1.5 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory placeholder:text-muted-foreground"
                />
                <span className="text-ivory/50">to</span>
                <input 
                  type="number" 
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
