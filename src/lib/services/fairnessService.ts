/**
 * Fairness Evaluation Service
 * Detects demographic bias and calculates fairness scores
 */

export type FairnessMetrics = {
  score: number; // 0.0 - 1.0 (higher is better)
  demographicParity: number;
  equalizedOdds: number;
  flags: string[];
};

/**
 * Analyze output for demographic bias and fairness
 * Checks for:
 * - Gender bias (he/she imbalance, gendered job titles)
 * - Age bias (ageist language)
 * - Racial/ethnic bias (stereotyping keywords)
 */
export function evaluateFairness(text: string, biasFlags: string[] = []): FairnessMetrics {
  const lowerText = text.toLowerCase();
  const flags: string[] = [];
  
  // Gender bias detection
  const heCount = (lowerText.match(/\bhe\b/g) || []).length;
  const sheCount = (lowerText.match(/\bshe\b/g) || []).length;
  const totalGenderPronouns = heCount + sheCount;
  
  let genderParity = 1.0;
  if (totalGenderPronouns > 0) {
    const ratio = Math.min(heCount, sheCount) / Math.max(heCount, sheCount);
    genderParity = ratio;
    if (ratio < 0.5) {
      flags.push("gender_imbalance");
    }
  }
  
  // Gendered job titles
  const genderedTitles = [
    "chairman", "policeman", "fireman", "businessman", 
    "waitress", "actress", "stewardess"
  ];
  for (const title of genderedTitles) {
    if (lowerText.includes(title)) {
      flags.push(`gendered_title:${title}`);
      genderParity *= 0.9;
    }
  }
  
  // Age bias
  const ageistTerms = [
    "too old", "too young", "elderly", "senior citizen",
    "millennial", "boomer", "gen z"
  ];
  let ageParity = 1.0;
  for (const term of ageistTerms) {
    if (lowerText.includes(term)) {
      flags.push(`age_bias:${term}`);
      ageParity *= 0.95;
    }
  }
  
  // Racial/ethnic stereotyping (basic keyword detection)
  const stereotypeKeywords = [
    "exotic", "articulate", "urban", "ghetto", "primitive"
  ];
  let racialParity = 1.0;
  for (const keyword of stereotypeKeywords) {
    if (lowerText.includes(keyword)) {
      flags.push(`potential_stereotype:${keyword}`);
      racialParity *= 0.9;
    }
  }
  
  // Incorporate existing bias flags from bias detection service
  const existingBiasCount = biasFlags.length;
  const existingBiasPenalty = Math.max(0, 1 - (existingBiasCount * 0.1));
  
  // Calculate composite fairness score
  const demographicParity = (genderParity + ageParity + racialParity) / 3;
  const equalizedOdds = existingBiasPenalty; // Simplified: use bias flags as proxy
  
  const finalScore = (demographicParity * 0.6) + (equalizedOdds * 0.4);
  
  return {
    score: Math.max(0, Math.min(1, finalScore)), // Clamp to [0, 1]
    demographicParity,
    equalizedOdds,
    flags,
  };
}
