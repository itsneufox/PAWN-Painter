import chai from "chai";
import { clamp } from "../../src/utils/utils";

suite("Utility Functions Tests", () => {
  test("clamp function works correctly", () => {
    // Test normal clamping
    chai.assert.equal(clamp(5, 0, 10), 5);
    chai.assert.equal(clamp(-5, 0, 10), 0);
    chai.assert.equal(clamp(15, 0, 10), 10);
    
    // Test edge cases
    chai.assert.equal(clamp(0, 0, 10), 0);
    chai.assert.equal(clamp(10, 0, 10), 10);
    
    // Test with negative ranges
    chai.assert.equal(clamp(-5, -10, -1), -5);
    chai.assert.equal(clamp(-15, -10, -1), -10);
    chai.assert.equal(clamp(5, -10, -1), -1);
  });
});
