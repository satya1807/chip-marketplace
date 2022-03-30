const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { ethers } = require("hardhat");
chai.use(solidity);
const expect = chai.expect;

describe("KudoBadgeExchange: Listing", () => {
    let deployer,
        alice,
        bob,
        chip,
        exchange,
        listingId,
        price,
        chipId,
        amount,
        uri;

    before(async () => {
        const accounts = await ethers.getSigners();
        [deployer, alice, bob, _] = accounts;
        price = ethers.utils.parseEther("0.001");
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
    });

    it(".. should pass on successfull listing", async () => {
        let bef = await chip.balanceOf(deployer.address);

        listingId = await exchange.callStatic.list(chipId, price, {
            value: amount,
        });
        await expect(
            exchange.list(chipId, price, {
                value: amount,
            })
        )
            .to.emit(exchange, "Listed")
            .withArgs(chipId, deployer.address, listingId, price);

        let aft = await chip.balanceOf(deployer.address);

        expect(listingId).to.equal(1);
        expect(bef.sub(aft)).to.equal(1);
        expect(await chip.balanceOf(exchange.address)).to.equal(1);
        expect(await exchange.totalListings()).to.equal(1);

        const listing = await exchange.listings(1);
        expect(listing.listingId).to.equal(listingId);
        expect(listing.price).to.equal(price);
        expect(listing.isActive).to.equal(true);
        expect(listing.buyer).to.equal(ethers.constants.AddressZero);
        expect(listing.isSold).to.equal(false);
    });

    it(".. should fail on listing with incorrect price", async () => {
        await expect(exchange.list(chipId, price)).to.be.revertedWith(
            "Invalid amount paid"
        );
    });

    it(".. should fail on listing with incorrect chipId", async () => {
        await expect(exchange.list(123, price)).to.be.revertedWith(
            "ERC721: owner query for nonexistent token"
        );
    });

    it(".. should fail on listing without having a chip", async () => {
        await chip.transferFrom(deployer.address, alice.address, chipId);
        await expect(exchange.list(chipId, price)).to.be.reverted;
    });

    describe("Cancelling", () => {
        beforeEach(async () => {
            listingId = await exchange.callStatic.list(chipId, price, {
                value: amount,
            });
            await exchange.list(chipId, price, {
                value: amount,
            });
        });

        it(".. should pass on sucessfull cancelling a listing", async () => {
            const bef = await chip.balanceOf(deployer.address);
            await expect(exchange.cancel(listingId))
                .to.emit(exchange, "ListingCancelled")
                .withArgs(listingId, deployer.address);

            const aft = await chip.balanceOf(deployer.address);
            expect(aft.sub(bef)).to.equal(1);
            expect(await chip.balanceOf(exchange.address)).to.equal(0);
        });

        it(".. should fail on cancelling an invalid listing", async () => {
            await expect(exchange.cancel(45)).to.be.revertedWith(
                "Invalid listing Id"
            );
        });

        it(".. should fail on trying to cancel already cancelled listing", async () => {
            await exchange.cancel(listingId);
            await expect(exchange.cancel(listingId)).to.revertedWith(
                "Listing is already cancelled"
            );
        });

        it(".. should fail trying to cancel listing of already sold chip", async () => {
            await exchange.buy(listingId, {
                value: price,
            });

            await expect(exchange.cancel(listingId)).to.be.revertedWith(
                "Chip already sold"
            );
        });

        it(".. should fail on other users trying to cancel the listings by a user", async () => {
            await expect(
                exchange.connect(alice).cancel(listingId)
            ).to.be.revertedWith("You are not the owner of this listing");
        });
    });
});
