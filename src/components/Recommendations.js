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
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div style={{ fontSize: "24px", marginBottom: "10px" }}>🔄</div>
        <div>Loading personalized recommendations...</div>
      </div>
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ marginLeft: "10px",justifyContent: "space-between", alignItems: "center" }}>
           
           Recommended News</h2>
        <button
          onClick={TotalRefresh}
          className="button"
        >
          <HiRefresh size={20} style={{ verticalAlign: 'super', marginRight: '5px' }} />
          Refresh
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
          >
            <div style={styles.imageContainer}>
              <img
                src={
                  
                  article.urlToImage ||
                  `https://via.placeholder.com/300x150/4a90e2/ffffff?text=${encodeURIComponent(
                    article.category
                    
                  )
                }`
                }
                alt={article.title}
              
                style={styles.newsImage}
                onError={(e) => {
                  e.target.src = `https://via.placeholder.com/300x150/4a90e2/ffffff?text=${encodeURIComponent(
                    article.category
                  )}`;
                }}
              />
            </div>

            <div style={styles.topRow}>
              {article.recommendation_score && (
                <span style={styles.scoreBadge}>
                  ⭐ {(article.recommendation_score * 100).toFixed(0)}
                </span>
              )}
            </div>

            <h3 style={styles.newsTitle}>{article.title}</h3>

            <p style={styles.newsDescription}>{article.description}</p>

            <div style={styles.newsFooter}>
              <span>{article.source || article.author || "Unknown"}</span>
              <span>{formatDate(article.publishedAt)}</span>
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
};





export default Recommendations;
