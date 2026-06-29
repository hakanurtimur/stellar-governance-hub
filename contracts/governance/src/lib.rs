#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Vec,
};

#[contract]
pub struct GovernanceContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    ProposalCounter,
    Proposal(u32),
    Results(u32),
    ProposalIds,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub options: Vec<String>,
    pub deadline: u64,
    pub open: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalCreatedEvent {
    pub proposal_id: u32,
    pub creator: Address,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum GovernanceError {
    ProposalNotFound = 1,
    NoOptions = 2,
}

#[contractimpl]
impl GovernanceContract {
    pub fn create_proposal(
        env: Env,
        creator: Address,
        title: String,
        description: String,
        options: Vec<String>,
        deadline: u64,
    ) -> Result<u32, GovernanceError> {
        creator.require_auth();

        if options.is_empty() {
            return Err(GovernanceError::NoOptions);
        }

        let proposal_id = env
            .storage()
            .persistent()
            .get::<DataKey, u32>(&DataKey::ProposalCounter)
            .unwrap_or(0)
            + 1;
        let proposal = Proposal {
            id: proposal_id,
            creator: creator.clone(),
            title,
            description,
            options: options.clone(),
            deadline,
            open: true,
        };
        let mut results = Vec::new(&env);
        for _ in 0..options.len() {
            results.push_back(0_u32);
        }
        let mut proposal_ids = Self::proposal_ids(&env);
        proposal_ids.push_back(proposal_id);

        env.storage()
            .persistent()
            .set(&DataKey::ProposalCounter, &proposal_id);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage()
            .persistent()
            .set(&DataKey::Results(proposal_id), &results);
        env.storage()
            .persistent()
            .set(&DataKey::ProposalIds, &proposal_ids);
        env.events().publish(
            (symbol_short!("created"), proposal_id),
            ProposalCreatedEvent {
                proposal_id,
                creator,
            },
        );

        Ok(proposal_id)
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> Result<Proposal, GovernanceError> {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .ok_or(GovernanceError::ProposalNotFound)
    }

    pub fn list_proposals(env: Env, start: u32, limit: u32) -> Vec<Proposal> {
        let proposal_ids = Self::proposal_ids(&env);
        let mut proposals = Vec::new(&env);
        let end = start.saturating_add(limit).min(proposal_ids.len());

        for index in start..end {
            if let Some(proposal_id) = proposal_ids.get(index) {
                if let Some(proposal) = env
                    .storage()
                    .persistent()
                    .get::<DataKey, Proposal>(&DataKey::Proposal(proposal_id))
                {
                    proposals.push_back(proposal);
                }
            }
        }

        proposals
    }

    pub fn get_results(env: Env, proposal_id: u32) -> Result<Vec<u32>, GovernanceError> {
        env.storage()
            .persistent()
            .get(&DataKey::Results(proposal_id))
            .ok_or(GovernanceError::ProposalNotFound)
    }

    fn proposal_ids(env: &Env) -> Vec<u32> {
        env.storage()
            .persistent()
            .get::<DataKey, Vec<u32>>(&DataKey::ProposalIds)
            .unwrap_or_else(|| Vec::new(env))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn creates_and_lists_proposals_with_empty_results() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(GovernanceContract, ());
        let client = GovernanceContractClient::new(&env, &contract_id);
        let creator = Address::generate(&env);

        let proposal_id = client.create_proposal(
            &creator,
            &String::from_str(&env, "Fund public goods round?"),
            &String::from_str(&env, "Allocate treasury funds to developer tooling."),
            &vec![
                &env,
                String::from_str(&env, "Approve"),
                String::from_str(&env, "Reject"),
            ],
            &1_000_u64,
        );

        let proposal = client.get_proposal(&proposal_id);

        assert_eq!(proposal.id, 1);
        assert_eq!(proposal.creator, creator);
        assert_eq!(
            proposal.title,
            String::from_str(&env, "Fund public goods round?")
        );
        assert_eq!(proposal.open, true);
        assert_eq!(client.get_results(&proposal_id), vec![&env, 0_u32, 0_u32]);
        assert_eq!(client.list_proposals(&0_u32, &10_u32).len(), 1);
    }
}
