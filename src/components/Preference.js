import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { getPreferences, savePreferences, clearPreferences } from './preferencesService';

class Preferences extends Component {
  constructor(props) {
    super(props);
    this.state = {
      categories: ['Technology', 'Science', 'Health', 'Business', 'Sports', 'Entertainment', 'Politics'],
      selected: [],
      message: '',
      isLoggedIn: true,
      redirectToDashboard: false
    };
  }

  componentDidMount() {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      this.setState({ isLoggedIn: false });
      return;
    }

    // Load saved preferences from localStorage
    const savedPrefs = getPreferences();
    if (savedPrefs && savedPrefs.length > 0) {
      this.setState({ selected: savedPrefs });
    }
  }

  toggleCategory = (category) => {
    const { selected } = this.state;
    const updated = selected.includes(category)
      ? selected.filter((c) => c !== category)
      : [...selected, category];

    this.setState({ selected: updated, message: '' });
  };

  handleSave = () => {
    const { selected } = this.state;
    const success = savePreferences(selected);
    if (success) {
      this.setState({ message: '✅ Preferences saved successfully!' });

      // Navigate to dashboard after a short delay (for user feedback)
      setTimeout(() => {
        this.setState({ redirectToDashboard: true });
      }, 1000);
    } else {
      this.setState({ message: '❌ Failed to save preferences. Please try again.' });
    }
  };

  handleLogout = () => {
    localStorage.removeItem('user');
    clearPreferences();
    this.setState({ isLoggedIn: false });
  };

  render() {
    const { categories, selected, message, isLoggedIn, redirectToDashboard } = this.state;

    // Redirect to login if logged out
    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }

    // Redirect to dashboard after saving
    if (redirectToDashboard) {
      return <Navigate to="/Dashboard" replace />;
    }

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2 style={styles.title}>Select Your Preferences</h2>
          <p style={styles.subtitle}>Choose the categories you want to see news from:</p>

          <div style={styles.categoryContainer}>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => this.toggleCategory(category)}
                style={{
                  ...styles.categoryButton,
                  backgroundColor: selected.includes(category) ? '#3b82f6' : '#e5e7eb',
                  color: selected.includes(category) ? 'white' : '#111827'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {message && <p style={styles.message}>{message}</p>}

          <div style={styles.buttonContainer}>
            <button onClick={this.handleSave} style={styles.saveButton}>
              💾 Save / Update Preferences
            </button>
            <button onClick={this.handleLogout} style={styles.logoutButton}>
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// --- Styling ---
const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    maxWidth: '600px',
    width: '100%',
  },
  title: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '10px',
    textAlign: 'center'
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  categoryContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    justifyContent: 'center'
  },
  categoryButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '14px'
  },
  message: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#10b981'
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '30px'
  },
  saveButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

export default Preferences;
