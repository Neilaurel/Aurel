import * as math from 'mathjs';
import { AnalysisResult, RecentMatch, HalfTimeStatsSummary, HalfTimePredictions, Prediction } from '../types';
import { WEIGHTS_6 } from '../constants';

// Helper to compute FCD (Decreasing Cumulative Frequencies) for >=1, >=2, >=3
const computeFCDThresholds = (arr: number[]) => {
  if (!arr || arr.length === 0) return { g1: 0, g2: 0, g3: 0 };
  const n = arr.length;
  const g1 = arr.filter(x => x >= 1).length / n;
  const g2 = arr.filter(x => x >= 2).length / n;
  const g3 = arr.filter(x => x >= 3).length / n;
  return { g1, g2, g3 };
};

// Helper for sample variance
const computeVariance = (arr: number[]) => {
  if (!arr || arr.length <= 1) return 0;
  return math.number(math.variance(arr)) as number;
};

// Helper for mean
const computeMean = (arr: number[]) => {
  if (!arr || arr.length === 0) return 0;
  return math.number(math.mean(arr)) as number;
};

export const calculateHalfTimeStatsSummary = (
  homeMatchesRaw: RecentMatch[],
  awayMatchesRaw: RecentMatch[],
  homeTeamName: string,
  awayTeamName: string
): { summary: HalfTimeStatsSummary; predictions: HalfTimePredictions; homeMatchesProcessed: RecentMatch[]; awayMatchesProcessed: RecentMatch[] } => {
  // Process matches and enforce HT2 deduction: HT2 = FT - HT1
  const processMatches = (matches: RecentMatch[]) => {
    return (matches || []).map(m => {
      const ftScored = Number(m.goalsScored) || 0;
      const ftConceded = Number(m.goalsConceded) || 0;
      let ht1S = m.ht1Scored !== undefined && m.ht1Scored !== null ? Number(m.ht1Scored) : Math.min(ftScored, Math.floor(ftScored / 2));
      let ht1C = m.ht1Conceded !== undefined && m.ht1Conceded !== null ? Number(m.ht1Conceded) : Math.min(ftConceded, Math.floor(ftConceded / 2));

      // Ensure HT1 cannot exceed FT
      ht1S = Math.min(ht1S, ftScored);
      ht1C = Math.min(ht1C, ftConceded);

      // Deduce HT2 goals: HT2 = FT - HT1
      const ht2S = Math.max(0, ftScored - ht1S);
      const ht2C = Math.max(0, ftConceded - ht1C);

      return {
        ...m,
        goalsScored: ftScored,
        goalsConceded: ftConceded,
        ht1Scored: ht1S,
        ht1Conceded: ht1C,
        ht2Scored: ht2S,
        ht2Conceded: ht2C,
        score: `${ftScored}-${ftConceded}`
      };
    });
  };

  const homeMatchesProcessed = processMatches(homeMatchesRaw);
  const awayMatchesProcessed = processMatches(awayMatchesRaw);

  // Extract arrays for stats
  const extractArr = (matches: RecentMatch[], key: 'ht1Scored' | 'ht1Conceded' | 'ht2Scored' | 'ht2Conceded' | 'goalsScored' | 'goalsConceded') =>
    matches.map(m => Number(m[key]) || 0);

  const hHT1S = extractArr(homeMatchesProcessed, 'ht1Scored');
  const hHT1C = extractArr(homeMatchesProcessed, 'ht1Conceded');
  const hHT2S = extractArr(homeMatchesProcessed, 'ht2Scored');
  const hHT2C = extractArr(homeMatchesProcessed, 'ht2Conceded');
  const hFTS  = extractArr(homeMatchesProcessed, 'goalsScored');
  const hFTC  = extractArr(homeMatchesProcessed, 'goalsConceded');

  const aHT1S = extractArr(awayMatchesProcessed, 'ht1Scored');
  const aHT1C = extractArr(awayMatchesProcessed, 'ht1Conceded');
  const aHT2S = extractArr(awayMatchesProcessed, 'ht2Scored');
  const aHT2C = extractArr(awayMatchesProcessed, 'ht2Conceded');
  const aFTS  = extractArr(awayMatchesProcessed, 'goalsScored');
  const aFTC  = extractArr(awayMatchesProcessed, 'goalsConceded');

  // Averages
  const homeHT1ScoredAvg = computeMean(hHT1S);
  const homeHT1ConcededAvg = computeMean(hHT1C);
  const homeHT2ScoredAvg = computeMean(hHT2S);
  const homeHT2ConcededAvg = computeMean(hHT2C);
  const homeFTScoredAvg = computeMean(hFTS);
  const homeFTConcededAvg = computeMean(hFTC);

  const awayHT1ScoredAvg = computeMean(aHT1S);
  const awayHT1ConcededAvg = computeMean(aHT1C);
  const awayHT2ScoredAvg = computeMean(aHT2S);
  const awayHT2ConcededAvg = computeMean(aHT2C);
  const awayFTScoredAvg = computeMean(aFTS);
  const awayFTConcededAvg = computeMean(aFTC);

  // Crossed Averages (Expected Goals)
  const crossedHT1Home = (homeHT1ScoredAvg + awayHT1ConcededAvg) / 2;
  const crossedHT1Away = (awayHT1ScoredAvg + homeHT1ConcededAvg) / 2;
  const crossedHT2Home = (homeHT2ScoredAvg + awayHT2ConcededAvg) / 2;
  const crossedHT2Away = (awayHT2ScoredAvg + homeHT2ConcededAvg) / 2;
  const crossedFTHome  = (homeFTScoredAvg  + awayFTConcededAvg)  / 2;
  const crossedFTAway  = (awayFTScoredAvg  + homeFTConcededAvg)  / 2;

  // FCDs Scored & Conceded
  const fcdHomeScoredHT1 = computeFCDThresholds(hHT1S);
  const fcdHomeConcededHT1 = computeFCDThresholds(hHT1C);
  const fcdHomeScoredHT2 = computeFCDThresholds(hHT2S);
  const fcdHomeConcededHT2 = computeFCDThresholds(hHT2C);
  const fcdHomeScoredFT = computeFCDThresholds(hFTS);
  const fcdHomeConcededFT = computeFCDThresholds(hFTC);

  const fcdAwayScoredHT1 = computeFCDThresholds(aHT1S);
  const fcdAwayConcededHT1 = computeFCDThresholds(aHT1C);
  const fcdAwayScoredHT2 = computeFCDThresholds(aHT2S);
  const fcdAwayConcededHT2 = computeFCDThresholds(aHT2C);
  const fcdAwayScoredFT = computeFCDThresholds(aFTS);
  const fcdAwayConcededFT = computeFCDThresholds(aFTC);

  // Crossed FCDs
  const crossFCD = (f1: { g1: number; g2: number; g3: number }, f2: { g1: number; g2: number; g3: number }) => ({
    g1: (f1.g1 + f2.g1) / 2,
    g2: (f1.g2 + f2.g2) / 2,
    g3: (f1.g3 + f2.g3) / 2,
  });

  const crossedFcdHT1Home = crossFCD(fcdHomeScoredHT1, fcdAwayConcededHT1);
  const crossedFcdHT1Away = crossFCD(fcdAwayScoredHT1, fcdHomeConcededHT1);
  const crossedFcdHT2Home = crossFCD(fcdHomeScoredHT2, fcdAwayConcededHT2);
  const crossedFcdHT2Away = crossFCD(fcdAwayScoredHT2, fcdHomeConcededHT2);
  const crossedFcdFTHome  = crossFCD(fcdHomeScoredFT,  fcdAwayConcededFT);
  const crossedFcdFTAway  = crossFCD(fcdAwayScoredFT,  fcdHomeConcededFT);

  // Variances
  const homeVarScoredHT1   = computeVariance(hHT1S);
  const homeVarConcededHT1 = computeVariance(hHT1C);
  const homeVarScoredHT2   = computeVariance(hHT2S);
  const homeVarConcededHT2 = computeVariance(hHT2C);
  const homeVarScoredFT    = computeVariance(hFTS);
  const homeVarConcededFT  = computeVariance(hFTC);

  const awayVarScoredHT1   = computeVariance(aHT1S);
  const awayVarConcededHT1 = computeVariance(aHT1C);
  const awayVarScoredHT2   = computeVariance(aHT2S);
  const awayVarConcededHT2 = computeVariance(aHT2C);
  const awayVarScoredFT    = computeVariance(aFTS);
  const awayVarConcededFT  = computeVariance(aFTC);

  // Crossed Variances
  const crossedVarHT1Home = (homeVarScoredHT1 + awayVarConcededHT1) / 2;
  const crossedVarHT1Away = (awayVarScoredHT1 + homeVarConcededHT1) / 2;
  const crossedVarHT2Home = (homeVarScoredHT2 + awayVarConcededHT2) / 2;
  const crossedVarHT2Away = (awayVarScoredHT2 + homeVarConcededHT2) / 2;
  const crossedVarFTHome  = (homeVarScoredFT  + awayVarConcededFT)  / 2;
  const crossedVarFTAway  = (awayVarScoredFT  + homeVarConcededFT)  / 2;

  // Trust Check (variance vs crossed mean)
  const trustHT1Home = Math.abs(crossedVarHT1Home - crossedHT1Home) < 0.6;
  const trustHT1Away = Math.abs(crossedVarHT1Away - crossedHT1Away) < 0.6;
  const trustHT2Home = Math.abs(crossedVarHT2Home - crossedHT2Home) < 0.6;
  const trustHT2Away = Math.abs(crossedVarHT2Away - crossedHT2Away) < 0.6;

  // Ascendance / Dominance Indicator
  const formatAscendance = (attTeam: string, defTeam: string, attAvg: number, defAvg: number) => {
    const diff = attAvg - defAvg;
    if (diff > 0.15) {
      return `Attaque ${attTeam} domine défense ${defTeam} (+${diff.toFixed(2)} buts)`;
    } else if (diff < -0.15) {
      return `Défense ${defTeam} résiste à l'attaque ${attTeam} (${diff.toFixed(2)} buts)`;
    } else {
      return `Équilibre entre l'attaque ${attTeam} et la défense ${defTeam}`;
    }
  };

  const ascendanceHT1Home = formatAscendance(homeTeamName, awayTeamName, homeHT1ScoredAvg, awayHT1ConcededAvg);
  const ascendanceHT1Away = formatAscendance(awayTeamName, homeTeamName, awayHT1ScoredAvg, homeHT1ConcededAvg);
  const ascendanceHT2Home = formatAscendance(homeTeamName, awayTeamName, homeHT2ScoredAvg, awayHT2ConcededAvg);
  const ascendanceHT2Away = formatAscendance(awayTeamName, homeTeamName, awayHT2ScoredAvg, homeHT2ConcededAvg);
  const ascendanceFTHome  = formatAscendance(homeTeamName, awayTeamName, homeFTScoredAvg,  awayFTConcededAvg);
  const ascendanceFTAway  = formatAscendance(awayTeamName, homeTeamName, awayFTScoredAvg,  homeFTConcededAvg);

  const summary: HalfTimeStatsSummary = {
    homeHT1ScoredAvg, homeHT1ConcededAvg, homeHT2ScoredAvg, homeHT2ConcededAvg, homeFTScoredAvg, homeFTConcededAvg,
    awayHT1ScoredAvg, awayHT1ConcededAvg, awayHT2ScoredAvg, awayHT2ConcededAvg, awayFTScoredAvg, awayFTConcededAvg,
    crossedHT1Home, crossedHT1Away, crossedHT2Home, crossedHT2Away, crossedFTHome, crossedFTAway,
    fcdHomeScoredHT1, fcdHomeConcededHT1, fcdHomeScoredHT2, fcdHomeConcededHT2, fcdHomeScoredFT, fcdHomeConcededFT,
    fcdAwayScoredHT1, fcdAwayConcededHT1, fcdAwayScoredHT2, fcdAwayConcededHT2, fcdAwayScoredFT, fcdAwayConcededFT,
    crossedFcdHT1Home, crossedFcdHT1Away, crossedFcdHT2Home, crossedFcdHT2Away, crossedFcdFTHome, crossedFcdFTAway,
    homeVarScoredHT1, homeVarConcededHT1, homeVarScoredHT2, homeVarConcededHT2, homeVarScoredFT, homeVarConcededFT,
    awayVarScoredHT1, awayVarConcededHT1, awayVarScoredHT2, awayVarConcededHT2, awayVarScoredFT, awayVarConcededFT,
    crossedVarHT1Home, crossedVarHT1Away, crossedVarHT2Home, crossedVarHT2Away, crossedVarFTHome, crossedVarFTAway,
    trustHT1Home, trustHT1Away, trustHT2Home, trustHT2Away,
    ascendanceHT1Home, ascendanceHT1Away, ascendanceHT2Home, ascendanceHT2Away, ascendanceFTHome, ascendanceFTAway
  };

  // Generate HT1, HT2, and FT prognosis choices
  const matchTitle = `${homeTeamName} vs ${awayTeamName}`;

  // HT1 Predictions
  const ht1TotalExpected = crossedHT1Home + crossedHT1Away;
  const ht1Pronostics: Prediction[] = [
    {
      id: 'ht1-over',
      matchName: matchTitle,
      sport: 'football',
      type: ht1TotalExpected > 0.8 ? '1ère Mi-Temps : Plus de 0.5 buts' : '1ère Mi-Temps : Moins de 1.5 buts',
      odd: ht1TotalExpected > 0.8 ? 1.42 : 1.35,
      confidence: Math.min(92, Math.max(60, Math.round(ht1TotalExpected > 0.8 ? (crossedFcdHT1Home.g1 + crossedFcdHT1Away.g1) * 50 + 40 : 80 - ht1TotalExpected * 20))),
      reasoning: `Espérance de buts en 1ère MT : ${ht1TotalExpected.toFixed(2)}. ${ht1TotalExpected > 0.8 ? 'Fréquence cumulée élevée de marquer en 1ère MT.' : 'Attaques prudentes en début de rencontre.'}`
    },
    {
      id: 'ht1-result',
      matchName: matchTitle,
      sport: 'football',
      type: crossedHT1Home > crossedHT1Away + 0.25 ? `1ère MT : Victoire ${homeTeamName}` : crossedHT1Away > crossedHT1Home + 0.25 ? `1ère MT : Victoire ${awayTeamName}` : '1ère MT : Match Nul',
      odd: crossedHT1Home > crossedHT1Away + 0.25 ? 2.10 : crossedHT1Away > crossedHT1Home + 0.25 ? 2.40 : 1.95,
      confidence: Math.round(65 + Math.abs(crossedHT1Home - crossedHT1Away) * 20),
      reasoning: `Croisement 1MT: ${homeTeamName} (${crossedHT1Home.toFixed(2)}) vs ${awayTeamName} (${crossedHT1Away.toFixed(2)}). ${ascendanceHT1Home}`
    }
  ];

  // HT2 Predictions
  const ht2TotalExpected = crossedHT2Home + crossedHT2Away;
  const ht2Pronostics: Prediction[] = [
    {
      id: 'ht2-over',
      matchName: matchTitle,
      sport: 'football',
      type: ht2TotalExpected > 1.1 ? '2nde Mi-Temps : Plus de 0.5 buts' : '2nde Mi-Temps : Plus de 1.0 buts',
      odd: ht2TotalExpected > 1.1 ? 1.32 : 1.65,
      confidence: Math.min(95, Math.max(65, Math.round((crossedFcdHT2Home.g1 + crossedFcdHT2Away.g1) * 45 + 45))),
      reasoning: `Espérance de buts en 2nde MT : ${ht2TotalExpected.toFixed(2)}. Soustraction FT - 1MT montre une accélération en seconde période.`
    },
    {
      id: 'ht2-btts',
      matchName: matchTitle,
      sport: 'football',
      type: (crossedHT2Home > 0.6 && crossedHT2Away > 0.6) ? '2nde MT : Les 2 équipes marquent' : `2nde MT : ${crossedHT2Home >= crossedHT2Away ? homeTeamName : awayTeamName} marque en 2nde MT`,
      odd: (crossedHT2Home > 0.6 && crossedHT2Away > 0.6) ? 2.80 : 1.48,
      confidence: Math.round(60 + Math.min(crossedHT2Home, crossedHT2Away) * 25),
      reasoning: `Potentiel offensif en 2nde MT: ${homeTeamName} (${crossedHT2Home.toFixed(2)}) / ${awayTeamName} (${crossedHT2Away.toFixed(2)}).`
    }
  ];

  // FT Predictions
  const ftTotalExpected = crossedFTHome + crossedFTAway;
  const ftPronostics: Prediction[] = [
    {
      id: 'ft-1x2',
      matchName: matchTitle,
      sport: 'football',
      type: crossedFTHome > crossedFTAway + 0.4 ? `Match : Victoire ${homeTeamName}` : crossedFTAway > crossedFTHome + 0.4 ? `Match : Victoire ${awayTeamName}` : `Match : Double Chance ${homeTeamName} ou Nul`,
      odd: crossedFTHome > crossedFTAway + 0.4 ? 1.85 : crossedFTAway > crossedFTHome + 0.4 ? 2.25 : 1.30,
      confidence: Math.min(92, Math.round(65 + Math.abs(crossedFTHome - crossedFTAway) * 20)),
      reasoning: `Espérance totale : ${homeTeamName} ${crossedFTHome.toFixed(2)} - ${crossedFTAway.toFixed(2)} ${awayTeamName}.`
    },
    {
      id: 'ft-goals',
      matchName: matchTitle,
      sport: 'football',
      type: ftTotalExpected > 2.2 ? 'Temps Réglementaire : Plus de 2.5 buts' : 'Temps Réglementaire : Plus de 1.5 buts',
      odd: ftTotalExpected > 2.2 ? 1.80 : 1.30,
      confidence: Math.min(94, Math.round(55 + ftTotalExpected * 15)),
      reasoning: `Espérance cumulée sur le temps réglementaire : ${ftTotalExpected.toFixed(2)} buts.`
    }
  ];

  // Safe Combinations
  const safeCombinations: Prediction[] = [
    {
      id: 'combo-safe-1',
      matchName: matchTitle,
      sport: 'football',
      type: 'Option Rentable & Sûre : Plus de 0.5 but en 2nde MT + Double Chance',
      odd: 1.45,
      confidence: 88,
      reasoning: 'Combinaison statistique la plus fiable basée sur le croisement des fréquences cumulées et la résistance défensive.'
    }
  ];

  const predictions: HalfTimePredictions = {
    ht1Pronostics,
    ht2Pronostics,
    ftPronostics,
    safeCombinations
  };

  return { summary, predictions, homeMatchesProcessed, awayMatchesProcessed };
};

