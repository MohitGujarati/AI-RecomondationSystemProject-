import React, { Component } from 'react';
import styled from 'styled-components';

// Event Registry API constants
const EVENT_REGISTRY_URL = "https://eventregistry.org/api/v1/article/getArticles";
const EVENT_REGISTRY_API_KEY = process.env.REACT_APP_EVENT_REGISTRY_API_KEY || "ADD_YOUR_API";

/* === Like Button component — visuals unchanged so heart turns red === */
const Btn_like = ({ id }) => {
  return (
    <StyledWrapper>
      <div className="like-wrapper">
        <input className="check" type="checkbox" id={id} />
        <label className="container" htmlFor={id}>
          <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="icon inactive">
            <path d="M225.8 468.2l-2.5-2.3L48.1 303.2C17.4 274.7 0 234.7 0 192.8v-3.3c0-70.4 50-130.8 119.2-144C158.6 37.9 198.9 47 231 69.6c9 6.4 17.4 13.8 25 22.3c4.2-4.8 8.7-9.2 13.5-13.3c3.7-3.2 7.5-6.2 11.5-9c0 0 0 0 0 0C313.1 47 353.4 37.9 392.8 45.4C462 58.6 512 119.1 512 189.5v3.3c0 41.9-17.4 81.9-48.1 110.4L288.7 465.9l-2.5 2.3c-8.2 7.6-19 11.9-30.2 11.9s-22-4.2-30.2-11.9zM239.1 145c-.4-.3-.7-.7-1-1.1l-17.8-20c0 0-.1-.1-.1-.1c0 0 0 0 0 0c-23.1-25.9-58-37.7-92-31.2C81.6 101.5 48 142.1 48 189.5v3.3c0 28.5 11.9 55.8 32.8 75.2L256 430.7 431.2 268c20.9-19.4 32.8-46.7 32.8-75.2v-3.3c0-47.3-33.6-88-80.1-96.9c-34-6.5-69 5.4-92 31.2c0 0 0 0-.1 .1s0 0-.1 .1l-17.8 20c-.3 .4-.7 .7-1 1.1c-4.5 4.5-10.6 7-16.9 7s-12.4-2.5-16.9-7z" />
          </svg>
          <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" className="icon active">
            <path d="M47.6 300.4L228.3 469.1c7.5 7 17.4 10.9 27.7 10.9s20.2-3.9 27.7-10.9L464.4 300.4c30.4-28.3 47.6-68 47.6-109.5v-5.8c0-69.9-50.5-129.5-119.4-141C347 36.5 300.6 51.4 268 84L256 96 244 84c-32.6-32.6-79-47.5-124.6-39.9C50.5 55.6 0 115.2 0 185.1v5.8c0 41.5 17.2 81.2 47.6 109.5z" />
          </svg>
          <div className="checkmark" />
          <span className="like-text">Like</span>
        </label>
      </div>
    </StyledWrapper>
  );
};


/* === Original Popular class component (structure preserved) === */
class Popular extends Component {
  constructor(props) {
    super(props);
    this.state = {
      popularNews: [],
      isLoading: true,
      error: null,
      hoveredIndex: null
    };
  }

  componentDidMount() {
    this.fetchPopularNews();
    // OPTIONAL: Add listener here to log read history if you want to track history automatically
    // window.addEventListener('scroll', this.logReadHistory); 
  }

  async fetchPopularNews() {
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
      articlesIncludeConcepts: true,
      includeArticleCategories: true,
      articlesSortBy: "date",
      articlesSortByAsc: false,
      dataType: ["news", "pr"],
      forceMaxDataTimeWindow: 31,
      resultType: "articles",
      lang: ["eng"],
      apiKey: EVENT_REGISTRY_API_KEY
    };

