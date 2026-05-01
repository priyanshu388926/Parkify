# Parkify — Hardhat Smart Contract Bundle

Local-only Hardhat project for the **ParkingBooking** smart contract that powers the Parkify UI.

## 1. Install

```bash
cd parkify-hardhat
npm install
```

## 2. Start a local blockchain (terminal A)

```bash
npx hardhat node
```

This prints 20 funded accounts with private keys and starts an RPC at `http://127.0.0.1:8545` (chainId `31337`).

## 3. Deploy the contract (terminal B)

```bash
npm run deploy:local
```

You'll see:

```
✅ ParkingBooking deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

Copy that address.

## 4. Configure MetaMask

1. Open MetaMask → Networks → **Add network manually**
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency symbol: `ETH`
2. Import one of the test accounts printed by `hardhat node` (paste its private key into MetaMask → Import account). Each has 10000 ETH.

## 5. Wire the contract into Parkify

1. Open the Parkify page in the app.
2. Click **Settings** → paste the contract address → set price to `0.001` → Save.
3. Click **Connect MetaMask**, approve the Hardhat network.
4. Click **Book** on any slot. MetaMask will prompt for the 0.001 ETH payment.
5. After the tx is mined, the slot turns red and the booking is recorded both on-chain and in the Lovable Cloud database.

## 6. Tests

```bash
npm test
```

## Contract API

| Function | Description |
|---|---|
| `bookSlot(uint256 slotId) payable` | Reserves a slot. Requires `msg.value >= pricePerSlot`. |
| `releaseSlot(uint256 slotId)` | Releases a slot. Only the booker or owner. |
| `getBooking(uint256 slotId)` | Returns `(user, slotId, timestamp, active)`. Auto-expires after `bookingDuration`. |
| `setPrice(uint256)` | Owner-only. Update price. |
| `withdraw(address payable)` | Owner-only. Drain contract balance. |

## Deploying to a public testnet

Edit `hardhat.config.js` to add e.g. Sepolia or Polygon Amoy with your RPC URL and a deployer private key (use env vars; never commit secrets), then:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```
