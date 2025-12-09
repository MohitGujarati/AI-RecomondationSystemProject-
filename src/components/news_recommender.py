import json
import os
import requests
import numpy as np
import time
import sys
from datetime import datetime, timedelta
from typing import List, Dict

# Machine Learning Imports
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv

# Firebase Imports
import firebase_admin
from firebase_admin import credentials, firestore

# Configure standard output for UTF-8 (prevents emoji/text crashes)
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Load environment variables
load_dotenv()

FIREBASE_PROJECT_ID = "the-cognito-times"
SERVICE_ACCOUNT_KEY_FILE = "src/components/serviceAccountKey.json"
MAX_HISTORY_ITEMS = 15 

# --- Authentication Logic ---
try:
    if os.path.exists(SERVICE_ACCOUNT_KEY_FILE):
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_FILE)
        firebase_admin.initialize_app(cred, {'projectId': FIREBASE_PROJECT_ID})
        print(f"Firebase Admin SDK initialized using Service Account Key.")
    else:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {'projectId': FIREBASE_PROJECT_ID})
        print(f"Firebase Admin SDK initialized using ADC.")
    
    db = firestore.client()

except Exception as e:
    print(f"Warning: Firebase Admin SDK failed to initialize. Error: {e}")
    # Fallback to verify if app is already initialized
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        db = firestore.client()
    except Exception:
        print(f"FATAL: Could not get a Firestore client. Preference loading will fail.")
        db = None


