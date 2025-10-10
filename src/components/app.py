from flask import Flask, jsonify
from flask_cors import CORS
from news_recommender import NewsRecommender

app = Flask(__name__)
app.secret_key = "super_secret_key_123"  # simple fixed key
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

@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    try:
        recommender = NewsRecommender()
        articles = recommender.recommend_articles(pages=3, num_recommendations=25)
        formatted = recommender.format_recommendations(articles)

        if not formatted:
            print("[WARN] No articles fetched, returning sample recommendations")
            return jsonify(SAMPLE_RECOMMENDATIONS)

        return jsonify(formatted)

    except Exception as e:
        print(f"[ERROR] Exception in recommendations: {e}")
        return jsonify(SAMPLE_RECOMMENDATIONS)

if __name__ == "__main__":
    print("Starting Flask server on http://localhost:5000")
    app.run(port=5000, debug=True)
