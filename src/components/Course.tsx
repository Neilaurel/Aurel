import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Calculator, Info, Target, TrendingUp, AlertTriangle,
  BookOpen, Sparkles, GraduationCap, ArrowRight,
  Check, PlayCircle, Trophy, Brain, Shield, Zap, Flame,
  Globe, Clock, History, Wallet, Settings, BarChart3,
  Scale, Layers, ListChecks, Calendar, Wrench, HelpCircle
} from 'lucide-react';

interface CourseProps {
  onClose: () => void;
}

const chapters = [
  {
    id: 0,
    tag: "Introduction",
    title: "Formation Complète v2.0",
    lead: "Système intégré 6 marchés : 1X2, Double Chance, Over/Under, BTTS, Handicap. Zéro calcul compliqué.",
    content: <Introduction />
  },
  {
    id: 1,
    tag: "Partie 1",
    title: "Fondamentaux",
    lead: "Comprendre le marché avant de le jouer. Mécanique des cotes, Overround et Value.",
    content: <Chapter1 />
  },
  {
    id: 2,
    tag: "Partie 2",
    title: "Marché 1X2 (Victoire)",
    lead: "Identifier la domination entre les deux équipes via 4 critères précis.",
    content: <Chapter2 />
  },
  {
    id: 3,
    tag: "Partie 3",
    title: "Marché Double Chance",
    lead: "Sécuriser quand la domination est réelle mais incertaine.",
    content: <Chapter3 />
  },
  {
    id: 4,
    tag: "Partie 4",
    title: "Marché Total (Over/Under)",
    lead: "Le système +/- : Croisement attaque × défense pour décider.",
    content: <Chapter4 />
  },
  {
    id: 5,
    tag: "Partie 5",
    title: "Marché BTTS (Les deux marquent)",
    lead: "Croiser Total + Double Chance pour décider logiquement.",
    content: <Chapter5 />
  },
  {
    id: 6,
    tag: "Partie 6",
    title: "Marché Handicap",
    lead: "Optimiser le rendement quand la domination est claire.",
    content: <Chapter6 />
  },
  {
    id: 7,
    tag: "Partie 7",
    title: "Liens entre Marchés",
    lead: "Structure d'analyse ordonnée et règle anti-contradiction.",
    content: <Chapter7 />
  },
  {
    id: 8,
    tag: "Partie 8",
    title: "Gestion de Bankroll",
    lead: "Survivre aux pertes et maximiser la croissance via le Critère de Kelly.",
    content: <Chapter8 />
  },
  {
    id: 9,
    tag: "Partie 9",
    title: "Programme & Plan d'Action",
    lead: "Routine hebdomadaire, stack d'outils et plan d'action en 4 phases.",
    content: <Chapter9 />
  },
  {
    id: 10,
    tag: "Conclusion",
    title: "Fiche de Référence Rapide",
    lead: "Les 10 commandements du parieur analytique et récapitulatif global.",
    content: <Conclusion />
  }
];

