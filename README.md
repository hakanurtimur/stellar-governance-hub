# Stellar Governance Hub

## Project Overview

Stellar Governance Hub is a Level 3 Stellar Testnet dApp project. It is being evolved from a Level 2 baseline into a production-style governance dashboard where users connect a wallet, view governance proposals, vote on-chain, see transaction/activity updates, and earn reputation through a second smart contract.

The previous Level 2 project is only a baseline reference. Its deployed contract ID, init transaction, vote transaction, demo link, and screenshots are not Level 3 submission artifacts and are intentionally not listed here as active deployment evidence.

Current Level 3 public deployment fields:

- Governance Contract ID: `CAN4N5DMMJOO5TBVB73AW57F4EEUQZXT2U4BJXAHAN7MKBMLSOYLTNP2`
- Reputation Contract ID: `CAI2YIQQXQAPJ2GKA6I66GRENFSVCVELKOGZ7BA7PLMWNMUAIKFKRBHO`
- Governance interaction tx hash: `9739b673a4b035d23ac5d54d13bf98ba4f81657262f1f4b727cbbc9eee825ee4`
- Reputation interaction tx hash: `9739b673a4b035d23ac5d54d13bf98ba4f81657262f1f4b727cbbc9eee825ee4`
- Live Demo: https://stellar-governance-hub.vercel.app/
- Demo Video: TODO

Explorer links:

- Governance Contract: https://lab.stellar.org/r/testnet/contract/CAN4N5DMMJOO5TBVB73AW57F4EEUQZXT2U4BJXAHAN7MKBMLSOYLTNP2
- Reputation Contract: https://lab.stellar.org/r/testnet/contract/CAI2YIQQXQAPJ2GKA6I66GRENFSVCVELKOGZ7BA7PLMWNMUAIKFKRBHO
- Vote and reputation reward transaction: https://stellar.expert/explorer/testnet/tx/9739b673a4b035d23ac5d54d13bf98ba4f81657262f1f4b727cbbc9eee825ee4

## Live Demo

Live Demo: https://stellar-governance-hub.vercel.app/

The live deployment should be configured with the public Testnet contract IDs listed in this README. If the Vercel deployment is rebuilt, verify the environment variables below are present before recording screenshots or the demo video.

## Demo Video

Demo Video: TODO

The demo video link will be added after the final recording is uploaded. Do not use placeholder or private links as submission evidence.

Deployment transactions:

- Reputation WASM upload tx: `e8ae30bdbda13513496e98e6757ca05c2a49b5f4fd8a29392e04c3086333e2ac`
- Reputation deploy tx: `d24c706580639786f202f7f04d20f8335a6725cf6b368fc2295f6a6675ecebc0`
- Governance WASM upload tx: `62858e704c215b984c9b8c2d823f1ea87d7a536315b44fa11bfa87940a49ee1d`
- Governance deploy tx: `7c1f99d78c2a835093e877d79645986449beea30c5bf878aee7ff9d4b6cc4378`
- Reputation init tx: `f81b9925fd84d4d976ee822a06e7bb2fcd3042aa729a6076eed9f6e7898bc342`
- Governance init tx: `afd5c2e30966868974ebfb9fa659f305f68020d4c6c28c787054eca04bb5876f`
- Proposal 1 create tx: `65bf8a12e3eb6ec90b08de6fd63d4df600bf2a5e47194fc426922a86e3cae410`
- Proposal 2 create tx: `686f555552aff5e13809a9c7b791554afcc7497be1ab64f0740d02f74849c531`

Inter-contract proof:

- Vote tx `9739b673a4b035d23ac5d54d13bf98ba4f81657262f1f4b727cbbc9eee825ee4` emitted Governance `vote_cast`, Reputation `rep_award`, and Governance `vote_rewarded` events.
- `get_results(1)` returned `[1,0,0]`.
- `has_voted(1, deployer)` returned `true`.
- `get_points(deployer)` returned `1`.
- `get_level(deployer)` returned `participant`.

## Level 3 Requirements Mapping

- Advanced smart contract development: Governance and Reputation contracts.
- Inter-contract communication: Governance vote flow calls Reputation to award participation points.
- Event streaming / real-time updates: frontend activity feed will poll contract events and refreshed proposal state.
- CI/CD pipeline setup: GitHub Actions will run frontend and contract checks.
- Smart contract deployment workflow: documented Stellar Testnet build/deploy/initialize flow.
- Mobile responsive frontend: dashboard layout targets desktop and mobile.
- Error handling and loading states: wallet, RPC, transaction, empty, and configured/unconfigured states.
- Tests for contracts and frontend: contract unit tests plus Vitest frontend/unit coverage.
- Production-ready architecture: separated contracts, frontend components, helpers, docs, and CI.
- Complete documentation: README plus deployment workflow docs.
- Demo presentation/video readiness: screenshots and demo video sections remain TODO until real artifacts exist.

## Architecture

