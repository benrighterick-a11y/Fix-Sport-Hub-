export interface Fixture {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  league: string;
  matchTime: string;
  date: string;
  homeProb: number; // e.g. 55 for 55%
  drawProb: number; // e.g. 25
  awayProb: number; // e.g. 20
  predictedScore: string; // e.g. "2 - 1"
  oddsHome: number; // e.g. 1.85
  oddsDraw: number; // e.g. 3.40
  oddsAway: number; // e.g. 4.20
  bttsOdds: { yes: number; no: number };
  overUnderOdds: { over: number; under: number };
  analysis: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: "news" | "analysis" | "tips" | "transfer";
  excerpt: string;
  content?: string;
  time: string;
  reads: number;
  likes: number;
  tags: string[];
}

export interface LeaderboardUser {
  rank: number;
  username: string;
  points: number;
  winRate: string;
  activeStreak: number;
}

export interface BetLeg {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  predictionType: "1" | "X" | "2" | "BTTS_YES" | "BTTS_NO" | "OVER" | "UNDER";
  predictionLabel: string;
  odds: number;
}

export interface PollVote {
  fixtureId: string;
  userVote?: "1" | "X" | "2";
  votes: {
    home: number;
    draw: number;
    away: number;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}
