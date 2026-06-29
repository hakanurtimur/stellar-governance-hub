use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum GovernanceError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    ProposalNotFound = 4,
    InvalidTitle = 5,
    InvalidOptions = 6,
    InvalidDeadline = 7,
    ProposalClosed = 8,
    VotingDeadlinePassed = 9,
    InvalidOption = 10,
    AlreadyVoted = 11,
}