```text
Stellar Governance Hub
  Frontend dashboard
    Wallet connection
    Proposal list/detail UI
    Vote transaction flow
    Reputation display
    Activity feed

  Smart contracts
    Governance Contract
    Reputation Contract

  Stellar Testnet
    RPC reads
    Signed Soroban transactions
    Contract events
```

## Smart Contracts

### Governance Contract

Foundation implemented in `contracts/governance`:

- `initialize(admin, reputation_contract)`
- `create_proposal(creator, title, description, options, deadline)`
- `get_proposal(proposal_id)`
- `list_proposals(start, limit)`
- `vote(voter, proposal_id, option_index)`
- `get_results(proposal_id)`
- `has_voted(proposal_id, voter)`
- `close_proposal(caller, proposal_id)`
- `get_reputation_contract()`
- stores proposal `id`, `creator`, `title`, `description`, `options`, `created_at`, `deadline`, `is_closed`, and `total_votes`
- validates title, option count, future deadline, duplicate votes, close authorization, and voting deadline
- emit `proposal_created`
- emit `vote_cast`
- emit `proposal_closed`

### Reputation Contract

Foundation implemented in `contracts/reputation`:

- `initialize(admin, governance_contract)`
- `award_point(caller, voter)`
- `get_points(wallet)`
- `get_level(wallet)`
- `get_governance_contract()`
- track participation points per wallet
- enforce that only the initialized governance contract can award points
- levels: `newcomer`, `participant`, `contributor`, `governor`
- emit `reputation_initialized`
- emit `reputation_awarded`

### Inter-contract Communication

Implemented in the contract layer. `Governance.vote` now calls `Reputation.award_point` with the Governance contract address as the authorized caller.

```text
User votes
→ Governance Contract validates and records the vote
→ Governance Contract increments proposal results and marks has_voted
→ Governance Contract emits vote_cast
→ Governance Contract calls Reputation Contract in the same transaction
→ Reputation Contract awards 1 participation point
→ Governance Contract emits vote_rewarded
```

If the Reputation call fails, the vote transaction fails as well, keeping proposal votes and reputation points consistent.

## Frontend Features

- Governance dashboard implemented with header badges, wallet panel, proposal list/detail, vote panel, reputation card, transaction status, and live activity feed UI.
- Wallet connect, disconnect, and switch wallet states implemented for Stellar Testnet UX.
- Governance Contract and Reputation Contract info cards implemented with env-backed IDs, copy controls, and explorer links only when configured.
- Proposal list/detail UI implemented with status, deadlines, leading option, vote counts, percentages, already-voted, closed/ended, empty, and preview states.
- Reputation card implemented with points and `newcomer` / `participant` / `contributor` / `governor` levels.
- Activity feed UI implemented for local successful vote activity and future contract event polling.
- Transaction status UI implemented with idle, awaiting wallet, submitting, success, and error states.
- Transaction hash display is retained after real successful submissions.
- Loading, error, missing-env, unconfigured, already-voted, and submitted states are represented.
- Mobile responsive layout implemented with single-column cards, wrapping actions, shortened IDs, and non-overflowing hashes.
- Contracts are deployed to Stellar Testnet with real public IDs and transaction hashes listed above. Demo screenshots and video remain TODO.

## Frontend Integration

- Live mode requires both `NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID` and `NEXT_PUBLIC_REPUTATION_CONTRACT_ID`.
- Preview mode is UI-only and remains clearly labeled as local preview data when contract IDs are missing.
- Governance client reads `list_proposals`, `get_proposal`, `get_results`, `has_voted`, and `get_reputation_contract`.
- Reputation client reads `get_points`, `get_level`, and `get_governance_contract`.
- Vote flow builds a Soroban `vote(voter, proposal_id, option_index)` transaction, prepares it through Stellar RPC, requests wallet signature, submits it to Stellar Testnet, and keeps the real transaction hash in the success UI.
- Contract deployment is complete on Stellar Testnet; preview mode still remains UI-only when env IDs are missing.

## Event Streaming / Activity Feed Plan

The first production-ready approach will use polling:

- poll proposal state every few seconds;
- poll contract events where Stellar RPC event history is available;
- immediately add locally submitted real transaction hashes after vote submission;
- deduplicate activity items by event ID or transaction hash;
- never create fake activity, hashes, or explorer links.

If direct event streaming becomes reliable in the target environment, the polling layer can be replaced behind the same activity feed interface.

## CI/CD

Workflow file: `.github/workflows/ci.yml`

GitHub Actions runs on push and pull request targeting `main` or `master`.

Frontend job:

- installs dependencies with `pnpm install --frozen-lockfile`;
- runs `pnpm test`;
- runs `pnpm lint`;
- runs `pnpm build`.

Smart contract job:

- installs Rust stable with `wasm32v1-none`;
- installs Stellar CLI `27.0.0` with `cargo install --locked stellar-cli --version 27.0.0`;
- prints `stellar --version`;
- runs `cargo test --locked` in `contracts/governance`;
- runs `stellar contract build` in `contracts/governance`;
- runs `cargo test --locked` in `contracts/reputation`;
- runs `stellar contract build` in `contracts/reputation`.

