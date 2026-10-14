/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Search, Trophy, TrendingUp, Info, Calendar, Activity,
  Target, AlertCircle, Loader2, History, Wallet,
  Plus, Trash2, Calculator, ArrowUpRight, ArrowDownRight,
  PiggyBank, Settings, ShieldCheck, Zap, Flame,
  Ticket, Bell, CheckCircle2, XCircle, BarChart3,
  BrainCircuit, Coins, TrendingDown, RefreshCw, X,
  Users, UserMinus, Swords, Radio, Globe, Clock, ChevronRight, ChevronDown, Table, FileText, ExternalLink,
  LineChart as LucideLineChart, PieChart, Sparkles, LogOut, LogIn,
  Pencil, Check, LayoutGrid, GraduationCap, Save, Home, Shield, ShieldAlert, Cpu, Layers, Bug, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import axios from 'axios';
import { GoogleGenAI } from "@google/genai";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import * as math from 'mathjs';
import * as ss from 'simple-statistics';
import { Course } from './components/Course';
import { FirecrawlView } from './components/FirecrawlView';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import {
  auth, db, googleProvider, signInWithPopup, onAuthStateChanged, GoogleAuthProvider,
  doc, collection, setDoc, getDoc, onSnapshot, query as fsQuery, orderBy, limit as fsLimit, deleteDoc, updateDoc,
  handleFirestoreError, OperationType, User
} from './firebase';
import {
  syncHistoryToPostgres,
  deleteHistoryFromPostgres,
  syncBetToPostgres,
  updateBetStatusInPostgres,
  deleteBetFromPostgres,
  syncBankrollToPostgres,
  syncLogsToPostgres
} from './utils/dbSync.ts';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: any;
}

class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    (this as any).state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  render() {
    const self = this as any;
    if (self.state.hasError) {
      let errorInfo;
      try {
        errorInfo = JSON.parse(self.state.error.message);
      } catch (e) {
        errorInfo = { error: self.state.error.message };
      }

      return (
        <div className="min-h-screen bg-[#0D0F12] text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-[#16191E] border border-white/10 rounded-3xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-black mb-4 uppercase tracking-tight">Une erreur est survenue</h1>
            <p className="text-white/60 mb-6 font-bold">L'application a rencontré un problème inattendu.</p>
            <div className="bg-black/40 rounded-xl p-4 text-left mb-6 overflow-auto max-h-40">
              <pre className="text-[10px] text-red-400 font-mono whitespace-pre-wrap">
                {JSON.stringify(errorInfo, null, 2)}
              </pre>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-orange-500 text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-orange-400 transition-all"
            >
              Recharger l'application
            </button>
          </div>
        </div>
      );
    }
    return self.props.children;
  }
}

import { Header } from './components/layout/Header';
import {
  Sport, View, RiskProfile, MatchInfo, Prediction, ExpertOpinion,
  RecentMatch, LogStep, AnalysisLog, AnalysisResult, CouponItem,
  Bet, BalanceSnapshot, Bankroll
} from './types';
import ReactMarkdown from 'react-markdown';
import {
  VERSION, ENGINE_NAME, ALPHA, WEIGHTS_6,
  SYSTEM_INSTRUCTION_COLLECTOR, COUPON_SYSTEM_INSTRUCTION, REPORT_FORMATTER_PROMPT,
  COMBO_ANALYSIS_PROMPT, DEF_MATCH, DEF_FORMAT, DEF_LEXIQUE
} from './constants';
import { recalculateAnalysis } from './utils/calculations';
import { Maximize2, Minimize2 } from 'lucide-react';

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

