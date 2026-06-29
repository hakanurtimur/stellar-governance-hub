use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

fn setup_client(env: &Env) -> (ReputationContractClient<'_>, Address, Address, Address) {
    env.mock_all_auths();
    let contract_id = env.register(ReputationContract, ());
    let client = ReputationContractClient::new(env, &contract_id);
    let admin = Address::generate(env);
    let governance_contract = Address::generate(env);
    let voter = Address::generate(env);

    (client, admin, governance_contract, voter)
}

#[test]
fn initialize_stores_governance_contract() {
    let env = Env::default();
    let (client, admin, governance_contract, _) = setup_client(&env);

    client.initialize(&admin, &governance_contract);

    assert_eq!(client.get_governance_contract(), governance_contract);
}

#[test]
fn cannot_initialize_twice() {
    let env = Env::default();
    let (client, admin, governance_contract, _) = setup_client(&env);
    let other_governance_contract = Address::generate(&env);

    client.initialize(&admin, &governance_contract);

    assert_eq!(
        client.try_initialize(&admin, &other_governance_contract),
        Err(Ok(ReputationError::AlreadyInitialized))
    );
    assert_eq!(client.get_governance_contract(), governance_contract);
}

#[test]
fn authorized_award_increments_points() {
    let env = Env::default();
    let (client, admin, governance_contract, voter) = setup_client(&env);

    client.initialize(&admin, &governance_contract);
    let new_points = client.award_point(&governance_contract, &voter);

    assert_eq!(new_points, 1);
    assert_eq!(client.get_points(&voter), 1);
}

#[test]
fn unauthorized_award_fails() {
    let env = Env::default();
    let (client, admin, governance_contract, voter) = setup_client(&env);
    let attacker = Address::generate(&env);

    client.initialize(&admin, &governance_contract);

    assert_eq!(
        client.try_award_point(&attacker, &voter),
        Err(Ok(ReputationError::Unauthorized))
    );
    assert_eq!(client.get_points(&voter), 0);
}

#[test]
fn get_level_returns_correct_levels() {
    let env = Env::default();
    let (client, admin, governance_contract, voter) = setup_client(&env);

    client.initialize(&admin, &governance_contract);
    assert_eq!(client.get_level(&voter), String::from_str(&env, "newcomer"));

    client.award_point(&governance_contract, &voter);
    assert_eq!(
        client.get_level(&voter),
        String::from_str(&env, "participant")
    );

    client.award_point(&governance_contract, &voter);
    assert_eq!(
        client.get_level(&voter),
        String::from_str(&env, "participant")
    );

    client.award_point(&governance_contract, &voter);
    assert_eq!(
        client.get_level(&voter),
        String::from_str(&env, "contributor")
    );

    client.award_point(&governance_contract, &voter);
    assert_eq!(
        client.get_level(&voter),
        String::from_str(&env, "contributor")
    );

    client.award_point(&governance_contract, &voter);
    assert_eq!(client.get_level(&voter), String::from_str(&env, "governor"));
}

#[test]
fn multiple_awards_increase_points_correctly() {
    let env = Env::default();
    let (client, admin, governance_contract, voter) = setup_client(&env);

    client.initialize(&admin, &governance_contract);
    client.award_point(&governance_contract, &voter);
    client.award_point(&governance_contract, &voter);
    client.award_point(&governance_contract, &voter);

    assert_eq!(client.get_points(&voter), 3);
    assert_eq!(
        client.get_level(&voter),
        String::from_str(&env, "contributor")
    );
}
