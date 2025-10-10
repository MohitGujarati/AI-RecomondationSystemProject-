import React, { Component } from 'react';

class Latest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latestNews: [
        {
          id: 1,
          title: "Breaking: Major Earthquake Hits Pacific Region",
          source: "Emergency News",
          time: "15 minutes ago",
          category: "Breaking",
          urgency: "high",
          summary: "Magnitude 7.2 earthquake strikes off the coast, tsunami warning issued for coastal areas."
        },
        {
          id: 2,
          title: "Tech Giant Announces Revolutionary Quantum Computer",
          source: "Tech Insider",
          time: "32 minutes ago",
          category: "Technology",
          urgency: "medium",
          summary: "New quantum computing system promises to solve complex problems in seconds."
        },
        {
          id: 3,
          title: "International Peace Treaty Signed in Geneva",
          source: "World Report",
          time: "45 minutes ago",
          category: "Politics",
          urgency: "medium",
          summary: "Historic agreement reached between conflicting nations after months of negotiations."
        },
        {
          id: 4,
          title: "Medical Breakthrough: New Treatment for Rare Disease",
          source: "Health Today",
          time: "1 hour ago",
          category: "Health",
          urgency: "low",
          summary: "Clinical trials show 90% success rate in treating previously incurable condition."
        },
        {
          id: 5,
          title: "Stock Market Opens with Record Gains",
          source: "Market Watch",
          time: "1 hour ago",
          category: "Finance",
          urgency: "low",
          summary: "Major indices surge following positive economic indicators and policy announcements."
        }
      ]
    };
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
    const { latestNews } = this.state;

    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h2 style={styles.title}>⚡ Latest News</h2>
          <p style={styles.subtitle}>Real-time updates and breaking news</p>
        </div>
        
        <div style={styles.newsList}>
          {latestNews.map(article => (
            <div key={article.id} style={styles.newsItem}>
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
                      <button style={styles.actionButton}>Read</button>
                      <button style={styles.actionButton}>Save</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={styles.viewMore}>
          <button style={styles.viewMoreButton}>Load More Latest News</button>
          <button style={styles.refreshButton}>🔄 Refresh</button>
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
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '4px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  viewMore: {
    display: 'flex',
    justifyContent: 'center',
    gap: '15px',
    flexWrap: 'wrap',
  },
  viewMoreButton: {
    backgroundColor: '#10b981',
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
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
};

export default Latest;
