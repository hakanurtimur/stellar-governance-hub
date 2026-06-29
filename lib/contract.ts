import {
  Address,
  BASE_FEE,
  Contract,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";

import { CONTRACT_ID, NETWORK_PASSPHRASE, getRpcServer, getLatestLedger } from "./stellar";
import { normalizeTransactionStatus } from "./format";

export type PollOption = {
  id: number;
  label: string;
  votes: number;
};

export type PollState = {
  configured: boolean;
  question: string;
  options: PollOption[];
  totalVotes: number;
  hasVoted: boolean;
  latestLedger?: number;
};

export type VoteActivity = {
  id: string;
  voter: string;
  optionId: number;
  optionLabel: string;
  txHash: string;
  status: "success" | "pending" | "failed";
  timestamp: string;
};

export type VoteResult = {
  hash: string;
  status: "success" | "pending" | "failed";
  activity: VoteActivity;
};

const FALLBACK_QUESTION = "Which Stellar developer experience matters most for Level 2?";
const FALLBACK_OPTIONS = ["Multi-wallet UX", "On-chain poll state", "Live activity feed"];

function isLedgerRangeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return message.toLowerCase().includes("startledger must be within the ledger range");
}

function requireContractId(): string {
  if (!CONTRACT_ID) {
    throw new Error("Invalid contract address. Set NEXT_PUBLIC_CONTRACT_ID first.");
  }

  return CONTRACT_ID;
}

function getContract(): Contract {
  return new Contract(requireContractId());
}

function optionLabel(options: PollOption[], optionId: number): string {
  return options.find((option) => option.id === optionId)?.label ?? `Option ${optionId}`;
}

async function simulateCall<T>(method: string, ...args: Parameters<Contract["call"]> extends [string, ...infer Rest] ? Rest : never): Promise<T> {
  const account = await getRpcServer().getAccount(
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
  );
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(getContract().call(method, ...args))
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

export async function fetchPollState(voter?: string): Promise<PollState> {
  if (!CONTRACT_ID) {
    const options = FALLBACK_OPTIONS.map((label, index) => ({
      id: index,
      label,
      votes: 0,
    }));
    return {
      configured: false,
      question: FALLBACK_QUESTION,
      options,
      totalVotes: 0,
      hasVoted: false,
    };
  }

  const [question, optionLabels, counts, latestLedger] = await Promise.all([
    simulateCall<string>("get_question"),
    simulateCall<string[]>("get_options"),
    simulateCall<bigint[]>("get_results"),
    getLatestLedger(),
  ]);
  const hasVoted = voter
    ? await simulateCall<boolean>("has_voted", new Address(voter).toScVal())
    : false;
  const options = optionLabels.map((label, index) => ({
    id: index,
    label,
    votes: Number(counts[index] ?? 0),
  }));

  return {
    configured: true,
    question,
    options,
    totalVotes: options.reduce((sum, option) => sum + option.votes, 0),
    hasVoted,
    latestLedger,
  };
}

export async function submitVote(
  voter: string,
  optionId: number,
  signXdr: (xdr: string) => Promise<string>,
  options: PollOption[],
): Promise<VoteResult> {
  const account = await getRpcServer().getAccount(voter);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      getContract().call(
        "vote",
        new Address(voter).toScVal(),
        nativeToScVal(optionId, { type: "u32" }),
      ),
    )
    .setTimeout(60)
    .build();
  const prepared = await getRpcServer().prepareTransaction(tx);
  const signedXdr = await signXdr(prepared.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const sendResponse = await getRpcServer().sendTransaction(signedTx);
  const hash = sendResponse.hash;

  if (sendResponse.status === "ERROR") {
    throw new Error(sendResponse.errorResult?.toString() ?? "Contract call failed.");
  }

  let status: VoteResult["status"] = "pending";
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const txResult = await getRpcServer().getTransaction(hash);
    status = normalizeTransactionStatus(txResult.status) as VoteResult["status"];
    if (status !== "pending") {
      break;
    }
  }

  return {
    hash,
    status,
    activity: {
      id: hash,
      voter,
      optionId,
      optionLabel: optionLabel(options, optionId),
      txHash: hash,
      status,
      timestamp: new Date().toISOString(),
    },
  };
}

export async function fetchVoteEvents(fromLedger: number, options: PollOption[]): Promise<VoteActivity[]> {
  if (!CONTRACT_ID || fromLedger < 1) {
    return [];
  }

  let response: Awaited<ReturnType<ReturnType<typeof getRpcServer>["getEvents"]>>;
  try {
    response = await getRpcServer().getEvents({
      startLedger: fromLedger,
      filters: [
        {
          type: "contract",
          contractIds: [CONTRACT_ID],
          topics: [[nativeToScVal("vote").toXDR("base64")]],
        },
      ],
      limit: 20,
    });
  } catch (error) {
    if (isLedgerRangeError(error)) {
      return [];
    }

    throw error;
  }

  return response.events.map((event) => {
    const value = scValToNative(event.value);
    const voter = String(value?.voter ?? value?.[0] ?? "unknown");
    const optionId = Number(value?.option_id ?? value?.optionId ?? value?.[1] ?? 0);

    return {
      id: event.id,
      voter,
      optionId,
      optionLabel: optionLabel(options, optionId),
      txHash: event.txHash,
      status: "success",
      timestamp: new Date(Number(event.ledgerClosedAt) * 1000).toISOString(),
    };
  });
}
