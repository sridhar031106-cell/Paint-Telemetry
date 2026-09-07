import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { calculateCQI } from '../src/lib/utils/cqiCalculator';

describe('CQI Calculator Unit Tests', () => {
  it('calculates perfect CQI (100) at 22.5°C and 50% RH', () => {
    const result = calculateCQI(22.5, 50);
    expect(result.cqi).toBe(100);
    expect(result.category).toBe('Excellent');
    expect(result.tempScore).toBe(100);
    expect(result.humidityScore).toBe(100);
  });

  it('returns 0 for temp outside 17.5-27.5°C and RH outside 40-60%', () => {
    const result = calculateCQI(10.0, 70.0);
    expect(result.cqi).toBe(0);
    expect(result.category).toBe('Poor');
  });

  it('correctly categorizes Excellent (>=85), Good (70-84), Fair (55-69), Poor (<55)', () => {
    expect(calculateCQI(22.5, 50).category).toBe('Excellent'); // CQI 100
    expect(calculateCQI(21.5, 47).category).toBe('Good');      // CQI 76 -> Good
    expect(calculateCQI(21.0, 45).category).toBe('Fair');      // CQI 62 -> Fair
    expect(calculateCQI(15.0, 30).category).toBe('Poor');      // CQI 0 -> Poor
  });
});

describe('CQI Calculator Property-Based Tests (fast-check)', () => {
  it('property: CQI score is always clamped between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.float({ min: -50, max: 150, noNaN: true }),
        fc.float({ min: -20, max: 120, noNaN: true }),
        (temp, rh) => {
          const { cqi } = calculateCQI(temp, rh);
          return cqi >= 0 && cqi <= 100 && Number.isInteger(cqi);
        }
      )
    );
  });

  it('property: weight customizer enforces sum breakdown', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 17.5, max: 27.5, noNaN: true }),
        fc.float({ min: 40, max: 60, noNaN: true }),
        (temp, rh) => {
          const res1 = calculateCQI(temp, rh, 0.70, 0.30);
          const res2 = calculateCQI(temp, rh, 0.50, 0.50);
          return res1.cqi >= 0 && res1.cqi <= 100 && res2.cqi >= 0 && res2.cqi <= 100;
        }
      )
    );
  });
});