class NewsRecommender:
    def __init__(self, user_id: str = None):
        self.api_key = os.getenv("EVENT_REGISTRY_API_KEY", "ADD_API_KEY")
        if not self.api_key:
            raise ValueError("Missing Event Registry API key")

        # Initialize SBERT model
        # Using all-MiniLM-L6-v2 as it balances speed and performance efficiently
        print(" Loading SBERT model (all-MiniLM-L6-v2)...")
        self.sbert_model = SentenceTransformer('all-MiniLM-L6-v2') 
        print(" SBERT model loaded successfully!\n")
        
        # 1. Load User Data into STRUCTURED format (Lists, not Strings)
        # This prevents the "token truncation" bug where old history cut off new history
        self.user_id = user_id
        if user_id:
            self.user_data = self._load_user_data(user_id)
        else:
            self.user_data = {"categories": ["General"], "likes": [], "history": []}
            print("Using default interests (no user ID provided).")
        
        # 2. Generate Weighted User Vector (The "Centroid" of their interest)
        self.user_embedding = self._generate_user_embedding()

        # Cache category embeddings for fast detection later
        self.category_profiles = self._get_category_profiles()
        self.category_embeddings = self.sbert_model.encode(list(self.category_profiles.values()))

    def _get_category_profiles(self) -> Dict[str, str]:
        """Returns the detailed mapping of category names to descriptions."""
        return {
            "Technology": "Artificial intelligence, machine learning, robotics, computer science, gadgets, software, internet, cybersecurity, and tech industry innovations.",
            "Business": "Markets, finance, startups, economic policies, investments, corporate strategies, entrepreneurship, and business news.",
            "Science": "Space exploration, research breakthroughs, biology, chemistry, physics, astronomy, and scientific discoveries.",
            "Health": "Medical research, healthcare innovations, fitness, nutrition, disease prevention, mental wellness, and public health.",
            "Politics": "Government, elections, international relations, policies, law, diplomacy, and political events.",
            "Sports": "Football, basketball, cricket, tennis, hockey, tournaments, athletes, scores, championships, leagues, youth sports, and competitive games.",
            "Entertainment": "Movies, TV shows, celebrities, music, theater, pop culture, streaming platforms, and entertainment industry.",
            "Environment": "Climate change, sustainability, renewable energy, wildlife conservation, environmental protection, and ecological issues.",
    
        }
    
    def _fetch_subcollection_list(self, user_id: str, collection_name: str, doc_key: str) -> List[Dict]:
        """Fetches list of dicts {'text': '...', 'timestamp': ...} to maintain separate items."""
        global db
        items = []
        if db is None: return items

        try:
            ref = db.collection(collection_name).document(user_id).collection(doc_key)
            # Fetch the most recent items
            query = ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(MAX_HISTORY_ITEMS)
            docs = query.stream()
            
            for doc in docs:
                data = doc.to_dict()
                title = data.get('title', '')
                summary = data.get('summary', '') 
                # Combine title + summary for better context
                text = f"{title}. {summary}"
                # Get timestamp or default to now
                ts = data.get('timestamp', datetime.now())
                items.append({'text': text, 'timestamp': ts})

            print(f"Fetched {len(items)} items from {collection_name}.")
            return items

        except Exception as e:
            print(f"Warning: Failed to fetch data from {collection_name} for user {user_id}: {e}")
            return []

    def _load_user_data(self, user_id: str):
        """Loads categories, likes, and history into structured lists."""
        data = {
            "categories": ["Technology", "Science", "General"], # Default
            "likes": [],
            "history": []
        }
        
        global db
        if db is None: return data

        try:
            # 1. Categories
            user_ref = db.collection('userPreferences').document(user_id)
            doc = user_ref.get()
            if doc.exists:
                loaded_cats = doc.to_dict().get('categories', [])
                if loaded_cats and isinstance(loaded_cats, list):
                    print(f"Successfully loaded categories: {loaded_cats}")
                    data["categories"] = loaded_cats
            
            # 2. Likes & History (Keep as lists, don't join yet)
            data["likes"] = self._fetch_subcollection_list(user_id, 'user_liked', 'likes')
            data["history"] = self._fetch_subcollection_list(user_id, 'user_history', 'reads')
            
        except Exception as e:
            print(f"CRITICAL ERROR in loading user data: {e}. Falling back to default data.")
        
        return data

    def _generate_user_embedding(self):
        """
        Generates a weighted average vector.
        Weights: Categories (20%), Likes (60%), History (20% with time decay).
        This fixes the issue where broad categories drowned out specific user likes.
        """
        profiles = self._get_category_profiles()
        
        # A. Encode Categories
        cat_texts = [profiles.get(cat, "") for cat in self.user_data["categories"]]
        if not cat_texts: cat_texts = ["General news and current events"]
        cat_embeddings = self.sbert_model.encode(cat_texts)
        # Average category embeddings
        avg_cat_emb = np.mean(cat_embeddings, axis=0)

        # B. Encode Likes (High Importance)
        if self.user_data["likes"]:
            texts = [item['text'] for item in self.user_data["likes"]]
            like_embeddings = self.sbert_model.encode(texts)
            avg_like_emb = np.mean(like_embeddings, axis=0)
        else:
            avg_like_emb = np.zeros_like(avg_cat_emb)

        # C. Encode History (With Time Decay)
        if self.user_data["history"]:
            texts = [item['text'] for item in self.user_data["history"]]
            hist_embs = self.sbert_model.encode(texts)
            
            # Apply Decay: 1.0 for now, decreasing for older items
            weighted_hist_embs = []
            total_weight = 0
            
            for i, item in enumerate(self.user_data["history"]):
                # Simple decay based on index (assuming sorted by recent)
                # 0th item (newest) gets weight 1.0, 10th item gets weight 0.5
                weight = 1.0 / (1.0 + (0.1 * i)) 
                weighted_hist_embs.append(hist_embs[i] * weight)
                total_weight += weight
            
            avg_hist_emb = np.sum(weighted_hist_embs, axis=0) / total_weight
        else:
            avg_hist_emb = np.zeros_like(avg_cat_emb)

        # D. Weighted Fusion
        # If we have likes/history, they should overpower generic categories
        has_behavior = len(self.user_data["likes"]) > 0 or len(self.user_data["history"]) > 0
        
        if has_behavior:
            # 20% Category, 60% Likes, 20% History
            final_emb = (0.2 * avg_cat_emb) + (0.6 * avg_like_emb) + (0.2 * avg_hist_emb)
        else:
            final_emb = avg_cat_emb

        print(" Generated Weighted User Embedding.")
        return final_emb

    # 1️⃣ Fetch articles
    def fetch_news_articles(self, page=1, count=100):
        url = "https://eventregistry.org/api/v1/article/getArticles"
        payload = {
            "action": "getArticles",
            "keyword": "",
            "sourceLocationUri": [
                "http://en.wikipedia.org/wiki/United_States",
                "http://en.wikipedia.org/wiki/Canada",
                "http://en.wikipedia.org/wiki/United_Kingdom",
            ],
            "ignoreSourceGroupUri": "paywall/paywalled_sources",
            "articlesPage": page,
            "articlesCount": count,
            "articlesSortBy": "date",
            "articlesSortByAsc": False,
            "dataType": ["news", "pr"],
            "forceMaxDataTimeWindow": 31,
            "resultType": "articles",
            "lang": ["eng"],
            "apiKey": self.api_key,
        }

        try:
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data.get("articles", {}).get("results", [])
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Failed to fetch articles: {e}")
            return []

    # 2️⃣ Clean + combine text
    def preprocess_article(self, article):
        title = article.get("title", "")
        body = article.get("body", "")
        return f"{title} {body}".strip()

    # 3️⃣ Fast Category Detection
    def detect_category_fast(self, article_emb):
        """Detects category using pre-computed embeddings (Faster than re-encoding)."""
        cats = list(self.category_profiles.keys())
        
        # Calculate similarity between article and all categories
        sims = cosine_similarity([article_emb], self.category_embeddings).flatten()
        best_idx = np.argmax(sims)
        
        # Threshold for "General" category
        if sims[best_idx] < 0.15:
            return "General"
        
        return cats[best_idx]

    # 4️⃣ Maximal Marginal Relevance (Diversity)
    def maximal_marginal_relevance(self, article_embeddings, user_embedding, diversity=0.3, top_n=25):
        """
        Applies MMR to diversify results.
        diversity: 0.0 (Pure Similarity) -> 1.0 (Pure Diversity)
        """
        # Calculate similarity to User (Relevance)
        user_sims = cosine_similarity([user_embedding], article_embeddings).flatten()
        
        selected_indices = []
        candidate_indices = list(range(len(article_embeddings)))
        
        # Iteratively select the best item that combines relevance and novelty
        for _ in range(min(top_n, len(article_embeddings))):
            best_mmr = -np.inf
            best_idx = -1
            
            for idx in candidate_indices:
                # Relevance score
                relevance = user_sims[idx]
                
                # Redundancy score (Similarity to already selected items)
                redundancy = 0
                if selected_indices:
                    candidate_vec = article_embeddings[idx].reshape(1, -1)
                    selected_vecs = article_embeddings[selected_indices]
                    # How similar is this candidate to the most similar item already picked?
                    sim_to_selected = cosine_similarity(candidate_vec, selected_vecs)
                    redundancy = np.max(sim_to_selected)
                
                # MMR Equation: Score = Relevance - (Penalty * Redundancy)
                mmr = (1 - diversity) * relevance - (diversity * redundancy)
                
                if mmr > best_mmr:
                    best_mmr = mmr
                    best_idx = idx
            
            if best_idx != -1:
                selected_indices.append(best_idx)
                candidate_indices.remove(best_idx)
                
        return selected_indices

    # 5️⃣ Recommend top news
    def recommend_articles(self, pages=2, num_recommendations=25):
        print("="*80)
        print(" "*20 + " SBERT + MMR NEWS RECOMMENDATION SYSTEM")
        print("="*80)
        
        print(f"\n Fetching articles from {pages} pages...")
        
        all_articles = []
        for page in range(1, pages + 1):
            print(f"   Fetching page {page}/{pages}...", end=" ")
            articles = self.fetch_news_articles(page=page)
            all_articles.extend(articles)
            print(f" ({len(articles)} articles)")

        if not all_articles:
            print("[WARN] No articles fetched.")
            return []

        print(f"\n Total articles fetched: {len(all_articles)}")

        # Deduplicate by title
        seen_titles, unique_articles = set(), []
        for a in all_articles:
            t = a.get("title", "")
            if t and t not in seen_titles:
                seen_titles.add(t)
                unique_articles.append(a)

        print(f" Unique articles after deduplication: {len(unique_articles)}\n")

        # Preprocess all articles
        all_texts = [self.preprocess_article(a) for a in unique_articles]
        
        # Encode Articles (SBERT)
        print(f" Encoding {len(unique_articles)} articles...")
        start_time = time.time()
        article_embeddings = self.sbert_model.encode(all_texts, batch_size=32, show_progress_bar=True)
        print(f" Encoding completed in {time.time() - start_time:.2f}s\n")

        # Detect categories using optimized method
        print("  Detecting categories...")
        for i, article in enumerate(unique_articles):
            article["category"] = self.detect_category_fast(article_embeddings[i])
        print(f" All categories detected!\n")

        # Apply MMR Ranking (Relevance + Diversity)
        print(" Calculating MMR Ranking (Relevance + Diversity)...")
        # Diversity=0.3 means we sacrifice a little relevance to ensure we don't show 20 duplicates
        selected_indices = self.maximal_marginal_relevance(
            article_embeddings, 
            self.user_embedding, 
            diversity=0.3, 
            top_n=num_recommendations
        )
        
        final_recommendations = [unique_articles[i] for i in selected_indices]
        
        # Add visual scores for the frontend
        for i, idx in enumerate(selected_indices):
            # We calculate pure similarity just for the display label (0.0 - 1.0)
            score = cosine_similarity([self.user_embedding], [article_embeddings[idx]])[0][0]
            final_recommendations[i]["recommendation_score"] = float(score)
        
        return final_recommendations

    # 6️⃣ Format recommendations
    def format_recommendations(self, recommendations, filename="public/recommendations.json"):
        formatted = []
        for i, art in enumerate(recommendations, 1):
            image_url = art.get("image") or "https://via.placeholder.com/150"
            formatted.append({
                "id": i,
                "title": art.get("title", "No title"),
                "description": art.get("body", "")[:250] or "No description available",
                "url": art.get("url", ""),
                "urlToImage": image_url,
                "source": art.get("source", {}).get("title", "Unknown Source"),
                "publishedAt": art.get("dateTime", ""),
                "author": art.get("authors", [{}])[0].get("name") if art.get("authors") else None,
                "category": art.get("category", "General"),
                "recommendation_score": round(art.get("recommendation_score", 0), 2),
            })

        self.save_json(formatted, filename=filename)
        return formatted

    # 7️⃣ Save JSON
    def save_json(self, new_data, filename="public/recommendations.json"):
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
        print(f"Saved {len(new_data)} recommendations to {filename}\n")


def main():
    try:
        # NOTE: In the Flask app, this user_id comes dynamically from the URL.
        # Use a placeholder UID here for direct execution testing.
        TEST_USER_ID = "qX8Po1YdODXJVIZWyyo5wYGeMW2" 
        
        recommender = NewsRecommender(user_id=TEST_USER_ID) 
        articles = recommender.recommend_articles(pages=3, num_recommendations=25)
        formatted = recommender.format_recommendations(articles, filename="public/recommendations.json")
        
        print("="*80)
        print(" "*25 + " PROCESS COMPLETED SUCCESSFULLY!")
        print("="*80)
        
    except Exception as e:
        print(f"\n ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()




  