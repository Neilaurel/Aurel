import { auth } from '../firebase.ts';
import axios from 'axios';
import { AnalysisResult, Bet, Bankroll } from '../types.ts';

// Get Bearer authorization header with Firebase ID token
async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
}

export async function syncHistoryToPostgres(result: AnalysisResult) {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.post('/api/history', {
      id: result.id,
      sport: result.sport,
      homeTeam: result.match.homeTeam,
      awayTeam: result.match.awayTeam,
      predictionData: result,
    }, config);
  } catch (err) {
    console.error('Error syncing history to Postgres:', err);
  }
}

export async function deleteHistoryFromPostgres(id: string) {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.delete(`/api/history/${id}`, config);
  } catch (err) {
    console.error('Error deleting history from Postgres:', err);
  }
}

export async function syncBetToPostgres(bet: Bet) {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.post('/api/bets', {
      id: bet.id,
      matchName: bet.matchName,
      sport: bet.sport,
      odds: bet.odd,
      stake: bet.stake,
      betType: bet.prediction,
      prediction: bet.prediction,
      status: bet.status,
    }, config);
  } catch (err) {
    console.error('Error syncing bet to Postgres:', err);
  }
}

export async function updateBetStatusInPostgres(betId: string, status: 'won' | 'lost' | 'pending') {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.put(`/api/bets/${betId}`, { status }, config);
  } catch (err) {
    console.error('Error updating bet status in Postgres:', err);
  }
}

export async function deleteBetFromPostgres(betId: string) {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.delete(`/api/bets/${betId}`, config);
  } catch (err) {
    console.error('Error deleting bet from Postgres:', err);
  }
}

export async function syncBankrollToPostgres(bankroll: Bankroll) {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.post('/api/bankroll', {
      initialBalance: bankroll.initialBalance,
      currentBalance: bankroll.balance,
      currency: bankroll.currency,
    }, config);
  } catch (err) {
    console.error('Error syncing bankroll to Postgres:', err);
  }
}

export async function syncLogsToPostgres(id: string, matchName: string, steps: any[]) {
  try {
    const config = await getAuthHeaders();
    if (!config.headers) return;

    await axios.post('/api/logs', {
      id,
      matchName,
      logContent: steps,
    }, config);
  } catch (err) {
    console.error('Error syncing logs to Postgres:', err);
  }
}
export type { AnalysisResult, Bet, Bankroll };
