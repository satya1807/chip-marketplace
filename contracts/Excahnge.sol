//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";

import "./Minter.sol";

contract ChipExchange is ReentrancyGuard {
    using Address for address;
    using SafeMath for uint256;

    Chip public chip;
    uint256 public totalListings;
    uint256 public PLATFORM_FEE = 1e15; // 1e15 = 1 finnery = 0.001 ether

    struct Item {
        uint256 listingId;
        uint256 chipId;
        address seller;
        address buyer;
        uint256 price;
        bool isSold;
        bool isActive;
    }

    mapping(uint256 => Item) public listings;

    event Listed(
        uint256 indexed chipId,
        address indexed user,
        uint256 listingId,
        uint256 price
    );

    event Purchase(
        address indexed buyer,
        address indexed seller,
        uint256 listingId
    );

    event ListingCancelled(uint256 listingId, address owner);

    constructor(address _chip) {
        require(_chip.isContract(), "Invalid address");
        chip = Chip(payable(_chip));
    }

    function list(uint256 _chipId, uint256 _price)
        public
        payable
        nonReentrant
        returns (uint256)
    {
        require(
            chip.ownerOf(_chipId) == msg.sender,
            "Caller is not the token owner"
        );
        require(msg.value == PLATFORM_FEE, "Invalid amount paid");
        totalListings = totalListings.add(1);
        chip.transferFrom(msg.sender, address(this), _chipId);
        listings[totalListings] = Item({
            listingId: totalListings,
            price: _price,
            isSold: false,
            isActive: true,
            seller: msg.sender,
            buyer: address(0),
            chipId: _chipId
        });
        emit Listed(_chipId, msg.sender, totalListings, _price);
        return totalListings;
    }

    modifier isValidListing(uint256 listingId) {
        require(listingId <= totalListings, "Invalid listing Id");
        _;
    }

    function buy(uint256 _listingId)
        external
        payable
        nonReentrant
        isValidListing(_listingId)
        returns (bool)
    {
        Item storage item = listings[_listingId];
        require(msg.value == item.price, "Invalid price paid");
        require(item.isActive, "Listing is inactive");
        address seller = item.seller;
        address payable buyer = payable(msg.sender);
        uint256 price = item.price;
        uint256 chipId = item.chipId;
        item.isSold = true;
        payable(seller).transfer(price);
        chip.transferFrom(address(this), buyer, chipId);
        emit Purchase(buyer, seller, _listingId);
        return true;
    }

    function cancel(uint256 _listingId)
        external
        isValidListing(_listingId)
        nonReentrant
    {
        Item storage item = listings[_listingId];
        require(item.isActive, "Listing is already cancelled");
        require(!item.isSold, "Chip already sold");
        require(
            item.seller == msg.sender,
            "You are not the owner of this listing"
        );
        address owner = item.seller;
        uint256 tokenId = item.chipId;
        item.isActive = false;
        chip.transferFrom(address(this), owner, tokenId);
        emit ListingCancelled(_listingId, owner);
    }

    function getMyListings() external view returns (Item[] memory) {
        uint256 listingsCount = 0;
        uint256 currentIndex = 0;
        address user = msg.sender;
        for (uint256 i = 1; i <= totalListings; i = i.add(1)) {
            if (listings[i].seller == user && listings[i].isActive) {
                listingsCount = listingsCount.add(1);
            }
        }
        Item[] memory myListings = new Item[](listingsCount);
        for (uint256 i = 1; i <= totalListings; i = i.add(1)) {
            if (listings[i].seller == user && listings[i].isActive) {
                Item memory item = listings[i];
                myListings[currentIndex] = item;
                currentIndex = currentIndex.add(1);
            }
        }
        return myListings;
    }
}
