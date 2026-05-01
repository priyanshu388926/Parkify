const hre = require("hardhat");

async function main() {
  const priceWei = hre.ethers.parseEther("0.001"); // 0.001 ETH per slot
  const duration = 60 * 60; // 1 hour booking

  const ParkingBooking = await hre.ethers.getContractFactory("ParkingBooking");
  const contract = await ParkingBooking.deploy(priceWei, duration);
  await contract.waitForDeployment();

  const addr = await contract.getAddress();
  console.log("✅ ParkingBooking deployed at:", addr);
  console.log("   Price per slot: 0.001 ETH");
  console.log("   Booking duration: 1 hour");
  console.log("\nPaste this address into the Parkify UI → Settings.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
