export type TransactionStatus =
  | "idle"
  | "preparing"
  | "awaiting_signature"
  | "pending"
  | "success"
  | "failed";

export type StellarNetwork = "testnet" | "public";

export function shortenAddress(value: string, head = 6, tail = 6): string {
  if (value.length <= head + tail + 3) {
    return value;
  }

  return `${value.slice(0, head)}...${value.slice(-tail)}`;
}

export function buildExplorerUrl(hash: string, network: StellarNetwork = "testnet"): string {
  const explorerNetwork = network === "public" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${explorerNetwork}/tx/${hash}`;
}

export function buildContractExplorerUrl(contractId: string, network: StellarNetwork = "testnet"): string {
  const explorerNetwork = network === "public" ? "public" : "testnet";
  return `https://stellar.expert/explorer/${explorerNetwork}/contract/${contractId}`;
}

export function normalizeTransactionStatus(status: string): TransactionStatus {
  const normalized = status.toUpperCase();

  if (normalized === "SUCCESS") {
    return "success";
  }

  if (normalized === "FAILED" || normalized === "ERROR") {
    return "failed";
  }

  if (normalized === "NOT_FOUND" || normalized === "PENDING") {
    return "pending";
  }

  return "failed";
}

export function formatErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  const message = (raw || "").toLowerCase();

  if (
    message.includes("not connected") ||
    message.includes("not installed") ||
    message.includes("not found") ||
    message.includes("unavailable")
  ) {
    return "Wallet not found. Please install or enable a supported Stellar wallet.";
  }

  if (
    message.includes("reject") ||
    message.includes("denied") ||
    message.includes("declined") ||
    message.includes("cancel")
  ) {
    return "Request rejected by user.";
  }

  if (
    message.includes("insufficient") ||
    message.includes("tx_insufficient") ||
    message.includes("underfunded") ||
    message.includes("fee")
  ) {
    return "Insufficient testnet XLM. Please fund your wallet on Stellar Testnet.";
  }

  if (message.includes("startledger") || message.includes("ledger range")) {
    return "Stellar event history moved forward. Refresh contract state and try again.";
  }

  if (message.includes("testnet") || message.includes("network")) {
    return "Wrong network. Please switch your wallet to Stellar Testnet.";
  }

  if (message.includes("contract")) {
    return "Contract call failed. Please verify the contract ID and try again.";
  }

  if (message.includes("rpc") || message.includes("fetch")) {
    return "Stellar RPC is unavailable. Please try again in a moment.";
  }

  return raw || "Unexpected error. Please try again.";
}

export function toPercent(value: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
