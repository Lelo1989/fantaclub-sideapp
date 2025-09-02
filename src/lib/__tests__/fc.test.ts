import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { renewalCost } from '../fc.js';

describe('renewalCost', () => {
  it('calculates fee when new end is later than current end', () => {
    const result = renewalCost(2024, 2026, 50);
    assert.strictEqual(result, 100);
  });

  it('returns zero when new end is not later than current end', () => {
    assert.strictEqual(renewalCost(2024, 2024, 50), 0);
    assert.strictEqual(renewalCost(2024, 2023, 50), 0);
  });
});
