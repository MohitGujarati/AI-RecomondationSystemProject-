import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import Recommendations from './Recommendations';
import Popular from './Popular';
import Latest from './Latest'; // Component name confirmed as Latest
import '../button.css';
import { HiHome, HiAdjustments, HiBell, HiPencil, HiLogout } from 'react-icons/hi';



// --- NEW: Icon mapping ---
const tabIcons = {
    popular: <HiHome />,
    recommendations: <HiAdjustments />,
    latest: <HiBell />,
};


// CRITICAL FIX: Dashboard must accept auth and firestore as arguments (props)
function Dashboard({ auth, firestore }) { 
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
        navigate('/preferences'); // Using lowercase for path consistency
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

    // FIX: Pass the received props down to child components
    const renderTab = () => {
        switch (activeTab) {
            case 'recommendations':
                // Forward props to Recommendations if it needs them
                return <Recommendations reload={reloadRec} auth={auth} firestore={firestore} />;
            case 'latest':
                // FIX: auth and firestore are now defined and passed here
                return <Latest auth={auth} firestore={firestore} />;
            default:
                return <Popular />;
        }
    };

    return (
        <div style={styles.appContainer}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerInner}>
                    <h1 style={styles.mastheadTitle}>The Cognito Times</h1>
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
                        style={styles.tabButton}
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
    
    // --- MODIFIED: Tab Bar Style ---
    tabBar: {
        display: 'flex',
        gap: '225px', // Spaces out the icons
        backgroundColor: 'rgba(243, 241, 241, 0.45)',
        boxShadow: '0 1px 10px rgba(0,0,0,0.10)',
        backdropFilter: 'blur(12px) saturate(180%)',
        borderRadius: '10px',
        border: '1px solid rgba(255,255,255,0.25)',
        padding: '12px 25px',
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10,
        borderRadius: '50px',
    },

    contentArea: {
        flex: 1,
        padding: '30px 40px',
        maxWidth: '1200px',
        margin: '0 auto',
        marginBottom: '80px',
    },
    mastheadTitle: {
        fontFamily: '"Playfair Display", serif',
        fontSize: "40px",
        fontWeight: "700",
        color: "#000",
        margin: "5px 0",
    },

    // --- MODIFIED: tabButton Style ---
    tabButton: {
        padding: '8px',
        border: 'none',
        cursor: 'pointer',
        borderRadius: '50%',
        fontSize: '24px',
        color: '#000000ff',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'opacity 0.2s ease-in-out',
    },
    
    // --- NEW: activeDot Style ---
    activeDot: {
        position: 'absolute',
        bottom: '-8px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '5px',
        height: '5px',
        borderRadius: '50%',
        backgroundColor: '#3b82f6',
    },
};

export default Dashboard;