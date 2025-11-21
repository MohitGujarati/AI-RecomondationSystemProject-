import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { collection, query, orderBy, getDocs } from "firebase/firestore";

// NOTE: This component MUST receive 'firestore' and 'auth' as props from the router (App.js).

class Latest extends Component { // Component name confirmed as Latest
  constructor(props) {
    super(props);
    this.state = {
      readHistory: [],
      isLoading: true,
      isLoggedIn: true,
      error: null,
      userId: null,
    };
  }

  componentDidMount() {
    this.checkAuthAndLoadHistory();
  }

  // --- CORE FUNCTION: AUTH CHECK AND DATA FETCH ---
  checkAuthAndLoadHistory = async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.setState({ isLoggedIn: false, isLoading: false });
      return;
    }

    const { uid } = JSON.parse(userData);
    this.setState({ userId: uid });

    // CRITICAL CHECK: Check for prop existence
    if (!this.props.firestore) {
      console.error("Firestore instance missing. Check App.js props.");
      this.setState({ error: 'Database connection missing.', isLoading: false });
      return;
    }

    try {
      // Define the collection path: user_history / [uid] / reads
      const historyCollectionPath = `user_history/${uid}/reads`;
      const historyRef = collection(this.props.firestore, historyCollectionPath);

      // Create a query to order by the timestamp, newest first
      const historyQuery = query(historyRef, orderBy('timestamp', 'desc'));

      const snapshot = await getDocs(historyQuery);
      
      const historyData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id, // The article URI
          title: data.title || 'Untitled Article',
          source: data.source || 'Unknown Source',
          url: data.url || '#', // Added URL property
          // The timestamp is saved as an ISO string, format it for display
          time: this.formatTimeAgo(data.timestamp),
          category: data.category || 'General',
          summary: data.summary || 'Summary not available.',
          urgency: 'low', // History items are usually low urgency
        };
      });

      this.setState({ readHistory: historyData, isLoading: false, error: null });
      console.log(`Loaded ${historyData.length} history items.`);

    } catch (error) {
      // Catch Firestore permission errors, etc.
      console.error("Error fetching read history:", error);
      this.setState({ 
        error: `Failed to load history: ${error.message}. (Check Firestore rules/permissions)`, 
        isLoading: false 
      });
    }
  };

  // --- Utility to format time (e.g., "1 hour ago") ---
  formatTimeAgo(isoString) {
    if (!isoString) return "Recently";
    try {
        const now = new Date();
        const past = new Date(isoString);
        const seconds = Math.floor((now - past) / 1000);
        
        if (seconds < 60) return `${seconds} seconds ago`;
        
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes} minutes ago`;

        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hours ago`;
        
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days} days ago`;

        return past.toLocaleDateString();
    } catch (e) {
        return "Unknown Time";
    }
  }


  getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  }

  getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '📰';
      default: return '📰';
    }
  }

  render() {
    const { readHistory, isLoading, error, isLoggedIn, userId } = this.state;

    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }
    
    // Display the User ID for verification, as required.
    const userIdDisplay = userId ? <p style={styles.userIdDisplay}>User ID: {userId}</p> : null;

    if (isLoading) return <div style={styles.container}><h2 style={styles.title}>Loading Read History...</h2>{userIdDisplay}</div>;
    // ERROR MESSAGE: Now correctly shows error with details
    if (error) return <div style={styles.container}><h2 style={styles.title}>Error Loading Data</h2><p style={styles.subtitle}>{error}</p>{userIdDisplay}</div>;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>📖 Your Read History</h2> {/* Title remains "History" based on function */}
          <p style={styles.subtitle}>Articles you have viewed or liked, sorted by most recent.</p>
          {userIdDisplay}
        </div>
        
        <div style={styles.newsList}>
          {readHistory.length > 0 ? (
            readHistory.map(article => (
              <div key={article.id} style={styles.newsItem} 
                onClick={() => window.open(article.url, '_blank')} // Added click handler to open article
              >
                <div style={styles.newsLeft}>
                  <div style={styles.urgencyIndicator}>
                    <span style={styles.urgencyIcon}>{this.getUrgencyIcon(article.urgency)}</span>
                    <div 
                      style={{
                        ...styles.urgencyDot,
                        backgroundColor: this.getUrgencyColor(article.urgency)
                      }}
                    ></div>
                  </div>
                  
                  <div style={styles.newsContent}>
                    <div style={styles.newsHeader}>
                      <span 
                        style={{
                          ...styles.category,
                          backgroundColor: this.getUrgencyColor(article.urgency)
                        }}
                      >
                        {article.category}
                      </span>
                      <span style={styles.time}>{article.time}</span>
                    </div>
                    
                    <h3 style={styles.newsTitle}>{article.title}</h3>
                    <p style={styles.newsSummary}>{article.summary}</p>
                    
                    <div style={styles.newsFooter}>
                      <span style={styles.source}>{article.source}</span>
                      <div style={styles.actions}>
                        {/* Removed generic buttons, clicking the item opens the link now */}
                        <button style={styles.actionButton}>View Details</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              No history found. Start reading some articles!
            </div>
          )}
        </div>
        
        <div style={styles.viewMore}>
          <button style={styles.viewMoreButton} onClick={this.checkAuthAndLoadHistory}>Refresh History</button>
        </div>
      </div>
    );
  }
}

const styles = {


container: {
backgroundColor: '#ffffff',
borderRadius: '12px',
padding: '30px',
marginBottom: '30px',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
    maxWidth: '800px',
    margin: '30px auto', },
  userIdDisplay: {
    fontSize: '10px',
    color: '#a0a0a0',
    marginTop: '10px',
    wordBreak: 'break-all',
  },
  header: {
    marginBottom: '25px',
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a202c',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0,
  },
  newsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '25px',
  },
  newsItem: {
    padding: '15px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
    },
  },
  newsLeft: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
  },
  urgencyIndicator: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '5px',
    paddingTop: '5px',
  },
  urgencyIcon: {
    fontSize: '16px',
  },
  urgencyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  newsContent: {
    flex: 1,
  },
  newsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  category: {
    color: 'white',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
  },
  time: {
    fontSize: '12px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  newsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1a202c',
    marginBottom: '8px',
lineHeight: '1.4',
},
newsSummary: {
fontSize: '13px',
color: '#6b7280',
lineHeight: '1.5',
marginBottom: '12px',
},
newsFooter: {
display: 'flex',
justifyContent: 'space-between',
alignItems: 'center',
},
source: {
fontSize: '12px',
color: '#9ca3af',
fontWeight: '500',
},
actions: {
display: 'flex',
gap: '8px',
},
actionButton: {
backgroundColor: '#f3f4f6', color: '#374151',
border: 'none',
padding: '4px 10px',
borderRadius: '4px',
fontSize: '11px',
fontWeight: '500',
cursor: 'pointer', transition: 'background-color 0.2s ease', },
viewMore: {display: 'flex', justifyContent: 'center',gap: '15px', flexWrap: 'wrap', viewMoreButton: {
 backgroundColor: '#3b82f6', // Changed to blue for standard action
color: 'white',
border: 'none',
padding: '12px 24px',
borderRadius: '8px',
fontSize: '14px',
fontWeight: '600',
cursor: 'pointer',
transition: 'background-color 0.2s ease',
},
refreshButton: {
backgroundColor: '#6b7280',
color: 'white',
border: 'none',
padding: '12px 20px',
borderRadius: '8px',
ontSize: '14px',
ontWeight: '600',
cursor: 'pointer',
transition: 'background-color 0.2s ease',
},
}};
export default Latest;