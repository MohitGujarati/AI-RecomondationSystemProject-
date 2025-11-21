import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';
// --- 1. FIREBASE AUTH IMPORTS ---
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// --- Assuming the Firebase configuration is in the same file and 'auth' is exported ---
// We will define the config and export 'auth' at the bottom of the file.

// --- Login Class Component (Logic Updated for Firebase) ---
class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: '',
      password: '',
      isLoggedIn: false,
      errors: {}
    };
  }

  componentDidMount() {
    // 2. CHECK FOR EXISTING FIREBASE SESSION
    // The onAuthStateChanged listener handles both initial check and state changes
    onAuthStateChanged(this.props.auth, (user) => {
      if (user) {
        // User is signed in via Firebase (Google or other providers)
        console.log('Firebase user logged in, redirecting:', user.uid);
        // Store minimal user info for persistence/access
        localStorage.setItem('user', JSON.stringify({ uid: user.uid, email: user.email }));
        this.setState({ isLoggedIn: true });
      } else {
        // No Firebase user. Check for the previous local demo session.
        const localUserData = localStorage.getItem('user');
        if (localUserData) {
          console.log('Local demo user found, redirecting...');
          this.setState({ isLoggedIn: true });
        }
      }
    });
  }

  handleInputChange = (event) => {
    const { name, value } = event.target;
    this.setState({
      [name]: value,
      errors: {
        ...this.state.errors,
        [name]: ''
      }
    });
  }

  validateForm = () => {
    const { userId, password } = this.state;
    const errors = {};

    if (!userId.trim()) {
      errors.userId = 'User ID is required';
    }

    if (!password.trim()) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    this.setState({ errors });
    return Object.keys(errors).length === 0;
  }

  // Handle the existing local demo login
  handleSubmit = (event) => {
    event.preventDefault();

    if (this.validateForm()) {
      const { userId, password } = this.state;

      // For demo purposes only
      if (userId && password) {
        localStorage.setItem('user', JSON.stringify({ userId, provider: 'local' }));
        console.log('Local Demo user logged in:', userId);
        this.setState({ isLoggedIn: true });
      }
    }
  }
  
  // 3. FIREBASE GOOGLE LOGIN METHOD
  handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    
    try {
      // Use the auth instance passed via props (from the bottom of the file)
      const result = await signInWithPopup(this.props.auth, provider);
      
      // The onAuthStateChanged listener will catch this successful login and update state
      console.log('Google Sign-In successful. User:', result.user.email);
      
    } catch (error) {
      console.error('Google Sign-In failed:', error.message);
      alert(`Login Failed: ${error.message}`);
    }
  }

  // --- RENDER METHOD (UI Updated) ---
  render() {
    const { userId, password, isLoggedIn, errors } = this.state;

    // Redirect to dashboard if logged in
    if (isLoggedIn) {
      return <Navigate to="/preferences" replace />;
    }

    return (
      <div style={styles.container}>
        <div style={styles.loginBox}>

          <h2 style={styles.title}>The Cognito News </h2>

          {/* --- Local Demo/Placeholder Form --- */}
          <form onSubmit={this.handleSubmit} style={styles.form}>

            {/* User ID Input */}
            <div style={styles.inputGroup}>
              <label htmlFor="userId" style={styles.label}>User ID</label>
              <input
                id="userId"
                type="text"
                name="userId"
                value={userId}
                onChange={this.handleInputChange}
                style={{
                  ...styles.input,
                  ...(errors && errors.userId ? styles.inputError : {})
                }}
                placeholder="Enter your user ID"
              />
              {errors && errors.userId && <span style={styles.errorText}>{errors.userId}</span>}
            </div>

            {/* Password Input */}
            <div style={styles.inputGroup}>
              <label htmlFor="password" style={styles.label}>Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={password}
                onChange={this.handleInputChange}
                style={{
                  ...styles.input,
                  ...(errors && errors.password ? styles.inputError : {})
                }}
                placeholder="Enter your password"
              />
              {errors && errors.password && <span style={styles.errorText}>{errors.password}</span>}
            </div>

            {/* Local Login Button */}
            <button type="submit" style={styles.button}>
              Sign In (Local Demo)
            </button>
          </form>

          {/* --- Separator and Google Button --- */}
          <div style={styles.separator}>OR</div>

          <button
            onClick={this.handleGoogleLogin}
            style={styles.googleButton}
          >
          
            Sign in with Google
          </button>


          {/* Demo Information */}
          <div style={styles.demoInfo}>
            <p style={styles.demoText}>
              <strong style={styles.demoTextStrong}>Demo Access:</strong> Enter any User ID and password (min 6 chars)
            </p>
          </div>
        </div>
      </div>
    );
  };

}

// --- STYLES FOR MINIMAL, PROFESSIONAL UI (INCLUDES NEW GOOGLE STYLES) ---
const styles = {
  // --- Overall Layout (Centered & Full Screen) ---
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa', // Light, neutral background
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
    padding: '20px', // Mobile padding
  },

  // --- Login Box (The Card) ---
  loginBox: {
    width: '100%',
    maxWidth: '400px', // Set a maximum width for desktop
    padding: '40px',
    borderRadius: '12px', // Softer, more modern corners
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)', // Subtle shadow for depth
    backgroundColor: '#ffffff', // White card background
  },

  // --- Title/Branding ---
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1a202c', // Dark text
    marginBottom: '30px',
    textAlign: 'center',
  },

  // --- Form/Inputs ---
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px', // Space between input groups
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },

  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#4a5568', // Subtle label color
    marginBottom: '8px',
  },

  input: {
    padding: '12px 16px',
    border: '1px solid #e2e8f0', // Light border
    borderRadius: '8px',
    fontSize: '16px',
    color: '#1a202c',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },

  inputError: {
    borderColor: '#ef4444', // Red border on error
  },

  errorText: {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '6px',
  },

  // --- Button (Local Login) ---
  button: {
    backgroundColor: '#3b82f6', // Primary Blue
    color: 'white',
    padding: '12px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.2s',
    boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)',
  },

  // --- New Google Styles ---
  separator: {
    textAlign: 'center',
    margin: '20px 0',
    color: '#a0aec0',
    fontSize: '14px',
    borderBottom: '1px solid #e2e8f0',
    lineHeight: '0.1em',
    // The following styles make the "OR" text appear centered over the line
    '&::before': {
        content: '"OR"',
        background: '#fff',
        padding: '0 10px',
    }
  },
  googleButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  googleIcon: {
    width: '20px',
    height: '20px',
    marginRight: '10px',
  },

  // --- Demo/Footer Info ---
  demoInfo: {
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e2e8f0', // Separator line
    textAlign: 'center',
  },

  demoText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  },

  demoTextStrong: {
    fontWeight: '700',
    color: '#4a5568',
  }
};

// 4. WRAP THE COMPONENT TO INJECT AUTH PROP
// This ensures the Login component receives the necessary 'auth' object.
const LoginWithFirebase = (props) => (
  <Login {...props} auth={auth} />
);

export default LoginWithFirebase;


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDA1AWkInecligq0CtotrgI60L1HuFtybY",
  authDomain: "the-cognito-times.firebaseapp.com",
  projectId: "the-cognito-times",
  storageBucket: "the-cognito-times.firebasestorage.app",
  messagingSenderId: "471057406373",
  appId: "1:471057406373:web:d069719b90c16d10d1304c",
  measurementId: "G-7Z3497VS3L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app); // Export this instance for use in the component

export { app, auth, analytics };