import React, { useState, useEffect } from "react";

function Recommendations({ reload }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch recommendations from Flask backend
  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/recommendations");
      if (!res.ok) throw new Error("Failed to fetch recommendations");
      const data = await res.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError(
        "Unable to fetch recommendations. Using sample data instead."
      );
      // Optionally, fallback to local sample data
      setRecommendations(getSampleRecommendations());
    } finally {
      setLoading(false);
    }
  };

  // Reload recommendations when component mounts or reload prop changes
  useEffect(() => {
    fetchRecommendations();
  }, [reload]);

  // Sample recommendations as fallback
  const getSampleRecommendations = () => [
    {
      id: 1,
      title:
        "OpenAI, Nvidia Fuel $1 Trillion AI Market With Web of Circular Deals - Bloomberg.com",
      description:
        "A wave of deals and partnerships are escalating concerns that the trillion-dollar AI boom is being propped up by interconnected business transactions.",
      url: "https://www.bloomberg.com/news/features/2025-10-07/openai-s-nvidia-amd-deals-boost-1-trillion-ai-boom-with-circular-deals",
      urlToImage:
        "https://assets.bwbx.io/images/users/iqjWHBFdfxIU/iVCmWYBLxgq0/v1/1200x800.jpg",
      source: "Bloomberg",
      publishedAt: "2025-10-07T20:00:10Z",
      category: "Technology",
      recommendation_score: 3.09,
    },
    {
      id: 2,
      title: "Machine Learning Transforms Financial Markets",
      source: "FinTech Daily",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      category: "Technology",
      description:
        "New algorithms are revolutionizing trading strategies and risk assessment in global markets.",
      url: "#",
      recommendation_score: 3.8,
    },
    {
      id: 3,
      title: "Breakthrough in Quantum Computing Research",
      source: "Science Today",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      category: "Science",
      description:
        "Scientists achieve new milestone in quantum error correction, bringing practical quantum computers closer to reality.",
      url: "#",
      recommendation_score: 3.5,
    },
  ];

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

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        🔄 Loading personalized recommendations...
      </div>
    );

  return (
    <div style={{ padding: "20px", display: "flex", flexWrap: "wrap", gap: "20px" }}>
      {error && (
        <div
          style={{
            width: "100%",
            backgroundColor: "#fff3cd",
            color: "#856404",
            padding: "10px",
            borderRadius: "5px",
            marginBottom: "15px",
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {recommendations.map((article) => (
        <a
          key={article.id}
          href={article.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            width: "300px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            backgroundColor: "white",
            padding: "15px",
            textDecoration: "none",
            color: "black",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ width: "100%", height: "150px", marginBottom: "15px", overflow: "hidden", borderRadius: "5px" }}>
            <img
              src={article.urlToImage || `https://via.placeholder.com/300x150/4a90e2/ffffff?text=${encodeURIComponent(article.category)}`}
              alt={article.title}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => {
                e.target.src = `https://via.placeholder.com/300x150/4a90e2/ffffff?text=${encodeURIComponent(article.category)}`;
              }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
            {article.recommendation_score && (
              <span
                style={{
                  backgroundColor: "#28a745",
                  color: "white",
                  padding: "2px 6px",
                  borderRadius: "10px",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ⭐ {(article.recommendation_score * 100).toFixed(0)}
              </span>
            )}
          </div>

          <h3 style={{ fontSize: "16px", fontWeight: "bold", margin: "10px 0", lineHeight: 1.3 }}>
            {article.title}
          </h3>

          <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.4, flexGrow: 1 }}>
            {article.description}
          </p>

          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #eee", paddingTop: "10px", marginTop: "auto", fontSize: "12px", color: "#888" }}>
            <span>{article.source || article.author || "Unknown"}</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

export default Recommendations;
