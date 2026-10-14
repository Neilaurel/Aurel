import pandas as pd
import numpy as np
from scipy.stats import poisson, nbinom
import re
from google import genai
from google.colab import userdata

# --- CONFIGURATION DU MOTEUR SMARTPICK V4.2 (HIGH PRECISION) ---
# Ce script est conçu pour être exécuté dans Google Colab ou en local.

MODEL_ID = "gemini-2.0-flash-lite-preview-02-05"
api_key = userdata.get('GOOGLE_API_KEY')
client = genai.Client(api_key=api_key)

def get_negbin_pmf(k, mu, var):
    """
    Calcule la probabilité P(X=k) pour une loi Binomiale Négative.
    r = mu^2 / (var - mu)
    p = r / (r + mu)
    """
    if var <= mu:
        return poisson.pmf(k, mu)
    r = mu**2 / (var - mu)
    p = r / (r + mu)
    return nbinom.pmf(k, r, p)

def apply_dixon_coles_correction(matrix, lambda_h, lambda_a, rho=-0.10):
    if lambda_h < 1.5 and lambda_a < 1.5:
        matrix[0, 0] *= (1 - lambda_h * lambda_a * rho)
        matrix[1, 1] *= (1 - rho)
        matrix[0, 1] *= (1 + lambda_a * rho)
        matrix[1, 0] *= (1 + lambda_h * rho)
    return matrix

def get_smart_prediction_live(home_team, away_team, league_name, bookmaker_odds=None):
    """
    MOTEUR DE PRÉDICTION V4.2
    - Weighted Historical Scores (Alpha=0.8).
    - Dispersion Detection (Poisson vs NegBin).
    - Dixon-Coles Adjustment.
    """

    # 1. Requête de Grounding optimisée pour les 6 derniers matchs
    prompt = f"""
    Search for the last 6 match results for {home_team} (Home) and {away_team} (Away) in {league_name}.
    Provide the scores in chronological order (most recent first).
    Also provide the current league standings (Rank, Points, Played).
    """

    try:
        response = client.models.generate_content(
            model=MODEL_ID,
            contents=prompt,
            config={"tools": [{"google_search": {}}], "temperature": 0.0}
        )

        # Extraction simulée pour l'exemple (Dans Colab, l'IA remplit ces données)
        # Ici on définit les poids normalisés pour 6 matchs (Alpha=0.8)
        weights = np.array([0.356, 0.285, 0.228, 0.182, 0.146, 0.117])
        weights /= weights.sum()

        # --- LOGIQUE DE CALCUL IDENTIQUE À L'APP ---
        # (Ces données devraient être extraites du grounding)
        # Pour l'exemple, on utilise des placeholders
        h_scores = np.array([2, 1, 3, 0, 1, 2]) # Buts marqués
        h_conceded = np.array([1, 0, 1, 2, 0, 1]) # Buts encaissés
        a_scores = np.array([1, 2, 1, 1, 0, 2])
        a_conceded = np.array([2, 1, 0, 1, 3, 1])

        # Lambdas pondérés
        l_h_att = np.sum(h_scores * weights)
        l_h_def = np.sum(h_conceded * weights)
        l_a_att = np.sum(a_scores * weights)
        l_a_def = np.sum(a_conceded * weights)

        # Variances
        var_h = np.sum(weights * (h_scores - l_h_att)**2)
        var_a = np.sum(weights * (a_scores - l_a_att)**2)

        # Modèles
        model_h = "NegBin" if var_h > 1.1 * l_h_att else "Poisson"
        model_a = "NegBin" if var_a > 1.1 * l_a_att else "Poisson"

        # Lambdas Finaux (65/35)
        lambda_h = (l_h_att * 0.65) + (l_a_def * 0.35)
        lambda_a = (l_a_att * 0.65) + (l_h_def * 0.35)

        # Matrice
        matrix = np.zeros((9, 9))
        for i in range(9):
            for j in range(9):
                p_h = get_negbin_pmf(i, lambda_h, var_h) if model_h == "NegBin" else poisson.pmf(i, lambda_h)
                p_a = get_negbin_pmf(j, lambda_a, var_a) if model_a == "NegBin" else poisson.pmf(j, lambda_a)
                matrix[i, j] = p_h * p_a

        matrix = apply_dixon_coles_correction(matrix, lambda_h, lambda_a)
        matrix /= matrix.sum()

        # Marchés
        p_1 = np.sum(np.tril(matrix, -1))
        p_x = np.sum(np.diag(matrix))
        p_2 = np.sum(np.triu(matrix, 1))
        p_over25 = 1 - np.sum([matrix[i,j] for i in range(9) for j in range(9) if i+j <= 2.5])

        idx = np.unravel_index(np.argmax(matrix), matrix.shape)

        return {
            'match': f'{home_team} vs {away_team}',
            'lambda_h': round(lambda_h, 3),
            'lambda_a': round(lambda_a, 3),
            'model_h': model_h,
            'model_a': model_a,
            'prob_1': f"{round(p_1*100, 2)}%",
            'prob_X': f"{round(p_x*100, 2)}%",
            'prob_2': f"{round(p_2*100, 2)}%",
            'over_2_5': f"{round(p_over25*100, 2)}%",
            'score_probable': f"{idx[0]}-{idx[1]}",
            'engine': 'V4.2 HIGH PRECISION'
        }

    except Exception as e:
        return f"Erreur : {str(e)}"