function Introduction() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "6 Marchés Couverts", color: "bg-green-500" },
          { label: "Système +/- Intégré", color: "bg-blue-500" },
          { label: "Liens Entre Marchés", color: "bg-orange-500" },
          { label: "Zéro Calcul Compliqué", color: "bg-purple-500" },
        ].map((item, i) => (
          <div key={i} className={`${item.color} p-4 rounded-2xl text-center shadow-lg`}>
            <div className="text-[10px] font-black uppercase text-white/90">{item.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
        <h3 className="text-xl font-black uppercase tracking-tight text-white">Plan Général</h3>
        <div className="space-y-2">
          {chapters.slice(1).map((ch) => (
            <div key={ch.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5 hover:border-orange-500/30 transition-all group">
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-black text-black text-xs shrink-0">{ch.id}</div>
              <div>
                <div className="text-xs font-black text-white uppercase group-hover:text-orange-500 transition-colors">{ch.title}</div>
                <div className="text-[10px] text-white/40">{ch.lead}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chapter1() {
  const [cote, setCote] = useState(2.50);
  const prob = (100 / (cote || 1))?.toFixed(1) || "0.0";

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">1.1 La Mécanique des Cotes</h3>
        <p className="text-sm text-white/70">Une cote traduit une probabilité. Le bookmaker a déjà intégré : stats, effectifs, forme. Votre rôle est d'identifier où ce calcul est incomplet.</p>
        <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
          <div className="text-[10px] font-black uppercase text-blue-400 mb-2">Probabilité implicite = 1 ÷ Cote</div>
          <div className="flex items-center gap-4">
            <input type="number" step="0.1" value={cote} onChange={(e) => setCote(Number(e.target.value))} className="bg-white/5 border border-white/10 rounded-xl p-3 text-2xl font-black text-white w-32 focus:outline-none focus:border-blue-500" />
            <div className="text-4xl font-black text-white">→ {prob}%</div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">1.2 Overround — La Marge Cachée</h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/10 text-white/40 uppercase font-black">
              <tr><th className="p-3">Résultat</th><th className="p-3">Cote</th><th className="p-3">Proba</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="p-3">Victoire Domicile</td><td className="p-3">2.10</td><td className="p-3">47.6%</td></tr>
              <tr><td className="p-3">Match Nul</td><td className="p-3">3.40</td><td className="p-3">29.4%</td></tr>
              <tr><td className="p-3">Victoire Extérieur</td><td className="p-3">3.60</td><td className="p-3">27.8%</td></tr>
              <tr className="bg-red-500/20 font-black"><td className="p-3">TOTAL (Overround)</td><td className="p-3">—</td><td className="p-3 text-red-400">104.8% → Marge 4.8%</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">1.3 Sharp vs Soft</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-xs font-black text-white uppercase mb-2">Sharps (Pinnacle, SBO)</div>
            <p className="text-[10px] text-white/60">Marge 2-3%. Ne limitent pas les gagnants. Référence/Baromètre du marché.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-xs font-black text-white uppercase mb-2">Softs (Betclic, Unibet)</div>
            <p className="text-[10px] text-white/60">Marge 6-10%. Limitent les gagnants. Utiles pour capturer les erreurs de cotation.</p>
          </div>
        </div>
      </section>

      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
        <div className="text-[10px] font-black uppercase text-orange-500 mb-2">Value Bet & Dropping Odds</div>
        <div className="text-xl font-black text-white mb-2">Value = (Proba estimée × Cote) - 1</div>
        <p className="text-xs text-white/60 italic">Value &gt; 5% : bon | Value &gt; 10% : excellent. Dropping Odds : chute de cote = argent intelligent qui a misé.</p>
      </div>
    </div>
  );
}

function Chapter2() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {["Forme (6 matchs)", "Écart victoires", "Défense adverse", "H2H récent"].map((c, i) => (
          <div key={i} className="bg-orange-500/20 border border-orange-500/30 p-3 rounded-xl text-center">
            <div className="text-[8px] font-black text-orange-500 uppercase">Critère {i+1}</div>
            <div className="text-[10px] font-bold text-white leading-tight">{c}</div>
          </div>
        ))}
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">2.2 Critère 1 — Forme</h3>
        <div className="space-y-2">
          <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-xs text-white/70">Équipe A ≥ 4 victoires sur 6</span>
            <span className="text-xs font-black text-green-400">+1 avantage</span>
          </div>
          <div className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
            <span className="text-xs text-white/70">Équipe A = 3 victoires sur 6</span>
            <span className="text-xs font-black text-orange-400">Avantage modéré</span>
          </div>
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
            <p className="text-[10px] text-red-400 font-black uppercase">Règle Importante</p>
            <p className="text-[10px] text-white/60">Analysez DOMICILE et EXTÉRIEUR séparément. 5 victoires à domicile ≠ forme extérieure.</p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">2.6 Lecture Finale 1X2</h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/10 text-white/40 font-black uppercase">
              <tr><th className="p-3">Score</th><th className="p-3">Pronostic</th><th className="p-3">Détail</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="p-3 font-black text-green-400">3-4 pts</td><td className="p-3 font-black">VICTOIRE</td><td className="p-3 text-white/60">Confiance élevée. Jouez le 1 ou 2.</td></tr>
              <tr><td className="p-3 font-black text-orange-400">2 pts</td><td className="p-3 font-black">DOUBLE CHANCE</td><td className="p-3 text-white/60">Avantage réel mais incertain.</td></tr>
              <tr><td className="p-3 font-black text-yellow-400">1 pt</td><td className="p-3 font-black">RISQUÉ</td><td className="p-3 text-white/60">Edge marginal. Envisagez le nul.</td></tr>
              <tr><td className="p-3 font-black text-red-400">0 pt</td><td className="p-3 font-black">ÉVITER</td><td className="p-3 text-white/60">Aucun edge identifié. Ne pariez pas.</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Chapter3() {
  return (
    <div className="space-y-8">
      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
        <p className="text-sm text-white/70 leading-relaxed">La Double Chance (1X, X2, 12) permet de couvrir deux résultats. Elle est pertinente quand une équipe a un <strong className="text-white">edge réel</strong> mais pas suffisamment écrasant pour jouer la victoire sèche.</p>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">Critères Spécifiques</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-[10px] font-black text-orange-500 uppercase mb-1">Forme Non Perdue</div>
            <p className="text-[10px] text-white/60">Équipe A ≥ 2 matchs non perdus de plus que B → +1 avantage.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-[10px] font-black text-orange-500 uppercase mb-1">Forteresse Domicile</div>
            <p className="text-[10px] text-white/60">0 défaite à domicile sur 6 matchs → +1 avantage.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-[10px] font-black text-orange-500 uppercase mb-1">H2H Sécurisé</div>
            <p className="text-[10px] text-white/60">≤ 2 défaites en TOTAL H2H ET ≥ 2 victoires de plus → +1 avantage.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-[10px] font-black text-orange-500 uppercase mb-1">Motivation</div>
            <p className="text-[10px] text-white/60">Zone relégation ou lutte titre/Top 4 → +1 avantage.</p>
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 bg-white/5 font-black uppercase text-xs">Lecture Finale Double Chance</div>
        <div className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-green-400">≥ 3 points</span>
            <span className="text-xs font-bold text-white">DC FORTE (Cote acceptable même si faible)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-blue-400">2 points</span>
            <span className="text-xs font-bold text-white">BON PARI (Vérifiez cote &gt; 1.35)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-black text-red-400">0-1 point</span>
            <span className="text-xs font-bold text-white">ÉVITER (Aucun avantage identifié)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Chapter4() {
  return (
    <div className="space-y-8">
      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
        <div className="text-[10px] font-black uppercase text-orange-500 mb-2">Logique du Système +/-</div>
        <p className="text-sm text-white/70">Chaque test produit un signe <span className="text-green-400 font-black">+</span> (favorable aux buts) ou <span className="text-blue-400 font-black">-</span> (défavorable aux buts). La somme des <span className="text-green-400 font-black">+</span> détermine le niveau de confiance.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/10 text-white/40 font-black uppercase">
            <tr><th className="p-3">Aspect</th><th className="p-3">Condition</th><th className="p-3">Signe</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr><td className="p-3">ATTAQUE</td><td className="p-3">Moyenne ≥ 1.5 buts marqués/match</td><td className="p-3 text-green-400 font-black">+</td></tr>
            <tr><td className="p-3">ATTAQUE</td><td className="p-3">Moyenne &lt; 1.5 buts marqués/match</td><td className="p-3 text-blue-400 font-black">-</td></tr>
            <tr><td className="p-3">DÉFENSE</td><td className="p-3">Moyenne &gt; 1.5 buts encaissés/match</td><td className="p-3 text-green-400 font-black">+</td></tr>
            <tr><td className="p-3">DÉFENSE</td><td className="p-3">Moyenne ≤ 1.5 buts encaissés/match</td><td className="p-3 text-blue-400 font-black">-</td></tr>
          </tbody>
        </table>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">Les 4 Tests à Effectuer</h3>
        <div className="space-y-2">
          {[
            { t: "Test 1", m: "Attaque A vs Défense B", d: "Moy. buts A / Moy. encaissés B" },
            { t: "Test 2", m: "Attaque B vs Défense A", d: "Moy. buts B / Moy. encaissés A" },
            { t: "Test 3", m: "Attaque A seule", d: "Moyenne de buts A (tous matchs)" },
            { t: "Test 4", m: "Attaque B seule", d: "Moyenne de buts B (tous matchs)" },
          ].map((test, i) => (
            <div key={i} className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5">
              <div>
                <div className="text-[10px] font-black text-orange-500 uppercase">{test.t}</div>
                <div className="text-xs font-bold text-white">{test.m}</div>
              </div>
              <div className="text-[10px] text-white/40 text-right">{test.d}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-500/20 p-4 rounded-2xl text-center border border-green-500/30">
          <div className="text-xl font-black text-green-400">4 +</div>
          <div className="text-[10px] font-black text-white uppercase">OVER FORT</div>
          <div className="text-[8px] text-white/60">Misez OVER 2.5</div>
        </div>
        <div className="bg-blue-500/20 p-4 rounded-2xl text-center border border-blue-500/30">
          <div className="text-xl font-black text-blue-400">0-1 +</div>
          <div className="text-[10px] font-black text-white uppercase">UNDER FORT</div>
          <div className="text-[8px] text-white/60">Défenses dominantes</div>
        </div>
        <div className="bg-orange-500/20 p-4 rounded-2xl text-center border border-orange-500/30">
          <div className="text-xl font-black text-orange-400">2 +</div>
          <div className="text-[10px] font-black text-white uppercase">ANALYSER</div>
          <div className="text-[8px] text-white/60">Signal mixte</div>
        </div>
      </div>
    </div>
  );
}

function Chapter5() {
  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <p className="text-sm text-white/70 leading-relaxed">Le BTTS ne s'analyse pas isolément. Il découle logiquement du croisement entre votre analyse <strong className="text-white">Total (Over/Under)</strong> et votre analyse <strong className="text-white">Double Chance (domination)</strong>.</p>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-white/10 text-white/40 font-black uppercase">
            <tr><th className="p-3">Signal Total</th><th className="p-3">Signal DC</th><th className="p-3">BTTS</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr><td className="p-3 text-green-400 font-black">TOTAL → OVER (3-4 +)</td><td className="p-3">Pas de domination forte (DC ≤ 2 pts)</td><td className="p-3 font-black text-green-400">OUI</td></tr>
            <tr><td className="p-3 text-blue-400 font-black">TOTAL → UNDER (0-1 +)</td><td className="p-3">Peu importe la domination</td><td className="p-3 font-black text-red-400">NON</td></tr>
            <tr><td className="p-3 text-green-400 font-black">TOTAL → OVER</td><td className="p-3">Domination forte (DC ≥ 3 pts)</td><td className="p-3 font-black text-red-400">NON (Une équipe marque)</td></tr>
            <tr><td className="p-3 text-orange-400 font-black">Équipe forte MAIS encaisse</td><td className="p-3">DC forte + Défense poreuse (+)</td><td className="p-3 font-black text-green-400">OUI (Cas spécial)</td></tr>
          </tbody>
        </table>
      </div>

      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
        <div className="text-[10px] font-black uppercase text-orange-500 mb-2">Règle Mnémonique BTTS</div>
        <p className="text-sm text-white font-black">BTTS OUI = OVER + Match ouvert (pas de domination écrasante)</p>
        <p className="text-sm text-white/60 mt-1">BTTS NON = UNDER OU domination totale</p>
      </div>
    </div>
  );
}

function Chapter6() {
  return (
    <div className="space-y-8">
      <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
        <p className="text-sm text-white/70 leading-relaxed">Le handicap asiatique est basé sur deux dimensions : (1) la domination identifiée en 1X2 et (2) le volume de buts prévu par votre analyse Total.</p>
      </div>

      <div className="space-y-4">
        {[
          { cas: "CAS 1", s1: "Victoire forte (3-4 pts)", s2: "OVER (3-4 +)", h: "Handicap -1 / -1.5", l: "Domination + volume buts" },
          { cas: "CAS 2", s1: "Victoire forte (3-4 pts)", s2: "UNDER (0-1 +)", h: "Handicap -0.5 / -1", l: "Victoire probable mais score serré" },
          { cas: "CAS 4", s1: "Outsider solide (DC ≥ 2 pts)", s2: "Total moyen (2 +)", h: "Handicap +1 / +1.5", l: "Outsider résilient" },
          { cas: "CAS 5", s1: "Domination écrasante (4 pts)", s2: "OVER FORT (4 +)", h: "Handicap -1.5 / -2", l: "Écrasement total attendu" },
        ].map((item, i) => (
          <div key={i} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black text-orange-500 uppercase">{item.cas}</div>
              <div className="text-xs font-bold text-white">{item.s1} + {item.s2}</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-black text-green-400 uppercase">{item.h}</div>
              <div className="text-[10px] text-white/40">{item.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
        <h3 className="text-blue-400 font-black uppercase text-sm mb-2">Avantage du Handicap Asiatique</h3>
        <p className="text-xs text-white/70">Le handicap asiatique élimine la possibilité du nul et offre des marges plus basses chez les bookmakers Sharp. Si la cote 1X2 est trop courte (&lt; 1.40), passez au Handicap -0.5 ou -1.</p>
      </div>
    </div>
  );
}

function Chapter7() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">7.1 L'Ordre d'Analyse — Toujours le Même</h3>
        <div className="space-y-2">
          {[
            { e: 1, m: "1X2", c: "Force relative des deux équipes", a: "Double Chance + Handicap" },
            { e: 2, m: "Double Chance", c: "Confirmation de la sécurité du pari", a: "BTTS + Handicap outsider" },
            { e: 3, m: "Total (Over/Under)", c: "Volume attendu de buts", a: "BTTS + Handicap écart" },
            { e: 4, m: "BTTS", c: "Confirmation du potentiel offensif bilatéral", a: "Validation Over" },
            { e: 5, m: "Handicap", c: "Optimisation du rendement", a: "Pari final" },
          ].map((step) => (
            <div key={step.e} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-[10px] font-black text-white">{step.e}</div>
              <div className="flex-1">
                <div className="text-xs font-black text-white uppercase">{step.m}</div>
                <div className="text-[10px] text-white/40">{step.c}</div>
              </div>
              <div className="text-[10px] font-bold text-orange-500 uppercase italic">→ {step.a}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-3xl">
        <h3 className="text-red-400 font-black uppercase text-sm mb-2">7.2 La Règle Anti-Contradiction</h3>
        <p className="text-xs text-white/70 leading-relaxed">Si vos analyses de deux marchés se contredisent → <strong className="text-white">NE PAS PARIER</strong>. Exemple : 1X2 dit "domination forte de A" MAIS Total dit "0 + (UNDER)". Comment A peut-il dominer sans marquer ? Une contradiction est le signe que les données sont incomplètes.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">7.3 Tableau de Cohérence</h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-[10px]">
            <thead className="bg-white/10 text-white/40 font-black uppercase">
              <tr><th className="p-2">Signal 1</th><th className="p-2">Signal 2</th><th className="p-2">Action recommandée</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="p-2">1X2 : Victoire forte</td><td className="p-2">Total : OVER</td><td className="p-2 text-green-400">Domination + buts → Handicap -1</td></tr>
              <tr><td className="p-2">1X2 : Victoire forte</td><td className="p-2">Total : UNDER</td><td className="p-2 text-blue-400">Victoire serrée → Handicap -0.5</td></tr>
              <tr><td className="p-2">1X2 : Équilibré</td><td className="p-2">Total : OVER</td><td className="p-2 text-orange-400">Match ouvert → BTTS + Over 2.5</td></tr>
              <tr><td className="p-2">1X2 : Équilibré</td><td className="p-2">Total : UNDER</td><td className="p-2 text-white/60">Match tactique → Under + Handicap +0.5</td></tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Chapter8() {
  return (
    <div className="space-y-8">
      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
        <div className="text-[10px] font-black uppercase text-orange-500 mb-2">8.1 Le Critère de Kelly</div>
        <div className="text-xl font-black text-white mb-2">Kelly = (p × b - q) / b</div>
        <p className="text-[10px] text-white/60 italic">b = cote - 1 | p = proba victoire | q = 1 - p. Utilisez DEMI-KELLY (7%) pour réduire la volatilité.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">8.2 Niveaux de Mise</h3>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-white/10 text-white/40 font-black uppercase">
              <tr><th className="p-3">Situation</th><th className="p-3">Confiance</th><th className="p-3">Mise</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr><td className="p-3">1X2 : 4 pts ou Over : 4 +</td><td className="p-3 text-green-400 font-black">MAXIMALE</td><td className="p-3">2.5-3% bankroll</td></tr>
              <tr><td className="p-3">1X2 : 3 pts ou Over : 3 +</td><td className="p-3 text-blue-400 font-black">ÉLEVÉE</td><td className="p-3">1.5-2% bankroll</td></tr>
              <tr><td className="p-3">Double Chance forte ≥ 3 pts</td><td className="p-3 text-orange-400 font-black">BONNE</td><td className="p-3">1-1.5% bankroll</td></tr>
              <tr><td className="p-3">Score 2 ou signal mixte</td><td className="p-3 text-white/40 font-black">MODÉRÉE</td><td className="p-3">0.5-1% bankroll</td></tr>
              <tr className="bg-red-500/20 font-black"><td className="p-3">Contradiction ou 0-1 pt</td><td className="p-3">AUCUN EDGE</td><td className="p-3">0% — ne pariez pas</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">8.3 Structure des 3 Compartiments</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-xs font-black text-white uppercase mb-1">Capital Actif (60%)</div>
            <p className="text-[10px] text-white/60">Réparti chez vos bookmakers actifs. Capital de jeu quotidien.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-xs font-black text-white uppercase mb-1">Réserve Liquide (25%)</div>
            <p className="text-[10px] text-white/60">E-wallet (Skrill, Neteller). Rechargement rapide + surebets.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl">
            <div className="text-xs font-black text-white uppercase mb-1">Fonds de Sécurité (15%)</div>
            <p className="text-[10px] text-white/60">Intouché sauf série exceptionnelle de pertes (Black Swan).</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Chapter9() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">9.1 Routine Hebdomadaire</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { j: "LUNDI", f: "Review", a: "ROI, CLV, journal de bord. Identifier erreurs." },
            { j: "MARDI", f: "Scan cotes", a: "Premières lectures. Notation cotes référence." },
            { j: "MERCREDI", f: "Info", a: "Actualités ligues, effectifs, mouvements cotes." },
            { j: "JEUDI", f: "Analyse", a: "Appliquer le système 5 marchés. Scores confiance." },
            { j: "VENDREDI", f: "Placement", a: "Paris identifiés comme matures. Vérifier compos." },
            { j: "SAMEDI", f: "Match day", a: "Ajustements. Live si signal clair. Monitor." },
            { j: "DIMANCHE", f: "Bilan", a: "Clôture, journal, prospection semaine suivante." },
          ].map((day, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-[10px] font-black text-orange-500 w-16">{day.j}</div>
              <div className="flex-1">
                <div className="text-[10px] font-black text-white uppercase">{day.f}</div>
                <div className="text-[8px] text-white/40">{day.a}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-black uppercase text-orange-500">9.2 Plan d'Action en 4 Phases</h3>
        <div className="space-y-2">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-xs font-black text-white uppercase mb-1">PHASE 1 (Mois 1-2) : Apprentissage</div>
            <p className="text-[10px] text-white/60">Maîtrisez les Parties 1 à 7. Paris sur papier uniquement. Choisissez 2 ligues de spécialisation.</p>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-xs font-black text-white uppercase mb-1">PHASE 2 (Mois 3-4) : Test réel</div>
            <p className="text-[10px] text-white/60">Bankroll minimale (50-100€). Max 1% par pari. Objectif : CLV positif sur 50 paris.</p>
          </div>
        </div>
      </section>

      <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-3xl">
        <h3 className="text-blue-400 font-black uppercase text-sm mb-4">Stack d'Outils Recommandés</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["OddsPortal", "Pinnacle", "Transfermarkt", "FBref.com", "SofaScore", "Basketball-Ref", "Google Sheets"].map((tool, i) => (
            <div key={i} className="bg-black/40 p-2 rounded-lg text-center text-[10px] font-bold text-white/70">{tool}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Conclusion() {
  return (
    <div className="space-y-8">
      <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-3xl">
        <h3 className="text-orange-500 font-black uppercase text-sm mb-4">Récapitulatif Système en Un Coup d'Œil</h3>
        <div className="space-y-2">
          {[
            { m: "1X2", c: "4 critères → score", d: "3-4 pts = Victoire | 2 pts = DC" },
            { m: "DC", c: "4 critères → score", d: "≥ 3 = DC FORTE | 2 = BON PARI" },
            { m: "Over/Under", c: "4 tests +/-", d: "4 + = OVER FORT | 0-1 + = UNDER" },
            { m: "BTTS", c: "Total + DC croisés", d: "OVER + pas DC forte = OUI" },
            { m: "Handicap", c: "1X2 + Total croisés", d: "Optimisation du rendement" },
          ].map((item, i) => (
            <div key={i} className="flex justify-between p-3 bg-white/5 rounded-xl border border-white/5 text-[10px]">
              <span className="font-black text-white uppercase w-20">{item.m}</span>
              <span className="text-white/40 w-32">{item.c}</span>
              <span className="font-bold text-orange-500 text-right">{item.d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-6">
        <h3 className="text-xl font-black uppercase tracking-tighter text-center italic">🏆 LES 10 COMMANDEMENTS DU PARIEUR ANALYTIQUE</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            "Analyser toujours les 5 marchés dans l'ordre : 1X2 → DC → Total → BTTS → Handicap.",
            "Si deux marchés se contredisent → NE PAS PARIER. La contradiction est une information.",
            "Utiliser Pinnacle comme baromètre. Une cote Soft > Pinnacle = opportunité.",
            "Les Dropping Odds sont de l'information réelle. Investiguer avant tout pari.",
            "Le système +/- remplace tout calcul complexe. Lire, appliquer, décider.",
            "La forme DOMICILE et EXTÉRIEUR sont deux choses différentes. Toujours les séparer.",
            "Jamais plus de 3% de bankroll sur un pari. Demi-Kelly pour les mises calculées.",
            "Un pari sans score de confiance ≥ 2 est un pari émotionnel. Le refuser.",
            "Tenir le journal de bord. Mesurer le CLV chaque semaine. Le ROI vient après.",
            "Se spécialiser sur 2-3 ligues. L'avantage informationnel est votre seul vrai edge.",
          ].map((cmd, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="text-orange-500 font-black text-xs mt-0.5">{i+1}.</div>
              <p className="text-[10px] text-white/70 leading-relaxed">{cmd}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center p-6 bg-red-500/10 border border-red-500/20 rounded-3xl">
        <p className="text-[10px] text-red-400 font-bold italic">⚠️ Les paris sportifs comportent un risque de perte financière. Cette formation est éducative. Jouez responsablement.</p>
      </div>
    </div>
  );
}

function Quiz({ question, options, correctIndex, feedbackOk, feedbackKo }: { question: string, options: string[], correctIndex: number, feedbackOk: string, feedbackKo: string }) {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl space-y-4">
      <div className="text-xs font-black uppercase text-orange-500">Quiz</div>
      <p className="font-black text-white text-sm">{question}</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            onClick={() => selected === null && setSelected(i)}
            disabled={selected !== null}
            className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all border ${
              selected === null ? 'bg-white/5 border-white/10 hover:border-orange-500/50' :
              i === correctIndex ? 'bg-green-500/20 border-green-500 text-green-400' :
              selected === i ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 opacity-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {selected !== null && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-xl text-xs ${selected === correctIndex ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {selected === correctIndex ? feedbackOk : feedbackKo}
        </motion.div>
      )}
    </div>
  );
}

export function Course({ onClose }: CourseProps) {
  const [currentChapter, setCurrentChapter] = useState(0);
  const chapter = chapters[currentChapter];
  const progress = ((currentChapter + 1) / chapters.length) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl mx-auto"
    >
      <div className="bg-[#16191E] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-br from-orange-500 to-orange-600 p-8 flex flex-col justify-end">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 rounded-full transition-colors">
            <XCircle className="w-6 h-6 text-white" />
          </button>
          <div className="flex items-center gap-3 mb-2">
            <GraduationCap className="w-6 h-6 text-black" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">Académie des Pronostics</span>
          </div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">Formation Complète v2.0</h1>

          {/* Progress Bar */}
          <div className="absolute bottom-0 left-0 w-full h-1.5 bg-black/10">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-white" />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentChapter}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 block">{chapter.tag}</span>
                <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">{chapter.title}</h2>
                <p className="text-lg text-white/40 font-medium leading-relaxed italic border-l-2 border-orange-500/30 pl-6">{chapter.lead}</p>
              </div>

              <div className="pt-8 border-t border-white/5">
                {chapter.content}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-12 pt-8 border-t border-white/5 flex items-center justify-between">
            <button
              onClick={() => setCurrentChapter(prev => Math.max(0, prev - 1))}
              disabled={currentChapter === 0}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white disabled:opacity-0 transition-all"
            >
              <ChevronLeft className="w-4 h-4" /> Précédent
            </button>

            <div className="flex gap-1">
              {chapters.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentChapter ? 'bg-orange-500 w-4' : 'bg-white/10'}`} />
              ))}
            </div>

            <button
              onClick={() => currentChapter < chapters.length - 1 ? setCurrentChapter(prev => prev + 1) : onClose()}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 transition-all"
            >
              {currentChapter === chapters.length - 1 ? 'Terminer' : 'Suivant'} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
