import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import Recommendations from './Recommendations';
import Popular from './Popular';
import Latest from './Latest';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [activeTab, setActiveTab] = useState('popular');
  const [reloadRec, setReloadRec] = useState(false); // force Recommendations reload

  // Load logged-in user from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Logout and clear data
  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedOut(true);
  };

  // Redirect to login if no user
  if (isLoggedOut || !localStorage.getItem('user')) {
    return <Navigate to="/" replace />;
  }

  // Handle tab clicks
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'recommendations') {
      // Toggle reload flag to fetch fresh recommendations
      setReloadRec(prev => !prev);
    }
  };

  // Render tab content
  const renderTab = () => {
    switch (activeTab) {
      case 'recommendations':
        return <Recommendations reload={reloadRec} />;
      case 'latest':
        return <Latest />;
      default:
        return <Popular />;
    }
  };

  return (
    <div style={styles.appContainer}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.logo}>NewsRec AI</h1>
          <div style={styles.headerRight}>
            <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav style={styles.tabBar}>
        {['recommendations', 'popular', 'latest'].map(tab => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={{
              ...styles.tabButton,
              backgroundColor: activeTab === tab ? '#010716ff' : 'transparent',
              color: activeTab === tab ? '#fff' : '#333',
              borderBottom: activeTab === tab ? '3px solid #000205ff' : '3px solid transparent'
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </nav>

      {/* Tab Content */}
      <main style={styles.contentArea}>
        {renderTab()}
      </main>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>Powered by NewsAPI · Built with ❤️ for educational purposes</p>
      </footer>
    </div>
  );
}

// --- Minimal yet polished styling ---
const styles = {
  appContainer: {
    fontFamily: 'Inter, system-ui, sans-serif',
    backgroundColor: 'rgba(243, 241, 241, 0.45)',
    color: '#1f2937',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    backgroundColor: 'rgba(243, 241, 241, 0.45)',
    boxShadow: '0 1px 10px rgba(0,0,0,0.10)',
    padding: '15px 30px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'sticky',
    top: 0,
    marginBottom: 0,
    zIndex: 10,
    backdropFilter: 'blur(12px) saturate(180%)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  headerInner: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative'
  },
  headerRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: 'translateY(-50%)'
  },
  logo: {
    fontFamily: "'Georgia', 'Times New Roman'",
    textAlign: 'center',
    fontSize: '28px',
    letterSpacing: '1px',
    fontWeight: 700,
    margin: 0,
    lineHeight: 1,
    textTransform: 'none'
  },
  logoutBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 600,
    transition: '0.3s',
  },
  tabBar: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    backgroundColor: 'rgba(243, 241, 241, 0.45)',
    boxShadow: '0 1px 10px rgba(0,0,0,0.10)',
    position: 'sticky',
    top: '65px',
    zIndex: 5,
    backdropFilter: 'blur(12px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.25)',
  },
  tabButton: {
    padding: '12px 20px',
    border: 'none',
    cursor: 'pointer',
    width: '520px',
    borderRadius: '50px',
    fontSize: '15px',
    fontWeight: '600',
    backgroundColor: 'transparent',
    transition: 'all 0.0s ease',
  },
  contentArea: {
    flex: 1,
    padding: '30px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  footer: {
    backgroundColor: '#fff',
    textAlign: 'center',
    padding: '15px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '14px',
    color: '#6b7280'
  }
};

export default Dashboard;
