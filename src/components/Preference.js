import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from "firebase/firestore";

// --- NOTE: This component MUST receive 'firestore' as a prop ---

class Preferences extends Component {
  constructor(props) {
    super(props);
    this.state = {
      categories: ['Technology', 'Science', 'Health', 'Business', 'Sports', 'Entertainment', 'Politics'],
      selected: [],
      message: '',
      isLoggedIn: true,
      redirectToDashboard: false,
      userId: null,
      isLoading: true
    };
  }

  componentDidMount() {
    this.checkAuthAndLoadPreferences();
  }

  checkAuthAndLoadPreferences = async () => {
    const userData = localStorage.getItem('user');

    if (!userData) {
      this.setState({ isLoggedIn: false, isLoading: false });
      return;
    }

    const { uid } = JSON.parse(userData);
    this.setState({ userId: uid });

    try {
      // Check if Firestore prop is available before proceeding
      if (!this.props.firestore) {
        console.error("Firestore instance not passed to Preferences component.");
        this.setState({ message: '❌ Database connection error.', isLoading: false });
        return;
      }
      
      // GET preferences from Firestore
      const userRef = doc(this.props.firestore, 'userPreferences', uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        const savedPrefs = docSnap.data().categories || [];
        this.setState({ selected: savedPrefs, isLoading: false });
        console.log("Loaded preferences from Firestore:", savedPrefs);
      } else {
        console.log("No preferences found for user.");
        this.setState({ isLoading: false });
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
      this.setState({ message: '❌ Error loading preferences.', isLoading: false });
    }
  }

  toggleCategory = (category) => {
    const { selected } = this.state;
    const updated = selected.includes(category)
      ? selected.filter((c) => c !== category)
      : [...selected, category];

    this.setState({ selected: updated, message: '' });
  };

  handleSave = async () => {
    const { selected, userId } = this.state;

    if (!userId || !this.props.firestore) {
        this.setState({ message: '❌ User or database connection missing.', isLoggedIn: false });
        return;
    }

    try {
      // SAVE preferences to Firestore
      const userRef = doc(this.props.firestore, 'userPreferences', userId);

      await setDoc(userRef, {
        categories: selected,
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      this.setState({ message: '✅ Preferences saved successfully!' });

      setTimeout(() => {
        this.setState({ redirectToDashboard: true });
      }, 1000);

    } catch (error) {
      console.error("Error saving preferences:", error);
      this.setState({ message: '❌ Failed to save preferences to database. Please try again.' });
    }
  };

  handleLogout = () => {
    // Note: In a real app, you would call signOut(this.props.auth) here.
    if (this.props.auth) {
      this.props.auth.signOut().catch((error) => {
        console.error("Error signing out:", error);
      });
    }
    localStorage.removeItem('user');
    this.setState({ isLoggedIn: false });
  };

  render() {
    const { categories, selected, message, isLoggedIn, redirectToDashboard, isLoading } = this.state;

    if (!isLoggedIn) {
      return <Navigate to="/" replace />;
    }

    if (redirectToDashboard) {
      return <Navigate to="/Dashboard" replace />;
    }

    if (isLoading) {
        return <div style={styles.container}><h2 style={styles.title}>Loading Preferences...</h2></div>;
    }

    return (
      //TODO:
      //if user has already save the preferences previously move to dashboard

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
            Save / Update Preferences
            </button>
            <button onClick={this.handleLogout} style={styles.logoutButton}>
            Logout
            </button>
          </div>
        </div>
      </div>
    );
  }
}

// --- Styling ---
const styles = {
    container: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#f9fafb', padding: '20px' },
    card: { backgroundColor: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', maxWidth: '600px', width: '100%' },
    title: { fontSize: '26px', fontWeight: '700', color: '#1f2937', marginBottom: '10px', textAlign: 'center' },
    subtitle: { color: '#6b7280', fontSize: '14px', textAlign: 'center', marginBottom: '20px' },
    categoryContainer: { display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' },
    categoryButton: { padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500', fontSize: '14px' },
    message: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#10b981' },
    buttonContainer: { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '30px' },
    saveButton: { backgroundColor: '#3b82f6', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' },
};

export default Preferences;