#![no_std]

mod errors;
mod events;
mod storage;
mod types;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, vec, Address, Env, IntoVal, String, Symbol, Vec};

use crate::errors::GovernanceError;
use crate::events::{
    publish_governance_initialized, publish_proposal_closed, publish_proposal_created,
    publish_vote_cast, publish_vote_rewarded,
};
use crate::storage::{
    get_admin, get_proposal, get_proposal_ids, get_reputation_contract, get_results, has_initialized,
    has_voted, next_proposal_id, set_admin, set_has_voted, set_initialized, set_proposal,
    set_proposal_ids, set_reputation_contract, set_results,
};
use crate::types::{Proposal, ProposalSummary};

const MIN_OPTIONS: u32 = 2;
const MAX_OPTIONS: u32 = 5;

#[contract]
pub struct GovernanceContract;

#[contractimpl]
impl GovernanceContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        reputation_contract: Address,
    ) -> Result<(), GovernanceError> {
        admin.require_auth();

        if has_initialized(&env) {
            return Err(GovernanceError::AlreadyInitialized);
        }

        set_admin(&env, &admin);
        set_reputation_contract(&env, &reputation_contract);
        set_initialized(&env);
        publish_governance_initialized(&env, admin, reputation_contract);

        Ok(())
    }

    pub fn create_proposal(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        options: Vec<String>,
        deadline: u64,
    ) -> Result<u32, GovernanceError> {
        creator.require_auth();
        Self::ensure_initialized(&env)?;

        if title.is_empty() {
            return Err(GovernanceError::InvalidTitle);
        }

        if options.len() < MIN_OPTIONS || options.len() > MAX_OPTIONS {
            return Err(GovernanceError::InvalidOptions);
        }

        let created_at = env.ledger().timestamp();
        if deadline <= created_at {
            return Err(GovernanceError::InvalidDeadline);
        }

        let proposal_id = next_proposal_id(&env);
        let proposal = Proposal {
            id: proposal_id,
            creator: creator.clone(),
            title,
            description,
            options: options.clone(),
            created_at,
            deadline,
            is_closed: false,
            total_votes: 0,
        };
        let mut results = Vec::new(&env);
        for _ in 0..options.len() {
            results.push_back(0_u32);
        }
        let mut proposal_ids = get_proposal_ids(&env);
        proposal_ids.push_back(proposal_id);

        set_proposal(&env, proposal_id, &proposal);
        set_results(&env, proposal_id, &results);
        set_proposal_ids(&env, &proposal_ids);
        publish_proposal_created(&env, proposal_id, creator);

        Ok(proposal_id)
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> Result<Proposal, GovernanceError> {
        get_proposal(&env, proposal_id).ok_or(GovernanceError::ProposalNotFound)
    }

    pub fn list_proposals(env: Env, start: u32, limit: u32) -> Vec<ProposalSummary> {
        let proposal_ids = get_proposal_ids(&env);
        let mut summaries = Vec::new(&env);
        let end = start.saturating_add(limit).min(proposal_ids.len());

        for index in start..end {
            if let Some(proposal_id) = proposal_ids.get(index) {
                if let Some(proposal) = get_proposal(&env, proposal_id) {
                    summaries.push_back(ProposalSummary {
                        id: proposal.id,
                        title: proposal.title,
                        is_closed: proposal.is_closed,
                        total_votes: proposal.total_votes,
                        deadline: proposal.deadline,
                    });
                }
            }
        }

        summaries
    }

    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: u32,
        option_index: u32,
    ) -> Result<(), GovernanceError> {
        voter.require_auth();
        Self::ensure_initialized(&env)?;

        let mut proposal =
            get_proposal(&env, proposal_id).ok_or(GovernanceError::ProposalNotFound)?;
        if proposal.is_closed {
            return Err(GovernanceError::ProposalClosed);
        }
        if env.ledger().timestamp() > proposal.deadline {
            return Err(GovernanceError::VotingDeadlinePassed);
        }
        if has_voted(&env, proposal_id, &voter) {
            return Err(GovernanceError::AlreadyVoted);
        }

        let mut results = get_results(&env, proposal_id).ok_or(GovernanceError::ProposalNotFound)?;
        if option_index >= results.len() {
            return Err(GovernanceError::InvalidOption);
        }

        let current = results
            .get(option_index)
            .ok_or(GovernanceError::InvalidOption)?;
        results.set(option_index, current + 1);
        proposal.total_votes += 1;

        set_results(&env, proposal_id, &results);
        set_proposal(&env, proposal_id, &proposal);
        set_has_voted(&env, proposal_id, &voter);
        publish_vote_cast(&env, proposal_id, voter.clone(), option_index, proposal.total_votes);

        let reputation_contract =
            get_reputation_contract(&env).ok_or(GovernanceError::NotInitialized)?;
        let _: u32 = env.invoke_contract(
            &reputation_contract,
            &Symbol::new(&env, "award_point"),
            vec![
                &env,
                env.current_contract_address().into_val(&env),
                voter.clone().into_val(&env),
            ],
        );
        publish_vote_rewarded(&env, proposal_id, voter, reputation_contract);

        Ok(())
    }

    pub fn get_results(env: Env, proposal_id: u32) -> Result<Vec<u32>, GovernanceError> {
        get_results(&env, proposal_id).ok_or(GovernanceError::ProposalNotFound)
    }

    pub fn has_voted(env: Env, proposal_id: u32, voter: Address) -> bool {
        has_voted(&env, proposal_id, &voter)
    }

    pub fn close_proposal(
        env: Env,
        caller: Address,
        proposal_id: u32,
    ) -> Result<(), GovernanceError> {
        caller.require_auth();
        Self::ensure_initialized(&env)?;

        let mut proposal =
            get_proposal(&env, proposal_id).ok_or(GovernanceError::ProposalNotFound)?;
        if proposal.is_closed {
            return Err(GovernanceError::ProposalClosed);
        }
        let admin = get_admin(&env).ok_or(GovernanceError::NotInitialized)?;
        if caller != admin && caller != proposal.creator {
            return Err(GovernanceError::Unauthorized);
        }

        proposal.is_closed = true;
        set_proposal(&env, proposal_id, &proposal);
        publish_proposal_closed(&env, proposal_id, caller);

        Ok(())
    }

    pub fn get_reputation_contract(env: Env) -> Result<Address, GovernanceError> {
        Self::ensure_initialized(&env)?;
        get_reputation_contract(&env).ok_or(GovernanceError::NotInitialized)
    }

    fn ensure_initialized(env: &Env) -> Result<(), GovernanceError> {
        if has_initialized(env) {
            Ok(())
        } else {
            Err(GovernanceError::NotInitialized)
        }
    }
}
