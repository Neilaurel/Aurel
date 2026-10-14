import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Globe, Network, Key, Settings, AlertCircle, Copy, Check, Terminal, Play,
  Loader2, Sparkles, BrainCircuit, ExternalLink, HelpCircle, ArrowRight,
  ShieldCheck, Database, ListChecks, CheckCircle2, ChevronRight, FileText
} from 'lucide-react';

interface FirecrawlViewProps {
  onStartAnalysis: (home: string, away: string) => void;
  callAiWithRetry: (request: any) => Promise<any>;
}

export const FirecrawlView: React.FC<FirecrawlViewProps> = ({ onStartAnalysis, callAiWithRetry }) => {
  // Firecrawl State
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('smartpick_firecrawl_api_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Scraper Form State
  const [scrapeUrl, setScrapeUrl] = useState<string>('https://www.transfermarkt.com/spvgg-sv-weiden_asv-cham/index/spielbericht/4351608');
  const [onlyMainContent, setOnlyMainContent] = useState<boolean>(true);
  const [waitFor, setWaitFor] = useState<number>(0);
  const [scrapeFormat, setScrapeFormat] = useState<'markdown' | 'html'>('markdown');
  const [isScraping, setIsScraping] = useState<boolean>(false);
  const [scrapeResult, setScrapeResult] = useState<any>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  // Crawl Form State
  const [crawlUrl, setCrawlUrl] = useState<string>('https://www.transfermarkt.com');
  const [crawlLimit, setCrawlLimit] = useState<number>(5);
  const [crawlDepth, setCrawlDepth] = useState<number>(1);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlJobId, setCrawlJobId] = useState<string | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<any>(null);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [isPollingCrawl, setIsPollingCrawl] = useState<boolean>(false);

  // UI Tabs
  const [activeTab, setActiveTab] = useState<'scrape' | 'crawl'>('scrape');
  const [resultTab, setResultTab] = useState<'preview' | 'raw' | 'json'>('preview');

  // AI Detection State
  const [isDetectingMatch, setIsDetectingMatch] = useState<boolean>(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  // Save API key to localStorage when changed
  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    localStorage.setItem('smartpick_firecrawl_api_key', trimmed);
  };

  // Copy Scrape output
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Scrape API Call
  const handleScrape = async () => {
    if (!scrapeUrl) {
      setScrapeError("Veuillez saisir une URL de scraping valide.");
      return;
    }

    setIsScraping(true);
    setScrapeError(null);
    setScrapeResult(null);

    try {
      const response = await fetch('/api/firecrawl/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firecrawl-api-key': apiKey
        },
        body: JSON.stringify({
          url: scrapeUrl,
          options: {
            formats: [scrapeFormat],
            onlyMainContent,
            waitFor
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details?.message || data.error || "Une erreur est survenue lors du scraping.");
      }

      setScrapeResult(data);
      setResultTab('preview');
    } catch (err: any) {
      console.error("[SCRAPE ERROR]", err);
      setScrapeError(err.message || "Impossible de joindre le serveur de scraping.");
    } finally {
      setIsScraping(false);
    }
  };

  // Crawl API Call
  const handleCrawl = async () => {
    if (!crawlUrl) {
      setCrawlError("Veuillez saisir une URL de crawl valide.");
      return;
    }

    setIsCrawling(true);
    setCrawlError(null);
    setCrawlStatus(null);
    setCrawlJobId(null);

    try {
      const response = await fetch('/api/firecrawl/crawl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-firecrawl-api-key': apiKey
        },
        body: JSON.stringify({
          url: crawlUrl,
          options: {
            limit: crawlLimit,
            maxDepth: crawlDepth
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details?.message || data.error || "Une erreur est survenue lors du lancement du crawl.");
      }

      if (data.id) {
        setCrawlJobId(data.id);
        setCrawlStatus({ status: 'scraping', ...data });
        setIsPollingCrawl(true);
      } else {
        setCrawlStatus(data);
      }
    } catch (err: any) {
      console.error("[CRAWL ERROR]", err);
      setCrawlError(err.message || "Impossible de joindre le serveur de crawl.");
      setIsCrawling(false);
    }
  };

  // Poll Crawl Status
  useEffect(() => {
    let timer: any;
    if (isPollingCrawl && crawlJobId) {
      const checkStatus = async () => {
        try {
          const response = await fetch(`/api/firecrawl/crawl/status/${crawlJobId}`, {
            headers: {
              'x-firecrawl-api-key': apiKey
            }
          });
          const data = await response.json();
          setCrawlStatus(data);

          if (data.status === 'completed' || data.status === 'failed') {
            setIsPollingCrawl(false);
            setIsCrawling(false);
          }
        } catch (e) {
          console.error("Failed to check crawl status:", e);
        }
      };

      // Poll every 4 seconds
      timer = setInterval(checkStatus, 4000);
      checkStatus(); // Immediate first check
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPollingCrawl, crawlJobId, apiKey]);

  // AI Assisted Match Detection & Injection
  const handleDetectMatchAndAnalyze = async () => {
    if (!scrapeResult?.data?.markdown) return;

    setIsDetectingMatch(true);
    setDetectionError(null);

    try {
      const prompt = `
      Analyse ce contenu de page sportive scrapé via Firecrawl et trouve précisément les noms des deux équipes qui s'affrontent.
      Ignore tout le superflu et donne-moi uniquement la réponse au format JSON strict suivant :
      {
        "home": "Nom Équipe Domicile",
        "away": "Nom Équipe Extérieur",
        "confidence": 0-100,
        "isMatchPage": true ou false
      }

      Contenu de la page :
      ---
      ${scrapeResult.data.markdown.substring(0, 10000)}
      ---
      `;

      const response = await callAiWithRetry({
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      let data;
      try {
        data = JSON.parse(response.text);
      } catch (e) {
        throw new Error("L'IA n'a pas retourné un JSON valide.");
      }

      if (data.home && data.away && data.confidence > 50) {
        // Successfully detected! Store the scraped Markdown in localStorage
        // so that the engine can load it as prime ground truth context,
        // and trigger the analysis.
        localStorage.setItem(`smartpick_scraped_${data.home}_vs_${data.away}`, scrapeResult.data.markdown);
        onStartAnalysis(data.home, data.away);
      } else {
        setDetectionError("Impossible d'identifier de manière fiable les deux équipes dans ce contenu. Veuillez saisir les noms manuellement.");
      }
    } catch (err: any) {
      console.error("[MATCH DETECTION ERROR]", err);
      setDetectionError(err.message || "Erreur d'analyse IA lors de la détection du match.");
    } finally {
      setIsDetectingMatch(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-[#16191E] border border-white/10 rounded-3xl p-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <Network className="w-6 h-6 text-black" />
            </div>
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              Firecrawl <span className="text-orange-500">Smart Scraper</span>
            </h2>
          </div>
          <p className="text-white/50 text-sm font-medium">
            Extrayez, nettoyez et convertissez n'importe quelle page sportive en Markdown épuré optimisé pour le moteur de PredictMaster AI.
          </p>
        </div>

        {/* API KEY CONFIG */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-2">
            <Key className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-bold text-white/60 font-mono">
              {showKeyInput ? (
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => handleSaveApiKey(e.target.value)}
                  className="bg-transparent border-none outline-none focus:ring-0 text-white font-mono text-xs w-48"
                  placeholder="fc-..."
                />
              ) : (
                `fc-••••••••••••${apiKey.slice(-6)}`
              )}
            </span>
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="text-[10px] font-black uppercase tracking-wider bg-white/5 hover:bg-white/10 px-2 py-1 rounded transition-all text-white/80"
            >
              {showKeyInput ? "Ok" : "Modifier"}
            </button>
          </div>
          <span className="text-[9px] text-white/30 font-bold uppercase tracking-wider">
            API key stockée localement par défaut
          </span>
        </div>
      </div>

      {/* CORE ACTION DASHBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT COLUMN: SCRA_CRAWL INPUT CONTROLS */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#16191E] border border-white/10 rounded-3xl overflow-hidden">

            {/* VIEW TOGGLE */}
            <div className="flex border-b border-white/5 bg-black/20 p-2 gap-2">
              <button
                onClick={() => { setActiveTab('scrape'); setScrapeError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'scrape'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Globe className="w-4 h-4" />
                Scraper URL
              </button>
              <button
                onClick={() => { setActiveTab('crawl'); setCrawlError(null); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  activeTab === 'crawl'
                    ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/10'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
              >
                <Terminal className="w-4 h-4" />
                Crawler Domaine
              </button>
            </div>

            {/* FORM CONTAINER */}
            <div className="p-6 space-y-6">

              {activeTab === 'scrape' ? (
                // 1. SCRAPE FORM
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 block">URL de la Page Cible</label>
                    <input
                      type="url"
                      value={scrapeUrl}
                      onChange={(e) => setScrapeUrl(e.target.value)}
                      placeholder="https://www.transfermarkt.com/spielbericht..."
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500/50 text-xs font-bold font-mono text-white/90"
                    />
                    <span className="text-[9px] text-white/30 font-medium block">
                      Idéal pour les fiches de matchs de Transfermarkt, SofaScore, Soccerway, Flashscore...
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 block">Format de Sortie</label>
                      <select
                        value={scrapeFormat}
                        onChange={(e) => setScrapeFormat(e.target.value as any)}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500/50"
                      >
                        <option value="markdown">Markdown épuré</option>
                        <option value="html">HTML brut</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 block">Délai Rendu (sec)</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={waitFor}
                        onChange={(e) => setWaitFor(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-black/20 border border-white/5 rounded-2xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold block text-white/80">Contenu Principal Uniquement</span>
                      <span className="text-[9px] text-white/30 block">Supprime les en-têtes, menus, publicités</span>
                    </div>
                    <button
                      onClick={() => setOnlyMainContent(!onlyMainContent)}
                      className={`w-12 h-6 rounded-full p-1 transition-all ${onlyMainContent ? 'bg-orange-500' : 'bg-white/10'}`}
                    >
                      <div className={`w-4 h-4 bg-black rounded-full transition-all ${onlyMainContent ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {scrapeError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-500/80 font-bold leading-relaxed">{scrapeError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleScrape}
                    disabled={isScraping}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/20 text-black disabled:text-white/40 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                  >
                    {isScraping ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Scraping en cours...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        Lancer le Scraping
                      </>
                    )}
                  </button>
                </div>
              ) : (
                // 2. CRAWL FORM
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-white/40 block">URL de Départ (Domaine)</label>
                    <input
                      type="url"
                      value={crawlUrl}
                      onChange={(e) => setCrawlUrl(e.target.value)}
                      placeholder="https://www.mon-site-sportif.com"
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500/50 text-xs font-bold font-mono text-white/90"
                    />
                    <span className="text-[9px] text-white/30 font-medium block">
                      Parcourt récursivement les sous-liens du site.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 block">Pages Maximum</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={crawlLimit}
                        onChange={(e) => setCrawlLimit(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-white/40 block">Profondeur Max</label>
                      <input
                        type="number"
                        min="1"
                        max="3"
                        value={crawlDepth}
                        onChange={(e) => setCrawlDepth(Number(e.target.value))}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-xs font-bold text-white focus:outline-none focus:border-orange-500/50 font-mono"
                      />
                    </div>
                  </div>

                  {crawlError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-red-500/80 font-bold leading-relaxed">{crawlError}</p>
                    </div>
                  )}

                  <button
                    onClick={handleCrawl}
                    disabled={isCrawling}
                    className="w-full bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/20 text-black disabled:text-white/40 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(249,115,22,0.1)]"
                  >
                    {isCrawling ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Crawl en cours ({crawlStatus?.status || 'lancement'})...
                      </>
                    ) : (
                      <>
                        <Network className="w-4 h-4" />
                        Lancer l'Exploration (Crawl)
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* DOCUMENTATION PANEL */}
          <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6 space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase text-white tracking-widest">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              Pourquoi utiliser Firecrawl ?
            </h4>
            <ul className="space-y-3">
              <li className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/60 leading-relaxed font-bold">
                  <span className="text-white font-black">Bypass Anti-Bot :</span> Contourne facilement Cloudflare et les protections anti-bot des grands sites de statistiques sportives.
                </p>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/60 leading-relaxed font-bold">
                  <span className="text-white font-black">Markdown Propre :</span> Élimine 95% du code HTML superflu, réduisant drastiquement le coût en jetons (tokens) et guidant l'IA vers les bonnes données.
                </p>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/60 leading-relaxed font-bold">
                  <span className="text-white font-black">Intégration Directe :</span> Les données récoltées sont stockées et injectées de manière prioritaire dans l'analyse de match.
                </p>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: SCRAPE OUTPUT DISPLAY & AI TRANSFERS */}
        <div className="lg:col-span-7 flex flex-col min-h-[500px]">

          <AnimatePresence mode="wait">

            {/* INITIAL BLANK STATE */}
            {!scrapeResult && !crawlStatus && !isScraping && !isCrawling && (
              <motion.div
                key="blank"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center border border-dashed border-white/10 bg-[#16191E]/30 rounded-3xl p-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5 mb-4 text-white/30">
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-black uppercase text-white/60 tracking-wider mb-2">Aucun Résultat Disponible</h3>
                <p className="text-[11px] text-white/40 max-w-[340px] leading-relaxed">
                  Configurez vos paramètres de scraping ou crawling sur la gauche, puis cliquez sur lancer pour observer les données brutes extraites.
                </p>
              </motion.div>
            )}

            {/* SCRAPING LOADER */}
            {isScraping && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center border border-white/10 bg-[#16191E] rounded-3xl p-8 text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border border-orange-500/20 border-t-orange-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-orange-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Extraction en cours...</h3>
                  <p className="text-[11px] text-white/40 max-w-[320px] leading-relaxed">
                    Firecrawl explore la cible, applique le rendu JS et convertit le document. Cela peut prendre de 5 à 15 secondes.
                  </p>
                </div>
              </motion.div>
            )}

            {/* CRAWL STATUS RUNNING */}
            {isCrawling && crawlStatus && (
              <motion.div
                key="crawl-running"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col justify-between border border-white/10 bg-[#16191E] rounded-3xl p-8 space-y-6"
              >
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Crawl ID: {crawlJobId?.slice(0, 8)}...</h4>
                      <p className="text-[9px] font-bold text-white/40 uppercase font-mono mt-0.5">{crawlStatus.status}</p>
                    </div>
                  </div>
                  <div className="bg-orange-500/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                    En cours
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Total Exploré</span>
                    <span className="text-xl font-black text-orange-500 font-mono">{crawlStatus.scraped ?? 0} / {crawlLimit}</span>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Crédits Consommés</span>
                    <span className="text-xl font-black text-white font-mono">{crawlStatus.creditsUsed ?? 1}</span>
                  </div>
                  <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                    <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Status Global</span>
                    <span className="text-[10px] font-black uppercase text-orange-500 h-7 flex items-center justify-center font-mono">{crawlStatus.status}</span>
                  </div>
                </div>

                <div className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-2 max-h-48 overflow-y-auto no-scrollbar">
                  <span className="text-[9px] font-black uppercase text-white/40 block">Liens visités :</span>
                  {crawlStatus.data && crawlStatus.data.length > 0 ? (
                    <div className="space-y-1">
                      {crawlStatus.data.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 text-[10px] font-mono text-white/60">
                          <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                          <span className="truncate">{item.metadata?.sourceURL || item.url || `Page ${idx + 1}`}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-white/30 italic">Analyse des structures de liens en cours...</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* SCRAPE RESULTS DISPLAY */}
            {scrapeResult && !isScraping && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col border border-white/10 bg-[#16191E] rounded-3xl overflow-hidden"
              >

                {/* ACTION BAR TOP */}
                <div className="bg-black/20 border-b border-white/5 p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 shrink-0">
                    <button
                      onClick={() => setResultTab('preview')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${resultTab === 'preview' ? 'bg-orange-500 text-black font-black' : 'text-white/40 hover:text-white'}`}
                    >
                      Aperçu
                    </button>
                    <button
                      onClick={() => setResultTab('raw')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${resultTab === 'raw' ? 'bg-orange-500 text-black font-black' : 'text-white/40 hover:text-white'}`}
                    >
                      Markdown Brut
                    </button>
                    <button
                      onClick={() => setResultTab('json')}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${resultTab === 'json' ? 'bg-orange-500 text-black font-black' : 'text-white/40 hover:text-white'}`}
                    >
                      JSON
                    </button>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => handleCopy(scrapeResult.data?.markdown || scrapeResult.data?.html || JSON.stringify(scrapeResult, null, 2))}
                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {isCopied ? "Copié !" : "Copier"}
                    </button>

                    <button
                      onClick={handleDetectMatchAndAnalyze}
                      disabled={isDetectingMatch || !scrapeResult.data?.markdown}
                      className="flex-2 sm:flex-none flex items-center justify-center gap-1.5 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/20 text-black disabled:text-white/40 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      {isDetectingMatch ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Analyse IA...
                        </>
                      ) : (
                        <>
                          <BrainCircuit className="w-3.5 h-3.5" />
                          Analyser avec l'IA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {detectionError && (
                  <div className="px-6 py-3 bg-red-500/10 border-b border-red-500/20 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-red-500/80 font-bold leading-relaxed">{detectionError}</p>
                  </div>
                )}

                {/* METADATA SUMMARY */}
                {scrapeResult.data?.metadata && (
                  <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex flex-wrap items-center gap-x-6 gap-y-2">
                    {scrapeResult.data.metadata.title && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                        <FileText className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="text-white">Titre:</span>
                        <span className="truncate max-w-[200px]">{scrapeResult.data.metadata.title}</span>
                      </div>
                    )}
                    {scrapeResult.data.metadata.sourceURL && (
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                        <ExternalLink className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <span className="text-white">URL Originale:</span>
                        <a href={scrapeResult.data.metadata.sourceURL} target="_blank" rel="noreferrer" className="truncate max-w-[200px] hover:text-orange-400 transition-all font-mono">
                          {scrapeResult.data.metadata.sourceURL}
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* SCROLLABLE VIEWPORT */}
                <div className="flex-1 p-6 overflow-auto max-h-[500px] no-scrollbar">
                  {resultTab === 'preview' && (
                    <div className="prose prose-invert prose-xs max-w-none text-white/70">
                      {scrapeResult.data?.markdown ? (
                        <div className="whitespace-pre-wrap font-sans leading-relaxed text-xs">
                          {scrapeResult.data.markdown}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-white/30 italic">
                          Aperçu Markdown non disponible. Utilisez les onglets Brut ou JSON.
                        </div>
                      )}
                    </div>
                  )}

                  {resultTab === 'raw' && (
                    <pre className="text-[11px] font-mono leading-relaxed text-white/60 whitespace-pre-wrap bg-black/30 p-4 border border-white/5 rounded-2xl max-h-[400px] overflow-auto select-text no-scrollbar">
                      {scrapeResult.data?.markdown || "Rien à afficher."}
                    </pre>
                  )}

                  {resultTab === 'json' && (
                    <pre className="text-[11px] font-mono leading-relaxed text-orange-400 whitespace-pre-wrap bg-black/30 p-4 border border-white/5 rounded-2xl max-h-[400px] overflow-auto select-text no-scrollbar">
                      {JSON.stringify(scrapeResult, null, 2)}
                    </pre>
                  )}
                </div>

              </motion.div>
            )}

            {/* CRAWL FINAL REPORT DISPLAY */}
            {crawlStatus && crawlStatus.status === 'completed' && !isCrawling && (
              <motion.div
                key="crawl-results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col border border-white/10 bg-[#16191E] rounded-3xl overflow-hidden"
              >
                <div className="bg-black/20 border-b border-white/5 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">Exploration Complétée !</h3>
                  </div>
                  <span className="text-[10px] font-mono text-white/40">{crawlStatus.data?.length ?? 0} pages collectées</span>
                </div>

                <div className="p-6 space-y-6 max-h-[450px] overflow-auto no-scrollbar">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Crawl Terminés</span>
                      <span className="text-xl font-black text-green-500 font-mono">{crawlStatus.data?.length ?? 0} Pages</span>
                    </div>
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                      <span className="text-[8px] font-bold text-white/30 uppercase block mb-1">Status</span>
                      <span className="text-xl font-black text-white font-mono uppercase">OK</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase text-white/40 block">Détails des ressources indexées :</span>

                    {crawlStatus.data?.map((page: any, idx: number) => (
                      <div key={idx} className="bg-black/20 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-bold block text-white truncate max-w-[280px]">
                              {page.metadata?.title || `Page ${idx + 1}`}
                            </span>
                            <a href={page.metadata?.sourceURL || page.url} target="_blank" rel="noreferrer" className="text-[10px] text-orange-400 hover:underline font-mono truncate block max-w-[280px]">
                              {page.metadata?.sourceURL || page.url}
                            </a>
                          </div>

                          <button
                            onClick={() => {
                              // Select scrape data, prefill Scrape URL
                              setScrapeUrl(page.metadata?.sourceURL || page.url);
                              setScrapeResult({ data: page });
                              setActiveTab('scrape');
                              setResultTab('preview');
                            }}
                            className="flex items-center gap-1.5 bg-orange-500 text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-orange-400 transition-all"
                          >
                            <Sparkles className="w-3 h-3" />
                            Voir Markdown
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
