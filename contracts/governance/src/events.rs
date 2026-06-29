use soroban_sdk::{contracttype, Address, Env, Symbol};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct GovernanceInitializedEvent {
    pub admin: Address,
    pub reputation_contract: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalCreatedEvent {
    pub proposal_id: u32,
    pub creator: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteCastEvent {
    pub proposal_id: u32,
    pub voter: Address,
    pub option_index: u32,
    pub total_votes: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalClosedEvent {
    pub proposal_id: u32,
    pub closed_by: Address,
}

pub fn publish_governance_initialized(env: &Env, admin: Address, reputation_contract: Address) {
    env.events().publish(
        (Symbol::new(env, "governance_initialized"), admin.clone()),
        GovernanceInitializedEvent {
            admin,
            reputation_contract,
        },
    );
}

pub fn publish_proposal_created(env: &Env, proposal_id: u32, creator: Address) {
    env.events().publish(
        (Symbol::new(env, "proposal_created"), proposal_id),
        ProposalCreatedEvent {
            proposal_id,
            creator,
        },
    );
}

pub fn publish_vote_cast(
    env: &Env,
    proposal_id: u32,
    voter: Address,
    option_index: u32,
    total_votes: u32,
) {
    env.events().publish(
        (Symbol::new(env, "vote_cast"), voter.clone()),
        VoteCastEvent {
            proposal_id,
            voter,
            option_index,
            total_votes,
        },
    );
}

pub fn publish_proposal_closed(env: &Env, proposal_id: u32, closed_by: Address) {
    env.events().publish(
        (Symbol::new(env, "proposal_closed"), proposal_id),
        ProposalClosedEvent {
            proposal_id,
            closed_by,
        },
    );
}