# --- GESTIONNAIRE DE BASE D'ENTRAÎNEMENT ---
import os
from datetime import datetime

class TrainingDatabaseManager:
    def __init__(self, file_path='smartpick_master_training_db.csv'):
        self.file_path = file_path
        self.columns = [
            'Date_Analyse', 'Match', 'Ligue',
            'Lambda_H', 'Lambda_A',
            'Prob_1', 'Prob_X', 'Prob_2', 'Over_25', 'BTTS',
            'Score_Probable', 'Prob_Score_Probable',
            'Score_Reel', 'Resultat_Final_1X2'
        ]
        self._initialize_db()

    def _initialize_db(self):
        if not os.path.exists(self.file_path):
            df = pd.DataFrame(columns=self.columns)
            df.to_csv(self.file_path, index=False, encoding='utf-8-sig')

    def add_predictions(self, df_preds):
        """
        Ajoute de nouvelles prédictions à la base en évitant les doublons sur le nom du Match.
        """
        current_db = pd.read_csv(self.file_path)

        # Préparation des nouvelles données
        new_data = df_preds.copy()
        if 'Date_Analyse' not in new_data.columns:
            new_data['Date_Analyse'] = datetime.now().strftime('%Y-%m-%d')

        # Renommage pour correspondre à la structure de la DB si nécessaire
        column_map = {
            '1 (%)': 'Prob_1', 'X (%)': 'Prob_X', '2 (%)': 'Prob_2',
            'Over 2.5 (%)': 'Over_25', 'BTTS (%)': 'BTTS',
            'prob_1': 'Prob_1', 'prob_X': 'Prob_X', 'prob_2': 'Prob_2',
            'over_2_5': 'Over_25', 'match': 'Match', 'btts': 'BTTS',
            'lambda_h': 'Lambda_H', 'lambda_a': 'Lambda_A', 'ligue': 'Ligue',
            'score_probable': 'Score_Probable', 'prob_score_probable': 'Prob_Score_Probable',
            'Score_Probable': 'Score_Probable', 'Prob_Score_Probable (%)': 'Prob_Score_Probable'
        }
        new_data = new_data.rename(columns=column_map)

        # Nettoyage des pourcentages si présents (string to float)
        for col in ['Prob_1', 'Prob_X', 'Prob_2', 'Over_25', 'BTTS', 'Prob_Score_Probable']:
            if col in new_data.columns:
                new_data[col] = new_data[col].apply(lambda x: float(str(x).replace('%', '')) if isinstance(x, str) else x)

        # Fusion et suppression des doublons (on garde la version la plus récente du match)
        updated_db = pd.concat([current_db, new_data], ignore_index=True)
        updated_db = updated_db.drop_duplicates(subset=['Match'], keep='last')

        # Sauvegarde
        updated_db.to_csv(self.file_path, index=False, encoding='utf-8-sig')
        print(f'✅ Base mise à jour : {len(updated_db)} matchs uniques en stock.')
        return updated_db

    def get_download_link(self):
        try:
            from google.colab import files
            files.download(self.file_path)
        except ImportError:
            print(f"Export local : Le fichier est disponible à l'emplacement : {os.path.abspath(self.file_path)}")

# Initialisation du gestionnaire
db_manager = TrainingDatabaseManager()

print('Moteur de base de données d\'entraînement activé.')

# --- EXEMPLE D'UTILISATION ---
# if __name__ == "__main__":
#     prediction = get_smart_prediction_live('Liverpool', 'Fulham', 'Premier League')
#     if isinstance(prediction, dict):
#         df_test = pd.DataFrame([prediction])
#         db_manager.add_predictions(df_test)
#     print(prediction)
