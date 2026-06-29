# Stellar Governance Hub

Stellar Governance Hub is the Level 3 evolution of the Level 2 Stellar Live Poll project. It will become a production-style Stellar Testnet governance dApp with proposal management, on-chain voting, inter-contract reputation rewards, live activity updates, CI/CD, tests, deployment documentation, and demo-ready assets.

## Current Status

This repository has been initialized from the working Level 2 baseline in a separate Git history. The Level 2 review repository is intentionally left untouched.

The current baseline still contains the original single-poll contract and UI. Upcoming commits will replace that domain model with the Level 3 architecture:

- Governance contract for proposals, voting, results, closing proposals, and governance events.
- Reputation contract for participation points and wallet levels.
- Mandatory inter-contract call from Governance to Reputation when a vote is recorded.
- Mobile responsive governance dashboard with wallet flow, proposal list/detail, transaction status, explorer links, user reputation, and activity feed.
- Contract and frontend tests.
- GitHub Actions CI/CD workflow.
- Deployment workflow documentation for Stellar Testnet.

## Important Submission Rule

Do not fake contract addresses, transaction hashes, explorer links, CI results, or demo video links. Deployment fields stay blank until the contracts are actually deployed and verified on Stellar Testnet.

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- StellarWalletsKit
- `@stellar/stellar-sdk`
- Soroban Rust smart contracts
- Vitest
- Stellar Testnet

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
NEXT_PUBLIC_CONTRACT_ID=
NEXT_PUBLIC_GOVERNANCE_CONTRACT_ID=
NEXT_PUBLIC_REPUTATION_CONTRACT_ID=
```

`NEXT_PUBLIC_CONTRACT_ID` is kept temporarily for the Level 2 baseline code. The Level 3 frontend will move to explicit governance and reputation contract IDs.

Do not commit `.env.local`, secret keys, seed phrases, or deployer private material. `.env.example` is safe to commit.

## Planned Contract Architecture

```text
contracts/
  governance/
    src/lib.rs
  reputation/
    src/lib.rs
```

Governance contract target API:

- `initialize(admin, reputation_contract)`
- `create_proposal(creator, title, description, options, deadline)`
- `get_proposal(proposal_id)`
- `list_proposals(start, limit)`
- `vote(voter, proposal_id, option_index)`
- `get_results(proposal_id)`
- `has_voted(proposal_id, voter)`
- `close_proposal(caller, proposal_id)`

Governance events:

- `proposal_created`
- `vote_cast`
- `proposal_closed`

Reputation contract target API:

- `initialize(admin, governance_contract)`
- `award_point(voter)`
- `get_points(wallet)`
- `get_level(wallet)`

Reputation events:

- `reputation_awarded`

## Deployment Status

Deployment has not happened yet for Level 3.

- Governance contract ID: pending
- Reputation contract ID: pending
- Governance deploy transaction: pending
- Reputation deploy transaction: pending
- Initialization transactions: pending
- Demo URL: pending
- Demo video: pending

## Submission Checklist

- [x] Level 3 repository initialized from Level 2 baseline.
- [ ] Project renamed to Stellar Governance Hub across UI and docs.
- [ ] Governance contract implemented.
- [ ] Reputation contract implemented.
- [ ] Inter-contract vote reward flow implemented.
- [ ] Contract events implemented.
- [ ] Contract tests added.
- [ ] Frontend refactored from poll to governance proposals.
- [ ] Wallet vote transaction flow updated.
- [ ] Reputation and activity feed UI added.
- [ ] Frontend tests added.
- [ ] GitHub Actions CI/CD added.
- [ ] Stellar Testnet deployment workflow documented.
- [ ] Contracts deployed to Stellar Testnet.
- [ ] README updated with real contract IDs and transaction hashes.
- [ ] Screenshots and demo video section prepared.

## Commit Plan

1. Initialize Level 3 project from Level 2 baseline.
2. Rename project metadata and remove Level 2 deployment claims.
3. Add governance contract proposal model.
4. Add reputation contract.
5. Add inter-contract vote reward flow.
6. Add contract events and tests.
7. Refactor frontend architecture for proposals.
8. Add wallet vote transaction flow.
9. Add reputation and activity feed UI.
10. Add frontend tests.
11. Add CI/CD GitHub Actions workflow.
12. Add deployment workflow docs.
13. Deploy contracts to Stellar Testnet.
14. Update README with real contract IDs and hashes.
15. Add screenshots and demo video section.
