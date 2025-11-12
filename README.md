# 📰 AI News Recommender

A React and Flask project that fetches news from **Event Registry** and scores articles using a powerful, hybrid NLP model for personalized recommendations.

The hybrid model combines classic and modern techniques: **TF-IDF**, **Bag-of-Words (BoW)**, **N-gram**, and **Word2Vec**.

---

## 🔗 Project Links

| Resource | Link |
| :--- | :--- |
| **Event Registry API** | [https://newsapi.ai/dashboard?tab=home](https://newsapi.ai/dashboard?tab=home) |

---

## 🚀 Installation & Setup

### 1. 🔑 API Key Configuration

The application requires an API key from **Event Registry** to fetch news.

1.  Create an account and find your API key on the [Event Registry dashboard](https://newsapi.ai/dashboard?tab=home). The key will be visible at the bottom of the home page.
2.  Add your API key (as a string) to the following two files:
    * `popular.js` (React Frontend)
    * `news_recommender.py` (Python Backend)
  


### 2. 📦 Data Import

Ensure all provided project data (including the optional zip file contents) is imported and in the correct location before proceeding.

### 3. 🖥️ Frontend Dependencies (React)

Navigate to the React frontend directory and install the necessary packages:

```bash
npm install react react-dom react-icons
npm install styled-components


# Flask and Networking
pip install flask
pip install flask-cors # To allow cross-origin requests
pip install requests

# NLP and Data Processing
pip install numpy
pip install scikit-learn # For TF-IDF, CountVectorizer, cosine similarity
pip install gensim # For Word2Vec models
pip install nltk # For tokenization and NLP preprocessing

import nltk
nltk.download('punkt')
