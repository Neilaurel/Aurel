/**
 * Types globaux pour PredictMaster AI 2026
 */

export type Sport = 'football' | 'basketball';
export type View = 'analyze' | 'history' | 'bankroll' | 'settings' | 'coupon' | 'live' | 'explorer' | 'course' | 'logs' | 'firecrawl';
export type RiskProfile = 'conservative' | 'balanced' | 'aggressive';

export interface MatchInfo {
  homeTeam: string;
  awayTeam: string;
  date: string;
  timestamp: number;
  competition: string;
  odds: {
    home: number;
    draw?: number;
    away: number;
    [key: string]: any;
  };
}

export interface Prediction {
  id: string;
  matchName: string;
  sport: Sport;
  type: string;
  odd: number;
  confidence: number;
  reasoning: string;
  isValueBet?: boolean;
  edge?: number;
}

export interface ExpertOpinion {
  source: string;
  opinion: string;
  confidence: string;
}

export interface RecentMatch {
  date: string;
  opponent: string;
  score: string;
  goalsScored: number;
  goalsConceded: number;
  ht1Scored?: number;
  ht1Conceded?: number;
  ht2Scored?: number;
  ht2Conceded?: number;
  competition?: string;
  sourceUrl?: string;
  isOfficial?: boolean;
  result: 'W' | 'D' | 'L';
  isHome: boolean;
  timestamp?: number;
}

export interface HalfTimeStatsSummary {
  // Averages
  homeHT1ScoredAvg: number;
  homeHT1ConcededAvg: number;
  homeHT2ScoredAvg: number;
  homeHT2ConcededAvg: number;
  homeFTScoredAvg: number;
  homeFTConcededAvg: number;

  awayHT1ScoredAvg: number;
  awayHT1ConcededAvg: number;
  awayHT2ScoredAvg: number;
  awayHT2ConcededAvg: number;
  awayFTScoredAvg: number;
  awayFTConcededAvg: number;

  // Crossed Averages (Expected Goals = (Team Att + Opp Def) / 2)
  crossedHT1Home: number;
  crossedHT1Away: number;
  crossedHT2Home: number;
  crossedHT2Away: number;
  crossedFTHome: number;
  crossedFTAway: number;

  // FCD Scored & Conceded (>=1, >=2, >=3)
  fcdHomeScoredHT1: { g1: number; g2: number; g3: number };
  fcdHomeConcededHT1: { g1: number; g2: number; g3: number };
  fcdHomeScoredHT2: { g1: number; g2: number; g3: number };
  fcdHomeConcededHT2: { g1: number; g2: number; g3: number };
  fcdHomeScoredFT: { g1: number; g2: number; g3: number };
  fcdHomeConcededFT: { g1: number; g2: number; g3: number };

  fcdAwayScoredHT1: { g1: number; g2: number; g3: number };
  fcdAwayConcededHT1: { g1: number; g2: number; g3: number };
  fcdAwayScoredHT2: { g1: number; g2: number; g3: number };
  fcdAwayConcededHT2: { g1: number; g2: number; g3: number };
  fcdAwayScoredFT: { g1: number; g2: number; g3: number };
  fcdAwayConcededFT: { g1: number; g2: number; g3: number };

  // Crossed FCDs ((Team Scored FCD + Opp Conceded FCD) / 2)
  crossedFcdHT1Home: { g1: number; g2: number; g3: number };
  crossedFcdHT1Away: { g1: number; g2: number; g3: number };
  crossedFcdHT2Home: { g1: number; g2: number; g3: number };
  crossedFcdHT2Away: { g1: number; g2: number; g3: number };
  crossedFcdFTHome: { g1: number; g2: number; g3: number };
  crossedFcdFTAway: { g1: number; g2: number; g3: number };

  // Variances
  homeVarScoredHT1: number;
  homeVarConcededHT1: number;
  homeVarScoredHT2: number;
  homeVarConcededHT2: number;
  homeVarScoredFT: number;
  homeVarConcededFT: number;

  awayVarScoredHT1: number;
  awayVarConcededHT1: number;
  awayVarScoredHT2: number;
  awayVarConcededHT2: number;
  awayVarScoredFT: number;
  awayVarConcededFT: number;

  // Crossed Variances & Trust Check
  crossedVarHT1Home: number;
  crossedVarHT1Away: number;
  crossedVarHT2Home: number;
  crossedVarHT2Away: number;
  crossedVarFTHome: number;
  crossedVarFTAway: number;

  trustHT1Home: boolean;
  trustHT1Away: boolean;
  trustHT2Home: boolean;
  trustHT2Away: boolean;

  // Ascendance / Dominance Indicator
  ascendanceHT1Home: string; // e.g. "Attaque Domicile domine (+0.35)"
  ascendanceHT1Away: string;
  ascendanceHT2Home: string;
  ascendanceHT2Away: string;
  ascendanceFTHome: string;
  ascendanceFTAway: string;
}

export interface HalfTimePredictions {
  ht1Pronostics: Prediction[];
  ht2Pronostics: Prediction[];
  ftPronostics: Prediction[];
  safeCombinations: Prediction[];
}

export interface LogStep {
  time: string;
  action: string;
  details?: string;
  type: 'info' | 'error' | 'decision' | 'ai_reasoning' | 'warning';
}

export interface AnalysisLog {
  id: string;
  timestamp: number;
  matchName: string;
  steps: LogStep[];
}

