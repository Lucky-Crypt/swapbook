# Swapbook

A lightweight Peer-to-Peer Token Swap Orderbook application deployed on the Stellar Testnet. It enables any user to trustlessly propose a swap of two tokens. Once posted, the tokens wait in the smart contract until another individual comes along and fills the order, guaranteeing atomic settlement for both users. It solves the issue of middleman trust and off-chain order matching by bringing order logic directly on-chain using Soroban.

## Tech Stack
- Rust / Soroban (Smart Contract logic)
- Next.js 14 App Router (Frontend)
- TypeScript & Tailwind CSS (UI)
- @stellar/stellar-sdk (RPC communication and manual Transaction building)
- Freighter / @stellar/freighter-api (Wallet connection and signing)

## Prerequisites
- Rust installed: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
- Wasm target: `rustup target add wasm32-unknown-unknown`
- Stellar CLI: `cargo install --locked stellar-cli --features opt`
- Node.js 18+
- Freighter wallet browser extension installed from https://freighter.app

## Project Structure
```text
.
├── contracts/
│   ├── Cargo.toml   -> Contract Rust dependencies highlighting soroban-sdk
│   └── src/
│       └── lib.rs   -> Smart contract housing the creation, fetching and filling logic
├── frontend/
│   ├── app/
│   │   ├── layout.tsx -> Contains the global styling definitions for Next.js
│   │   ├── globals.css -> Tailwind base styles
│   │   └── page.tsx   -> App index mounting the core orderbook component
│   ├── components/
│   │   ├── MainFeature.tsx -> Core view enabling users to post & browse token swap offers
│   │   └── WalletConnect.tsx -> Interface connecting user's Freighter extension
│   ├── lib/
│   │   ├── contract.ts -> Logic mapping to Soroban smart contract endpoints
│   │   └── stellar.ts  -> Handles interactions with Freighter wallet and testnets
│   ├── package.json   -> NPM configuration file
│   └── tailwind.config.ts -> Tailwind UI library settings
└── .env.example       -> Template mapping Stellar testnet URLs and Contract IDs
```

## Step 1 — Build the Smart Contract
```bash
cd contracts
cargo build --target wasm32-unknown-unknown --release
```
This builds the Rust source code into WebAssembly. The compiled `.wasm` file will be located at `target/wasm32-unknown-unknown/release/swapbook.wasm`.

## Step 2 — Set Up a Testnet Identity
```bash
stellar keys generate --global my-key --network testnet
stellar keys address my-key
```
This creates a keypair inside your Stellar CLI config (`my-key`) and automatically queries the Friendbot faucet to fund your generated wallet address with Testnet native XLM.

## Step 3 — Deploy Contract to Testnet
```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/swapbook.wasm \
  --source my-key \
  --network testnet
```
This deploys the WebAssembly built contract file onto the Stellar Testnet making it available globally. Make sure to **copy the returned Contract ID** (usually starts with a `C...`); you will need it in Step 5!

## Step 4 — Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

## Step 5 — Configure Environment Variables
```bash
cp ../.env.example .env.local
```
Open the `.env.local` file at the root of your frontend workspace. Paste the Contract ID from Step 3 into the `NEXT_PUBLIC_CONTRACT_ID` variable line.

## Step 6 — Run the Frontend
```bash
npm run dev
```
Open http://localhost:3000 to interact with your live Stellar dApp locally.

## Step 7 — Using the App
- Install Freighter at https://freighter.app and set it to Testnet mode (Settings -> Network -> Testnet).
- Click "Connect Wallet" at the top right to link your Freighter wallet with the dApp.
- Click "Get Testnet XLM" if it's a completely new wallet to quickly fund your credentials via Friendbot.
- In the "Post Swap Offer" section, specify amounts and contract IDs of the native or custom stellar assets you want to exchange.
- Once created, the offer displays in the right side container, allowing any other user to click "Fill Offer".

## Smart Contract Functions

* `create_offer(env, creator, token_a, amount_a, token_b, amount_b) -> u64`
  - **Write Transaction**. Transfers `amount_a` of `token_a` from `creator` to the smart contract logic and registers an active state linking them to expected amounts.
* `fill_offer(env, filler, offer_id) -> Result<(), Error>`
  - **Write Transaction**. Uses `filler` wallet approval to transfer `amount_b` of `token_b` directly to the `creator`, returning the locked `amount_a` of `token_a` back to the `filler`. Sets state to inactive.
* `get_offer(env, offer_id) -> Option<Offer>`
  - **Read Transaction**. Locates a singular offer model by ID index.
* `get_all_offers(env) -> Vec<Offer>`
  - **Read Transaction**. Crawls and aggregates full payload vectors representing all registered offers in contract storage for public view.

## Common Errors & Fixes
- **"Transaction simulation failed"** → contract not deployed correctly, lacking funding, or wrong `CONTRACT_ID` value in `.env.local`.
- **"Freighter not found"** → install the Freighter extension and restart the browser page.
- **"Account not found"** → click "Get Testnet XLM" to easily top up the wallet profile first.
- **"wasm32 target not found"** → Install compiling dependencies by running: `rustup target add wasm32-unknown-unknown`

## Testnet Resources
- Stellar Testnet Explorer: https://stellar.expert/explorer/testnet
- Stellar Lab (manual transactions): https://lab.stellar.org
- Friendbot: https://friendbot.stellar.org/?addr=YOUR_PUBLIC_KEY
