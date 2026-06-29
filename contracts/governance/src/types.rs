use soroban_sdk::{contracttype, Address, String, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Proposal {
    pub id: u32,
    pub creator: Address,
    pub title: String,
    pub description: String,
    pub options: Vec<String>,
    pub created_at: u64,
    pub deadline: u64,
    pub is_closed: bool,
    pub total_votes: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ProposalSummary {
    pub id: u32,
    pub title: String,
    pub is_closed: bool,
    pub total_votes: u32,
    pub deadline: u64,
}
