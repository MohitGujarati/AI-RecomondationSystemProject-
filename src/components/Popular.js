import React, { Component } from 'react';

// Event Registry API constants
const EVENT_REGISTRY_URL = "https://eventregistry.org/api/v1/article/getArticles";
const EVENT_REGISTRY_API_KEY = process.env.REACT_APP_EVENT_REGISTRY_API_KEY || "AddYourKeyHere";

class Popular extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popularNews: [],
      isLoading: true,
      error: null,
    };
  }

  componentDidMount() {
    this.fetchPopularNews();
  }

  async fetchPopularNews() {
    // Event Registry payload
    const payload = {
      action: "getArticles",
      keyword: "",
      sourceLocationUri: [
        "http://en.wikipedia.org/wiki/United_States",
        "http://en.wikipedia.org/wiki/Canada",
        "http://en.wikipedia.org/wiki/United_Kingdom"
      ],
  
      ignoreSourceGroupUri: "paywall/paywalled_sources",
      articlesPage: 1,
      articlesCount: 20,
      articlesSortBy: "date",
      articlesSortByAsc: false,
      dataType: ["news", "pr"],
      forceMaxDataTimeWindow: 31,
      resultType: "articles",
      apiKey: EVENT_REGISTRY_API_KEY
    };

    try {
      this.setState({ isLoading: true, error: null });

      const response = await fetch(EVENT_REGISTRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      const articles = data?.articles?.results || [];

      this.setState({
        popularNews: articles,
        isLoading: false,
      });
    } catch (error) {
      console.error("Could not fetch Event Registry news:", error);
      this.setState({
        error: error.message,
        isLoading: false,
      });
    }
  }

  formatDate(dateString) {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Unknown date";
    }
  }

  renderArticleCard(article, index) {
    return (
      <a
        key={index}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={styles.newsItem}
      >
        {article.image && (
          <div style={styles.imageContainer}>
            <img  src={article.image || "https://via.placeholder.com/150"} alt={article.title} style={styles.newsImage} />
          </div>
        )}
        <div style={styles.contentWrapper}>
          <div>
            <span style={styles.categoryBadge}>
              {(article.source && article.source.title) || "Unknown Source"}
            </span>
          </div>

          <h3 style={styles.newsTitle}>{article.title}</h3>

          <div style={styles.newsFooter}>
            <span>{article.authors?.[0]?.name || "Unknown"}</span>
            <span>{this.formatDate(article.dateTime)}</span>
          </div>
        </div>
      </a>
    );
  }

  render() {
    const { popularNews, isLoading, error } = this.state;

    if (isLoading) return <div style={{ textAlign: "center", padding: "20px" }}><p>Loading news...</p></div>;
    if (error) return <div style={{ textAlign: "center", padding: "20px" }}><p>Error: {error}</p></div>;
    if (popularNews.length === 0) return <div style={{ textAlign: "center", padding: "20px" }}><p>No news found.</p></div>;

    return (
      <div style={styles.container}>
        <div>
          <h2>Trending News</h2>
          <p>Top headlines from Event Registry</p>
        </div>

        <div style={styles.newsList}>
          {popularNews.map((article, index) => this.renderArticleCard(article, index))}
        </div>

        <div>
          <a href="https://eventregistry.org/" target="_blank" rel="noopener noreferrer">
            Powered by Event Registry API
          </a>
        </div>
      </div>
    );
  }
}

// Styling
const styles = {
  container: {
    padding: "20px",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  newsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    margin: "20px 0",
  },
  newsItem: {
    width: "300px",
    height: "350px",
    border: "1px solid #ddd",
    borderRadius: "5px",
    padding: "10px",
    textDecoration: "none",
    color: "black",
    display: "flex",
    flexDirection: "column",
  },
  imageContainer: {
    width: "100%",
    height: "450px",
    marginBottom: "10px",
    overflow: "hidden",
    borderRadius: "3px",
  },
  newsImage: {
    width: "100%",
    height: "100%",
    objectFit: "fill",
  },
  contentWrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  categoryBadge: {
    backgroundColor: "#f0f0f0",
    padding: "3px 8px",
    borderRadius: "3px",
    fontSize: "12px",
    display: "inline-block",
    marginBottom: "10px",
  },
  newsTitle: {
    fontSize: "16px",
    fontWeight: "bold",
    margin: "10px 0",
  },
  newsFooter: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid #eee",
    paddingTop: "10px",
    marginTop: "10px",
    fontSize: "12px",
    color: "#666",
  },
};

export default Popular;
