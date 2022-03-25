const hre = require("hardhat");

async function main() {
    const Chip = await hre.ethers.getContractFactory("Chip");
    const chip = await Chip.deploy();
    await chip.deployed();

    console.log("Chip minter deployed to:", chip.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
