from flask import Flask, jsonify, request
from flask_cors import CORS
# Import firestore components for saving data
from firebase_admin import firestore
import firebase_admin 
from typing import Dict, Any

# Try to import NewsRecommender; if missing gensim or anything else, fall back
try:
    from news_recommender import NewsRecommender
    _HAVE_RECOMMENDER = True
    # Assuming 'db' is initialized and exported in news_recommender.py's global scope
    from news_recommender import db 
except Exception as _e:
    print(f"[WARN] NewsRecommender unavailable ({_e}); serving SAMPLE_RECOMMENDATIONS only")
    _HAVE_RECOMMENDER = False
    db = None # Ensure db is None if initialization fails

app = Flask(__name__)
app.secret_key = "super_secret_key_123"
CORS(app)

SAMPLE_RECOMMENDATIONS = [
    {
        "id": 1,
        "title": "Sample AI News",
        "description": "This is a sample news article used as fallback.",
        "url": "#",
        "urlToImage": "https://via.placeholder.com/300x150?text=Sample",
        "source": "Sample Source",
        "publishedAt": "2025-10-09T00:00:00Z",
        "category": "Technology",
        "recommendation_score": 2.5
    },
    {
        "id": 2,
        "title": "Machine Learning Sample Article",
        "description": "This is another sample news article.",
        "url": "#",
        "urlToImage": "https://via.placeholder.com/300x150?text=Sample",
        "source": "Sample Source",
        "publishedAt": "2025-10-08T10:00:00Z",
        "category": "Science",
        "recommendation_score": 3.0
    }
]

# Helper function to save behavioral data
def save_behavioral_data(data: Dict[str, Any], collection_name: str, doc_key: str):
    """
    Saves structured article data into a user-specific subcollection for tracking.
    
    Collection Path: {collection_name}/{user_id}/{doc_key}/{article_id}
    """
    if db is None:
        print(f"[WARN] Database not connected. Cannot log to {collection_name}.")
        return False
    
    user_id = data.get("userId")
    article_id = data.get("articleId")
    
    if not user_id or not article_id:
        print(f"[ERROR] Missing userId or articleId for {collection_name} log.")
        return False

    try:
        # Create a document reference for the specific article read/liked by the user
        doc_ref = db.collection(collection_name).document(user_id).collection(doc_key).document(article_id)
        
        # Prepare the document data, removing keys not meant for storage like userId
        doc_data = {
            k: v for k, v in data.items() if k not in ['userId', 'articleId']
        }
        
        doc_ref.set(doc_data, merge=True)
        print(f"[INFO] Logged {doc_key} for user {user_id}: {data.get('title')[:30]}...")
        return True
    except Exception as e:
        print(f"[ERROR] Failed to save {collection_name} for user {user_id}: {e}")
        return False


@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    user_id = request.args.get("user_id")
    print(f"[INFO] Request received for user_id: {user_id}")
    
    try:
        if _HAVE_RECOMMENDER:
            # We instantiate the recommender with the user_id to load personalized data
            recommender = NewsRecommender(user_id=user_id)
            articles = recommender.recommend_articles(pages=3, num_recommendations=25)
            formatted = recommender.format_recommendations(articles)
            
            if not formatted:
                print("[WARN] No articles fetched, returning sample recommendations")
                return jsonify(SAMPLE_RECOMMENDATIONS)
            return jsonify(formatted)
        else:
            print("[INFO] Using SAMPLE_RECOMMENDATIONS (no recommender)")
            return jsonify(SAMPLE_RECOMMENDATIONS)
    except Exception as e:
        print(f"[ERROR] Exception in recommendations: {e}")
        return jsonify(SAMPLE_RECOMMENDATIONS)

@app.route("/api/log-like", methods=["POST"])
def log_like():
    data = request.get_json(silent=True) or {}
    
    # 1. Save to the 'user_liked' collection (Explicit positive feedback)
    save_behavioral_data(
        data=data, 
        collection_name='user_liked', 
        doc_key='likes' # Subcollection for user likes
    )
    
    # 2. ALSO save to 'user_history' (A like implies it was also read/viewed)
    save_behavioral_data(
        data=data, 
        collection_name='user_history', 
        doc_key='reads' # Subcollection for read history
    )

    # Log to console
    title = data.get("title", "Unknown")
    category = data.get("category", "General")
    print(f'LIKE clicked — Article: "{title}" | Category: {category}', flush=True)
    return jsonify({"ok": True})

@app.route("/api/log-history", methods=["POST"])
def log_history():
    data = request.get_json(silent=True) or {}
    
    # Save to the 'user_history' collection (Passive feedback)
    save_behavioral_data(
        data=data, 
        collection_name='user_history', 
        doc_key='reads' # Subcollection for read history
    )

    # Log to console
    title = data.get("title", "Unknown")
    print(f'HISTORY logged — Article: "{title}"', flush=True)
    return jsonify({"ok": True})


if __name__ == "__main__":
    print("Starting Flask server on http://localhost:5000")
    app.run(port=5000, debug=True)