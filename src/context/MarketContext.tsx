"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { collection, doc, getDoc, getDocs, setDoc, onSnapshot, writeBatch, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// --- TYPES ---
export type NFTStatus = 'available' | 'sold' | 'owned';

export interface NFT {
  id: string;
  tokenId?: number;
  title: string;
  creator: string;
  ownerId: string;
  price: number;
  image: string;
  status: NFTStatus;
  collection?: string;
  createdAt?: string;
  txHash?: string;
  description?: string;
}

export interface PurchaseHistoryItem {
  id: string; // transaction id
  nftId: string;
  title: string;
  creator: string;
  image: string;
  price: number;
  date: string;
  txHash: string;
  buyerId: string;
  sellerId: string;
}

export interface MarketContextType {
  // Auth
  isLoggedIn: boolean;
  walletAddress: string | null;
  userProfile: any | null;
  login: () => Promise<void>;
  logout: () => void;
  
  // Cart
  cartItems: NFT[];
  addToCart: (nft: NFT) => void;
  removeFromCart: (nftId: string) => void;
  clearCart: () => void;
  
  // Market Data
  nfts: NFT[];
  ownedNFTs: NFT[];
  purchaseHistory: PurchaseHistoryItem[];
  
  processPurchase: (items: NFT[]) => Promise<string>;
  listNFT: (nftId: string, newPrice: number) => Promise<void>;
  cancelListing: (nftId: string) => Promise<void>;
  getNFTById: (id: string) => NFT | undefined;
}

const MarketContext = createContext<MarketContextType | undefined>(undefined);

// Define window interface for TypeScript since we are accessing window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}

