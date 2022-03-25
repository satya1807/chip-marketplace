const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
chai.use(solidity);
const expect = chai.expect;

describe("Chip Minter: Minting", () => {
    let chip, ChipFactory, amount, uri;

    before(async () => {
        ChipFactory = await ethers.getContractFactory("Chip");
    });

    beforeEach(async () => {
        chip = await ChipFactory.deploy();
        amount = ethers.utils.parseEther("0.001");
        uri = "chip";
    });

    it(".. should pass on minting with correct values", async () => {
        let [user] = await ethers.getSigners();

        let before = await chip.balanceOf(user.address);
        await expect(
            await chip.mint(uri, {
                value: amount,
            })
        ).to.changeBalance(chip, amount);
        let after = await chip.balanceOf(user.address);
        expect(after - before).to.equal(1);
    });

    it(".. should pass on with correct starting token id", async () => {
        let tokenId = await chip.callStatic.mint(uri, {
            value: amount,
        });
        await chip.mint(uri, {
            value: amount,
        });

        expect(await chip.tokenURI(tokenId)).to.be.equal(
            "htpps://www.databaseuri.com/" + uri
        );
    });

    it(".. should fail on minting without correct pay", async () => {
        await expect(
            chip.mint(uri, {
                value: "123",
            })
        ).to.be.revertedWith("Incorrect amount paid");
    });

    it(".. should fail on minting with empty uri", async () => {
        await expect(
            chip.mint("", {
                value: amount,
            })
        ).to.be.revertedWith("Invalid uri");
    });
});
