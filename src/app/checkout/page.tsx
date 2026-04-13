"use client";

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, ChevronRight, Lock, Wallet, ExternalLink, Loader2 } from 'lucide-react';
import { useMarket, NFT } from '@/context/MarketContext';

function CheckoutContent() {
  const [step, setStep] = useState(2);
  const router = useRouter();
  
  // Next.js hook for query params
  const searchParams = useSearchParams();
  const directId = searchParams?.get('direct');

  const { cartItems, getNFTById, processPurchase, isLoggedIn, login } = useMarket();

  const checkoutItems: NFT[] = React.useMemo(() => {
    if (directId) {
       const item = getNFTById(directId);
       return item ? [item] : [];
    }
    return cartItems;
  }, [directId, cartItems, getNFTById]);

  const subtotal = checkoutItems.reduce((acc, item) => acc + item.price, 0);
  const fee = subtotal * 0.015;
  const gas = checkoutItems.length > 0 ? 0.005 : 0;
  const total = checkoutItems.length > 0 ? subtotal + fee + gas : 0;

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState('');

  const handleConfirm = async () => {
    if (!isLoggedIn) {
      login();
      return;
    }
    if (checkoutItems.length === 0) return;
    
    setIsProcessing(true);
    try {
      const hash = await processPurchase(checkoutItems);
      setTxHash(hash);
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      alert(`Transaction failed: ${error.message || 'Check console'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg flex-1">
        <h1 className="font-serif text-3xl font-bold text-ivory mb-6">Your Cart is Empty</h1>
        <p className="text-ivory/60 mb-8">It looks like you haven't added any masterpieces to your cart yet.</p>
        <Link href="/explore">
          <Button variant="default" size="lg" className="rounded-xl w-full">Continue Exploring</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8 max-w-5xl flex-1">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl font-bold text-gold drop-shadow-sm mb-6">Complete Acquisition</h1>
        
        {/* Constellation Step Indicator */}
        <div className="flex items-center justify-center max-w-3xl mx-auto relative">
          <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-indigo-muted/30 -z-10 -translate-y-1/2"></div>
          
          <div className="flex items-center gap-2 flex-1 relative z-10 w-full">
            <div className="h-8 w-8 rounded-full bg-gold shadow-glow-gold flex items-center justify-center text-navy font-bold text-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-gold whitespace-nowrap">Cart</span>
            <div className={`h-[2px] flex-1 ${step >= 2 ? 'bg-gold shadow-glow-gold' : 'bg-transparent'}`}></div>
          </div>
          
          <div className="flex items-center gap-2 flex-1 relative z-10 w-full pl-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${step >= 2 ? 'bg-gold shadow-glow-gold text-navy' : 'bg-[#0c1b33] border border-indigo-muted text-ivory/50'}`}>
              2
            </div>
            <span className={`text-sm font-medium whitespace-nowrap ${step >= 2 ? 'text-gold' : 'text-ivory/50'}`}>Checkout</span>
            <div className={`h-[2px] flex-1 ${step >= 3 ? 'bg-gold shadow-glow-gold' : 'bg-transparent'}`}></div>
          </div>
          
          <div className="flex items-center gap-2 relative z-10 pl-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${step >= 3 ? 'bg-gold shadow-glow-gold text-navy' : 'bg-[#0c1b33] border border-indigo-muted text-ivory/50'}`}>
              3
            </div>
            <span className={`text-sm font-medium whitespace-nowrap ${step >= 3 ? 'text-gold' : 'text-ivory/50'}`}>Confirm</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Summary Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0c1b33]/60 rounded-2xl border border-indigo-muted/50 p-6 shadow-painting">
            <h2 className="font-serif text-2xl font-bold text-ivory mb-6 border-b border-indigo-muted/40 pb-4">Acquisition Items</h2>
            
            <div className="space-y-4">
              {checkoutItems.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-6 items-center sm:items-start p-4 bg-navy-light/30 rounded-xl border border-indigo-muted/20 hover:border-gold/30 transition-colors">
                  <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border border-indigo-muted flex-shrink-0 shadow-sm relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`${item.image}?auto=format&fit=crop&q=80&w=400`} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left min-w-0">
                    <h3 className="font-serif text-xl font-bold text-ivory truncate w-full">{item.title}</h3>
                    <p className="text-sm text-ivory/60 mt-1 mb-3 truncate w-full">By {item.creator}</p>
                    <div className="text-xs bg-navy px-3 py-1 rounded-full border border-indigo-muted text-ivory/80 inline-block w-fit">ERC-721 Token</div>
                  </div>
                  <div className="flex flex-col items-center sm:items-end mt-4 sm:mt-0 flex-shrink-0 sm:ml-4">
                    <span className="text-xs text-ivory/50 uppercase tracking-widest mb-1 whitespace-nowrap">Fixed Price</span>
                    <span className="font-sans font-bold text-xl text-gold drop-shadow-[0_0_8px_rgba(247,208,2,0.4)] whitespace-nowrap">{item.price} ETH</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#0c1b33]/60 rounded-2xl border border-indigo-muted/50 p-6 shadow-painting space-y-4">
            <h2 className="font-serif text-xl font-bold text-ivory mb-4 border-b border-indigo-muted/40 pb-4">Payment Method</h2>
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-gold bg-gold/5 transition-colors">
              <input type="radio" name="payment" className="accent-gold focus:ring-gold" defaultChecked />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center p-1">
                  <div className="h-5 w-5 bg-blue-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-ivory">MetaMask</p>
                  <p className="text-xs text-ivory/60">0x1B4...8fA &bull; Balance: 4.2 ETH</p>
                </div>
              </div>
            </label>
            <label className="flex items-center gap-4 cursor-pointer p-4 rounded-xl border border-indigo-muted bg-navy-light/20 hover:border-indigo-muted/80 transition-colors">
              <input type="radio" name="payment" className="accent-gold focus:ring-gold" />
              <div className="flex items-center gap-3 opacity-70">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center p-1">
                  <div className="h-5 w-5 bg-green-500 rounded-full"></div>
                </div>
                <div>
                  <p className="font-medium text-ivory">WalletConnect</p>
                  <p className="text-xs text-ivory/60">Connect other wallets</p>
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Pricing Breakdown Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-28 bg-[#0c1b33]/80 rounded-2xl border border-indigo-muted/50 p-6 shadow-painting backdrop-blur-md">
            <h2 className="font-serif text-xl font-bold text-ivory mb-6 border-b border-indigo-muted/40 pb-4">Order Summary</h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-ivory/80">
                <span>Subtotal</span>
                <span className="font-medium">{subtotal.toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between items-center text-ivory/80">
                <span>Aura Platform Fee (1.5%)</span>
                <span className="font-medium">{fee.toFixed(3)} ETH</span>
              </div>
              <div className="flex justify-between items-center text-ivory/80">
                <span>Estimated Gas Fee</span>
                <span className="font-medium">{gas.toFixed(3)} ETH</span>
              </div>
              
              <div className="pt-4 mt-4 border-t border-indigo-muted/40 flex flex-col items-center justify-center text-center">
                <span className="text-xs text-ivory/60 uppercase tracking-widest mb-1">Total Payment</span>
                <span className="font-serif text-4xl font-bold text-gold drop-shadow-[0_0_15px_rgba(247,208,2,0.5)]">{total.toFixed(3)} ETH</span>
                <span className="text-sm text-ivory/50 mt-1">~ ${(total * 2805).toFixed(2)} USD</span>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {!isLoggedIn ? (
                <Button variant="default" onClick={login} className="w-full rounded-xl py-6 text-lg font-bold">
                  <Wallet className="mr-2 h-5 w-5" /> Connect to Confirm
                </Button>
              ) : (
                <Button variant="default" onClick={handleConfirm} disabled={isProcessing} className="w-full rounded-xl py-6 text-lg font-bold">
                  {isProcessing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> Processing...</> : 'Confirm Purchase'}
                </Button>
              )}
              <div className="flex items-center justify-center gap-2 text-xs text-ivory/50">
                <Lock className="h-3 w-3" />
                <span>Smart contract execution secured by AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c1b33]/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-[#0c1b33] border border-gold/30 shadow-[0_0_30px_rgba(247,208,2,0.15)] rounded-3xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-24 h-24 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
              <CheckCircle2 className="h-12 w-12 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            </div>
            
            <h2 className="font-serif text-3xl font-bold text-ivory mb-2">Transaction Successful!</h2>
            <p className="text-ivory/70 mb-8">Your purchase has been securely recorded on the blockchain.</p>
            
            <div className="bg-navy-light/40 border border-indigo-muted/30 rounded-xl p-4 mb-8">
              <p className="text-xs text-ivory/50 uppercase tracking-widest mb-2 font-semibold">Transaction Hash</p>
              {txHash ? (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 font-mono text-gold hover:text-gold-light hover:underline transition-colors text-lg"
                >
                  {txHash.substring(0,6)}...{txHash.substring(txHash.length-4)} <ExternalLink className="w-5 h-5" />
                </a>
              ) : (
                <span className="font-mono text-ivory/50">TxHash not available</span>
              )}
            </div>
            
            <Button 
              variant="default" 
              size="lg" 
              onClick={() => router.push('/profile')} 
              className="w-full rounded-xl py-6 text-lg font-bold shadow-glow-gold"
            >
              View My Collection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-32 text-center text-ivory/50">Loading secure checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
