const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const file = path.join(__dirname, "..", "frontend-abi", "ParkingBooking.json");
  const { address, abi } = JSON.parse(fs.readFileSync(file, "utf8"));
  const [owner] = await hre.ethers.getSigners();
  const c = new hre.ethers.Contract(address, abi, owner);

  const price = hre.ethers.parseEther("0.001");
  const duration = 60 * 60; // 1h
  for (let i = 1; i <= 12; i++) {
    const tx = await c.addSlot(i, price, duration);
    await tx.wait();
    console.log("Added slot", i);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
