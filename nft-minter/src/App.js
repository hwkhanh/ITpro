import React, { useState, useRef } from 'react';
import axios from 'axios';
import { ethers } from 'ethers';

// ==========================================
// 1. Smart Contract Configuration
// ==========================================
const CONTRACT_ADDRESS = "0x336c028DC08aC4FE8424c6F8dFA91b57cd987283";

// Your ERC-721 ABI
const CONTRACT_ABI = [
  { "inputs": [{ "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
  { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "address", "name": "owner", "type": "address" }], "name": "ERC721IncorrectOwner", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ERC721InsufficientApproval", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "approver", "type": "address" }], "name": "ERC721InvalidApprover", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }], "name": "ERC721InvalidOperator", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "ERC721InvalidOwner", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "receiver", "type": "address" }], "name": "ERC721InvalidReceiver", "type": "error" },
  { "inputs": [{ "internalType": "address", "name": "sender", "type": "address" }], "name": "ERC721InvalidSender", "type": "error" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ERC721NonexistentToken", "type": "error" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Approval", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" }], "name": "ApprovalForAll", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "_fromTokenId", "type": "uint256" }, { "indexed": false, "internalType": "uint256", "name": "_toTokenId", "type": "uint256" }], "name": "BatchMetadataUpdate", "type": "event" },
  { "anonymous": false, "inputs": [{ "indexed": false, "internalType": "uint256", "name": "_tokenId", "type": "uint256" }], "name": "MetadataUpdate", "type": "event" },
  { "inputs": [{ "internalType": "string", "name": "_tokenURI", "type": "string" }], "name": "mint", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "data", "type": "bytes" }], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" }], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "Transfer", "type": "event" },
  { "inputs": [{ "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "getApproved", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" }], "name": "isApprovedForAll", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "ownerOf", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" }], "name": "supportsInterface", "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "symbol", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
  { "inputs": [{ "internalType": "uint256", "name": "tokenId", "type": "uint256" }], "name": "tokenURI", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }
];

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  // UX States
  const [status, setStatus] = useState('');
  const [step, setStep] = useState(0); // 0: Idle, 1: Uploading, 2: Minting, 3: Success, -1: Error
  const [txHash, setTxHash] = useState('');

  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setStep(0);
      setStatus('');
      setTxHash('');
    }
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setStep(0);
    setStatus('');
    setTxHash('');
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleMint = async () => {
    try {
      if (!file) {
        setStatus("Hãy chọn ảnh trước khi mint!");
        setStep(-1);
        return;
      }

      // -- STEP 1: Upload to IPFS --
      setStep(1);
      setStatus("Đang tải ảnh lên IPFS (Pinata)...");
      setTxHash('');

      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", "Exclusive Web3 NFT");
      formData.append("description", "Minted via Seamless React UI");

      const response = await axios.post("https://nft-ai-service-uvku.onrender.com/predict", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (!response.data.success) throw new Error("Backend upload failed.");
      const metadataURI = response.data.metadataURI;

      // -- STEP 2: Connect Wallet & Mint --
      setStep(2);
      setStatus("Đang xác thực ví MetaMask & Minting...");

      if (typeof window.ethereum === 'undefined') {
        throw new Error("MetaMask chưa được cài đặt!");
      }

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const network = await provider.getNetwork();
      if (network.chainId !== 11155111) {
        throw new Error("Sai mạng! Vui lòng chuyển sang Sepolia Testnet.");
      }

      const nftContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setStatus("Vui lòng xác nhận giao dịch trên MetaMask...");
      const tx = await nftContract.mint(metadataURI);

      setStatus(`Đang chờ giao dịch xác nhận trên blockchain...`);
      setTxHash(tx.hash);

      await tx.wait();

      // -- STEP 3: Success --
      setStep(3);
      setStatus("🎉 Mint NFT thành công rực rỡ!");

    } catch (error) {
      console.error(error);
      setStep(-1);
      if (error.code === 4001) {
        setStatus("❌ Giao dịch đã bị từ chối.");
      } else {
        setStatus(`❌ Lỗi: ${error.message || "Đã xảy ra sự cố."}`);
      }
    }
  };

  return (
    <div style={styles.container}>
      {/* Dynamic Animated Background */}
      <div style={styles.glowBlob1} />
      <div style={styles.glowBlob2} />

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Mint Your NFT</h1>
          <p style={styles.subtitle}>Upload artwork and deploy to the blockchain</p>
        </div>

        {/* Custom Upload Box */}
        <div
          style={{
            ...styles.uploadBox,
            borderColor: preview ? 'transparent' : '#a0aec0',
            backgroundColor: preview ? '#f7fafc' : 'white',
          }}
          onClick={() => !step || step === 0 ? fileInputRef.current.click() : null}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
            disabled={step === 1 || step === 2}
          />

          {!preview ? (
            <div style={styles.uploadPlaceholder}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#718096" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
              <p style={{ marginTop: '12px', color: '#4a5568', fontWeight: 500 }}>Nhấp vào đây để chọn ảnh</p>
              <p style={{ fontSize: '12px', color: '#a0aec0' }}>PNG, JPG, GIF lên đến 10MB</p>
            </div>
          ) : (
            <div style={styles.previewContainer}>
              <img src={preview} alt="Preview" style={styles.previewImage} />
              {(step === 0 || step === -1) && (
                <button
                  onClick={clearSelection}
                  style={styles.clearButton}
                >
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleMint}
          style={{
            ...styles.mintButton,
            opacity: (step === 1 || step === 2 || !file) ? 0.6 : 1,
            cursor: (step === 1 || step === 2 || !file) ? 'not-allowed' : 'pointer',
            transform: (step === 1 || step === 2 || !file) ? 'scale(1)' : undefined
          }}
          disabled={step === 1 || step === 2 || !file}
        >
          {(step === 1 || step === 2) ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <span className="spinner"></span> Đang xử lý...
            </div>
          ) : step === 3 ? "Mint Thêm NFT Khác" : "🚀 Mint NFT Lên Lưới"}
        </button>

        {/* Progress & Status Indicators */}
        {step !== 0 && (
          <div style={styles.statusWrapper}>
            <div style={styles.progressContainer}>
              <div
                style={{
                  ...styles.progressBar,
                  width: step === 1 ? '33%' : step === 2 ? '66%' : step === 3 ? '100%' : '100%',
                  backgroundColor: step === -1 ? '#e53e3e' : '#3182ce'
                }}
              />
            </div>

            <div style={{
              ...styles.statusMessage,
              color: step === -1 ? '#c53030' : step === 3 ? '#2f855a' : '#2b6cb0',
              backgroundColor: step === -1 ? '#fff5f5' : step === 3 ? '#f0fff4' : '#ebf8ff',
            }}>
              <p style={{ margin: 0, fontWeight: 500 }}>{status}</p>

              {txHash && (
                <div style={styles.txHashBox}>
                  Transaction Hash:<br />
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={styles.link}
                  >
                    {txHash.substring(0, 10)}...{txHash.substring(txHash.length - 8)} ↗
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(49, 130, 206, 0.4);
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Inter", -apple-system, sans-serif',
    backgroundColor: '#0f172a', /* Dark slate background */
    padding: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  glowBlob1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(0,0,0,0) 70%)',
    top: '-10%',
    left: '-10%',
    borderRadius: '50%',
    zIndex: 0
  },
  glowBlob2: {
    position: 'absolute',
    width: '500px',
    height: '500px',
    background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, rgba(0,0,0,0) 70%)',
    bottom: '-20%',
    right: '-10%',
    borderRadius: '50%',
    zIndex: 0
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(10px)',
    padding: '40px',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    maxWidth: '480px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    zIndex: 1,
    border: '1px solid rgba(255,255,255,0.2)'
  },
  header: {
    textAlign: 'center',
  },
  title: {
    margin: '0 0 8px 0',
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 800,
    letterSpacing: '-0.5px'
  },
  subtitle: {
    margin: '0',
    color: '#64748b',
    fontSize: '15px'
  },
  uploadBox: {
    border: '2px dashed',
    borderRadius: '16px',
    minHeight: '220px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.3s ease',
    overflow: 'hidden'
  },
  uploadPlaceholder: {
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px'
  },
  previewImage: {
    maxWidth: '100%',
    maxHeight: '280px',
    objectFit: 'contain',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    animation: 'float 4s ease-in-out infinite'
  },
  clearButton: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  mintButton: {
    background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
    color: 'white',
    padding: '16px',
    fontSize: '17px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
  },
  statusWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  progressContainer: {
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  statusMessage: {
    padding: '16px',
    borderRadius: '12px',
    fontSize: '14.5px',
    lineHeight: '1.6',
    wordBreak: 'break-word',
    border: '1px solid currentColor',
    borderOpacity: 0.1
  },
  txHashBox: {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(0,0,0,0.05)',
    fontSize: '13px',
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    fontWeight: 'bold',
    display: 'inline-block',
    marginTop: '4px',
    background: 'rgba(255,255,255,0.5)',
    padding: '4px 8px',
    borderRadius: '6px'
  }
};
