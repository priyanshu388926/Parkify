const hre = require("hardhat");
async function main() {
  const address = "0x6a835f431b69b38b4be1af8da4015e64ee08dbca";
  const balance = await hre.ethers.provider.getBalance(address);
  console.log("Balance of", address, ":", hre.ethers.formatEther(balance), "ETH");
}
main();
