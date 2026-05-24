import { Fixture, NewsArticle, LeaderboardUser, QuizQuestion } from "./types";

export const FIXTURES_DATA: Fixture[] = [
  {
    id: "f1",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    homeLogo: "🔴",
    awayLogo: "🔵",
    league: "Premier League",
    matchTime: "16:30",
    date: "Today",
    homeProb: 58,
    drawProb: 24,
    awayProb: 18,
    predictedScore: "2 - 1",
    oddsHome: 1.72,
    oddsDraw: 3.80,
    oddsAway: 4.50,
    bttsOdds: { yes: 1.65, no: 2.10 },
    overUnderOdds: { over: 1.70, under: 2.15 },
    analysis: "Arsenal is currently on a 4-game winning streak at Emirates Stadium, averaging 2.4 goals per home game. Chelsea has struggled with defensive transitions, conceding in 80% of their away fixtures this season. Suggesting Home Win or Over 2.5 goals."
  },
  {
    id: "f2",
    homeTeam: "Real Madrid",
    awayTeam: "Barcelona",
    homeLogo: "⚪",
    awayLogo: "🔵🔴",
    league: "La Liga (El Clasico)",
    matchTime: "20:00",
    date: "Today",
    homeProb: 46,
    drawProb: 28,
    awayProb: 26,
    predictedScore: "3 - 2",
    oddsHome: 2.10,
    oddsDraw: 3.60,
    oddsAway: 3.20,
    bttsOdds: { yes: 1.48, no: 2.50 },
    overUnderOdds: { over: 1.55, under: 2.40 },
    analysis: "El Clásico promises fire. Real Madrid has won 3 of their last 4 encounters, with both teams scoring in all of them. Bellingham is in stellar scoring form, whereas Barcelona is boosted by Lewandoski's return. BTTS (Both Teams To Score) is highly backed here."
  },
  {
    id: "f3",
    homeTeam: "Inter Milan",
    awayTeam: "AC Milan",
    homeLogo: "⚫🔵",
    awayLogo: "🔴⚫",
    league: "Serie A (Milan Derby)",
    matchTime: "19:45",
    date: "Tomorrow",
    homeProb: 44,
    drawProb: 31,
    awayProb: 25,
    predictedScore: "1 - 1",
    oddsHome: 2.05,
    oddsDraw: 3.30,
    oddsAway: 3.60,
    bttsOdds: { yes: 1.80, no: 1.95 },
    overUnderOdds: { over: 1.90, under: 1.80 },
    analysis: "A tactical chess match in San Siro. Inter has the best defensive record in the league, conceding just 0.8 goals per match. AC Milan likes to play on the counter-attack. A low-scoring draw or Under 2.5 goals looks probable."
  },
  {
    id: "f4",
    homeTeam: "Bayern Munich",
    awayTeam: "Dortmund",
    homeLogo: "🔴⚪",
    awayLogo: "🟡⚫",
    league: "Bundesliga (Der Klassiker)",
    matchTime: "15:30",
    date: "Tomorrow",
    homeProb: 65,
    drawProb: 19,
    awayProb: 16,
    predictedScore: "4 - 2",
    oddsHome: 1.45,
    oddsDraw: 4.80,
    oddsAway: 5.75,
    bttsOdds: { yes: 1.35, no: 3.10 },
    overUnderOdds: { over: 1.38, under: 2.90 },
    analysis: "Bayern Munich has dominated recent home matches against Dortmund, with an average score line of 3.8 goals. Both sides are extremely offensive-minded. Bet on Over 3.5 goals for maximum security or Bayern Munich and Over 2.5."
  },
  {
    id: "f5",
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    homeLogo: "🩵",
    awayLogo: "🔴",
    league: "Premier League",
    matchTime: "12:30",
    date: "In 3 Days",
    homeProb: 52,
    drawProb: 25,
    awayProb: 23,
    predictedScore: "2 - 2",
    oddsHome: 1.85,
    oddsDraw: 3.90,
    oddsAway: 3.80,
    bttsOdds: { yes: 1.50, no: 2.40 },
    overUnderOdds: { over: 1.60, under: 2.30 },
    analysis: "A titanic clash that usually decides title races. Both managers prefer high intensity presses. Man City is undefeated at home this season, but Liverpool's counter-press could exploit City's defensive injuries. BTTS and Draw are popular bets."
  },
  {
    id: "f6",
    homeTeam: "Paris Saint-Germain",
    awayTeam: "Marseille",
    homeLogo: "🔵🔴",
    awayLogo: "⚪🩵",
    league: "Ligue 1",
    matchTime: "20:45",
    date: "In 4 Days",
    homeProb: 70,
    drawProb: 18,
    awayProb: 12,
    predictedScore: "3 - 0",
    oddsHome: 1.33,
    oddsDraw: 5.25,
    oddsAway: 8.50,
    bttsOdds: { yes: 1.75, no: 2.00 },
    overUnderOdds: { over: 1.45, under: 2.55 },
    analysis: "PSG has kept 4 clean sheets in their last 5 matchups against Marseille in Paris. With their lightning-fast wingers back, Marseille is going to have a hard time defending wide areas. Suggest PSG -1 Handicap."
  }
];

