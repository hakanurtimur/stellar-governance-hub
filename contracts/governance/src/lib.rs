#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, vec, Address, Env, IntoVal,
    String, Symbol, Vec,
};

#[contract]
pub struct GovernanceContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Initialized,
    Admin,
    ReputationContract,
    ProposalCounter,
    Proposal(u32),
    Results(u32),
    ProposalIds,
    Voted(u32, Address),
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

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteCastEvent {
    pub proposal_id: u32,
    pub voter: Address,
    pub option_index: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalClosedEvent {
    pub proposal_id: u32,
    pub closed_by: Address,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum GovernanceError {
    ProposalNotFound = 1,
    NoOptions = 2,
    AlreadyInitialized = 3,
    NotInitialized = 4,
    InvalidOption = 5,
    AlreadyVoted = 6,
    ProposalClosed = 7,
    Unauthorized = 8,
}

#[contractimpl]
impl GovernanceContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        reputation_contract: Address,
    ) -> Result<(), GovernanceError> {
        admin.require_auth();

        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(GovernanceError::AlreadyInitialized);
        }

        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::ReputationContract, &reputation_contract);
        env.storage().persistent().set(&DataKey::Initialized, &true);

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

    pub fn vote(
        env: Env,
        voter: Address,
        proposal_id: u32,
        option_index: u32,
    ) -> Result<(), GovernanceError> {
        voter.require_auth();

        let mut proposal = Self::get_proposal(env.clone(), proposal_id)?;
        if !proposal.open {
            return Err(GovernanceError::ProposalClosed);
        }

        let voted_key = DataKey::Voted(proposal_id, voter.clone());
        if env.storage().persistent().has(&voted_key) {
            return Err(GovernanceError::AlreadyVoted);
        }

        let mut results = Self::get_results(env.clone(), proposal_id)?;
        if option_index >= results.len() {
            return Err(GovernanceError::InvalidOption);
        }

        let current = results
            .get(option_index)
            .ok_or(GovernanceError::InvalidOption)?;
        results.set(option_index, current + 1);
        proposal.open = true;

        env.storage()
            .persistent()
            .set(&DataKey::Results(proposal_id), &results);
        env.storage().persistent().set(&voted_key, &true);
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);

        let reputation_contract: Address = env
            .storage()
            .persistent()
            .get(&DataKey::ReputationContract)
            .ok_or(GovernanceError::NotInitialized)?;
        let _: u32 = env.invoke_contract(
            &reputation_contract,
            &Symbol::new(&env, "award_point"),
            vec![
                &env,
                env.current_contract_address().into_val(&env),
                voter.clone().into_val(&env)
            ],
        );
        env.events().publish(
            (symbol_short!("vote"), voter.clone()),
            VoteCastEvent {
                proposal_id,
                voter,
                option_index,
            },
        );

        Ok(())
    }

    pub fn has_voted(env: Env, proposal_id: u32, voter: Address) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Voted(proposal_id, voter))
    }

    pub fn close_proposal(
        env: Env,
        caller: Address,
        proposal_id: u32,
    ) -> Result<(), GovernanceError> {
        caller.require_auth();

        let mut proposal = Self::get_proposal(env.clone(), proposal_id)?;
        let admin: Option<Address> = env.storage().persistent().get(&DataKey::Admin);
        if proposal.creator != caller && admin.as_ref() != Some(&caller) {
            return Err(GovernanceError::Unauthorized);
        }

        proposal.open = false;
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        env.events().publish(
            (symbol_short!("closed"), proposal_id),
            ProposalClosedEvent {
                proposal_id,
                closed_by: caller,
            },
        );

        Ok(())
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
    use stellar_reputation_contract::{ReputationContract, ReputationContractClient};

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

    #[test]
    fn vote_records_choice_and_awards_reputation_point() {
        let env = Env::default();
        env.mock_all_auths();
        let governance_id = env.register(GovernanceContract, ());
        let reputation_id = env.register(ReputationContract, ());
        let governance = GovernanceContractClient::new(&env, &governance_id);
        let reputation = ReputationContractClient::new(&env, &reputation_id);
        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let voter = Address::generate(&env);

        reputation.initialize(&admin, &governance_id);
        governance.initialize(&admin, &reputation_id);
        let proposal_id = governance.create_proposal(
            &creator,
            &String::from_str(&env, "Approve protocol grant?"),
            &String::from_str(&env, "Fund advanced Stellar governance tooling."),
            &vec![
                &env,
                String::from_str(&env, "Approve"),
                String::from_str(&env, "Reject"),
            ],
            &1_000_u64,
        );

        governance.vote(&voter, &proposal_id, &0_u32);

        assert_eq!(governance.get_results(&proposal_id), vec![&env, 1_u32, 0_u32]);
        assert!(governance.has_voted(&proposal_id, &voter));
        assert_eq!(reputation.get_points(&voter), 1);
    }

    #[test]
    fn duplicate_vote_is_rejected_without_extra_reputation() {
        let env = Env::default();
        env.mock_all_auths();
        let governance_id = env.register(GovernanceContract, ());
        let reputation_id = env.register(ReputationContract, ());
        let governance = GovernanceContractClient::new(&env, &governance_id);
        let reputation = ReputationContractClient::new(&env, &reputation_id);
        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let voter = Address::generate(&env);

        reputation.initialize(&admin, &governance_id);
        governance.initialize(&admin, &reputation_id);
        let proposal_id = governance.create_proposal(
            &creator,
            &String::from_str(&env, "Ship governance hub?"),
            &String::from_str(&env, "Promote the advanced governance dApp."),
            &vec![
                &env,
                String::from_str(&env, "Approve"),
                String::from_str(&env, "Reject"),
            ],
            &1_000_u64,
        );

        governance.vote(&voter, &proposal_id, &0_u32);

        assert_eq!(
            governance.try_vote(&voter, &proposal_id, &1_u32),
            Err(Ok(GovernanceError::AlreadyVoted))
        );
        assert_eq!(governance.get_results(&proposal_id), vec![&env, 1_u32, 0_u32]);
        assert_eq!(reputation.get_points(&voter), 1);
    }

    #[test]
    fn close_proposal_blocks_later_votes() {
        let env = Env::default();
        env.mock_all_auths();
        let governance_id = env.register(GovernanceContract, ());
        let governance = GovernanceContractClient::new(&env, &governance_id);
        let admin = Address::generate(&env);
        let creator = Address::generate(&env);
        let voter = Address::generate(&env);
        let reputation_id = Address::generate(&env);

        governance.initialize(&admin, &reputation_id);
        let proposal_id = governance.create_proposal(
            &creator,
            &String::from_str(&env, "Close after review?"),
            &String::from_str(&env, "Stop accepting votes after governance review."),
            &vec![
                &env,
                String::from_str(&env, "Yes"),
                String::from_str(&env, "No"),
            ],
            &1_000_u64,
        );

        governance.close_proposal(&creator, &proposal_id);

        assert_eq!(governance.get_proposal(&proposal_id).open, false);
        assert_eq!(
            governance.try_vote(&voter, &proposal_id, &0_u32),
            Err(Ok(GovernanceError::ProposalClosed))
        );
    }
}
