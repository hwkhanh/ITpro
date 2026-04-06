"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { CheckCircle2, Info, ArrowRight } from 'lucide-react';

export default function ResellPage() {
  const [sellMethod, setSellMethod] = useState<'fixed' | 'auction'>('fixed');

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl flex-1">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-gold drop-shadow-sm mb-2">Resell Asset</h1>
        <p className="text-ivory/70">List an artwork from your collection back onto the marketplace.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-ivory">
        {/* Left Col: Asset Preview */}
        <div className="space-y-6">
          <h2 className="font-serif text-2xl font-bold border-b border-indigo-muted/50 pb-3">Selected Masterpiece</h2>
          
          <div className="bg-[#0c1b33] rounded-2xl border-4 border-indigo-muted/60 p-4 shadow-painting relative overflow-hidden group">
            <div className="absolute top-6 right-6 z-10 flex flex-col gap-2 items-end">
              <Badge variant="gold" className="rounded-full shadow-glow-gold backdrop-blur-md bg-navy/80 px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-1 text-gold" /> Verified Owner
              </Badge>
            </div>
            
            <div className="aspect-[4/5] rounded-xl overflow-hidden mb-4 border border-indigo-muted/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="https://images.unsplash.com/photo-1549490349-8643362247b5?auto=format&fit=crop&q=80&w=800" alt="Resell Preview" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            </div>
            
            <div>
              <h3 className="font-serif text-2xl font-bold text-ivory mb-1">Digital Venus</h3>
              <p className="text-ivory/60 font-sans text-sm mb-4">Originally by Botticelli.eth</p>
              <div className="flex justify-between items-center text-sm py-3 border-t border-indigo-muted/30">
                <span className="text-ivory/50">Last Purchased</span>
                <span className="font-medium text-gold">1.5 ETH</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Listing Form */}
        <div className="space-y-8">
          <div className="bg-[#0c1b33]/60 rounded-2xl border border-indigo-muted/50 p-6 shadow-painting space-y-6">
            <h2 className="font-serif text-2xl font-bold border-b border-indigo-muted/40 pb-3">Listing Details</h2>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-ivory">Method</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setSellMethod('fixed')}
                  className={`py-3 px-4 rounded-xl border font-bold transition-all ${sellMethod === 'fixed' ? 'bg-gold/10 border-gold text-gold shadow-glow-gold' : 'border-indigo-muted bg-navy-light/40 text-ivory hover:border-indigo-muted/80'}`}
                >
                  Fixed Price
                </button>
                <button 
                  onClick={() => setSellMethod('auction')}
                  className={`py-3 px-4 rounded-xl border font-bold transition-all ${sellMethod === 'auction' ? 'bg-gold/10 border-gold text-gold shadow-glow-gold' : 'border-indigo-muted bg-navy-light/40 text-ivory hover:border-indigo-muted/80'}`}
                >
                  Timed Auction
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-ivory">
                {sellMethod === 'fixed' ? 'Price' : 'Starting Bid'}
              </label>
              <div className="relative">
                <Input type="number" placeholder="e.g. 2.5" className="pl-4 pr-16 py-6 text-lg" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-ivory/50">ETH</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-ivory">Duration</label>
              <select className="w-full rounded-md border border-indigo-muted bg-navy/50 px-3 py-3 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory">
                <option>1 Day</option>
                <option>3 Days</option>
                <option>7 Days</option>
                <option>1 Month</option>
              </select>
            </div>
          </div>

          <div className="bg-indigo-muted/10 rounded-2xl border border-indigo-muted/30 p-5 space-y-3 text-sm">
            <h4 className="font-bold flex items-center gap-2"><Info className="h-4 w-4 text-gold" /> Summary</h4>
            <div className="flex justify-between text-ivory/70">
              <span>Listing Price</span>
              <span>1.50 ETH</span>
            </div>
            <div className="flex justify-between text-ivory/70">
              <span>Creator Royalty (5%)</span>
              <span>0.075 ETH</span>
            </div>
            <div className="flex justify-between text-ivory/70">
              <span>Platform Fee (2%)</span>
              <span>0.03 ETH</span>
            </div>
            <div className="pt-3 border-t border-indigo-muted/40 flex justify-between font-bold">
              <span>Potential Earning</span>
              <span className="text-gold">1.395 ETH</span>
            </div>
          </div>

          <Button variant="default" size="lg" className="w-full text-lg py-6 rounded-xl shadow-glow-gold">
            Complete Listing
          </Button>
        </div>
      </div>
    </div>
  );
}
