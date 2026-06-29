"use client";

import { AlertTriangle, RadioTower, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityFeed } from "@/components/ActivityFeed";
import { ContractCard } from "@/components/ContractCard";
import { PollCard } from "@/components/PollCard";
import { TransactionStatus } from "@/components/TransactionStatus";
import { WalletConnect } from "@/components/WalletConnect";
import { WalletPanel } from "@/components/WalletPanel";
import {
  fetchPollState,
  fetchVoteEvents,
  submitVote,
  type PollState,
  type VoteActivity,
} from "@/lib/contract";
import { formatErrorMessage } from "@/lib/format";
import {
  initialTransactionState,
  recordFailedTransaction,
  recordSuccessfulTransaction,
  resetTransactionState,
  startTransaction,
} from "@/lib/transaction-state";
import {
  assertWalletTestnet,
  connectWallet,
  disconnectWallet,
  onWalletDisconnect,
  signTransactionXdr,
  switchWallet,
} from "@/lib/wallet";

export default function Home() {
  const [publicKey, setPublicKey] = useState<string>();
  const [poll, setPoll] = useState<PollState>();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [error, setError] = useState<string>();
  const [transactionState, setTransactionState] = useState(initialTransactionState);
  const [activities, setActivities] = useState<VoteActivity[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>();

  const canSyncEvents = Boolean(poll?.configured && poll.latestLedger);

  const resetWalletSessionUi = useCallback(() => {
    setPublicKey(undefined);
    setSelectedOption(null);
    setTransactionState(resetTransactionState());
    setError(undefined);
  }, []);

  const refreshPoll = useCallback(async () => {
    setSyncing(true);
    try {
      const nextPoll = await fetchPollState(publicKey);
      setPoll(nextPoll);
      setError(undefined);
      setLastSyncedAt(new Date());
    } catch (nextError) {
      setError(formatErrorMessage(nextError));
    } finally {
      setSyncing(false);
    }
  }, [publicKey]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshPoll();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshPoll]);

  useEffect(() => {
    const unsubscribe = onWalletDisconnect(() => {
      resetWalletSessionUi();
    });
    return unsubscribe;
  }, [resetWalletSessionUi]);

  useEffect(() => {
    const currentPoll = poll;
    if (!canSyncEvents || !currentPoll?.latestLedger) {
      return;
    }

    let active = true;
    const startLedger = currentPoll.latestLedger;
    const timer = window.setInterval(async () => {
      try {
        setSyncing(true);
        const [freshPoll, events] = await Promise.all([
          fetchPollState(publicKey),
          fetchVoteEvents(startLedger, currentPoll.options),
        ]);

        if (active) {
          setPoll(freshPoll);
          setLastSyncedAt(new Date());
          setActivities((current) => {
            const combined = [...events, ...current];
            const unique = new Map(combined.map((item) => [item.id, item]));
            return Array.from(unique.values()).slice(0, 8);
          });
        }
      } catch (nextError) {
        if (active) {
          setError(formatErrorMessage(nextError));
        }
      } finally {
        if (active) {
          setSyncing(false);
        }
      }
    }, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [canSyncEvents, poll, publicKey]);

  const headerState = useMemo(() => {
    if (!poll?.configured) {
      return "Contract not configured";
    }

    return syncing ? "Listening for contract events" : "Polling contract state";
  }, [poll?.configured, syncing]);

  async function handleConnect() {
    try {
      setError(undefined);
      const address = await connectWallet();
      await assertWalletTestnet();
      setPublicKey(address);
    } catch (nextError) {
      setError(formatErrorMessage(nextError));
    }
  }

  async function handleDisconnect() {
    await disconnectWallet();
    resetWalletSessionUi();
  }

  async function handleSwitchWallet() {
    try {
      setError(undefined);
      resetWalletSessionUi();
      const address = await switchWallet();
      await assertWalletTestnet();
      setPublicKey(address);
    } catch (nextError) {
      setError(formatErrorMessage(nextError));
    }
  }

  async function handleVote() {
    if (!publicKey || selectedOption === null || !poll) {
      return;
    }

    const optionLabel =
      poll.options.find((option) => option.id === selectedOption)?.label ?? `Option ${selectedOption}`;

    try {
      setError(undefined);
      setTransactionState((current) => startTransaction(current, "preparing"));
      await assertWalletTestnet();
      setTransactionState((current) => startTransaction(current, "awaiting_signature"));
      const result = await submitVote(
        publicKey,
        selectedOption,
        (xdr) => signTransactionXdr(publicKey, xdr),
        poll.options,
      );
      setTransactionState((current) => startTransaction(current, "pending"));
      if (result.status === "success") {
        setTransactionState((current) =>
          recordSuccessfulTransaction(current, {
            hash: result.hash,
            optionIndex: selectedOption,
            optionLabel,
            submittedAt: new Date().toISOString(),
          }),
        );
      } else {
        setTransactionState((current) =>
          recordFailedTransaction(current, "Vote transaction was not confirmed on Stellar Testnet."),
        );
      }
      setActivities((current) => [result.activity, ...current].slice(0, 8));
      await refreshPoll();
    } catch (nextError) {
      const nextMessage = formatErrorMessage(nextError);
      setTransactionState((current) => recordFailedTransaction(current, nextMessage));
      setError(nextMessage);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold">Stellar Live Poll</h1>
              <span className="rounded-md bg-cyan-50 px-2.5 py-1 text-xs font-semibold text-cyan-700">
                Testnet
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                <RadioTower className={`h-3.5 w-3.5 ${syncing ? "animate-pulse" : ""}`} />
                {headerState}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Multi-wallet Soroban poll with contract reads, writes, transaction tracking, and synced activity.
            </p>
          </div>
          <WalletConnect
            publicKey={publicKey}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSwitchWallet={handleSwitchWallet}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-5 px-5 py-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          {error ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          {transactionState.status === "success" ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900">
              Your vote was recorded on Stellar Testnet.
            </div>
          ) : null}

          {poll ? (
            <PollCard
              poll={poll}
              selectedOption={selectedOption}
              walletConnected={Boolean(publicKey)}
              voting={
                transactionState.status === "preparing" ||
                transactionState.status === "awaiting_signature" ||
                transactionState.status === "pending"
              }
              onSelect={setSelectedOption}
              onVote={handleVote}
            />
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              Loading poll state from Stellar RPC...
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <WalletPanel
            publicKey={publicKey}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSwitchWallet={handleSwitchWallet}
          />
          <ContractCard />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={refreshPoll}
            type="button"
          >
            <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Refreshing contract state..." : "Refresh contract state"}
          </button>
          {lastSyncedAt ? (
            <p className="-mt-3 text-center text-xs text-slate-500">
              Last synced {lastSyncedAt.toLocaleTimeString()}
            </p>
          ) : null}
          <TransactionStatus
            status={transactionState.status}
            lastTransaction={transactionState.lastTransaction}
            error={transactionState.error ?? error}
          />
          <ActivityFeed
            activities={activities}
            lastTransaction={transactionState.lastTransaction}
            syncing={syncing}
          />
        </aside>
      </div>

      <footer className="border-t border-slate-200 bg-white px-5 py-4 text-center text-sm text-slate-500">
        Built for Stellar Level 2 · Soroban Testnet · Smart Contract Poll
      </footer>
    </main>
  );
}
