import { describe, expect, it } from "vitest";

import {
  initialTransactionState,
  recordFailedTransaction,
  recordSuccessfulTransaction,
  resetTransactionState,
  startTransaction,
  transactionActivityFallback,
  transactionStatusAfterRefresh,
} from "./transaction-state";

const hash = "0293b6348186a3d12b975402977673a6861b30a03cce8edac62f3c2a0d363223";

describe("transaction state", () => {
  it("keeps the successful vote hash in last transaction state", () => {
    const state = recordSuccessfulTransaction(initialTransactionState, {
      hash,
      optionIndex: 1,
      optionLabel: "Payments",
      submittedAt: "2026-06-29T10:00:00.000Z",
    });

    expect(state.status).toBe("success");
    expect(state.lastTransaction?.hash).toBe(hash);
    expect(state.lastTransaction?.optionLabel).toBe("Payments");
    expect(state.lastTransaction?.explorerUrl).toBe(
      `https://stellar.expert/explorer/testnet/tx/${hash}`,
    );
  });

  it("does not clear the last successful transaction after contract refresh", () => {
    const success = recordSuccessfulTransaction(initialTransactionState, {
      hash,
      optionIndex: 1,
      optionLabel: "Payments",
      submittedAt: "2026-06-29T10:00:00.000Z",
    });

    expect(transactionStatusAfterRefresh(success)).toEqual(success);
  });

  it("clears transaction state on disconnect", () => {
    const success = recordSuccessfulTransaction(initialTransactionState, {
      hash,
      optionIndex: 1,
      optionLabel: "Payments",
      submittedAt: "2026-06-29T10:00:00.000Z",
    });

    expect(resetTransactionState(success)).toEqual(initialTransactionState);
  });

  it("keeps previous successful activity visible after a later error", () => {
    const success = recordSuccessfulTransaction(initialTransactionState, {
      hash,
      optionIndex: 1,
      optionLabel: "Payments",
      submittedAt: "2026-06-29T10:00:00.000Z",
    });
    const failed = recordFailedTransaction(success, "Request rejected by user.");

    expect(failed.status).toBe("failed");
    expect(failed.error).toBe("Request rejected by user.");
    expect(transactionActivityFallback(failed)?.hash).toBe(hash);
  });

  it("marks a new transaction as awaiting wallet without clearing previous success", () => {
    const success = recordSuccessfulTransaction(initialTransactionState, {
      hash,
      optionIndex: 1,
      optionLabel: "Payments",
      submittedAt: "2026-06-29T10:00:00.000Z",
    });

    const next = startTransaction(success, "awaiting_signature");

    expect(next.status).toBe("awaiting_signature");
    expect(next.lastTransaction?.hash).toBe(hash);
  });
});
