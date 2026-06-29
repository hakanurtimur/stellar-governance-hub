# Stellar Governance Hub Deployment Workflow

This document records the Stellar Testnet deployment flow and real public deployment references for the Level 3 submission. It intentionally excludes private keys, seed phrases, and `.env.local` values.

## Prerequisites

- Stellar CLI installed locally.
- Rust target installed:

```bash
rustup target add wasm32v1-none
```

- A funded Stellar Testnet deployer identity.
- No private keys, seed phrases, or `.env.local` values committed to Git.

## Build Contracts

Build the Reputation contract first:

```bash
cd contracts/reputation
stellar contract build
```

Build the Governance contract second:

```bash
cd contracts/governance
stellar contract build
```

## Deploy Order

1. Deploy the Reputation contract.
2. Deploy the Governance contract.
3. Initialize Reputation with the Governance contract ID.
4. Initialize Governance with the admin address and Reputation contract ID.
5. Create initial governance proposals with real contract invocations.
6. Update `.env.local` locally for manual verification.
7. Update `.env.example` only with variable names, not secrets.
8. Update README with real public contract IDs and transaction hashes after verification.

## Example Commands

Generate and fund a Testnet deployer:

```bash
stellar keys generate governance-hub-deployer --network testnet --fund
```

Deploy Reputation:

```bash
stellar contract deploy \
  --wasm contracts/reputation/target/wasm32v1-none/release/stellar_reputation_contract.wasm \
  --source-account governance-hub-deployer \
  --network testnet \
  --alias governance_hub_reputation
```

Deploy Governance:

```bash
stellar contract deploy \
  --wasm contracts/governance/target/wasm32v1-none/release/stellar_governance_contract.wasm \
  --source-account governance-hub-deployer \
  --network testnet \
  --alias governance_hub_governance
```

Initialize Reputation:

```bash
stellar contract invoke \
  --id governance_hub_reputation \
  --source-account governance-hub-deployer \
  --network testnet \
  --send yes \
  -- \
  initialize \
  --admin <ADMIN_PUBLIC_KEY> \
  --governance_contract <GOVERNANCE_CONTRACT_ID>
```

Initialize Governance:

```bash
stellar contract invoke \
  --id governance_hub_governance \
  --source-account governance-hub-deployer \
  --network testnet \
  --send yes \
  -- \
  initialize \
  --admin <ADMIN_PUBLIC_KEY> \
  --reputation_contract <REPUTATION_CONTRACT_ID>
```

Create a proposal:

```bash
stellar contract invoke \
  --id governance_hub_governance \
  --source-account governance-hub-deployer \
  --network testnet \
  --send yes \
  -- \
  create_proposal \
  --creator <ADMIN_PUBLIC_KEY> \
  --title '"Fund public goods round?"' \
  --description '"Allocate treasury funds to developer tooling."' \
  --options '["Approve","Reject","Abstain"]' \
  --deadline 0
```

## Public Deployment Record

- Deployer public key: `GD4R3PSX4R5H6F6NOHYJQKL6BTRZYJCNEUTTIYFWN5AJASVLJ5U3MEGX`
- Reputation contract ID: `CAI2YIQQXQAPJ2GKA6I66GRENFSVCVELKOGZ7BA7PLMWNMUAIKFKRBHO`
- Governance contract ID: `CAN4N5DMMJOO5TBVB73AW57F4EEUQZXT2U4BJXAHAN7MKBMLSOYLTNP2`
- Reputation WASM path: `contracts/reputation/target/wasm32v1-none/release/stellar_reputation_contract.wasm`
- Reputation WASM hash: `10f21b5f5821f005db770fb1da71ab86572010f50c62a66791ccacf2579cc7c9`
- Governance WASM path: `contracts/governance/target/wasm32v1-none/release/stellar_governance_contract.wasm`
- Governance WASM hash: `d45b54e9bd50fae939a6b9f2bb4f895fb433bab969cdad501f246475341f48dd`
- Reputation WASM upload transaction: `e8ae30bdbda13513496e98e6757ca05c2a49b5f4fd8a29392e04c3086333e2ac`
- Reputation deploy transaction: `d24c706580639786f202f7f04d20f8335a6725cf6b368fc2295f6a6675ecebc0`
- Governance WASM upload transaction: `62858e704c215b984c9b8c2d823f1ea87d7a536315b44fa11bfa87940a49ee1d`
- Governance deploy transaction: `7c1f99d78c2a835093e877d79645986449beea30c5bf878aee7ff9d4b6cc4378`
- Reputation initialization transaction: `f81b9925fd84d4d976ee822a06e7bb2fcd3042aa729a6076eed9f6e7898bc342`
- Governance initialization transaction: `afd5c2e30966868974ebfb9fa659f305f68020d4c6c28c787054eca04bb5876f`
- Proposal 1 transaction: `65bf8a12e3eb6ec90b08de6fd63d4df600bf2a5e47194fc426922a86e3cae410`
- Proposal 2 transaction: `686f555552aff5e13809a9c7b791554afcc7497be1ab64f0740d02f74849c531`
- Vote and reputation reward transaction: `9739b673a4b035d23ac5d54d13bf98ba4f81657262f1f4b727cbbc9eee825ee4`
- Frontend deployment URL: TODO
- Demo video URL: TODO

Explorer links:

- Governance Contract: https://lab.stellar.org/r/testnet/contract/CAN4N5DMMJOO5TBVB73AW57F4EEUQZXT2U4BJXAHAN7MKBMLSOYLTNP2
- Reputation Contract: https://lab.stellar.org/r/testnet/contract/CAI2YIQQXQAPJ2GKA6I66GRENFSVCVELKOGZ7BA7PLMWNMUAIKFKRBHO
- Vote and reward transaction: https://stellar.expert/explorer/testnet/tx/9739b673a4b035d23ac5d54d13bf98ba4f81657262f1f4b727cbbc9eee825ee4

On-chain verification:

- `get_proposal(1)` returned proposal 1 with title `Which Stellar feature should the community prioritize next?`, `total_votes: 1`, and options `Smart Contracts`, `Payments`, `Wallet UX`.
- `list_proposals(0, 10)` returned proposal IDs `1` and `2`.
- `get_results(1)` returned `[1,0,0]`.
- `has_voted(1, deployer)` returned `true`.
- `get_points(deployer)` returned `1`.
- `get_level(deployer)` returned `participant`.

## Verification Checklist

- `pnpm test`
- `pnpm lint`
- `pnpm build`
- `cargo test --locked` in `contracts/reputation`
- `cargo test --locked` in `contracts/governance`
- `stellar contract build` in both contract folders when Stellar CLI is installed
- Manual wallet connect on Stellar Testnet
- Real vote transaction submitted from the frontend
- Reputation points increment after vote
- Activity feed updates after vote or polling refresh
