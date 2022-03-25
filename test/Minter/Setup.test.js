const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Chip Minter: Setup", () => {
    let chip, ChipFactory;

    before(async () => {
        ChipFactory = await ethers.getContractFactory("Chip");
    });

    beforeEach(async () => {
        chip = await ChipFactory.deploy();
    });

    it(".. should pass with correct name", async () => {
        let name = "Chip";
        expect(await chip.name()).to.equal(name);
    });

    it(".. should pass with correct symbol", async () => {
        let symbol = "CHIP";
        expect(await chip.symbol()).to.equal(symbol);
    });
});
