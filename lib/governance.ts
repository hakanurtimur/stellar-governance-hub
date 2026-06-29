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
