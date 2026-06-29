import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";

import type { ContractConfig } from "./env";
import { buildExplorerUrl, normalizeTransactionStatus } from "./format";
import { NETWORK_PASSPHRASE, getRpcServer } from "./stellar";

export type ContractMode = "preview" | "live";
export type ContractCallArg = Parameters<Contract["call"]> extends [string, ...infer Rest]
  ? Rest[number]
  : never;

type ContractTransactionParams = {
  contractId: string;
  walletAddress: string;
  method: string;
  args: ContractCallArg[];
  signTransaction?: (walletAddress: string, xdr: string) => Promise<string>;
};

export type ContractTransactionResult = {
  hash: string;
  status: "success" | "pending" | "failed";
  explorerUrl: string;
};

export function getContractMode(config: ContractConfig): ContractMode {
  return config.allConfigured ? "live" : "preview";
}

export function assertLiveContracts(config: ContractConfig): void {
  if (!config.allConfigured) {
    throw new Error(
      "Missing contract env. Configure Governance and Reputation contract IDs before using live mode.",
    );
  }
}

export async function simulateContractCall<T>(
  contractId: string,
  method: string,
  args: ContractCallArg[] = [],
): Promise<T> {
  if (!contractId) {
    throw new Error("Missing contract env.");
  }

  const account = await getRpcServer().getAccount(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  );
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(30)
    .build();
  const response = await getRpcServer().simulateTransaction(tx);

  if (rpc.Api.isSimulationError(response)) {
    throw new Error(response.error);
  }

  if (!response.result?.retval) {
    throw new Error(`Contract method ${method} returned no value.`);
  }

  return scValToNative(response.result.retval) as T;
}

export async function submitContractTransaction({
  contractId,
  walletAddress,
  method,
  args,
  signTransaction,
}: ContractTransactionParams): Promise<ContractTransactionResult> {
  if (!contractId) {
    throw new Error("Missing contract env.");
  }

  const account = await getRpcServer().getAccount(walletAddress);
  const contract = new Contract(contractId);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(contract.call(method, ...args))
    .setTimeout(60)
    .build();
  const prepared = await getRpcServer().prepareTransaction(tx);
  const signer = signTransaction ?? defaultSignTransaction;
  const signedXdr = await signer(walletAddress, prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResponse = await getRpcServer().sendTransaction(signedTx);
  const hash = sendResponse.hash;

  if (sendResponse.status === "ERROR") {
    throw new Error(sendResponse.errorResult?.toString() ?? "Contract call failed.");
  }

  let status: ContractTransactionResult["status"] = "pending";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const txResult = await getRpcServer().getTransaction(hash);
    status = normalizeTransactionStatus(txResult.status) as ContractTransactionResult["status"];
    if (status !== "pending") {
      break;
    }
  }

  return {
    hash,
    status,
    explorerUrl: buildExplorerUrl(hash),
  };
}

export function addressArg(address: string): ContractCallArg {
  return new Address(address).toScVal() as ContractCallArg;
}

async function defaultSignTransaction(walletAddress: string, xdr: string): Promise<string> {
  const { signTransactionXdr } = await import("./wallet");
  return signTransactionXdr(walletAddress, xdr);
}
