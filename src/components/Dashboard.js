import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Recommendations from './Recommendations';
import Popular from './Popular';
import Latest from './Latest';
import '../button.css';
import { HiHome, HiAdjustments, HiBell,HiPencil,HiLogout } from 'react-icons/hi';

// --- NEW: Icon mapping ---
const tabIcons = {
  popular: <HiHome />,
  recommendations: <HiAdjustments />,
  latest: <HiBell />,
};


function Dashboard() {
  const [user, setUser] = useState(null);
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [activeTab, setActiveTab] = useState('popular');
  const [reloadRec, setReloadRec] = useState(false);

  const navigate = useNavigate();

  // Load logged-in user
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsLoggedOut(true);
  };

  // Navigate to Preferences page
  const handleEditPreferences = () => {
    navigate('/Preferences'); // or '/preferences' depending on your router path
  };

  // Redirect if logged out or no user
  if (isLoggedOut || !localStorage.getItem('user')) {
    return <Navigate to="/" replace />;
  }

  // Handle tab click
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    if (tab === 'recommendations') setReloadRec((prev) => !prev);
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
      {/* Header (unchanged) */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.logo}>Cognito News</h1>
          <div style={styles.headerRight}>
           <button className="button" onClick={handleEditPreferences} style={styles.headerButton}>
                <HiPencil style={{ marginRight: '6px' }} /> {/* Icon */}
                Edit
            </button>
            <button className="button" onClick={handleLogout} style={styles.headerButton}>
                <HiLogout style={{ marginRight: '6px' }} /> {/* Icon */}
                Logout
          </button>
          </div>
        </div>
      </header>

      {/* --- MODIFIED: Tab Bar --- */}
      <nav style={styles.tabBar}>
        {['popular', 'recommendations', 'latest'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            style={styles.tabButton} // Removed complex inline style
          >
            {/* --- NEW: Wrapper for icon and dot --- */}
            <div style={{ position: 'relative' }}>
              {tabIcons[tab]}
              {/* --- NEW: Active dot --- */}
              {activeTab === tab && <div style={styles.activeDot} />}
            </div>
          </button>
        ))}
      </nav>

      {/* Tab Content (unchanged) */}
      <main style={styles.contentArea}>{renderTab()}</main>
    </div>
  );
}

// --- MODIFIED: Styling ---
const styles = {
  appContainer: {
    fontFamily: 'Inter, system-ui, sans-serif',
    backgroundColor: 'rgba(243, 241, 241, 0.45)',
    color: '#1f2937',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
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
    zIndex: 10,
    backdropFilter: 'blur(12px) saturate(180%)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
  },
headerButton: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
},
  headerInner: {
    width: '100%',
    maxWidth: '1200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerRight: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    gap: '10px',
  },
  logo: {
    textAlign: 'center',
    fontSize: '32px',
    fontWeight: 800,
    margin: 0,
  },
  // prefBtn and logoutBtn styles are removed as you are using button.css
  
  // --- MODIFIED: tabBar Style ---
  tabBar: {
    display: 'flex',
    gap: '225px', // Spaces out the icons
     backgroundColor: 'rgba(243, 241, 241, 0.45)',
    boxShadow: '0 1px 10px rgba(0,0,0,0.10)',
    backdropFilter: 'blur(12px) saturate(180%)',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
    padding: '12px 25px', // Gives padding inside the pill
    //backgroundColor: '#010716a7', // Dark background like the image
    position: 'fixed',
    bottom: '20px', // Floats above the bottom edge
    left: '50%', // Centers horizontally
    transform: 'translateX(-50%)', // Centers horizontally
    zIndex: 10,
    borderRadius: '50px', // Creates the pill shape
   // boxShadow: '0 4px 14px rgba(0, 0, 0, 0.14)', 
  },

  contentArea: {
    flex: 1,
    padding: '30px 40px',
    maxWidth: '1200px',
    margin: '0 auto',
    marginBottom: '80px', // Adjusted space for the new floating bar
  },

  // --- MODIFIED: tabButton Style ---
  tabButton: {
    padding: '8px',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '50%',
    fontSize: '24px', // Icon size
    color: '#000000ff', // Icon color
    backgroundColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.2s ease-in-out',
  },
  
  // --- NEW: activeDot Style ---
  activeDot: {
    position: 'absolute',
    bottom: '-8px', // Positions the dot below the icon
    left: '50%',
    transform: 'translateX(-50%)',
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6', // A bright blue, like the image
  },
};

export default Dashboard;