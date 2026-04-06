"use client";

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

export interface NFTCardProps {
  id: string;
  title: string;
  creator: string;
  price: number;
  imageUrl: string;
}

export function NFTCard({ id, title, creator, price, imageUrl }: NFTCardProps) {
  return (
    <Link href={`/nft/${id}`} className="group block overflow-hidden rounded-xl border border-indigo-muted bg-[#0c1b33] shadow-painting transition-all duration-500 hover:shadow-glow-gold hover:-translate-y-2">
      <div className="relative aspect-square overflow-hidden bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-foreground truncate">{title}</h3>
        <p className="text-sm text-muted-foreground truncate mb-4">by {creator}</p>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Price</span>
            <div className="flex items-center font-sans font-medium text-foreground">
              <span className="text-gold font-bold mr-1">ETH</span> {price}
            </div>
          </div>
          <div className="opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0">
            <span className="text-sm font-semibold text-bordeaux dark:text-gold">View Details &rarr;</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
