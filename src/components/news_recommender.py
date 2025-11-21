import json
import os
import requests
import numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import time
import sys
import firebase_admin
from firebase_admin import credentials, firestore
from typing import List, Dict

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')


# Load environment variables
load_dotenv()


FIREBASE_PROJECT_ID = "the-cognito-times"
# Define the path to your service account key file
SERVICE_ACCOUNT_KEY_FILE = "src/components/serviceAccountKey.json"

# Set a limit for how many historical documents to use for the profile
MAX_HISTORY_ITEMS = 15 

# --- Authentication Logic  ---
try:
    if os.path.exists(SERVICE_ACCOUNT_KEY_FILE):
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_FILE)
        firebase_admin.initialize_app(cred, {
            'projectId': FIREBASE_PROJECT_ID,
        })
        print(f"Firebase Admin SDK initialized using Service Account Key.")
    else:
        cred = credentials.ApplicationDefault()
        firebase_admin.initialize_app(cred, {
            'projectId': FIREBASE_PROJECT_ID,
        })
        print(f"Firebase Admin SDK initialized using ADC.")

    db = firestore.client()

except Exception as e:
    print(f"Warning: Firebase Admin SDK failed to initialize. Ensure your key file is present or ADC is configured. Error: {e}")
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app()
        db = firestore.client()
    except Exception:
        print(f"FATAL: Could not get a Firestore client. Preference loading will fail.")
        db = None


