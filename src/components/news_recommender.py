import json
import os
import requests
import numpy as np
from dotenv import load_dotenv
from sklearn.feature_extraction.text import TfidfVectorizer, CountVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from gensim.models import Word2Vec
import nltk
from nltk.tokenize import word_tokenize

# Ensure NLTK tokenizer data is available
nltk.download('punkt', quiet=True)

# Load environment variables
load_dotenv()


class NewsRecommender:
    def __init__(self):
        self.api_key = os.getenv("EVENT_REGISTRY_API_KEY", "ADD_YOUR_API_KEY_HERE")
        if not self.api_key:
            raise ValueError("Missing Event Registry API key")

        # User interests
        self.user_interests = [
            "artificial intelligence",
            "machine learning",
            "technology trends",
            "startup funding",
            "space exploration",
            "health innovations",
            "climate change",
            "financial markets",
            "political developments",
        ]

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
        return f"{title} {body}".lower()

    # ---- TF-IDF ----
    def calculate_tfidf_score(self, all_texts):
        user_profile = " ".join(self.user_interests)
        documents = all_texts + [user_profile]
        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(documents)
        return cosine_similarity(tfidf_matrix[-1:], tfidf_matrix[:-1]).flatten()

    # ---- Bag of Words ----
    def calculate_bow_score(self, all_texts):
        user_profile = " ".join(self.user_interests)
        documents = all_texts + [user_profile]
        vectorizer = CountVectorizer(stop_words='english')
        bow_matrix = vectorizer.fit_transform(documents)
        return cosine_similarity(bow_matrix[-1:], bow_matrix[:-1]).flatten()

    # ---- N-grams ----
    def calculate_ngram_score(self, all_texts, n=2):
        user_profile = " ".join(self.user_interests)
        documents = all_texts + [user_profile]
        vectorizer = TfidfVectorizer(ngram_range=(1, n), stop_words='english')
        ngram_matrix = vectorizer.fit_transform(documents)
        return cosine_similarity(ngram_matrix[-1:], ngram_matrix[:-1]).flatten()

    # ---- Word2Vec ----
    def calculate_word2vec_score(self, all_texts, vector_size=100, window=5, min_count=2):
        user_profile = " ".join(self.user_interests)
        tokenized_docs = [word_tokenize(doc.lower()) for doc in all_texts + [user_profile]]
        model = Word2Vec(sentences=tokenized_docs, vector_size=vector_size, window=window, min_count=min_count)

        def doc_vector(tokens):
            vectors = [model.wv[word] for word in tokens if word in model.wv]
            return np.mean(vectors, axis=0) if vectors else np.zeros(vector_size)

        doc_vectors = [doc_vector(tokens) for tokens in tokenized_docs]
        article_vectors, user_vector = doc_vectors[:-1], doc_vectors[-1]
        return cosine_similarity([user_vector], article_vectors).flatten()

    # ---- Combined hybrid score ----
    def combined_interest_score(self, all_texts):
        tfidf_scores = self.calculate_tfidf_score(all_texts)
        bow_scores = self.calculate_bow_score(all_texts)
        ngram_scores = self.calculate_ngram_score(all_texts)
        w2v_scores = self.calculate_word2vec_score(all_texts)

        # Normalize to 0–1
        def normalize(arr):
            return (arr - np.min(arr)) / (np.ptp(arr) + 1e-9)

        tfidf_n = normalize(tfidf_scores)
        bow_n = normalize(bow_scores)
        ngram_n = normalize(ngram_scores)
        w2v_n = normalize(w2v_scores)

        # Weighted fusion of lexical + contextual + semantic scores
        final_score = (
            0.35 * tfidf_n +
            0.20 * bow_n +
            0.25 * ngram_n +
            0.20 * w2v_n
        )

        return final_score

    def detect_category(self, text):
        """
        Determine the best-fit category for an article using a hybrid
        (TF-IDF + N-gram + Word2Vec) similarity model.
        """

        category_profiles = {
            "Technology": (
                "Artificial intelligence, machine learning, robotics, computer science, "
                "gadgets, software, internet, and tech industry news."
            ),
            "Business": (
                "Markets, finance, startups, economic policies, investments, "
                "corporate strategies, and entrepreneurship."
            ),
            "Science": (
                "Space exploration, research breakthroughs, biology, chemistry, "
                "physics, and scientific discoveries."
            ),
            "Health": (
                "Medical research, healthcare innovations, fitness, nutrition, "
                "disease prevention, and mental well-being."
            ),
            "Politics": (
                "Government, elections, international relations, policies, "
                "law, diplomacy, and political events."
            ),
            "Sports": (
                "Football, cricket, tennis, tournaments, player performances, "
                "scores, championships, and leagues."
            ),
            "Entertainment": (
                "Movies, TV shows, celebrities, music, theater, pop culture, "
                "and streaming platforms."
            ),
            "Environment": (
                "Climate change, sustainability, renewable energy, wildlife, "
                "and environmental conservation."
            ),
        }

        categories = list(category_profiles.keys())
        texts = list(category_profiles.values())
        docs = texts + [text]
        user_index = len(docs) - 1

        # ---- TF-IDF similarity ----
        tfidf_vec = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf_vec.fit_transform(docs)
        tfidf_sim = cosine_similarity(tfidf_matrix[user_index:user_index+1], tfidf_matrix[:-1]).flatten()

        # ---- N-gram similarity ----
        ngram_vec = TfidfVectorizer(ngram_range=(1, 2), stop_words='english')
        ngram_matrix = ngram_vec.fit_transform(docs)
        ngram_sim = cosine_similarity(ngram_matrix[user_index:user_index+1], ngram_matrix[:-1]).flatten()

        # ---- Word2Vec similarity ----
        tokenized_docs = [word_tokenize(doc.lower()) for doc in docs]
        w2v_model = Word2Vec(sentences=tokenized_docs, vector_size=100, window=5, min_count=1)
        def doc_vector(tokens):
            vectors = [w2v_model.wv[word] for word in tokens if word in w2v_model.wv]
            return np.mean(vectors, axis=0) if vectors else np.zeros(100)
        category_vecs = np.array([doc_vector(tokens) for tokens in tokenized_docs[:-1]])
        article_vec = doc_vector(tokenized_docs[-1])
        w2v_sim = cosine_similarity([article_vec], category_vecs).flatten()

        # ---- Normalize and combine ----
        def normalize(arr):
            return (arr - np.min(arr)) / (np.ptp(arr) + 1e-9)
        tfidf_n = normalize(tfidf_sim)
        ngram_n = normalize(ngram_sim)
        w2v_n = normalize(w2v_sim)

        combined = 0.4 * tfidf_n + 0.3 * ngram_n + 0.3 * w2v_n
        best_index = np.argmax(combined)

        if combined[best_index] < 0.2:
            return "General"

        return categories[best_index]

        category_profiles = {
            "Technology": "tech ai software robotics digital computer innovation programming internet",
            "Business": "business market stock company finance startup investment economy corporate trading",
            "Science": "science research space discovery experiment physics chemistry biology innovation",
            "Health": "health medical doctor disease wellness fitness healthcare hospital treatment",
            "Politics": "government policy election democracy president parliament law minister",
            "Sports": "sports game tournament player team match cricket football tennis",
            "Entertainment": "movie music celebrity show film artist tv entertainment theater performance",
        }

        categories = list(category_profiles.keys())
        docs = list(category_profiles.values()) + [text]

        vectorizer = TfidfVectorizer(stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(docs)
        article_vec = tfidf_matrix[-1:]
        category_vecs = tfidf_matrix[:-1]
        similarities = cosine_similarity(article_vec, category_vecs).flatten()

        best_index = similarities.argmax()
        if similarities[best_index] < 0.1:
            return "General"
        return categories[best_index]

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

        all_texts = [self.preprocess_article(a) for a in unique_articles]
        scores = self.combined_interest_score(all_texts)

        for article, score in zip(unique_articles, scores):
            article["recommendation_score"] = float(score)
            article["category"] = self.detect_category(self.preprocess_article(article))

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
                "recommendation_score": round(art.get("recommendation_score", 2), 2),
            })

        print("\n" + "=" * 80)
        print("RECOMMENDATIONS SHOWN TO USER:")
        print("=" * 80)
        for i, article in enumerate(recommendations, 1):
            print(f"{i}. {article['title']}")
            print(f"   Score: {article['recommendation_score']} | Category: {article['category']}")
            print(f"   Source: {article['source']}")
            print("-" * 80)
        print(f"Total: {len(recommendations)} articles")
        print("=" * 80 + "\n")

        self.save_json(formatted, filename=filename)
        return formatted

    # 6️⃣ Save JSON
    def save_json(self, new_data, filename="public/recommendations.json"):
        os.makedirs(os.path.dirname(filename), exist_ok=True)
        with open(filename, "w", encoding="utf-8") as f:
            json.dump(new_data, f, indent=2, ensure_ascii=False)
        print(f"[SUCCESS] Saved {len(new_data)} latest recommendations to {filename}")


def main():
    recommender = NewsRecommender()
    articles = recommender.recommend_articles(pages=3, num_recommendations=25)
    formatted = recommender.format_recommendations(articles, filename="public/recommendations.json")
    recommender.save_json(formatted)


if __name__ == "__main__":
    main()
