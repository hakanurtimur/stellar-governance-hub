#![no_std]

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Vec};

#[contract]
pub struct PollContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Question,
    Options,
    Results,
    Voted(Address),
    Initialized,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct VoteEvent {
    pub voter: Address,
    pub option_id: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum PollError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidOption = 3,
    AlreadyVoted = 4,
    NoOptions = 5,
}

#[contractimpl]
impl PollContract {
    pub fn init(env: Env, question: String, options: Vec<String>) -> Result<(), PollError> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(PollError::AlreadyInitialized);
        }

        if options.is_empty() {
            return Err(PollError::NoOptions);
        }

        let mut results = Vec::new(&env);
        for _ in 0..options.len() {
            results.push_back(0_u32);
        }

        env.storage().persistent().set(&DataKey::Question, &question);
        env.storage().persistent().set(&DataKey::Options, &options);
        env.storage().persistent().set(&DataKey::Results, &results);
        env.storage().persistent().set(&DataKey::Initialized, &true);

        Ok(())
    }

    pub fn vote(env: Env, voter: Address, option_id: u32) -> Result<(), PollError> {
        voter.require_auth();
        Self::ensure_initialized(&env)?;

        if env.storage().persistent().has(&DataKey::Voted(voter.clone())) {
            return Err(PollError::AlreadyVoted);
        }

        let mut results: Vec<u32> = env
            .storage()
            .persistent()
            .get(&DataKey::Results)
            .ok_or(PollError::NotInitialized)?;

        if option_id >= results.len() {
            return Err(PollError::InvalidOption);
        }

        let current = results.get(option_id).ok_or(PollError::InvalidOption)?;
        results.set(option_id, current + 1);

        env.storage().persistent().set(&DataKey::Results, &results);
        env.storage()
            .persistent()
            .set(&DataKey::Voted(voter.clone()), &true);
        env.events().publish(
            (symbol_short!("vote"), voter.clone()),
            VoteEvent { voter, option_id },
        );

        Ok(())
    }

    pub fn get_question(env: Env) -> Result<String, PollError> {
        Self::ensure_initialized(&env)?;
        env.storage()
            .persistent()
            .get(&DataKey::Question)
            .ok_or(PollError::NotInitialized)
    }

    pub fn get_options(env: Env) -> Result<Vec<String>, PollError> {
        Self::ensure_initialized(&env)?;
        env.storage()
            .persistent()
            .get(&DataKey::Options)
            .ok_or(PollError::NotInitialized)
    }

    pub fn get_results(env: Env) -> Result<Vec<u32>, PollError> {
        Self::ensure_initialized(&env)?;
        env.storage()
            .persistent()
            .get(&DataKey::Results)
            .ok_or(PollError::NotInitialized)
    }

    pub fn has_voted(env: Env, voter: Address) -> bool {
        env.storage().persistent().has(&DataKey::Voted(voter))
    }

    fn ensure_initialized(env: &Env) -> Result<(), PollError> {
        if !env.storage().persistent().has(&DataKey::Initialized) {
            return Err(PollError::NotInitialized);
        }

        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, vec, Env};

    #[test]
    fn vote_increments_result_and_blocks_double_vote() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(PollContract, ());
        let client = PollContractClient::new(&env, &contract_id);
        let voter = Address::generate(&env);

        client.init(
            &String::from_str(&env, "Best Stellar feature?"),
            &vec![
                &env,
                String::from_str(&env, "Wallets"),
                String::from_str(&env, "Soroban"),
            ],
        );

        client.vote(&voter, &1);

        assert_eq!(client.get_results(), vec![&env, 0_u32, 1_u32]);
        assert!(client.has_voted(&voter));
        assert_eq!(
            client.try_vote(&voter, &1),
            Err(Ok(PollError::AlreadyVoted))
        );
    }
}
