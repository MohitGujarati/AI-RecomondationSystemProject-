import React, { useState, useEffect } from "react";
import { HiRefresh } from 'react-icons/hi';

function Recommendations({ reload }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch recommendations from Flask backend
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("recommendations.json");
      //const res = await fetch("http://localhost:5000/api/recommendations");
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();

      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to fetch recommendations. Please try again later."
      );
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  const TotalRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      //const res = await fetch("recommendations.json");
      const res = await fetch("http://localhost:5000/api/recommendations");
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();

      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to fetch recommendations. Please try again later."
      );
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };




  // Fetch recommendations when component mounts or reload prop changes
  useEffect(() => {
    fetchRecommendations();
  }, [reload]);

  // Format published date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours} hours ago`;
      return date.toLocaleDateString();
    } catch (e) {
      return "Unknown date";
    }
  };

  // Helper to group articles by category
  const groupByCategory = (articles) => {
    return articles.reduce((acc, article) => {
      const category = article.category || "General";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(article);
      return acc;
    }, {});
  };

  if (loading) {
    return (
      <StyledWrapper>
        <div className="dot-spinner">
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
          <div className="dot-spinner__dot"></div>
        </div>
      </StyledWrapper>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          ⚠️ {error}
          <button
            onClick={fetchRecommendations}
            style={{ marginLeft: "10px", padding: "5px 10px", cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        No recommendations available at the moment.
      </div>
    );
  }

  const categorizedArticles = groupByCategory(recommendations);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.headerTitle}>Recommended News</h2>
          <p style={styles.headerSubtitle}>Curated stories based on your interests</p>
        </div>
        <button
          className="button"
          onClick={TotalRefresh}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <HiRefresh size={20} />
          <span style={{ marginLeft: '8px' }}>Refresh</span>
        </button>
      </div>

      {Object.keys(categorizedArticles).map((category) => (
        <div key={category} style={styles.categorySection}>
          <h3 style={styles.categoryTitle}>{category}</h3>
          <div style={styles.newsList}>
            {categorizedArticles[category].map((article) => (
              <a
                key={article.id}
                href={article.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                style={styles.newsItem}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
              >
                <div style={styles.imageContainer}>
                  <img
                    src={
                      article.urlToImage ||
                      `https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(
                        article.category
                      )}`
                    }
                    alt={article.title}
                    style={styles.newsImage}
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/300x200/667eea/ffffff?text=${encodeURIComponent(
                        article.category
                      )}`;
                    }}
                  />
                  <div style={styles.imageOverlay}>
                    <span style={styles.categoryBadge}>{article.category}</span>
                  </div>
                </div>

                <div style={styles.contentSection}>
                  <div style={styles.metaRow}>
                    {article.recommendation_score && (
                      <div style={styles.metaBadgeContainer}>
                        <span style={styles.scoreBadge}>
                          ⭐ {(article.recommendation_score * 100).toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <h3 style={styles.newsTitle}>{article.title}</h3>
                  <p style={styles.newsDescription}>{article.description}</p>

                  <div style={styles.newsFooter}>
                    <span style={styles.source}>{article.source || article.author || "Unknown"}</span>
                    <span style={styles.date}>{formatDate(article.publishedAt)}</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "100%",
    fontFamily: "Arial, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "10px",
    borderBottom: "1px solid #eee",
  },
  headerTitle: {
    fontSize: "2rem",
    color: "#1a202c",
    margin: 0,
  },
  headerSubtitle: {
    fontSize: "1rem",
    color: "#718096",
    margin: "5px 0 0 0",
  },
  categorySection: {
    marginBottom: "40px",
  },
  categoryTitle: {
    fontSize: "1.5rem",
    color: "#2d3748",
    marginBottom: "20px",
    borderLeft: "4px solid #3182ce",
    paddingLeft: "10px",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "15px",
  },
  newsList: {
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    justifyContent: "flex-start", // Changed from center to align items nicely
  },
  newsItem: {
    width: "300px",
    height: "420px", // Slightly increased height
    backgroundColor: "white",
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderRadius: '12px',
    padding: "15px",
    textDecoration: "none",
    color: "black",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    border: '1px solid rgba(0,0,0,0.05)',
  },
  imageContainer: {
    width: "100%",
    height: "160px",
    marginBottom: "15px",
    overflow: "hidden",
    borderRadius: "8px",
    position: "relative",
  },
  newsImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imageOverlay: {
    position: "absolute",
    bottom: "8px",
    left: "8px",
  },
  contentSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  },
  metaRow: {
    marginBottom: "8px",
    display: "flex",
    alignItems: "center",
  },
  metaBadgeContainer: {
    display: "flex",
    gap: "8px",
  },
  scoreBadge: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "bold",
  },
  categoryBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    color: "#1e293b",
    fontWeight: 600,
    padding: "4px 10px",
    borderRadius: "12px",
    fontSize: "10px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },
  newsTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "18px",
    fontWeight: "bold",
    margin: "0 0 10px 0",
    lineHeight: 1.4,
    color: "#1a202c",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  newsDescription: {
    fontSize: "14px",
    color: "#4a5568",
    lineHeight: 1.5,
    flexGrow: 1,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
    marginBottom: "15px",
  },
  newsFooter: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid #edf2f7",
    paddingTop: "12px",
    marginTop: "auto",
    fontSize: "12px",
    color: "#718096",
  },
  source: {
    fontWeight: 600,
    color: "#2d3748",
  },
  date: {
    fontStyle: "italic",
  },
};

// StyledWrapper is a small React component that injects the loader CSS
// and renders its children. This replaces the broken constant CSS string.
const StyledWrapper = ({ children }) => (
  <>
    <style>{`
      /* From Uiverse.io by abrahamcalsin */ 
.dot-spinner {
  --uib-size: 2.8rem;
  --uib-speed: .9s;
  --uib-color: #183153;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: var(--uib-size);
  width: var(--uib-size);
}

.dot-spinner__dot {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 100%;
  width: 100%;
}

.dot-spinner__dot::before {
  content: '';
  height: 20%;
  width: 20%;
  border-radius: 50%;
  background-color: var(--uib-color);
  transform: scale(0);
  opacity: 0.5;
  animation: pulse0112 calc(var(--uib-speed) * 1.111) ease-in-out infinite;
  box-shadow: 0 0 20px rgba(18, 31, 53, 0.3);
}

.dot-spinner__dot:nth-child(2) {
  transform: rotate(45deg);
}

.dot-spinner__dot:nth-child(2)::before {
  animation-delay: calc(var(--uib-speed) * -0.875);
}

.dot-spinner__dot:nth-child(3) {
  transform: rotate(90deg);
}

.dot-spinner__dot:nth-child(3)::before {
  animation-delay: calc(var(--uib-speed) * -0.75);
}

.dot-spinner__dot:nth-child(4) {
  transform: rotate(135deg);
}

.dot-spinner__dot:nth-child(4)::before {
  animation-delay: calc(var(--uib-speed) * -0.625);
}

.dot-spinner__dot:nth-child(5) {
  transform: rotate(180deg);
}

.dot-spinner__dot:nth-child(5)::before {
  animation-delay: calc(var(--uib-speed) * -0.5);
}

.dot-spinner__dot:nth-child(6) {
  transform: rotate(225deg);
}

.dot-spinner__dot:nth-child(6)::before {
  animation-delay: calc(var(--uib-speed) * -0.375);
}

.dot-spinner__dot:nth-child(7) {
  transform: rotate(270deg);
}

.dot-spinner__dot:nth-child(7)::before {
  animation-delay: calc(var(--uib-speed) * -0.25);
}

.dot-spinner__dot:nth-child(8) {
  transform: rotate(315deg);
}

.dot-spinner__dot:nth-child(8)::before {
  animation-delay: calc(var(--uib-speed) * -0.125);
}

@keyframes pulse0112 {
  0%,
  100% {
    transform: scale(0);
    opacity: 0.5;
  }

  50% {
    transform: scale(1);
    opacity: 1;
  }
}

    `}</style>
    {children}
  </>
);

export default Recommendations;