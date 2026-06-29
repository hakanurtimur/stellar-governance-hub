use super::*;
use crate::errors::GovernanceError;
use soroban_sdk::{testutils::Address as _, testutils::Ledger, vec, Address, Env, String};

const NOW: u64 = 1_000;

fn setup_client(env: &Env) -> (GovernanceContractClient<'_>, Address, Address, Address) {
    env.mock_all_auths();
    env.ledger().set_timestamp(NOW);
    let contract_id = env.register(GovernanceContract, ());
    let client = GovernanceContractClient::new(env, &contract_id);
    let admin = Address::generate(env);
    let reputation_contract = Address::generate(env);
    let creator = Address::generate(env);

    (client, admin, reputation_contract, creator)
}

fn initialized_client(env: &Env) -> (GovernanceContractClient<'_>, Address, Address, Address) {
    let (client, admin, reputation_contract, creator) = setup_client(env);
    client.initialize(&admin, &reputation_contract);
    (client, admin, reputation_contract, creator)
}

fn create_default_proposal(
    env: &Env,
    client: &GovernanceContractClient,
    creator: &Address,
) -> u32 {
    client.create_proposal(
        creator,
        &String::from_str(env, "Fund public goods round?"),
        &String::from_str(env, "Allocate treasury funds to developer tooling."),
        &vec![
            env,
            String::from_str(env, "Approve"),
            String::from_str(env, "Reject"),
        ],
        &(NOW + 100),
    )
}

#[test]
fn initialize_stores_admin_and_reputation_contract() {
    let env = Env::default();
    let (client, _, reputation_contract, _) = initialized_client(&env);

    assert_eq!(client.get_reputation_contract(), reputation_contract);
}

#[test]
fn cannot_initialize_twice() {
    let env = Env::default();
    let (client, admin, reputation_contract, _) = initialized_client(&env);

    assert_eq!(
        client.try_initialize(&admin, &reputation_contract),
        Err(Ok(GovernanceError::AlreadyInitialized))
    );
}

#[test]
fn create_proposal_stores_proposal_with_options_and_counter() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);

    let first_id = create_default_proposal(&env, &client, &creator);
    let second_id = client.create_proposal(
        &creator,
        &String::from_str(&env, "Upgrade grants process?"),
        &String::from_str(&env, ""),
        &vec![
            &env,
            String::from_str(&env, "Yes"),
            String::from_str(&env, "No"),
            String::from_str(&env, "Abstain"),
        ],
        &(NOW + 200),
    );
    let proposal = client.get_proposal(&first_id);
    let summaries = client.list_proposals(&0, &10);

    assert_eq!(first_id, 1);
    assert_eq!(second_id, 2);
    assert_eq!(proposal.id, 1);
    assert_eq!(proposal.creator, creator);
    assert_eq!(proposal.options.len(), 2);
    assert_eq!(proposal.created_at, NOW);
    assert_eq!(proposal.deadline, NOW + 100);
    assert_eq!(proposal.is_closed, false);
    assert_eq!(proposal.total_votes, 0);
    assert_eq!(summaries.len(), 2);
    assert_eq!(summaries.get(0).unwrap().title, proposal.title);
}

#[test]
fn create_proposal_rejects_less_than_two_options() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);

    assert_eq!(
        client.try_create_proposal(
            &creator,
            &String::from_str(&env, "Too few options"),
            &String::from_str(&env, ""),
            &vec![&env, String::from_str(&env, "Only")],
            &(NOW + 100),
        ),
        Err(Ok(GovernanceError::InvalidOptions))
    );
}

#[test]
fn create_proposal_rejects_invalid_deadline() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);

    assert_eq!(
        client.try_create_proposal(
            &creator,
            &String::from_str(&env, "Expired proposal"),
            &String::from_str(&env, ""),
            &vec![
                &env,
                String::from_str(&env, "Yes"),
                String::from_str(&env, "No"),
            ],
            &NOW,
        ),
        Err(Ok(GovernanceError::InvalidDeadline))
    );
}

