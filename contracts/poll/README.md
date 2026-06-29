# Stellar Live Poll Contract

Soroban smart contract for the Stellar Live Poll dApp.

## Build

```bash
stellar contract build
```

The optimized WASM should be produced at:

```text
target/wasm32v1-none/release/stellar_live_poll_contract.wasm
```

## Deploy To Testnet

Configure an identity with a funded Stellar testnet account first:

```bash
stellar keys generate livepoll-deployer --network testnet --fund
```

Then deploy:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/stellar_live_poll_contract.wasm \
  --source-account livepoll-deployer \
  --network testnet \
  --alias stellar_live_poll
```

Initialize the poll:

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

Set the returned contract ID as `NEXT_PUBLIC_CONTRACT_ID` in the frontend.

## Current Testnet Deployment

- Contract ID: `CBYUYRYPOKU5PMS4A2XC4WCUI6S3ZE3RTRZPSSGGJWKDIN2BPWXVIFY3`
- WASM hash: `103661b529a0fa62a6b3c2d23fd65949610f55745bd27874d19b3e31a9ca65d3`
- Init transaction: `b2136c8521b62f3a1da4582fb006a7562edeb3c443594ab255f1d985dd2e2a00`
- First vote transaction: `0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223`
