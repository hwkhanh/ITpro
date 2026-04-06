"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, Zap, History, User2, ShoppingCart, CheckCircle2, Wallet, Loader2, Share2, Tag, TrendingUp, TrendingDown, Clock, Flag, List, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useParams, useRouter } from 'next/navigation';
import { useMarket } from '@/context/MarketContext';
import { NFTCard } from '@/components/NFTCard';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function NFTDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { isLoggedIn, login, addToCart, getNFTById, cartItems, walletAddress, listNFT, nfts } = useMarket();

  const [activeTabLeft, setActiveTabLeft] = useState<'description' | 'properties' | 'audit' | 'details'>('properties');
  const [activeTabRight, setActiveTabRight] = useState<'listing' | 'offers'>('offers');

  const [nftHistory, setNftHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [timeLeft, setTimeLeft] = useState({ days: 2, hours: 17, minutes: 25, seconds: 18 });

  useEffect(() => {
    if (!id) return;
    const fetchHistory = async () => {
      try {
        const q = query(collection(db, 'transactions'), where('nftId', '==', id));
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => d.data());
        docs.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setNftHistory(docs);
      } catch (error) {
        console.error("Error fetching NFT history", error);
      } finally {
        setHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const nft = getNFTById(id);

  if (!nft) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-xl flex-1 mt-10">
        <div className="bg-[#0c1b33]/60 border border-indigo-muted/50 rounded-3xl p-10 shadow-painting backdrop-blur-md">
           <Loader2 className="h-16 w-16 text-gold mb-6 mx-auto opacity-80 animate-spin" />
           <h2 className="text-2xl font-bold text-ivory mb-4">Finding Masterpiece</h2>
           <p className="text-ivory/70">Please wait while we retrieve the details from the blockchain indexing engine...</p>
        </div>
      </div>
    );
  }

  // Data processing for Price History graph
  const startingPrice = nftHistory.length > 0 ? nftHistory[0].price : nft.price;
  const currentPrice = nft.price;
  const lowestPrice = Math.min(nft.price, ...(nftHistory.length > 0 ? nftHistory.map(t => t.price) : [nft.price]));
  const highestPrice = Math.max(nft.price, ...(nftHistory.length > 0 ? nftHistory.map(t => t.price) : [nft.price]));
  const priceIncrease = startingPrice > 0 ? ((currentPrice - startingPrice) / startingPrice * 100) : 0;

  const points = [];
  points.push({ date: nft.createdAt || new Date(Date.now() - 30*24*60*60*1000).toISOString(), price: startingPrice, label: 'Minted' });
  nftHistory.forEach(t => {
     points.push({ date: t.date, price: t.price, label: 'Sold' });
  });
  points.push({ date: new Date().toISOString(), price: currentPrice, label: 'Today' });

  const labelsX = points.map(p => p.label === 'Today' ? 'Today' : new Date(p.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }));
  
  const wSvg = 1000;
  const hSvg = 200;
  const prices = points.map(p => p.price);
  const minP = Math.min(...prices) * 0.9;
  const maxP = Math.max(...prices) * 1.1;
  const rangeP = maxP - minP === 0 ? Math.max(...prices) * 0.2 || 1 : maxP - minP;
  
  const pathD = points.map((p, i) => {
    const x = points.length > 1 ? (i / (points.length - 1)) * wSvg : wSvg / 2;
    const y = hSvg - ((p.price - minP) / rangeP) * hSvg;
    return `${i === 0 ? 'M' : 'L'} ${x},${y}`;
  }).join(' ');

  const isOwner = nft.ownerId === walletAddress;
  const isListedByMe = isOwner && (nft.status === 'available' || !nft.status);
  const isOwnedByMeNotListed = isOwner && nft.status === 'owned';
  const isSoldOut = (nft.status === 'sold' && !isOwner) || (nft.status === 'owned' && !isOwner);
  const inCart = cartItems.some(item => item.id === id);

  const [isListing, setIsListing] = useState(false);
  const [listPrice, setListPrice] = useState(nft.price.toString());

  const handleListForSale = async () => {
    const priceNum = parseFloat(listPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert("Please enter a valid positive price in ETH.");
      return;
    }
    await listNFT(id, priceNum);
    setIsListing(false);
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      login(); return;
    }
    router.push(`/checkout?direct=${id}`);
  };

  const handleAddToCart = () => {
    if (!isLoggedIn) {
      login(); return;
    }
    addToCart(nft);
  };

  const mockProperties = [
    { type: 'PLATFORM', value: 'AuraArt Network', rarity: 'Premium' },
    { type: 'COLLECTION', value: nft.collection || 'Unique', rarity: 'Verified' },
    { type: 'BACKGROUND', value: 'Ethereal Blue', rarity: '20% have this trait' },
    { type: 'TEXTURE', value: 'Canvas Oil', rarity: '5% have this trait' },
  ];

  const mockOffers = [
    { price: (nft.price * 0.9).toFixed(2), diff: '10% below', date: 'Just now', from: '0xLeo...a1b' },
    { price: (nft.price * 0.75).toFixed(2), diff: '25% below', date: '2 hrs ago', from: 'Alex.eth' },
    { price: (nft.price * 0.6).toFixed(2), diff: '40% below', date: '1 day ago', from: '0x992...f4e' },
  ];

  const otherItems = nfts.filter(n => n.collection === (nft.collection || 'AuraArt Originals') && n.id !== nft.id).slice(0, 4);

  return (
    <div className="container mx-auto px-4 py-8 sm:px-8 lg:px-12 mt-4 flex-1 max-w-[1400px]">
      
      <div className="flex flex-col lg:flex-row gap-10 xl:gap-16 mb-16">
        <div className="w-full lg:w-[45%]">
          <div className="rounded-2xl overflow-hidden border border-indigo-muted relative shadow-painting bg-[#0c1b33] flex items-center justify-center p-4 min-h-[500px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={nft.image} alt={nft.title} className="w-full h-auto max-h-[70vh] object-contain rounded-xl drop-shadow-lg" />
            <div className="absolute bottom-6 left-6 flex gap-3">
              <button className="h-10 w-10 bg-[#030712]/80 backdrop-blur border border-indigo-muted rounded-full flex items-center justify-center text-ivory/70 hover:text-white transition-colors">
                 <Share2 className="h-4 w-4" />
              </button>
            </div>
            </div>
        </div>
        
        <div className="w-full lg:w-[55%] flex flex-col pt-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-gold drop-shadow-sm mb-4">{nft.title || 'Untitled Masterpiece'}</h1>
              <div className="flex flex-wrap items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-ivory/50">Created by</span>
                  <Link href={`/seller/${nft.creator}`} className="flex items-center gap-1 font-medium text-ivory hover:text-gold transition-colors">
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                     <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300" className="w-6 h-6 rounded-full object-cover border border-indigo-muted" alt="" />
                     <span className="truncate max-w-[150px] ml-1 text-base">{nft.creator}</span>
                     <CheckCircle2 className="w-4 h-4 text-blue-400 ml-1" />
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-ivory/50">Collection</span>
                  <span className="font-medium text-blue-400 flex items-center gap-1 cursor-pointer hover:underline text-base">
                    <List className="w-4 h-4 mr-1" /> {nft.collection || 'AuraArt Originals'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 text-ivory/50">
              <button className="h-9 px-3 bg-navy-light/30 border border-indigo-muted/50 rounded flex items-center gap-2 hover:bg-navy-light/60 transition-colors text-xs uppercase tracking-wider font-semibold">
                 <Share2 className="h-3 w-3" /> Share
              </button>
              <button className="h-9 px-3 bg-navy-light/30 border border-indigo-muted/50 rounded flex items-center gap-2 hover:bg-navy-light/60 transition-colors text-xs uppercase tracking-wider font-semibold text-red-400/70 hover:text-red-400">
                 <Flag className="h-3 w-3" /> Report
              </button>
            </div>
          </div>

          <div className="bg-navy-light/30 border border-indigo-muted/40 rounded-2xl p-6 sm:p-8 mb-8 w-full shadow-sm">
            <p className="text-ivory/70 text-sm mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gold" /> Sale ends July 1, 2026 at 10:00AM GMT+7
            </p>
            <div className="flex gap-8 sm:gap-12">
              <div className="flex flex-col"><span className="text-3xl font-bold text-ivory drop-shadow-sm">{timeLeft.days}</span><span className="text-xs text-ivory/50 uppercase tracking-widest mt-1">Days</span></div>
              <div className="flex flex-col"><span className="text-3xl font-bold text-ivory drop-shadow-sm">{timeLeft.hours}</span><span className="text-xs text-ivory/50 uppercase tracking-widest mt-1">Hours</span></div>
              <div className="flex flex-col"><span className="text-3xl font-bold text-ivory drop-shadow-sm">{timeLeft.minutes}</span><span className="text-xs text-ivory/50 uppercase tracking-widest mt-1">Minutes</span></div>
              <div className="flex flex-col"><span className="text-3xl font-bold text-ivory drop-shadow-sm">{timeLeft.seconds}</span><span className="text-xs text-ivory/50 uppercase tracking-widest mt-1">Seconds</span></div>
            </div>
          </div>

          <div className="mb-8 pl-2">
            <p className="text-xs uppercase tracking-widest text-ivory/50 mb-2 font-semibold">Current price</p>
            <div className="flex items-end font-sans">
              <span className="text-gold font-bold text-5xl mr-3 tracking-tight drop-shadow-lg">{nft.price}</span>
              <span className="text-xl font-bold text-ivory/80 mb-1">ETH</span>
              <span className="text-base text-ivory/40 mb-1 ml-3 font-medium">(${(nft.price * 2100).toLocaleString()})</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {!isLoggedIn ? (
              <Button variant="default" size="lg" onClick={login} className="flex-1 text-lg rounded-xl py-7 bg-blue-600 hover:bg-blue-500 font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)]">
                <Wallet className="mr-2 h-5 w-5" /> Connect Wallet to Buy
              </Button>
            ) : isOwnedByMeNotListed ? (
               isListing ? (
                 <div className="flex w-full items-center gap-3">
                   <div className="relative flex-1">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gold font-bold">ETH</span>
                     <input type="number" value={listPrice} onChange={(e) => setListPrice(e.target.value)}
                       className="w-full bg-[#030712] border border-gold/50 rounded-xl py-4 pl-14 pr-4 text-ivory focus:border-gold outline-none text-lg" placeholder="0.00" step="0.01" />
                   </div>
                   <Button variant="gold" size="lg" onClick={handleListForSale} className="rounded-xl py-6 px-8 text-lg font-bold shadow-glow-gold">Submit</Button>
                   <Button variant="ghost" size="lg" onClick={() => setIsListing(false)} className="text-ivory/50 hover:text-white rounded-xl py-6 px-6">Cancel</Button>
                 </div>
               ) : (
                 <Button variant="outline" size="lg" onClick={() => setIsListing(true)} className="flex-1 text-lg border-green-500/50 text-green-400 rounded-xl py-7 bg-green-950/20 hover:bg-green-900/40">
                   <Zap className="mr-2 h-5 w-5" /> Resell Masterpiece
                 </Button>
               )
            ) : isListedByMe ? (
                 <Button variant="outline" size="lg" disabled className="flex-1 text-lg border-gold/50 text-gold rounded-xl py-7 bg-gold/10">Currently Listed By You</Button>
            ) : isSoldOut ? (
                 <Button variant="outline" size="lg" disabled className="flex-1 text-lg border-indigo-muted text-ivory/50 rounded-xl py-7 bg-navy-light/10">Owned By Collector</Button>
            ) : (
              <>
                <Button variant="default" size="lg" onClick={handleBuyNow} className="flex-[2] text-xl rounded-xl py-7 font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] border border-blue-400/50">
                  Buy now
                </Button>
                <Button variant="outline" size="lg" className="flex-[2] text-xl font-bold border-blue-500/30 text-blue-400 hover:bg-blue-900/40 hover:text-blue-300 rounded-xl py-7 transition-colors bg-blue-950/20">
                  <Tag className="mr-2 h-5 w-5" /> Make an offer
                </Button>
                <button onClick={handleAddToCart} disabled={inCart} className="w-16 h-14 border border-indigo-muted/50 bg-navy-light/30 rounded-xl flex flex-shrink-0 items-center justify-center text-ivory/60 hover:text-white hover:border-blue-400/50 hover:bg-blue-900/20 transition-colors">
                  {inCart ? <CheckCircle2 className="h-6 w-6 text-green-400" /> : <ShoppingCart className="h-6 w-6" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 mb-20">
        
        <div className="w-full lg:w-1/2">
          <div className="flex border-b border-indigo-muted/30 mb-6 font-serif">
            <button className={`px-4 sm:px-6 py-4 transition-colors border-b-2 font-semibold text-lg ${activeTabLeft === 'description' ? 'border-blue-500 text-blue-400' : 'border-transparent text-ivory/50 hover:text-ivory'}`} onClick={() => setActiveTabLeft('description')}>Description</button>
            <button className={`px-4 sm:px-6 py-4 transition-colors border-b-2 font-semibold text-lg ${activeTabLeft === 'properties' ? 'border-blue-500 text-blue-400' : 'border-transparent text-ivory/50 hover:text-ivory'}`} onClick={() => setActiveTabLeft('properties')}>Properties</button>
            <button className={`px-4 sm:px-6 py-4 transition-colors border-b-2 font-semibold text-lg ${activeTabLeft === 'details' ? 'border-blue-500 text-blue-400' : 'border-transparent text-ivory/50 hover:text-ivory'}`} onClick={() => setActiveTabLeft('details')}>Details</button>
          </div>
          
          <div className="min-h-[250px] p-2">
            {activeTabLeft === 'properties' && (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {mockProperties.map((prop, idx) => (
                  <div key={idx} className="bg-blue-950/20 p-5 rounded-xl border border-blue-500/30 flex flex-col items-center justify-center shadow-sm hover:bg-blue-900/30 hover:border-blue-400/50 transition-colors">
                    <p className="text-[10px] uppercase tracking-widest text-blue-400 mb-2 font-bold">{prop.type}</p>
                    <p className="font-semibold text-ivory text-xl drop-shadow-sm mb-1">{prop.value}</p>
                    <p className="text-xs text-ivory/50">{prop.rarity}</p>
                  </div>
                ))}
              </div>
            )}

            {activeTabLeft === 'description' && (
              <div className="prose prose-invert text-ivory/80 max-w-none text-lg leading-relaxed">
                <p>{nft.description || 'A stunning piece of digital art minted and verified natively on the blockchain. The robust aesthetic complements modern curation.'}</p>
                <div className="mt-6 flex items-center gap-2 text-ivory/60 bg-navy-light/40 p-4 border border-indigo-muted/50 rounded-xl">
                    <User2 className="w-5 h-5" /> <em>Owner:</em> {nft.ownerId}
                </div>
              </div>
            )}
            
            {activeTabLeft === 'details' && (
               <div className="space-y-4 max-w-md">
                 <div className="flex justify-between items-center py-2 border-b border-indigo-muted/20 text-base"><span className="text-ivory/60">Contract Address</span><a href="#" className="font-mono text-blue-400 hover:underline">0x336c...7283</a></div>
                 <div className="flex justify-between items-center py-2 border-b border-indigo-muted/20 text-base"><span className="text-ivory/60">Token ID</span><span className="font-mono text-ivory font-semibold">{id.substring(0,8)}</span></div>
                 <div className="flex justify-between items-center py-2 border-b border-indigo-muted/20 text-base"><span className="text-ivory/60">Token Standard</span><span className="text-ivory font-semibold">ERC-721</span></div>
                 <div className="flex justify-between items-center py-2 border-b border-indigo-muted/20 text-base"><span className="text-ivory/60">Blockchain</span><span className="text-ivory font-semibold">Ethereum (Sepolia)</span></div>
               </div>
            )}
          </div>
        </div>

        <div className="w-full lg:w-1/2">
           <div className="flex border-b border-indigo-muted/30 mb-6 font-serif">
            <button className={`px-4 sm:px-6 py-4 transition-colors border-b-2 font-semibold text-lg ${activeTabRight === 'listing' ? 'border-blue-500 text-blue-400' : 'border-transparent text-ivory/50 hover:text-ivory'}`} onClick={() => setActiveTabRight('listing')}>Listing</button>
            <button className={`px-4 sm:px-6 py-4 transition-colors border-b-2 font-semibold text-lg flex items-center gap-2 ${activeTabRight === 'offers' ? 'border-blue-500 text-blue-400' : 'border-transparent text-ivory/50 hover:text-ivory'}`} onClick={() => setActiveTabRight('offers')}>Offers <span className="bg-blue-500/20 text-blue-400 text-xs px-2 py-0.5 rounded-full border border-blue-500/30">3</span></button>
          </div>
          
          <div className="min-h-[250px] p-2">
             {activeTabRight === 'offers' && (
               <div className="w-full overflow-x-auto rounded-xl border border-indigo-muted/30 bg-navy-light/10">
                 <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead>
                     <tr className="border-b border-indigo-muted/30 text-ivory/40 uppercase tracking-widest text-xs bg-[#0c1b33]/60">
                       <th className="py-4 px-6 font-semibold">Price</th>
                       <th className="py-4 px-6 font-semibold">Floor Difference</th>
                       <th className="py-4 px-6 font-semibold">Date</th>
                       <th className="py-4 px-6 font-semibold text-right">From</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-indigo-muted/20">
                     {mockOffers.map((offer, i) => (
                       <tr key={i} className="hover:bg-navy-light/30 transition-colors text-ivory/80">
                         <td className="py-5 px-6 font-bold text-ivory text-base"><span className="mr-2 inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span> {offer.price} ETH</td>
                         <td className="py-5 px-6 text-ivory/60">{offer.diff}</td>
                         <td className="py-5 px-6 text-ivory/50">{offer.date}</td>
                         <td className="py-5 px-6 text-blue-400 font-medium hover:text-blue-300 cursor-pointer text-right hover:underline">{offer.from}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
             {activeTabRight === 'listing' && (
               <div className="text-center py-16 bg-navy-light/10 border border-indigo-muted/30 rounded-xl">
                 <p className="text-ivory/50 italic text-lg">No multi-listings found.</p>
                 <p className="text-ivory/30 text-sm mt-2">Single native asset on AuraArt.</p>
               </div>
             )}
          </div>
        </div>

      </div>

      <div className="mb-20">
         <h2 className="font-serif text-2xl font-bold text-ivory mb-6 flex items-center gap-3">
           <TrendingUp className="text-ivory/60" /> Price history
         </h2>
         <div className="bg-[#0c1b33]/40 border border-indigo-muted/50 rounded-2xl pb-4 overflow-hidden shadow-painting">
            {historyLoading ? (
               <div className="py-24 text-center text-ivory/40 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-gold"/>
                  <p>Loading distributed ledger history...</p>
               </div>
            ) : (
               <>
               <div className="flex flex-wrap items-center justify-between gap-6 p-6 sm:p-8 bg-[#030712]/30 border-b border-indigo-muted/30">
                  <div><p className="text-[11px] text-ivory/50 uppercase tracking-widest font-semibold mb-2">Increase</p><p className={`${priceIncrease >= 0 ? 'text-green-400' : 'text-red-400'} font-bold text-2xl flex items-center gap-1 drop-shadow-sm`}>{priceIncrease >= 0 ? <ArrowUpRight className="h-5 w-5"/> : <TrendingDown className="h-5 w-5"/>} {Math.abs(priceIncrease).toFixed(2)}%</p></div>
                  <div className="w-px h-12 bg-indigo-muted/30 hidden md:block"></div>
                  <div><p className="text-[11px] text-ivory/50 uppercase tracking-widest font-semibold mb-2">Starting price</p><p className="text-ivory font-bold text-2xl drop-shadow-sm"><span className="text-blue-400 text-sm font-semibold tracking-wide mr-1 "><TrendingUp className="inline w-3 h-3"/> ETH</span> {startingPrice.toFixed(2)}</p></div>
                  <div className="w-px h-12 bg-indigo-muted/30 hidden md:block"></div>
                  <div><p className="text-[11px] text-ivory/50 uppercase tracking-widest font-semibold mb-2">Current price</p><p className="text-ivory font-bold text-2xl drop-shadow-sm"><span className="text-blue-400 text-sm font-semibold tracking-wide mr-1"><TrendingUp className="inline w-3 h-3"/> ETH</span> {currentPrice}</p></div>
                  <div className="w-px h-12 bg-indigo-muted/30 hidden md:block"></div>
                  <div><p className="text-[11px] text-ivory/50 uppercase tracking-widest font-semibold mb-2">Lowest price</p><p className="text-ivory font-bold text-2xl drop-shadow-sm"><span className="text-blue-400 text-sm font-semibold tracking-wide mr-1">ETH</span> {lowestPrice.toFixed(2)}</p></div>
                  <div className="w-px h-12 bg-indigo-muted/30 hidden md:block"></div>
                  <div><p className="text-[11px] text-ivory/50 uppercase tracking-widest font-semibold mb-2">Highest price</p><p className="text-ivory font-bold text-2xl drop-shadow-sm"><span className="text-blue-400 text-sm font-semibold tracking-wide mr-1">ETH</span> {highestPrice.toFixed(2)}</p></div>
                  <div className="flex-1 text-right">
                     <select className="bg-navy-light/50 border border-indigo-muted/50 text-ivory/80 text-sm rounded-lg py-2 px-4 focus:outline-none focus:border-blue-500 font-medium cursor-pointer">
                        <option>All time</option>
                        <option>Last 30 days</option>
                     </select>
                  </div>
               </div>
               
               <div className="w-full h-64 relative flex items-end px-4 mt-6">
                  <div className="absolute inset-x-8 top-[20%] h-px bg-indigo-muted/10"></div>
                  <div className="absolute inset-x-8 top-[40%] h-px bg-indigo-muted/10"></div>
                  <div className="absolute inset-x-8 top-[60%] h-px bg-indigo-muted/10"></div>
                  <div className="absolute inset-x-8 top-[80%] h-px bg-indigo-muted/10"></div>
                  
                  <svg className="absolute inset-0 h-full w-full px-8 py-2 overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                     {points.length > 1 && <path d={pathD} fill="none" stroke="#3b82f6" strokeWidth="2.5" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.4))' }} />}
                     {points.map((p, i) => {
                        const x = points.length > 1 ? (i / (points.length - 1)) * wSvg : wSvg / 2;
                        const y = hSvg - ((p.price - minP) / rangeP) * hSvg;
                        return (
                           <g key={i}>
                             <circle cx={x} cy={y} r="4" fill="#030712" stroke="#3b82f6" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                             {/* Optional tooltip hover hotspot could go here */}
                           </g>
                        );
                     })}
                  </svg>
               </div>
               <div className="flex justify-between text-xs font-semibold uppercase tracking-widest text-ivory/30 mt-6 px-12 pb-4">
                  {labelsX.map((l, i) => <span key={i}>{l}</span>)}
               </div>
               </>
            )}
         </div>
      </div>

      <div className="mb-24">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-serif text-2xl font-bold text-ivory flex items-center gap-3">
             <History className="h-5 w-5 text-ivory/60" /> Activities
          </h2>
          <div className="flex gap-4">
             <select className="bg-[#0c1b33]/80 border border-indigo-muted/50 text-ivory text-sm rounded-lg py-2.5 px-4 font-medium focus:border-blue-500 shadow-sm cursor-pointer hover:bg-navy-light/40 transition-colors">
                <option>Filter: All events</option>
                <option>Sales</option>
                <option>Listings</option>
             </select>
             <select className="hidden sm:block bg-[#0c1b33]/80 border border-indigo-muted/50 text-ivory text-sm rounded-lg py-2.5 px-4 font-medium focus:border-blue-500 shadow-sm cursor-pointer hover:bg-navy-light/40 transition-colors">
                <option>All time</option>
                <option>This year</option>
             </select>
          </div>
        </div>
        <div className="bg-[#0c1b33]/40 rounded-2xl border border-indigo-muted/50 overflow-hidden shadow-painting backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="bg-[#030712]/50 border-b border-indigo-muted/30">
                  <th className="py-6 px-8 font-semibold text-ivory/40 uppercase tracking-widest text-xs">Event</th>
                  <th className="py-6 px-8 font-semibold text-ivory/40 uppercase tracking-widest text-xs">Price</th>
                  <th className="py-6 px-8 font-semibold text-ivory/40 uppercase tracking-widest text-xs">From</th>
                  <th className="py-6 px-8 font-semibold text-ivory/40 uppercase tracking-widest text-xs">To</th>
                  <th className="py-6 px-8 font-semibold text-ivory/40 uppercase tracking-widest text-xs">Date</th>
                  <th className="py-6 px-8 text-right font-semibold text-ivory/40 uppercase tracking-widest text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-muted/20">
                {nft.status === 'owned' && (
                  <tr className="hover:bg-navy-light/20 transition-colors group">
                    <td className="py-5 px-8 font-bold text-green-400">Purchased</td>
                    <td className="py-5 px-8 font-bold text-ivory text-base">{nft.price} ETH</td>
                    <td className="py-5 px-8 text-ivory/80 truncate max-w-[120px]" title={nft.creator}>{nft.creator}</td>
                    <td className="py-5 px-8 text-ivory/80 truncate max-w-[120px]" title={nft.ownerId}>{nft.ownerId}</td>
                    <td className="py-5 px-8 text-ivory/50">Just now</td>
                    <td className="py-5 px-8 text-blue-400 font-medium hover:text-blue-300 text-right cursor-pointer hover:underline">Detail</td>
                  </tr>
                )}
                {nft.status === 'available' && (
                  <tr className="hover:bg-navy-light/20 transition-colors group">
                    <td className="py-5 px-8 font-bold text-ivory">Listed</td>
                    <td className="py-5 px-8 font-bold text-ivory text-base">{nft.price} ETH</td>
                    <td className="py-5 px-8 text-ivory/80 truncate max-w-[120px]">{nft.ownerId}</td>
                    <td className="py-5 px-8 text-ivory/30">--</td>
                    <td className="py-5 px-8 text-ivory/50">Just now</td>
                    <td className="py-5 px-8 text-blue-400 font-medium hover:text-blue-300 text-right cursor-pointer hover:underline">Detail</td>
                  </tr>
                )}
                <tr className="hover:bg-navy-light/20 transition-colors group">
                  <td className="py-5 px-8 font-bold text-blue-400">Transferred</td>
                  <td className="py-5 px-8 font-bold text-ivory/30 text-base">--</td>
                  <td className="py-5 px-8 text-ivory/80 truncate max-w-[120px]">0xSystem...0b2</td>
                  <td className="py-5 px-8 text-ivory/80 truncate max-w-[120px]">{nft.creator}</td>
                  <td className="py-5 px-8 text-ivory/50">May 18, 2026 at 10:00AM</td>
                  <td className="py-5 px-8 text-blue-400 font-medium hover:text-blue-300 text-right cursor-pointer hover:underline">Detail</td>
                </tr>
                <tr className="hover:bg-navy-light/20 transition-colors group">
                  <td className="py-5 px-8 font-bold text-gold">Minted</td>
                  <td className="py-5 px-8 font-bold text-ivory text-base">{nft.price} ETH</td>
                  <td className="py-5 px-8 text-ivory/40 italic">0x00...000 (Mint)</td>
                  <td className="py-5 px-8 text-ivory/80 truncate max-w-[120px] hover:underline cursor-pointer text-blue-400" title={nft.creator}>{nft.creator}</td>
                  <td className="py-5 px-8 text-ivory/50">{nft.createdAt ? new Date(nft.createdAt).toLocaleDateString() : 'May 17, 2026 at 10:00AM'}</td>
                  <td className="py-5 px-8 text-blue-400 font-medium hover:text-blue-300 text-right cursor-pointer hover:underline">Detail</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {otherItems.length > 0 && (
         <div className="pt-8 border-t border-indigo-muted/30 pb-20">
           <div className="flex justify-between items-center mb-10">
             <h2 className="font-serif text-3xl font-bold text-ivory drop-shadow-sm flex items-center gap-3">
               Other items from this collection
             </h2>
             <Button variant="outline" size="sm" className="hidden sm:block border-indigo-muted text-ivory/70 hover:text-ivory hover:bg-navy-light/50 px-6 rounded-lg font-medium">View all</Button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 xl:gap-8">
             {otherItems.map(item => (
                <NFTCard
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  creator={item.creator}
                  price={item.price}
                  imageUrl={item.image}
                />
             ))}
           </div>
         </div>
      )}

    </div>
  );
}
