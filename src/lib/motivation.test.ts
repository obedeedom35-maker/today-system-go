import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { cycleClosingMessage } from "./motivation";

describe("cycle closing audience", () => {
  test("shows the cycle message to students in the 6th period", () => {
    assert.notEqual(cycleClosingMessage(6), null);
  });

  test("does not show the 6th-period message to other periods or an unresolved profile", () => {
    for (const period of [1, 2, 3, 4, 5, 7, 8, 9, 10, null, undefined]) {
      assert.equal(cycleClosingMessage(period), null);
    }
  });
});