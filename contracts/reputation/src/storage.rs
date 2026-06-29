use soroban_sdk::{contracttype, Address, Env};

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Initialized,
    Admin,
    GovernanceContract,
    Points(Address),
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

pub fn set_governance_contract(env: &Env, governance_contract: &Address) {
    env.storage()
        .persistent()
        .set(&DataKey::GovernanceContract, governance_contract);
}

pub fn get_governance_contract(env: &Env) -> Option<Address> {
    env.storage().persistent().get(&DataKey::GovernanceContract)
}

pub fn get_points(env: &Env, wallet: &Address) -> u32 {
    env.storage()
        .persistent()
        .get(&DataKey::Points(wallet.clone()))
        .unwrap_or(0)
}

pub fn set_points(env: &Env, wallet: &Address, points: u32) {
    env.storage()
        .persistent()
        .set(&DataKey::Points(wallet.clone()), &points);
}
