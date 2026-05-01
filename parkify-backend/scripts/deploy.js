const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const Parking = await hre.ethers.getContractFactory("ParkingBooking");
  const c = await Parking.deploy();
  await c.waitForDeployment();
  const address = await c.getAddress();
  console.log("ParkingBooking deployed to:", address);

  const artifact = await hre.artifacts.readArtifact("ParkingBooking");
  const out = path.join(__dirname, "..", "frontend-abi");
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(
    path.join(out, "ParkingBooking.json"),
    JSON.stringify({ address, abi: artifact.abi }, null, 2)
  );
  console.log("ABI written to frontend-abi/ParkingBooking.json");
}
main().catch((e) => { console.error(e); process.exit(1); });