Local verification:

```bash
pnpm test
pnpm lint
pnpm build

cd contracts/governance
cargo test
stellar contract build

cd ../reputation
cargo test
stellar contract build
```

CI screenshot for submission should be captured from the GitHub Actions run page. Test output screenshot can be captured from the local terminal or GitHub Actions logs.

## Test Output

Required verification before final submission:

- `pnpm test` for frontend and helper unit tests.
- `pnpm lint` for the Next.js frontend.
- `pnpm build` for production build validation.
- `cargo test --locked` and `stellar contract build` in both `contracts/governance` and `contracts/reputation`.

Capture `screenshots/test-output.png` from a local terminal or GitHub Actions logs after these checks pass.

## Testing Plan

Contract tests:

- proposal creation;
- proposal listing and result initialization;
- vote recording;
- duplicate vote prevention;
- close proposal behavior;
- inter-contract reputation award.

Frontend tests:

- disconnected wallet UI;
- proposal rendering;
- transaction success state;
- activity feed after vote;
- contract ID display;
- formatting and transaction state helpers.

## Environment Variables

Primary Level 3 variables:

```bash
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=CAN4N5DMMJOO5TBVB73AW57F4EEUQZXT2U4BJXAHAN7MKBMLSOYLTNP2
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=CAI2YIQQXQAPJ2GKA6I66GRENFSVCVELKOGZ7BA7PLMWNMUAIKFKRBHO
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

Temporary backward compatibility while the baseline frontend helpers are migrated:

```bash
NEXT_PUBLIC_CONTRACT_ID=
```

Do not commit `.env.local`, private keys, seed phrases, or deployer secrets.

## Vercel Environment Variables

Set these in the Vercel project before deploying or redeploying:

```bash
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=CAN4N5DMMJOO5TBVB73AW57F4EEUQZXT2U4BJXAHAN7MKBMLSOYLTNP2
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=CAI2YIQQXQAPJ2GKA6I66GRENFSVCVELKOGZ7BA7PLMWNMUAIKFKRBHO
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

## Local Development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
pnpm test
pnpm lint
pnpm build
```

## Contract Build / Deploy Workflow

See [docs/deployment.md](docs/deployment.md) for the full Stellar Testnet deployment workflow.

Short version:

```bash
cd contracts/reputation
stellar contract build

cd ../governance
stellar contract build
```

Deployment order:

1. Deploy Reputation Contract.
2. Deploy Governance Contract.
3. Initialize Reputation with Governance Contract ID.
4. Initialize Governance with Reputation Contract ID.
5. Create initial proposals.
6. Update README only with real public IDs and transaction hashes.

## Screenshots

Level 3 screenshots: TODO

Do not reuse Level 2 screenshots as Level 3 evidence. New screenshots should be captured after the governance dashboard and real Testnet flows are ready.

Add real screenshots before submission. The existing legacy screenshots are baseline artifacts and should not be used as final Level 3 proof unless recaptured from the live Governance Hub flow.

Required screenshot paths:

- `screenshots/mobile-responsive.png`
- `screenshots/github-actions-ci.png`
- `screenshots/test-output.png`
- `screenshots/wallet-connected.png`
- `screenshots/proposal-vote-success.png`
- `screenshots/transaction-hash.png`
- `screenshots/reputation-points.png`
- `screenshots/activity-feed.png`

## Demo Video

Demo video: TODO

The demo should show wallet connection, proposal voting, transaction status, activity feed update, and reputation point update using real Testnet data.

## Demo Video Script

Target length: 1-2 minutes.

1. Open https://stellar-governance-hub.vercel.app/ and show the Stellar Governance Hub dashboard.
2. Show the Governance and Reputation contract ID cards.
3. Connect a Stellar Testnet wallet.
4. Load the live proposals and open proposal detail.
5. Select a vote option and submit the vote.
6. Confirm the transaction in the wallet.
7. Show the transaction hash and Stellar Expert explorer link.
8. Show the reputation points and `participant` level.
9. Show the live activity feed entry for the vote.
10. Briefly show GitHub Actions CI and local/GitHub test output.

## Submission Checklist

- [x] Level 3 repository initialized from Level 2 baseline.
- [x] Project renamed to Stellar Governance Hub.
- [x] Level 2 deployment claims removed from README.
- [x] Level 3 environment variable names added.
- [x] Governance contract finalized.
- [x] Reputation contract finalized.
- [x] Inter-contract communication finalized.
- [x] Frontend proposal list/detail finalized.
- [x] Wallet vote flow finalized against deployed Governance Contract.
- [x] Reputation UI finalized.
- [x] Activity feed UI finalized.
- [x] CI/CD finalized.
- [x] Contract deployment workflow verified.
- [x] Contracts deployed to Stellar Testnet.
- [x] README updated with real Level 3 contract IDs and transaction hashes.
- [x] Live demo URL added.
- [ ] Level 3 screenshots captured.
- [ ] Demo video recorded.
