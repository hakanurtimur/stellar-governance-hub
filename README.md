# Stellar Live Poll

Live Demo: [https://stellar-live-pol.vercel.app/](https://stellar-live-pol.vercel.app/)

Deployed Contract Address: `CBYUYRYPOKU5PMS4A2XC4WCUI6S3ZE3RTRZPSSGGJWKDIN2BPWXVIFY3`

Contract Call Transaction Hash: `0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223`

Contract Explorer: [Stellar Expert Testnet Contract](https://stellar.expert/explorer/testnet/contract/CBYUYRYPOKU5PMS4A2XC4WCUI6S3ZE3RTRZPSSGGJWKDIN2BPWXVIFY3)

Vote Transaction: [Stellar Expert Testnet Transaction](https://stellar.expert/explorer/testnet/tx/0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223)

Init Transaction: [Stellar Expert Testnet Transaction](https://stellar.expert/explorer/testnet/tx/b2136c8521b62f3a1da4582fb006a7562edeb3c443594ab255f1d985dd2e2a00)

Stellar Live Poll is a Level 2 Stellar dApp submission project. It is a single-question live poll where a user connects a Stellar wallet, votes once, writes that vote to a Soroban smart contract on testnet, reads poll state back from RPC, and sees transaction status plus synced activity.

## Features

- Next.js App Router dashboard with TypeScript and Tailwind CSS.
- StellarWalletsKit multi-wallet modal with Freighter and other default supported wallet modules.
- Wallet connected state, disconnect, short public key display, and copy address action.
- Soroban contract read helpers for `get_question`, `get_options`, `get_results`, and `has_voted`.
- Soroban contract write helper for `vote(voter, option_id)`.
- Transaction status states: `idle`, `preparing`, `awaiting_signature`, `pending`, `success`, and `failed`.
- Testnet Stellar Expert transaction link after a successful submission hash is returned.
- Activity feed populated from real submitted vote hashes and RPC event polling when a contract ID is configured.
- Error handling for wallet not found, user rejection, insufficient testnet XLM, wrong network, RPC unavailable, invalid contract address, and contract failures.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- StellarWalletsKit
- `@stellar/stellar-sdk` RPC client
- Soroban Rust smart contract
- Stellar Testnet
- Vercel-compatible frontend

## Run Locally

```bash
pnpm install --ignore-scripts
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

## Environment Variables

```bash
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_CONTRACT_ID=CBYUYRYPOKU5PMS4A2XC4WCUI6S3ZE3RTRZPSSGGJWKDIN2BPWXVIFY3
```

Do not commit `.env` or secret keys. `.env.example` is safe to commit.

## Contract

Contract source lives in `contracts/poll`.

Functions:

- `init(question, options)`
- `vote(voter, option_id)`
- `get_question()`
- `get_options()`
- `get_results()`
- `has_voted(voter)`

Behavior:

- Stores one poll question and option list.
- Allows each wallet to vote once.
- Rejects invalid option IDs.
- Increments the chosen option count.
- Publishes a `vote` event with voter and option ID data.

## Build Contract

```bash
cd contracts/poll
stellar contract build
```

Current build output:

```text
Wasm File: target/wasm32v1-none/release/stellar_live_poll_contract.wasm
Wasm Hash: 103661b529a0fa62a6b3c2d23fd65949610f55745bd27874d19b3e31a9ca65d3
```

## Deploy Contract To Testnet

```bash
stellar keys generate livepoll-deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_live_poll_contract.wasm \
  --source-account livepoll-deployer \
  --network testnet \
  --alias stellar_live_poll
```

Deployment details:

- Deployer public key: `GBJRWC7YIOVP6YY5UTMFQB2KZJTZTPHAGBIH7RHJKAAEDZFARL4T5FZC`
- WASM upload transaction: [`e731fab60c4f212e288bd00bc011f65ddac0f079d0b9678a6c9303b01fbc7e99`](https://stellar.expert/explorer/testnet/tx/e731fab60c4f212e288bd00bc011f65ddac0f079d0b9678a6c9303b01fbc7e99)
- Contract deploy transaction: [`5f5e3b3057f18b97c0d86617ab48df93a5738b8c5e5a6fa2c74842f902147c94`](https://stellar.expert/explorer/testnet/tx/5f5e3b3057f18b97c0d86617ab48df93a5738b8c5e5a6fa2c74842f902147c94)
- Contract ID: `CBYUYRYPOKU5PMS4A2XC4WCUI6S3ZE3RTRZPSSGGJWKDIN2BPWXVIFY3`

Initialize after deploy:

```bash
stellar contract invoke \
  --id stellar_live_poll \
  --source-account livepoll-deployer \
  --network testnet \
  --send yes \
  -- \
  init \
  --question '"Which Stellar feature should we explore next?"' \
  --options '["Smart Contracts","Payments","Wallet UX"]'
```

Set the deployed contract ID in `NEXT_PUBLIC_CONTRACT_ID`.

The deployed poll was initialized with:

- Question: `Which Stellar feature should we explore next?`
- Options: `Smart Contracts`, `Payments`, `Wallet UX`
- Init transaction: [`b2136c8521b62f3a1da4582fb006a7562edeb3c443594ab255f1d985dd2e2a00`](https://stellar.expert/explorer/testnet/tx/b2136c8521b62f3a1da4582fb006a7562edeb3c443594ab255f1d985dd2e2a00)
- First vote transaction: [`0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223`](https://stellar.expert/explorer/testnet/tx/0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223)

## Frontend Contract Calls

Reads:

- `get_question`
- `get_options`
- `get_results`
- `has_voted`

Write:

- `vote(voter, option_id)`

The frontend builds a Soroban transaction, prepares it through Stellar RPC, asks StellarWalletsKit to sign the XDR, submits through RPC, polls transaction status, refreshes poll state, and adds the confirmed transaction hash to the activity feed.

## Wallet Support

The app initializes StellarWalletsKit with `defaultModules()` on testnet. The modal can show Freighter, Albedo, Fordefi, Rabet, xBull, Lobstr, Hana, Klever, OneKey, Bitget, and Cactus Link depending on platform availability and wallet support.

## Error Handling

- Wallet not found: `Wallet not found. Please install or enable a supported Stellar wallet.`
- User rejected: `Request rejected by user.`
- Insufficient balance: `Insufficient testnet XLM. Please fund your wallet on Stellar Testnet.`
- Wrong network warning for non-testnet wallet state.
- Contract call, RPC, and invalid contract address errors are displayed in the dashboard banner and transaction status card.

## Transaction Status

The transaction card displays current status, the last successful transaction hash, Stellar Expert link, and error message. Write flow status moves through preparing, awaiting signature, pending, success, or failed. Contract state refreshes do not clear the last successful vote transaction; disconnecting or switching wallets resets that browser-session transaction state.

## Event And Live Sync

When `NEXT_PUBLIC_CONTRACT_ID` is configured, the frontend polls Stellar RPC every 10 seconds for fresh poll state and contract vote events via `getEvents`. After a vote submission, the returned real transaction hash is immediately added to the activity feed and state is refreshed from RPC. If no contract ID is configured, the UI shows the poll shell but disables voting instead of faking contract activity.

## Screenshots

Final submission screenshots are captured in `screenshots/`:

- `screenshots/wallet-connected.png`
- `screenshots/poll-loaded.png`
- `screenshots/vote-ready.png`
- `screenshots/vote-success.png`
- `screenshots/results-updated.png`
- `screenshots/transaction-hash.png`

`screenshots/vote-success.png` must show successful transaction state after a real vote.
`screenshots/transaction-hash.png` must show the transaction hash and explorer link.

Additional flow screenshots:

- `screenshots/wallet-select-modal.png`
- `screenshots/vote-pending.png`

## Submission Checklist

- [x] Clean Level 2 project created.
- [x] Next.js App Router frontend.
- [x] StellarWalletsKit multi-wallet modal integration.
- [x] Freighter support via default wallet modules.
- [x] Wallet connect, disconnect, short address, and copy address UI.
- [x] Soroban Rust poll contract.
- [x] Contract read/write helper functions in frontend.
- [x] Transaction status UI.
- [x] Activity feed and live sync polling.
- [x] Error handling for required wallet and transaction cases.
- [x] `.env.example` included and `.env` ignored.
- [x] Contract deployed to Stellar Testnet.
- [x] Contract address added above.
- [x] Verifiable contract call transaction hash added above.
- [x] Vercel live demo URL added above.
- [x] Screenshots captured and added.

## Commit Plan

Recommended meaningful commits:

1. Initialize Stellar Live Poll frontend with multi-wallet UI
2. Add Soroban poll contract and deployment configuration
3. Connect frontend contract read/write calls with transaction status
4. Add activity feed, README, screenshots, and submission checklist
