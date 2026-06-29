#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String,
};

#[contract]
pub struct ReputationContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Initialized,
    Admin,
    GovernanceContract,
    Points(Address),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationAwardedEvent {
    pub voter: Address,
    pub points: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ReputationError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
}

#[contractimpl]
impl ReputationContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        governance_contract: Address,
    ) -> Result<(), ReputationError> {
        admin.require_auth();

        if env.storage().persistent().has(&DataKey::Initialized) {
            return Err(ReputationError::AlreadyInitialized);
        }

        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage()
            .persistent()
            .set(&DataKey::GovernanceContract, &governance_contract);
        env.storage().persistent().set(&DataKey::Initialized, &true);

        Ok(())
    }

    pub fn award_point(
        env: Env,
        governance_contract: Address,
        voter: Address,
    ) -> Result<u32, ReputationError> {
        governance_contract.require_auth();
        Self::ensure_initialized(&env)?;
        Self::ensure_governance_contract(&env, &governance_contract)?;

        let next_points = Self::get_points(env.clone(), voter.clone()) + 1;
        env.storage()
            .persistent()
            .set(&DataKey::Points(voter.clone()), &next_points);
        env.events().publish(
            (symbol_short!("rep"), voter.clone()),
            ReputationAwardedEvent {
                voter,
                points: next_points,
            },
        );

        Ok(next_points)
    }

    pub fn get_points(env: Env, wallet: Address) -> u32 {
        env.storage()
            .persistent()
            .get(&DataKey::Points(wallet))
            .unwrap_or(0)
    }

    pub fn get_level(env: Env, wallet: Address) -> String {
        let points = Self::get_points(env.clone(), wallet);

        if points >= 10 {
            String::from_str(&env, "Steward")
        } else if points >= 1 {
            String::from_str(&env, "Participant")
        } else {
            String::from_str(&env, "Observer")
        }
    }

    fn ensure_initialized(env: &Env) -> Result<(), ReputationError> {
        if env.storage().persistent().has(&DataKey::Initialized) {
            Ok(())
        } else {
            Err(ReputationError::NotInitialized)
        }
    }

    fn ensure_governance_contract(
        env: &Env,
        caller: &Address,
    ) -> Result<(), ReputationError> {
        let expected: Address = env
            .storage()
            .persistent()
            .get(&DataKey::GovernanceContract)
            .ok_or(ReputationError::NotInitialized)?;

        if &expected == caller {
            Ok(())
        } else {
            Err(ReputationError::Unauthorized)
        }
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Address, Env, String};

    #[test]
    fn awards_points_and_levels_participants() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(ReputationContract, ());
        let client = ReputationContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let governance_contract = Address::generate(&env);
        let voter = Address::generate(&env);

        client.initialize(&admin, &governance_contract);

        client.award_point(&governance_contract, &voter);
        client.award_point(&governance_contract, &voter);

        assert_eq!(client.get_points(&voter), 2);
        assert_eq!(
            client.get_level(&voter),
            String::from_str(&env, "Participant")
        );
    }
}
