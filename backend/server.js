const express = require('express');
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /upload
 * Accepts multipart/form-data with fields:
 * - file: The image file to upload
 * - name: (Optional) Name of the NFT
 * - description: (Optional) Description of the NFT
 */
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Ensure a file was provided
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }

    const { name, description, collection } = req.body;

    // ==========================================
    // AI Integration: Send image to AI service for verification
    // ==========================================
    const aiFormData = new FormData();
    aiFormData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    let aiResult;
    try {
      const aiResponse = await axios.post('https://nft-ai-service-uvku.onrender.com', aiFormData, {
        headers: {
          ...aiFormData.getHeaders(),
        },
      });
      // The AI API returns: { prediction, label, confidence, probability_stego }
      aiResult = aiResponse.data;
    } catch (aiError) {
      console.error('Error calling AI service:', aiError?.response?.data || aiError.message);
      return res.status(500).json({
        success: false,
        message: 'AI prediction failed or service is unreachable.',
        error: aiError.message,
      });
    }

    // Block minting if steganography is detected
    if (aiResult.prediction === 'STEGO' || aiResult.label === 'stego') {
      return res.status(400).json({
        success: false,
        message: 'AI Security Audit Failed: This image contains steganography (hidden data) and is not allowed to be minted.',
        ai: {
          prediction: aiResult.prediction,
          confidence: aiResult.confidence,
        }
      });
    }

    // Pinata API configurations
    const pinataHeaders = {
      pinata_api_key: process.env.PINATA_API_KEY,
      pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
    };

    // ==========================================
    // Step 1: Upload the image file to Pinata
    // ==========================================
    const formData = new FormData();
    // Append the file buffer from multer. We need to pass filename and contentType
    formData.append('file', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });

    const fileRes = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          ...pinataHeaders,
          ...formData.getHeaders(),
        },
      }
    );

    // ==========================================
    // Step 2: Get the returned IpfsHash and convert to image URI
    // ==========================================
    const imageHash = fileRes.data.IpfsHash;
    const imageURI = `ipfs://${imageHash}`;

    // ==========================================
    // Step 3: Create metadata JSON with AI attributes
    // ==========================================
    const metadata = {
      name: name || 'Secure NFT',
      description: description || 'AI verified NFT',
      image: imageURI,
      attributes: [
        {
          trait_type: "Steganography",
          value: aiResult.prediction === "STEGO" ? "Detected" : "Clean"
        },
        {
          trait_type: "Confidence",
          value: aiResult.confidence
        }
      ]
    };

    if (collection) {
      metadata.collection = collection;
    }

    // ==========================================
    // Step 4: Upload metadata JSON to Pinata
    // ==========================================
    const jsonRes = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataContent: metadata,
        pinataMetadata: {
          name: `${name ? name.replace(/\s+/g, '_') : 'NFT'}_Metadata.json`,
        },
      },
      {
        headers: {
          ...pinataHeaders,
          'Content-Type': 'application/json',
        },
      }
    );

    const metadataHash = jsonRes.data.IpfsHash;
    const metadataURI = `ipfs://${metadataHash}`;

    // ==========================================
    // Step 5: Return response
    // ==========================================
    return res.status(200).json({
      success: true,
      metadataURI: metadataURI,
      imageURI: imageURI,
      ai: {
        prediction: aiResult.prediction,
        confidence: aiResult.confidence,
      }
    });
  } catch (error) {
    // Log errors to console
    console.error('Error uploading to Pinata:', error?.response?.data || error.message);

    // Return HTTP 500 on failure
    return res.status(500).json({
      success: false,
      message: 'Failed to upload files to IPFS via Pinata',
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running! API listening on http://localhost:${PORT}`);
});
