# Parkify — Smart Contract + Express/MongoDB Backend

This zip contains the **off-chain server** + **Solidity contract** for Parkify.
The React frontend lives in your Lovable project and is already wired to talk to the contract via MetaMask + ethers.js.

## Stack
- Solidity 0.8.24 (`contracts/ParkingBooking.sol`)
- Hardhat (local node, chainId 31337)
- Express.js + Mongoose (`backend/`)
- ethers v6

## 1. Install
```bash
npm install
cp .env.example .env
```

## 2. Run a local Hardhat node
```bash
npm run node
```
Leave it running. It prints 20 funded accounts + private keys.

## 3. Deploy the contract (new terminal)
```bash
npm run compile
npm run deploy:local
```
This writes `frontend-abi/ParkingBooking.json` containing **address + ABI**.
Copy `address` into your Lovable frontend at `src/lib/parkify-config.ts` (`CONTRACT_ADDRESS`), and paste the `abi` array into the same file (`CONTRACT_ABI`).

## 4. Seed slots
```bash
npm run seed:local
```
Creates 12 slots @ 0.001 ETH, 1h duration. Edit `scripts/seed.js` to change.

## 5. Start MongoDB + Express API
```bash
# Mongo must be running locally on 27017 (or set MONGO_URI)
# Set CONTRACT_ADDRESS in .env to the value printed in step 3
npm run backend
```

API:
- `GET /slots` — returns slot list (status from chain)
- `POST /book-slot` `{ userId, slotId, transactionHash }` — verifies tx receipt, parses `SlotBooked` event, updates Mongo

## 6. Connect MetaMask
- Network: `http://127.0.0.1:8545`, Chain ID `31337`
- Import one of the private keys printed by Hardhat node

## 7. Frontend
Open the Lovable preview, click **Connect Wallet**, then **Book Slot**.

## Tests
```bash
npm test
```

## Security notes
- Contract checks payment >= price and rejects double booking while active
- Backend re-verifies receipt status, target contract, and event before writing to Mongo
- Expired bookings auto-free on chain (via `block.timestamp >= expiresAt`)
