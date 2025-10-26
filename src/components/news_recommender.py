import json
import os
import requests
import numpy as np
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Load environment variables
load_dotenv()


class NewsRecommender:
    def __init__(self):
      
        self.api_key = os.getenv("EVENT_REGISTRY_API_KEY", "Add_Your_API_Key_Here")
        if not self.api_key:
            raise ValueError("Missing Event Registry API key")

        # User interests (customize this set for personalization)
        self.user_interests = [
            "sporrts","cricket","football","tennis",
        ]

    # 1️⃣ Fetch articles from Event Registry
    def fetch_news_articles(self, page=1, count=100):
        url = "https://eventregistry.org/api/v1/article/getArticles"
        payload = {
            "action": "getArticles",
            "keyword": "",
            "sourceLocationUri": [
                "http://en.wikipedia.org/wiki/United_States",
                "http://en.wikipedia.org/wiki/Canada",
                "http://en.wikipedia.org/wiki/United_Kingdom"
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
            "apiKey": self.api_key
        }

        try:
            response = requests.post(url, json=payload, timeout=15)
            response.raise_for_status()
            data = response.json()
            return data.get("articles", {}).get("results", [])
        except requests.exceptions.RequestException as e:
            print(f"[ERROR] Failed to fetch articles: {e}")
            return []

    # 2️⃣ Clean + combine article text
    def preprocess_article(self, article):
        title = article.get("title", "")
        body = article.get("body", "")
        return f"{title} {body}".lower()

    # 3️⃣ Score articles using TF-IDF + cosine similarity to user interests
    def calculate_interest_score(self, all_texts):
        # Combine user interests into one "document"
        user_profile = " ".join(self.user_interests)
        documents = all_texts + [user_profile]
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(documents)
        # Compute cosine similarity of each article to user interests
        similarity_scores = cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1]).flatten()
        return similarity_scores

    # 4️⃣ Detect article category


    def detect_category(self, text):
        """
        Determine the best-fit category for an article using TF-IDF similarity
        between the article text and predefined category profiles.
        """
        # Define category profile documents (more descriptive than just keywords)
        category_profiles = {
            "Technology": "tech ai software robotics digital computer innovation programming internet",
            "Business": "business market stock company finance startup investment economy corporate trading",
            "Science": "science research space discovery experiment physics chemistry biology innovation",
            "Health": "health medical doctor disease wellness fitness healthcare hospital treatment",
            "Politics": "government policy election democracy president parliament law minister",
            "Sports": "sports game tournament player team match cricket football tennis",
            "Entertainment": "movie music celebrity show film artist tv entertainment theater performance"
        }

        # Build corpus: all category docs + this article text
        categories = list(category_profiles.keys())
        docs = list(category_profiles.values()) + [text]

        # Fit TF-IDF on both categories and article together
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(docs)

        # Compute cosine similarity between article and each category profile
        article_vec = tfidf_matrix[-1:]  # last vector = article
        category_vecs = tfidf_matrix[:-1]
        similarities = cosine_similarity(article_vec, category_vecs).flatten()

        # Pick category with highest similarity
        best_index = similarities.argmax()
        best_category = categories[best_index]

        # Optional: thresholding to label "General" if all scores are too low
        if similarities[best_index] < 0.1:
            return "General"

        return best_category


    # 5️⃣ Recommend top news
    def recommend_articles(self, pages=2, num_recommendations=25):
        all_articles = []
        for page in range(1, pages + 1):
            articles = self.fetch_news_articles(page=page)
            all_articles.extend(articles)

        if not all_articles:
            print("[WARN] No articles fetched.")
            return []

        # Deduplicate by title
        seen_titles, unique_articles = set(), []
        for a in all_articles:
            t = a.get("title", "")
            if t and t not in seen_titles:
                seen_titles.add(t)
                unique_articles.append(a)

        # Preprocess all articles
        all_texts = [self.preprocess_article(a) for a in unique_articles]
        scores = self.calculate_interest_score(all_texts)

        # Assign scores and detect categories
        for article, score in zip(unique_articles, scores):
            article["recommendation_score"] = float(score)
            article["category"] = self.detect_category(self.preprocess_article(article))

        # Sort by recommendation score
        unique_articles.sort(key=lambda x: x["recommendation_score"], reverse=True)
        return unique_articles[:num_recommendations]

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
                "recommendation_score": round(art.get("recommendation_score", 2), 2)
            })
            # DEBUG: print_recommendations_to_terminal called!
            print("DEBUG: print_recommendations_to_terminal called!")  # ADD THIS LINE
            print("\n" + "="*80)
            print(f"RECOMMENDATIONS SHOWN TO USER ({""}):")
            print("="*80)
            for i, article in enumerate(recommendations, 1):
                print(f"{i}. {article['title']}")
                print(f"   Score: {article['recommendation_score']} | Category: {article['category']}")
                print(f"   Source: {article['source']}")
                print("-"*80)
            print(f"Total: {len(recommendations)} articles")
            print("="*80 + "\n")
            
            self.save_json(formatted, filename=filename)

        return formatted

  
    # 6️⃣ Save only latest recommendations (NO MERGING)
    def save_json(self, new_data, filename="public/recommendations.json"):
        """Save only the latest recommendations (no merging)"""
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        
        # Simply overwrite with new data - keep only latest recommendations
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
            
        print(f"[SUCCESS] Saved {len(new_data)} latest recommendations to {filename}")
        
        
   
       

def main():
    recommender = NewsRecommender()
    articles = recommender.recommend_articles(pages=3, num_recommendations=25)
#   formatted = recommender.format_recommendations(articles)
    formatted = recommender.format_recommendations(articles, new_data=articles)

    recommender.save_json(formatted)


if __name__ == "__main__":
    main()