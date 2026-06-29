use soroban_sdk::{contracttype, symbol_short, Address, Env, String};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationInitializedEvent {
    pub admin: Address,
    pub governance_contract: Address,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationAwardedEvent {
    pub voter: Address,
    pub new_points: u32,
    pub level: String,
}

pub fn publish_reputation_initialized(
    env: &Env,
    admin: Address,
    governance_contract: Address,
) {
    env.events().publish(
        (symbol_short!("rep_init"), governance_contract.clone()),
        ReputationInitializedEvent {
            admin,
            governance_contract,
        },
    );
}

pub fn publish_reputation_awarded(
    env: &Env,
    voter: Address,
    new_points: u32,
    level: String,
) {
    env.events().publish(
        (symbol_short!("rep_award"), voter.clone()),
        ReputationAwardedEvent {
            voter,
            new_points,
            level,
        },
    );
}