export interface AnalysisResult {
  id: string;
  timestamp: number;
  userId?: string;
  sport: Sport;
  match: MatchInfo;
  predictions: Prediction[];
  expertOpinions: ExpertOpinion[];
  formAnalysis: string;
  h2hAnalysis: string;
  absencesAnalysis: string;
  playerAnalysis: string;
  summary: string;
  scoreExact?: { home: number; away: number; probability: number };
  fairOdds?: { home: number; draw: number; away: number };
  probabilities?: {
    home: number;
    draw: number;
    away: number;
    over25: number;
    btts: number;
  };
  leverage?: { home: number; away: number };
  weather?: { condition: string; temp: number; impact: string };
  referee?: { name: string; cardsPerMatch: number; impact: string };
  sources?: { name: string; url: string }[];
  recentMatches?: {
    home: RecentMatch[];
    away: RecentMatch[];
  };
  scoreMatrix?: number[][] | string;
  quantitativeData?: {
    halfTimeStats?: { homeHT: string; awayHT: string; };
    topScorersStats?: { homeScorers: string[]; awayScorers: string[]; };
    defenseCapacity?: { homeConcededAvg: number; awayConcededAvg: number; };
    homeModel: 'Poisson' | 'NegBin';
    awayModel: 'Poisson' | 'NegBin';
    homeLambdaAtt: number;
    homeLambdaDef: number;
    awayLambdaAtt: number;
    awayLambdaDef: number;
    homeLambdaFinal: number;
    awayLambdaFinal: number;
    homeMedianFinal?: number;
    awayMedianFinal?: number;
    homeModeFinal?: number;
    awayModeFinal?: number;
    homeProbAboveMean?: number;
    homeProbAboveMedian?: number;
    homeProbAboveMode?: number;
    homeProbAboveM10?: number;
    homeProbAboveM5?: number;
    homeProbAboveP5?: number;
    homeProbAboveP10?: number;
    awayProbAboveMean?: number;
    awayProbAboveMedian?: number;
    awayProbAboveMode?: number;
    awayProbAboveM10?: number;
    awayProbAboveM5?: number;
    awayProbAboveP5?: number;
    awayProbAboveP10?: number;
    homeProbInRange?: number;
    awayProbInRange?: number;
    homeVariance: number;
    awayVariance: number;
    homeR: number | null;
    awayR: number | null;
    h2hApplied: boolean;
    dcApplied: boolean;
    weightedScores: {
      home: number[];
      away: number[];
      weights: number[];
    };
    qualScore: {
      home: number;
      away: number;
      verdict: string;
      impactHome?: number; // % adjustment (e.g. 0.9 for -10% if key player missing)
      impactAway?: number;
    };
    notes: string;
    calculationSteps?: string;
      metricFormulas?: { [key: string]: string };
      halfTimeSummary?: HalfTimeStatsSummary;
      halfTimePredictions?: HalfTimePredictions;
    };
  halfTimeSummary?: HalfTimeStatsSummary;
  halfTimePredictions?: HalfTimePredictions;
  qualitativePredictions?: Prediction[];
  h2hMatches?: { date: string; home: string; away: string; score: string; goalsHome: number; goalsAway: number; competition?: string; timestamp?: number }[];
  basketballMargins?: {
    [key: string]: number;
  };
  standings?: {
    home: {
      rank: number;
      points: number;
      played: number;
      gf_total?: number;
      ga_total?: number;
      gf_home?: number;
      ga_home?: number;
      season_variance?: number;
      alert: string | null
    };
    away: {
      rank: number;
      points: number;
      played: number;
      gf_total?: number;
      ga_total?: number;
      gf_away?: number;
      ga_away?: number;
      season_variance?: number;
      alert: string | null
    };
  };
  qualitative?: {
    absences: string;
    momentum: string;
    referee: string;
    filtersIntelligence?: {
      trapGame: string;
      paceStyle: string;
      meteoTerrain: string;
      climatSocial: string;
    };
    contreExpertise: {
      alerteContradiction: string;
      impactEffectif: string;
      facteurMotivation: string;
      fatigueVoyage: string;
      verdictFinalQuali: string;
    };
  };
  marketSelection?: {
    market: string;
    priority: string;
    readability: number;
    risk: string;
    reasoning: string;
  }[];
  isBatch?: boolean;
  batchIds?: string[]; // IDs of individual match analyses in this batch
  comboReport?: string;
  report?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  debugPrompts?: {
    collector: string;
    analyzer: string;
    report: string;
  };
}

export interface CouponItem {
  prediction: Prediction;
  match: MatchInfo;
}

export interface Bet {
  id: string;
  userId?: string;
  matchId: string;
  matchName: string;
  prediction: string;
  odd: number;
  stake: number;
  status: 'pending' | 'won' | 'lost';
  score?: string;
  timestamp: number;
  sport: Sport;
  isCombined?: boolean;
}

export interface BalanceSnapshot {
  timestamp: number;
  balance: number;
}

export interface Bankroll {
  balance: number;
  initialBalance: number;
  lockedBalance: number;
  currency: string;
  savingsGoal: number;
  dailyTargetOdd: number;
  maxTicketsPerDay: number;
  maxEventsPerCoupon: number;
  minConfidence: number;
  riskProfile: RiskProfile;
  adaptiveMode: boolean;
  balanceHistory: BalanceSnapshot[];
}
