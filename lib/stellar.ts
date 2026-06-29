import { rpc, Networks } from "@stellar/stellar-sdk";

export const STELLAR_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
export const STELLAR_RPC_URL =
  process.env.NEXT_PUBLIC_STELLAR_RPC_URL ?? "https://soroban-testnet.stellar.org";
export const CONTRACT_ID = process.env.NEXT_PUBLIC_CONTRACT_ID ?? "";

export const NETWORK_PASSPHRASE = Networks.TESTNET;

let rpcServer: rpc.Server | null = null;

export function getRpcServer(): rpc.Server {
  if (!rpcServer) {
    rpcServer = new rpc.Server(STELLAR_RPC_URL, {
      allowHttp: STELLAR_RPC_URL.startsWith("http://"),
    });
  }

  return rpcServer;
}

export async function getLatestLedger(): Promise<number> {
  const ledger = await getRpcServer().getLatestLedger();
  return ledger.sequence;
}
