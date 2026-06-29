import { nativeToScVal } from "@stellar/stellar-sdk";

import {
  addressArg,
  assertLiveContracts,
  simulateContractCall,
  submitContractTransaction,
  type ContractTransactionResult,
} from "./contract-client";
import { getContractConfig } from "./env";

export type ProposalStatus = "open" | "closed" | "ended";

export type ProposalOption = {
  id: number;
  label: string;
  votes: number;
};

export type ProposalState = {
  configured: boolean;
  id: number;
  title: string;
  description: string;
  options: ProposalOption[];
  totalVotes: number;
  hasVoted: boolean;
  open: boolean;
  status?: ProposalStatus;
  deadline?: string;
  isPreview?: boolean;
  latestLedger?: number;
};

export type Proposal = ProposalState;

export type ProposalSummary = {
  id: number;
  title: string;
  status: ProposalStatus;
  totalVotes: number;
  deadline: string;
};

export type ProposalResult = {
  proposalId: number;
  options: ProposalOption[];
  totalVotes: number;
};

type ContractProposal = {
  id?: number | bigint;
  title?: string;
  description?: string;
  options?: string[];
  deadline?: number | bigint;
  is_closed?: boolean;
  isClosed?: boolean;
  total_votes?: number | bigint;
  totalVotes?: number | bigint;
};

type ContractProposalSummary = {
  id?: number | bigint;
  title?: string;
  deadline?: number | bigint;
  is_closed?: boolean;
  isClosed?: boolean;
  total_votes?: number | bigint;
  totalVotes?: number | bigint;
};

export type VoteOnProposalParams = {
  walletAddress: string;
  proposalId: number;
  optionIndex: number;
};

export type VoteOnProposalResult = ContractTransactionResult;

function asNumber(value: number | bigint | undefined): number {
  if (typeof value === "bigint") {
    return Number(value);
  }

  return value ?? 0;
}

function formatDeadline(deadline: number): string {
  if (deadline <= 0) {
    return "Not loaded";
  }

  return new Date(deadline * 1000).toISOString();
}

function statusFromContract(isClosed: boolean, deadline: number, now = Date.now()): ProposalStatus {
  if (isClosed) {
    return "closed";
  }

  if (deadline > 0 && deadline * 1000 <= now) {
    return "ended";
  }

  return "open";
}

function normalizeSummary(summary: ContractProposalSummary): ProposalSummary {
  const deadline = asNumber(summary.deadline);
  const isClosed = Boolean(summary.is_closed ?? summary.isClosed);

  return {
    id: asNumber(summary.id),
    title: String(summary.title ?? "Untitled proposal"),
    status: statusFromContract(isClosed, deadline),
    totalVotes: asNumber(summary.total_votes ?? summary.totalVotes),
    deadline: formatDeadline(deadline),
  };
}

function normalizeProposal(
  proposal: ContractProposal,
  results: number[],
  hasWalletVoted = false,
): ProposalState {
  const deadline = asNumber(proposal.deadline);
  const isClosed = Boolean(proposal.is_closed ?? proposal.isClosed);
  const options = (proposal.options ?? []).map((label, index) => ({
    id: index,
    label,
    votes: Number(results[index] ?? 0),
  }));
  const totalVotes =
    asNumber(proposal.total_votes ?? proposal.totalVotes) ||
    options.reduce((sum, option) => sum + option.votes, 0);
  const status = statusFromContract(isClosed, deadline);

  return {
    configured: true,
    id: asNumber(proposal.id),
    title: String(proposal.title ?? "Untitled proposal"),
    description: String(proposal.description ?? ""),
    options,
    totalVotes,
    hasVoted: hasWalletVoted,
    open: status === "open",
    status,
    deadline: formatDeadline(deadline),
  };
}

export function proposalStatus(proposal: ProposalState, now = new Date()): ProposalStatus {
  if (!proposal.open) {
    return "closed";
  }

  if (proposal.deadline && new Date(proposal.deadline).getTime() <= now.getTime()) {
    return "ended";
  }

  return "open";
}

