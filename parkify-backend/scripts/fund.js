const hre = require("hardhat");

async function main() {
  // Get the first default Hardhat account which has 10,000 ETH
  const [sender] = await hre.ethers.getSigners();
  
  // The user's address from the error log
  const targetAddress = "0x6a835f431b69b38b4be1af8da4015e64ee08dbca";
  
  console.log("Sending 100 ETH from", sender.address, "to", targetAddress);

  // Send 100 ETH
  const tx = await sender.sendTransaction({
    to: targetAddress,
    value: hre.ethers.parseEther("100.0") 
  });
  
  await tx.wait();
  console.log(`✅ Successfully sent 100 ETH to ${targetAddress}!`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
