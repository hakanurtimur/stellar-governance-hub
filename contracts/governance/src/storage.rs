use soroban_sdk::{contracttype, Address, Env, Vec};

use crate::types::Proposal;

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
    HasVoted(u32, Address),
}

pub fn has_initialized(env: &Env) -> bool {
    env.storage().persistent().has(&DataKey::Initialized)
}

pub fn set_initialized(env: &Env) {
    env.storage().persistent().set(&DataKey::Initialized, &true);
}

pub fn set_admin(env: &Env, admin: &Address) {
    env.storage().persistent().set(&DataKey::Admin, admin);
}

pub fn get_admin(env: &Env) -> Option<Address> {
    env.storage().persistent().get(&DataKey::Admin)
}

pub fn set_reputation_contract(env: &Env, reputation_contract: &Address) {
    env.storage()
        .persistent()
        .set(&DataKey::ReputationContract, reputation_contract);
}

pub fn get_reputation_contract(env: &Env) -> Option<Address> {
    env.storage().persistent().get(&DataKey::ReputationContract)
}

pub fn next_proposal_id(env: &Env) -> u32 {
    let next_id = env
        .storage()
        .persistent()
        .get::<DataKey, u32>(&DataKey::ProposalCounter)
        .unwrap_or(0)
        + 1;
    env.storage()
        .persistent()
        .set(&DataKey::ProposalCounter, &next_id);
    next_id
}

pub fn set_proposal(env: &Env, proposal_id: u32, proposal: &Proposal) {
    env.storage()
        .persistent()
        .set(&DataKey::Proposal(proposal_id), proposal);
}

pub fn get_proposal(env: &Env, proposal_id: u32) -> Option<Proposal> {
    env.storage().persistent().get(&DataKey::Proposal(proposal_id))
}

pub fn set_results(env: &Env, proposal_id: u32, results: &Vec<u32>) {
    env.storage()
        .persistent()
        .set(&DataKey::Results(proposal_id), results);
}

pub fn get_results(env: &Env, proposal_id: u32) -> Option<Vec<u32>> {
    env.storage().persistent().get(&DataKey::Results(proposal_id))
}

pub fn get_proposal_ids(env: &Env) -> Vec<u32> {
    env.storage()
        .persistent()
        .get::<DataKey, Vec<u32>>(&DataKey::ProposalIds)
        .unwrap_or_else(|| Vec::new(env))
}

pub fn set_proposal_ids(env: &Env, proposal_ids: &Vec<u32>) {
    env.storage()
        .persistent()
        .set(&DataKey::ProposalIds, proposal_ids);
}

pub fn set_has_voted(env: &Env, proposal_id: u32, voter: &Address) {
    env.storage()
        .persistent()
        .set(&DataKey::HasVoted(proposal_id, voter.clone()), &true);
}

pub fn has_voted(env: &Env, proposal_id: u32, voter: &Address) -> bool {
    env.storage()
        .persistent()
        .has(&DataKey::HasVoted(proposal_id, voter.clone()))
}