export function MarketProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [cartItems, setCartItems] = useState<NFT[]>([]);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistoryItem[]>([]);

  // Listen to Current User Profile in real-time
  useEffect(() => {
    if (!walletAddress) {
      setUserProfile(null);
      return;
    }
    const unsub = onSnapshot(doc(db, 'users', walletAddress), (snapshot) => {
      if (snapshot.exists()) {
        setUserProfile(snapshot.data());
      }
    });
    return () => unsub();
  }, [walletAddress]);

  // Listen to NFTs in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'nfts'), (snapshot) => {
      const fetchedNfts: NFT[] = [];
      snapshot.forEach(doc => {
        fetchedNfts.push({ id: doc.id, ...doc.data() } as NFT);
      });
      setNfts(fetchedNfts);
    }, (error) => {
      console.error("Error fetching NFTs: ", error); // Handle likely empty DB or permission errors
    });
    return () => unsub();
  }, []);

  // Listen to Transactions for current user in real-time
  useEffect(() => {
     if (!walletAddress) {
       setPurchaseHistory([]);
       return;
     }

     const q = query(collection(db, 'transactions'), where('buyerId', '==', walletAddress));
     const unsub = onSnapshot(q, (snapshot) => {
       const history: PurchaseHistoryItem[] = [];
       snapshot.forEach(doc => {
         history.push({ id: doc.id, ...doc.data() } as PurchaseHistoryItem);
       });
       setPurchaseHistory(history);
     }, (error) => {
       console.error("Error fetching Transactions: ", error);
     });

     return () => unsub();
  }, [walletAddress]);

  // Derived state
  const ownedNFTs = nfts.filter(nft => nft.ownerId === walletAddress);

  const login = async () => {
    if (typeof window === 'undefined' || typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed. Please install it to use this app.');
      return;
    }
    
    try {
      // Explicitly request accounts first
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      
      // Store user in Firestore if not exists
      const userRef = doc(db, 'users', address);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          walletAddress: address,
          username: `User-${address.substring(0, 6)}`,
          role: 'buyer',
          joinedAt: new Date().toISOString()
        });
      }
      
      setWalletAddress(address);
      setIsLoggedIn(true);
    } catch (error: any) {
      console.error("Login Error:", error);
      // Reveal the specific error object in the alert so we can debug if it's Firebase or MetaMask
      alert(`Failed to login: ${error?.message || 'Unknown error'}`);
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setWalletAddress(null);
    setCartItems([]);
  };

  const addToCart = (nft: NFT) => {
    if (!cartItems.find(item => item.id === nft.id)) {
      setCartItems([...cartItems, nft]);
    }
  };

  const removeFromCart = (nftId: string) => {
    setCartItems(cartItems.filter(item => item.id !== nftId));
  };

  const clearCart = () => setCartItems([]);

  const getNFTById = (id: string) => {
    return nfts.find(n => n.id === id);
  };

  const processPurchase = async (items: NFT[]): Promise<string> => {
    if (!isLoggedIn || !walletAddress) throw new Error("User not connected"); 
    
    try {
      const totalPrice = items.reduce((acc, item) => acc + item.price, 0);
      const fee = totalPrice * 0.015;
      const gasEstimate = items.length > 0 ? 0.005 : 0;
      const finalAmount = totalPrice + fee + gasEstimate;
      
      if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask is not installed. Please install it to use this feature.");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) {
        throw new Error("Wrong network! Please switch MetaMask to Sepolia Testnet.");
      }
      
      const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x93A7463146f50e58F5cfA28Da72B5A7de7B49386";
      
      const extendedABI = [
         "function buyNFT(uint256 tokenId) public payable",
         "function ownerOf(uint256 tokenId) public view returns (address)"
      ];
      const nftContract = new ethers.Contract(CONTRACT_ADDRESS, extendedABI, signer);
      
      let lastTxHash = "";
      const batch = writeBatch(db);

      for (const item of items) {
          if (item.tokenId === undefined || item.tokenId === null) {
              throw new Error(`NFT "${item.title}" is missing an on-chain tokenId. It cannot be purchased natively.`);
          }
          
          // Verify Current Ownership on-chain
          const currentOwner = await nftContract.ownerOf(item.tokenId);
          if (currentOwner.toLowerCase() === walletAddress.toLowerCase()) {
              throw new Error(`You already own NFT: ${item.title}`);
          }
          
          const priceInWei = ethers.parseEther(item.price.toString());
          
          // Execute Atomic Purchase via Smart Contract!
          const tx = await nftContract.buyNFT(item.tokenId, { value: priceInWei });
          const receipt = await tx.wait();
          
          lastTxHash = receipt?.hash || tx.hash;
          if (!lastTxHash) throw new Error("Transaction hash was not generated.");
          
          // Verify New Ownership on-chain
          const newOwner = await nftContract.ownerOf(item.tokenId);
          if (newOwner.toLowerCase() !== walletAddress.toLowerCase()) {
              throw new Error(`Ownership transfer verification failed for NFT: ${item.title}`);
          }
          
          // Validate uniqueness against DB records
          const q = query(collection(db, 'transactions'), where('txHash', '==', lastTxHash));
          const duplicateSnap = await getDocs(q);
          if (!duplicateSnap.empty) {
             throw new Error("This transaction was already recorded (Duplicate TxHash).");
          }
          
          // 1. Update NFT Document
          const nftRef = doc(db, 'nfts', item.id);
          batch.update(nftRef, {
            status: 'owned',
            ownerId: walletAddress,
            txHash: lastTxHash
          });
          
          // 2. Add Transaction Record
          const txRef = doc(collection(db, 'transactions'));
          batch.set(txRef, {
            nftId: item.id,
            tokenId: item.tokenId,
            title: item.title,
            creator: item.creator,
            image: item.image,
            price: item.price,
            date: new Date().toISOString(),
            txHash: lastTxHash,
            buyerId: walletAddress,
            sellerId: item.ownerId || currentOwner
          });
      }
      
      await batch.commit();
      
      // Remove purchased items from cart
      const purchasedIds = items.map(i => i.id);
      setCartItems(cartItems.filter(item => !purchasedIds.includes(item.id)));
      
      return lastTxHash;
    } catch (error) {
      console.error("Purchase Error:", error);
      throw error; // Let UI handle error
    }
  };

  const listNFT = async (nftId: string, newPrice: number) => {
    if (!isLoggedIn || !walletAddress) return;
    
    try {
      const nftRef = doc(db, 'nfts', nftId);
      await setDoc(nftRef, {
        status: 'available',
        price: Number(newPrice)
      }, { merge: true });
      
      alert('Masterpiece listed successfully on the global market!');
    } catch (error) {
      console.error("Listing Error:", error);
      alert('Failed to list the masterpiece.');
    }
  };

  const cancelListing = async (nftId: string) => {
    if (!isLoggedIn || !walletAddress) return;
    
    try {
      const nftRef = doc(db, 'nfts', nftId);
      await setDoc(nftRef, {
        status: 'owned'
      }, { merge: true });
      
      alert('Listing removed successfully.');
    } catch (error) {
      console.error("Cancel Listing Error:", error);
      alert('Failed to remove the listing.');
    }
  };

  const value = {
    isLoggedIn,
    walletAddress,
    userProfile,
    login,
    logout,
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    nfts,
    ownedNFTs,
    purchaseHistory,
    processPurchase,
    listNFT,
    cancelListing,
    getNFTById
  };

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (context === undefined) {
    throw new Error('useMarket must be used within a MarketProvider');
  }
  return context;
}