export function leadingOption(proposal: ProposalState): ProposalOption | undefined {
  return proposal.options.reduce<ProposalOption | undefined>((leader, option) => {
    if (!leader || option.votes > leader.votes) {
      return option;
    }

    return leader;
  }, undefined);
}

export function governancePreviewProposals(): ProposalState[] {
  return [
    {
      configured: false,
      id: 1,
      title: "Design preview: Public goods funding round",
      description:
        "Local preview data showing how a governance proposal will look after contracts are deployed.",
      options: [
        { id: 0, label: "Approve", votes: 0 },
        { id: 1, label: "Reject", votes: 0 },
        { id: 2, label: "Abstain", votes: 0 },
      ],
      totalVotes: 0,
      hasVoted: false,
      open: true,
      status: "open",
      deadline: "TODO after deployment",
      isPreview: true,
    },
  ];
}

export async function listProposals(start: number, limit: number): Promise<ProposalSummary[]> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const summaries = await simulateContractCall<ContractProposalSummary[]>(
    config.governanceContractId,
    "list_proposals",
    [
      nativeToScVal(start, { type: "u32" }),
      nativeToScVal(limit, { type: "u32" }),
    ],
  );

  return summaries.map(normalizeSummary);
}

export async function getResults(proposalId: number): Promise<ProposalResult> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const results = await simulateContractCall<Array<number | bigint>>(
    config.governanceContractId,
    "get_results",
    [nativeToScVal(proposalId, { type: "u32" })],
  );
  const options = results.map((votes, index) => ({
    id: index,
    label: `Option ${index + 1}`,
    votes: asNumber(votes),
  }));

  return {
    proposalId,
    options,
    totalVotes: options.reduce((sum, option) => sum + option.votes, 0),
  };
}

export async function getProposal(proposalId: number): Promise<ProposalState> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const [proposal, results] = await Promise.all([
    simulateContractCall<ContractProposal>(config.governanceContractId, "get_proposal", [
      nativeToScVal(proposalId, { type: "u32" }),
    ]),
    simulateContractCall<Array<number | bigint>>(config.governanceContractId, "get_results", [
      nativeToScVal(proposalId, { type: "u32" }),
    ]),
  ]);

  return normalizeProposal(proposal, results.map(asNumber));
}

export async function hasVoted(proposalId: number, walletAddress: string): Promise<boolean> {
  const config = getContractConfig();
  assertLiveContracts(config);

  return simulateContractCall<boolean>(config.governanceContractId, "has_voted", [
    nativeToScVal(proposalId, { type: "u32" }),
    addressArg(walletAddress),
  ]);
}

export async function getReputationContract(): Promise<string> {
  const config = getContractConfig();
  assertLiveContracts(config);
  const address = await simulateContractCall<unknown>(
    config.governanceContractId,
    "get_reputation_contract",
  );

  return String(address);
}

export async function loadGovernanceProposals(walletAddress?: string): Promise<ProposalState[]> {
  const summaries = await listProposals(0, 20);

  return Promise.all(
    summaries.map(async (summary) => {
      const proposal = await getProposal(summary.id);
      const voted = walletAddress ? await hasVoted(summary.id, walletAddress) : false;
      return {
        ...proposal,
        hasVoted: voted,
      };
    }),
  );
}

export async function voteOnProposal({
  walletAddress,
  proposalId,
  optionIndex,
}: VoteOnProposalParams): Promise<VoteOnProposalResult> {
  const config = getContractConfig();
  assertLiveContracts(config);

  return submitContractTransaction({
    contractId: config.governanceContractId,
    walletAddress,
    method: "vote",
    args: [
      addressArg(walletAddress),
      nativeToScVal(proposalId, { type: "u32" }),
      nativeToScVal(optionIndex, { type: "u32" }),
    ],
  });
}