export const NEWS_DATA: NewsArticle[] = [
  {
    id: "n1",
    title: "Weekend Betting Value Spots: Unveiling Bookmakers' Blindspots",
    category: "tips",
    excerpt: "Our team of analysts breakdown three high-margin matches in the EFL Championship and Serie A where the odds don't match standard models.",
    time: "2 hours ago",
    reads: 1450,
    likes: 240,
    tags: ["Betting Strategy", "EFL", "Serie A"],
    content: "When analyzing weekend match loads, we look for discrepancies between the statistical expected goals (xG) metrics and official prices preset by major retail bookmakers. This week, we found incredible value in the Leeds vs Blackburn fixture where Leeds is heavily overpriced to win to-nil. Additionally, in Serie A, Bologna is showing extreme home-field resilience that makes their draw or double chance price highly favorable against Juventus, who are coming off a grueling midweek European trek."
  },
  {
    id: "n2",
    title: "Champions League Injury Update: Key Defensive Backline Fractures",
    category: "news",
    excerpt: "How crucial injuries to primary center-backs will alter odds in upcoming European Quarter-Final matchups.",
    time: "4 hours ago",
    reads: 920,
    likes: 110,
    tags: ["UCL", "Injuries", "Pre-Match"],
    content: "Injury updates are essential components of soccer modeling. With Real Madrid losing their chief defensive marshal to a late training strain, their odds have widened from 1.95 down to 2.15 against Manchester City. Punters should observe the Over 3.0 Asian Goal Line structure since both squads will field secondary central defenders under heavy tactical press."
  },
  {
    id: "n3",
    title: "Mastering Double Chance & Handicap Bet Slips",
    category: "tips",
    excerpt: "Learn how professional analytical bet-slippers use Double Chance combinations to protect their bankrolls of 10x accumulators.",
    time: "1 day ago",
    reads: 4320,
    likes: 812,
    tags: ["Punting Guide", "Accumulators", "Bankroll Management"],
    content: "Many beginners chase high 100x accumulators that have less than a 1% math chance of hitting. Successful professional tipsters focus on low leg volume (e.g., duplicates or triplicates) leveraging 'Double Chance (1X or X2)' and 'Draw No Bet (DNB)' to build consistent, sustainable profit margins. Read our masterclass series to adjust your bet slip strategies."
  }
];

export const LEADERBOARD_DATA: LeaderboardUser[] = [
  { rank: 1, username: "SlipperLegend_99", points: 2850, winRate: "84.2%", activeStreak: 7 },
  { rank: 2, username: "FixSport_Predictor", points: 2610, winRate: "79.5%", activeStreak: 4 },
  { rank: 3, username: "CornerKingExpress", points: 2450, winRate: "81.0%", activeStreak: 5 },
  { rank: 4, username: "DailyBetsMaster", points: 2320, winRate: "76.4%", activeStreak: 3 },
  { rank: 5, username: "UnderdogVandal", points: 2190, winRate: "73.2%", activeStreak: 0 }
];

export const QUIZ_DATA: QuizQuestion[] = [
  {
    id: "q1",
    question: "What does the betting term 'Draw No Bet' (DNB) mean?",
    options: [
      "The bet wins only if the match ends in a draw",
      "If the match results in a draw, your stake is returned/refunded",
      "The bet fails if either team scores a goal",
      "You win double your stake if there is no draw"
    ],
    correctIndex: 1,
    explanation: "'Draw No Bet' removes the option of a draw, allowing you to bet on a Home or Away win. If the score ends level, your bet is voided and your full stake is returned."
  },
  {
    id: "q2",
    question: "Which of the following European decimal odds gives a higher return?",
    options: ["1.50", "2.10", "1.95", "1.80"],
    correctIndex: 1,
    explanation: "Decimal odds calculate total payout recursively (Stake * Odds). Thus, 2.10 yields a return of $210 on a $100 bet, which is higher than the other options."
  },
  {
    id: "q3",
    question: "If a game has over/under 2.5 goals line, how many goals must be scored for 'Over' to win?",
    options: [
      "Exactly 2 goals",
      "2 goals or fewer",
      "3 goals or more",
      "At least 5 goals"
    ],
    correctIndex: 2,
    explanation: "An Over 2.5 line requires 3 or more total goals (e.g., 2-1, 3-0, 2-2) for the bet to be a winner, as 2.5 is the half-goal partition."
  }
];
