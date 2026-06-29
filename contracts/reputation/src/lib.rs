#![no_std]

mod errors;
mod events;
mod storage;

#[cfg(test)]
mod test;

use soroban_sdk::{contract, contractimpl, Address, Env, String};

use crate::errors::ReputationError;
use crate::events::{publish_reputation_awarded, publish_reputation_initialized};
use crate::storage::{
    get_governance_contract, get_points, has_initialized, set_admin, set_governance_contract,
    set_initialized, set_points,
};

#[contract]
pub struct ReputationContract;

#[contractimpl]
impl ReputationContract {
    pub fn initialize(
        env: Env,
        admin: Address,
        governance_contract: Address,
    ) -> Result<(), ReputationError> {
        admin.require_auth();

        if has_initialized(&env) {
            return Err(ReputationError::AlreadyInitialized);
        }

        set_admin(&env, &admin);
        set_governance_contract(&env, &governance_contract);
        set_initialized(&env);
        publish_reputation_initialized(&env, admin, governance_contract);

        Ok(())
    }

    pub fn award_point(
        env: Env,
        caller: Address,
        voter: Address,
    ) -> Result<u32, ReputationError> {
        caller.require_auth();
        Self::ensure_initialized(&env)?;

        let authorized_governance_contract = get_governance_contract(&env)
            .ok_or(ReputationError::NotInitialized)?;
        if authorized_governance_contract != caller {
            return Err(ReputationError::Unauthorized);
        }

        let new_points = get_points(&env, &voter) + 1;
        set_points(&env, &voter, new_points);
        let level = Self::level_for_points(&env, new_points);
        publish_reputation_awarded(&env, voter, new_points, level);

        Ok(new_points)
    }

    pub fn get_points(env: Env, wallet: Address) -> u32 {
        get_points(&env, &wallet)
    }

    pub fn get_level(env: Env, wallet: Address) -> String {
        let points = get_points(&env, &wallet);
        Self::level_for_points(&env, points)
    }

    pub fn get_governance_contract(env: Env) -> Result<Address, ReputationError> {
        Self::ensure_initialized(&env)?;
        get_governance_contract(&env).ok_or(ReputationError::NotInitialized)
    }

    fn ensure_initialized(env: &Env) -> Result<(), ReputationError> {
        if has_initialized(env) {
            Ok(())
        } else {
            Err(ReputationError::NotInitialized)
        }
    }

    fn level_for_points(env: &Env, points: u32) -> String {
        if points >= 5 {
            String::from_str(env, "governor")
        } else if points >= 3 {
            String::from_str(env, "contributor")
        } else if points >= 1 {
            String::from_str(env, "participant")
        } else {
            String::from_str(env, "newcomer")
        }
    }
}
