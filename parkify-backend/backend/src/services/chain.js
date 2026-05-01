const { ethers, JsonRpcProvider, Contract } = require("ethers");
const path = require("path");
const fs = require("fs");
const { abi } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../../frontend-abi/ParkingBooking.json"), "utf8")
);
const provider = new JsonRpcProvider(process.env.RPC_URL);
const contract = new Contract(process.env.CONTRACT_ADDRESS, abi, provider);
module.exports = { provider, contract, abi };
