//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Chip is ERC721URIStorage, ReentrancyGuard {
    using SafeMath for uint256;

    uint256 public totalSupply;
    uint256 public constant mintingFee = 1e15; // 1e15 = 1 finney = 0.001 ether

    constructor() ERC721("Chip", "CHIP") {
        totalSupply = 0;
    }

    function mint(string calldata _uri)
        external
        payable
        nonReentrant
        returns (uint256)
    {
        require(msg.value == mintingFee, "Incorrect amount paid");
        require(bytes(_uri).length > 0, "Invalid uri");
        totalSupply = totalSupply.add(1);
        _mint(msg.sender, totalSupply);
        _setTokenURI(totalSupply, _uri);
        return totalSupply;
    }

    function _baseURI() internal pure override returns (string memory) {
        return "htpps://www.databaseuri.com/";
    }

    receive() external payable {}

    fallback() external payable {}
}
