from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
import pandas as pd

# ======================
# User interest dataset
# ======================
users = {
    "u1": {"interests": ["technology", "technology", "technology", "technology",
                         "ai", "machine learning"]},
    "u2": {"interests": ["politics", "economy", "government", "government",
                         "government", "government", "government", "government"]},
    "u3": {"interests": ["sports", "football", "cricket", "cricket", "cricket",
                         "cricket", "cricket", "cricket"]},
}

# Training articles
articles = [
    {"id": 1, "title": "AI is transforming healthcare with new tools"},
    {"id": 2, "title": "Government announces new economic policies"},
    {"id": 3, "title": "Football world cup: teams prepare for qualifiers"},
    {"id": 4, "title": "Breakthrough in machine learning research"},
    {"id": 5, "title": "Stock market reacts to political changes"},
]

# ======================
# Build training dataset
# ======================
rows = []
for user, data in users.items():
    profile = " ".join(data["interests"])
    for article in articles:
        text = article["title"]
        label = int(any(kw.lower() in text.lower() for kw in data["interests"]))
        rows.append([user, profile, text, label])

df = pd.DataFrame(rows, columns=["user", "profile", "article", "label"])

# ======================
# Train model
# ======================
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(df["profile"] + " " + df["article"])
y = df["label"]

model = LogisticRegression()
model.fit(X, y)

# ======================
# New Articles
# ======================
new_articles = [ 
    "Deep learning improves computer vision",
    "Cricket championship begins next week",
    "New government reforms announced today",
    "Cricket championship begins next week",
    "New government reforms announced today",
    "Technology technology in sports cricket goverment ai machine learning economy politics football ",
]

# ======================
# Recommendations
# ======================
TOP_K = 2  # top N recommendations per user

for user, data in users.items():
    profile = " ".join(data["interests"])
    X_new = vectorizer.transform([profile + " " + art for art in new_articles])
    probs = model.predict_proba(X_new)[:, 1]

    # sort articles by probability (descending)
    ranked = sorted(zip(new_articles, probs), key=lambda x: x[1], reverse=True)

    print(f"\nRecommendations for {user}:")
    for i, (art, prob) in enumerate(ranked):
        mark = "👍" if i < TOP_K else "👎"  # only top-K are liked
        print(f"   {mark} {art} (score={prob:.2f})")
