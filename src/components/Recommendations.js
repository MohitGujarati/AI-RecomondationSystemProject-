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

  if (loading) {
    return (
      <StyledWrapper>
        <div class="dot-spinner">
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
          <div class="dot-spinner__dot"></div>
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

      <div style={styles.newsList}>
        {recommendations.map((article) => (
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
              <div style={styles.contentSection}>
                <div style={styles.metaRow}>
                  {article.recommendation_score && (
                    <div style={styles.metaBadgeContainer}>
                      <span style={styles.scoreBadge}>
                        ⭐ {(article.recommendation_score * 100).toFixed(0)}%
                      </span>
                      <span style={styles.categoryBadge}>
                        {article.category || "General"}
                      </span>
                    </div>
                  )}
                </div>
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
  );
}

const styles = {
  container: {
    padding: "20px",
    maxWidth: "100%",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },
  errorBox: {
    width: "100%",
    backgroundColor: "#fff3cd",
    color: "#856404",
    padding: "10px",
    borderRadius: "5px",
    marginBottom: "15px",
  },
  refreshButton: {
    position: 'absolute',
    top: '50%',
    right: '10px',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#555',
  },
  newsList: {
    padding: "20px",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: "8px",
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "20px",
    margin: "20px 0",
  },
  newsItem: {
    width: "300px",
    height: "400px", // <-- Set a fixed height that accommodates your content (adjust as needed)
    backgroundColor: 'rgba(243, 241, 241, 0.45)',
    boxShadow: '0 1px 10px rgba(0,0,0,0.10)',
    backdropFilter: 'blur(12px) saturate(180%)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: "8px",
    backgroundColor: "white",
    padding: "15px",
    textDecoration: "none",
    color: "black",
    display: "flex",
    flexDirection: "column",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
  },
  imageContainer: {
    width: "100%",
    height: "150px",
    marginBottom: "15px",
    overflow: "hidden",
    borderRadius: "5px",
  },
  newsImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
  },
  scoreBadge: {
    backgroundColor: "#28a745",
    color: "white",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "10px",
    fontWeight: "bold",
  },
  newsTitle: {
    fontFamily: 'Georgia, "Times New Roman", serif',
    fontSize: "16px",
    fontWeight: "bold",
    margin: "10px 0",
    lineHeight: 1.3,
  },
  newsDescription: {
    fontSize: "14px",
    color: "#333",
    lineHeight: 1.4,
    flexGrow: 1,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 3,
    WebkitBoxOrient: "vertical",
  },
  newsFooter: {
    display: "flex",
    justifyContent: "space-between",
    borderTop: "1px solid #eee",
    paddingTop: "10px",
    marginTop: "auto",
    fontSize: "12px",
    color: "#888",
  },
  categoryBadge: {
    backgroundColor: "#e2e8f0",
    color: "#1e293b",
    fontWeight: 500,
    marginLeft: "8px",
    padding: "2px 8px",
    borderRadius: "8px",
    fontSize: "0.8rem",

  },

  metaRow: {

    backgroundColor: "#f9fafb",
    borderRadius: "12px",
    padding: "6px 12px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
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