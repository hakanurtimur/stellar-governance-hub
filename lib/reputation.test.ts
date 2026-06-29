import { describe, expect, it } from "vitest";

import { reputationLevel } from "./reputation";

describe("reputationLevel", () => {
  it("returns governance reputation labels by point count", () => {
    expect(reputationLevel(0)).toBe("newcomer");
    expect(reputationLevel(1)).toBe("participant");
    expect(reputationLevel(2)).toBe("participant");
    expect(reputationLevel(3)).toBe("contributor");
    expect(reputationLevel(4)).toBe("contributor");
    expect(reputationLevel(5)).toBe("governor");
  });
});