#[test]
fn create_proposal_rejects_empty_title_and_too_many_options() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);

    assert_eq!(
        client.try_create_proposal(
            &creator,
            &String::from_str(&env, ""),
            &String::from_str(&env, ""),
            &vec![
                &env,
                String::from_str(&env, "Yes"),
                String::from_str(&env, "No"),
            ],
            &(NOW + 100),
        ),
        Err(Ok(GovernanceError::InvalidTitle))
    );
    assert_eq!(
        client.try_create_proposal(
            &creator,
            &String::from_str(&env, "Too many options"),
            &String::from_str(&env, ""),
            &vec![
                &env,
                String::from_str(&env, "A"),
                String::from_str(&env, "B"),
                String::from_str(&env, "C"),
                String::from_str(&env, "D"),
                String::from_str(&env, "E"),
                String::from_str(&env, "F"),
            ],
            &(NOW + 100),
        ),
        Err(Ok(GovernanceError::InvalidOptions))
    );
}

#[test]
fn vote_records_selected_option_and_increments_result() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let voter = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    client.vote(&voter, &proposal_id, &1);

    assert_eq!(client.get_results(&proposal_id), vec![&env, 0_u32, 1_u32]);
    assert_eq!(client.get_proposal(&proposal_id).total_votes, 1);
}

#[test]
fn duplicate_vote_fails() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let voter = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    client.vote(&voter, &proposal_id, &0);

    assert_eq!(
        client.try_vote(&voter, &proposal_id, &1),
        Err(Ok(GovernanceError::AlreadyVoted))
    );
}

#[test]
fn invalid_option_fails() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let voter = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    assert_eq!(
        client.try_vote(&voter, &proposal_id, &2),
        Err(Ok(GovernanceError::InvalidOption))
    );
}

#[test]
fn closed_proposal_cannot_be_voted_on() {
    let env = Env::default();
    let (client, admin, _, creator) = initialized_client(&env);
    let voter = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    client.close_proposal(&admin, &proposal_id);

    assert_eq!(
        client.try_vote(&voter, &proposal_id, &0),
        Err(Ok(GovernanceError::ProposalClosed))
    );
}

#[test]
fn deadline_passed_proposal_cannot_be_voted_on() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let voter = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    env.ledger().set_timestamp(NOW + 101);

    assert_eq!(
        client.try_vote(&voter, &proposal_id, &0),
        Err(Ok(GovernanceError::VotingDeadlinePassed))
    );
}

#[test]
fn close_proposal_works_for_admin() {
    let env = Env::default();
    let (client, admin, _, creator) = initialized_client(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    client.close_proposal(&admin, &proposal_id);

    assert_eq!(client.get_proposal(&proposal_id).is_closed, true);
}

#[test]
fn close_proposal_works_for_creator() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    client.close_proposal(&creator, &proposal_id);

    assert_eq!(client.get_proposal(&proposal_id).is_closed, true);
}

#[test]
fn unauthorized_close_fails() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let attacker = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    assert_eq!(
        client.try_close_proposal(&attacker, &proposal_id),
        Err(Ok(GovernanceError::Unauthorized))
    );
}

#[test]
fn closing_already_closed_proposal_fails() {
    let env = Env::default();
    let (client, admin, _, creator) = initialized_client(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    client.close_proposal(&admin, &proposal_id);

    assert_eq!(
        client.try_close_proposal(&admin, &proposal_id),
        Err(Ok(GovernanceError::ProposalClosed))
    );
}

#[test]
fn get_results_returns_expected_counts_and_has_voted_updates() {
    let env = Env::default();
    let (client, _, _, creator) = initialized_client(&env);
    let first_voter = Address::generate(&env);
    let second_voter = Address::generate(&env);
    let proposal_id = create_default_proposal(&env, &client, &creator);

    assert_eq!(client.has_voted(&proposal_id, &first_voter), false);

    client.vote(&first_voter, &proposal_id, &0);
    client.vote(&second_voter, &proposal_id, &1);

    assert_eq!(client.has_voted(&proposal_id, &first_voter), true);
    assert_eq!(client.get_results(&proposal_id), vec![&env, 1_u32, 1_u32]);
}