class NewsRecommender:
    def __init__(self, user_id: str = None):
        self.api_key = os.getenv("EVENT_REGISTRY_API_KEY", "ADD_YOUR_API_KEY_HERE")
        if not self.api_key:
            raise ValueError("Missing Event Registry API key")

        # Initialize SBERT model
        print(" Loading SBERT model (all-MiniLM-L6-v2)...")
        self.sbert_model = SentenceTransformer('all-MiniLM-L6-v2') 
        print(" SBERT model loaded successfully!\n")
        
        # 1. Load all user data (categories, likes, and history)
        if user_id:
            (self.raw_categories, 
             self.liked_text, 
             self.history_text) = self._load_user_interests_and_behavior(user_id)
        else:
            self.raw_categories = self._get_default_interests()
            self.liked_text = ""
            self.history_text = ""
            print("Using default interests (no user ID provided).")
        
        # 2. Generate the rich profile for SBERT scoring using ALL available data
        self.user_profile_text = self._generate_rich_user_profile(
            self.raw_categories, 
            self.liked_text,
            self.history_text
        )

        
    def _get_category_profiles(self) -> Dict[str, str]:
        """Returns the detailed mapping of category names to descriptions."""
        return {
            "Technology": (
                "Artificial intelligence, machine learning, robotics, computer science, "
                "gadgets, software, internet, cybersecurity, and tech industry innovations."
            ),
            "Business": (
                "Markets, finance, startups, economic policies, investments, "
                "corporate strategies, entrepreneurship, and business news."
            ),
            "Science": (
                "Space exploration, research breakthroughs, biology, chemistry, "
                "physics, astronomy, and scientific discoveries."
            ),
            "Health": (
                "Medical research, healthcare innovations, fitness, nutrition, "
                "disease prevention, mental wellness, and public health."
            ),
            "Politics": (
                "Government, elections, international relations, policies, "
                "law, diplomacy, and political events."
            ),
            "Sports": (
                "Football, cricket, tennis, tournaments, player performances, "
                "scores, championships, leagues, and athletic events."
            ),
            "Entertainment": (
                "Movies, TV shows, celebrities, music, theater, pop culture, "
                "streaming platforms, and entertainment industry."
            ),
            "Environment": (
                "Climate change, sustainability, renewable energy, wildlife conservation, "
                "environmental protection, and ecological issues."
            ),
        }
    
    def _fetch_subcollection_data(self, user_id: str, collection_name: str, doc_key: str) -> str:
        """Helper to fetch article titles/summaries from a user subcollection."""
        global db
        combined_text = []

        if db is None: return ""

        try:
            # Query the user's subcollection (e.g., user_liked/{user_id}/likes)
            ref = db.collection(collection_name).document(user_id).collection(doc_key)
            
            # Fetch the most recent items
            query = ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(MAX_HISTORY_ITEMS)
            docs = query.stream()
            
            for doc in docs:
                data = doc.to_dict()
                title = data.get('title', '')
                summary = data.get('summary', '') 
                # Weight liked/viewed items by including both title and summary
                combined_text.append(f"{title}. {summary}")

            print(f"Fetched {len(combined_text)} items from {collection_name}.")
            return " ".join(combined_text)

        except Exception as e:
            print(f"Warning: Failed to fetch data from {collection_name} for user {user_id}: {e}")
            return ""


    def _generate_rich_user_profile(self, selected_categories: List[str], liked_text: str, history_text: str) -> str:
        """Combines detailed category descriptions and all behavioral text into one rich profile string."""
        profiles = self._get_category_profiles()
        
        # 1. Get descriptive text from selected categories (e.g., Technology description)
        descriptive_text = " ".join(
            profiles.get(cat, "") for cat in selected_categories
        )
        
        # 2. Combine descriptive text with behavioral data. LIKES are the strongest signal.
        # Ensure all components are present to avoid crash.
        
        # NOTE: We repeat the liked text once to give it slightly more weight than history.
        rich_profile = f"{descriptive_text.strip()} {liked_text.strip()} {liked_text.strip()} {history_text.strip()}"
        
        if not rich_profile.strip():
            # Safety fallback if all data sources are empty
            return "artificial intelligence, machine learning, technology trends, general news."
            
        print(f"Generated Hybrid Profile using categories, likes, and history.")
        return rich_profile
            
    def _get_default_interests(self) -> List[str]:
            """Hardcoded default interests for fallback (Category Names)."""
            return ["Technology", "Science", "General"]

    def _load_user_interests_and_behavior(self, user_id: str) -> (List[str], str, str):
        """
        Fetches categories, liked article text, and history article text from Firestore.
        Returns: (List[category_names], liked_text, history_text)
        """
        global db 
        categories = self._get_default_interests()
        liked_text = ""
        history_text = ""
        
        try:
            if db is None:
                print("Database client is not available. Using defaults for interests.")
                return categories, liked_text, history_text

            # --- Fetch 1. Categories (userPreferences) ---
            user_ref = db.collection('userPreferences').document(user_id)
            doc_snapshot = user_ref.get()

            if doc_snapshot.exists:
                data = doc_snapshot.to_dict()
                loaded_cats = data.get('categories', [])
                if loaded_cats and isinstance(loaded_cats, list) and len(loaded_cats) > 0:
                    print(f"Successfully loaded categories: {loaded_cats}")
                    categories = loaded_cats
            
            # --- Fetch 2. Liked Articles (user_liked/likes) ---
            liked_text = self._fetch_subcollection_data(user_id, 'user_liked', 'likes')

            # --- Fetch 3. Watch History (user_history/reads) ---
            history_text = self._fetch_subcollection_data(user_id, 'user_history', 'reads')

        except Exception as e:
            print(f"CRITICAL ERROR in loading user data: {e}. Falling back to default data.")

        return categories, liked_text, history_text

        

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

    # 3️⃣ SBERT Scoring Method
    def calculate_sbert_score(self, all_texts):
        """
        Calculate semantic similarity using SBERT embeddings.
        Returns normalized scores between 0 and 1.
        """
        # --- USE THE RICH PROFILE TEXT ---
        user_profile = self.user_profile_text
        
        # Encode all texts + user profile
        print(f" Encoding {len(all_texts)} articles with SBERT...")
        start_time = time.time()
        
        embeddings = self.sbert_model.encode(
            all_texts + [user_profile], 
            show_progress_bar=True,
            batch_size=32
        )
        
        elapsed = time.time() - start_time
        print(f" Encoding completed in {elapsed:.2f}s\n")
        
        # Calculate cosine similarity
        article_embeddings = embeddings[:-1]
        profile_embedding = embeddings[-1:]
        
        scores = cosine_similarity(profile_embedding, article_embeddings).flatten()
        
        # Normalize to 0-1 range
        min_score = np.min(scores)
        max_score = np.max(scores)
        if max_score - min_score > 1e-9:
            normalized_scores = (scores - min_score) / (max_score - min_score)
        else:
            normalized_scores = np.ones_like(scores)
        
        return normalized_scores

    # 4️⃣ Detect category using SBERT
    def detect_category(self, text):
        """
        Determine the best-fit category for an article using SBERT semantic similarity.
        """
        # Get the category profiles directly from the helper method
        category_profiles = self._get_category_profiles()

        categories = list(category_profiles.keys())
        category_descriptions = list(category_profiles.values())
        
        # Encode category descriptions and article text
        embeddings = self.sbert_model.encode(
            category_descriptions + [text],
            show_progress_bar=False
        )
        
        category_embeddings = embeddings[:-1]
        article_embedding = embeddings[-1:]
        
        # Calculate similarities
        similarities = cosine_similarity(article_embedding, category_embeddings).flatten()
        
        best_index = np.argmax(similarities)
        
        # Threshold for "General" category
        if similarities[best_index] < 0.15:
            return "General"
        
        return categories[best_index]

    # 5️⃣ Recommend top news
    def recommend_articles(self, pages=2, num_recommendations=25):
        print("="*80)
        print(" "*20 + " SBERT NEWS RECOMMENDATION SYSTEM")
        print("="*80)
        
        # Report the profile used for calculation
        print(f"[INFO] Profile being used (first 100 chars): {self.user_profile_text[:100]}...")

        print(f"\n Fetching articles from {pages} pages...")
        
        all_articles = []
        for page in range(1, pages + 1):
            print(f"   Fetching page {page}/{pages}...", end=" ")
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
        
        # Calculate SBERT scores
        scores = self.calculate_sbert_score(all_texts)

        # Assign scores and detect categories
        print("  Detecting categories...")
        for i, (article, score) in enumerate(zip(unique_articles, scores), 1):
            article["recommendation_score"] = float(score)
            article["category"] = self.detect_category(self.preprocess_article(article))
            if i % 20 == 0:
                print(f"   Processed {i}/{len(unique_articles)} articles...")
        
        print(f" All categories detected!\n")

        # Sort by score
        unique_articles.sort(key=lambda x: x["recommendation_score"], reverse=True)
        
        return unique_articles[:num_recommendations]

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

        print("="*80)
        print(" "*25 + " TOP RECOMMENDATIONS")
        print("="*80)
        for i, article in enumerate(recommendations[:10], 1):
            score = article['recommendation_score']
            print(f"\n🏆 RANK {i}: {article['title'][:65]}...")
            print(f"    Score: {score:.4f} | Category: {article['category']} | Source: {article.get('source', {}).get('title', 'Unknown')}")
        
        print("\n" + "="*80)
        print(f" Total recommendations: {len(recommendations)}")
        print("="*80 + "\n")

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