function App() {
  const [view, setView] = useState<View>('analyze');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<string[]>([]);
  const [isDeletingSelection, setIsDeletingSelection] = useState(false);

  useEffect(() => {
    setConfirmDeleteId(null);
    setSelectedHistoryIds([]);
  }, [view]);

  const [sport, setSport] = useState<Sport>('football');
  const [homeQuery, setHomeQuery] = useState('');
  const [awayQuery, setAwayQuery] = useState('');
  const [multiQuery, setMultiQuery] = useState('');
  const [batchRows, setBatchRows] = useState([{ home: '', away: '' }]);
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isVerifying, setIsVerifying] = useState<string | null>(null);
  const [isGeneratingCoupon, setIsGeneratingCoupon] = useState(false);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [balanceInput, setBalanceInput] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Coupon State
  const [coupon, setCoupon] = useState<CouponItem[]>([]);

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [searchStartDate, setSearchStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [searchEndDate, setSearchEndDate] = useState(new Date(Date.now() + 86400000).toISOString().slice(0, 16));
  const [explorerMatches, setExplorerMatches] = useState<any[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<any[]>([]);
  const [batchResults, setBatchResults] = useState<AnalysisResult[]>([]);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [comboAnalysis, setComboAnalysis] = useState<string | null>(null);
  const [isAnalyzingCombo, setIsAnalyzingCombo] = useState(false);
  const [isExploring, setIsExploring] = useState(false);
  const [exportPassword, setExportPassword] = useState('');
  const [isExportUnlocked, setIsExportUnlocked] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [useDeepSearch, setUseDeepSearch] = useState<boolean>(() => {
    return localStorage.getItem('smartpick_use_deep_search') === 'true';
  });

  const handleToggleDeepSearch = (checked: boolean) => {
    setUseDeepSearch(checked);
    localStorage.setItem('smartpick_use_deep_search', checked ? 'true' : 'false');
  };
  const [editingFormulaKey, setEditingFormulaKey] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [showSheetEditor, setShowSheetEditor] = useState(false);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);

  const getOrRequestGoogleToken = async (): Promise<string> => {
    if (googleAccessToken) return googleAccessToken;

    try {
      const loginRes = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(loginRes);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
        return credential.accessToken;
      }
      throw new Error("Impossible d'obtenir le jeton d'accès Google.");
    } catch (err: any) {
      console.error("Error getting Google token:", err);
      throw new Error("Veuillez vous connecter avec votre compte Google et autoriser l'accès à vos feuilles de calcul.");
    }
  };

  const handleSheetsSync = async (analysisToSync = result) => {
    if (!analysisToSync || !auth.currentUser) return;
    setIsSyncingSheets(true);
    try {
      const token = await getOrRequestGoogleToken();
      const response = await axios.post('/api/sheets/setup', {
        title: `${analysisToSync.match.homeTeam} vs ${analysisToSync.match.awayTeam}`,
        data: analysisToSync.quantitativeData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { spreadsheetId, url } = response.data;

      // Update result and Firestore
      const updatedResult = { ...analysisToSync, spreadsheetId, spreadsheetUrl: url };
      const docRef = doc(db, 'users', auth.currentUser.uid, 'history', analysisToSync.id);
      await updateDoc(docRef, { spreadsheetId, spreadsheetUrl: url });

      setResult(updatedResult);
      setShowSheetEditor(true);
    } catch (err: any) {
      setError("Erreur lors de la synchronisation avec Google Sheets : " + err.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleSyncFromSheets = async () => {
    if (!result || !result.spreadsheetId || !auth.currentUser) return;
    setIsSyncingSheets(true);
    try {
      const token = await getOrRequestGoogleToken();
      const response = await axios.get(`/api/sheets/${result.spreadsheetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const values = response.data.values; // Array of [Variable, Valeur, Note]

      if (!values || values.length < 2) return;

      const newQuantData = { ...result.quantitativeData };
      // Map back values to quantitativeData
      // Assuming headers are Variable, Valeur, Formule/Note
      values.slice(1).forEach((row: any[]) => {
        const key = row[0];
        const val = row[1];
        if (key && val !== undefined) {
          try {
            // Attempt to parse JSON if it looks like one (for objects)
            if (val.startsWith('{') || val.startsWith('[')) {
              (newQuantData as any)[key] = JSON.parse(val);
            } else {
              // Try to convert to number if possible
              const num = Number(val);
              (newQuantData as any)[key] = isNaN(num) ? val : num;
            }
          } catch {
            (newQuantData as any)[key] = val;
          }
        }
      });

      const updatedResult = { ...result, quantitativeData: newQuantData };
      const docRef = doc(db, 'users', auth.currentUser.uid, 'history', result.id);
      await updateDoc(docRef, { quantitativeData: newQuantData });
      setResult(updatedResult);
    } catch (err: any) {
      setError("Erreur lors de la récupération des données Google Sheets : " + err.message);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleFormulaUpdate = async (key: string, value: string) => {
    if (!result || !result.quantitativeData || !auth.currentUser) return;
    const newResult = {
      ...result,
      quantitativeData: {
        ...result.quantitativeData,
        metricFormulas: {
          ...result.quantitativeData.metricFormulas,
          [key]: value
        }
      }
    };

    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'history', result.id);
      await updateDoc(docRef, { quantitativeData: newResult.quantitativeData });
      setResult(newResult);
      setEditingFormulaKey(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'history');
    }
  };

  // PROTOCOLE DE RECHERCHE INTERROGATIF V12.0 - COLLECTE DE HAUTE PRÉCISION AVEC VÉRIFICATION DE SAISON
  const GET_INTERROGATIVE_COLLECTION_QUERY = (q: string, t: string, s: string) => `
    [MISSION ANALYSTE SPORTIF - PROTOCOLE RECHERCHE_WEB_V12_SÉCURISÉE - PETITS CHAMPIONNATS GRANDE PRÉCISION]
    Match : ${q} (${s}) | Date Actuelle : ${t}

    CECI EST UNE RECHERCHE POUR LA SAISON EN COURS : 2025/2026.

    ${DEF_LEXIQUE}

    CONSIGNE CRITIQUE "ANTI-SPOOFING & PRECISION" :
    1. EXCLUSION DES DONNÉES HISTORIQUES : Ignore tout résultat datant de 2024 ou début 2025 qui n'appartient pas à la saison 2025/2026.
    2. VÉRIFICATION DU RÉSULTAT : Si tu trouves un score, vérifie s'il s'agit du match ALLER ou d'une rencontre passée.
    3. IDENTIFICATION DES SOURCES : Identifie si le site est bbc.com, lequipe.fr, flashscore, soccerway, transfermarkt ou sofascore.
    4. PROTOCOLE PETITS CHAMPIONNATS : Pour les championnats mineurs (ex: divisions inférieures, championnats régionaux ou africains/CFA) :
       - Ne cherche pas le match uniquement par l'expression "${q}".
       - EFFECTUE PLUSIEURS RECHERCHES INDIVIDUELLES séparées sur Google :
         * "[Nom Équipe Domicile] results 2025 2026" OU "[Nom Équipe Domicile] calendrier scores"
         * "[Nom Équipe Extérieur] results 2025 2026" OU "[Nom Équipe Extérieur] calendrier scores"
         * "[Nom de la Compétition/Championnat] standings table 2025 2026"
       - Essaie les variantes de noms (abréviations, noms complets, traduction locale).
       - Recherche en français ET en anglais pour augmenter les chances d'indexer les pages de stats de SofaScore ou Soccerway.

    TU DOIS RÉPONDRE À :
    "Quels sont les scores exacts des 10 DERNIERS MATCHS réels joués par l'ÉQUIPE DOMICILE (la première équipe mentionnée dans ${q}) ET par l'ÉQUIPE EXTÉRIEURE (la deuxième équipe mentionnée dans ${q}) durant la SAISON 2025/2026 ?"

    APPLIQUE LE [CONCEPT:SOURCING_TRANSPARENT] : Mentionne l'URL et assure l'utilisateur que la requête a été faite via un "Agent Proxy Mobile Intégré" (simulation de terminal PC/Mobile pour éviter le blocage).

    1. ÉQUIPE CIBLE DOMICILE & ÉQUIPE CIBLE EXTÉRIEUR :
       - Liste les matchs réels (Dates, Opposants, Scores).
       - Vérifie si le score correspond à la saison 2025/2026.

    2. EXTRACTION CLASSEMENT ACTUALISÉ :
       - Points, MJ, BP (Buts Pour), BC (Buts Contre) au ${t}.

    3. DERNIÈRES INFOS :
       - Composition probable, absents de dernière minute.
    4. STATISTIQUES AVANCÉES :
       - Scores à la mi-temps des 10 derniers matchs.
       - Statistiques des 3 meilleurs buteurs de la saison (actuels).
       - Moyenne de buts encaissés par match.

    RÈGLE D'OR : Ne jamais inventer. Si la donnée est absente, écris "DONNÉE NON DISPONIBLE SUR LE WEB".
  `;

  const GET_INTERROGATIVE_EXPLORE_QUERY = (sport: string, start: string, end: string) => `
    Quels sont les 20 matchs de ${sport} les plus importants et médiatisés programmés entre le ${start} et le ${end} ?
    Effectue une recherche web en temps réel et liste-les selon le format suivant :
    [Date ISO YYYY-MM-DD] | [Heure Locale HH:MM] | [Équipes : Domicile vs Extérieur] | [Compétition] | [Cotes 1N2 Estimées].
    Assure-toi que les matchs sont réellement prévus et ne sont pas fictifs.
  `;

  // Persistence
  const [history, setHistory] = useState<AnalysisResult[]>(() => {
    try {
      const saved = localStorage.getItem('smartpick_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [bets, setBets] = useState<Bet[]>(() => {
    try {
      const saved = localStorage.getItem('smartpick_bets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [bankroll, setBankroll] = useState<Bankroll>(() => {
    const defaultBankroll: Bankroll = {
      balance: 1000,
      initialBalance: 1000,
      lockedBalance: 200,
      currency: 'CFA',
      savingsGoal: 5000,
      dailyTargetOdd: 5.0,
      maxTicketsPerDay: 4,
      maxEventsPerCoupon: 4,
      minConfidence: 70,
      riskProfile: 'balanced',
      adaptiveMode: true,
      balanceHistory: [{ timestamp: Date.now(), balance: 1000 }]
    };
    try {
      const saved = localStorage.getItem('smartpick_bankroll');
      if (!saved) return defaultBankroll;
      const parsed = JSON.parse(saved);
      if (parsed.lockedBalance === undefined) parsed.lockedBalance = parsed.balance * 0.2;
      if (!parsed.balanceHistory) parsed.balanceHistory = [{ timestamp: Date.now(), balance: parsed.balance }];
      return parsed;
    } catch (e) { return defaultBankroll; }
  });

  const [primaryModel, setPrimaryModel] = useState<'gemini-3.6-flash' | 'gemini-3.1-flash-lite'>(() => {
    return (localStorage.getItem('smartpick_primary_model') as any) || 'gemini-3.6-flash';
  });
  const [activeSessionModel, setActiveSessionModel] = useState<'gemini-3.6-flash' | 'gemini-3.1-flash-lite'>(primaryModel);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

  // Sync activeSessionModel when primaryModel changes
  useEffect(() => {
    setActiveSessionModel(primaryModel);
  }, [primaryModel]);

  // Utility for API retries and delays
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  /**
   * REFACTORING : FONCTIONS DE COLLECTE INDUSTRIELLE V11.0 (PROTOCOLE LEXIQUE)
   * Ce bloc utilise les définitions de constantes.ts :
   * - ÉQUIPE_CIBLE (Home/Away)
   * - MATCH_COMPOSITION (Structure atomique des scores)
   * - RECHERCHE_WEB_ROBUSTE (Protocole de grounding search)
   */

  // 1. Découpage du texte multi-requête en paires d'équipes
  const fetchThroughProxy = async (url: string) => {
    try {
      const response = await fetch('/api/proxy-fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await response.json();
    } catch (e) {
      console.error("Proxy fetch failed:", e);
      return null;
    }
  };

  const parseBatchQueries = (text: string) => {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(q => {
        const parts = q.split(/ vs | VS | - | – /);
        const home = parts[0]?.trim() || q;
        const away = parts[1]?.trim() || '';
        return { home, away, query: q };
      });
  };

  // 2. Collecte globale via Search pour un lot de matchs
  const fetchGlobalGroundingData = async (matchQueries: string[], sportType: string) => {
    const now = new Date();
    const today = now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    // Construction de la liste numérotée pour la question interrogative
    const formattedMatches = matchQueries.map((m, idx) => `${idx + 1}. ${m}`).join("\n");

    console.info(`[DÉBRAYAGE COLLECTE] Démarrage recherche interrogative pour ${matchQueries.length} matchs.`);

    const globalCollecteQuery = `
    [MISSION ANALYSTE DÉTECTIVE - PROTOCOLE RECHERCHE_WEB_ROBUSTE V12.0 - PETITS CHAMPIONNATS ACCURACY]
    Discipline : ${sportType} | Date : ${today}

    ${DEF_LEXIQUE}

    TU DOIS RÉPONDRE À LA QUESTION SUIVANTE POUR CHAQUE RENCONTRE CI-DESSOUS :
    "Quels sont les 10 derniers [CONCEPT:MATCH_CONSÉCUTIF] réels de l'Équipe Domicile ET de l'Équipe Extérieur sous le [CONCEPT:FORMAT] durant la SAISON 2025/2026 ?"

    APPLIQUE LE [CONCEPT:SOURCING_TRANSPARENT] : Relève chaque URL source utilisée.

    ${formattedMatches}

    CONSIGNES SPÉCIFIQUES POUR LES PETITS CHAMPIONNATS ET CLUBS MINEURS :
    Pour chaque rencontre, si l'un des clubs appartient à un championnat mineur (CFA, D2, championnat régional, ou pays moins médiatisé) :
    - Fais des recherches Google ciblées et séparées en français et anglais pour chaque équipe de manière indépendante :
      * Ex: "[Nom Équipe] match history 2025 2026"
      * Ex: "[Nom Équipe] soccerway" ou "[Nom Équipe] flashscore"
      * Ex: "[Nom Compétition] table standings 2025 2026"
    - Cible des sources expertes de données comme SofaScore, Transfermarkt, Soccerway, Flashscore, FootyStats ou les sites sportifs locaux de la région.
    - Évite de chercher uniquement le nom combiné des deux équipes car cela peut ne rien renvoyer.

    POUR CHAQUE ANALYSE (NUMÉROTÉE DE 1 À ${matchQueries.length}) :
    1. HISTORIQUE : Les 10 derniers [CONCEPT:MATCH_CONSÉCUTIF] pour les DEUX clubs (Pas de simulation).
    2. COMPOSITION : Respecte scrupuleusement le [CONCEPT:FORMAT] et le [CONCEPT:MATCH].
    3. CLASSEMENT STANDART : MJ, BP, BC, Rang pour les DEUX clubs.
    4. VÉRIFICATION : Applique le [CONCEPT:VALIDATION_VÉRITÉ].

    FORMALISME TECHNIQUE CRITIQUE (ANTI-COLLISION) :
    - Isole CHAQUE match individuel entre les balises [MATCH_DEBUT] et [MATCH_FIN].
    - Juste après [MATCH_DEBUT], réécris le nom complet du match : "ANALYSE DU MATCH : [Equipe A] vs [Equipe B]".
    - Utilise des titres clairs : "--- ÉQUIPE DOMICILE : [Nom] ---" et "--- ÉQUIPE EXTÉRIEUR : [Nom] ---".
    - INTERDICTION de mentionner une équipe d'un autre match dans ce bloc.
    Ne simule rien. Grounding de précision requis.
    `;

    const response = await callAiWithRetry({
        contents: globalCollecteQuery,
        config: { tools: [{ googleSearch: {} }], temperature: 1 }
    });

    return response.text ?? "";
  };

  // 3. Extraction de la partie contextuelle spécifique à un match depuis le puits global
  const extractMatchContext = (globalGrounding: string, home: string, away: string) => {
    if (!globalGrounding) return "";

    const h = home.toLowerCase();
    const a = away.toLowerCase();

    // Découpage par balises [MATCH_DEBUT]
    const blocks = globalGrounding.split("[MATCH_DEBUT]").filter(b => b.trim().length > 0);

    // Recherche de haute précision : Le bloc doit contenir idéalement les DEUX équipes
    const perfectBlock = blocks.find(b => {
      const lowerB = b.toLowerCase();
      // On cherche les noms d'équipes. On peut avoir des variantes, donc on splitte un peu
      const homeWords = h.split(' ').filter(w => w.length > 2);
      const awayWords = a.split(' ').filter(w => w.length > 2);

      const hasHome = homeWords.some(w => lowerB.includes(w));
      const hasAway = awayWords.some(w => lowerB.includes(w));

      return hasHome && hasAway;
    });

    if (perfectBlock) {
      return `[MATCH_DEBUT]${perfectBlock.split("[MATCH_FIN]")[0]}[MATCH_FIN]`;
    }

    // Fallback : On cherche le bloc qui mentionne au moins une des deux équipes si pas de bloc parfait
    const fallbackBlock = blocks.find(b =>
      b.toLowerCase().includes(h) ||
      b.toLowerCase().includes(a)
    );

    if (fallbackBlock) {
      return `[MATCH_DEBUT]${fallbackBlock.split("[MATCH_FIN]")[0]}[MATCH_FIN]`;
    }

    return "";
  };

  const callAiWithRetry = async (
    request: any,
    maxRetries = 5,
    initialDelay = 3000
  ): Promise<any> => {
    let lastError: any;
    // We use the model currently marked as "active" for the session
    const currentModel = activeSessionModel;
    const fallbackModel = currentModel === 'gemini-3.6-flash' ? 'gemini-3.1-flash-lite' : 'gemini-3.6-flash';

    for (let i = 0; i < maxRetries; i++) {
      try {
        const modelToUse = i > 0 ? fallbackModel : currentModel;

        // Force temperature 1 for production grade accuracy as requested
        const finalRequest = { ...request, model: modelToUse };
        if (!finalRequest.config) finalRequest.config = {};
        finalRequest.config.temperature = 1;

        const response = await ai.models.generateContent(finalRequest);
        const text = response.text;

        // If we succeeded with the fallback model on a retry, mark it as the session active model
        if (i > 0) {
          console.info(`Stabilité IA : Basculement session sur ${fallbackModel} pour éviter les futures erreurs.`);
          setActiveSessionModel(fallbackModel);
        }

        return { text, response };
      } catch (err: any) {
        lastError = err;
        const errorMsg = err?.message?.toLowerCase() || '';
        const isRateLimit = errorMsg.includes('quota') || errorMsg.includes('429') || errorMsg.includes('exhausted');
        const isInternalError = errorMsg.includes('internal') || errorMsg.includes('500') || errorMsg.includes('deadlock');

        if ((isRateLimit || isInternalError) && i < maxRetries - 1) {
          const delay = isRateLimit
            ? initialDelay * Math.pow(3, i)
            : initialDelay * Math.pow(2, i);

          const modelInfo = (isRateLimit && i === 0) ? ` (Dépassement quota détecté, passage stable à ${fallbackModel})` : '';
          console.warn(`Appel API IA échoué, nouvelle tentative dans ${Math.round(delay)}ms... (Tentative ${i + 1}/${maxRetries})${modelInfo}`);

          await sleep(delay);
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!user || !isAuthReady) return;

    console.log("Setting up Firestore listeners for UID:", user.uid);
    const userDocRef = doc(db, 'users', user.uid);

    // Listen to Bankroll
    const unsubBankroll = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.bankroll) {
          // Merge logic for bankroll if needed, but usually cloud wins
          setBankroll(data.bankroll);
        }
        if (data.primaryModel) {
          setPrimaryModel(data.primaryModel);
        }
      } else {
        console.log("Initializing user profile in Firestore...");
        // Initialize user in Firestore if not exists
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          bankroll: bankroll,
          primaryModel: primaryModel
        }).catch(err => {
            console.error("Failed to initialize user profile:", err);
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
        });
      }
    }, (err) => {
        console.error("Profile Listener Error:", err);
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
    });

    // Listen to History and Merge with Local
    const historyRef = collection(db, 'users', user.uid, 'history');
    const qHistory = fsQuery(historyRef, orderBy('timestamp', 'desc'), fsLimit(500));
    const unsubHistory = onSnapshot(qHistory, async (snapshot) => {
      const dbDocs = snapshot.docs.map(d => {
        const data = d.data();
        if (data.scoreMatrix && typeof data.scoreMatrix === 'string') {
          try { data.scoreMatrix = JSON.parse(data.scoreMatrix); } catch (e) {}
        }
        return data as AnalysisResult;
      });

      // MERGE LOGIC: Combine local items that might not be in DB yet
      setHistory(prev => {
        const cloudIds = new Set(dbDocs.map(d => d.id));
        const localOnly = prev.filter(p => !cloudIds.has(p.id));

        // Find which local items need to be pushed to cloud
        // We do this outside the state update to avoid loops
        if (localOnly.length > 0) {
            localOnly.forEach(item => {
                const dataToSave: any = { ...item };
                if (item.scoreMatrix && typeof item.scoreMatrix !== 'string') {
                  dataToSave.scoreMatrix = JSON.stringify(item.scoreMatrix);
                }
                const sanitizedData = JSON.parse(JSON.stringify(dataToSave));
                setDoc(doc(db, 'users', user.uid, 'history', item.id), sanitizedData).catch(() => {});
            });
        }

        const combined = [...dbDocs, ...localOnly].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        return combined.slice(0, 500);
      });
    }, (err) => {
        console.error("History Listener Error:", err);
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/history`);
    });

    // Listen to Bets
    const betsRef = collection(db, 'users', user.uid, 'bets');
    const qBets = fsQuery(betsRef, orderBy('timestamp', 'desc'), fsLimit(500));
    const unsubBets = onSnapshot(qBets, (snapshot) => {
      const dbBets = snapshot.docs.map(d => d.data() as Bet);
      setBets(prev => {
        const cloudIds = new Set(dbBets.map(b => b.id));
        const localOnly = prev.filter(p => !cloudIds.has(p.id));

        if (localOnly.length > 0) {
            localOnly.forEach(bet => {
                setDoc(doc(db, 'users', user.uid, 'bets', bet.id), bet).catch(() => {});
            });
        }

        return [...dbBets, ...localOnly].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).slice(0, 500);
      });
    }, (err) => {
        console.error("Bets Listener Error:", err);
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}/bets`);
    });

    return () => {
      unsubBankroll();
      unsubHistory();
      unsubBets();
    };
  }, [user, isAuthReady]);

  // Update Bankroll in Firestore
  const updateBankroll = async (newBankroll: Bankroll) => {
    setBankroll(newBankroll);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { bankroll: newBankroll }, { merge: true });
        // Dual-write to Cloud SQL
        syncBankrollToPostgres(newBankroll);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  const updatePrimaryModel = async (model: 'gemini-3.6-flash' | 'gemini-3.1-flash-lite') => {
    setPrimaryModel(model);
    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid), { primaryModel: model }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }
  };

  // Add to History in Firestore
  const addToHistory = async (result: AnalysisResult) => {
    setHistory(prev => [result, ...prev]);
    if (user) {
      try {
        // Firestore doesn't support nested arrays (number[][]), so we stringify the matrix
        // We also need to remove 'undefined' values which Firestore doesn't support
        const dataToSave: any = { ...result };

        if (result.scoreMatrix && typeof result.scoreMatrix !== 'string') {
          dataToSave.scoreMatrix = JSON.stringify(result.scoreMatrix);
        }

        // Deep sanitize to remove undefined fields
        const sanitizedData = JSON.parse(JSON.stringify(dataToSave));

        await setDoc(doc(db, 'users', user.uid, 'history', result.id), sanitizedData);
        // Dual-write to Cloud SQL
        syncHistoryToPostgres(result);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/history/${result.id}`);
      }
    }
  };

  // Delete from History in Firestore
  const deleteHistoryItem = async (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'history', id));
        // Dual-write to Cloud SQL
        deleteHistoryFromPostgres(id);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${user.uid}/history/${id}`);
      }
    }
  };

  const deleteSelectedHistory = async () => {
    if (selectedHistoryIds.length === 0) return;
    setIsDeletingSelection(true);
    try {
      if (user) {
        for (const id of selectedHistoryIds) {
          await deleteDoc(doc(db, 'users', user.uid, 'history', id));
          // Dual-write to Cloud SQL
          deleteHistoryFromPostgres(id);
        }
      }
      setHistory(prev => prev.filter(item => !selectedHistoryIds.includes(item.id)));
      setSelectedHistoryIds([]);
    } catch (err) {
      console.error("Batch Delete Error:", err);
    } finally {
      setIsDeletingSelection(false);
    }
  };

  const toggleHistorySelection = (id: string) => {
    setSelectedHistoryIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAllHistory = () => {
    if (selectedHistoryIds.length === history.length) {
      setSelectedHistoryIds([]);
    } else {
      setSelectedHistoryIds(history.map(h => h.id));
    }
  };

  const handleLogin = async () => {
    try {
      const loginRes = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(loginRes);
      if (credential?.accessToken) {
        setGoogleAccessToken(credential.accessToken);
      }
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setView('analyze');
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  // Update History item in Firestore
  const updateHistoryItem = async (updatedResult: AnalysisResult) => {
    setHistory(prev => prev.map(item => item.id === updatedResult.id ? updatedResult : item));
    if (user) {
      try {
        const dataToSave: any = { ...updatedResult };
        if (updatedResult.scoreMatrix && typeof updatedResult.scoreMatrix !== 'string') {
          dataToSave.scoreMatrix = JSON.stringify(updatedResult.scoreMatrix);
        }
        const sanitizedData = JSON.parse(JSON.stringify(dataToSave));
        await setDoc(doc(db, 'users', user.uid, 'history', updatedResult.id), sanitizedData);
        // Dual-write to Cloud SQL
        syncHistoryToPostgres(updatedResult);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/history/${updatedResult.id}`);
      }
    }
  };

  const handleGoalChange = (
    team: 'home' | 'away',
    index: number,
    field: 'goalsScored' | 'goalsConceded' | 'ht1Scored' | 'ht1Conceded',
    value: number
  ) => {
    if (!result) return;

    const updatedMatches = { ...result.recentMatches! };
    updatedMatches[team] = [...updatedMatches[team]];
    const match = { ...updatedMatches[team][index] };

    if (field === 'goalsScored') {
      match.goalsScored = Math.max(0, value);
      if ((match.ht1Scored ?? 0) > match.goalsScored) match.ht1Scored = match.goalsScored;
    } else if (field === 'goalsConceded') {
      match.goalsConceded = Math.max(0, value);
      if ((match.ht1Conceded ?? 0) > match.goalsConceded) match.ht1Conceded = match.goalsConceded;
    } else if (field === 'ht1Scored') {
      match.ht1Scored = Math.min(Math.max(0, value), match.goalsScored);
    } else if (field === 'ht1Conceded') {
      match.ht1Conceded = Math.min(Math.max(0, value), match.goalsConceded);
    }

    match.ht2Scored = Math.max(0, match.goalsScored - (match.ht1Scored ?? 0));
    match.ht2Conceded = Math.max(0, match.goalsConceded - (match.ht1Conceded ?? 0));
    match.score = `${match.goalsScored}-${match.goalsConceded}`;
    match.result = match.goalsScored > match.goalsConceded ? 'W' : match.goalsScored === match.goalsConceded ? 'D' : 'L';

    updatedMatches[team][index] = match;

    const newResult = recalculateAnalysis({ ...result, recentMatches: updatedMatches });
    setResult(newResult);

    // Update history persistence
    if (newResult.id) {
      updateHistoryItem(newResult);
    }
  };

  const handleDateChange = (team: 'home' | 'away', index: number, date: string) => {
    if (!result) return;

    const updatedMatches = { ...result.recentMatches! };
    updatedMatches[team] = [...updatedMatches[team]];
    updatedMatches[team][index] = { ...updatedMatches[team][index], date };

    const newResult = recalculateAnalysis({ ...result, recentMatches: updatedMatches });
    setResult(newResult);

    if (newResult.id) {
      updateHistoryItem(newResult);
    }
  };

  const handleExportCode = async () => {
    if (exportPassword !== 'SMARTPICK2026' && !isExportUnlocked) {
      setExportError("Mot de passe d'exportation incorrect.");
      return;
    }

    setIsExporting(true);
    setExportError(null);
    try {
      const zip = new JSZip();

      const filesToExport = [
        { path: '/src/App.tsx', name: 'App.tsx' },
        { path: '/src/firebase.ts', name: 'firebase.ts' },
        { path: '/src/index.css', name: 'index.css' },
        { path: '/package.json', name: 'package.json' },
        { path: '/firebase-blueprint.json', name: 'firebase-blueprint.json' },
        { path: '/smartpick_colab.py', name: 'smartpick_colab.py' }
      ];

      for (const file of filesToExport) {
        try {
          const response = await fetch(file.path);
          if (response.ok) {
            const content = await response.text();
            zip.file(file.name, content);
          }
        } catch (e) {
          console.warn(`Could not export ${file.path}`);
        }
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `smartpick-v2.5-source-${Date.now()}.zip`);
      setIsExportUnlocked(true);
    } catch (err) {
      console.error(err);
      setExportError("Erreur lors de l'exportation du code.");
    } finally {
      setIsExporting(false);
    }
  };

  // Time Helpers (Device Local Time)
  const formatLocalTime = (timestamp: number) => {
    if (!timestamp || isNaN(timestamp)) return "--:--";
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).format(new Date(timestamp));
    } catch (e) {
      return "--:--";
    }
  };

  const getMatchStatus = (timestamp: number) => {
    const now = Date.now();
    const matchDuration = 2 * 60 * 60 * 1000; // 2 hours
    if (now >= timestamp && now <= timestamp + matchDuration) return 'live';
    if (now < timestamp) return 'upcoming';
    return 'past';
  };

  // --- Advanced Betting Math ---

  const calculateKellyStake = (p: number, b: number, fraction: number = 0.25) => {
    if (b <= 0) return 0;
    const q = 1 - p;
    const fStar = (p * (b + 1) - 1) / b;

    // Apply fractional Kelly for safety and ensure it's positive
    const safeFraction = Math.max(0, fStar * fraction);

    const availableBalance = Math.max(0, bankroll.balance - bankroll.lockedBalance);
    return Math.round(availableBalance * safeFraction);
  };

  // --- End Advanced Betting Math ---

  // Load extra non-critical data (Logs)
  useEffect(() => {
    const savedLogs = localStorage.getItem('smartpick_logs');
    if (savedLogs) setAnalysisLogs(JSON.parse(savedLogs));
  }, []);

  // Save data (LocalStorage cache/fallback)
  useEffect(() => {
    try {
      // We limit localStorage to 100 items to avoid quota limits
      localStorage.setItem('smartpick_history', JSON.stringify(history.slice(0, 100)));
      localStorage.setItem('smartpick_bankroll', JSON.stringify(bankroll));
      localStorage.setItem('smartpick_bets', JSON.stringify(bets.slice(0, 100)));
      localStorage.setItem('smartpick_logs', JSON.stringify(analysisLogs.slice(0, 20)));
      localStorage.setItem('smartpick_primary_model', primaryModel);
    } catch (e) {
      console.warn("LocalStorage save failed (likely quota exceeded):", e);
    }
  }, [history, bankroll, bets, analysisLogs, primaryModel]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const handleSuggestMatches = async () => {
    setIsSuggesting(true);
    try {
      const today = new Date().toLocaleDateString("fr-FR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      });

      // APPEL 1 — Protocole de collecte exhaustive via Google Search
      let collecteResponse;
      const suggestSearchQuery = `
        [MISSION : DÉTECTION DE MATCHS RÉELS]
        Sport : ${sport}
        Date de l'étude : ${today}

        Effectue une recherche web approfondie pour lister tous les matchs de ${sport} importants prévus AUJOURD'HUI et DEMAIN.
        C'est pour un outil d'analyse prédictive, donc les données doivent être RÉELLES et VERIFIEES.

        POUR CHAQUE MATCH TROUVÉ, EXTRAIS :
        1. Les noms exacts des deux équipes (Equipe A vs Equipe B).
        2. La compétition (ex: Ligue 1, NBA, Roland Garros).
        3. L'heure du coup d'envoi.

        Réponds sous forme de liste factuelle brute.`;

      try {
        collecteResponse = await callAiWithRetry({
          contents: suggestSearchQuery,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 1,
          }
        });
      } catch (err: any) {
        throw err;
      }

      const rawData = collecteResponse.text ?? "";

      // APPEL 2 — Extraction et formatage strict
      let response;
      const suggestPrompt = `
        [MISSION : FORMATAGE DE LISTE DE MATCHS]
        Données collectées via Google Search :
        ---
        ${rawData}
        ---

        Extrais de ce puits de données exactement 5 à 8 matchs parmi les plus populaires.
        RÈGLE ABSOLUE : Réponds UNIQUEMENT avec les noms des matchs séparés par des virgules.
        Aucune phrase, aucune introduction, aucun numéro.
        Format attendu : "Equipe A vs Equipe B, Equipe C vs Equipe D, Equipe E vs Equipe F"

        Si aucun match réel n'est trouvé, ne réponds rien.`;

      try {
        response = await callAiWithRetry({
          contents: suggestPrompt,
          config: { temperature: 1 }
        });
      } catch (err: any) {
        throw err;
      }

      if (response.text) {
        // Nettoyage supplémentaire par regex pour s'assurer qu'on n'a pas de blabla
        const cleanedText = response.text.replace(/\[.*?\]/g, "").trim();
        const foundMatches = cleanedText.split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && s.includes(" vs "));

        if (foundMatches.length > 0) {
          setSuggestions(foundMatches);
        }
      }
    } catch (err) {
      console.error("Suggestion Error:", err);
    } finally {
      setIsSuggesting(false);
    }
  };

  const safeJsonParse = (text: any) => {
    if (!text || typeof text !== 'string') return {};
    try {
      return JSON.parse(text);
    } catch (e) {
      // Nettoyage plus agressif si le parse direct échoue
      try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
      } catch (e2) {
        // Extraction du bloc JSON par détection de accolades/crochets
        try {
          const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
          if (match) {
            return JSON.parse(match[0]);
          }
        } catch (e3) {
          // Final fallback
        }
        return {};
      }
    }
  };

  const handleExplore = async () => {
    if (isExploring) return;
    setIsExploring(true);
    setView("explorer");
    try {
      const todayISO = new Date().toISOString().split('T')[0];
      const tomorrowISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      const exploreQuery = GET_INTERROGATIVE_EXPLORE_QUERY(sport, todayISO, tomorrowISO);
      console.log(`Collecte chronologique de ${sport}...`);

      let searchResponse = await callAiWithRetry({
        contents: exploreQuery,
        config: { tools: [{ googleSearch: {} }], temperature: 1 }
      });

      const rawData = searchResponse.text ?? "";
      const structPrompt = `Données :\n${rawData}\n\nMISSION : Convertis en JSON strict. Dates: YYYY-MM-DD. Heures: HH:MM. Trie par chronologie.\n\nJSON :\n{ "matches": [ { "home": "...", "away": "...", "date": "...", "time": "...", "competition": "...", "odds": { "1": 0, "N": 0, "2": 0 } } ] }`;

      const response = await callAiWithRetry({
        contents: structPrompt,
        config: { temperature: 1, responseMimeType: "application/json" }
      });

      if (response.text) {
        const data = safeJsonParse(response.text);
        const sortedMatches = (data.matches || []).sort((a: any, b: any) => {
          const dtA = `${a.date || '9999-12-31'}T${a.time || '00:00'}`;
          const dtB = `${b.date || '9999-12-31'}T${b.time || '00:00'}`;
          return dtA.localeCompare(dtB);
        });
        setExplorerMatches(sortedMatches);
        setSelectedMatches([]);
      }
    } catch (err) {
      console.error("Explore Error:", err);
    } finally {
      setIsExploring(false);
    }
  };

  const toggleMatchSelection = (match: any) => {
    setSelectedMatches(prev => {
      const isSelected = prev.some(m => m.home === match.home && m.away === match.away);
      if (isSelected) {
        return prev.filter(m => !(m.home === match.home && m.away === match.away));
      }
      if (prev.length >= 10) {
        alert("Limite de 10 matchs par analyse en rafale atteinte.");
        return prev;
      }
      return [...prev, match];
    });
  };

  const handleBatchAnalyze = async (matches: any[] = selectedMatches) => {
    if (matches.length === 0) return;
    setIsBatchAnalyzing(true);
    setBatchProgress(0);

    const successfulResults: AnalysisResult[] = [];
    let batchGlobalContext = "";

    try {
        const matchQueries = matches.map(m => `${m.home} vs ${m.away}`);

        // Use the new helper for industrialized grounding
        batchGlobalContext = await fetchGlobalGroundingData(matchQueries, sport);

        console.info("Collecte globale terminée. Passage à l'analyse individuelle.");
    } catch (err) {
        console.error("Global Collection Error:", err);
        // Fallback handled inside runSingleAnalysis (it will call grounding if context is empty)
    }

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      try {
        const result = await runSingleAnalysis(m.home, m.away, sport, batchGlobalContext);
        if (result) {
          successfulResults.push(result);
        }
      } catch (e) {
        console.error(`Error analyzing ${m.home} vs ${m.away}:`, e);
      }
      setBatchProgress(Math.min(100, ((i + 1) / matches.length) * 100));
      if (i < matches.length - 1) await sleep(1500);
    }

    setBatchResults(successfulResults);
    setIsBatchAnalyzing(false);
    setBatchProgress(100);

    // Auto-generate combinations and save batch summary
    if (successfulResults.length >= 2) {
        const comboItems = successfulResults.slice(0, 3).map(r => ({
          prediction: r.predictions?.[0] || { id: 'p-' + r.id, matchName: r.match.homeTeam + ' vs ' + r.match.awayTeam, sport: r.sport, type: 'N/A', odd: 1.0, confidence: 50, reasoning: '' },
          match: r.match
        }));

        const comboReport = await analyzeCombinationInternal(comboItems);

        const batchSummary: AnalysisResult = {
          id: 'batch-' + Math.random().toString(36).substring(2, 11),
          timestamp: Date.now(),
          sport: sport as any,
          isBatch: true,
          batchIds: successfulResults.map(r => r.id),
          comboReport: comboReport,
          match: {
            homeTeam: "ANALYSE GROUPÉE",
            awayTeam: `${successfulResults.length} MATCHS`,
            date: new Date().toLocaleDateString("fr-FR"),
            timestamp: Date.now(),
            competition: "PREDICTMASTER AI",
            odds: { home: 1.0, away: 1.0 }
          },
          predictions: successfulResults.map(r => r.predictions?.[0]).filter(p => !!p) as Prediction[],
          expertOpinions: [],
          formAnalysis: "",
          h2hAnalysis: "",
          absencesAnalysis: "",
          playerAnalysis: "",
          summary: `Analyse simultanée de ${successfulResults.length} matchs avec rapport combiné.`
        };
        addToHistory(batchSummary);
    }

    if (successfulResults.length > 0) {
        setResult(successfulResults[0]);
        setView('analyze');
    }
  };

  // Internal helper for analysis
  const runSingleAnalysis = async (home: string, away: string, sportType: string, preCollectedData?: string): Promise<AnalysisResult | null> => {
    const combinedQuery = `${home} vs ${away}`;
    const now = new Date();
    const today = now.toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

    let rawData = "";

    // Si on a des données pré-collectées, on extrait la partie pertinente
    if (preCollectedData) {
        rawData = extractMatchContext(preCollectedData, home, away);
    }

    // Si pas de données ou extraction vaine, on force une petite recherche dédiée (fallback sécurité)
    if (!rawData) {
        console.warn(`Extraction contextuelle échouée pour ${combinedQuery}. Lancement recherche dédiée.`);
        const collecteQuery = GET_INTERROGATIVE_COLLECTION_QUERY(combinedQuery, today, sportType);
        const response = await callAiWithRetry({
            contents: collecteQuery,
            config: { tools: [{ googleSearch: {} }], temperature: 1 }
        });
        rawData = response.text ?? "";
    }

    const preciseTime = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const startLabel = (searchStartDate && !isNaN(new Date(searchStartDate).getTime()))
      ? new Date(searchStartDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "--";
    const endLabel = (searchEndDate && !isNaN(new Date(searchEndDate).getTime()))
      ? new Date(searchEndDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "--";

    const baseInstruction = SYSTEM_INSTRUCTION_COLLECTOR(today, preciseTime, sportType, startLabel, endLabel);

    const analysisPrompt = `${baseInstruction}

    [EXTRACTION DU PUITS DE DONNÉES WEB]
    Données pour le match ${combinedQuery} :
    ${rawData}

    [MISSION FINALE]
    Génère l'objet JSON complet pour ce match.
    REMPLIS IMPÉRATIVEMENT les champs 'recentMatches' et 'standings' avec les chiffres trouvés ci-dessus.
    Si les données sont présentes dans le puits mais absentes du JSON, l'analyse sera rejetée.`;

    let analysisResponse = await callAiWithRetry({
        contents: analysisPrompt,
        config: { temperature: 1, responseMimeType: "application/json" }
    });

    const data = safeJsonParse(analysisResponse?.text || "");

    const matchTimestamp = Number(data?.match?.timestamp) || Date.now();
    const intermediateResult: AnalysisResult = {
        ...data,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        sport: sportType as any,
        match: {
            homeTeam: data?.match?.homeTeam || home || "Equipe A",
            awayTeam: data?.match?.awayTeam || away || "Equipe B",
            competition: data?.match?.competition || "Compétition",
            date: data?.match?.date || today,
            timestamp: matchTimestamp,
            odds: data?.match?.odds || { home: 1.0, away: 1.0 }
        }
    };

    const finalResult = recalculateAnalysis(intermediateResult);

    if (finalResult) {
        addToHistory(finalResult);
    }

    return finalResult;
  };

  const generateBatchCombinations = (results: AnalysisResult[]) => {
    // Pick top 3 most confident predictions from different matches
    const allPredictions = results.flatMap(r =>
        (r.predictions || []).map(p => ({ ...p, match: r.match }))
    );

    // Sort by confidence DESC
    const sorted = allPredictions.sort((a, b) => b.confidence - a.confidence);

    // Take 3 from unique matches
    const selected: any[] = [];
    const usedMatches = new Set();

    for (const pred of sorted) {
        const matchId = `${pred.match.homeTeam}-${pred.match.awayTeam}`;
        if (!usedMatches.has(matchId)) {
            selected.push({ prediction: pred, match: pred.match });
            usedMatches.add(matchId);
        }
        if (selected.length >= 3) break;
    }

    if (selected.length > 0) {
        setCoupon(selected);
        // Trigger combo analysis automatically if 3 matches
        if (selected.length === 3) {
            analyzeCombinationInternal(selected);
        }
    }
  };

  const analyzeCombinationInternal = async (items: any[]) => {
    setIsAnalyzingCombo(true);
    let report = "";
    try {
        const matchesData = items.map(i => ({
            match: i.match,
            prediction: i.prediction
        }));
        const promptString = `${COMBO_ANALYSIS_PROMPT}\n\nDonnées des matchs :\n${JSON.stringify(matchesData)}`;
        const response = await callAiWithRetry({
            contents: promptString,
        });
        report = response.text || "Analyse indisponible.";
        setComboAnalysis(report);
    } catch (e) {
        console.error("Combo Analysis Error:", e);
        report = "Erreur lors de l'analyse du combiné.";
    }
    setIsAnalyzingCombo(false);
    return report;
  };

  const handleManualComboAnalysis = () => analyzeCombinationInternal(coupon);

  const getRecentPerformance = () => {
    const recentBets = bets.slice(0, 5);
    if (recentBets.length === 0) return 1.0;
    const losses = recentBets.filter(b => b.status === 'lost').length;
    if (losses >= 3) return 0.5;
    if (losses >= 2) return 0.8;
    return 1.0;
  };

  const handleAnalyze = async (isLive = false) => {
    const queries = isMultiMode
      ? batchRows.filter(r => r.home.trim() || r.away.trim()).map(r => ({
          home: r.home.trim(),
          away: r.away.trim(),
          query: r.away.trim() ? `${r.home.trim()} vs ${r.away.trim()}` : r.home.trim()
        }))
      : [{ home: homeQuery, away: awayQuery, query: awayQuery.trim() ? `${homeQuery} vs ${awayQuery}` : homeQuery }];

    if (queries.length === 0 || (queries.length === 1 && !queries[0].query.trim())) return;

    if (queries.length > 1 || isMultiMode) {
        // Mode multi-match ou lot détecté
        setSelectedMatches(queries);
        handleBatchAnalyze(queries);
        return;
    }

    const { home, away, query: combinedQuery } = queries[0];
    setBatchResults([]);
    const logId = Math.random().toString(36).substring(2, 11);
    const startTime = Date.now();
    const newLog: AnalysisLog = {
      id: logId,
      timestamp: startTime,
      matchName: combinedQuery,
      steps: []
    };

    const addLogStep = (action: string, type: LogStep['type'] = 'info', details?: string) => {
      const step: LogStep = {
        time: new Date().toLocaleTimeString('fr-FR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        action,
        type,
        details
      };
      setAnalysisLogs(prev => {
        const existing = prev.find(l => l.id === logId);
        if (existing) {
          return prev.map(l => l.id === logId ? { ...l, steps: [...l.steps, step] } : l);
        }
        return [{ ...newLog, steps: [step] }, ...prev].slice(0, 20);
      });
    };

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    addLogStep("Activation de l'Agent Proxy", 'info', "Connexion au serveur proxy V12 (Node.js).");
    addLogStep("Spoofing d'identité mobile", 'decision', "L'IA se présente comme un terminal iPhone/Safari (iOS 17) pour contourner les blocages.");
    addLogStep("Démarrage de l'analyse", 'info', `Match: ${combinedQuery} | Mode: ${isLive ? 'LIVE' : 'Avant-match'}`);

    const isUrl = (str: string) => {
      try {
        const url = new URL(str);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch { return false; }
    };

    const queryIsUrl = isUrl(combinedQuery);
    const liveInstruction = isLive
      ? "C'est une analyse LIVE. Prends en compte le score actuel, le temps de jeu restant et les stats en direct."
      : "Analyse d'avant-match.";
    const now = new Date();
    const today = now.toLocaleDateString("fr-FR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric"
    });
    const preciseTime = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const startLabel = new Date(searchStartDate).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
    const endLabel = new Date(searchEndDate).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    let currentModel = "gemini-3.6-flash";

    try {
      let rawDataText = "";

      // Check if we have high-fidelity Firecrawl scraped content for this match
      const crawledKey = `smartpick_scraped_${home}_vs_${away}`;
      const savedScrapedContent = localStorage.getItem(crawledKey);

      if (savedScrapedContent) {
        addLogStep("Données Firecrawl détectées", 'decision', `Chargement du contenu de haute précision pour ${home} vs ${away} récolté via le Smart Scraper Firecrawl.`);
        rawDataText = savedScrapedContent;
      } else if (useDeepSearch) {
        addLogStep("Recherche de sources (Google Search)", 'decision', `Recherche des meilleurs liens d'analyse pour : ${combinedQuery}`);

        const discoveryQuery = `Trouve les 2 meilleurs liens d'analyse ou de statistiques (ex: SofaScore, Transfermarkt, Flashscore, Soccerway, ESPN, ou L'Équipe) contenant les statistiques détaillées, le classement et l'historique récent du match de ${sport} suivant : "${combinedQuery}" (saison en cours 2025/2026).
        Ta réponse doit être un JSON strict de la forme :
        {
          "urls": ["https://www.site1.com/match-details", "https://www.site2.com/match-details"]
        }`;

        let discoveredUrls: string[] = [];
        try {
          const discoveryResponse = await callAiWithRetry({
            contents: discoveryQuery,
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 1,
              responseMimeType: "application/json"
            }
          });

          const parsedDiscovery = safeJsonParse(discoveryResponse.text || "{}");
          discoveredUrls = parsedDiscovery?.urls || [];
        } catch (discoveryErr: any) {
          console.error("Discovery error:", discoveryErr);
          addLogStep("Échec découverte de sources", 'error', `Impossible de trouver des liens via Google : ${discoveryErr.message}`);
        }

        if (discoveredUrls && discoveredUrls.length > 0) {
          const validUrls = discoveredUrls.filter(url => url && typeof url === 'string' && url.startsWith('http'));
          addLogStep("Sources découvertes", 'info', `L'IA a identifié les sites pertinents :\n${validUrls.join("\n")}`);

          let combinedScrapeResults = "";
          const firecrawlApiKey = localStorage.getItem('smartpick_firecrawl_api_key') || "";

          for (const url of validUrls) {
            addLogStep("Scraping en cours", 'decision', `Lecture en profondeur via Firecrawl : ${url}`);
            try {
              const response = await fetch('/api/firecrawl/scrape', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'x-firecrawl-api-key': firecrawlApiKey
                },
                body: JSON.stringify({
                  url: url,
                  options: {
                    formats: ["markdown"],
                    onlyMainContent: true
                  }
                })
              });

              const data = await response.json();
              if (response.ok && data?.data?.markdown) {
                const charCount = data.data.markdown.length;
                addLogStep("Scraping réussi !", 'info', `Données extraites avec succès de ${url} (${charCount} caractères).`);
                combinedScrapeResults += `\n\n--- DONNÉES DE LA SOURCE : ${url} ---\n\n` + data.data.markdown;
              } else {
                addLogStep("Échec lecture source", 'error', `Erreur de scraping pour ${url} : ${data.error || "Format invalide"}`);
              }
            } catch (scrapeErr: any) {
              addLogStep("Échec lecture source", 'error', `Impossible de lire ${url} : ${scrapeErr.message}`);
            }
          }

          if (combinedScrapeResults.trim().length > 0) {
            rawDataText = combinedScrapeResults;
            localStorage.setItem(crawledKey, combinedScrapeResults);
          } else {
            addLogStep("Scraping infructueux", 'error', "Aucune donnée n'a pu être extraite des liens trouvés. Repli sur la recherche Google classique...");
          }
        } else {
          addLogStep("Aucun lien exploitable", 'error', "Google Search n'a pas retourné de liens exploitables. Repli sur la recherche Google classique...");
        }

        if (!rawDataText) {
          addLogStep("Appel de secours : Google Search Grounding", 'decision', "Utilisation du moteur de recherche direct pour récupérer les données essentielles.");
          const collecteQuery = GET_INTERROGATIVE_COLLECTION_QUERY(combinedQuery, today, sport);
          let collecteResponse = await callAiWithRetry({
            contents: collecteQuery,
            config: {
              tools: [{ googleSearch: {} }],
              temperature: 1,
            }
          });
          rawDataText = collecteResponse.text ?? "Aucune donnée collectée.";
        }
      } else {
        addLogStep("Appel 1 : Collecte des données (Grounding)", 'decision', "Utilisation de l'outil Google Search pour récupérer les stats réelles.");

        const collecteQuery = GET_INTERROGATIVE_COLLECTION_QUERY(combinedQuery, today, sport);
        addLogStep("Prompt de Grounding généré", 'ai_reasoning', collecteQuery);

        let collecteResponse = await callAiWithRetry({
          contents: collecteQuery,
          config: {
            tools: [{ googleSearch: {} }],
            temperature: 1,
          }
        });

        rawDataText = collecteResponse.text ?? "Aucune donnée collectée.";
      }

      addLogStep("Données collectées avec succès", 'info', rawDataText.substring(0, 200) + "...");

      // ════════════════════════════════════════════════════════════════
      // APPEL 2 — CALCUL MOTEUR V5.0 (temperature: 0, sans grounding)
      // ════════════════════════════════════════════════════════════════
      addLogStep("Appel 2 : Analyse Moteur V5.0", 'decision', "Calcul des probabilités et Dixon-Coles.");

      const analysePrompt = `SOURCE DE VÉRITÉ ABSOLUE (DONNÉES RÉELLES COLLECTÉES) :
  ---
  ${rawDataText}
  ---

  INTERDICTION FORMELLE :
  1. Ne pas utiliser de "données internes" ou de connaissances pré-entraînées si elles contredisent les données ci-dessus.
  2. Ne pas inventer de scores. Si un match n'est pas dans la liste ci-dessus, il n'existe pas pour cette analyse.
  3. Chaque chiffre (Lambda, Variance, Probabilité) doit découler DIRECTEMENT des calculs sur les scores listés ci-dessus.

  CONTEXTE DU MATCH :
  - Sport : ${sport}
  - Match : ${combinedQuery}
  - Date/Heure de l'analyse : ${today} à ${preciseTime}

  MISSION : Applique le MOTEUR V5.0 (THÉORIE DES MARCHÉS & MODÈLE BINOMIAL NÉGATIF).
  1. ANALYSE MATHÉMATIQUE :
     - Calcule la moyenne (λ) et la variance (σ²) pour chaque équipe (Saison + Forme).
     - Applique la Loi Binomiale Négative si σ² > λ.
  2. SÉLECTION STRATÉGIQUE (THÉORIE DES MARCHÉS) :
     - Évalue la LISIBILITÉ de chaque marché (1X2, O/U, BTTS, Handicap, etc.) en fonction des données collectées.
     - Identifie les marchés avec le meilleur ratio Lisibilité/Risque.
  3. AJUSTEMENT QUALITATIF :
     - Impact Player Index & Facteurs de déstabilisation.
  4. JSON :
     - Remplit le champ "marketSelection" avec les 3 meilleurs marchés identifiés (Priorité P1 à P3).
     - Détaille les calculs dans "notes".`;

      const systemInstruction = SYSTEM_INSTRUCTION_COLLECTOR(today, preciseTime, sport, startLabel, endLabel);

      let analyseResponse = await callAiWithRetry({
        contents: analysePrompt,
        config: {
          systemInstruction,
          temperature: 1,
          responseMimeType: "application/json",
        }
      });

      if (!analyseResponse.text) throw new Error("Réponse vide de l'IA");
      addLogStep("Données brutes reçues", 'ai_reasoning', "Lancement du moteur de calcul JS local V4.2.");

      const rawData = safeJsonParse(analyseResponse.text);

      // --- ARCHITECTURE V4.2 : JS OVERRIDE ---
      // On injecte les données brutes dans le moteur JS qui fait TOUS les calculs
      const matchTimestamp = Number(rawData?.match?.timestamp) || Date.now();
      const intermediateResult: AnalysisResult = {
        ...rawData,
        id: Math.random().toString(36).substring(2, 11),
        timestamp: Date.now(),
        sport,
        debugPrompts: {
          collector: systemInstruction,
          analyzer: analysePrompt,
          report: '' // Filled later
        },
        match: {
            homeTeam: rawData?.match?.homeTeam || homeQuery || "Home",
            awayTeam: rawData?.match?.awayTeam || awayQuery || "Away",
            competition: rawData?.match?.competition || "Compétition",
            date: rawData?.match?.date || today,
            timestamp: matchTimestamp,
            odds: rawData?.match?.odds || { home: 1.0, away: 1.0 }
        },
        recentMatches: {
          home: (rawData.recentMatches?.home || []).map((m: any) => ({
            ...m,
            date: m.date || new Date(Number(m.timestamp) || Date.now()).toLocaleDateString(),
            goalsScored: Number(m.goalsScored) || 0,
            goalsConceded: Number(m.goalsConceded) || 0,
            timestamp: Number(m.timestamp) || Date.now()
          })).sort((a: any, b: any) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0)),
          away: (rawData.recentMatches?.away || []).map((m: any) => ({
            ...m,
            date: m.date || new Date(Number(m.timestamp) || Date.now()).toLocaleDateString(),
            goalsScored: Number(m.goalsScored) || 0,
            goalsConceded: Number(m.goalsConceded) || 0,
            timestamp: Number(m.timestamp) || Date.now()
          })).sort((a: any, b: any) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0))
        },
        h2hMatches: (rawData.h2hMatches || []).map((m: any) => ({
          ...m,
          goalsHome: Number(m.goalsHome) || 0,
          goalsAway: Number(m.goalsAway) || 0,
          timestamp: Number(m.timestamp) || Date.now()
        })).sort((a: any, b: any) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0)),
        predictions: (rawData.predictions || []).map((p: any) => ({
          ...p,
          id: Math.random().toString(36).substring(2, 11),
          matchName: `${rawData.match?.homeTeam || homeQuery || "Home"} vs ${rawData.match?.awayTeam || awayQuery || "Away"}`
        })),
        marketSelection: rawData.marketSelection || [],
        standings: (rawData.standings && rawData.standings.home && rawData.standings.away) ? {
          home: {
            ...rawData.standings.home,
            rank: Number(rawData.standings.home.rank) || 0,
            points: Number(rawData.standings.home.points) || 0,
            played: Number(rawData.standings.home.played) || 0,
            gf_total: Number(rawData.standings.home.gf_total) || 0,
            ga_total: Number(rawData.standings.home.ga_total) || 0,
            gf_home: Number(rawData.standings.home.gf_home) || 0,
            ga_home: Number(rawData.standings.home.ga_home) || 0,
            season_variance: Number(rawData.standings.home.season_variance) || 0,
          },
          away: {
            ...rawData.standings.away,
            rank: Number(rawData.standings.away.rank) || 0,
            points: Number(rawData.standings.away.points) || 0,
            played: Number(rawData.standings.away.played) || 0,
            gf_total: Number(rawData.standings.away.gf_total) || 0,
            ga_total: Number(rawData.standings.away.ga_total) || 0,
            gf_away: Number(rawData.standings.away.gf_away) || 0,
            ga_away: Number(rawData.standings.away.ga_away) || 0,
            season_variance: Number(rawData.standings.away.season_variance) || 0,
          }
        } : undefined,
        quantitativeData: rawData.quantitativeData ? {
          ...rawData.quantitativeData,
          qualScore: rawData.quantitativeData.qualScore ? {
            ...rawData.quantitativeData.qualScore,
            impactHome: Number(rawData.quantitativeData.qualScore.impactHome) || 1.0,
            impactAway: Number(rawData.quantitativeData.qualScore.impactAway) || 1.0,
          } : undefined
        } : undefined
      };

      const finalResult = recalculateAnalysis(intermediateResult);

      addLogStep("Mise en forme du rapport", 'ai_reasoning', "Génération du rapport PredictMaster AI 2026.");
      const reportFormatterPrompt = REPORT_FORMATTER_PROMPT(`${finalResult.match.homeTeam} vs ${finalResult.match.awayTeam}`, today);
      let reportResponse = await callAiWithRetry({
        contents: `Voici les données de l'analyse brute :
          ---
          BRUT JSON: ${JSON.stringify(finalResult)}
          ---
          Génère maintenant le rapport complet en suivant le protocole strict.
          S'il manque des données dans le JSON, signale-le honnêtement dans le rapport au lieu de laisser vide.`,
        config: {
          systemInstruction: reportFormatterPrompt,
          temperature: 1,
        }
      });

      finalResult.report = reportResponse.text ?? "Erreur lors de la génération du rapport.";
      if (finalResult.debugPrompts) {
        finalResult.debugPrompts.report = reportFormatterPrompt;
      }

      setResult(finalResult);
      addToHistory(finalResult);
      addLogStep("Analyse terminée avec succès", 'info', "Moteur V4.2 High Precision appliqué.");

    } catch (err: any) {
      console.error("Analysis Error:", err);
      const errorMsg = err.message || "Erreur inconnue";
      setError(`Erreur d'analyse : ${errorMsg}`);
      addLogStep("Erreur fatale", 'error', errorMsg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const verifyBetResult = async (bet: Bet) => {
    setIsVerifying(bet.id);
    try {
      const matchDate = new Date(bet.timestamp || Date.now());
      const dateStr = matchDate.toLocaleDateString("fr-FR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      });
      const dateISO = matchDate.toISOString().slice(0, 10);

      // APPEL 1 — Collecte grounding
      let collecteResponse = await callAiWithRetry({
        contents: `Peux-tu vérifier sur le web quel est le score final officiel du match "${bet.matchName}" disputé le ${dateStr} (${dateISO}) ?
  Ne simule pas et n'utilise pas ta base de connaissances interne. Effectue une recherche web en temps réel.
  Détails requis :
  1. Score final exact.
  2. Confirmation du match à cette date précise.
  3. État du match (Terminé, En cours, Repoussé).`,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 1,
        }
      });

      const rawData = collecteResponse.text ?? "";

      // APPEL 2 — Verdict structuré
      const verdictPrompt = `Résultat trouvé pour le match "${bet.matchName}" du ${dateStr} :
  ---
  ${rawData}
  ---
  Le pari enregistré était : "${bet.prediction}" à la cote ${bet.odd}.

  En te basant UNIQUEMENT sur le résultat ci-dessus, détermine si ce pari est gagné, perdu ou encore en attente.
  Réponds UNIQUEMENT avec ce JSON strict :
  {
    "status": "won" | "lost" | "pending",
    "score": "Score final ex: 2-1 (ou 'Non disponible')",
    "reason": "Explication courte et précise basée sur le score réel"
  }
  RÈGLE : Si le résultat n'est pas clairement disponible dans les données, retourne "pending".`;

      let response = await callAiWithRetry({
        contents: verdictPrompt,
        config: {
          temperature: 1,
          responseMimeType: "application/json",
        }
      });

      const data = safeJsonParse(response.text ?? "");

      if (data.status !== "pending") {
        let newBalance = bankroll.balance;
        if (data.status === "won") {
          newBalance += bet.stake * bet.odd;
        }
        const newBankroll = {
          ...bankroll,
          balance: newBalance,
          balanceHistory: [
            ...bankroll.balanceHistory.slice(-49),
            { timestamp: Date.now(), balance: newBalance }
          ]
        };

        if (user) {
          try {
            await setDoc(doc(db, 'users', user.uid, 'bets', bet.id), { status: data.status, score: data.score }, { merge: true });
            await updateBankroll(newBankroll);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bets/${bet.id}`);
          }
        } else {
          setBets(prev => prev.map(b => b.id === bet.id ? { ...b, status: data.status, score: data.score } : b));
          setBankroll(newBankroll);
        }
      }
    } catch (err) {
      console.error("VerifyBet Error:", err);
    } finally {
      setIsVerifying(null);
    }
  };

  const autoGenerateCoupon = async () => {
    setIsGeneratingCoupon(true);
    setError(null);
    try {
      const now = new Date();
      const today = now.toLocaleDateString("fr-FR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric"
      });
      const preciseTime = now.toLocaleTimeString("fr-FR", { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const startLabel = (searchStartDate && !isNaN(new Date(searchStartDate).getTime())) ? new Date(searchStartDate).toLocaleDateString("fr-FR") : "--";
      const endLabel = (searchEndDate && !isNaN(new Date(searchEndDate).getTime())) ? new Date(searchEndDate).toLocaleDateString("fr-FR") : "--";

      // ════════════════════════════════════════════════════════════
      // APPEL 1 — Collecte grounding : matchs réels sur la période
      // ════════════════════════════════════════════════════════════
      let collecteResponse = await callAiWithRetry({
        contents: `Quels sont les matchs de ${sport} officiellement prévus entre le ${startLabel} et le ${endLabel} selon les sources web en temps réel ?
        Effectue une recherche web approfondie et pour chaque match trouvé, réponds précisément aux questions suivantes :
        1. Quels sont les scores exacts des 10 derniers matchs (avec dates au format AAAA-MM-JJ) de chaque équipe ?
        2. Quel est le classement actuel, les buts marqués et encaissés dans le championnat en cours ?
        3. Quels sont les joueurs officiellement absents confirmés par les news sportives de moins de 24 heures ?
        4. Quelles sont les cotes 1N2 actuelles proposées sur le marché ?

        IMPORTANT : Ne simule aucune donnée. Cite uniquement les matchs réels.`,
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 1,
        }
      });

      const rawDataText = collecteResponse.text ?? "Aucune donnée collectée.";

      // ════════════════════════════════════════════════════════════
      // APPEL 2 — Génération du coupon depuis données réelles
      // ════════════════════════════════════════════════════════════
      const couponPrompt = `DONNÉES RÉELLES COLLECTÉES VIA RECHERCHE WEB (MAINTENANT : ${today} à ${preciseTime}) :
  ---
  ${rawDataText}
  ---

  PARAMÈTRES DU COUPON :
  - Nombre de matchs par ticket : ${bankroll.maxEventsPerCoupon}
  - Nombre de tickets : ${bankroll.maxTicketsPerDay}
  - Cote visée par ticket : ${bankroll.dailyTargetOdd}
  - Sport : ${sport}
  - Période : du ${startLabel} au ${endLabel}

  MISSION : Génère les tickets en sélectionnant uniquement les matchs présents dans les données ci-dessus.
  IMPORTANT : Cette analyse est INDÉPENDANTE de toute analyse précédente. Ne tiens pas compte de l'historique de l'utilisateur ou de recherches passées.
  Pour chaque sélection, justifie le pronostic par les données réelles (forme, classement, absences).
  Ne jamais sélectionner un match absent des données collectées.`;

      const couponSystemInstruction = COUPON_SYSTEM_INSTRUCTION;

      let response = await callAiWithRetry({
        contents: couponPrompt,
        config: {
          systemInstruction: couponSystemInstruction,
          temperature: 1,
          responseMimeType: "application/json",
        }
      });

      if (!response.text) throw new Error("Réponse vide");
      const tickets = safeJsonParse(response.text);
      const data = tickets[0].selections;

      const items: CouponItem[] = data.map((d: any) => {
        const matchNames = (d?.match || "").split(" vs ");
        return {
          match: {
            homeTeam: matchNames[0] || "Equipe A",
            awayTeam: matchNames[1] || "Equipe B",
            competition: d?.competition || "Compétition",
            date: new Date(d?.timestamp || Date.now()).toLocaleDateString(),
            timestamp: Number(d?.timestamp) || Date.now(),
            odds: { home: 0, away: 0 }
          },
          prediction: {
            id: Math.random().toString(36).substring(2, 11),
            matchName: d?.match || "Inconnu",
            sport: sport as any,
            type: d?.pari || "N/A",
            odd: Number(d?.odd) || 1.0,
            confidence: parseInt(d?.confiance) || 0,
            reasoning: d?.reasoning || ""
          }
        };
      });

      setCoupon(items);
      setView("coupon");

    } catch (err) {
      console.error(err);
      setError("Impossible de générer un coupon automatique pour le moment.");
    } finally {
      setIsGeneratingCoupon(false);
    }
  };

  const saveCoupon = async () => {
    if (!user || !coupon || coupon.length === 0) return;

    const combinedOdd = coupon.reduce((acc, item) => acc * (item.prediction?.odd || 1), 1);
    const matchNames = coupon.map(item => `${item.match?.homeTeam || "Home"} vs ${item.match?.awayTeam || "Away"}`).join(' | ');
    const predictionNames = coupon.map(item => item.prediction?.type || "N/A").join(' | ');

    const newBet: Bet = {
      id: Math.random().toString(36).substring(2, 11),
      matchId: 'coupon-' + Date.now().toString(36),
      matchName: matchNames,
      prediction: predictionNames,
      odd: Number(combinedOdd?.toFixed(2) || 0),
      stake: 0,
      status: 'pending',
      timestamp: Date.now(),
      sport,
      isCombined: true,
      userId: user.uid
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'bets', newBet.id), newBet);
        // Dual-write to Cloud SQL
        syncBetToPostgres(newBet);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bets/${newBet.id}`);
      }
    } else {
      setBets(prev => [newBet, ...prev]);
    }
    alert("Coupon enregistré dans votre historique !");
  };

  const calculateIdealStake = (confidence: number, odd: number) => {
    const p = confidence / 100;
    const b = odd - 1;

    // Use Kelly Criterion for more scientific staking
    // We use a fraction based on the risk profile
    const riskFractions = {
      conservative: 0.1, // 1/10 Kelly
      balanced: 0.25,   // 1/4 Kelly
      aggressive: 0.5    // 1/2 Kelly
    };

    const kellyStake = calculateKellyStake(p, b, riskFractions[bankroll.riskProfile]);

    // Apply performance factor from recent history
    const performanceFactor = getRecentPerformance();
    const adjustedStake = kellyStake * performanceFactor;

    // Minimum stake of 100 or 1% of balance, whichever is smaller
    const minStake = Math.min(100, bankroll.balance * 0.01);
    return Math.max(Math.round(minStake), Math.round(adjustedStake));
  };

  const addToCoupon = (prediction: Prediction, match: MatchInfo) => {
    if (coupon.some(item => item.prediction.id === prediction.id)) return;
    setCoupon(prev => [...prev, { prediction, match }]);
  };

  const removeFromCoupon = (id: string) => {
    setCoupon(prev => prev.filter(item => item.prediction.id !== id));
  };

  const totalCouponOdd = coupon.reduce((acc, item) => acc * item.prediction.odd, 1);
  const combinedProb = coupon.reduce((acc, item) => acc * (item.prediction.confidence / 100), 1);
  const combinedConfidence = Math.round(combinedProb * 100);

  const getRiskLevel = (prob: number, odd: number) => {
    const expectedValue = prob * odd;
    if (prob < 0.15) return { label: 'Risque Très Élevé', color: 'text-red-500', icon: Flame };
    if (prob < 0.30) return { label: 'Risque Élevé', color: 'text-orange-500', icon: AlertCircle };
    if (prob < 0.50) return { label: 'Risque Modéré', color: 'text-yellow-500', icon: Activity };
    return { label: 'Risque Faible', color: 'text-green-500', icon: ShieldCheck };
  };

  const risk = getRiskLevel(combinedProb, totalCouponOdd);

  const placeCouponBet = async () => {
    if (coupon.length === 0) return;
    const today = new Date().toDateString();
    const ticketsToday = bets.filter(b => {
      if (!b.timestamp) return false;
      try {
        return new Date(b.timestamp).toDateString() === today;
      } catch (e) {
        return false;
      }
    }).length;
    if (ticketsToday >= bankroll.maxTicketsPerDay) {
      alert(`Limite de ${bankroll.maxTicketsPerDay} tickets par jour atteinte.`);
      return;
    }
    const avgConfidence = coupon.reduce((acc, item) => acc + item.prediction.confidence, 0) / coupon.length;
    let stakeValue = calculateIdealStake(avgConfidence, totalCouponOdd);
    if (stakeValue > bankroll.balance) {
      alert("Solde insuffisant pour la mise minimale de 90 CFA.");
      return;
    }
    const newBet: Bet = {
      id: Math.random().toString(36).substring(2, 11),
      matchId: coupon.length > 1 ? `Combiné (${coupon.length} matchs)` : coupon[0].prediction.matchName,
      matchName: coupon.length > 1 ? 'Pari Combiné' : coupon[0].prediction.matchName,
      prediction: coupon.map(c => c.prediction.type).join(' + '),
      odd: totalCouponOdd,
      stake: stakeValue,
      status: 'pending' as const,
      timestamp: Date.now(),
      sport: coupon[0].prediction.sport,
      isCombined: coupon.length > 1,
      userId: user?.uid
    };
    const newBankroll = {
      ...bankroll,
      balance: bankroll.balance - stakeValue,
      balanceHistory: [...bankroll.balanceHistory.slice(-49), { timestamp: Date.now(), balance: bankroll.balance - stakeValue }]
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'bets', newBet.id), newBet);
        await updateBankroll(newBankroll);
        // Dual-write to Cloud SQL
        syncBetToPostgres(newBet);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bets/${newBet.id}`);
      }
    } else {
      setBets(prev => [newBet, ...prev]);
      setBankroll(newBankroll);
    }

    setCoupon([]);
    setView('bankroll');
  };

  const updateBetStatus = async (betId: string, status: 'won' | 'lost') => {
    const bet = bets.find(b => b.id === betId);
    if (!bet || bet.status !== 'pending') return;
    let newBalance = bankroll.balance;
    if (status === 'won') newBalance += bet.stake * bet.odd;
    const newBankroll = {
      ...bankroll,
      balance: newBalance,
      balanceHistory: [...bankroll.balanceHistory.slice(-49), { timestamp: Date.now(), balance: newBalance }]
    };

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'bets', betId), { status }, { merge: true });
        await updateBankroll(newBankroll);
        // Dual-write to Cloud SQL
        updateBetStatusInPostgres(betId, status);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/bets/${betId}`);
      }
    } else {
      setBets(prev => prev.map(b => b.id === betId ? { ...b, status } : b));
      setBankroll(newBankroll);
    }
  };

  const handleUpdateBalance = () => {
    const newBalance = parseFloat(balanceInput);
    if (isNaN(newBalance)) return;

    const newBankroll = {
      ...bankroll,
      balance: newBalance,
      balanceHistory: [
        ...bankroll.balanceHistory.slice(-49),
        { timestamp: Date.now(), balance: newBalance }
      ]
    };
    updateBankroll(newBankroll);
    setIsEditingBalance(false);
  };

  const startEditingBalance = () => {
    setBalanceInput(bankroll.balance.toString());
    setIsEditingBalance(true);
  };

  const totalProfit = bankroll.balance - bankroll.initialBalance;
  const progressToGoal = Math.min((bankroll.balance / bankroll.savingsGoal) * 100, 100);
  const performanceFactor = getRecentPerformance();
  const showWithdrawSuggestion = bankroll.balance >= bankroll.initialBalance * 2;

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0D0F12] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  // Guest mode fallback if no Firebase user logged in
  const activeUser = user || {
    uid: 'guest-user',
    displayName: 'Invité PredictMaster',
    email: 'guest@predictmaster.ai',
    photoURL: ''
  };

  return (
    <div className="min-h-screen bg-[#0D0F12] text-white font-sans selection:bg-orange-500/30">
      <div className="flex flex-col min-w-0 min-h-screen relative">
        {/* Header */}
        <Header
          sport={sport}
          setSport={setSport}
          homeQuery={homeQuery}
          setHomeQuery={setHomeQuery}
          awayQuery={awayQuery}
          setAwayQuery={setAwayQuery}
          isAnalyzing={isAnalyzing}
          handleAnalyze={handleAnalyze}
          user={user}
          handleLogin={handleLogin}
          handleLogout={handleLogout}
          view={view}
          setView={setView}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="w-full p-2 lg:p-4">
        {/* Adaptive AI Alert */}
        {performanceFactor < 1.0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center animate-pulse"><BrainCircuit className="w-6 h-6 text-black" /></div>
            <div>
              <p className="text-red-400 font-black uppercase text-xs tracking-widest">IA en Mode Sécurité</p>
              <p className="text-white/60 text-sm">Pertes récentes détectées. L'IA est devenue plus prudente.</p>
            </div>
          </motion.div>
        )}

        {/* Withdrawal Suggestion */}
        {showWithdrawSuggestion && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 bg-green-500 rounded-2xl p-6 text-black flex items-center justify-between">
            <div className="flex items-center gap-4"><Coins className="w-8 h-8" /><div><p className="font-black uppercase text-sm">Suggestion de Retrait</p><p className="text-black/70 text-sm font-bold">Vous avez doublé votre capital !</p></div></div>
            <button onClick={() => setBankroll(p => ({...p, balance: p.balance - Math.round(p.balance * 0.5)}))} className="bg-black text-white px-6 py-2 rounded-xl font-black uppercase text-xs hover:bg-black/80 transition-all">Retirer 50%</button>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {(view === 'analyze' || view === 'live') && (
            <motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <section className="mb-12 text-center">
                <div className="flex justify-center gap-4 mb-3">
                  <button onClick={() => setSport('football')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${sport === 'football' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/50 hover:border-white/30'}`}>Football</button>
                  <button onClick={() => setSport('basketball')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${sport === 'basketball' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/50 hover:border-white/30'}`}>Basketball</button>
                </div>
                <div className="flex justify-center gap-4 mb-6">
                  <button onClick={() => setIsMultiMode(false)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${!isMultiMode ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}>Match Unique</button>
                  <button onClick={() => setIsMultiMode(true)} className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full transition-all ${isMultiMode ? 'bg-white/10 text-white' : 'text-white/20 hover:text-white/40'}`}>Multi-Matchs</button>
                </div>
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter uppercase italic">
                  PredictMaster <span className="text-orange-500">AI 2026</span>
                </h1>
                <div className="max-w-4xl mx-auto mt-8">
                  {isMultiMode ? (
                    <div className="space-y-6">
                      <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                          <div className="flex items-center gap-2 text-white/40">
                            <Table className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Tableau des Matchs en Rafale</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                const text = window.prompt("Collez votre liste de matchs (un par ligne, ex: Équipe A vs Équipe B) :");
                                if (text) {
                                  const parsed = parseBatchQueries(text);
                                  if (parsed.length > 0) {
                                    setBatchRows(parsed.map(p => ({ home: p.home, away: p.away })));
                                  }
                                }
                              }}
                              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/50 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <Layers className="w-3 h-3" />
                              <span className="hidden sm:inline">Importation en vrac</span>
                            </button>
                            <button
                              onClick={() => setBatchRows([...batchRows, { home: '', away: '' }])}
                              className="flex items-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                            >
                              <Plus className="w-3 h-3" />
                              Ajouter un match
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                          {batchRows.map((row, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex flex-col md:flex-row items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:border-orange-500/20 transition-all"
                            >
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-black text-white/40 flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] items-center gap-3 w-full">
                                <input
                                  type="text"
                                  value={row.home}
                                  onChange={(e) => {
                                    const newRows = [...batchRows];
                                    newRows[idx] = { ...newRows[idx], home: e.target.value };
                                    setBatchRows(newRows);
                                  }}
                                  placeholder="Équipe Domicile"
                                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500/50 text-sm font-bold text-white transition-all"
                                />
                                <span className="text-[10px] font-black text-white/20 uppercase italic">VS</span>
                                <input
                                  type="text"
                                  value={row.away}
                                  onChange={(e) => {
                                    const newRows = [...batchRows];
                                    newRows[idx] = { ...newRows[idx], away: e.target.value };
                                    setBatchRows(newRows);
                                  }}
                                  placeholder="Équipe Extérieur"
                                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500/50 text-sm font-bold text-white transition-all"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newRows = batchRows.filter((_, i) => i !== idx);
                                  setBatchRows(newRows.length > 0 ? newRows : [{ home: '', away: '' }]);
                                }}
                                className="p-3 text-white/20 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col items-center gap-4">
                        <button
                          onClick={() => handleAnalyze()}
                          disabled={isBatchAnalyzing || batchRows.every(r => !r.home.trim() && !r.away.trim())}
                          className="px-12 py-5 bg-orange-500 hover:bg-orange-600 text-black rounded-2xl font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isBatchAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Flame className="w-5 h-5" />}
                          Analyser {batchRows.filter(r => r.home.trim() || r.away.trim()).length} Matchs
                        </button>

                        {isBatchAnalyzing && (
                          <div className="w-full max-w-md bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${batchProgress}%` }}
                              className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                            />
                          </div>
                        )}
                        {isBatchAnalyzing && <p className="text-[10px] font-black uppercase text-orange-500 animate-pulse">Traitement en cours : {Math.round(batchProgress)}%</p>}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row items-stretch gap-3">
                        <div className="flex-1 relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Home className="w-5 h-5 text-white/30 group-focus-within:text-orange-500" />
                          </div>
                          <input
                            type="text"
                            value={homeQuery || ""}
                            onChange={(e) => setHomeQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(view === 'live')}
                            placeholder="Équipe Domicile (ou lien)"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 text-lg font-medium transition-all"
                          />
                        </div>

                        <div className="flex items-center justify-center px-2">
                          <span className="text-white/20 font-black italic text-xl tracking-tighter">VS</span>
                        </div>

                        <div className="flex-1 relative group">
                          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                            <Shield className="w-5 h-5 text-white/30 group-focus-within:text-orange-500" />
                          </div>
                          <input
                            type="text"
                            value={awayQuery || ""}
                            onChange={(e) => setAwayQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze(view === 'live')}
                            placeholder="Équipe Extérieur"
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 pl-12 pr-4 focus:outline-none focus:border-orange-500/50 text-lg font-medium transition-all"
                          />
                        </div>

                        <button
                          onClick={() => handleAnalyze(view === 'live')}
                          disabled={isAnalyzing || !homeQuery.trim()}
                          className={`px-8 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 min-w-[160px] ${view === 'live' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'} text-black disabled:bg-white/5 disabled:text-white/20`}
                        >
                          {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                              <Zap className="w-5 h-5" />
                              <span>Analyser</span>
                            </>
                          )}
                        </button>
                      </div>
                      {result && (
                        <button
                          onClick={() => setResult(null)}
                          className="px-6 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/40 hover:text-red-400 hover:border-red-400/50 mt-4 mx-auto block"
                          title="Effacer les résultats actuels"
                        >
                          <Trash2 className="w-5 h-5" />
                          <span className="hidden md:inline">Effacer Résultats</span>
                        </button>
                      )}
                    </>
                  )}
                  </div>
                <div className="flex flex-col items-center gap-4 pt-6">
                  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/10 w-full max-w-lg">
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-white/40 block mb-1 tracking-wider">Début Recherche</label>
                      <input
                        type="datetime-local"
                        value={searchStartDate || ""}
                        onChange={(e) => setSearchStartDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-white focus:outline-none w-full cursor-pointer"
                      />
                    </div>
                    <div className="w-px h-10 bg-white/10" />
                    <div className="flex-1">
                      <label className="text-[10px] font-black uppercase text-white/40 block mb-1 tracking-wider">Fin Recherche</label>
                      <input
                        type="datetime-local"
                        value={searchEndDate || ""}
                        onChange={(e) => setSearchEndDate(e.target.value)}
                        className="bg-transparent text-xs font-bold text-white focus:outline-none w-full cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Complementary Search Toggle */}
                  <div className="flex flex-col items-center bg-white/5 p-4 rounded-2xl border border-white/10 w-full max-w-lg mt-2">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                          <Network className="w-5 h-5" />
                        </div>
                        <div className="text-left">
                          <p className="text-xs font-black uppercase tracking-wider text-white">Recherche Complémentaire</p>
                          <p className="text-[10px] text-white/40 font-bold">Google Web Search + Scraping Firecrawl</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleDeepSearch(!useDeepSearch)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          useDeepSearch ? 'bg-orange-500' : 'bg-white/10'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                            useDeepSearch ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                    {useDeepSearch && (
                      <div className="mt-3 text-[10px] text-left leading-relaxed text-orange-500/70 font-bold bg-orange-500/5 p-2 rounded-lg border border-orange-500/10 w-full flex gap-2">
                        <Sparkles className="w-4 h-4 flex-shrink-0 text-orange-500 animate-pulse" />
                        <span><strong>Moteur hybride activé :</strong> L'IA va d'abord chercher les meilleurs liens statistiques sur Google, puis Firecrawl extraira l'intégralité du contenu textuel de ces pages en temps réel avant d'exécuter le moteur d'analyse Dixon-Coles.</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                      <Globe className="w-3 h-3" />
                      <span>Supporte les liens Flashscore, SofaScore, etc.</span>
                    </div>
                    <button onClick={handleSuggestMatches} disabled={isSuggesting} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">
                      <RefreshCw className={`w-3 h-3 ${isSuggesting ? 'animate-spin' : ''}`} />
                      {isSuggesting ? 'Recherche...' : 'Suggérer des matchs'}
                    </button>
                    <button onClick={() => autoGenerateCoupon()} disabled={isGeneratingCoupon} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-orange-500 transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10">
                      {isGeneratingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ticket className="w-3 h-3" />}
                      Générer Coupon Auto (Cote {bankroll.dailyTargetOdd})
                    </button>
                  </div>
                </div>

                {suggestions.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                    <p className="w-full text-[10px] font-black uppercase tracking-widest text-white/20 mb-2">Matchs suggérés pour vous :</p>
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          const parts = s.split(/ vs | VS | - /);
                          if (parts.length >= 2) {
                            setHomeQuery(parts[0].trim());
                            setAwayQuery(parts[1].trim());
                          } else {
                            setHomeQuery(s);
                            setAwayQuery('');
                          }
                        }}
                        className="bg-white/5 hover:bg-orange-500/20 border border-white/10 hover:border-orange-500/50 px-4 py-2 rounded-xl text-xs font-bold transition-all text-white/70 hover:text-white"
                      >
                        {s}
                      </button>
                    ))}
                    <button onClick={() => setSuggestions([])} className="text-[10px] font-black uppercase text-white/20 hover:text-red-400 transition-colors ml-2">Effacer</button>
                  </motion.div>
                )}
              </section>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-sm font-bold">{error}</p>
                </motion.div>
              )}

              {batchResults.length > 1 && (
                <div className="max-w-7xl mx-auto mb-8 bg-white/5 p-4 rounded-3xl border border-white/10 overflow-x-auto custom-scrollbar flex items-center gap-4">
                  <div className="flex-shrink-0 text-[10px] font-black uppercase text-white/20 tracking-widest px-2">Analyse Groupée ({batchResults.length}) :</div>
                  {batchResults.map((res, i) => (
                    <button
                      key={res.id}
                      onClick={() => setResult(res)}
                      className={`flex-shrink-0 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border ${
                        result?.id === res.id
                          ? 'bg-orange-500 border-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                          : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                      }`}
                    >
                      {res.match?.homeTeam || "H"} vs {res.match?.awayTeam || "A"}
                    </button>
                  ))}
                </div>
              )}

              {result && (
                <div className="space-y-8">
                  {/* RAPPORT BATCH / COMBO */}
                  {result.isBatch && result.comboReport && (
                    <div className="bg-purple-900/20 border border-purple-500/30 rounded-3xl p-4 lg:p-8 markdown-body w-full shadow-[0_0_30px_rgba(168,85,247,0.15)] relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
                      <div className="flex items-center gap-3 mb-6 text-purple-400 border-b border-purple-500/10 pb-4 relative z-10">
                        <Zap className="w-8 h-8" />
                        <h2 className="text-2xl font-black uppercase tracking-widest italic">Analyse Combinée Expert</h2>
                        <div className="ml-auto bg-purple-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase">Multi-Match</div>
                      </div>
                      <div className="prose prose-invert max-w-none text-purple-100/90 leading-relaxed overflow-x-auto relative z-10">
                        <ReactMarkdown>{result.comboReport}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* RAPPORT EXPERT STRUCTURÉ (PRÉCÉDENT LE GRID POUR LARGEUR TOTALE) */}
                  {result.report && (
                    <div className="bg-[#16191E] border border-white/10 rounded-3xl p-4 lg:p-8 markdown-body w-full shadow-2xl">
                      <div className="flex items-center gap-3 mb-6 text-orange-500 border-b border-white/5 pb-4">
                        <FileText className="w-8 h-8" />
                        <h2 className="text-2xl font-black uppercase tracking-widest italic">Rapport d'Expert PredictMaster</h2>
                      </div>
                      <div className="prose prose-invert max-w-none text-white/80 leading-relaxed overflow-x-auto">
                        <ReactMarkdown>{result.report}</ReactMarkdown>
                      </div>
                    </div>
                  )}

                  {/* SOURCES DE GROUNDING (TRANSPARENCE RÉELLE) */}
                  {result.sources && result.sources.length > 0 && (
                    <div className="bg-[#16191E] border border-white/10 rounded-3xl p-4 lg:p-8 shadow-xl">
                      <div className="flex items-center gap-3 mb-6 text-blue-400 border-b border-white/5 pb-4">
                        <Globe className="w-8 h-8" />
                        <h2 className="text-2xl font-black uppercase tracking-widest italic">Sources de Grounding (Vérification)</h2>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {result.sources.map((src, idx) => (
                          <a
                            key={idx}
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center justify-between hover:bg-blue-500/10 hover:border-blue-500/50 transition-all group"
                          >
                            <div className="flex flex-col gap-1 overflow-hidden">
                              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider">Source Officielle</span>
                              <span className="text-xs font-bold text-white truncate w-full">{src.name}</span>
                              <span className="text-[10px] text-white/30 truncate w-full">{src.url}</span>
                            </div>
                            <ExternalLink className="w-4 h-4 text-white/20 group-hover:text-blue-400 transition-colors shrink-0" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                    {/* BENTO GRID HEADER */}
                    {!result.isBatch && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Main Match Info (Bento Large) */}
                      <div className="md:col-span-2 bg-[#16191E] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-8">
                          <div className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-orange-500/20">{result.match.competition}</div>
                          <div className="text-white/40 text-xs flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{result.match.date}</div>
                            <div className="flex items-center gap-2 font-bold text-white/60">
                              <Activity className="w-3 h-3" />
                              {formatLocalTime(result.match.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-4 mb-8">
                          <div className="text-center flex-1">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/10 text-2xl font-black">
                              {(result.match?.homeTeam || "H")[0]}
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight">{result.match?.homeTeam || "Equipe Domicile"}</h3>
                          </div>
                          <div className="text-white/10 font-black text-4xl italic">VS</div>
                          <div className="text-center flex-1">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl mx-auto mb-3 flex items-center justify-center border border-white/10 text-2xl font-black">
                              {(result.match?.awayTeam || "A")[0]}
                            </div>
                            <h3 className="text-lg font-black uppercase tracking-tight">{result.match?.awayTeam || "Equipe Extérieur"}</h3>
                          </div>
                        </div>
                        <div className="flex items-center justify-center gap-2">
                          {getMatchStatus(result.match.timestamp) === 'live' && (
                            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase animate-pulse">Live</span>
                          )}
                          {getMatchStatus(result.match.timestamp) === 'upcoming' && (
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2 py-1 rounded uppercase border border-blue-500/30">À venir</span>
                          )}
                          {getMatchStatus(result.match.timestamp) === 'past' && (
                            <span className="bg-white/10 text-white/40 text-[10px] font-black px-2 py-1 rounded uppercase">Terminé</span>
                          )}
                        </div>
                      </div>

                      {/* Score Exact (Bento Small) */}
                      {result.scoreExact && (
                        <div className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-2 text-orange-500 mb-4">
                            <Sparkles className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Score Exact</span>
                          </div>
                          <div className="flex items-center gap-4 mb-4">
                            <div className="text-5xl font-black text-white">{result.scoreExact.home}</div>
                            <div className="text-2xl font-black text-white/20">-</div>
                            <div className="text-5xl font-black text-white">{result.scoreExact.away}</div>
                          </div>
                          <div className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/30">
                            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">{result.scoreExact.probability?.toFixed(1)}% Confiance</p>
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {result.isBatch && (
                    <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8 shadow-xl">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                         <Layers className="w-5 h-5 text-purple-400" /> Matches du Ticket / Combiné
                       </h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {(result.predictions || []).map((pred, idx) => (
                           <div key={idx} className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:border-purple-500/30 transition-all group">
                             <div className="flex justify-between items-start mb-2">
                               <p className="text-[10px] font-black text-white/40 uppercase group-hover:text-purple-400/60 transition-colors truncate max-w-[150px]">{pred.matchName}</p>
                               <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border border-purple-500/20">Analysé</span>
                             </div>
                             <div className="flex justify-between items-center">
                               <span className="font-black text-sm">{pred.type}</span>
                               <div className="flex flex-col items-end">
                                 <span className="text-[10px] font-black text-orange-500">Cote {pred.odd.toFixed(2)}</span>
                                 <span className="text-[10px] font-bold text-white/40">Conf. {pred.confidence}%</span>
                               </div>
                             </div>
                           </div>
                         ))}
                       </div>
                    </div>
                    )}

                    {/* Technical Details (Weather & Referee) */}
                    {!result.isBatch && (result.weather || result.referee) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {result.weather && (
                          <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                              <Radio className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-blue-400 uppercase mb-1">Météo & Conditions</p>
                              <p className="text-xs font-bold text-white">{result.weather.condition} ({result.weather.temp}°C)</p>
                              <p className="text-[10px] text-white/40 italic">{result.weather.impact}</p>
                            </div>
                          </div>
                        )}
                        {result.referee && (
                          <div className="bg-red-500/5 border border-red-500/10 rounded-2xl p-4 flex items-center gap-4">
                            <div className="p-3 bg-red-500/10 rounded-xl text-red-400">
                              <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-red-400 uppercase mb-1">Arbitre: {result.referee.name}</p>
                              <p className="text-xs font-bold text-white">{result.referee.cardsPerMatch} cartons / match</p>
                              <p className="text-[10px] text-white/40 italic">{result.referee.impact}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* RAPPORT EXPERT STRUCTURÉ (MONTRÉ PLUS HAUT MAINTENANT) */}

                      {/* PILLIER 1 : PRONOSTIC QUANTITATIF */}
                      <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-2 text-blue-400">
                            <Calculator className="w-5 h-5" />
                            <h3 className="font-black uppercase tracking-widest text-sm">Pillier 1 : Pronostic Quantitatif</h3>
                            <div className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-md border border-blue-500/30 ml-2">
                              <Cpu className="w-3 h-3" />
                              <span className="text-[8px] font-black uppercase tracking-tighter">High Precision Engine V4.2</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.spreadsheetId ? (
                              <button
                                onClick={() => setShowSheetEditor(true)}
                                className="bg-green-500/10 text-green-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20 hover:bg-green-500/20 transition-all flex items-center gap-1"
                              >
                                <Table className="w-3 h-3" />
                                Google Sheets
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSheetsSync()}
                                disabled={isSyncingSheets}
                                className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20 hover:bg-blue-500/20 transition-all flex items-center gap-1 disabled:opacity-50"
                              >
                                {isSyncingSheets ? <Loader2 className="w-3 h-3 animate-spin" /> : <Table className="w-3 h-3" />}
                                Synchro Sheets
                              </button>
                            )}
                            <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-blue-500/20">Stats Pures</div>
                          </div>
                        </div>

                        {/* Recent Matches 1-10 Detailed Tables (Half-Time Breakdown) */}
                        {!result.isBatch && result.recentMatches && (
                          <div className="mb-8 space-y-6">
                            <div className="flex items-center gap-2 mb-2 text-white/40">
                              <History className="w-4 h-4 text-orange-500" />
                              <span className="text-[10px] font-black uppercase tracking-widest">
                                Tableau Récapitulatif 1-10 des Matchs Officiels par Mi-Temps
                              </span>
                            </div>

                            {/* Table Team 1 (Home) */}
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/10 overflow-x-auto">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-black uppercase text-orange-400">
                                  1-10 : {result.match.homeTeam} (Matchs Officiels Récents)
                                </h4>
                                <span className="text-[9px] text-white/40 italic">
                                  Scores formatés : [Buts Marqués] | [Buts Encaissés] (1MT / 2MT déduit = TR - 1MT / TR)
                                </span>
                              </div>
                              <table className="w-full text-left text-[10px] min-w-[700px]">
                                <thead className="bg-white/5 text-white/60 font-black uppercase">
                                  <tr>
                                    <th className="p-2 text-center w-8">#</th>
                                    <th className="p-2">Compétition</th>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Adversaire</th>
                                    <th className="p-2 text-center bg-blue-500/10">1ère Mi-Temps (M | E)</th>
                                    <th className="p-2 text-center bg-purple-500/10">2nde MT Déduite (M | E)</th>
                                    <th className="p-2 text-center bg-orange-500/10">Temps Réglementaire (M | E)</th>
                                    <th className="p-2 text-center">Source</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  {(!result.recentMatches?.home || result.recentMatches.home.length === 0) ? (
                                    <tr>
                                      <td colSpan={8} className="p-6 text-center text-white/30 italic">
                                        Aucun match officiel récent trouvé.
                                      </td>
                                    </tr>
                                  ) : result.recentMatches.home.slice(0, 10).map((m, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                      <td className="p-2 text-center font-bold text-white/40">{i + 1}</td>
                                      <td className="p-2 text-white/80 font-sans">{m.competition || result.match.competition || "Officiel"}</td>
                                      <td className="p-2 text-white/50">{m.date}</td>
                                      <td className="p-2 font-bold text-white font-sans">{m.opponent}</td>

                                      {/* 1ère Mi-Temps */}
                                      <td className="p-2 text-center bg-blue-500/5">
                                        <div className="flex items-center justify-center gap-1">
                                          <input
                                            type="number"
                                            value={m.ht1Scored ?? 0}
                                            onChange={(e) => handleGoalChange('home', i, 'ht1Scored', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-green-500/20 text-green-400 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                          <span className="text-white/20">|</span>
                                          <input
                                            type="number"
                                            value={m.ht1Conceded ?? 0}
                                            onChange={(e) => handleGoalChange('home', i, 'ht1Conceded', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-red-500/20 text-red-400 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                        </div>
                                      </td>

                                      {/* 2nde MT Déduite */}
                                      <td className="p-2 text-center bg-purple-500/5">
                                        <div className="flex items-center justify-center gap-1 font-bold">
                                          <span className="w-7 bg-green-500/10 text-green-300 py-0.5 rounded inline-block">{m.ht2Scored ?? (m.goalsScored - (m.ht1Scored ?? 0))}</span>
                                          <span className="text-white/20">|</span>
                                          <span className="w-7 bg-red-500/10 text-red-300 py-0.5 rounded inline-block">{m.ht2Conceded ?? (m.goalsConceded - (m.ht1Conceded ?? 0))}</span>
                                        </div>
                                      </td>

                                      {/* Temps Réglementaire */}
                                      <td className="p-2 text-center bg-orange-500/5">
                                        <div className="flex items-center justify-center gap-1">
                                          <input
                                            type="number"
                                            value={m.goalsScored ?? 0}
                                            onChange={(e) => handleGoalChange('home', i, 'goalsScored', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-green-500/30 text-green-300 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                          <span className="text-white/20">|</span>
                                          <input
                                            type="number"
                                            value={m.goalsConceded ?? 0}
                                            onChange={(e) => handleGoalChange('home', i, 'goalsConceded', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-red-500/30 text-red-300 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                        </div>
                                      </td>

                                      {/* Source */}
                                      <td className="p-2 text-center">
                                        {m.sourceUrl ? (
                                          <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center justify-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Source
                                          </a>
                                        ) : (
                                          <span className="text-white/20">Certifié</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Table Team 2 (Away) */}
                            <div className="bg-black/30 p-4 rounded-2xl border border-white/10 overflow-x-auto">
                              <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-black uppercase text-blue-400">
                                  1-10 : {result.match.awayTeam} (Matchs Officiels Récents)
                                </h4>
                                <span className="text-[9px] text-white/40 italic">
                                  Scores formatés : [Buts Marqués] | [Buts Encaissés] (1MT / 2MT déduit = TR - 1MT / TR)
                                </span>
                              </div>
                              <table className="w-full text-left text-[10px] min-w-[700px]">
                                <thead className="bg-white/5 text-white/60 font-black uppercase">
                                  <tr>
                                    <th className="p-2 text-center w-8">#</th>
                                    <th className="p-2">Compétition</th>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Adversaire</th>
                                    <th className="p-2 text-center bg-blue-500/10">1ère Mi-Temps (M | E)</th>
                                    <th className="p-2 text-center bg-purple-500/10">2nde MT Déduite (M | E)</th>
                                    <th className="p-2 text-center bg-orange-500/10">Temps Réglementaire (M | E)</th>
                                    <th className="p-2 text-center">Source</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  {(!result.recentMatches?.away || result.recentMatches.away.length === 0) ? (
                                    <tr>
                                      <td colSpan={8} className="p-6 text-center text-white/30 italic">
                                        Aucun match officiel récent trouvé.
                                      </td>
                                    </tr>
                                  ) : result.recentMatches.away.slice(0, 10).map((m, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                      <td className="p-2 text-center font-bold text-white/40">{i + 1}</td>
                                      <td className="p-2 text-white/80 font-sans">{m.competition || result.match.competition || "Officiel"}</td>
                                      <td className="p-2 text-white/50">{m.date}</td>
                                      <td className="p-2 font-bold text-white font-sans">{m.opponent}</td>

                                      {/* 1ère Mi-Temps */}
                                      <td className="p-2 text-center bg-blue-500/5">
                                        <div className="flex items-center justify-center gap-1">
                                          <input
                                            type="number"
                                            value={m.ht1Scored ?? 0}
                                            onChange={(e) => handleGoalChange('away', i, 'ht1Scored', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-green-500/20 text-green-400 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                          <span className="text-white/20">|</span>
                                          <input
                                            type="number"
                                            value={m.ht1Conceded ?? 0}
                                            onChange={(e) => handleGoalChange('away', i, 'ht1Conceded', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-red-500/20 text-red-400 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                        </div>
                                      </td>

                                      {/* 2nde MT Déduite */}
                                      <td className="p-2 text-center bg-purple-500/5">
                                        <div className="flex items-center justify-center gap-1 font-bold">
                                          <span className="w-7 bg-green-500/10 text-green-300 py-0.5 rounded inline-block">{m.ht2Scored ?? (m.goalsScored - (m.ht1Scored ?? 0))}</span>
                                          <span className="text-white/20">|</span>
                                          <span className="w-7 bg-red-500/10 text-red-300 py-0.5 rounded inline-block">{m.ht2Conceded ?? (m.goalsConceded - (m.ht1Conceded ?? 0))}</span>
                                        </div>
                                      </td>

                                      {/* Temps Réglementaire */}
                                      <td className="p-2 text-center bg-orange-500/5">
                                        <div className="flex items-center justify-center gap-1">
                                          <input
                                            type="number"
                                            value={m.goalsScored ?? 0}
                                            onChange={(e) => handleGoalChange('away', i, 'goalsScored', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-green-500/30 text-green-300 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                          <span className="text-white/20">|</span>
                                          <input
                                            type="number"
                                            value={m.goalsConceded ?? 0}
                                            onChange={(e) => handleGoalChange('away', i, 'goalsConceded', parseInt(e.target.value) || 0)}
                                            className="w-7 bg-red-500/30 text-red-300 font-bold text-center rounded p-0.5 focus:outline-none"
                                          />
                                        </div>
                                      </td>

                                      {/* Source */}
                                      <td className="p-2 text-center">
                                        {m.sourceUrl ? (
                                          <a href={m.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center justify-center gap-1">
                                            <ExternalLink className="w-3 h-3" /> Source
                                          </a>
                                        ) : (
                                          <span className="text-white/20">Certifié</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* TABLEAUX RÉCAPITULATIFS DE CALCUL (SANS CALCULS DÉVELOPPÉS) */}
                        {result.halfTimeSummary && (
                          <div className="mb-8 space-y-6">
                            <div className="flex items-center gap-2 mb-2 text-orange-400">
                              <Calculator className="w-5 h-5" />
                              <h3 className="font-black uppercase tracking-widest text-xs">
                                Tableaux Synthétiques des Calculs Récapitulatifs
                              </h3>
                            </div>

                            {/* 1. Tableau Moyennes & Espérances de Buts Croisées */}
                            <div className="bg-[#121418] p-4 rounded-2xl border border-white/10 overflow-x-auto">
                              <h4 className="text-xs font-black uppercase text-white/80 mb-3">
                                1. Moyennes de Buts & Espérances Croisées (Formule : (Attaque + Défense Adverse) / 2)
                              </h4>
                              <table className="w-full text-center text-[10px] min-w-[600px]">
                                <thead className="bg-white/5 text-white/60 font-black uppercase">
                                  <tr>
                                    <th className="p-2 text-left">Période</th>
                                    <th className="p-2 text-green-400">{result.match.homeTeam} Marqués</th>
                                    <th className="p-2 text-red-400">{result.match.homeTeam} Encaissés</th>
                                    <th className="p-2 text-green-400">{result.match.awayTeam} Marqués</th>
                                    <th className="p-2 text-red-400">{result.match.awayTeam} Encaissés</th>
                                    <th className="p-2 text-orange-400 bg-orange-500/10">Espérance Croisée {result.match.homeTeam}</th>
                                    <th className="p-2 text-orange-400 bg-orange-500/10">Espérance Croisée {result.match.awayTeam}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  <tr>
                                    <td className="p-2 text-left font-bold text-blue-400 font-sans">1ère Mi-Temps (HT1)</td>
                                    <td className="p-2 text-green-400">{result.halfTimeSummary.homeHT1ScoredAvg.toFixed(2)}</td>
                                    <td className="p-2 text-red-400">{result.halfTimeSummary.homeHT1ConcededAvg.toFixed(2)}</td>
                                    <td className="p-2 text-green-400">{result.halfTimeSummary.awayHT1ScoredAvg.toFixed(2)}</td>
                                    <td className="p-2 text-red-400">{result.halfTimeSummary.awayHT1ConcededAvg.toFixed(2)}</td>
                                    <td className="p-2 font-black text-orange-400 bg-orange-500/5">{result.halfTimeSummary.crossedHT1Home.toFixed(2)}</td>
                                    <td className="p-2 font-black text-orange-400 bg-orange-500/5">{result.halfTimeSummary.crossedHT1Away.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-left font-bold text-purple-400 font-sans">2nde Mi-Temps (HT2 Déduite)</td>
                                    <td className="p-2 text-green-400">{result.halfTimeSummary.homeHT2ScoredAvg.toFixed(2)}</td>
                                    <td className="p-2 text-red-400">{result.halfTimeSummary.homeHT2ConcededAvg.toFixed(2)}</td>
                                    <td className="p-2 text-green-400">{result.halfTimeSummary.awayHT2ScoredAvg.toFixed(2)}</td>
                                    <td className="p-2 text-red-400">{result.halfTimeSummary.awayHT2ConcededAvg.toFixed(2)}</td>
                                    <td className="p-2 font-black text-orange-400 bg-orange-500/5">{result.halfTimeSummary.crossedHT2Home.toFixed(2)}</td>
                                    <td className="p-2 font-black text-orange-400 bg-orange-500/5">{result.halfTimeSummary.crossedHT2Away.toFixed(2)}</td>
                                  </tr>
                                  <tr className="bg-white/5 font-bold">
                                    <td className="p-2 text-left text-orange-400 font-sans">Temps Réglementaire (FT)</td>
                                    <td className="p-2 text-green-400">{result.halfTimeSummary.homeFTScoredAvg.toFixed(2)}</td>
                                    <td className="p-2 text-red-400">{result.halfTimeSummary.homeFTConcededAvg.toFixed(2)}</td>
                                    <td className="p-2 text-green-400">{result.halfTimeSummary.awayFTScoredAvg.toFixed(2)}</td>
                                    <td className="p-2 text-red-400">{result.halfTimeSummary.awayFTConcededAvg.toFixed(2)}</td>
                                    <td className="p-2 text-orange-400 font-black bg-orange-500/10">{result.halfTimeSummary.crossedFTHome.toFixed(2)}</td>
                                    <td className="p-2 text-orange-400 font-black bg-orange-500/10">{result.halfTimeSummary.crossedFTAway.toFixed(2)}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* 2. Tableau Fréquences Cumulées Décroissantes (FCD) */}
                            <div className="bg-[#121418] p-4 rounded-2xl border border-white/10 overflow-x-auto">
                              <h4 className="text-xs font-black uppercase text-white/80 mb-3">
                                2. Fréquences Cumulées Décroissantes (Marquer / Encaisser ≥ 1, 2, 3 Buts)
                              </h4>
                              <table className="w-full text-center text-[10px] min-w-[650px]">
                                <thead className="bg-white/5 text-white/60 font-black uppercase">
                                  <tr>
                                    <th className="p-2 text-left">Période</th>
                                    <th className="p-2 text-green-400">{result.match.homeTeam} Marqués (≥1 | ≥2 | ≥3)</th>
                                    <th className="p-2 text-red-400">{result.match.homeTeam} Encaissés (≥1 | ≥2 | ≥3)</th>
                                    <th className="p-2 text-green-400">{result.match.awayTeam} Marqués (≥1 | ≥2 | ≥3)</th>
                                    <th className="p-2 text-red-400">{result.match.awayTeam} Encaissés (≥1 | ≥2 | ≥3)</th>
                                    <th className="p-2 text-orange-400">Croisement {result.match.homeTeam}</th>
                                    <th className="p-2 text-orange-400">Croisement {result.match.awayTeam}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  <tr>
                                    <td className="p-2 text-left font-bold text-blue-400 font-sans">1MT (HT1)</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdHomeScoredHT1.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeScoredHT1.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeScoredHT1.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdHomeConcededHT1.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeConcededHT1.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeConcededHT1.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdAwayScoredHT1.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayScoredHT1.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayScoredHT1.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdAwayConcededHT1.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayConcededHT1.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayConcededHT1.g3*100).toFixed(0)}%</td>
                                    <td className="p-2 font-black text-orange-400">{(result.halfTimeSummary.crossedFcdHT1Home.g1*100).toFixed(0)}% | {(result.halfTimeSummary.crossedFcdHT1Home.g2*100).toFixed(0)}%</td>
                                    <td className="p-2 font-black text-orange-400">{(result.halfTimeSummary.crossedFcdHT1Away.g1*100).toFixed(0)}% | {(result.halfTimeSummary.crossedFcdHT1Away.g2*100).toFixed(0)}%</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-left font-bold text-purple-400 font-sans">2MT (HT2)</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdHomeScoredHT2.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeScoredHT2.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeScoredHT2.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdHomeConcededHT2.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeConcededHT2.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeConcededHT2.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdAwayScoredHT2.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayScoredHT2.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayScoredHT2.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdAwayConcededHT2.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayConcededHT2.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayConcededHT2.g3*100).toFixed(0)}%</td>
                                    <td className="p-2 font-black text-orange-400">{(result.halfTimeSummary.crossedFcdHT2Home.g1*100).toFixed(0)}% | {(result.halfTimeSummary.crossedFcdHT2Home.g2*100).toFixed(0)}%</td>
                                    <td className="p-2 font-black text-orange-400">{(result.halfTimeSummary.crossedFcdHT2Away.g1*100).toFixed(0)}% | {(result.halfTimeSummary.crossedFcdHT2Away.g2*100).toFixed(0)}%</td>
                                  </tr>
                                  <tr className="bg-white/5 font-bold">
                                    <td className="p-2 text-left text-orange-400 font-sans">TR (FT)</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdHomeScoredFT.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeScoredFT.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeScoredFT.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdHomeConcededFT.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeConcededFT.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdHomeConcededFT.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdAwayScoredFT.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayScoredFT.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayScoredFT.g3*100).toFixed(0)}%</td>
                                    <td className="p-2">{(result.halfTimeSummary.fcdAwayConcededFT.g1*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayConcededFT.g2*100).toFixed(0)}% | {(result.halfTimeSummary.fcdAwayConcededFT.g3*100).toFixed(0)}%</td>
                                    <td className="p-2 text-orange-400 font-black">{(result.halfTimeSummary.crossedFcdFTHome.g1*100).toFixed(0)}% | {(result.halfTimeSummary.crossedFcdFTHome.g2*100).toFixed(0)}%</td>
                                    <td className="p-2 text-orange-400 font-black">{(result.halfTimeSummary.crossedFcdFTAway.g1*100).toFixed(0)}% | {(result.halfTimeSummary.crossedFcdFTAway.g2*100).toFixed(0)}%</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* 3. Tableau Variances, Test de Confiance & Ascendance */}
                            <div className="bg-[#121418] p-4 rounded-2xl border border-white/10 overflow-x-auto">
                              <h4 className="text-xs font-black uppercase text-white/80 mb-3">
                                3. Variances, Test de Confiance & Indicateur d'Ascendance (Domination Attaque vs Défense)
                              </h4>
                              <table className="w-full text-center text-[10px] min-w-[650px]">
                                <thead className="bg-white/5 text-white/60 font-black uppercase">
                                  <tr>
                                    <th className="p-2 text-left">Période</th>
                                    <th className="p-2">Var Croisée {result.match.homeTeam}</th>
                                    <th className="p-2">Var Croisée {result.match.awayTeam}</th>
                                    <th className="p-2">Confiance Modèle</th>
                                    <th className="p-2 text-left">Indicateur d'Ascendance (Attaque vs Défense Adverse)</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                  <tr>
                                    <td className="p-2 text-left font-bold text-blue-400 font-sans">1MT (HT1)</td>
                                    <td className="p-2">{result.halfTimeSummary.crossedVarHT1Home.toFixed(2)}</td>
                                    <td className="p-2">{result.halfTimeSummary.crossedVarHT1Away.toFixed(2)}</td>
                                    <td className="p-2">
                                      <span className={`px-2 py-0.5 rounded font-black font-sans ${result.halfTimeSummary.trustHT1Home ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {result.halfTimeSummary.trustHT1Home ? "ÉLEVÉE (Confiance)" : "MODÉRÉE"}
                                      </span>
                                    </td>
                                    <td className="p-2 text-left font-sans text-white/80">{result.halfTimeSummary.ascendanceHT1Home}</td>
                                  </tr>
                                  <tr>
                                    <td className="p-2 text-left font-bold text-purple-400 font-sans">2MT (HT2)</td>
                                    <td className="p-2">{result.halfTimeSummary.crossedVarHT2Home.toFixed(2)}</td>
                                    <td className="p-2">{result.halfTimeSummary.crossedVarHT2Away.toFixed(2)}</td>
                                    <td className="p-2">
                                      <span className={`px-2 py-0.5 rounded font-black font-sans ${result.halfTimeSummary.trustHT2Home ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                        {result.halfTimeSummary.trustHT2Home ? "ÉLEVÉE (Confiance)" : "MODÉRÉE"}
                                      </span>
                                    </td>
                                    <td className="p-2 text-left font-sans text-white/80">{result.halfTimeSummary.ascendanceHT2Home}</td>
                                  </tr>
                                  <tr className="bg-white/5 font-bold">
                                    <td className="p-2 text-left text-orange-400 font-sans">TR (FT)</td>
                                    <td className="p-2">{result.halfTimeSummary.crossedVarFTHome.toFixed(2)}</td>
                                    <td className="p-2">{result.halfTimeSummary.crossedVarFTAway.toFixed(2)}</td>
                                    <td className="p-2">
                                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded font-black font-sans">VALIDÉ</span>
                                    </td>
                                    <td className="p-2 text-left font-sans text-orange-300">{result.halfTimeSummary.ascendanceFTHome}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* SECTION PRONOSTICS PAR MI-TEMPS & COMBINÉ RENTABLE */}
                        {result.halfTimePredictions && (
                          <div className="mb-8 p-6 bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 rounded-3xl space-y-6">
                            <div className="flex items-center gap-2 text-orange-400">
                              <Target className="w-6 h-6" />
                              <h3 className="font-black uppercase tracking-widest text-sm">
                                Suggestions de Choix de Pronostics par Mi-Temps & Option Rentable
                              </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* 1ère Mi-Temps */}
                              <div className="bg-black/40 p-4 rounded-2xl border border-blue-500/20 space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <span className="text-xs font-black uppercase text-blue-400">1ère Mi-Temps (HT1)</span>
                                  <span className="text-[9px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded font-bold">45 min</span>
                                </div>
                                {result.halfTimePredictions.ht1Pronostics.map((p, idx) => (
                                  <div key={idx} className="bg-white/5 p-3 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-white">
                                      <span>{p.type}</span>
                                      <span className="text-orange-400 font-mono">@{p.odd.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-white/50">
                                      <span>Confiance : {p.confidence}%</span>
                                    </div>
                                    <p className="text-[9px] text-white/40 italic leading-tight">{p.reasoning}</p>
                                  </div>
                                ))}
                              </div>

                              {/* 2nde Mi-Temps */}
                              <div className="bg-black/40 p-4 rounded-2xl border border-purple-500/20 space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <span className="text-xs font-black uppercase text-purple-400">2nde Mi-Temps (HT2)</span>
                                  <span className="text-[9px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-bold">45 min</span>
                                </div>
                                {result.halfTimePredictions.ht2Pronostics.map((p, idx) => (
                                  <div key={idx} className="bg-white/5 p-3 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-white">
                                      <span>{p.type}</span>
                                      <span className="text-orange-400 font-mono">@{p.odd.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-white/50">
                                      <span>Confiance : {p.confidence}%</span>
                                    </div>
                                    <p className="text-[9px] text-white/40 italic leading-tight">{p.reasoning}</p>
                                  </div>
                                ))}
                              </div>

                              {/* Temps Réglementaire */}
                              <div className="bg-black/40 p-4 rounded-2xl border border-orange-500/20 space-y-3">
                                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                                  <span className="text-xs font-black uppercase text-orange-400">Temps Réglementaire (FT)</span>
                                  <span className="text-[9px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded font-bold">90 min</span>
                                </div>
                                {result.halfTimePredictions.ftPronostics.map((p, idx) => (
                                  <div key={idx} className="bg-white/5 p-3 rounded-xl space-y-1">
                                    <div className="flex justify-between items-center text-xs font-bold text-white">
                                      <span>{p.type}</span>
                                      <span className="text-orange-400 font-mono">@{p.odd.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] text-white/50">
                                      <span>Confiance : {p.confidence}%</span>
                                    </div>
                                    <p className="text-[9px] text-white/40 italic leading-tight">{p.reasoning}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Option Rentable & Sûre pour Combinés */}
                            {result.halfTimePredictions.safeCombinations.map((p, idx) => (
                              <div key={idx} className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-orange-400" />
                                    <span className="text-xs font-black uppercase text-orange-400">{p.type}</span>
                                  </div>
                                  <p className="text-[10px] text-white/70">{p.reasoning}</p>
                                </div>
                                <div className="flex items-center gap-4 shrink-0">
                                  <span className="text-xs font-bold text-white">Confiance : <strong className="text-green-400">{p.confidence}%</strong></span>
                                  <span className="text-lg font-black text-orange-400 font-mono">@{p.odd.toFixed(2)}</span>
                                  <button onClick={() => addToCoupon(p, result.match)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black text-xs font-black uppercase rounded-xl transition-all">
                                    + Combiner
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {!result.isBatch && result.quantitativeData && (
                          <div className="md:col-span-3 space-y-4">
                            <div
                              className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => result.spreadsheetId ? setShowSheetEditor(true) : handleSheetsSync()}
                            >
                              <div>
                                <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-wider">Modèle Unique</p>
                                <p className="text-sm font-black text-blue-400">Binomiale Négative</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-wider">Lambda Final DOM</p>
                                <p className="text-xl font-black text-blue-400">{result.quantitativeData.homeLambdaFinal?.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-wider">Lambda Final EXT</p>
                                <p className="text-xl font-black text-blue-400">{result.quantitativeData.awayLambdaFinal?.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white/40 uppercase mb-1 tracking-wider">Statut Moteur</p>
                                <p className="text-xl font-black text-green-400">OPÉRATIONNEL</p>
                              </div>
                            </div>

                            <div
                              className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => result.spreadsheetId ? setShowSheetEditor(true) : handleSheetsSync()}
                            >
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-white/40 uppercase mb-3 flex items-center gap-2">
                                  <Activity className="w-3 h-3" /> Détails DOM
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Att / Déf</p>
                                    <p className="text-sm font-black text-white">{result.quantitativeData.homeLambdaAtt?.toFixed(2)} / {result.quantitativeData.homeLambdaDef?.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Médiane Comb.</p>
                                    <p className="text-sm font-black text-blue-400">{result.quantitativeData.homeMedianFinal?.toFixed(2) || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Variance / r</p>
                                    <p className="text-sm font-black text-white">{result.quantitativeData.homeVariance?.toFixed(2)} / {result.quantitativeData.homeR || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">IFR (P≥μ)</p>
                                    <p className="text-sm font-black text-purple-400">{(result.quantitativeData.homeProbAboveMean! * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">IFR (Méd/Mode)</p>
                                    <p className="text-sm font-black text-emerald-400">{(result.quantitativeData.homeProbAboveMedian! * 100).toFixed(1)}% / {(result.quantitativeData.homeProbAboveMode! * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Zone Précision (±{sport === 'basketball' ? '5' : '1'})</p>
                                    <p className="text-sm font-black text-cyan-400">{(result.quantitativeData.homeProbInRange! * 100).toFixed(1)}%</p>
                                  </div>
                                  {sport === 'basketball' && (
                                    <div className="col-span-2 md:col-span-3 pt-2 mt-2 border-t border-white/5">
                                      <p className="text-[9px] font-bold text-white/10 uppercase mb-1">Paliers IFR (mu-10 à mu+10)</p>
                                      <div className="flex justify-between text-center">
                                        <div><p className="text-[8px] text-white/20">m-10</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.homeProbAboveM10!*100).toFixed(0)}%</p></div>
                                        <div><p className="text-[8px] text-white/20">m-5</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.homeProbAboveM5!*100).toFixed(0)}%</p></div>
                                        <div><p className="text-[8px] text-white/20">m+5</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.homeProbAboveP5!*100).toFixed(0)}%</p></div>
                                        <div><p className="text-[8px] text-white/20">m+10</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.homeProbAboveP10!*100).toFixed(0)}%</p></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <p className="text-[10px] font-black text-white/40 uppercase mb-3 flex items-center gap-2">
                                  <Activity className="w-3 h-3" /> Détails EXT
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Att / Déf</p>
                                    <p className="text-sm font-black text-white">{result.quantitativeData.awayLambdaAtt?.toFixed(2)} / {result.quantitativeData.awayLambdaDef?.toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Médiane Comb.</p>
                                    <p className="text-sm font-black text-blue-400">{result.quantitativeData.awayMedianFinal?.toFixed(2) || '-'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Variance / r</p>
                                    <p className="text-sm font-black text-white">{result.quantitativeData.awayVariance?.toFixed(2)} / {result.quantitativeData.awayR || 'N/A'}</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">IFR (P≥μ)</p>
                                    <p className="text-sm font-black text-purple-400">{(result.quantitativeData.awayProbAboveMean! * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">IFR (Méd/Mode)</p>
                                    <p className="text-sm font-black text-emerald-400">{(result.quantitativeData.awayProbAboveMedian! * 100).toFixed(1)}% / {(result.quantitativeData.awayProbAboveMode! * 100).toFixed(1)}%</p>
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider">Zone Précision (±{sport === 'basketball' ? '5' : '1'})</p>
                                    <p className="text-sm font-black text-cyan-400">{(result.quantitativeData.awayProbInRange! * 100).toFixed(1)}%</p>
                                  </div>
                                  {sport === 'basketball' && (
                                    <div className="col-span-2 md:col-span-3 pt-2 mt-2 border-t border-white/5">
                                      <p className="text-[9px] font-bold text-white/10 uppercase mb-1">Paliers IFR (mu-10 à mu+10)</p>
                                      <div className="flex justify-between text-center">
                                        <div><p className="text-[8px] text-white/20">m-10</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.awayProbAboveM10!*100).toFixed(0)}%</p></div>
                                        <div><p className="text-[8px] text-white/20">m-5</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.awayProbAboveM5!*100).toFixed(0)}%</p></div>
                                        <div><p className="text-[8px] text-white/20">m+5</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.awayProbAboveP5!*100).toFixed(0)}%</p></div>
                                        <div><p className="text-[8px] text-white/20">m+10</p><p className="text-[10px] font-bold text-purple-300">{(result.quantitativeData.awayProbAboveP10!*100).toFixed(0)}%</p></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {result.quantitativeData.qualScore && (
                              <div
                                className="bg-orange-500/5 border border-orange-500/10 p-4 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => result.spreadsheetId ? setShowSheetEditor(true) : handleSheetsSync()}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-[10px] font-black text-orange-500 uppercase">Score Qualitatif Indépendant</p>
                                  <span className="text-[10px] font-black text-white bg-orange-500 px-2 py-0.5 rounded uppercase">{result.quantitativeData.qualScore.verdict}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden flex">
                                    <div
                                      className="h-full bg-orange-500"
                                      style={{ width: `${(result.quantitativeData.qualScore.home / (result.quantitativeData.qualScore.home + result.quantitativeData.qualScore.away)) * 100}%` }}
                                    />
                                    <div
                                      className="h-full bg-white/10"
                                      style={{ width: `${(result.quantitativeData.qualScore.away / (result.quantitativeData.qualScore.home + result.quantitativeData.qualScore.away)) * 100}%` }}
                                    />
                                  </div>
                                  <div className="text-[10px] font-black text-white/60">
                                    {result.quantitativeData.qualScore.home?.toFixed(2)} vs {result.quantitativeData.qualScore.away?.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            )}

                            {result.probabilities && (
                              <div
                                className="grid grid-cols-2 md:grid-cols-5 gap-4 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => result.spreadsheetId ? setShowSheetEditor(true) : handleSheetsSync()}
                              >
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-white/40 uppercase mb-1">Victoire DOM</p>
                                    <p className="text-sm font-black text-white">{(result.probabilities.home * 100)?.toFixed(1)}%</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-white/40 uppercase mb-1">Match Nul</p>
                                    <p className="text-sm font-black text-white">{(result.probabilities.draw * 100)?.toFixed(1)}%</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-white/40 uppercase mb-1">Victoire EXT</p>
                                    <p className="text-sm font-black text-white">{(result.probabilities.away * 100)?.toFixed(1)}%</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-white/40 uppercase mb-1">Over 2.5</p>
                                    <p className="text-sm font-black text-orange-500">{(result.probabilities.over25 * 100)?.toFixed(1)}%</p>
                                </div>
                                <div className="bg-white/5 p-3 rounded-xl border border-white/5 text-center">
                                    <p className="text-[8px] font-black text-white/40 uppercase mb-1">BTTS (Les 2 marquent)</p>
                                    <p className="text-sm font-black text-green-500">{(result.probabilities.btts * 100)?.toFixed(1)}%</p>
                                </div>
                              </div>
                            )}

                            {result.quantitativeData.calculationSteps && (
                              <div
                                className="mt-4 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => result.spreadsheetId ? setShowSheetEditor(true) : handleSheetsSync()}
                              >
                                <div className="flex items-center gap-2 mb-2 text-blue-400">
                                  <Calculator className="w-3 h-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Détail des Calculs Mathématiques</span>
                                </div>
                                <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap font-mono">
                                  {result.quantitativeData.calculationSteps}
                                </p>
                              </div>
                            )}

                            {result.quantitativeData.metricFormulas && (
                              <div className="mt-4 p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                                <div className="flex items-center gap-2 mb-2 text-purple-400">
                                  <Calculator className="w-3 h-3" />
                                  <span className="text-[10px] font-black uppercase tracking-widest">Formules de Calcul</span>
                                </div>
                                <div className="space-y-2">
                                  {Object.entries(result.quantitativeData.metricFormulas).map(([key, formula]) => (
                                    <div key={key} className="flex items-center gap-2">
                                      <span className="text-[10px] text-white/40 font-mono w-24">{key}:</span>
                                      {editingFormulaKey === key ? (
                                        <input
                                          className="bg-white/10 text-xs text-white p-1 rounded font-mono w-full"
                                          defaultValue={formula}
                                          onBlur={(e) => handleFormulaUpdate(key, e.target.value)}
                                          onKeyDown={(e) => { if(e.key === 'Enter') handleFormulaUpdate(key, e.currentTarget.value) }}
                                          autoFocus
                                        />
                                      ) : (
                                        <span
                                          className="text-xs text-white/80 font-mono cursor-pointer hover:text-white"
                                          onClick={() => setEditingFormulaKey(key)}
                                        >
                                          {formula}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {result.quantitativeData.notes && (
                              <div className="mt-2 pt-2 border-t border-white/5">
                                <p className="text-[9px] text-orange-400 italic">Note : {result.quantitativeData.notes}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {result.fairOdds && (
                          <div className="md:col-span-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400/60 mb-4 text-center">Cotes Réelles Statistiques (Fair Odds)</p>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center bg-black/20 p-3 rounded-xl">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Victoire Dom</p>
                                <p className="text-xl font-black text-blue-400">{result.fairOdds.home?.toFixed(2)}</p>
                              </div>
                              <div className="text-center bg-black/20 p-3 rounded-xl">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Match Nul</p>
                                <p className="text-xl font-black text-blue-400">{result.fairOdds.draw?.toFixed(2)}</p>
                              </div>
                              <div className="text-center bg-black/20 p-3 rounded-xl">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Victoire Ext</p>
                                <p className="text-xl font-black text-blue-400">{result.fairOdds.away?.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Basketball Margins */}
                      {result.sport === 'basketball' && result.basketballMargins && (
                        <div className="mt-8">
                          <div className="flex items-center gap-2 mb-4 text-white/40">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Winning Margins Probabilities</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(result.basketballMargins).map(([margin, p]) => (
                              <div key={margin} className="bg-white/5 border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
                                <p className="text-[8px] font-black text-white/40 uppercase mb-1">{margin}</p>
                                <p className="text-xl font-black text-orange-500">{(p * 100).toFixed(1)}%</p>
                                <div className="w-full bg-white/5 h-1 rounded-full mt-2 overflow-hidden">
                                  <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${p * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Score Matrix */}
                      {result.sport === 'football' && result.scoreMatrix && Array.isArray(result.scoreMatrix) && (
                        <div className="mt-8">
                          <div className="flex items-center gap-2 mb-4 text-white/40">
                            <Table className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Matrice des Probabilités (0-4 buts)</span>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-center border-collapse">
                              <thead>
                                <tr>
                                  <th className="p-2 text-[8px] font-black text-white/20 uppercase">Dom \ Ext</th>
                                  {[0, 1, 2, 3, 4].map(g => (
                                    <th key={g} className="p-2 text-[10px] font-black text-white/40">{g}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {result.scoreMatrix?.map((row, h) => (
                                  <tr key={h}>
                                    <td className="p-2 text-[10px] font-black text-white/40 border-r border-white/5">{h}</td>
                                    {row?.map((prob, a) => (
                                      <td
                                        key={a}
                                        className="p-2 text-[10px] font-bold transition-all relative group"
                                        style={{
                                          backgroundColor: `rgba(59, 130, 246, ${prob / 15})`,
                                          color: prob > 5 ? '#fff' : 'rgba(255,255,255,0.4)'
                                        }}
                                      >
                                        {prob?.toFixed(1)}%
                                        {prob > 8 && <div className="absolute inset-0 border-2 border-orange-500/50 rounded-sm pointer-events-none" />}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[8px] text-white/20 mt-4 italic">* Les cases bleues foncées indiquent les probabilités les plus élevées. Le cadre orange marque le score le plus probable.</p>
                        </div>
                      )}
                    </div>

                    {/* PILLIER 2 : PRONOSTIC QUALITATIF */}
                    {!result.isBatch && (
                    <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2 text-orange-500">
                          <Zap className="w-5 h-5" />
                          <h3 className="font-black uppercase tracking-widest text-sm">Pillier 2 : Pronostic Qualitatif</h3>
                        </div>
                        <div className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-500/20">Levier Contextuel</div>
                      </div>

                      {result.leverage && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div>
                              <p className="text-[8px] font-black text-white/40 uppercase mb-1">Levier Domicile ({result.match.homeTeam})</p>
                              <p className={`text-2xl font-black ${result.leverage.home >= 1 ? 'text-green-400' : 'text-red-400'}`}>x{result.leverage.home?.toFixed(2)}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${result.leverage.home >= 1 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {result.leverage.home >= 1 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                            </div>
                          </div>
                          <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5">
                            <div>
                              <p className="text-[8px] font-black text-white/40 uppercase mb-1">Levier Extérieur ({result.match.awayTeam})</p>
                              <p className={`text-2xl font-black ${result.leverage.away >= 1 ? 'text-green-400' : 'text-red-400'}`}>x{result.leverage.away?.toFixed(2)}</p>
                            </div>
                            <div className={`p-3 rounded-xl ${result.leverage.away >= 1 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              {result.leverage.away >= 1 ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Deep Analysis Tabs */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex items-center gap-2 text-orange-500 mb-3"><TrendingUp className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Forme & Momentum</span></div>
                          <p className="text-xs text-white/60 leading-relaxed">{result.qualitative?.momentum || result.formAnalysis}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex items-center gap-2 text-orange-500 mb-3"><UserMinus className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Absences & Blessures</span></div>
                          <p className="text-xs text-white/60 leading-relaxed">{result.qualitative?.absences || result.absencesAnalysis}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex items-center gap-2 text-orange-500 mb-3"><Search className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Arbitre & Conditions</span></div>
                          <p className="text-xs text-white/60 leading-relaxed">{result.qualitative?.referee || result.referee?.name}</p>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                          <div className="flex items-center gap-2 text-orange-500 mb-3"><ShieldAlert className="w-4 h-4" /><span className="text-[10px] font-black uppercase">Contre-Expertise</span></div>
                          <div className="space-y-2">
                             {result.qualitative?.contreExpertise?.alerteContradiction && <p className="text-xs text-orange-400 font-bold">⚠️ {result.qualitative.contreExpertise.alerteContradiction}</p>}
                             {result.qualitative?.contreExpertise?.facteurMotivation && <p className="text-xs text-white/60"><span className="text-orange-500 font-black">MOTIVATION:</span> {result.qualitative.contreExpertise.facteurMotivation}</p>}
                             {result.qualitative?.contreExpertise?.verdictFinalQuali && <p className="text-xs text-white/80 font-black italic">"{result.qualitative.contreExpertise.verdictFinalQuali}"</p>}
                          </div>
                        </div>
                      </div>

                      {/* Filters Intelligence Section */}
                      {result.qualitative?.filtersIntelligence && (
                        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                             <p className="text-[8px] font-black text-white/40 uppercase mb-1">Trap Game</p>
                             <p className="text-[10px] text-white/60">{result.qualitative.filtersIntelligence.trapGame}</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                             <p className="text-[8px] font-black text-white/40 uppercase mb-1">Pace & Style</p>
                             <p className="text-[10px] text-white/60">{result.qualitative.filtersIntelligence.paceStyle}</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                             <p className="text-[8px] font-black text-white/40 uppercase mb-1">Météo/Terrain</p>
                             <p className="text-[10px] text-white/60">{result.qualitative.filtersIntelligence.meteoTerrain}</p>
                           </div>
                           <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                             <p className="text-[8px] font-black text-white/40 uppercase mb-1">Climat Social</p>
                             <p className="text-[10px] text-white/60">{result.qualitative.filtersIntelligence.climatSocial}</p>
                           </div>
                        </div>
                      )}

                      {/* Independent Qualitative Predictions */}
                      {result.qualitativePredictions && result.qualitativePredictions.length > 0 && (
                        <div className="mt-8 pt-8 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-6 text-orange-400">
                            <BrainCircuit className="w-4 h-4" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Pronostic Qualitatif Indépendant (Contexte Pur)</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {result.qualitativePredictions?.map((pred, i) => (
                              <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-2xl">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-xs font-black text-white uppercase">{pred.type}</span>
                                  <span className="text-[10px] font-black text-orange-400">Confiance: {pred.confidence}%</span>
                                </div>
                                <p className="text-[10px] text-white/40 leading-relaxed italic">{pred.reasoning}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    )}

                    {/* H2H Matches Table */}
                    {!result.isBatch && result.h2hMatches && result.h2hMatches.length > 0 && (
                      <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                          <Swords className="w-5 h-5 text-orange-400" />
                          <h3 className="font-black uppercase tracking-widest text-sm">Confrontations Directes (H2H)</h3>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="py-3 text-[8px] font-black text-white/20 uppercase">Date</th>
                                <th className="py-3 text-[8px] font-black text-white/20 uppercase">Match</th>
                                <th className="py-3 text-[8px] font-black text-white/20 uppercase text-center">Score</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.h2hMatches?.map((m, i) => (
                                <tr key={i} className="border-b border-white/5 last:border-0">
                                  <td className="py-3 text-[10px] text-white/40">{m.date}</td>
                                  <td className="py-3 text-[10px] font-bold text-white/80">{m.home} vs {m.away}</td>
                                  <td className="py-3 text-[10px] font-black text-orange-400 text-center">{m.score}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Standings Section */}
                    {result.standings && (
                      <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          <h3 className="font-black uppercase tracking-widest text-sm">Classement Actuel</h3>
                        </div>
                        {!result.isBatch && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-white/40 uppercase mb-3">{result.match.homeTeam}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Rang</p>
                                <p className="text-xl font-black text-white">{result.standings?.home?.rank || 'N/A'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Points</p>
                                <p className="text-xl font-black text-white">{result.standings?.home?.points || 'N/A'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Joués</p>
                                <p className="text-xl font-black text-white">{result.standings?.home?.played || 'N/A'}</p>
                              </div>
                            </div>
                            {result.standings?.home?.alert && (
                              <div className="mt-3 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[8px] font-black text-orange-400 uppercase text-center">
                                {result.standings.home.alert}
                              </div>
                            )}
                          </div>
                          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <p className="text-[10px] font-black text-white/40 uppercase mb-3">{result.match.awayTeam}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-center">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Rang</p>
                                <p className="text-xl font-black text-white">{result.standings?.away?.rank || 'N/A'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Points</p>
                                <p className="text-xl font-black text-white">{result.standings?.away?.points || 'N/A'}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[8px] font-bold text-white/20 uppercase mb-1">Joués</p>
                                <p className="text-xl font-black text-white">{result.standings?.away?.played || 'N/A'}</p>
                              </div>
                            </div>
                            {result.standings?.away?.alert && (
                              <div className="mt-3 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-[8px] font-black text-orange-400 uppercase text-center">
                                {result.standings.away.alert}
                              </div>
                            )}
                          </div>
                        </div>
                        )}
                      </div>
                    )}

                    {/* Expert Opinions */}
                    {!result.isBatch && result.expertOpinions && result.expertOpinions.length > 0 && (
                      <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-6"><Globe className="w-5 h-5 text-blue-400" /><h3 className="font-black uppercase tracking-widest text-sm">Avis des Experts Web</h3></div>
                        <div className="space-y-4">
                          {result.expertOpinions?.map((exp, i) => (
                            <div key={i} className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                              <div><p className="text-[10px] font-black text-blue-400 uppercase mb-1">{exp.source}</p><p className="text-sm text-white/80">{exp.opinion}</p></div>
                              <div className="text-[10px] font-black px-2 py-1 bg-white/10 rounded uppercase">{exp.confidence}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Data Sources */}
                    {!result.isBatch && result.sources && result.sources.length > 0 && (
                      <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Globe className="w-4 h-4 text-white/40" />
                          <h3 className="font-black uppercase tracking-widest text-[10px] text-white/40">Sources de Données Consultées</h3>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.sources?.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white/60 hover:text-white transition-all flex items-center gap-2"
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              {src.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transparence des Prompts (Debug Mode) */}
                    {!result.isBatch && result.debugPrompts && (
                      <div className="bg-[#16191E] border border-orange-500/20 rounded-3xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2 text-orange-500">
                            <Bug className="w-4 h-4" />
                            <h3 className="font-black uppercase tracking-widest text-[10px]">Transparence des Prompts (Audit IA)</h3>
                          </div>
                          <span className="text-[8px] font-black text-orange-500/40 uppercase">V12.0 EXPERT</span>
                        </div>
                        <div className="space-y-4">
                          <details className="group">
                            <summary className="list-none cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between">
                              <span className="text-[10px] font-black text-white/60 uppercase">1. Prompt de Collecte (Grounding)</span>
                              <ChevronDown className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="mt-2 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-white/40 whitespace-pre-wrap leading-relaxed">
                              {result.debugPrompts.collector}
                            </div>
                          </details>
                          <details className="group">
                            <summary className="list-none cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between">
                              <span className="text-[10px] font-black text-white/60 uppercase">2. Prompt d'Analyse (Moteur V5.0)</span>
                              <ChevronDown className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="mt-2 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-white/40 whitespace-pre-wrap leading-relaxed">
                              {result.debugPrompts.analyzer}
                            </div>
                          </details>
                          <details className="group">
                            <summary className="list-none cursor-pointer p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all flex items-center justify-between">
                              <span className="text-[10px] font-black text-white/60 uppercase">3. Prompt de Rapport (Formatting)</span>
                              <ChevronDown className="w-4 h-4 text-white/20 group-open:rotate-180 transition-transform" />
                            </summary>
                            <div className="mt-2 p-4 bg-black/40 rounded-2xl border border-white/5 font-mono text-[9px] text-white/40 whitespace-pre-wrap leading-relaxed">
                              {result.debugPrompts.report}
                            </div>
                          </details>
                        </div>
                        <p className="mt-4 text-[8px] text-white/20 italic italic">* Ces prompts sont envoyés à l'IA pour garantir le respect du protocole PredictMaster. Toute erreur de score provient généralement d'une mauvaise interprétation des sources web par le modèle de langage malgré ces consignes de grounding.</p>
                      </div>
                    )}

                    {/* SECTION MÉTHODOLOGIE & GLOSSAIRE */}
                    {!result.isBatch && (
                      <div className="bg-[#16191E] border border-white/10 rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                          <Info className="w-5 h-5 text-purple-400" />
                          <h3 className="font-black uppercase tracking-widest text-sm">Méthodologie & Glossaire</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-purple-400 uppercase mb-2">Modèles de Distribution</h4>
                              <div className="space-y-2">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                  <p className="text-xs font-bold text-white mb-1">λ (Lambda)</p>
                                  <p className="text-[10px] text-white/60">Espérance de buts calculée sur les 10 derniers matchs réels. Formule : (Moyenne_Buts_Marqués_A + Moyenne_Buts_Encaissés_B) / 2.</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                  <p className="text-xs font-bold text-white mb-1">σ² (Variance)</p>
                                  <p className="text-[10px] text-white/60">Mesure la dispersion des scores. Si σ² &gt; λ, le modèle utilise la Binomiale Négative pour corriger l'overdispersion.</p>
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-[10px] font-black text-purple-400 uppercase mb-2">Indicateurs de Performance</h4>
                              <div className="space-y-2">
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                  <p className="text-xs font-bold text-white mb-1">Edge (Avantage)</p>
                                  <p className="text-[10px] text-white/60">Edge = (Probabilité IA × Cote Bookmaker) - 1. Un Edge &gt; 0.05 (5%) indique une value bet potentielle.</p>
                                </div>
                                <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                  <p className="text-xs font-bold text-white mb-1">IFR (Indice Fiabilité Réelle)</p>
                                  <p className="text-[10px] text-white/60">Score de confiance ajusté par les facteurs qualitatifs (absences, météo, motivation).</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-[10px] font-black text-purple-400 uppercase mb-2">Notations & Formules</h4>
                              <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                                <div className="space-y-3 text-[10px] text-white/80">
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-black text-white">V / N / D</span>
                                    <span>Victoire / Nul / Défaite</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-black text-white">GF / GA</span>
                                    <span>Buts Marqués / Encaissés</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-black text-white">1N2</span>
                                    <span>Home / Draw / Away</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-black text-white">Over 2.5</span>
                                    <span>Plus de 2.5 buts</span>
                                  </div>
                                  <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="font-black text-white">BTTS</span>
                                    <span>Les deux équipes marquent</span>
                                  </div>
                                  <div className="flex justify-between pt-1">
                                    <span className="font-black text-white">ROI Prob</span>
                                    <span>1 / Fair Odd</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-white/40 uppercase mb-2">Calcul du λ (Moteur V5.0)</p>
                              <p className="text-[10px] italic text-white/60">Le modèle fusionne la puissance d'attaque d'une équipe avec la fragilité défensive de son adversaire sur un échantillon de 10 matchs pour obtenir une espérance de buts ultra-précise.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    {/* Section Market Selection - Théorie des Marchés */}
                    {result.marketSelection && result.marketSelection.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-500/5 border border-amber-500/20 rounded-3xl p-6"
                      >
                        <div className="flex items-center gap-3 mb-6">
                          <div className="p-2 bg-amber-500/20 rounded-lg">
                            <TrendingUp className="w-6 h-6 text-amber-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-black text-white tracking-tighter italic uppercase">Stratégie des Marchés</h3>
                            <p className="text-amber-500/60 text-[8px] font-black uppercase tracking-widest leading-none mt-1">Le marché est la conséquence de la donnée exploitable.</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {result.marketSelection.map((m, idx) => (
                            <div key={idx} className={`p-4 rounded-2xl border transition-all ${
                              m.priority === 'P1' ? 'bg-amber-500/10 border-amber-500/30' :
                              m.priority === 'P2' ? 'bg-blue-500/10 border-blue-500/30' :
                              'bg-white/5 border-white/10'
                            }`}>
                              <div className="flex justify-between items-start mb-2">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  m.priority === 'P1' ? 'bg-amber-500 text-black' :
                                  m.priority === 'P2' ? 'bg-blue-500 text-white' :
                                  'bg-white/20 text-white/40'
                                }`}>
                                  Priorité {m.priority}
                                </span>
                                <span className="text-[10px] font-mono text-white/20">L: {m.readability}%</span>
                              </div>
                              <div className="text-lg font-black text-white mb-1 leading-tight">{m.market}</div>
                              <div className="flex items-center gap-2 mb-3 px-2 py-1 bg-black/20 rounded-lg w-fit">
                                <span className="text-[8px] text-white/20 font-black uppercase tracking-widest">Risque:</span>
                                <span className={`text-[8px] font-black uppercase ${
                                  m.risk === 'Bas' ? 'text-emerald-400' :
                                  m.risk === 'Moyen' ? 'text-amber-400' : 'text-rose-400'
                                }`}>{m.risk}</span>
                              </div>
                              <p className="text-[10px] text-white/40 leading-relaxed italic border-t border-white/5 pt-3">"{m.reasoning}"</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    <h2 className="text-xl font-black uppercase italic tracking-tighter">Pronostics Optimaux</h2>
                    {result.predictions?.map((pred, idx) => (
                      <div key={idx} className={`bg-[#16191E] border rounded-2xl p-5 hover:border-orange-500/40 transition-all group relative ${pred.confidence >= 90 ? 'border-orange-500/50 ring-2 ring-orange-500/10' : 'border-white/10'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Option {idx + 1}</span>
                            {pred.isValueBet && (
                              <span className="bg-blue-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter w-fit">Value Bet</span>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1 text-green-400 bg-green-400/10 px-2 py-0.5 rounded text-[10px] font-bold"><Target className="w-3 h-3" />{pred.confidence}%</div>
                            {pred.edge !== undefined && (
                              <div className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase border ${pred.edge > 0 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                Edge: {(pred.edge * 100)?.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                        <h5 className="font-black text-lg mb-1 leading-tight">{pred.type}</h5>
                        <div className="flex items-end justify-between mb-4">
                          <div><p className="text-[10px] text-white/40 font-bold uppercase">Mise Idéale</p><p className="text-lg font-black text-orange-500">{calculateIdealStake(pred.confidence, pred.odd)} {bankroll.currency}</p></div>
                          <div className="text-right"><p className="text-[10px] text-white/40 font-bold uppercase">Cote</p><p className="text-2xl font-black text-white">@{pred.odd?.toFixed(2)}</p></div>
                        </div>
                        <button onClick={() => addToCoupon(pred, result.match)} className="w-full bg-white/5 hover:bg-orange-500 hover:text-black py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-white/10">
                          <Plus className="w-3 h-3" /> Ajouter au coupon
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

          {view === 'coupon' && (
            <motion.div key="coupon" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="max-w-4xl mx-auto space-y-8">
              <div className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">Votre Combiné</h2>
                  {coupon.length >= 2 && (
                    <button
                        onClick={handleManualComboAnalysis}
                        disabled={isAnalyzingCombo}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/70"
                    >
                        {isAnalyzingCombo ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3 text-orange-500" />}
                        {isAnalyzingCombo ? 'Analyse...' : 'Vérifier la cohérence IA'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right"><p className="text-[10px] font-black text-white/40 uppercase">Cote Totale</p><p className={`text-2xl font-black ${totalCouponOdd >= bankroll.dailyTargetOdd ? 'text-green-400' : 'text-orange-500'}`}>@{totalCouponOdd?.toFixed(2)}</p></div>
                  <div className="w-px h-10 bg-white/10" /><div className="text-right"><p className="text-[10px] font-black text-white/40 uppercase">Objectif</p><p className="text-2xl font-black text-white/60">@{bankroll.dailyTargetOdd?.toFixed(2)}</p></div>
                </div>
              </div>

              {comboAnalysis && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-orange-500/5 border border-orange-500/20 rounded-3xl p-6"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <Zap className="w-4 h-4 text-orange-500" />
                        <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-white/80">ANALYSE DÉTECTIVE DU COMBINÉ</h3>
                    </div>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:text-white/70 prose-strong:text-orange-500 text-xs markdown-body">
                        <ReactMarkdown>{comboAnalysis}</ReactMarkdown>
                    </div>
                </motion.div>
              )}

              {coupon.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10"><Ticket className="w-12 h-12 text-white/10 mx-auto mb-4" /><p className="text-white/40 font-bold">Votre coupon est vide.</p></div>
              ) : (
                <div className="space-y-4">
                  {coupon?.map((item) => (
                    <div key={item.prediction.id} className="bg-[#16191E] border border-white/10 rounded-2xl p-6 flex items-center justify-between group">
                      <div>
                        <p className="text-[10px] font-black text-orange-500 uppercase mb-1">{item.match?.competition || "Compétition"}</p>
                        <h4 className="font-black text-lg">{item.match?.homeTeam || "Home"} vs {item.match?.awayTeam || "Away"}</h4>
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase mb-1">
                          <Calendar className="w-3 h-3" /> {item.match?.date || "??/??/????"}
                          <Activity className="w-3 h-3 ml-2" /> {formatLocalTime(item.match?.timestamp || 0)}
                        </div>
                        <p className="text-sm text-white/60 font-bold">{item.prediction.type}</p>
                      </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase">Cote</p>
                        <p className="text-xl font-black">@{item.prediction.odd?.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-white/40 uppercase">Confiance</p>
                        <p className="text-xl font-black text-orange-500">{item.prediction.confidence}%</p>
                      </div>
                      <button onClick={() => removeFromCoupon(item.prediction.id)} className="text-white/20 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    </div>
                  ))}
                  <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-4 rounded-2xl bg-white/5 ${risk.color}`}>
                        <risk.icon className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-white/40 uppercase">Indicateur de Risque</p>
                        <p className={`text-xl font-black uppercase italic ${risk.color}`}>{risk.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] font-black text-white/40 uppercase">Probabilité Combinée</p>
                        <p className="text-2xl font-black text-white">{combinedConfidence}%</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-black text-white/40 uppercase">Espérance (EV)</p>
                        <p className={`text-2xl font-black ${(combinedProb * totalCouponOdd) > 1 ? 'text-green-400' : 'text-red-400'}`}>
                          {(combinedProb * totalCouponOdd)?.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-500 rounded-3xl p-8 text-black mt-8">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-[10px] font-black uppercase mb-1">Mise suggérée (Kelly)</p>
                        <p className="text-4xl font-black">{calculateIdealStake(combinedConfidence, totalCouponOdd)} {bankroll.currency}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase mb-1">Gains Potentiels</p>
                        <p className="text-4xl font-black">{(calculateIdealStake(combinedConfidence, totalCouponOdd) * totalCouponOdd).toLocaleString()} {bankroll.currency}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button onClick={placeCouponBet} className="w-full bg-black text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black/80 transition-all flex items-center justify-center gap-2"><CheckCircle2 className="w-5 h-5" /> Valider le Combiné</button>
                      <button onClick={saveCoupon} className="w-full bg-black/10 text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-black/20 transition-all flex items-center justify-center gap-2"><Save className="w-5 h-5" /> Enregistrer</button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'history' && (
            <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Historique des Analyses</h2>
                {history.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllHistory}
                      className="text-[10px] font-black uppercase px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                    >
                      {selectedHistoryIds.length === history.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                    {selectedHistoryIds.length > 0 && (
                      <button
                        onClick={deleteSelectedHistory}
                        disabled={isDeletingSelection}
                        className="text-[10px] font-black uppercase px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isDeletingSelection ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Supprimer ({selectedHistoryIds.length})
                      </button>
                    )}
                  </div>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <Clock className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-bold">Aucune analyse récente.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {history?.map((res) => (
                    <div
                      key={res.id}
                      onClick={() => { setResult(res); setView('analyze'); }}
                      className={`bg-[#16191E] border rounded-2xl p-6 transition-all cursor-pointer group relative ${
                        selectedHistoryIds.includes(res.id) ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-white/10 hover:border-orange-500/50'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleHistorySelection(res.id);
                            }}
                            className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                              selectedHistoryIds.includes(res.id)
                                ? 'bg-orange-500 border-orange-500 text-black'
                                : 'bg-white/5 border-white/10 hover:border-white/30 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${
                            res.isBatch
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                          }`}>
                            {res.isBatch ? "Analyse Groupée" : (res.match?.competition || "Compétition")}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-[10px] text-white/40 font-bold uppercase">
                            {res.timestamp ? new Date(res.timestamp).toLocaleDateString() : "--/--/----"}
                          </div>
                          <div className="relative">
                            {confirmDeleteId === res.id ? (
                              <div className="flex items-center gap-2 bg-red-500 rounded-lg p-1 animate-in fade-in zoom-in duration-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteHistoryItem(res.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[8px] font-black uppercase px-2 py-1 bg-white text-red-500 rounded-md hover:bg-white/90 transition-all"
                                >
                                  Confirmer
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDeleteId(null);
                                  }}
                                  className="text-[8px] font-black uppercase px-2 py-1 text-white hover:bg-white/10 rounded-md transition-all"
                                >
                                  Annuler
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDeleteId(res.id);
                                }}
                                className="p-1.5 hover:bg-red-500/20 text-white/20 hover:text-red-500 rounded-lg transition-all"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      <h4 className="font-black text-lg mb-2">{(res.match?.homeTeam || "Match")} vs {(res.match?.awayTeam || "Inconnu")}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase">
                          <Activity className="w-3 h-3" /> {formatLocalTime(res.match?.timestamp || 0)}
                          {res.match?.timestamp && getMatchStatus(res.match.timestamp) === 'live' && <span className="text-red-500 ml-2 animate-pulse">● Live</span>}
                        </div>
                        <div className="text-orange-500 group-hover:translate-x-1 transition-transform"><ChevronRight className="w-4 h-4" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'bankroll' && (
            <motion.div key="bankroll" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-orange-500 rounded-3xl p-8 text-black relative overflow-hidden group">
                  <Wallet className="absolute top-4 right-4 w-12 h-12 opacity-20" />
                  <p className="text-[10px] font-black uppercase mb-1">Solde Principal</p>
                  {isEditingBalance ? (
                    <div className="flex items-center gap-2">
                      <input
                                type="number"
                                value={balanceInput || ""}
                                onChange={(e) => setBalanceInput(e.target.value)}
                                className="bg-black/10 border-b-2 border-black/20 focus:border-black/50 outline-none text-2xl font-black w-full"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateBalance()}
                              />
                      <button onClick={handleUpdateBalance} className="p-2 hover:bg-black/10 rounded-full transition-colors">
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-3xl font-black">{bankroll.balance.toLocaleString()} {bankroll.currency}</p>
                      <button
                        onClick={startEditingBalance}
                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-black/10 rounded-full transition-all"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="bg-blue-500 rounded-3xl p-8 text-white relative overflow-hidden"><ShieldCheck className="absolute top-4 right-4 w-12 h-12 opacity-20" /><p className="text-[10px] font-black uppercase mb-1">Réserve Sécurité (20%)</p><p className="text-3xl font-black">{bankroll.lockedBalance.toLocaleString()} {bankroll.currency}</p></div>
                <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8"><p className="text-[10px] font-black text-white/40 uppercase mb-1">Profit Total</p><p className={`text-3xl font-black ${totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{totalProfit > 0 ? '+' : ''}{totalProfit.toLocaleString()} {bankroll.currency}</p></div>
                <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8 flex flex-col justify-between"><div><p className="text-[10px] font-black text-white/40 uppercase mb-1">Objectif Épargne</p><p className="text-xl font-black">{bankroll.savingsGoal.toLocaleString()} {bankroll.currency}</p></div><div className="w-full bg-white/5 h-2 rounded-full mt-4 overflow-hidden"><div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${progressToGoal}%` }} /></div><p className="text-[10px] text-white/40 mt-2 font-bold uppercase">Progression: {progressToGoal?.toFixed(1)}%</p></div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#16191E] border border-white/10 rounded-3xl p-8">
                  <div className="flex justify-between items-center mb-8">
                    <div><h4 className="text-xl font-black uppercase tracking-tight">Performance Bankroll</h4><p className="text-white/40 text-xs uppercase font-bold tracking-widest mt-1">Évolution du solde au fil du temps</p></div>
                    <LucideLineChart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bankroll.balanceHistory}>
                        <defs>
                          <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                        <XAxis dataKey="timestamp" hide />
                        <YAxis stroke="#ffffff20" fontSize={10} tickFormatter={(val) => `${val}`} />
                        <Tooltip contentStyle={{ backgroundColor: '#16191E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }} itemStyle={{ color: '#f97316' }} labelStyle={{ display: 'none' }} />
                        <Area type="monotone" dataKey="balance" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8 space-y-6">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xl font-black uppercase tracking-tight">Taux de Réussite</h4>
                    <PieChart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="space-y-4">
                    {['football', 'basketball'].map(s => {
                      const sportBets = bets.filter(b => b.sport === s);
                      const wins = sportBets.filter(b => b.status === 'won').length;
                      const total = sportBets.length;
                      const rate = total > 0 ? (wins / total) * 100 : 0;
                      return (
                        <div key={s} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase text-white/40">{s}</span>
                            <span className="text-sm font-black text-orange-500">{rate?.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${rate}%` }} />
                          </div>
                          <p className="text-[10px] text-white/20 mt-2 font-bold uppercase">{wins} Victoires / {total} Paris</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="bg-[#16191E] border border-white/10 rounded-3xl overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between"><h3 className="font-black uppercase tracking-widest text-sm">Historique des Paris</h3><BarChart3 className="w-5 h-5 text-orange-500" /></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead><tr className="text-[10px] font-black text-white/30 uppercase border-b border-white/5"><th className="px-6 py-4">Match / Type</th><th className="px-6 py-4">Cote</th><th className="px-6 py-4">Mise</th><th className="px-6 py-4">Status</th><th className="px-6 py-4">Action</th></tr></thead>
                    <tbody className="divide-y divide-white/5">
                      {bets?.map((bet) => (
                        <tr key={bet.id} className="text-sm hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4"><div className="flex items-center gap-2">{bet.isCombined && <Ticket className="w-3 h-3 text-orange-500" />}<span className="font-bold">{bet.matchId}</span></div><p className="text-[10px] text-white/40 truncate max-w-[200px]">{bet.prediction}</p></td>
                          <td className="px-6 py-4 font-black">@{bet.odd?.toFixed(2)}</td>
                          <td className="px-6 py-4 font-bold">{bet.stake.toLocaleString()} {bankroll.currency}</td>
                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${bet.status === 'won' ? 'bg-green-400/10 text-green-400' : bet.status === 'lost' ? 'bg-red-400/10 text-red-400' : 'bg-orange-500/10 text-orange-500'}`}>{bet.status === 'won' ? 'Gagné' : bet.status === 'lost' ? 'Perdu' : 'En attente'}</span></td>
                          <td className="px-6 py-4">
                            {bet.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => verifyBetResult(bet)} disabled={isVerifying === bet.id} className="p-1.5 bg-orange-500/10 text-orange-500 rounded hover:bg-orange-500 hover:text-black disabled:opacity-50">
                                  {isVerifying === bet.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                </button>
                                <button onClick={() => updateBetStatus(bet.id, 'won')} className="p-1.5 bg-green-400/10 text-green-400 rounded hover:bg-green-400 hover:text-black">W</button>
                                <button onClick={() => updateBetStatus(bet.id, 'lost')} className="p-1.5 bg-red-400/10 text-red-400 rounded hover:bg-red-400 hover:text-black">L</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'logs' && (
            <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter">Logs d'Analyse IA</h2>
                <div className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-orange-500/20">Dernières 2 Analyses</div>
              </div>

              {analysisLogs.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-white/10">
                  <FileText className="w-12 h-12 text-white/10 mx-auto mb-4" />
                  <p className="text-white/40 font-bold uppercase text-xs tracking-widest">Aucun log disponible.</p>
                  <p className="text-white/20 text-[10px] mt-2">Lancez une analyse pour voir le raisonnement de l'IA en temps réel.</p>
                </div>
              ) : (
                <div className="space-y-12">
                  {analysisLogs.map((log) => (
                    <div key={log.id} className="bg-[#16191E] border border-white/10 rounded-3xl overflow-hidden">
                      <div className="bg-white/5 p-6 border-b border-white/10 flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-lg uppercase italic tracking-tighter text-orange-500">{log.matchName}</h3>
                          <p className="text-[10px] text-white/40 font-bold uppercase mt-1">
                            {log.timestamp ? new Date(log.timestamp).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : "--/--/----"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] font-black text-white/20 uppercase">ID Session</p>
                          <p className="text-xs font-mono text-white/40">{log.id}</p>
                        </div>
                      </div>
                      <div className="p-6 space-y-4">
                        {log.steps.map((step, idx) => (
                          <div key={idx} className="flex gap-4 group">
                            <div className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full mt-1.5 ${
                                step.type === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' :
                                step.type === 'warning' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]' :
                                step.type === 'decision' ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' :
                                step.type === 'ai_reasoning' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' :
                                'bg-white/20'
                              }`} />
                              {idx < log.steps.length - 1 && <div className="w-px flex-1 bg-white/5 my-1" />}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-mono text-white/20">{step.time}</span>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${
                                  step.type === 'error' ? 'text-red-500' :
                                  step.type === 'warning' ? 'text-orange-500' :
                                  step.type === 'decision' ? 'text-blue-500' :
                                  step.type === 'ai_reasoning' ? 'text-purple-500' :
                                  'text-white/60'
                                }`}>
                                  {step.action}
                                </span>
                              </div>
                              {step.details && (
                                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                                  <p className="text-[11px] text-white/50 font-medium leading-relaxed font-mono whitespace-pre-wrap">
                                    {step.details}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'explorer' && (
            <motion.div key="explorer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter">Match <span className="text-orange-500">Explorer</span></h2>
                  <p className="text-white/40 text-sm font-bold uppercase tracking-widest mt-2">Découvrez les meilleures affiches du jour</p>
                </div>
                <div className="flex items-center gap-4">
                  {selectedMatches.length > 0 && (
                    <button
                      onClick={() => handleBatchAnalyze()}
                      disabled={isBatchAnalyzing}
                      className="flex items-center gap-2 bg-orange-500 text-black px-6 py-2 rounded-full font-black uppercase text-xs tracking-widest hover:bg-orange-400 transition-all shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                    >
                      {isBatchAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                      Analyser la sélection ({selectedMatches.length})
                    </button>
                  )}
                  <button onClick={() => setSport('football')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${sport === 'football' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/50 hover:border-white/30'}`}>Football</button>
                  <button onClick={() => setSport('basketball')} className={`px-6 py-2 rounded-full text-sm font-bold transition-all border ${sport === 'basketball' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/50 hover:border-white/30'}`}>Basketball</button>
                  <button onClick={handleExplore} disabled={isExploring} className="p-3 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-all">
                    <RefreshCw className={`w-5 h-5 ${isExploring ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {isBatchAnalyzing && (
                <div className="bg-white/5 border border-orange-500/30 rounded-3xl p-6 mb-8">
                   <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-black uppercase tracking-widest text-orange-500">Analyse en rafale en cours...</p>
                      <p className="text-xs font-mono text-white/40">{Math.round(batchProgress)}%</p>
                   </div>
                   <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${batchProgress}%` }} />
                   </div>
                </div>
              )}

              {isExploring ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3, 4, 5, 6].map(i => (
                    <div key={i} className="bg-[#16191E] border border-white/10 rounded-3xl p-6 animate-pulse">
                      <div className="h-4 bg-white/5 rounded w-1/3 mb-4" />
                      <div className="flex justify-between items-center mb-6">
                        <div className="w-12 h-12 bg-white/5 rounded-full" />
                        <div className="h-4 bg-white/5 rounded w-1/4" />
                        <div className="w-12 h-12 bg-white/5 rounded-full" />
                      </div>
                      <div className="h-10 bg-white/5 rounded-xl" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {explorerMatches?.map((match, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => toggleMatchSelection(match)}
                      className={`bg-[#16191E] border rounded-3xl p-6 transition-all group cursor-pointer relative ${
                        selectedMatches.some(m => m.home === match.home && m.away === match.away)
                          ? 'border-orange-500 ring-2 ring-orange-500/20'
                          : 'border-white/10 hover:border-orange-500/30'
                      }`}
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          selectedMatches.some(m => m.home === match.home && m.away === match.away)
                            ? 'bg-orange-500 border-orange-500 text-black'
                            : 'bg-white/5 border-white/10 text-transparent'
                        }`}>
                          <Check className="w-4 h-4" />
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-[10px] font-black uppercase text-orange-500 bg-orange-500/10 px-2 py-1 rounded">{match.competition}</span>
                        <div className="flex items-center gap-1.5 text-white/40">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[10px] font-bold">
                            {match?.date && !isNaN(new Date(match.date).getTime())
                              ? new Date(match.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                              : '??/??'}
                          </span>
                          <Clock className="w-3 h-3 ml-2" />
                          <span className="text-[10px] font-bold">{match.time}</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-6">
                        <div className="text-center flex-1">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl font-black group-hover:bg-orange-500 group-hover:text-black transition-colors">{match.home?.[0]}</div>
                          <p className="text-xs font-black uppercase truncate px-2">{match.home}</p>
                        </div>
                        <div className="px-4 text-white/20 font-black italic">VS</div>
                        <div className="text-center flex-1">
                          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-2 text-xl font-black group-hover:bg-orange-500 group-hover:text-black transition-colors">{match.away?.[0]}</div>
                          <p className="text-xs font-black uppercase truncate px-2">{match.away}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mb-6">
                        {Object.entries(match.odds || {}).map(([key, val]) => (
                          <div key={key} className="bg-white/5 border border-white/5 rounded-xl p-2 text-center">
                            <p className="text-[8px] font-black text-white/20 uppercase mb-1">{key}</p>
                            <p className="text-xs font-bold text-orange-500">{val as React.ReactNode}</p>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => {
                          setHomeQuery(match.home);
                          setAwayQuery(match.away);
                          setView('analyze');
                          // We need to pass the combined query or wait for state update
                          // But handleAnalyze now uses combinedQuery from state
                          // To be safe, let's trigger it in a way that uses the values
                          setTimeout(() => handleAnalyze(), 100);
                        }}
                        className="w-full bg-white/5 hover:bg-orange-500 border border-white/10 hover:border-orange-500 text-white hover:text-black py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <BrainCircuit className="w-4 h-4" />
                        Lancer l'Analyse IA
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'course' && (
            <Course onClose={() => setView('analyze')} />
          )}

          {view === 'firecrawl' && (
            <FirecrawlView
              onStartAnalysis={(home, away) => {
                setHomeQuery(home);
                setAwayQuery(away);
                setView('analyze');
                setTimeout(() => handleAnalyze(), 200);
              }}
              callAiWithRetry={callAiWithRetry}
            />
          )}

          {view === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-8">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Configuration</h2>

              <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black uppercase tracking-tight">Compte</h3>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-red-500 font-black uppercase text-xs hover:bg-red-500/10 px-3 py-1.5 rounded-full transition-all"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <img src={activeUser.photoURL || ''} alt="" className="w-12 h-12 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                  <div>
                    <p className="font-black">{activeUser.displayName}</p>
                    <p className="text-xs text-white/40 font-bold">{activeUser.email}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8 space-y-6 relative overflow-hidden">
                {!isExportUnlocked && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldCheck className="w-12 h-12 text-orange-500 mb-4" />
                    <h4 className="text-sm font-black uppercase mb-2">Paramètres Verrouillés</h4>
                    <p className="text-[10px] text-white/60 font-bold max-w-[200px]">
                      Saisissez le mot de passe de sécurité dans la section ci-dessous pour modifier votre configuration.
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Profil de Risque</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button onClick={() => updateBankroll({...bankroll, riskProfile: 'conservative'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${bankroll.riskProfile === 'conservative' ? 'bg-green-500 border-green-500 text-black' : 'border-white/10 text-white/40 hover:border-white/30'}`}><ShieldCheck className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Prudent</span></button>
                    <button onClick={() => updateBankroll({...bankroll, riskProfile: 'balanced'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${bankroll.riskProfile === 'balanced' ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/40 hover:border-white/30'}`}><Zap className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Équilibré</span></button>
                    <button onClick={() => updateBankroll({...bankroll, riskProfile: 'aggressive'})} className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all ${bankroll.riskProfile === 'aggressive' ? 'bg-red-500 border-red-500 text-black' : 'border-white/10 text-white/40 hover:border-white/30'}`}><Flame className="w-6 h-6" /><span className="text-[10px] font-bold uppercase">Agressif</span></button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Solde Principal ({bankroll.currency})</label><input type="number" value={bankroll.balance ?? 0} onChange={(e) => updateBankroll({...bankroll, balance: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500" /></div>
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Objectif Épargne ({bankroll.currency})</label><input type="number" value={bankroll.savingsGoal ?? 0} onChange={(e) => updateBankroll({...bankroll, savingsGoal: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Nombre de Tickets (Génération Auto)</label><select value={bankroll.maxTicketsPerDay} onChange={(e) => updateBankroll({...bankroll, maxTicketsPerDay: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none"><option value={1}>1 Ticket</option><option value={2}>2 Tickets</option><option value={3}>3 Tickets</option><option value={4}>4 Tickets</option><option value={5}>5 Tickets</option></select></div>
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Matchs Max / Coupon</label><select value={bankroll.maxEventsPerCoupon} onChange={(e) => updateBankroll({...bankroll, maxEventsPerCoupon: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none"><option value={2}>2 Matchs</option><option value={3}>3 Matchs</option><option value={4}>4 Matchs</option><option value={5}>5 Matchs</option><option value={6}>6 Matchs</option><option value={7}>7 Matchs</option><option value={8}>8 Matchs</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Cote Visée (Combiné)</label><input type="number" step="0.1" value={bankroll.dailyTargetOdd ?? 0} onChange={(e) => updateBankroll({...bankroll, dailyTargetOdd: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500" /></div>
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Confiance Min (%)</label><input type="number" value={bankroll.minConfidence ?? 0} onChange={(e) => updateBankroll({...bankroll, minConfidence: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500" /></div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-[10px] font-black uppercase text-white/40 mb-2 block">Réserve Sécurité ({bankroll.currency})</label><input type="number" value={bankroll.lockedBalance ?? 0} onChange={(e) => updateBankroll({...bankroll, lockedBalance: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 focus:outline-none focus:border-orange-500" /></div>
                  <div className="flex items-end"><button onClick={() => updateBankroll({...bankroll, adaptiveMode: !bankroll.adaptiveMode})} className={`w-full p-3 rounded-xl border text-[10px] font-black uppercase transition-all ${bankroll.adaptiveMode ? 'bg-orange-500 border-orange-500 text-black' : 'border-white/10 text-white/40'}`}>IA Adaptative: {bankroll.adaptiveMode ? 'ON' : 'OFF'}</button></div>
                </div>

                {/* --- CONFIGURATION IA --- */}
                <div className="mt-8 pt-8 border-t border-white/5">
                  <h4 className="flex items-center gap-2 text-xs font-black uppercase text-white tracking-widest mb-6">
                    <Cpu className="w-4 h-4 text-orange-500" />
                    Configuration du Cerveau IA
                    {activeSessionModel !== primaryModel && (
                      <div className="ml-auto flex items-center gap-2 bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full border border-orange-500/30 animate-pulse">
                        <Zap className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase">Session Mode: Turbo Stable</span>
                      </div>
                    )}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={() => updatePrimaryModel('gemini-3.6-flash')}
                      className={`relative p-5 rounded-2xl border text-left transition-all overflow-hidden group ${primaryModel === 'gemini-3.6-flash' ? 'bg-orange-500 border-orange-500 text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-tight">Version 3.6 Flash</span>
                        {primaryModel === 'gemini-3.6-flash' && <div className="bg-black/20 px-2 py-0.5 rounded text-[8px] font-bold">ACTIF</div>}
                      </div>
                      <h5 className="font-bold text-sm mb-1">Gemini 3.6 Flash Pro</h5>
                      <p className={`text-[9px] leading-relaxed ${primaryModel === 'gemini-3.6-flash' ? 'text-black/60' : 'text-white/20'}`}>
                        Dernière génération stable. Ultra-rapide et précis pour l'analyse de données complexes.
                      </p>
                      <div className={`absolute bottom-0 right-0 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform ${primaryModel === 'gemini-3.6-flash' ? 'text-black' : 'text-white'}`}>
                        <Zap className="w-full h-full p-2" />
                      </div>
                    </button>

                    <button
                      onClick={() => updatePrimaryModel('gemini-3.1-flash-lite')}
                      className={`relative p-5 rounded-2xl border text-left transition-all overflow-hidden group ${primaryModel === 'gemini-3.1-flash-lite' ? 'bg-orange-500 border-orange-500 text-black' : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-tight">Version 3.1 Lite</span>
                        {primaryModel === 'gemini-3.1-flash-lite' && <div className="bg-black/20 px-2 py-0.5 rounded text-[8px] font-bold">ACTIF</div>}
                      </div>
                      <h5 className="font-bold text-sm mb-1">Gemini 3.1 Lite Pro</h5>
                      <p className={`text-[9px] leading-relaxed ${primaryModel === 'gemini-3.1-flash-lite' ? 'text-black/60' : 'text-white/20'}`}>
                        Modèle ultra-économe de dernière génération. Conçu pour maximiser le quota tout en restant performant.
                      </p>
                      <div className={`absolute bottom-0 right-0 w-16 h-16 opacity-10 group-hover:scale-110 transition-transform ${primaryModel === 'gemini-3.1-flash-lite' ? 'text-black' : 'text-white'}`}>
                        <Cpu className="w-full h-full p-2" />
                      </div>
                    </button>
                  </div>

                  <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/5 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <h6 className="text-[10px] font-bold text-white uppercase mb-1">Redondance Intelligente</h6>
                      <p className="text-[9px] text-white/40 leading-relaxed">
                        Le système bascule automatiquement sur le modèle secondaire si les limites de quota (Error 429) sont atteintes avec le modèle principal.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#16191E] border border-white/10 rounded-3xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <ShieldCheck className="w-6 h-6 text-orange-500" />
                  <h3 className="text-xl font-black uppercase tracking-tight">Sécurité & Export</h3>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-xs font-bold text-white/60 mb-4">
                      Exportez le code source complet et le script d'analyse **Google Colab** (.py).
                      Cette action est protégée par un mot de passe de sécurité.
                    </p>

                    <div className="flex flex-col gap-4">
                      <div className="relative">
                        <input
                          type="password"
                          value={exportPassword || ""}
                          onChange={(e) => setExportPassword(e.target.value)}
                          placeholder="Mot de passe de sécurité"
                          className="w-full bg-black/20 border border-white/10 rounded-xl py-3 px-4 focus:outline-none focus:border-orange-500/50 text-sm"
                        />
                      </div>

                      {exportError && (
                        <p className="text-red-400 text-[10px] font-bold uppercase">{exportError}</p>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            if (exportPassword === 'SMARTPICK2026') {
                              setIsExportUnlocked(true);
                              setExportError(null);
                            } else {
                              setExportError("Mot de passe incorrect.");
                            }
                          }}
                          className="bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-2"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Déverrouiller
                        </button>
                        <button
                          onClick={handleExportCode}
                          disabled={isExporting}
                          className="bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                        >
                          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Exporter (.ZIP)
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-orange-500/80 font-bold leading-relaxed">
                        ATTENTION : Le code source contient la logique propriétaire du Moteur V2.5.
                        Ne partagez pas ce fichier sans autorisation. Une authentification forte (Google)
                        est requise pour toute mise à jour sensible si le verrou n'est pas levé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  </div>

      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <AnimatePresence>
        {showSheetEditor && result?.spreadsheetId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#16191E] border border-white/10 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Table className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-white">Éditeur Google Sheets</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Éditez les variables et synchronisez</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSyncFromSheets}
                    disabled={isSyncingSheets}
                    className="bg-orange-500 hover:bg-orange-600 text-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                  >
                    {isSyncingSheets ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Synchroniser l'Analyse
                  </button>
                  <a
                    href={result.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ouvrir Original
                  </a>
                  <button
                    onClick={() => setShowSheetEditor(false)}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-white relative overflow-hidden">
                <iframe
                  src={`https://docs.google.com/spreadsheets/d/${result.spreadsheetId}/edit?rm=minimal`}
                  className="w-full h-full border-none"
                  title="Google Sheet Editor"
                />
              </div>
              <div className="p-4 bg-orange-500/10 border-t border-orange-500/20 text-center">
                <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest">
                  Toute modification dans la feuille sera prise en compte après avoir cliqué sur "Synchroniser l'Analyse"
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
