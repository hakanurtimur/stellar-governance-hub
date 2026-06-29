import { buildContractExplorerUrl, buildExplorerUrl } from "./format";

export function contractExplorerUrl(contractId: string): string {
  return buildContractExplorerUrl(contractId);
}

export function transactionExplorerUrl(hash: string): string {
  return buildExplorerUrl(hash);
}
