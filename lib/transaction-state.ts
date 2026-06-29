import { buildExplorerUrl, type TransactionStatus } from "./format";

export type LastTransaction = {
  hash: string;
  optionLabel: string;
  optionIndex: number;
  explorerUrl: string;
  submittedAt: string;
};

export type VoteTransactionState = {
  status: TransactionStatus;
  lastTransaction?: LastTransaction;
  error?: string;
};

export const initialTransactionState: VoteTransactionState = {
  status: "idle",
};

export function startTransaction(
  state: VoteTransactionState,
  status: Extract<TransactionStatus, "preparing" | "awaiting_signature" | "pending">,
): VoteTransactionState {
  return {
    ...state,
    status,
    error: undefined,
  };
}

export function recordSuccessfulTransaction(
  state: VoteTransactionState,
  transaction: Omit<LastTransaction, "explorerUrl">,
): VoteTransactionState {
  return {
    ...state,
    status: "success",
    error: undefined,
    lastTransaction: {
      ...transaction,
      explorerUrl: buildExplorerUrl(transaction.hash),
    },
  };
}

export function recordFailedTransaction(
  state: VoteTransactionState,
  error: string,
): VoteTransactionState {
  return {
    ...state,
    status: "failed",
    error,
  };
}

export function resetTransactionState(): VoteTransactionState {
  return initialTransactionState;
}

export function transactionStatusAfterRefresh(state: VoteTransactionState): VoteTransactionState {
  return state;
}

export function transactionActivityFallback(state: VoteTransactionState): LastTransaction | undefined {
  return state.lastTransaction;
}
