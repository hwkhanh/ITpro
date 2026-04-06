"use client";

import React from 'react';
import Link from 'next/link';
import { Twitter, Instagram, Github, Mail } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function Footer() {
  return (
    <footer className="w-full border-t border-indigo-muted/30 bg-[#0c1b33]/40 backdrop-blur-md mt-auto relative z-10">
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-light shadow-glow-gold text-navy">
                <span className="font-serif text-2xl font-bold italic">A</span>
              </div>
              <span className="font-serif text-2xl font-bold tracking-wider text-ivory drop-shadow-md">Aura</span>
            </Link>
            <p className="max-w-xs mb-6 text-sm text-ivory/60">
              A curated digital art gallery bridging the gap between Renaissance elegance and modern Web3 minimalism.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-light/50 border border-indigo-muted text-ivory/80 transition-colors hover:bg-navy hover:text-gold hover:border-gold/50 shadow-sm">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-light/50 border border-indigo-muted text-ivory/80 transition-colors hover:bg-navy hover:text-gold hover:border-gold/50 shadow-sm">
                <Instagram className="h-5 w-5" />
              </Link>
              <Link href="#" className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-light/50 border border-indigo-muted text-ivory/80 transition-colors hover:bg-navy hover:text-gold hover:border-gold/50 shadow-sm">
                <Github className="h-5 w-5" />
              </Link>
            </div>
          </div>
          
          <div>
            <h4 className="font-serif text-lg font-bold mb-4 text-ivory">Marketplace</h4>
            <ul className="space-y-3 text-sm text-ivory/70">
              <li><Link href="/explore" className="hover:text-gold transition-colors">Explore Gallery</Link></li>
              <li><Link href="#" className="hover:text-gold transition-colors">Trending Art</Link></li>
              <li><Link href="#" className="hover:text-gold transition-colors">Top Collections</Link></li>
              <li><Link href="#" className="hover:text-gold transition-colors">Recent Activity</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif text-lg font-bold mb-4 text-ivory">Resources</h4>
            <ul className="space-y-3 text-sm text-ivory/70">
              <li><Link href="#" className="hover:text-gold transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-gold transition-colors">AI Security Engine</Link></li>
              <li><Link href="#" className="hover:text-gold transition-colors">Creator Guide</Link></li>
              <li><Link href="#" className="hover:text-gold transition-colors">Partnerships</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg font-bold mb-4 text-ivory">Stay Updated</h4>
            <p className="text-sm text-ivory/60 mb-4">Subscribe to our newsletter for the latest exclusive drops.</p>
            <form className="flex flex-col gap-2" onSubmit={(e) => e.preventDefault()}>
              <div className="relative flex w-full max-w-sm items-center space-x-2">
                <div className="relative w-full">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ivory/40" />
                  <input
                    type="email"
                    placeholder="Email address"
                    className="h-10 w-full rounded-md border border-indigo-muted bg-navy-light/40 pl-9 pr-4 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory placeholder:text-ivory/40"
                  />
                </div>
              </div>
              <Button variant="default" className="w-full">Subscribe</Button>
            </form>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-indigo-muted/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-ivory/50">
          <p>&copy; {new Date().getFullYear()} Aura Galleries. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gold transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gold transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
