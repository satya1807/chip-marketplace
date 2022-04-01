const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");
chai.use(solidity);
const expect = chai.expect;

describe("Purchase", () => {
    let deployer,
        alice,
        bob,
        chip,
        exchange,
        listingId,
        price,
        chipId,
        amount,
        uri,
        provider;

    before(async () => {
        const accounts = await ethers.getSigners();
        [deployer, alice, bob, _] = accounts;
        price = ethers.utils.parseEther("1");
        amount = ethers.utils.parseEther("0.001");
        uri = "chip";
    });

    beforeEach(async () => {
        let chipFactory = await ethers.getContractFactory("Chip");
        chip = await chipFactory.deploy();

        let exchangeFactory = await ethers.getContractFactory("ChipExchange");
        exchange = await exchangeFactory.deploy(chip.address);

        chipId = await chip.callStatic.mint(uri, {
            value: amount,
        });
        await chip.mint(uri, {
            value: amount,
        });
        await chip.approve(exchange.address, chipId);
        listingId = await exchange.callStatic.list(chipId, price, {
            value: amount,
        });
        await exchange.list(chipId, price, {
            value: amount,
        });
        provider = await chip.provider;
    });

    it(".. should pass on sucessfull purchase of chip", async () => {
        let befDepBuy = await provider.getBalance(deployer.address);

        await expect(exchange.connect(alice).buy(listingId, { value: price }))
            .to.emit(exchange, "Purchase")
            .withArgs(alice.address, deployer.address, listingId);

        let aftDepBuy = await provider.getBalance(deployer.address);
        expect(aftDepBuy.sub(befDepBuy)).to.be.equal(price);
    });

    it(".. should fail on buying with an invalid listing id", async () => {
        await expect(exchange.buy(32, { value: price })).to.be.revertedWith(
            "Invalid listing Id"
        );
    });

    it(".. should fail on buying with invalid amount", async () => {
        await expect(
            exchange.buy(listingId, { value: 1332 })
        ).to.be.revertedWith("Invalid price paid");
    });

    it(".. should fail on buying a cancelled listing", async () => {
        await exchange.cancel(listingId);

        await expect(
            exchange.buy(listingId, { value: price })
        ).to.be.revertedWith("Listing is inactive");
    });

    it(".. should fail on buying already purchaed item", async () => {
        await exchange.buy(listingId, { value: price });
        await expect(
            exchange.buy(listingId, { value: price })
        ).to.be.revertedWith("Item already sold");
    });

    describe("Collect Fees", () => {
        it(".. should pass on collecting correct fees", async () => {
            let bal = await exchange.callStatic.collectFee();
            await exchange.collectFee();

            expect(bal).to.be.equal(amount);
        });

        it(".. should fail on other user calling collect fee", async () => {
            await expect(exchange.connect(alice).collectFee()).to.be.reverted;
        });
    });
});