    try {
      this.setState({ isLoading: true, error: null });
      const response = await fetch(EVENT_REGISTRY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`Error: ${response.status}`);
      const data = await response.json();
      const articles = data?.articles?.results?.map(a => ({
        ...a,
        categories: a.categories?.map(c => c.label) || []
      })) || [];
      this.setState({ popularNews: articles, isLoading: false });
    } catch (error) {
      console.error("Could not fetch Event Registry news:", error);
      this.setState({ error: error.message, isLoading: false });
    }
  }

  formatDate(dateString) {
    try { return new Date(dateString).toLocaleDateString(); }
    catch { return "Unknown date"; }
  }

  getPrimaryCategory(article) {
    const cats = article?.categories;
    if (!cats || cats.length === 0) {
      const c = article?.concepts?.[0];
      return c?.label?.eng || c?.label || "General";
    }
    if (typeof cats[0] === 'string') return cats[0];
    const top = cats.reduce((p, c) => (c?.score > (p?.score ?? -Infinity) ? c : p), cats[0]);
    return top?.label?.eng || top?.label || "General";
  }

  // --- UPDATED: Send full article data and User ID ---
  handleLikeClick(article, index, e) {
    e.stopPropagation();

    const userData = JSON.parse(localStorage.getItem('user'));
    const userId = userData?.uid;

    if (!userId) {
      console.warn("Cannot log like: User not authenticated.");
      return;
    }

    // Prepare the structured data to be saved in Firestore
    const dataToSend = {
      userId: userId,
      articleId: article.uri, // Use the unique article URI as ID
      title: article.title,
      url: article.url,
      summary: article.body.substring(0, 500), // Save a partial body for the profile
      category: this.getPrimaryCategory(article),
      source: article.source.title,
      timestamp: new Date().toISOString()
    };

    fetch("http://127.0.0.1:5000/api/log-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSend)
    }).catch((err) => {
      console.error("log-like failed:", err);
    });
  }
  // --- END UPDATED handleLikeClick ---

  // Render a single article card
  renderArticleCard(article, index) {
    const isHovered = this.state.hoveredIndex === index;
    const cardStyle = isHovered ? { ...styles.newsItem, ...styles.newsItemHover } : styles.newsItem;

    const isGif = article.image && article.image.toLowerCase().endsWith('.gif');
    const hasImage = !!article.image;
    const likePositionStyle = isGif ? { bottom: '36px', right: '8px' } : {};

    return (
      <a
        key={index}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={cardStyle}
        onMouseEnter={() => this.setState({ hoveredIndex: index })}
        onMouseLeave={() => this.setState({ hoveredIndex: null })}
        // --- ADD HISTORY LOGGING HERE (Passive tracking on click) ---
        onClick={() => this.logReadHistory(article)}
      // --- END HISTORY LOGGING ---
      >
        {/* Image banner area */}
        <div style={styles.imageContainer}>
          {hasImage ? (
            <>
              <img src={article.image} alt={article.title} style={styles.newsImage} />
              {isGif && <div style={styles.gifBadge}>GIF</div>}
            </>
          ) : (
            <div style={styles.noImagePlaceholder}>Image Not Provided</div>
          )}

          {/* ✅ Like button in lower-right of banner image */}
          <div
            style={{ ...styles.likeButtonWrap, ...likePositionStyle }}
            onClick={(e) => this.handleLikeClick(article, index, e)}
            aria-label="Like this article"
            title="Like"
          >
            <Btn_like id={`like-${index}`} />
          </div>
        </div>

        <div style={styles.contentWrapper}>
          <div>
            <span style={styles.categoryBadge}>
              {(article.source && article.source.title) || "Unknown Source"}
            </span>
          </div>

          <h3 style={styles.newsTitle}>{article.title}</h3>

          <p style={styles.newsDescription}>{article.body}</p>

          {article.categories && article.categories.length > 0 && (
            <p style={{ fontStyle: "italic", color: "#666", marginTop: "5px" }}>
              Categories: {this.getPrimaryCategory(article)}
            </p>
          )}

          <p style={styles.newsDescription}>{article.body}</p>

          <div style={styles.newsFooter}>
            <span>{article.authors?.[0]?.name || "Unknown"}</span>
            <span>{this.formatDate(article.dateTime)}</span>
          </div>
        </div>
      </a>
    );
  }

  // --- NEW: Passive Logging of Read History (on card click) ---
  logReadHistory(article) {
    const userData = JSON.parse(localStorage.getItem('user'));
    const userId = userData?.uid;

    if (!userId) return;

    const historyData = {
      userId: userId,
      articleId: article.uri,
      title: article.title,
      summary: article.body.substring(0, 500),
      timestamp: new Date().toISOString()
    };

    // Send to a separate endpoint optimized for history logging
    fetch("http://127.0.0.1:5000/api/log-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(historyData)
    }).catch((err) => {
      console.error("log-history failed:", err);
    });
  }
  // --- END NEW logReadHistory ---


  render() {
    const { popularNews, isLoading, error } = this.state;
    if (isLoading) return <div style={{ textAlign: "center", padding: "20px" }}><p>Loading news...</p></div>;
    if (error) return <div style={{ textAlign: "center", padding: "20px" }}><p>Error: {error}</p></div>;
    if (popularNews.length === 0) return <div style={{ textAlign: "center", padding: "20px" }}><p>No news found.</p></div>;

    return (
      <div style={styles.container}>
        <div><h2>Trending News</h2></div>
        <div style={styles.newsList}>
          {popularNews.map((article, index) => this.renderArticleCard(article, index))}
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
    padding: "20px",
    justifyContent: "center",
    borderRadius: "8px",
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    margin: "20px 0",
  },
  newsItem: {
    width: "300px",
    height: "400px",
    backgroundColor: 'rgba(243, 241, 241, 0.45)',
    boxShadow: '0 1px 10px rgba(0,0,0,0.10)',
    backdropFilter: 'blur(12px) saturate(180%)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: "10px",
    textDecoration: "none",
    color: "black",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: 'all 0.2s ease-in-out',
  },
  newsItemHover: {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingBottom: '56.25%', // 16:9
    borderRadius: '5px',
    marginBottom: '10px',
    overflow: 'hidden',
    height: "100%",
  },
  gifBadge: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    zIndex: 1,
  },
  likeButtonWrap: {
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    zIndex: 2, // above image and GIF badge
  },
  newsImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
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
  noImagePlaceholder: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e0e0e0',
    color: '#888',
    fontSize: '14px',
    textAlign: 'center',
    height: '100%',
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: '5px',
    padding: '10px',
  },
  newsDescription: {
    fontSize: "14px",
    color: "#555",
    lineHeight: 1.4,
    flexGrow: 1,
    overflow: "hidden",
    flex: 1,
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    textOverflow: 'ellipsis',
    marginBottom: "10px",
  },
  newsTitle: {
    lineHeight: 1.5,
    fontSize: "16px",
    fontWeight: "bold",
    margin: "10px 0",
    height: 'calc(1.2em * 2 + 5px)',
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    display: "-webkit-box",
    overflow: "hidden",
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
const StyledWrapper = styled.div`
  .like-wrapper {
    --gap: 0.5em;
    --radius: 0.35em;
    display: flex;
    align-items: center;
    text-align: center;
    justify-content: center;
    --dot-bg: #212121;
    --dot-color: #313131;
    --dot-size: 1px;
    --dot-space: 22px;
    background: linear-gradient(
          90deg,
          var(--dot-bg) calc(var(--dot-space) - var(--dot-size)),
          transparent 1%
        )
        center / var(--dot-space) var(--dot-space),
      linear-gradient(
          var(--dot-bg) calc(var(--dot-space) - var(--dot-size)),
          transparent 1%
        )
        center / var(--dot-space) var(--dot-space),
      var(--dot-color);
    border: 0.1em solid #313131;
    padding: 0.5em;
    border-radius: var(--radius);
    box-shadow: 0 0 1em 0.5em rgba(0, 0, 0, 0.1);
    cursor: pointer;
  }

  .check[type="checkbox"] { display: none; }

  .container {
    display: flex;
    align-items: center;
    cursor: pointer;
    margin-top: -0.25em;
    margin-bottom: -0.25em;
  }

  .icon {
    width: 1.5em;
    height: 1.5em;
    margin-left: 0.5em;
    fill: white;
    transition: opacity 0.3s ease-in-out;
  }

  .icon.active { display: none; fill: #f52121; }
  .check[type="checkbox"]:checked + .container .icon.active {
    display: inline-block; animation: wiggle 0.5s ease-in-out;
  }
  .check[type="checkbox"]:checked + .container .icon.inactive { display: none; }

  .like-text {
    margin-left: 0.5em; padding: 0.5em; color: white;
    font-family: Arial, sans-serif; font-weight: bolder;
  }

  @keyframes wiggle {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    50% { transform: rotate(10deg); }
    75% { transform: rotate(-10deg); }
  }`;
export default Popular;