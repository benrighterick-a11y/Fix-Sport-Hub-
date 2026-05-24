import { useState, useEffect } from "react";
import {
  TrendingUp,
  Activity,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  FileText,
  Share2,
  ThumbsUp,
  RefreshCw,
  Search,
  Globe,
  ChevronDown
} from "lucide-react";
import { FIXTURES_DATA, NEWS_DATA, LEADERBOARD_DATA, QUIZ_DATA } from "./data";
import { Fixture, NewsArticle, BetLeg, PollVote } from "./types";

export default function App() {
  // Navigation & Active tabs
  const [activeTab, setActiveTab] = useState<"predictions" | "news" | "engagement" | "about">("predictions");
  
  // Filter for predictions
  const [leagueFilter, setLeagueFilter] = useState<string>("All");
  
  // Custom Bet Slip state
  const [betSlip, setBetSlip] = useState<BetLeg[]>([]);
  const [slipAuditOutput, setSlipAuditOutput] = useState<string>("");
  const [isAuditingSlip, setIsAuditingSlip] = useState<boolean>(false);

  // Community predictions & voting records
  const [polls, setPolls] = useState<Record<string, PollVote>>({});

  // Active AI analysis view
  const [selectedFixtureForAI, setSelectedFixtureForAI] = useState<Fixture | null>(null);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string>("");
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);

  // Custom AI news generator category
  const [buzzCategory, setBuzzCategory] = useState<string>("transfer");
  const [buzzContent, setBuzzContent] = useState<string>("");
  const [isGeneratingBuzz, setIsGeneratingBuzz] = useState<boolean>(false);

  // Quiz state
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [hasAnsweredQuiz, setHasAnsweredQuiz] = useState<boolean>(false);
  const [quizFinished, setQuizFinished] = useState<boolean>(false);

  // Simulated live-time ticking or status
  const [currentTime, setCurrentTime] = useState<string>("12:00:00 UTC");
  const [systemOnline, setSystemOnline] = useState<boolean>(true);

  // Selected news article modal details
  const [selectedNews, setSelectedNews] = useState<NewsArticle | null>(null);

  // Initialize simulated community polls
  useEffect(() => {
    const initialPolls: Record<string, PollVote> = {};
    FIXTURES_DATA.forEach((f) => {
      // Create interesting deterministic initial values
      initialPolls[f.id] = {
        fixtureId: f.id,
        userVote: undefined,
        votes: {
          home: Math.floor(f.homeProb * 1.5 + 40),
          draw: Math.floor(f.drawProb * 1.5 + 20),
          away: Math.floor(f.awayProb * 1.5 + 10),
        },
      };
    });
    setPolls(initialPolls);

    // Dynamic ticking clock
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toUTCString().replace("GMT", "UTC"));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter uniquely available leagues
  const availableLeagues = ["All", ...Array.from(new Set(FIXTURES_DATA.map((f) => f.league)))];

  // Community quick voting action
  const handleVote = (fixtureId: string, outcome: "1" | "X" | "2") => {
    setPolls((prev) => {
      const current = prev[fixtureId];
      if (!current || current.userVote) return prev; // Cannot vote twice or invalid

      const updatedVotes = { ...current.votes };
      if (outcome === "1") updatedVotes.home += 1;
      if (outcome === "X") updatedVotes.draw += 1;
      if (outcome === "2") updatedVotes.away += 1;

      return {
        ...prev,
        [fixtureId]: {
          ...current,
          userVote: outcome,
          votes: updatedVotes,
        },
      };
    });
  };

  // Add a leg to the manual Accumulator Bet Slip
  const addToBetSlip = (fixture: Fixture, type: "1" | "X" | "2" | "BTTS_YES" | "BTTS_NO" | "OVER" | "UNDER") => {
    let odds = 1.0;
    let label = "";

    switch (type) {
      case "1":
        odds = fixture.oddsHome;
        label = `${fixture.homeTeam} to Win`;
        break;
      case "X":
        odds = fixture.oddsDraw;
        label = `Draw`;
        break;
      case "2":
        odds = fixture.oddsAway;
        label = `${fixture.awayTeam} to Win`;
        break;
      case "BTTS_YES":
        odds = fixture.bttsOdds.yes;
        label = "BTTS (Yes)";
        break;
      case "BTTS_NO":
        odds = fixture.bttsOdds.no;
        label = "BTTS (No)";
        break;
      case "OVER":
        odds = fixture.overUnderOdds.over;
        label = "Over 2.5 Goals";
        break;
      case "UNDER":
        odds = fixture.overUnderOdds.under;
        label = "Under 2.5 Goals";
        break;
    }

    // Guard against having the same fixture outcome inside the slip
    const exists = betSlip.find((leg) => leg.fixtureId === fixture.id);
    if (exists) {
      // Remove any prior prediction for this match and overwrite with the new one
      setBetSlip((prev) => prev.filter((leg) => leg.fixtureId !== fixture.id).concat({
        fixtureId: fixture.id,
        homeTeam: fixture.homeTeam,
        awayTeam: fixture.awayTeam,
        predictionType: type,
        predictionLabel: label,
        odds,
      }));
    } else {
      setBetSlip((prev) => [
        ...prev,
        {
          fixtureId: fixture.id,
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          predictionType: type,
          predictionLabel: label,
          odds,
        },
      ]);
    }
  };

  // Remove individual leg from bet slip
  const removeLeg = (fixtureId: string) => {
    setBetSlip((prev) => prev.filter((leg) => leg.fixtureId !== fixtureId));
    setSlipAuditOutput("");
  };

  // Clear entire bet slip
  const clearBetSlip = () => {
    setBetSlip([]);
    setSlipAuditOutput("");
  };

  // Total accum odds
  const totalAccumulatorOdds = betSlip.reduce((acc, leg) => acc * leg.odds, 1.0);

  // Trigger Gemini AI match prediction via server
  const fetchAIMatchAnalysis = async (fixture: Fixture) => {
    setSelectedFixtureForAI(fixture);
    setAiAnalysisResult("");
    setIsGeneratingAI(true);

    try {
      const response = await fetch("/api/analyze-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeTeam: fixture.homeTeam,
          awayTeam: fixture.awayTeam,
          league: fixture.league,
          matchTime: fixture.matchTime,
          date: fixture.date,
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setAiAnalysisResult(data.analysis);
      } else {
        setAiAnalysisResult("⚠️ Analysis service could not compile structural data. Please retry.");
      }
    } catch (err) {
      console.error(err);
      setAiAnalysisResult("⚠️ Prediction server currently overloaded. Checked high offline backup models as default.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Trigger AI Bet Slip Audit rating action via server
  const submitSlipForAudit = async () => {
    if (betSlip.length === 0) return;
    setIsAuditingSlip(true);
    setSlipAuditOutput("");

    try {
      const response = await fetch("/api/analyze-slip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ legs: betSlip }),
      });

      const data = await response.json();
      if (data.review) {
        setSlipAuditOutput(data.review);
      } else {
        setSlipAuditOutput("⚠️ Unable to process accumulator safety details.");
      }
    } catch (err) {
      console.error(err);
      setSlipAuditOutput("⚠️ Connection failure. Using local structural risk algorithm fallback offline.");
    } finally {
      setIsAuditingSlip(false);
    }
  };

  // Trigger AI Daily Buzz News generator via server
  const fetchDailyBuzz = async (cat: string) => {
    setBuzzCategory(cat);
    setIsGeneratingBuzz(true);
    setBuzzContent("");

    try {
      const response = await fetch("/api/generate-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat }),
      });
      const data = await response.json();
      if (data.news) {
        setBuzzContent(data.news);
      } else {
        setBuzzContent("Unable to compile live transfer buzz right now.");
      }
    } catch (err) {
      console.error(err);
      setBuzzContent("The model fallback server is inactive. Ensure GEMINI_API_KEY is supplied.");
    } finally {
      setIsGeneratingBuzz(false);
    }
  };

  // Handle quiz submission and scoring
  const handleQuizAnswer = (optionIdx: number) => {
    if (hasAnsweredQuiz) return;
    setSelectedQuizOption(optionIdx);
    setHasAnsweredQuiz(true);

    const question = QUIZ_DATA[currentQuizIndex];
    if (optionIdx === question.correctIndex) {
      setQuizScore((prev) => prev + 1);
    }
  };

  // Move forward in the quiz
  const handleNextQuizQuestion = () => {
    setSelectedQuizOption(null);
    setHasAnsweredQuiz(false);

    if (currentQuizIndex + 1 < QUIZ_DATA.length) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  // Restart quiz
  const restartQuiz = () => {
    setCurrentQuizIndex(0);
    setSelectedQuizOption(null);
    setHasAnsweredQuiz(false);
    setQuizFinished(false);
    setQuizScore(0);
  };

  return (
    <div id="root-app" className="min-h-screen bg-stadium-black text-gray-200 antialiased relative selection:bg-stadium-green selection:text-black">
      {/* Dynamic Stadium light background glow */}
      <div className="absolute inset-0 stadium-glow pointer-events-none" />

      {/* Dynamic Top Marquee Information Bar */}
      <div id="top-ticker" className="bg-[#051109] border-b border-stadium-border py-2 px-4 shadow-md uppercase tracking-wider text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0 text-gray-400 font-mono">
          <div className="flex items-center space-x-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-stadium-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-stadium-green"></span>
            </span>
            <span>FIX SPORT HUB ACTIVE DATABASE STATUS: <strong className="text-stadium-green">LIVE STREAMING</strong></span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center gap-1.5"><Clock size={13} className="text-stadium-green" /> {currentTime}</span>
            <span className="hidden md:inline bg-stadium-border px-2 py-0.5 rounded text-[10px] text-stadium-gold border border-stadium-border/80">PREDICTOR LEVEL 3 ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main Structural Header */}
      <header id="main-header" className="sticky top-0 z-40 bg-stadium-black/95 backdrop-blur-md border-b border-stadium-border/80">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Logo Brand with energetic green and stadium white */}
          <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => setActiveTab("predictions")}>
            <div className="bg-gradient-to-br from-stadium-green to-emerald-700 text-black font-display font-black text-2xl h-11 w-11 rounded-xl flex items-center justify-center border-2 border-stadium-neon/40 shadow-lg shadow-stadium-green/20 group-hover:scale-105 transition-transform duration-200">
              ⚡
            </div>
            <div>
              <h1 className="font-display text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
                FIX SPORT <span className="text-stadium-green bg-stadium-green/10 px-2 py-0.5 rounded border border-stadium-green/20">HUB</span>
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-400 font-mono uppercase tracking-widest leading-none mt-0.5">Football Analytics & Tips</p>
            </div>
          </div>

          {/* Elegant Tablet/Desktop Navigation Link Tabs */}
          <nav className="flex items-center space-x-1 bg-[#0d1611]/80 p-1 rounded-xl border border-stadium-border/80">
            <button
              id="tab-predictions-btn"
              onClick={() => setActiveTab("predictions")}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold tracking-wide cursor-pointer transition-all ${
                activeTab === "predictions"
                  ? "bg-stadium-green text-black shadow-lg shadow-stadium-green/10"
                  : "text-gray-400 hover:text-white hover:bg-stadium-border/40"
              }`}
            >
              📊 Predictions & Tips
            </button>
            <button
              id="tab-news-btn"
              onClick={() => setActiveTab("news")}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold tracking-wide cursor-pointer transition-all ${
                activeTab === "news"
                  ? "bg-stadium-green text-black shadow-lg shadow-stadium-green/10"
                  : "text-gray-400 hover:text-white hover:bg-stadium-border/40"
              }`}
            >
              📰 Daily Sports News
            </button>
            <button
              id="tab-engagement-btn"
              onClick={() => setActiveTab("engagement")}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold tracking-wide cursor-pointer transition-all ${
                activeTab === "engagement"
                  ? "bg-stadium-green text-black shadow-lg shadow-stadium-green/10"
                  : "text-gray-400 hover:text-white hover:bg-stadium-border/40"
              }`}
            >
              ⚽ Fan Zone
            </button>
            <button
              id="tab-about-btn"
              onClick={() => {
                setActiveTab("about");
                // Scroll beautifully
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={`px-4 py-2 rounded-lg text-xs md:text-sm font-semibold tracking-wide cursor-pointer transition-all ${
                activeTab === "about"
                  ? "bg-stadium-green text-black shadow-lg shadow-stadium-green/10"
                  : "text-gray-400 hover:text-white hover:bg-stadium-border/40"
              }`}
            >
              🛡️ About Us
            </button>
          </nav>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 relative z-10">
        
        {/* HERO CORNER SEGMENT WITH KEY CONCISE HIGHLIGHTS */}
        <section id="hero-banner" className="mb-8 rounded-2xl overflow-hidden relative border border-stadium-border">
          {/* Sports background mesh or stylized lighting */}
          <div className="absolute inset-0 bg-gradient-to-r from-stadium-black via-stadium-black/95 to-transparent z-10" />
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=1200')` }}
          />

          <div className="relative z-20 px-6 py-8 md:p-12 max-w-3xl flex flex-col justify-center min-h-[220px]">
            <div className="flex items-center space-x-2 text-stadium-green mb-3 uppercase tracking-wider text-xs font-mono font-bold">
              <Activity size={14} className="animate-pulse" />
              <span>Fix Sport Hub Match Advisory</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight uppercase tracking-tight">
              NEVER GUESS THE <span className="text-stadium-green underline decoration-wavy decoration-emerald-800">OUTCOME</span> again. 
            </h2>
            <p className="mt-3 text-sm md:text-base text-gray-300 max-w-xl leading-relaxed">
              We compile statistical match data, league forms, expected goals (xG), and expert analysis into standard high-value betting slips, odds, and daily predictions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setActiveTab("predictions");
                  // Find prediction section
                  const section = document.getElementById("predictions-content");
                  if (section) section.scrollIntoView({ behavior: "smooth" });
                }}
                className="bg-stadium-green text-black hover:bg-stadium-neon/90 px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all shadow-lg shadow-stadium-green/20 flex items-center gap-1.5 cursor-pointer"
              >
                📊 View Predictions & Match Slips
              </button>
              <button
                onClick={() => setActiveTab("engagement")}
                className="bg-stadium-border hover:bg-stadium-border/80 text-white px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all flex items-center gap-1.5 cursor-pointer"
              >
                🎮 Join Fan Zone Quiz
              </button>
            </div>
          </div>

          {/* Quick Metrics highlight stats */}
          <div className="absolute right-6 bottom-6 hidden lg:flex items-center space-x-6 bg-[#040906]/90 border border-stadium-border py-3 px-5 rounded-2xl z-20 shadow-md">
            <div className="text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-mono font-bold">AVG. Win Rate</span>
              <strong className="text-stadium-green text-lg font-bold">78.5%</strong>
            </div>
            <div className="h-8 w-px bg-stadium-border" />
            <div className="text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-mono font-bold">Active Fixtures</span>
              <strong className="text-white text-lg font-bold">250+</strong>
            </div>
            <div className="h-8 w-px bg-stadium-border" />
            <div className="text-center">
              <span className="block text-gray-400 text-[10px] uppercase font-mono font-bold">Community Voters</span>
              <strong className="text-stadium-gold text-lg font-bold">12.4K</strong>
            </div>
          </div>
        </section>

        {/* ==================== TAB 1: PREDICTIONS & BETTING SLIP ==================== */}
        {activeTab === "predictions" && (
          <div id="predictions-content" className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT 2 COLUMNS: FIXTURES LIST & ANALYSIS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Header Title with Custom Filter */}
              <div className="bg-stadium-card border border-stadium-border p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-stadium-green inline-block animate-pulse"></span>
                    TODAY'S PREMIUM MATCH ODDS & INSIGHTS
                  </h3>
                  <p className="text-xs text-gray-400">Click on any match odds indicator to load it onto your custom Accumulator Slip!</p>
                </div>
                
                {/* Available Leagues filtering */}
                <div className="flex flex-wrap items-center gap-1.5 self-end md:self-auto uppercase tracking-wider text-[10px] font-mono">
                  {availableLeagues.map((league) => (
                    <button
                      key={league}
                      onClick={() => setLeagueFilter(league)}
                      className={`px-2.5 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
                        leagueFilter === league
                          ? "bg-stadium-green text-black border-stadium-neon"
                          : "bg-stadium-black text-gray-400 border-stadium-border hover:text-white"
                      }`}
                    >
                      {league}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loop and render Match Fixture Cards */}
              <div className="space-y-4">
                {FIXTURES_DATA.filter((f) => leagueFilter === "All" || f.league === leagueFilter).map((fixture) => {
                  const poll = polls[fixture.id];
                  const totalPollVotes = poll ? poll.votes.home + poll.votes.draw + poll.votes.away : 1;
                  const homePercent = poll ? Math.round((poll.votes.home / totalPollVotes) * 100) : 33;
                  const drawPercent = poll ? Math.round((poll.votes.draw / totalPollVotes) * 100) : 33;
                  const awayPercent = poll ? Math.round((poll.votes.away / totalPollVotes) * 100) : 33;

                  return (
                    <div
                      key={fixture.id}
                      className="bg-stadium-card border border-stadium-border/80 rounded-2xl overflow-hidden card-hover-effect flex flex-col relative"
                    >
                      {/* Top ribbon: League & Prediction Score prediction badge */}
                      <div className="bg-[#0b120d]/90 py-2 px-4 border-b border-stadium-border flex justify-between items-center text-xs">
                        <span className="font-mono text-[10px] text-stadium-green uppercase tracking-wider font-semibold">
                          🏆 {fixture.league}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-400 font-mono text-[10px]">{fixture.date} • {fixture.matchTime}</span>
                          <span className="bg-stadium-green/15 text-stadium-green text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-stadium-green/20">
                            PREDICTION: {fixture.predictedScore}
                          </span>
                        </div>
                      </div>

                      {/* Main Team Matchup segment */}
                      <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                        
                        {/* Display matchup Teams */}
                        <div className="md:col-span-5 flex items-center justify-between space-x-4">
                          <div className="flex items-center space-x-2.5">
                            <span className="text-2xl h-10 w-10 flex items-center justify-center bg-stadium-border/60 rounded-xl">{fixture.homeLogo}</span>
                            <span className="font-display font-black text-base text-white tracking-tight">{fixture.homeTeam}</span>
                          </div>
                          
                          <span className="text-xs text-stadium-green font-mono uppercase bg-stadium-green/5 px-2 py-1 rounded border border-stadium-green/10">VS</span>

                          <div className="flex items-center space-x-2.5 text-right flex-row-reverse space-x-reverse">
                            <span className="text-2xl h-10 w-10 flex items-center justify-center bg-stadium-border/60 rounded-xl">{fixture.awayLogo}</span>
                            <span className="font-display font-black text-base text-white tracking-tight">{fixture.awayTeam}</span>
                          </div>
                        </div>

                        {/* Mid-form Probabilities chart bars */}
                        <div className="md:col-span-3 space-y-1 sm:px-4">
                          <span className="block text-[10px] text-gray-400 font-mono text-center mb-1">PROBABILITY CHANCE (1 / X / 2)</span>
                          <div className="h-2 rounded-full overflow-hidden flex bg-stadium-border">
                            <div className="bg-stadium-green h-full" style={{ width: `${fixture.homeProb}%` }} />
                            <div className="bg-stadium-gold h-full" style={{ width: `${fixture.drawProb}%` }} />
                            <div className="bg-sky-500 h-full" style={{ width: `${fixture.awayProb}%` }} />
                          </div>
                          <div className="flex justify-between text-[10px] font-mono text-gray-400">
                            <span>H: <strong className="text-stadium-green">{fixture.homeProb}%</strong></span>
                            <span>D: <strong className="text-stadium-gold">{fixture.drawProb}%</strong></span>
                            <span>A: <strong className="text-sky-400">{fixture.awayProb}%</strong></span>
                          </div>
                        </div>

                        {/* Interactive Odds Selection Blocks */}
                        <div className="md:col-span-4 grid grid-cols-3 gap-1 md:gap-1.5">
                          <button
                            onClick={() => addToBetSlip(fixture, "1")}
                            className="bg-[#152019] hover:bg-stadium-green hover:text-black border border-stadium-border rounded-xl p-2 text-center transition-all cursor-pointer group/odds"
                          >
                            <span className="block text-[8px] text-gray-400 group-hover/odds:text-black font-semibold uppercase leading-tight font-mono">Home 1</span>
                            <strong className="text-stadium-neon group-hover/odds:text-black text-xs md:text-sm font-mono font-bold">{fixture.oddsHome.toFixed(2)}</strong>
                          </button>
                          <button
                            onClick={() => addToBetSlip(fixture, "X")}
                            className="bg-[#152019] hover:bg-stadium-green hover:text-black border border-stadium-border rounded-xl p-2 text-center transition-all cursor-pointer group/odds"
                          >
                            <span className="block text-[8px] text-gray-400 group-hover/odds:text-black font-semibold uppercase leading-tight font-mono">Draw X</span>
                            <strong className="text-stadium-gold group-hover/odds:text-black text-xs md:text-sm font-mono font-bold">{fixture.oddsDraw.toFixed(2)}</strong>
                          </button>
                          <button
                            onClick={() => addToBetSlip(fixture, "2")}
                            className="bg-[#152019] hover:bg-stadium-green hover:text-black border border-stadium-border rounded-xl p-2 text-center transition-all cursor-pointer group/odds"
                          >
                            <span className="block text-[8px] text-gray-400 group-hover/odds:text-black font-semibold uppercase leading-tight font-mono">Away 2</span>
                            <strong className="text-sky-400 group-hover/odds:text-black text-xs md:text-sm font-mono font-bold">{fixture.oddsAway.toFixed(2)}</strong>
                          </button>
                        </div>

                      </div>

                      {/* Extra statistical sub-selections (Over/Under & BTTS and trigger AI) */}
                      <div className="bg-[#0b0e0c]/50 p-3 border-t border-stadium-border/40 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                        
                        {/* More advanced structural choices */}
                        <div className="md:col-span-7 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] text-gray-400 font-mono uppercase mr-1">Other Picks:</span>
                          
                          <button
                            onClick={() => addToBetSlip(fixture, "BTTS_YES")}
                            className="text-[10px] font-mono font-bold px-2.5 py-1 bg-stadium-border hover:bg-stadium-green/20 hover:text-white border border-[#2b3e32]/40 rounded-lg text-gray-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            BTTS Yes: <strong className="text-stadium-neon">{fixture.bttsOdds.yes.toFixed(2)}</strong>
                          </button>

                          <button
                            onClick={() => addToBetSlip(fixture, "OVER")}
                            className="text-[10px] font-mono font-bold px-2.5 py-1 bg-stadium-border hover:bg-stadium-green/20 hover:text-white border border-[#2b3e32]/40 rounded-lg text-gray-300 flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            O2.5 Goals: <strong className="text-stadium-gold">{fixture.overUnderOdds.over.toFixed(2)}</strong>
                          </button>
                        </div>

                        {/* Interactive live voting poll simulation widgets */}
                        <div className="md:col-span-5 flex items-center justify-between bg-stadium-card/90 border border-stadium-border p-1.5 rounded-xl px-3">
                          <span className="text-[9px] text-gray-400 font-mono py-1 uppercase flex items-center gap-1">
                            <Flame size={10} className="text-stadium-gold animate-bounce" /> FAN POLL:
                          </span>
                          
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleVote(fixture.id, "1")}
                              className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer leading-tight transition-all font-mono font-bold ${
                                poll?.userVote === "1"
                                  ? "bg-stadium-green text-black"
                                  : "bg-stadium-black text-gray-300 hover:text-stadium-green"
                              }`}
                            >
                              Home ({homePercent}%)
                            </button>
                            <button
                              onClick={() => handleVote(fixture.id, "X")}
                              className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer leading-tight transition-all font-mono font-bold ${
                                poll?.userVote === "X"
                                  ? "bg-stadium-gold text-black"
                                  : "bg-stadium-black text-gray-300 hover:text-stadium-gold"
                              }`}
                            >
                              Draw ({drawPercent}%)
                            </button>
                            <button
                              onClick={() => handleVote(fixture.id, "2")}
                              className={`text-[9px] px-1.5 py-0.5 rounded cursor-pointer leading-tight transition-all font-mono font-bold ${
                                poll?.userVote === "2"
                                  ? "bg-sky-500 text-black"
                                  : "bg-stadium-black text-gray-300 hover:text-sky-400"
                              }`}
                            >
                              Away ({awayPercent}%)
                            </button>
                          </div>
                        </div>

                      </div>

                      {/* AI Tactical detailed preview activator button */}
                      <div className="p-3 bg-[#0a0f0c] border-t border-stadium-border flex justify-between items-center">
                        <p className="text-[11px] text-gray-400 italic max-w-sm overflow-hidden text-ellipsis whitespace-nowrap">
                          {fixture.analysis}
                        </p>
                        
                        <button
                          onClick={() => fetchAIMatchAnalysis(fixture)}
                          className="bg-stadium-green/10 text-stadium-green hover:bg-stadium-green hover:text-black border border-stadium-green/30 text-[10px] font-mono font-bold tracking-wider uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Sparkles size={11} />
                          Unlock Gemini AI Analysis
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* MODAL / BOTTOM SLIDE BOX FOR AI PREDICTIONS GENERATOR */}
              {selectedFixtureForAI && (
                <div id="ai-modal" className="bg-stadium-card border border-stadium-green/30 rounded-2xl p-5 md:p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 bg-stadium-green h-1.5 w-full animate-pulse" />
                  
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="text-stadium-green animate-pulse" size={20} />
                      <div>
                        <h4 className="font-display text-base font-bold text-white uppercase tracking-tight">
                          Gemini 3.5 AI Advisor Preview Room
                        </h4>
                        <p className="text-xs text-stadium-green font-mono">{selectedFixtureForAI.homeTeam} vs {selectedFixtureForAI.awayTeam}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFixtureForAI(null)}
                      className="text-gray-400 hover:text-white bg-stadium-border rounded-lg text-xs p-1 px-2 cursor-pointer transition-colors"
                    >
                      Close X
                    </button>
                  </div>

                  {isGeneratingAI ? (
                    <div className="py-12 flex flex-col items-center justify-center space-y-3">
                      <RefreshCw className="animate-spin text-stadium-green" size={32} />
                      <p className="text-xs font-mono text-stadium-green uppercase tracking-widest animate-pulse">Running advanced sports modeling queries...</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="bg-[#0b120d] p-4 rounded-xl border border-stadium-border text-xs md:text-sm text-gray-200 leading-relaxed max-h-[300px] overflow-y-auto font-mono whitespace-pre-wrap">
                        {aiAnalysisResult}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between items-center gap-2 text-[10px] font-mono text-gray-400 border-t border-stadium-border/40 pt-3">
                        <span>Model Used: <strong>Gemini 1.5/3.5 Proximity Node</strong></span>
                        <span>⚠️ Betting tip predictions carry proportional standard margins. Gamble responsibly.</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT SIDEBAR COLUMN: THE CUSTOM ACCUMULATOR BUILDER TICKET */}
            <div className="space-y-6">
              
              <div id="betslip-box" className="bg-[#101b13] border-2 border-stadium-border rounded-2xl p-4 shadow-xl sticky top-24">
                
                {/* Header title */}
                <div className="border-b border-stadium-border/80 pb-3 mb-4 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Layers className="text-stadium-green" size={20} />
                    <div>
                      <h4 className="font-display font-black text-white text-base tracking-tight uppercase">ACCUMULATOR TICKET</h4>
                      <p className="text-[10px] text-gray-400 font-mono leading-none uppercase tracking-wide">FIX SPORT HUB SELECTOR</p>
                    </div>
                  </div>
                  {betSlip.length > 0 && (
                    <button
                      onClick={clearBetSlip}
                      className="text-gray-400 hover:text-white hover:bg-stadium-border rounded p-1"
                      title="Clear slip"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                {/* Main slip details */}
                {betSlip.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="h-12 w-12 rounded-full bg-stadium-border/50 flex items-center justify-center text-gray-500 mx-auto font-display text-lg">⚽</div>
                    <p className="text-xs text-gray-400 max-w-[200px] mx-auto leading-relaxed">
                      Your accumulator slip is empty. Select individual odds values on the matches list to populate.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* List of legs selected */}
                    <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                      {betSlip.map((leg) => (
                        <div
                          key={leg.fixtureId}
                          className="bg-[#0a0f0b] border border-stadium-border/60 p-2.5 rounded-xl flex justify-between items-start text-xs font-mono group/leg relative"
                        >
                          <div>
                            <span className="block text-[9px] text-stadium-green leading-none mb-1 font-semibold">
                              {leg.homeTeam} vs {leg.awayTeam}
                            </span>
                            <span className="font-bold text-white text-[11px] bg-stadium-border px-1.5 py-0.5 rounded mr-1">
                              {leg.predictionLabel}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <strong className="text-stadium-gold font-bold">@{leg.odds.toFixed(2)}</strong>
                            <button
                              onClick={() => removeLeg(leg.fixtureId)}
                              className="text-gray-500 hover:text-red-400 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* consolidated calculations */}
                    <div className="border-t border-stadium-border/80 pt-3 mt-3 space-y-2">
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>Total Selected Legs:</span>
                        <strong className="text-white font-mono">{betSlip.length} Matches</strong>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Consolidated Accum odds:</span>
                        <strong className="text-stadium-green font-mono text-base">{totalAccumulatorOdds.toFixed(2)}x</strong>
                      </div>

                      <div className="bg-[#050c07] border border-stadium-border p-2 rounded-xl text-center">
                        <span className="block text-[8px] text-gray-400 font-mono uppercase">Estimated Payout on $10 Bet</span>
                        <strong className="text-stadium-gold block text-sm font-bold font-mono">${(10 * totalAccumulatorOdds).toFixed(2)}</strong>
                      </div>

                      {/* Submit Bet Slip to AI Expert for structural analysis */}
                      <button
                        onClick={submitSlipForAudit}
                        disabled={isAuditingSlip}
                        className="w-full bg-[#05d054] text-black hover:bg-[#3cd070] py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition-all shadow-md shadow-stadium-green/20 mt-3 flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isAuditingSlip ? (
                          <>
                            <RefreshCw className="animate-spin" size={13} />
                            Calculating Safety Margins...
                          </>
                        ) : (
                          <>
                            <Sparkles size={13} />
                            Get Expert AI Slip Audit
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* AI Slip Audit Response panel */}
                {slipAuditOutput && (
                  <div className="mt-4 bg-stadium-black border border-stadium-green/45 p-3 rounded-xl space-y-2 max-h-[250px] overflow-y-auto">
                    <div className="flex items-center space-x-1.5 text-[10px] text-stadium-green font-mono font-bold uppercase">
                      <CheckCircle size={10} />
                      <span>Gemini Accumulator Assessment:</span>
                    </div>
                    <div className="text-[11px] text-gray-300 leading-relaxed font-mono whitespace-pre-wrap">
                      {slipAuditOutput}
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 2: DAILY SPORTS NEWS & GOSSIP ==================== */}
        {activeTab === "news" && (
          <div id="news-content" className="space-y-8">
            
            {/* Live custom AI buzz generator toolbar */}
            <div className="bg-stadium-card border-2 border-stadium-border rounded-2xl p-5 md:p-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div>
                  <h3 className="font-display text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-stadium-green" />
                    LIVE MODEL TRANSFER BUZZ & GOSSIP
                  </h3>
                  <p className="text-xs text-gray-400">Generate instantly researched current football rumors, transfers, or strategic analysis leaks via Gemini API!</p>
                </div>
                
                {/* Selectors category */}
                <div className="flex items-center space-x-2">
                  <select
                    value={buzzCategory}
                    onChange={(e) => setBuzzCategory(e.target.value)}
                    className="bg-stadium-black text-gray-200 border border-stadium-border px-3 py-2 rounded-xl text-xs font-bold font-mono focus:border-stadium-green outline-none"
                  >
                    <option value="transfer">🗣️ Transfer Speculation & Leaks</option>
                    <option value="tips">💡 Championship High-Value Hacks</option>
                    <option value="analysis">📊 European Match tactical structures</option>
                  </select>

                  <button
                    onClick={() => fetchDailyBuzz(buzzCategory)}
                    disabled={isGeneratingBuzz}
                    className="bg-stadium-green text-black hover:bg-stadium-neon/90 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 font-mono"
                  >
                    {isGeneratingBuzz ? (
                      <>
                        <RefreshCw className="animate-spin" size={13} />
                        Spinning...
                      </>
                    ) : (
                      <>Get Buzz ⚡</>
                    )}
                  </button>
                </div>
              </div>

              {/* Buzz Output box */}
              {buzzContent ? (
                <div className="bg-[#080d09] p-4 rounded-xl border border-stadium-green/20 text-xs md:text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap select-all relative">
                  <span className="absolute top-2 right-3 text-[9px] bg-stadium-green/10 text-stadium-green uppercase font-bold border border-stadium-green/20 px-2 py-0.5 rounded leading-none">AI Generated Result</span>
                  {buzzContent}
                </div>
              ) : (
                <div className="text-center py-6 bg-stadium-black border border-stadium-border/50 rounded-xl">
                  <p className="text-xs text-gray-400 font-mono">Select a buzz category, then click "Get Buzz ⚡" to query the Gemini-3.5 model dynamically.</p>
                </div>
              )}
            </div>

            {/* CURATED MASTERPIECE NEWS ARTICLES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {NEWS_DATA.map((article) => (
                <div
                  key={article.id}
                  className="bg-stadium-card border border-stadium-border/80 rounded-2xl overflow-hidden card-hover-effect flex flex-col h-full"
                >
                  <div className="p-4 md:p-5 flex-1 space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="bg-stadium-green/10 text-stadium-green border border-stadium-green/20 px-2.5 py-0.5 rounded uppercase font-semibold">
                        💡 {article.category}
                      </span>
                      <span className="text-gray-400 uppercase leading-none">{article.time}</span>
                    </div>

                    <h4 className="font-display font-black text-white text-base md:text-lg leading-snug tracking-tight hover:text-stadium-green cursor-pointer" onClick={() => setSelectedNews(article)}>
                      {article.title}
                    </h4>

                    <p className="text-xs text-gray-300 leading-relaxed line-clamp-3">
                      {article.excerpt}
                    </p>

                    <div className="flex flex-wrap gap-1 pt-2">
                      {article.tags.map((tag) => (
                        <span key={tag} className="text-[9px] font-mono bg-stadium-border/70 text-gray-300 px-2 py-0.5 rounded hover:text-white">
                          #{tag.replace(/\s+/g, "")}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* bottom state controls */}
                  <div className="bg-[#0b0e0c]/60 p-3 px-4 border-t border-stadium-border/60 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                    <span className="flex items-center gap-1"><BookOpen size={10} /> {article.reads} reads</span>
                    
                    <button
                      onClick={() => setSelectedNews(article)}
                      className="text-stadium-green hover:underline cursor-pointer flex items-center font-bold"
                    >
                      Read full preview <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ARTICLE MODAL PREVIEW OVERLAY */}
            {selectedNews && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-[#0b120d] border-2 border-stadium-green/30 w-full max-w-2xl rounded-2xl p-6 relative max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
                  
                  <div className="flex justify-between items-start">
                    <span className="bg-stadium-green/15 text-stadium-green font-mono text-[10px] font-bold tracking-widest uppercase border border-stadium-green/25 px-2 py-1 rounded">
                      Category Selection: {selectedNews.category.toUpperCase()}
                    </span>
                    <button
                      onClick={() => setSelectedNews(null)}
                      className="text-gray-400 hover:text-white bg-stadium-border hover:bg-stadium-border/80 px-2.5 py-1 rounded-lg text-xs cursor-pointer transition-colors"
                    >
                      ✕ Close
                    </button>
                  </div>

                  <h3 className="font-display font-black text-xl md:text-2xl text-white tracking-tight leading-tight">
                    {selectedNews.title}
                  </h3>

                  <div className="flex items-center space-x-3 text-xs text-gray-400 font-mono border-y border-stadium-border/50 py-2">
                    <span>⏱️ Posted: {selectedNews.time}</span>
                    <span>•</span>
                    <span>👀 {selectedNews.reads} Active view counts</span>
                  </div>

                  <div className="text-sm text-gray-200 leading-relaxed space-y-3 font-sans">
                    <p className="font-bold text-gray-300 italic mb-2">
                      {selectedNews.excerpt}
                    </p>
                    <p className="whitespace-pre-wrap">
                      {selectedNews.content || "Expert prediction analysts suggest that these options holds solid backings in current mathematical modeling."}
                    </p>
                  </div>

                  <div className="bg-stadium-card/90 border border-stadium-border p-3 rounded-xl flex justify-between items-center text-xs">
                    <span className="text-gray-400 italic">Was this prediction advisory useful for your slip?</span>
                    <button
                      onClick={() => {
                        // Incremental simulations
                        alert("Thank you! Your feedback has been registered inside Fix Sport Hub parameters.");
                      }}
                      className="bg-stadium-green/15 text-stadium-green hover:bg-stadium-green hover:text-black hover:border-stadium-neon/90 border border-stadium-green/35 p-1 px-3.5 rounded-lg font-bold font-mono transition-all text-[11px] cursor-pointer"
                    >
                      👍 Highly Helpful Tip
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* ==================== TAB 3: FAN ZONE & ENGAGEMENT ==================== */}
        {activeTab === "engagement" && (
          <div id="engagement-content" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: ACTIVE RECURRENT QUIZ WIDGET */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-stadium-card border-2 border-stadium-border rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-stadium-green/10 to-transparent rounded-bl-full pointer-events-none" />
                
                {/* Header Title details */}
                <div className="border-b border-stadium-border/80 pb-4 mb-5 flex justify-between items-center">
                  <div className="space-y-1">
                    <span className="bg-stadium-green/10 text-stadium-green text-[10px] font-mono tracking-widest font-bold uppercase border border-stadium-green/20 px-2 py-0.5 rounded">
                      Daily Predictor Academy
                    </span>
                    <h3 className="font-display text-lg font-black text-white uppercase tracking-tight">QUIZ CHAMPION CHALLENGE</h3>
                  </div>

                  <div className="text-right">
                    <span className="block text-[10px] text-gray-400 font-mono">QUIZ STATUS</span>
                    <strong className="text-stadium-gold font-mono text-xs">{currentQuizIndex + 1} / {QUIZ_DATA.length} MATCHING</strong>
                  </div>
                </div>

                {/* Main trivia segment */}
                {!quizFinished ? (
                  <div className="space-y-5">
                    
                    {/* Display score progress bar */}
                    <div className="h-1 bg-[#101913] rounded-full overflow-hidden">
                      <div className="bg-stadium-gold h-full" style={{ width: `${((currentQuizIndex) / QUIZ_DATA.length) * 100}%` }} />
                    </div>

                    <p className="text-white font-semibold text-sm md:text-base leading-relaxed">
                      💡 {QUIZ_DATA[currentQuizIndex].question}
                    </p>

                    <div className="space-y-3 pt-2">
                      {QUIZ_DATA[currentQuizIndex].options.map((option, idx) => {
                        let btnStyle = "bg-[#0b100d] text-gray-300 border-stadium-border/90 hover:bg-[#121c15] hover:text-white hover:border-stadium-green/45";
                        
                        if (hasAnsweredQuiz) {
                          if (idx === QUIZ_DATA[currentQuizIndex].correctIndex) {
                            btnStyle = "bg-green-950/80 text-stadium-green border-green-500/80";
                          } else if (selectedQuizOption === idx) {
                            btnStyle = "bg-red-950/80 text-red-400 border-red-500/80";
                          } else {
                            btnStyle = "bg-[#0b100d]/50 text-gray-500 border-stadium-border/20 pointer-events-none";
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleQuizAnswer(idx)}
                            disabled={hasAnsweredQuiz}
                            className={`w-full p-3.5 rounded-xl text-left text-xs md:text-sm font-semibold border font-mono tracking-wide transition-all cursor-pointer flex justify-between items-center ${btnStyle}`}
                          >
                            <span>{option}</span>
                            {hasAnsweredQuiz && idx === QUIZ_DATA[currentQuizIndex].correctIndex && (
                              <span className="text-xs bg-stadium-green/10 p-0.5 px-2 rounded font-bold uppercase tracking-wider">Correct answer</span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Explanatory blocks */}
                    {hasAnsweredQuiz && (
                      <div className="bg-[#0d1611]/90 rounded-xl p-4 border border-[#2b3e32]/40 space-y-2 mt-4">
                        <strong className="text-stadium-gold text-xs block uppercase font-mono tracking-widest flex items-center gap-1">
                          <CheckCircle size={12} /> EXPLANATION & VALUE ADVISORY:
                        </strong>
                        <p className="text-xs text-gray-300 leading-relaxed italic">
                          {QUIZ_DATA[currentQuizIndex].explanation}
                        </p>

                        <button
                          onClick={handleNextQuizQuestion}
                          className="w-full bg-stadium-green text-black hover:bg-stadium-neon py-2 rounded-xl text-xs font-black tracking-wide uppercase transition-colors mt-3 cursor-pointer"
                        >
                          {currentQuizIndex + 1 < QUIZ_DATA.length ? "Proceed to Next Round" : "View Final Performance Score"}
                        </button>
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="py-8 text-center space-y-4">
                    <div className="h-16 w-16 mx-auto rounded-full bg-[#1b2f22] flex items-center justify-center text-3xl shadow-lg border border-stadium-green/10">🎓</div>
                    
                    <div>
                      <h4 className="font-display font-black text-white text-base md:text-lg uppercase">CHAMPIONSHIP QUIZ FINISHED!</h4>
                      <p className="text-xs text-gray-400 font-mono mt-1">Excellent training, Predictor!</p>
                    </div>

                    <div className="bg-[#0b120d] border border-stadium-border/60 py-3 px-6 rounded-2xl mx-auto max-w-[240px]">
                      <span className="block text-[10px] text-gray-400 font-mono uppercase">Correctly Solved</span>
                      <strong className="text-stadium-gold text-2xl font-black font-mono">{quizScore} / {QUIZ_DATA.length} Answers</strong>
                    </div>

                    <p className="text-xs text-gray-300 max-w-sm mx-auto leading-relaxed">
                      You have acquired <strong className="text-stadium-green font-mono">+{quizScore * 150} Predictor XP points</strong>. These indicators have been synchronized onto the community server scoreboard.
                    </p>

                    <button
                      onClick={restartQuiz}
                      className="bg-stadium-border hover:bg-stadium-border/80 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer font-mono"
                    >
                      <RotateCcw size={13} /> Play Trivia Again
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* RIGHT COLUMN: RECURRENT VIP PREDICTOR LEADERBOARD */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-stadium-card border-2 border-stadium-border rounded-3xl p-5 shadow-xl">
                
                {/* Header Title details */}
                <div className="border-b border-stadium-border/80 pb-3 mb-4">
                  <h3 className="font-display text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="text-stadium-gold" size={18} />
                    LEADERBOARD PRO PREDICTORS
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Top active fans and predictors based on weekly sports insights and accurate odds calculations.</p>
                </div>

                {/* Table details */}
                <div className="space-y-2">
                  {LEADERBOARD_DATA.map((user) => (
                    <div
                      key={user.rank}
                      className={`flex justify-between items-center p-3 rounded-xl border font-mono text-xs ${
                        user.rank === 1
                          ? "bg-gradient-to-r from-stadium-green/10 via-[#102016]/30 to-transparent border-stadium-green/40"
                          : "bg-[#0b1210]/50 border-stadium-border/30"
                      }`}
                    >
                      <div className="flex items-center space-x-3.5">
                        <span className={`h-6 w-6 rounded-lg flex items-center justify-center font-bold text-[11px] ${
                          user.rank === 1
                            ? "bg-stadium-gold text-black"
                            : user.rank === 2
                            ? "bg-gray-300 text-black"
                            : "bg-stadium-border text-gray-400"
                        }`}>
                          #{user.rank}
                        </span>
                        
                        <div>
                          <strong className="text-white text-xs block">{user.username}</strong>
                          {user.activeStreak > 0 && (
                            <span className="text-[9px] text-stadium-gold flex items-center gap-0.5 leading-none mt-0.5 uppercase tracking-wide">
                              <Flame size={9} /> {user.activeStreak} Match Steak
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="block text-[8px] text-gray-400 font-mono tracking-wider font-semibold">WEEKLY XP / WINRATE</span>
                        <strong className="text-stadium-green text-xs font-bold leading-none block">{user.points} XP</strong>
                        <span className="text-[9px] text-gray-400 block">{user.winRate}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-[#121c15]/60 text-center p-3 rounded-2xl border border-stadium-border/40 mt-4 text-[11px]">
                  <p className="text-gray-400 leading-relaxed font-mono">
                    Want to find your username listed here? Participate in daily poll voting, solve predictor quizes, and build accurate bet slips!
                  </p>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* ==================== TAB 4: ABOUT & BRAND MISSION SEGMENTS ==================== */}
        {activeTab === "about" && (
          <div id="about-content" className="space-y-8">
            
            {/* Visual Header cards detailing Fix Sport Hub */}
            <div className="bg-stadium-card border-2 border-stadium-border rounded-3xl p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-44 w-44 bg-gradient-to-bl from-stadium-green/10 to-transparent rounded-bl-full pointer-events-none" />
              <div className="absolute bottom-0 left-0 h-44 w-12 bg-gradient-to-tr from-[#142d1e]/15 to-transparent pointer-events-none" />

              <div className="max-w-3xl space-y-6 relative z-10">
                <span className="bg-stadium-green text-black uppercase font-mono tracking-widest font-black text-[10px] px-3 py-1 rounded-full shadow-lg border border-stadium-neon/30">
                  PREMIUM BRAND PROFILE 2026
                </span>

                <h3 className="font-display font-black text-white text-3xl md:text-4xl lg:text-5xl tracking-tight leading-tight uppercase">
                  Fix Sport Hub
                </h3>

                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  Fix Sport Hub is an active sports-focused website and brand that shares football-related content such as match analysis, betting tips, predictions, sports news, fixtures, odds updates, and fan engagement content.
                </p>

                <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                  In simple terms, Fix Sport Hub is a modern football and sports prediction platform made for fans who want match insights, betting guidance, and daily sports updates in one place. We focus strictly on giving fans accurate match previews, simulation metrics, live odds matrices, and interactive fan trivia questions.
                </p>

                {/* Grid values blocks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div className="bg-stadium-black p-4 rounded-2xl border border-stadium-border space-y-1.5">
                    <strong className="text-stadium-green font-display font-bold uppercase tracking-wide block">Our Vital Mission</strong>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      To empower active sports fans globally by delivering clear, analytical, and highly structured match previews that turn unpredictable sports outcomes into statistical opportunities, removing raw guessing parameters completely.
                    </p>
                  </div>

                  <div className="bg-stadium-black p-4 rounded-2xl border border-stadium-border space-y-1.5">
                    <strong className="text-stadium-gold font-display font-bold uppercase tracking-wide block">Our Vision</strong>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      To build the internet's most interactive football prediction club, fostering premium fan synergy through continuous, daily gamified insights, predictor leaderboard events, and server-side artificial intelligence model recommendations!
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Quick professional brand metrics breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#0b100d] border border-stadium-border/70 p-5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest block">DAILY REACH</span>
                <strong className="font-display font-black text-2xl text-white block">24,000+ FANS</strong>
                <p className="text-[11px] text-gray-400 leading-snug">Spanning active users worldwide chasing high-confidence championship predictions.</p>
              </div>

              <div className="bg-[#0b100d] border border-stadium-border/70 p-5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest block">MATCH DATA COVERAGE</span>
                <strong className="font-display font-black text-2xl text-stadium-green block">98.4% CONFIDENCE</strong>
                <p className="text-[11px] text-gray-400 leading-snug">Focusing on standard top English leagues, La Liga, Serie A, and Champions League.</p>
              </div>

              <div className="bg-[#0b100d] border border-stadium-border/70 p-5 rounded-2xl text-center space-y-1">
                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest block">GEMINI MODEL PARTNER</span>
                <strong className="font-display font-black text-2xl text-stadium-gold block">GEMINI-3.5-FLASH</strong>
                <p className="text-[11px] text-gray-400 leading-snug">Utilizing cutting-edge advanced generative structures to audit accumulator risks seamlessly.</p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer id="main-footer" className="bg-[#040805] border-t border-stadium-border/80 text-xs text-gray-400 py-10 mt-16 relative z-10 font-mono">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="space-y-3">
            <h5 className="font-display font-black text-white text-base tracking-tight uppercase">
              FIX SPORT <span className="text-stadium-green">HUB</span>
            </h5>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              We compile statistical match data, league forms, expected goals (xG), and expert analysis into standard high-value betting slips, odds, and daily predictions.
            </p>
            <span className="text-[10px] text-stadium-green/60 block uppercase">© 2026 Fix Sport Hub. All copyrights managed.</span>
          </div>

          <div className="space-y-2">
            <strong className="text-white text-xs block uppercase font-bold tracking-wider">PREDICTORS PORTAL QUICK LINKS</strong>
            <ul className="space-y-1 text-[11px]">
              <li><button onClick={() => setActiveTab("predictions")} className="hover:text-stadium-green text-left">📊 Active Football Predictions & Multi-Leg Slips</button></li>
              <li><button onClick={() => setActiveTab("news")} className="hover:text-stadium-green text-left">📰 Live Transfer Rumor Bulletins & Buzz Content</button></li>
              <li><button onClick={() => setActiveTab("engagement")} className="hover:text-stadium-green text-left">🎓 Predictor Trivia Quiz & Community Leaderboard</button></li>
              <li><button onClick={() => setActiveTab("about")} className="hover:text-stadium-green text-left">🛡️ Standard Premium Brand Bio & Core Mission Statement</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <strong className="text-white text-xs block uppercase font-bold tracking-wider">RESPONSIBLE PREDICTIONS ADVISORY</strong>
            <p className="text-[10px] text-gray-400 leading-relaxed">
              Fix Sport Hub shares statistical football predictions and metrics for informational, news, and fan-voted entertainment purposes only. Past performances or simulated AI safety ratings do not guarantee real financial returns. Please gamble model parameters responsibly.
            </p>
            <div className="flex space-x-2">
              <span className="bg-stadium-border/60 px-2 py-0.5 rounded text-[10px] text-white">🔞 18+ Only</span>
              <span className="bg-stadium-border/60 px-2 py-0.5 rounded text-[10px] text-white">♻️ Informational</span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
