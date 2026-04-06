"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { NFTCard } from '@/components/NFTCard';
import { Settings, Wallet, Box, Clock, Repeat, Edit3, Fingerprint, X, UploadCloud } from 'lucide-react';
import { useMarket } from '@/context/MarketContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

export default function BuyerDashboard() {
  const [activeTab, setActiveTab] = useState('collection');
  const { isLoggedIn, login, walletAddress, ownedNFTs, purchaseHistory, nfts, userProfile: globalUserProfile, cancelListing } = useMarket();
  const [userProfile, setUserProfile] = useState<any>(null);

  // Settings Modal State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editData, setEditData] = useState({ username: '', bio: '', avatarUrl: '', coverUrl: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (walletAddress) {
        try {
          // Alternatively we could just use globalUserProfile, but fetching once ensures immediate local freshness on page load 
          // However, using the global state directly is better. We'll set initial editData based on it.
          const snap = await getDoc(doc(db, 'users', walletAddress));
          if (snap.exists()) {
            const data = snap.data();
            setUserProfile(data);
            setEditData({
              username: data.username || '',
              bio: data.bio || '',
              avatarUrl: data.avatarUrl || '',
              coverUrl: data.coverUrl || ''
            });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      }
    }
    fetchProfile();
  }, [walletAddress]);

  // Keep local userProfile in sync with globalUserProfile if it updates from elsewhere
  useEffect(() => {
    if (globalUserProfile) {
      setUserProfile(globalUserProfile);
    }
  }, [globalUserProfile]);

  const handleSaveProfile = async () => {
    if (!walletAddress) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'users', walletAddress), editData, { merge: true });
      setUserProfile((prev: any) => ({ ...prev, ...editData }));
      setIsEditingProfile(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert('Failed to update profile.');
    }
    setIsSaving(false);
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;

        // Only scale down if image is larger than MAX_WIDTH
        if (img.width > MAX_WIDTH) {
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
        } else {
          canvas.width = img.width;
          canvas.height = img.height;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Compress to 80% quality JPEG
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/jpeg', 0.8);
      };
      img.onerror = error => reject(error);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file || !walletAddress) return;

    // 1. "Optimistic UI": Instant Preview
    // Tự động tạo một URL tạm thời từ file dưới máy và hiển thị ngay lập tức
    const localPreviewUrl = URL.createObjectURL(file);
    setEditData(prev => ({
      ...prev,
      [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: localPreviewUrl
    }));

    try {
      if (type === 'avatar') setUploadingAvatar(true);
      if (type === 'cover') setUploadingCover(true);

      // Compress image before uploading to make it significantly faster
      const compressedBlob = await compressImage(file);

      // Create a unique file path based on wallet and timestamp
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `${walletAddress}/${type}_${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage in the 'profiles' bucket
      const { error: uploadError } = await supabase
        .storage
        .from('Auraart')
        .upload(fileName, compressedBlob, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the real downloadable URL from Supabase
      const { data: { publicUrl } } = supabase
        .storage
        .from('Auraart')
        .getPublicUrl(fileName);

      // Silently swap the temporary local URL with the real Supabase URL
      setEditData(prev => ({
        ...prev,
        [type === 'avatar' ? 'avatarUrl' : 'coverUrl']: publicUrl
      }));

    } catch (error) {
      console.error("Upload error:", error);
      alert('Failed to upload image. Please check your Supabase credentials and Storage policies.');
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      if (type === 'cover') setUploadingCover(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-24 text-center max-w-lg flex-1">
        <h1 className="font-serif text-3xl font-bold text-ivory mb-6">Profile Access Restricted</h1>
        <p className="text-ivory/60 mb-8">Please connect your wallet to view your digital art collection and purchase history.</p>
        <Button variant="default" size="lg" onClick={login} className="rounded-xl w-full">Connect Wallet</Button>
      </div>
    );
  }

  const activeListings = nfts.filter(nft => nft.ownerId === walletAddress && (nft.status === 'available' || !nft.status));

  const username = userProfile?.username || `User-${walletAddress?.substring(0, 6)}`;
  const role = userProfile?.role || 'Buyer';
  const roleCapitalized = role.charAt(0).toUpperCase() + role.slice(1);
  const avatarUrl = userProfile?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400";
  const coverUrl = userProfile?.coverUrl || "https://images.unsplash.com/photo-1561214115-f2f134cc4912?auto=format&fit=crop&q=80&w=2000";
  const bio = userProfile?.bio || "";

  return (
    <div className="flex flex-col min-h-screen mb-20 relative">
      {/* Settings Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 py-10">
            <div className="bg-[#0c1b33] border border-gold/30 p-6 rounded-2xl w-full max-w-md shadow-glow-gold relative">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-serif text-2xl font-bold text-ivory">Edit Profile</h2>
                <button onClick={() => setIsEditingProfile(false)} className="text-ivory/60 hover:text-red-400">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-ivory/70 mb-1">Username</label>
                  <input
                    type="text"
                    value={editData.username}
                    onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                    className="w-full bg-[#030712] border border-indigo-muted rounded-lg px-4 py-2 text-ivory focus:border-gold outline-none"
                    placeholder="Enter username"
                  />
                </div>

                <div>
                  <label className="block text-sm text-ivory/70 mb-1">Bio</label>
                  <textarea
                    value={editData.bio}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="w-full bg-[#030712] border border-indigo-muted rounded-lg px-4 py-2 text-ivory focus:border-gold outline-none h-24 resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm text-ivory/70 mb-2">Avatar Image</label>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-full bg-navy-light overflow-hidden border border-indigo-muted flex-shrink-0">
                      {editData.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={editData.avatarUrl} alt="Preview" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-ivory/30">?</div>
                      )}
                    </div>
                    <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-navy-light hover:bg-[#1a2d4c] transition-colors border border-indigo-muted rounded-lg text-sm text-ivory">
                      <UploadCloud className="h-4 w-4" />
                      {uploadingAvatar ? 'Uploading...' : 'Upload File'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingAvatar} onChange={(e) => handleImageUpload(e, 'avatar')} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-ivory/70 mb-2">Cover Image</label>
                  <div className="flex flex-col gap-3">
                    {editData.coverUrl && (
                      <div className="h-20 w-full rounded-lg bg-navy-light overflow-hidden border border-indigo-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={editData.coverUrl} alt="Cover Preview" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-navy-light hover:bg-[#1a2d4c] transition-colors border border-indigo-muted rounded-lg text-sm text-ivory w-fit">
                      <UploadCloud className="h-4 w-4" />
                      {uploadingCover ? 'Uploading...' : 'Upload File'}
                      <input type="file" accept="image/*" className="hidden" disabled={uploadingCover} onChange={(e) => handleImageUpload(e, 'cover')} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setIsEditingProfile(false)}>Cancel</Button>
                <Button onClick={handleSaveProfile} disabled={isSaving || uploadingAvatar || uploadingCover} className="bg-gold text-black hover:bg-yellow-500">
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Banner & Avatar */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden border-b border-indigo-muted/50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={coverUrl} alt="Cover" className="h-full w-full object-cover blur-sm brightness-[0.4]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030712] to-transparent" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10 flex-1 flex flex-col">
        {/* Profile Card */}
        <div className="flex flex-col md:flex-row gap-6 items-end md:items-center mb-8 bg-[#0c1b33]/80 backdrop-blur-md p-6 rounded-2xl border border-indigo-muted/50 shadow-painting">
          <div className="h-32 w-32 rounded-full border-4 border-gold bg-[#030712] overflow-hidden shadow-glow-gold relative group" onClick={() => setIsEditingProfile(true)}>
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10">
              <Edit3 className="text-white h-6 w-6" />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
          </div>

          <div className="flex-1 mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">
              <div>
                <h1 className="font-serif text-3xl font-bold text-ivory flex items-center gap-2">
                  {username} <Badge variant="safe" className="ml-2 bg-green-500/10 border-green-500/30 text-green-400">{roleCapitalized}</Badge>
                </h1>
                <div className="flex items-center gap-4 mt-2 mb-3">
                  <span className="flex items-center gap-2 text-sm text-ivory/60 bg-navy-light px-3 py-1 rounded-full border border-indigo-muted" title={walletAddress || ""}>
                    <Wallet className="h-4 w-4" /> {walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : 'Loading...'}
                  </span>
                  {userProfile?.isAIVerified && (
                    <span className="flex items-center gap-2 text-sm text-ivory/60 bg-navy-light px-3 py-1 rounded-full border border-indigo-muted">
                      <Fingerprint className="h-4 w-4" /> AI Verified
                    </span>
                  )}
                </div>
                {bio && <p className="text-ivory/80 text-sm max-w-xl">{bio}</p>}
              </div>

              <div className="flex gap-3 mt-2 md:mt-0">
                <Button variant="outline" className="gap-2" onClick={() => setIsEditingProfile(true)}>
                  <Settings className="h-4 w-4" /> Settings
                </Button>
                <Button variant="default" className="shadow-glow-gold">
                  Fund Wallet
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Golden Section Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-gold/50 to-transparent my-4"></div>

        {/* Dashboard Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-indigo-muted/40 mb-8 w-full sticky top-[80px] z-30 bg-[#030712]/90 backdrop-blur-md pt-4">
          <button
            onClick={() => setActiveTab('collection')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'collection' ? 'border-b-2 border-gold text-gold shadow-[0_1px_10px_rgba(247,208,2,0.2)]' : 'text-ivory/60 hover:text-ivory'}`}
          >
            <Box className="h-4 w-4" /> Owned Masterpieces
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-gold text-gold shadow-[0_1px_10px_rgba(247,208,2,0.2)]' : 'text-ivory/60 hover:text-ivory'}`}
          >
            <Clock className="h-4 w-4" /> Purchase History
          </button>
          <button
            onClick={() => setActiveTab('resell')}
            className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === 'resell' ? 'border-b-2 border-gold text-gold shadow-[0_1px_10px_rgba(247,208,2,0.2)]' : 'text-ivory/60 hover:text-ivory'}`}
          >
            <Repeat className="h-4 w-4" /> Resell Tracking
          </button>
        </div>

        {/* Tab Content */}
        <div className="pb-20">
          {activeTab === 'collection' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {ownedNFTs.length === 0 ? (
                <p className="text-ivory/60 col-span-full">Your collection is empty. Explore the market to acquire new pieces.</p>
              ) : (
                ownedNFTs.map(nft => (
                  <NFTCard key={nft.id} id={nft.id} title={nft.title} creator={nft.creator} price={nft.price} imageUrl={nft.image} />
                ))
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-[#0c1b33]/40 rounded-2xl border border-indigo-muted p-6 shadow-painting">
              <h3 className="font-serif text-xl font-bold text-ivory mb-6">Recent Acquisitions</h3>
              <div className="space-y-4">
                {purchaseHistory.length === 0 ? (
                  <p className="text-ivory/60">No recent acquisitions found.</p>
                ) : (
                  purchaseHistory.map((item, i) => (
                    <div key={i} className="flex gap-4 p-4 rounded-xl border border-indigo-muted/50 bg-navy-light/30 items-center hover:bg-navy-light/60 transition-colors">
                      <div className="h-16 w-16 rounded-md overflow-hidden flex-shrink-0 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-ivory">Purchased <span className="text-gold">{item.title}</span></p>
                        <p className="text-sm text-ivory/60 mt-1">From {item.creator} &bull; {new Date(item.date).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gold">{item.price} ETH</p>
                        <a href={`https://etherscan.io/tx/${item.txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:text-blue-300">View Tx</a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'resell' && (
            <div className="bg-[#0c1b33]/40 rounded-2xl border border-indigo-muted p-6 shadow-painting">
              <div className="flex justify-between items-center mb-6 border-b border-indigo-muted/40 pb-4">
                <h3 className="font-serif text-xl font-bold text-ivory">Active Listings</h3>
              </div>

              <div className="flex flex-col gap-6">
                {activeListings.length === 0 ? (
                  <p className="text-ivory/60">You have no active listings on the market.</p>
                ) : (
                  activeListings.map(listing => (
                    <div key={listing.id} className="flex flex-col sm:flex-row gap-6 p-4 rounded-xl border border-gold/30 bg-gold/5 items-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                      <div className="h-24 w-24 rounded-md overflow-hidden flex-shrink-0 border border-gold/40 shadow-sm relative z-10">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={listing.image} alt={listing.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 relative z-10 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                          <Link href={`/nft/${listing.id}`} className="font-serif text-xl font-bold text-ivory hover:text-gold transition-colors">{listing.title}</Link>
                          <Badge variant="outline" className="border-gold text-gold bg-gold/10">Active</Badge>
                        </div>
                        <p className="text-sm text-ivory/60 mb-3">Listed directly from your collection</p>
                        <div className="flex items-center justify-center sm:justify-start gap-4">
                          <span className="text-xs text-ivory/50">Current Price: <strong className="text-gold text-sm ml-1">{listing.price} ETH</strong></span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 relative z-10 w-full sm:w-auto mt-4 sm:mt-0">
                        <Link href={`/nft/${listing.id}`}>
                          <Button variant="outline" size="sm" className="w-full">Manage Listing</Button>
                        </Link>
                        <Button variant="bordeaux" size="sm" className="w-full" onClick={() => cancelListing(listing.id)}>Cancel Listing</Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
