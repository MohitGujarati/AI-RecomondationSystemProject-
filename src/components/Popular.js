import React, { Component } from 'react';

// Event Registry API constants
const EVENT_REGISTRY_URL = "https://eventregistry.org/api/v1/article/getArticles";
const EVENT_REGISTRY_API_KEY = process.env.REACT_APP_EVENT_REGISTRY_API_KEY || "ADD_YOUR_API_KEY_HERE";
const NEWS_IMAGE_PLACEHOLDER = "https://via.placeholder.com/150";
const CATEGORY_PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x150/4a90e2/ffffff?text=";
const internalAPI="http://localhost:5000/api/recommendations";


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
   // this.updateRecommendationNews();
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
    includeArticleCategories: true, // ✅ make sure categories are returned
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

    // ✅ Extract category titles for each article
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
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return "Unknown date";
    }
  }


//   async updateRecommendationNews() {
//   try {
//     const response = await fetch(internalAPI); // <- fetch cached data
//     if (!response.ok) {
//       throw new Error(`Error: ${response.status}`);
//     }
//   } catch (error) {
//     console.error("Could not fetch popular news:", error);
//     this.setState({
//       error: error.message,
//       isLoading: false,
//     });
//   }
// }

  renderArticleCard(article, index) {

    // Check if this specific card is the one being hovered
    const isHovered = this.state.hoveredIndex === index;

    // Conditionally merge the base style with the hover style
    const cardStyle = isHovered
      ? { ...styles.newsItem, ...styles.newsItemHover } 
      : styles.newsItem; 
    const isGif = article.image && article.image.toLowerCase().endsWith('.gif');
    const hasImage = !!article.image 
 return (
      <a
        key={index}
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={cardStyle}
        onMouseEnter={() => this.setState({ hoveredIndex: index })}
        onMouseLeave={() => this.setState({ hoveredIndex: null })}
      >
        {/* The imageContainer will always be rendered to hold the space */}
        <div style={styles.imageContainer}>
          {hasImage ? ( // If image exists, render the img tag
            <>
              <img
                src={article.image} // Use article.image directly
                alt={article.title}
                style={styles.newsImage}
              />
              {isGif && (
                <div style={styles.gifBadge}>GIF</div>
              )}
            </>
          ) : ( // If no image, render the placeholder text
            <div style={styles.noImagePlaceholder}>
              Image Not Provided
            </div>
          )}
        </div>

        <div style={styles.contentWrapper}>
          <div>
            <span style={styles.categoryBadge}>
              {(article.source && article.source.title) || "Unknown Source"}
              
            </span>
          </div>
          <h3 style={styles.newsTitle}>{article.title}</h3>

          <p style={styles.newsDescription}>{article.body}</p>

{/* ✅ Show categories if they exist */}
{article.categories && article.categories.length > 0 && (
  <p style={{ fontStyle: "italic", color: "#666", marginTop: "5px" }}>
    Categories: {article.categories[0]}
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
  getArticleCategory(article) {
  if (article.categories && article.categories.length > 0) {
    // Pick the highest score category
    const topCategory = article.categories.reduce((prev, curr) => (curr.score > prev.score ? curr : prev));
    return topCategory.label?.eng || "General";
  }

  // Fallback to concepts if categories not available
  if (article.concepts && article.concepts.length > 0) {
    const topConcept = article.concepts[0];
    return topConcept.label?.eng || "General";
  }

  return "General";
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
        </div>
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
    padding: "10px",
    textDecoration: "none",
    color: "black",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden", // Crucial: clips anything that exceeds the fixed height
    transition: 'all 0.2s ease-in-out',
},
  newsItemHover: {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 16px rgba(0,0,0,0.12)',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    paddingBottom: '56.25%', // Maintain 16:9 aspect ratio for the image area
    overflow: 'hidden',
    borderRadius: '5px', // Match card border radius if desired
    marginBottom: '10px', // Space between image and text
    overflow: 'hidden',
    height: "100%",
  },

  gifBadge: { // <-- ADD THIS NEW STYLE
    position: 'absolute',
    bottom: '8px',
    right: '8px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    zIndex: 1, // Ensure it's above the image
  },
  newsImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",

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
    WebkitLineClamp: 3,
    flex:1,
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
    height: 'calc(1.2em * 2 + 5px)', // Fixed height for 2 lines + margin to prevent layout shift
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

export default Popular;
