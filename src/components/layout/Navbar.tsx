"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search, Wallet, UserCircle, Menu, Library, ShoppingCart, Repeat, Settings, LogOut, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useMarket } from '@/context/MarketContext';

export function Navbar() {
  const { isLoggedIn, login, logout, cartItems, userProfile, walletAddress } = useMarket();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-muted/50 bg-background/80 backdrop-blur-md transition-colors duration-300 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-light text-navy shadow-glow-gold">
              <span className="font-serif text-2xl font-bold italic">A</span>
            </div>
            <span className="font-serif text-2xl font-bold tracking-wider text-ivory drop-shadow-md">Aura</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/explore" className="text-sm font-medium text-foreground/90 transition-all hover:text-gold hover:drop-shadow-[0_0_8px_rgba(247,208,2,0.5)]">Explore</Link>
            <Link href="/stats" className="text-sm font-medium text-foreground/90 transition-all hover:text-gold hover:drop-shadow-[0_0_8px_rgba(247,208,2,0.5)]">Stats</Link>
            <Link href="/create" className="text-sm font-medium text-foreground/90 transition-all hover:text-gold hover:drop-shadow-[0_0_8px_rgba(247,208,2,0.5)]">Create</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex relative w-64 mr-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search masterpieces..."
              className="h-10 w-full rounded-full border border-indigo-muted bg-navy-light/40 pl-10 pr-4 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold text-ivory placeholder:text-muted-foreground/70"
            />
          </div>

          <Link href="/checkout" className="relative p-2 text-ivory hover:text-gold transition-colors ml-2 mr-2">
            <ShoppingBag className="h-6 w-6" />
            {cartItems.length > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-bordeaux-light text-white text-[10px] font-bold flex items-center justify-center shadow-sm -mt-1 -mr-1">
                {cartItems.length}
              </span>
            )}
          </Link>

          {isLoggedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 rounded-full border border-indigo-muted bg-navy-light/50 p-1 pr-3 transition-colors hover:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-gold to-bordeaux shadow-sm flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={userProfile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100"} alt="Avatar" className="h-full w-full object-cover" />
                </div>
                <span className="hidden sm:inline-block font-medium text-sm text-ivory">
                  {userProfile?.username || (walletAddress ? `User-${walletAddress.substring(0, 6)}` : '')}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-indigo-muted bg-[#0c1b33] p-2 shadow-painting text-sm text-ivory animate-in slide-in-from-top-2 z-50">
                  <div className="px-3 py-2 border-b border-indigo-muted/50 mb-1">
                    <p className="font-semibold text-gold truncate">
                      {userProfile?.username || (walletAddress ? `User-${walletAddress.substring(0, 6)}` : '')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{walletAddress}</p>
                  </div>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-navy-light transition-colors">
                    <UserCircle className="h-4 w-4 text-muted-foreground" /> My Profile
                  </Link>
                  <Link href="/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-navy-light transition-colors">
                    <Library className="h-4 w-4 text-muted-foreground" /> My Collection
                  </Link>
                  <Link href="/checkout" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-navy-light transition-colors">
                    <ShoppingCart className="h-4 w-4 text-muted-foreground" /> Checkout Cart
                  </Link>
                  <Link href="/resell" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-navy-light transition-colors">
                    <Repeat className="h-4 w-4 text-muted-foreground" /> Resell Assets
                  </Link>
                  <Link href="#" onClick={() => setDropdownOpen(false)} className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-navy-light transition-colors">
                    <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                  </Link>
                  <div className="my-1 border-t border-indigo-muted/50" />
                  <button onClick={() => { logout(); setDropdownOpen(false); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-bordeaux-light hover:bg-bordeaux/10 transition-colors">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button variant="default" className="rounded-full gap-2" onClick={login}>
              <Wallet className="h-4 w-4 text-navy" />
              <span className="hidden sm:inline-block font-bold">Connect Wallet</span>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden text-ivory">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
