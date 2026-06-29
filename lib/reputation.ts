export type ReputationLevel = "newcomer" | "participant" | "contributor" | "governor";

export function reputationLevel(points: number): ReputationLevel {
  if (points >= 5) {
    return "governor";
  }

  if (points >= 3) {
    return "contributor";
  }

  if (points >= 1) {
    return "participant";
  }

  return "newcomer";
}
