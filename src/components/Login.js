import React, { Component } from 'react';
import { Navigate } from 'react-router-dom';

// --- Login Class Component (Logic Unchanged) ---
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
    // Check if user is already logged in
    const userData = localStorage.getItem('user');
    if (userData) {
      console.log('User already logged in, redirecting to dashboard'); // Debug log
      this.setState({ isLoggedIn: true });
    }
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

  handleSubmit = (event) => {
    event.preventDefault();
    
    if (this.validateForm()) {
      // Simple validation - in real app, you'd authenticate with backend
      const { userId, password } = this.state;
      
      // For demo purposes, accept any non-empty credentials
      if (userId && password) {
        // Store user info in localStorage for demo
        localStorage.setItem('user', JSON.stringify({ userId }));
        console.log('User logged in:', userId); // Debug log
        
        // Set state to trigger navigation
        this.setState({ isLoggedIn: true });
      }
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
          
          <h2 style={styles.title}>NewsRec AI</h2>
          
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

            {/* Login Button */}
            <button type="submit" style={styles.button}>
              Sign In
            </button>
          </form>
          
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

// --- STYLES FOR MINIMAL, PROFESSIONAL UI ---
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

  // Note: Inline styles don't support :focus or :hover pseudoclasses directly.
  // In a real app, you would use CSS modules or a styling library like Tailwind/Styled Components.
  // For the purpose of inline style compatibility, we will focus on static styles.

  inputError: {
    borderColor: '#ef4444', // Red border on error
  },

  errorText: {
    color: '#ef4444',
    fontSize: '12px',
    marginTop: '6px',
  },

  // --- Button ---
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


export default Login;
