"use client";

import { AlertTriangle, RefreshCcw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { createLocalVoteActivity } from "../lib/activity";
import { submitVote } from "../lib/contract";
import { getContractConfig } from "../lib/env";
import { formatErrorMessage } from "../lib/format";
import { governancePreviewProposals, type ProposalState } from "../lib/governance";
import {
  initialTransactionState,
  recordFailedTransaction,
  recordSuccessfulTransaction,
  resetTransactionState,
  startTransaction,
  type LastTransaction,
} from "../lib/transaction-state";
import {
  assertWalletTestnet,
  connectWallet,
  disconnectWallet,
  signTransactionXdr,
  switchWallet,
} from "../lib/wallet";
import { ActivityFeed } from "./ActivityFeed";
import { ContractInfoCard } from "./ContractInfoCard";
import { ProposalDetail } from "./ProposalDetail";
import { ProposalList } from "./ProposalList";
import { ReputationCard } from "./ReputationCard";
import { TransactionStatusCard } from "./TransactionStatusCard";
import { VotePanel } from "./VotePanel";
import { WalletPanel } from "./WalletPanel";

export function GovernanceDashboard() {
  const config = getContractConfig();
  const [publicKey, setPublicKey] = useState<string>();
  const [proposals] = useState<ProposalState[]>(() => governancePreviewProposals());
  const [selectedProposalId, setSelectedProposalId] = useState<number>(proposals[0]?.id ?? 0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [transactionState, setTransactionState] = useState(initialTransactionState);
  const [activities, setActivities] = useState<ReturnType<typeof createLocalVoteActivity>[]>([]);
  const [error, setError] = useState<string>();
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>();
  const [localReputationPoints, setLocalReputationPoints] = useState(0);

  const selectedProposal = useMemo(
    () => proposals.find((proposal) => proposal.id === selectedProposalId),
    [proposals, selectedProposalId],
  );

  const selectedOptionLabel = selectedProposal?.options.find((option) => option.id === selectedOption)?.label;
  const lastTransaction = transactionState.lastTransaction as
    | (LastTransaction & { proposalTitle?: string })
    | undefined;

  const resetWalletSessionUi = useCallback(() => {
    setPublicKey(undefined);
    setSelectedOption(null);
    setTransactionState(resetTransactionState());
    setError(undefined);
  }, []);

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

  function handleSelectProposal(proposalId: number) {
    setSelectedProposalId(proposalId);
    setSelectedOption(null);
  }

  function refreshLocalState() {
    setSyncing(true);
    window.setTimeout(() => {
      setLastSyncedAt(new Date());
      setSyncing(false);
    }, 350);
  }

  async function handleVote() {
    if (!publicKey || !selectedProposal || selectedOption === null) {
      return;
    }

    if (!config.allConfigured) {
      setError("Missing contract env. Configure Governance and Reputation contract IDs before voting.");
      return;
    }

    if (selectedProposal.isPreview) {
      setError("Select a live proposal before submitting a Testnet vote.");
      return;
    }

    const optionLabel = selectedOptionLabel ?? `Option ${selectedOption}`;

    try {
      setError(undefined);
      setTransactionState((current) => startTransaction(current, "preparing"));
      await assertWalletTestnet();
      setTransactionState((current) => startTransaction(current, "awaiting_signature"));
      const result = await submitVote(
        publicKey,
        selectedProposal.id,
        selectedOption,
        (xdr) => signTransactionXdr(publicKey, xdr),
        selectedProposal.options,
      );
      setTransactionState((current) => startTransaction(current, "pending"));

      if (result.status === "success") {
        setTransactionState((current) =>
          recordSuccessfulTransaction(current, {
            hash: result.hash,
            optionIndex: selectedOption,
            optionLabel,
            proposalTitle: selectedProposal.title,
            submittedAt: new Date().toISOString(),
          }),
        );
        setLocalReputationPoints((points) => points + 1);
        setActivities((current) => [
          createLocalVoteActivity({
            hash: result.hash,
            proposalTitle: selectedProposal.title,
            optionLabel,
            submittedAt: new Date().toISOString(),
          }),
          ...current,
        ]);
      } else {
        setTransactionState((current) =>
          recordFailedTransaction(current, "Vote transaction was not confirmed on Stellar Testnet."),
        );
      }
    } catch (nextError) {
      const message = formatErrorMessage(nextError);
      setTransactionState((current) => recordFailedTransaction(current, message));
      setError(message);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
                Stellar Governance Hub
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Proposal voting with on-chain reputation rewards
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {["Stellar Testnet", "Governance Contract", "Reputation Contract", "Inter-contract Rewards"].map(
                (badge) => (
                  <span
                    className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700"
                    key={badge}
                  >
                    {badge}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          {error ? (
            <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error}</p>
            </div>
          ) : null}

          <div className="grid gap-5 lg:grid-cols-2">
            <ContractInfoCard
              contractId={config.governanceContractId}
              description="Creates proposals, records votes, emits governance events, and calls the Reputation contract after successful voting."
              title="Governance Contract"
            />
            <ContractInfoCard
              contractId={config.reputationContractId}
              description="Tracks participation points per wallet and emits reputation award events after authorized governance votes."
              title="Reputation Contract"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
            <ProposalList
              contractsConfigured={config.allConfigured}
              onSelect={handleSelectProposal}
              proposals={proposals}
              selectedProposalId={selectedProposalId}
            />
            <ProposalDetail
              onSelectOption={setSelectedOption}
              proposal={selectedProposal}
              selectedOption={selectedOption}
              walletConnected={Boolean(publicKey)}
            />
          </div>
        </div>

        <aside className="space-y-5">
          <WalletPanel
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            onSwitchWallet={handleSwitchWallet}
            publicKey={publicKey}
          />
          <VotePanel
            contractsConfigured={config.allConfigured}
            onVote={handleVote}
            proposal={selectedProposal}
            selectedOption={selectedOption}
            transactionError={transactionState.error ?? error}
            transactionStatus={transactionState.status}
            walletConnected={Boolean(publicKey)}
          />
          <ReputationCard
            points={localReputationPoints}
            publicKey={publicKey}
            reputationConfigured={config.reputationConfigured}
          />
          <button
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            onClick={refreshLocalState}
            type="button"
          >
            <RefreshCcw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Refreshing state..." : "Refresh dashboard state"}
          </button>
          {lastSyncedAt ? (
            <p className="-mt-3 text-center text-xs text-slate-500">
              Last refreshed {lastSyncedAt.toLocaleTimeString()}
            </p>
          ) : null}
          <TransactionStatusCard
            error={transactionState.error}
            lastTransaction={lastTransaction}
            status={transactionState.status}
          />
          <ActivityFeed activities={activities} syncing={syncing} />
        </aside>
      </div>
    </main>
  );
}
