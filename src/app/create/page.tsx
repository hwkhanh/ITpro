"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Image as ImageIcon, CheckCircle2, ShieldCheck, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ethers } from 'ethers';
import NFT_ABI from '@/lib/NFT_ABI.json';
import { useMarket } from '@/context/MarketContext';
import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x93A7463146f50e58F5cfA28Da72B5A7de7B49386";

export default function CreateNFTPage() {
  const router = useRouter();
  const { isLoggedIn, login, walletAddress, nfts } = useMarket();
  const [fileState, setFileState] = useState<'idle' | 'uploading' | 'scanning' | 'safe' | 'minting' | 'success' | 'error' | 'risk'>('idle');
  const [scanProgress, setScanProgress] = useState(0);

  // File and Meta States
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');

  // Minting States
  const [mintStatus, setMintStatus] = useState('');
  const [txHash, setTxHash] = useState('');

  // Get user's unique created collections
  const myCollections = useMemo(() => {
    if (!walletAddress || !nfts) return [];
    // Find all NFTs created by this user
    const myNfts = nfts.filter(nft => nft.creator === walletAddress && nft.collection);
    // Extract unique collection names
    const collections = Array.from(new Set(myNfts.map(nft => nft.collection)));
    return collections as string[];
  }, [nfts, walletAddress]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));

      setFileState('scanning');
      setScanProgress(0);

      // UI visual progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => (prev >= 90 ? 90 : prev + 10));
      }, 500);

      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const response = await fetch('${process.env.NEXT_PUBLIC_BACKEND_URL}/api/scan', {
          method: 'POST',
          body: formData,
        });

        clearInterval(progressInterval);
        setScanProgress(100);

        if (!response.ok) {
          throw new Error('AI Server is not reachable or returned an error.');
        }

        const data = await response.json();

        if (data.label === 'stego') {
          setFileState('error');
          setMintStatus(`Security Alert: Hidden data anomalies detected! (Confidence: ${(data.probability_stego * 100).toFixed(1)}%). Action Blocked.`);
        } else {
          setFileState('safe');
        }

      } catch (err: any) {
        clearInterval(progressInterval);
        setFileState('error');
        setMintStatus(`AI Scan Error: ${err.message || 'Cannot reach server'}`);
      }
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setFileState('idle');
    setMintStatus('');
    setTxHash('');
  };

  const handleMint = async () => {
    try {
      if (!file) {
        setMintStatus("Error: No file selected.");
        setFileState('error');
        return;
      }

      if (typeof window.ethereum === 'undefined') {
        setMintStatus("Error: MetaMask is not installed! Please install it.");
        setFileState('error');
        return;
      }

      setFileState('minting');
      setMintStatus("Step 1/3: Uploading artwork to Supabase Storage...");

      // 1. Upload image to Supabase
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `nfts/${walletAddress}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase
        .storage
        .from('Auraart')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Supabase upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase
        .storage
        .from('Auraart')
        .getPublicUrl(fileName);

      const finalCollection = selectedCollection === 'create_new' ? newCollectionName : selectedCollection;
      const metadataURI = publicUrl; // The image URL is used as the token URI on-chain

      // 2. Connect MetaMask
      setMintStatus("Step 2/3: Connecting to MetaMask...");
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      const network = await provider.getNetwork();
      if (Number(network.chainId) !== 11155111) {
        throw new Error("Wrong network! Please switch MetaMask to Sepolia Testnet.");
      }

      // 3. Mint on Smart Contract
      setMintStatus("Step 3/3: Awaiting wallet confirmation to mint...");

      const code = await provider.getCode(CONTRACT_ADDRESS);
      if (code === "0x" || code === "") {
        throw new Error(`CRITICAL ERROR: ${CONTRACT_ADDRESS} is NOT a smart contract! It has no bytecode. You likely copied your own wallet address or the wrong address from Remix instead of the Deployed Contract Address.`);
      }

      // Extend ABI to support the new Atomic Purchase Contract
      const extendedABI = [
        ...NFT_ABI,
        "function mintWithPrice(string uri, uint256 price) public returns (uint256)"
      ];
      const nftContract = new ethers.Contract(CONTRACT_ADDRESS, extendedABI, signer);

      const priceInWei = ethers.parseEther(price || "0.01");
      const tx = await nftContract.mintWithPrice(metadataURI, priceInWei, { gasLimit: 500000 });

      setMintStatus("Blockchain transaction submitted. Waiting for confirmation...");

      const receipt = await tx.wait();

      if (receipt && receipt.status === 0) {
        throw new Error("Transaction was REVERTED by the blockchain (Status 0). EVM dropped the execution.");
      }

      const realTxHash = receipt?.hash || tx.hash;
      setTxHash(realTxHash);
      if (!realTxHash) throw new Error("Transaction hash was not generated.");

      // Extract the tokenId robustly looking at all possible representations
      let mintedTokenId = null;
      for (const log of receipt.logs) {
        // Ethers v6 parsed EventLog check
        if ((log as any).eventName === 'Transfer' && (log as any).args) {
          mintedTokenId = Number((log as any).args[2]);
          break;
        }

        // Interface exact parsing
        try {
          const parsedLog = nftContract.interface.parseLog({ topics: log.topics.slice(), data: log.data });
          if (parsedLog && parsedLog.name === 'Transfer') {
            mintedTokenId = Number(parsedLog.args[2]);
            break;
          }
        } catch (e) { }

        // Transfer(address,address,uint256) raw signature hash fallback
        const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        if (log.topics && log.topics.length >= 4 && typeof log.topics[0] === 'string' && log.topics[0].toLowerCase() === TRANSFER_TOPIC) {
          mintedTokenId = Number(BigInt(log.topics[3]));
          break;
        }
      }

      if (mintedTokenId === null || isNaN(mintedTokenId)) {
        const serializedLogs = JSON.stringify(receipt.logs, (key, value) => typeof value === 'bigint' ? value.toString() : value);
        console.error("Failed logs:", serializedLogs);
        throw new Error(`Could not map blockchain Token ID. receipt.logs.length = ${receipt.logs.length}. Logs dump: ${serializedLogs.substring(0, 200)}...`);
      }

      // Validate uniqueness against DB records
      const q = query(collection(db, 'transactions'), where('txHash', '==', realTxHash));
      const duplicateSnap = await getDocs(q);
      if (!duplicateSnap.empty) {
        throw new Error("This transaction was already recorded (Duplicate TxHash).");
      }

      setMintStatus("Syncing to Marketplace Database...");

      const newDocRef = doc(collection(db, 'nfts'));
      await setDoc(newDocRef, {
        id: newDocRef.id,
        tokenId: mintedTokenId, // Store the Smart Contract Token ID
        title: title || "Untitled Masterpiece",
        description: description || "Minted securely via AuraArt Platform",
        image: publicUrl,
        price: Number(price) || 0.01,
        creator: walletAddress,
        ownerId: walletAddress,
        status: 'available',
        collection: finalCollection || 'AuraArt Originals',
        createdAt: new Date().toISOString(),
        txHash: realTxHash,
      });

      // Record in universal transaction history
      const txRef = doc(collection(db, 'transactions'));
      await setDoc(txRef, {
        nftId: newDocRef.id,
        tokenId: mintedTokenId,
        title: title || "Untitled Masterpiece",
        creator: walletAddress,
        image: publicUrl,
        price: Number(price) || 0.01,
        date: new Date().toISOString(),
        txHash: realTxHash,
        buyerId: walletAddress,
        sellerId: 'System Minter'
      });

      setMintStatus("Successfully minted and synced your Masterpiece!");
      setFileState('success');

    } catch (error: any) {
      console.error(error);
      if (error.code === 4001 || error.info?.error?.code === 4001) {
        setMintStatus("Error: Transaction rejected by user.");
      } else {
        setMintStatus(`Error: ${error.message || "An unexpected error occurred."}`);
      }
      setFileState('error');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="container mx-auto px-4 py-32 text-center max-w-xl flex-1 mt-10">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-gold drop-shadow-sm mb-6">Creator's Studio</h1>
        <div className="bg-[#0c1b33]/60 border border-indigo-muted/50 rounded-3xl p-10 shadow-painting backdrop-blur-md">
          <ShieldCheck className="h-16 w-16 text-gold mb-6 mx-auto opacity-80" />
          <h2 className="text-2xl font-bold text-ivory mb-4">Authentication Required</h2>
          <p className="text-ivory/70 mb-8">Please connect your wallet to enter the Creator's Studio and mint your masterpieces to the blockchain.</p>
          <Button variant="default" size="lg" onClick={login} className="rounded-xl w-full sm:w-auto px-10">Connect Web3 Wallet</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl mt-4 flex-1">
      <div className="mb-10 text-center">
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-gold drop-shadow-sm mb-4">Mint Masterpiece</h1>
        <p className="text-lg text-ivory/70 w-full max-w-xl mx-auto">
          Upload your digital art. Every piece is strictly audited by our Gradient Boosting AI engine to ensure safety and authenticity before minting directly to the blockchain.
        </p>
      </div>

      <div className="bg-[#0c1b33]/60 border border-indigo-muted/50 rounded-3xl p-6 sm:p-10 shadow-painting backdrop-blur-md">
        <div className="flex flex-col md:flex-row gap-10">

          {/* Left Column - Image Upload */}
          <div className="w-full md:w-2/5 flex flex-col gap-6">
            <h3 className="font-serif text-xl font-bold text-ivory">Artwork File</h3>

            <div className={`relative flex flex-col items-center justify-center w-full aspect-[4/5] overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${fileState === 'idle' ? 'border-indigo-muted bg-navy-light/30 hover:bg-navy hover:border-gold/50 cursor-pointer shadow-sm' :
                fileState === 'uploading' ? 'border-gold bg-gold/5 shadow-glow-gold' :
                  fileState === 'scanning' ? 'border-indigo-muted bg-navy-light/50' :
                    fileState === 'minting' ? 'border-blue-400 bg-blue-900/20 shadow-[0_0_15px_rgba(96,165,250,0.2)] pointer-events-none' :
                      fileState === 'error' ? 'border-red-500 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' :
                        'border-green-400 bg-green-500/10 shadow-[0_0_15px_rgba(74,222,128,0.2)]'
              }`}>
              {fileState === 'idle' && (
                <>
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" onChange={handleFileUpload} accept="image/*" />
                  <Upload className="h-10 w-10 text-gold mb-4 drop-shadow-[0_0_5px_rgba(247,208,2,0.4)]" />
                  <p className="text-sm font-medium text-ivory">Click or drag and drop</p>
                  <p className="text-xs text-ivory/50 mt-2 text-center px-4">PNG, JPG, GIF up to 50MB</p>
                </>
              )}

              {fileState === 'uploading' && (
                <div className="flex flex-col items-center text-center px-6 relative z-10">
                  <ImageIcon className="h-12 w-12 text-gold animate-pulse mb-4" />
                  <p className="text-sm font-medium text-ivory">Receiving masterpiece...</p>
                </div>
              )}

              {fileState === 'scanning' && (
                <div className="flex flex-col items-center text-center px-6 w-full relative z-10">
                  <Loader2 className="h-12 w-12 text-gold animate-spin mb-4" />
                  <p className="text-sm font-medium text-ivory mb-2">AI Scanner Running</p>
                  <p className="text-xs text-ivory/50 mb-4">Initializing Gradient Boosting model...</p>

                  <div className="w-full h-2 bg-navy rounded-full overflow-hidden border border-indigo-muted">
                    <div className="h-full bg-gold transition-all duration-200 shadow-glow-gold" style={{ width: `${scanProgress}%` }}></div>
                  </div>
                  <p className="text-xs font-mono text-gold mt-2 font-bold drop-shadow-sm">{scanProgress}%</p>
                </div>
              )}

              {fileState === 'safe' && (
                <div className="flex flex-col items-center text-center px-6 relative z-10">
                  <ShieldCheck className="h-16 w-16 text-green-400 mb-4 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                  <p className="font-bold text-green-400 text-lg">Verification Passed</p>
                  <p className="text-xs font-medium text-green-400/80 mt-2 bg-green-950/40 px-3 py-1 rounded-full border border-green-500/20">Zero anomalies detected. Ready to Mint.</p>
                </div>
              )}

              {fileState === 'minting' && (
                <div className="flex flex-col items-center text-center px-6 relative z-10">
                  <Loader2 className="h-12 w-12 text-blue-400 animate-spin mb-4 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
                  <p className="font-bold text-blue-400 text-lg">Minting in Progress</p>
                  <p className="text-xs font-medium text-blue-300 mt-2 bg-blue-900/40 px-3 py-2 rounded-xl text-center leading-relaxed border border-blue-500/20">{mintStatus}</p>
                </div>
              )}

              {fileState === 'success' && (
                <div className="flex flex-col items-center text-center px-6 relative z-10 w-full">
                  <CheckCircle2 className="h-16 w-16 text-green-400 mb-4 drop-shadow-[0_0_8px_rgba(74,222,128,0.4)]" />
                  <p className="font-bold text-green-400 text-xl mb-2">Minted Successfully!</p>
                </div>
              )}

              {fileState === 'error' && (
                <div className="flex flex-col items-center text-center px-4 relative z-10 w-full">
                  <ShieldCheck className="h-12 w-12 text-red-500 mb-4 opacity-50" />
                  <p className="font-bold text-red-400 text-lg">Action Failed</p>
                  <p className="text-xs font-medium text-red-400/80 mt-2 p-2 bg-red-950/30 rounded border border-red-500/20 break-words w-full">{mintStatus}</p>
                  <Button variant="outline" size="sm" className="mt-4 border-red-500/50 text-red-400 hover:bg-red-950/30 pointer-events-auto" onClick={resetForm}>Reset</Button>
                </div>
              )}

              {/* Uploaded Image preview behind the status */}
              {(fileState !== 'idle' && preview) && (
                <div className="absolute inset-0 p-2 z-0 pointer-events-none">
                  <div className={`w-full h-full bg-cover bg-center rounded-xl transition-all duration-1000 ${fileState === 'safe' || fileState === 'success' ? 'opacity-40 mix-blend-screen' :
                      fileState === 'minting' ? 'opacity-20 mix-blend-screen' :
                        'opacity-10 grayscale'
                    }`} style={{ backgroundImage: `url(${preview})` }} />
                </div>
              )}
            </div>

            {(fileState === 'safe' || fileState === 'success' || fileState === 'error') && (
              <Button variant="outline" className="w-full text-sm font-medium border-indigo-muted text-ivory hover:text-white" onClick={resetForm}>Upload New Image</Button>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="w-full md:w-3/5 flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-ivory mb-2">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 'The Digital Vitruvian'"
                disabled={fileState !== 'safe' && fileState !== 'idle' && fileState !== 'error'}
                className="bg-navy/50 border-indigo-muted text-ivory focus:border-gold placeholder:text-ivory/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ivory mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-indigo-muted bg-navy/50 px-4 py-3 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold min-h-[140px] resize-y disabled:opacity-50 text-ivory placeholder:text-ivory/30 transition-colors"
                placeholder="Describe the inspiration, medium, and meaning behind this piece..."
                disabled={fileState !== 'safe' && fileState !== 'idle' && fileState !== 'error'}
              ></textarea>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-ivory mb-2">Collection</label>
                <select
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  disabled={fileState !== 'safe' && fileState !== 'idle' && fileState !== 'error'}
                  className="flex h-12 w-full rounded-xl border border-indigo-muted bg-navy/50 px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold disabled:opacity-50 text-ivory appearance-none"
                >
                  <option value="">Select collection</option>
                  {myCollections.length > 0 ? (
                    myCollections.map(collection => (
                      <option key={collection} value={collection}>{collection}</option>
                    ))
                  ) : (
                    <>
                      <option value="Renaissance V2">Renaissance V2</option>
                      <option value="Cyber Classics">Cyber Classics</option>
                    </>
                  )}
                  <option value="create_new">Create New +</option>
                </select>

                {selectedCollection === 'create_new' && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                    <Input
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Enter new collection name"
                      disabled={fileState !== 'safe' && fileState !== 'idle' && fileState !== 'error'}
                      className="bg-navy/50 border-gold/50 text-ivory focus:border-gold placeholder:text-ivory/30"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-ivory mb-2">Price (ETH)</label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.5"
                    disabled={fileState !== 'safe' && fileState !== 'idle' && fileState !== 'error'}
                    className="bg-navy/50 border-indigo-muted text-ivory focus:border-gold placeholder:text-ivory/30 h-12 pl-4 pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-ivory/50">ETH</span>
                </div>
              </div>
            </div>

            <div className="pt-8 mt-auto border-t border-indigo-muted/30">
              <Button
                variant={fileState === 'safe' || fileState === 'minting' ? 'default' : 'outline'}
                size="lg"
                onClick={handleMint}
                className={`w-full text-lg py-6 rounded-xl transition-all ${fileState === 'safe' ? 'shadow-glow-gold' :
                    fileState === 'minting' ? 'opacity-90 cursor-wait bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] text-white' :
                      fileState === 'success' ? 'border-green-500 text-green-400 bg-green-950/20 shadow-[0_0_15px_rgba(74,222,128,0.2)]' :
                        'border-indigo-muted bg-navy-light/20 text-ivory/50 opacity-70 cursor-not-allowed'
                  }`}
                disabled={fileState !== 'safe'}
              >
                {fileState === 'safe' ? 'Mint Masterpiece' :
                  fileState === 'minting' ? 'Minting on SECURE Network...' :
                    fileState === 'success' ? '✓ Masterpiece Minted' :
                      fileState === 'error' ? 'Minting Failed - Please Retry' :
                        'Awaiting Secure Upload'}
              </Button>
            </div>
          </div>

        </div>
      </div>

      {/* Success Modal */}
      {fileState === 'success' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0c1b33]/80 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-[#0c1b33] border border-gold/30 shadow-[0_0_30px_rgba(247,208,2,0.15)] rounded-3xl p-8 max-w-md w-full text-center relative animate-in zoom-in-95 duration-500">
            <div className="mx-auto w-24 h-24 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
              <CheckCircle2 className="h-12 w-12 text-green-400 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
            </div>

            <h2 className="font-serif text-3xl font-bold text-ivory mb-2">Mint Successful!</h2>
            <p className="text-ivory/70 mb-8">Your masterpiece has been securely minted to the blockchain.</p>

            <div className="bg-navy-light/40 border border-indigo-muted/30 rounded-xl p-4 mb-8">
              <p className="text-xs text-ivory/50 uppercase tracking-widest mb-2 font-semibold">Transaction Hash</p>
              {txHash ? (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 font-mono text-gold hover:text-gold-light hover:underline transition-colors text-lg"
                >
                  {txHash.substring(0, 6)}...{txHash.substring(txHash.length - 4)} <ExternalLink className="w-5 h-5" />
                </a>
              ) : (
                <span className="font-mono text-ivory/50">TxHash not available</span>
              )}
            </div>

            <Button
              variant="default"
              size="lg"
              onClick={() => router.push('/')}
              className="w-full rounded-xl py-6 text-lg font-bold shadow-glow-gold"
            >
              Back to Home
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
