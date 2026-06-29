# Stellar Governance Hub Deployment Workflow

This document describes the intended Stellar Testnet deployment flow for the Level 3 submission. Do not fill in contract IDs, transaction hashes, explorer links, or demo links until they are produced by a real deployment.

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
stellar keys generate governance-deployer --network testnet --fund
```

Deploy Reputation:

```bash
stellar contract deploy \
  --wasm contracts/reputation/target/wasm32v1-none/release/stellar_reputation_contract.wasm \
  --source-account governance-deployer \
  --network testnet \
  --alias stellar_governance_reputation
```

Deploy Governance:

```bash
stellar contract deploy \
  --wasm contracts/governance/target/wasm32v1-none/release/stellar_governance_contract.wasm \
  --source-account governance-deployer \
  --network testnet \
  --alias stellar_governance_hub
```

Initialize Reputation:

```bash
stellar contract invoke \
  --id stellar_governance_reputation \
  --source-account governance-deployer \
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
  --id stellar_governance_hub \
  --source-account governance-deployer \
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
  --id stellar_governance_hub \
  --source-account governance-deployer \
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

Fill these only after real deployment:

- Reputation contract ID: pending
- Governance contract ID: pending
- Reputation deploy transaction: pending
- Governance deploy transaction: pending
- Reputation initialization transaction: pending
- Governance initialization transaction: pending
- Initial proposal transaction: pending
- Frontend deployment URL: pending
- Demo video URL: pending

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
