# Stellar Governance Hub

## Project Overview

Stellar Governance Hub is a Level 3 Stellar Testnet dApp project. It is being evolved from a Level 2 baseline into a production-style governance dashboard where users connect a wallet, view governance proposals, vote on-chain, see transaction/activity updates, and earn reputation through a second smart contract.

The previous Level 2 project is only a baseline reference. Its deployed contract ID, init transaction, vote transaction, demo link, and screenshots are not Level 3 submission artifacts and are intentionally not listed here as active deployment evidence.

Current Level 3 public deployment fields:

- Governance Contract ID: TODO
- Reputation Contract ID: TODO
- Governance interaction tx hash: TODO
- Reputation interaction tx hash: TODO
- Live Demo: TODO
- Demo Video: TODO

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
- Contract deployment is still TODO; no fake contract IDs, transaction hashes, explorer links, screenshots, or demo video are listed.

## Event Streaming / Activity Feed Plan

The first production-ready approach will use polling:

- poll proposal state every few seconds;
- poll contract events where Stellar RPC event history is available;
- immediately add locally submitted real transaction hashes after vote submission;
- deduplicate activity items by event ID or transaction hash;
- never create fake activity, hashes, or explorer links.

If direct event streaming becomes reliable in the target environment, the polling layer can be replaced behind the same activity feed interface.

## CI/CD Plan

GitHub Actions should run on push and pull request:

- `npm test`
- `npm run lint`
- `npm run build`
- `cargo test --locked` for Governance
- `cargo test --locked` for Reputation
- `stellar contract build` when Stellar CLI is available in CI

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
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_RPC_URL=https://soroban-testnet.stellar.org
```

Temporary backward compatibility while the baseline frontend helpers are migrated:

```bash
NEXT_PUBLIC_CONTRACT_ID=
```

Do not commit `.env.local`, private keys, seed phrases, or deployer secrets.

## Local Development

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`.

Useful checks:

```bash
npm test
npm run lint
npm run build
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

## Demo Video

Demo video: TODO

The demo should show wallet connection, proposal voting, transaction status, activity feed update, and reputation point update using real Testnet data.

## Submission Checklist

- [x] Level 3 repository initialized from Level 2 baseline.
- [x] Project renamed to Stellar Governance Hub.
- [x] Level 2 deployment claims removed from README.
- [x] Level 3 environment variable names added.
- [ ] Governance contract finalized.
- [ ] Reputation contract finalized.
- [x] Inter-contract communication finalized.
- [x] Frontend proposal list/detail finalized.
- [ ] Wallet vote flow finalized against deployed Governance Contract.
- [x] Reputation UI finalized.
- [x] Activity feed UI finalized.
- [ ] CI/CD finalized.
- [ ] Contract deployment workflow verified.
- [ ] Contracts deployed to Stellar Testnet.
- [ ] README updated with real Level 3 contract IDs and transaction hashes.
- [ ] Level 3 screenshots captured.
- [ ] Demo video recorded.