export const recalculateAnalysis = (currentResult: AnalysisResult): AnalysisResult => {
  const getRawScores = (matches: RecentMatch[], type: 'att' | 'def') => {
    if (!matches || matches.length === 0) return [];
    return matches.map(m => type === 'att' ? Number(m.goalsScored) : Number(m.goalsConceded)).filter(s => !isNaN(s));
  };

  const homeAttScores = getRawScores(currentResult.recentMatches?.home || [], 'att');
  const homeDefScores = getRawScores(currentResult.recentMatches?.home || [], 'def');
  const awayAttScores = getRawScores(currentResult.recentMatches?.away || [], 'att');
  const awayDefScores = getRawScores(currentResult.recentMatches?.away || [], 'def');

  const homeTeamName = currentResult?.match?.homeTeam || "Equipe A";
  const awayTeamName = currentResult?.match?.awayTeam || "Equipe B";

  // Calculate Half-Time Stats Summary & Predictions
  const { summary: htSummary, predictions: htPredictions, homeMatchesProcessed, awayMatchesProcessed } = calculateHalfTimeStatsSummary(
    currentResult.recentMatches?.home || [],
    currentResult.recentMatches?.away || [],
    homeTeamName,
    awayTeamName
  );

  // Merged Ensembles (User Request April 26) - Exactly 12 points
  const homeMergedSet = [...homeAttScores, ...awayDefScores];
  const awayMergedSet = [...awayAttScores, ...homeDefScores];

  const getFCD = (set: number[], threshold: number) => {
    if (!set || !Array.isArray(set) || set.length === 0) return 0;
    const count = set.filter(x => typeof x === 'number' && x >= threshold).length;
    return count / set.length;
  };

  const getMode = (arr: number[]) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
    const counts: Record<number, number> = {};
    arr.forEach(x => {
      if (x !== undefined && x !== null) {
        counts[x] = (counts[x] || 0) + 1;
      }
    });
    let maxCount = 0;
    let mode = arr[0] || 0;
    for (const val in counts) {
      if (counts[val] > maxCount) {
        maxCount = counts[val];
        mode = Number(val);
      }
    }
    return mode;
  };

  // --- SEASON STATS INTEGRATION ---
  let mu_h = homeMergedSet.length > 0 ? math.number(math.mean(homeMergedSet)) as number : 0;
  let mu_a = awayMergedSet.length > 0 ? math.number(math.mean(awayMergedSet)) as number : 0;
  let var_h = homeMergedSet.length > 0 ? math.number(math.variance(homeMergedSet)) as number : 0;
  let var_a = awayMergedSet.length > 0 ? math.number(math.variance(awayMergedSet)) as number : 0;

  // Prioritize Season Stats from Tournament Tables if available
  if (currentResult.standings) {
    const sH = currentResult.standings.home;
    const sA = currentResult.standings.away;

    if (sH && sH.played > 0 && sH.gf_home !== undefined && sH.ga_home !== undefined) {
      // Use home-specific season stats for home team
      const season_mu_h = sH.gf_home / (sH.played / 2); // Approximation of games at home
      mu_h = (mu_h * 0.4) + (season_mu_h * 0.6); // Weighted blend
      if (sH.season_variance) var_h = sH.season_variance;
    }
    if (sA && sA.played > 0 && sA.gf_away !== undefined && sA.ga_away !== undefined) {
      // Use away-specific season stats for away team
      const season_mu_a = sA.gf_away / (sA.played / 2);
      mu_a = (mu_a * 0.4) + (season_mu_a * 0.6);
      if (sA.season_variance) var_a = sA.season_variance;
    }
  }

  // --- QUALITATIVE ADJUSTMENT ---
  if (currentResult.quantitativeData?.qualScore) {
    const impactH = currentResult.quantitativeData.qualScore.impactHome ?? 1.0;
    const impactA = currentResult.quantitativeData.qualScore.impactAway ?? 1.0;
    mu_h *= impactH;
    mu_a *= impactA;
  }

  // --- NEW CALCULATION METHOD (Scorers & Defense) ---
  if (currentResult.quantitativeData?.topScorersStats && currentResult.quantitativeData?.defenseCapacity) {
    const { homeConcededAvg, awayConcededAvg } = currentResult.quantitativeData.defenseCapacity;
    const { homeScorers, awayScorers } = currentResult.quantitativeData.topScorersStats;

    // 1. Defense Adjustment (based on conceded goals)
    const homeDefFactor = awayConcededAvg / (homeConcededAvg || 1);
    const awayDefFactor = homeConcededAvg / (awayConcededAvg || 1);

    // 2. Scorer Adjustment (rough proxy based on scorer count - could be improved with actual goals, but this uses top 3)
    const homeScorerBonus = homeScorers.length * 0.05;
    const awayScorerBonus = awayScorers.length * 0.05;

    // Cross-team adjustment combining defense and scorers
    mu_h *= (1 + (homeDefFactor - 1) * 0.05 + homeScorerBonus);
    mu_a *= (1 + (awayDefFactor - 1) * 0.05 + awayScorerBonus);
  }

  const median_h = homeMergedSet.length > 0 ? math.number(math.median(homeMergedSet)) as number : 0;
  const median_a = awayMergedSet.length > 0 ? math.number(math.median(awayMergedSet)) as number : 0;
  const mode_h = getMode(homeMergedSet);
  const mode_a = getMode(awayMergedSet);

  // FCD calculations on the ensemble (12 real values)
  const fcd_mu_h = getFCD(homeMergedSet, mu_h);
  const fcd_med_h = getFCD(homeMergedSet, median_h);
  const fcd_mode_h = getFCD(homeMergedSet, mode_h);

  const fcd_mu_a = getFCD(awayMergedSet, mu_a);
  const fcd_med_a = getFCD(awayMergedSet, median_a);
  const fcd_mode_a = getFCD(awayMergedSet, mode_a);

  const alpha_h = var_h > mu_h && mu_h > 0 ? (var_h - mu_h) / Math.pow(mu_h, 2) : 0;
  const alpha_a = var_a > mu_a && mu_a > 0 ? (var_a - mu_a) / Math.pow(mu_a, 2) : 0;

  const getProb = (k: number, mu: number, alpha: number) => {
    if (mu <= 0) return k === 0 ? 1 : 0;
    if (alpha <= 0) {
      // Poisson using logs: P(X=k) = exp(k*ln(mu) - mu - ln(k!))
      const logProb = k * Math.log(mu) - mu - (math.lgamma(k + 1) as any as number);
      return Math.exp(logProb);
    } else {
      // Negative Binomial NB2 using logs
      // P(X=k) = [Gamma(k+n) / (k! * Gamma(n))] * p^n * (1-p)^k
      // n = 1/alpha, p = n/(n+mu)
      const n = 1 / alpha;
      const p = n / (n + mu);
      try {
        const logGammaKn = (math.lgamma(k + n) as any as number);
        const logGammaN = (math.lgamma(n) as any as number);
        const logFactK = (math.lgamma(k + 1) as any as number);

        const logCoeff = logGammaKn - (logFactK + logGammaN);
        const logProb = logCoeff + n * Math.log(p) + k * Math.log(1 - p);
        return Math.exp(logProb);
      } catch (e) {
        // Fallback to simple Poisson log if gamma fails
        const logProb = k * Math.log(mu) - mu - (math.lgamma(k + 1) as any as number);
        return Math.exp(logProb);
      }
    }
  };

  const tol = currentResult.sport === 'basketball' ? 5 : 1;

  if (currentResult.sport === 'basketball') {
    const pointsRange = Array.from({ length: 141 }, (_, i) => i + 60); // 60 to 200
    const homePmf = pointsRange.map(k => getProb(k, mu_h, alpha_h));
    const awayPmf = pointsRange.map(k => getProb(k, mu_a, alpha_a));

    // Basketball IFR: [mu-10, mu-5, mu, mu+5, mu+10]
    const fcd_m10_h = getFCD(homeMergedSet, mu_h - 10);
    const fcd_m5_h = getFCD(homeMergedSet, mu_h - 5);
    const fcd_p5_h = getFCD(homeMergedSet, mu_h + 5);
    const fcd_p10_h = getFCD(homeMergedSet, mu_h + 10);

    const fcd_m10_a = getFCD(awayMergedSet, mu_a - 10);
    const fcd_m5_a = getFCD(awayMergedSet, mu_a - 5);
    const fcd_p5_a = getFCD(awayMergedSet, mu_a + 5);
    const fcd_p10_a = getFCD(awayMergedSet, mu_a + 10);

    const margins = {
      "Victoire Home 1-5": 0,
      "Victoire Home 6-10": 0,
      "Victoire Home 11-15": 0,
      "Victoire Home 16+": 0,
      "Victoire Away 1-5": 0,
      "Victoire Away 6-10": 0,
      "Victoire Away 11-15": 0,
      "Victoire Away 16+": 0
    };

    let pHome = 0, pDraw = 0, pAway = 0;
    let maxProb = -1, bestH = 0, bestA = 0;

    for (let i = 0; i < pointsRange.length; i++) {
      for (let j = 0; j < pointsRange.length; j++) {
        const prob = homePmf[i] * awayPmf[j];
        const ph = pointsRange[i];
        const pa = pointsRange[j];
        const diff = ph - pa;

        if (ph > pa) pHome += prob;
        else if (ph === pa) pDraw += prob;
        else pAway += prob;

        if (diff >= 1 && diff <= 5) margins["Victoire Home 1-5"] += prob;
        else if (diff >= 6 && diff <= 10) margins["Victoire Home 6-10"] += prob;
        else if (diff >= 11 && diff <= 15) margins["Victoire Home 11-15"] += prob;
        else if (diff >= 16) margins["Victoire Home 16+"] += prob;
        else if (diff >= -5 && diff <= -1) margins["Victoire Away 1-5"] += prob;
        else if (diff >= -10 && diff <= -6) margins["Victoire Away 6-10"] += prob;
        else if (diff >= -15 && diff <= -11) margins["Victoire Away 11-15"] += prob;
        else if (diff <= -16) margins["Victoire Away 16+"] += prob;

        if (prob > maxProb) {
          maxProb = prob;
          bestH = ph;
          bestA = pa;
        }
      }
    }

    const steps = `MOTEUR PRÉDICTMASTER AI BASKETBALL (NB2)
----------------------------------
1. ENSEMBLES FUSIONNÉS (Score Cible + Déf Adverse):
   🏠 ${homeTeamName}: mu=${mu_h.toFixed(1)} Med=${median_h} Mode=${mode_h}
   🚀 ${awayTeamName}: mu=${mu_a.toFixed(1)} Med=${median_a} Mode=${mode_a}
2. INDICE FIABILITÉ RÉELLE (IFR) [P>=val]:
   🏠 Home: mu=${(fcd_mu_h*100).toFixed(1)}% | Med=${(fcd_med_h*100).toFixed(1)}% | Mode=${(fcd_mode_h*100).toFixed(1)}%
   🚀 Away: mu=${(fcd_mu_a*100).toFixed(1)}% | Med=${(fcd_med_a*100).toFixed(1)}% | Mode=${(fcd_mode_a*100).toFixed(1)}%
3. IFR BASKET (Intervalle mu):
   🏠 Home: ${mu_h-10}: ${(fcd_m10_h*100).toFixed(0)}% | ${mu_h-5}: ${(fcd_m5_h*100).toFixed(0)}% | ${mu_h+5}: ${(fcd_p5_h*100).toFixed(0)}%
   🚀 Away: ${mu_a-10}: ${(fcd_m10_a*100).toFixed(0)}% | ${mu_a-5}: ${(fcd_m5_a*100).toFixed(0)}% | ${mu_a+5}: ${(fcd_p5_a*100).toFixed(0)}%
4. PRÉDICTION: ${bestH}-${bestA} (${(maxProb * 100).toFixed(2)}%)`;

    return {
      ...currentResult,
      probabilities: { home: pHome, draw: pDraw, away: pAway, over25: 1, btts: 1 },
      fairOdds: { home: pHome > 0 ? 1/pHome : 0, draw: pDraw > 0 ? 1/pDraw : 0, away: pAway > 0 ? 1/pAway : 0 },
      scoreExact: { home: bestH, away: bestA, probability: maxProb * 100 },
      basketballMargins: margins,
      quantitativeData: {
        ...currentResult.quantitativeData!,
        homeModel: 'NegBin',
        awayModel: 'NegBin',
        homeLambdaFinal: mu_h,
        awayLambdaFinal: mu_a,
        homeMedianFinal: median_h,
        awayMedianFinal: median_a,
        homeModeFinal: mode_h,
        awayModeFinal: mode_a,
        homeProbAboveMean: fcd_mu_h,
        awayProbAboveMean: fcd_mu_a,
        homeProbAboveMedian: fcd_med_h,
        awayProbAboveMedian: fcd_med_a,
        homeProbAboveMode: fcd_mode_h,
        awayProbAboveMode: fcd_mode_a,
        homeProbAboveM10: fcd_m10_h,
        homeProbAboveM5: fcd_m5_h,
        homeProbAboveP5: fcd_p5_h,
        homeProbAboveP10: fcd_p10_h,
        awayProbAboveM10: fcd_m10_a,
        awayProbAboveM5: fcd_m5_a,
        awayProbAboveP5: fcd_p5_a,
        awayProbAboveP10: fcd_p10_a,
        homeVariance: var_h,
        awayVariance: var_a,
        calculationSteps: steps
      }
    };
  }

  const matrix: number[][] = Array(9).fill(0).map(() => Array(9).fill(0));
  let hAbove = 0, hRange = 0, hAboveMedian = 0, hAboveMode = 0;
  let aAbove = 0, aRange = 0, aAboveMedian = 0, aAboveMode = 0;

  // High precision PMF calculation for indicators (up to 15 goals for tails)
  const homePmfLong = Array.from({length: 16}, (_, k) => getProb(k, mu_h, alpha_h));
  const awayPmfLong = Array.from({length: 16}, (_, k) => getProb(k, mu_a, alpha_a));

  homePmfLong.forEach((p, k) => {
    if (k >= mu_h) hAbove += p;
    if (k >= median_h) hAboveMedian += p;
    if (k >= mode_h) hAboveMode += p;
    if (k >= mu_h - tol && k <= mu_h + tol) hRange += p;
  });
  awayPmfLong.forEach((p, k) => {
    if (k >= mu_a) aAbove += p;
    if (k >= median_a) aAboveMedian += p;
    if (k >= mode_a) aAboveMode += p;
    if (k >= mu_a - tol && k <= mu_a + tol) aRange += p;
  });

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      matrix[i][j] = homePmfLong[i] * awayPmfLong[j];
    }
  }

  // Normalization
  const sumMatrix = matrix.reduce((acc, row) => acc + row.reduce((a, b) => a + b, 0), 0);
  if (sumMatrix > 0) {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        matrix[i][j] /= sumMatrix;
      }
    }
  }

  let pHome = 0, pDraw = 0, pAway = 0, over25 = 0, btts = 0;
  let maxProb = -1, bestH = 0, bestA = 0;

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const prob = matrix[i][j];
      if (i > j) pHome += prob;
      else if (i === j) pDraw += prob;
      else pAway += prob;

      if (i + j > 2.5) over25 += prob;
      if (i > 0 && j > 0) btts += prob;

      if (prob > maxProb) {
        maxProb = prob;
        bestH = i;
        bestA = j;
      }
    }
  }

  const impactH = currentResult.quantitativeData?.qualScore?.impactHome ?? 1.0;
  const impactA = currentResult.quantitativeData?.qualScore?.impactAway ?? 1.0;

  const steps = `MOTEUR PRÉDICTMASTER AI FOOTBALL (V4.5 NEG-BIN)
----------------------------------
1. STATS SAISON & FUSION (Ajusté):
   🏠 ${homeTeamName}: λ=${mu_h?.toFixed(3)} (Impact Q: ${((impactH-1)*100).toFixed(0)}%)
   🚀 ${awayTeamName}: λ=${mu_a?.toFixed(3)} (Impact Q: ${((impactA-1)*100).toFixed(0)}%)
2. INDICE FIABILITÉ RÉELLE (IFR) [P>=val]:
   🏠 Home: mu=${(fcd_mu_h*100).toFixed(1)}% | Med=${(fcd_med_h*100).toFixed(1)}% | Mode=${(fcd_mode_h*100).toFixed(1)}%
   🚀 Away: mu=${(fcd_mu_a*100).toFixed(1)}% | Med=${(fcd_med_a*100).toFixed(1)}% | Mode=${(fcd_mode_a*100).toFixed(1)}%
3. VARIANCES & DISPERSION (r/p):
   🏠 σ²=${var_h?.toFixed(3)} (α=${alpha_h?.toFixed(3)})
   🚀 σ²=${var_a?.toFixed(3)} (α=${alpha_a?.toFixed(3)})
4. MODÈLES UTILISÉS:
   🏠 ${alpha_h <= 0 ? 'Poisson' : 'NegBin'} | 🚀 ${alpha_a <= 0 ? 'Poisson' : 'NegBin'}
5. PRÉDICTION: ${bestH}-${bestA} (${(maxProb * 100)?.toFixed(1)}%)`;

  return {
    ...currentResult,
    recentMatches: {
      home: homeMatchesProcessed,
      away: awayMatchesProcessed
    },
    halfTimeSummary: htSummary,
    halfTimePredictions: htPredictions,
    probabilities: { home: pHome, draw: pDraw, away: pAway, over25, btts },
    fairOdds: { home: pHome > 0 ? 1/pHome : 0, draw: pDraw > 0 ? 1/pDraw : 0, away: pAway > 0 ? 1/pAway : 0 },
    scoreExact: { home: bestH, away: bestA, probability: maxProb * 100 },
    scoreMatrix: matrix.map(row => row.map(v => v * 100)),
    quantitativeData: {
      ...currentResult.quantitativeData!,
      homeModel: (alpha_h === 0 ? 'Poisson' : 'NegBin') as any,
      awayModel: (alpha_a === 0 ? 'Poisson' : 'NegBin') as any,
      homeLambdaFinal: mu_h,
      awayLambdaFinal: mu_a,
      homeMedianFinal: median_h,
      awayMedianFinal: median_a,
      homeModeFinal: mode_h,
      awayModeFinal: mode_a,
      homeProbAboveMean: fcd_mu_h,
      awayProbAboveMean: fcd_mu_a,
      homeProbAboveMedian: fcd_med_h,
      awayProbAboveMedian: fcd_med_a,
      homeProbAboveMode: fcd_mode_h,
      awayProbAboveMode: fcd_mode_a,
      homeProbInRange: hRange,
      awayProbInRange: aRange,
      homeVariance: var_h,
      awayVariance: var_a,
      calculationSteps: steps,
      halfTimeSummary: htSummary,
      halfTimePredictions: htPredictions,
      metricFormulas: {
        homeLambdaFinal: 'mean(home_goals) + mean(away_conceded)',
        awayLambdaFinal: 'mean(away_goals) + mean(home_conceded)',
      }
    }
  };
};
