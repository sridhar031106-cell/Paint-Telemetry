import { CQICategory } from '../types';

export interface CQICalculationResult {
  cqi: number;
  tempScore: number;
  humidityScore: number;
  category: CQICategory;
}

/**
 * Calculates Coating Quality Index (CQI) according to Requirement 5
 * @param temp Temperature in Celsius
 * @param rh Relative Humidity percentage
 * @param tempWeight Weight for temperature (default 0.60 / 60%)
 * @param rhWeight Weight for humidity (default 0.40 / 40%)
 */
export function calculateCQI(
  temp: number,
  rh: number,
  tempWeight: number = 0.60,
  rhWeight: number = 0.40
): CQICalculationResult {
  // Temperature Score: 100 * (1 - |temp - 22.5| / 5.0) for 17.5°C to 27.5°C, else 0
  let tempScore = 0;
  if (temp >= 17.5 && temp <= 27.5) {
    tempScore = 100 * (1 - Math.abs(temp - 22.5) / 5.0);
  }

  // Humidity Score: 100 * (1 - |rh - 50| / 10.0) for 40% to 60% RH, else 0
  let humidityScore = 0;
  if (rh >= 40.0 && rh <= 60.0) {
    humidityScore = 100 * (1 - Math.abs(rh - 50.0) / 10.0);
  }

  // Ensure non-negative raw scores
  tempScore = Math.max(0, Math.min(100, tempScore));
  humidityScore = Math.max(0, Math.min(100, humidityScore));

  // Weighted sum
  const weightedCQI = tempScore * tempWeight + humidityScore * rhWeight;

  // Round to nearest integer and clamp [0, 100]
  const cqi = Math.max(0, Math.min(100, Math.round(weightedCQI)));

  // Categorize score according to Requirement 5.3
  let category: CQICategory = 'Poor';
  if (cqi >= 85) {
    category = 'Excellent';
  } else if (cqi >= 70) {
    category = 'Good';
  } else if (cqi >= 55) {
    category = 'Fair';
  } else {
    category = 'Poor';
  }

  return {
    cqi,
    tempScore: Math.round(tempScore * 10) / 10,
    humidityScore: Math.round(humidityScore * 10) / 10,
    category
  };
}
