// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MarketplaceNFT is ERC721URIStorage, Ownable {
    uint256 private _nextTokenId;
    
    // Mapping from token ID to its exact ETH price
    mapping(uint256 => uint256) public nftPrices;

    event NFTMinted(uint256 indexed tokenId, address indexed creator, string uri, uint256 price);
    event NFTPurchased(uint256 indexed tokenId, address indexed buyer, address indexed seller, uint256 price);

    constructor() ERC721("AuraArt", "AURA") Ownable(msg.sender) {}

    // Mint NFT and set initial price simultaneously
    function mintWithPrice(string memory uri, uint256 price) public returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);
        
        nftPrices[tokenId] = price;
        
        emit NFTMinted(tokenId, msg.sender, uri, price);
        return tokenId;
    }

    // Update price of existing NFT you own
    function setPrice(uint256 tokenId, uint256 price) public {
        require(ownerOf(tokenId) == msg.sender, "Only current owner can set price");
        nftPrices[tokenId] = price;
    }

    // Atomic Purchase Function (Requirement)
    function buyNFT(uint256 tokenId) public payable {
        uint256 price = nftPrices[tokenId];
        require(price > 0, "NFT not for sale (price is 0)");
        require(msg.value == price, "Incorrect ETH payment amount sent");
        
        address seller = ownerOf(tokenId);
        require(seller != msg.sender, "Security: Cannot buy your own NFT");

        // Clear price FIRST to prevent any reentrancy attacks (CEI pattern)
        nftPrices[tokenId] = 0;

        // ETH Transfer to seller
        // We use .call instead of .transfer to support modern smart contract wallets safely
        (bool success, ) = payable(seller).call{value: msg.value}("");
        require(success, "ETH transfer to seller failed");

        // NFT Transfer from seller to buyer
        _transfer(seller, msg.sender, tokenId);

        emit NFTPurchased(tokenId, msg.sender, seller, msg.value);
    }
}
