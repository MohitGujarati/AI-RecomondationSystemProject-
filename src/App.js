import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Preferences from './components/Preference'; // Renamed import for consistency
import Dashboard from './components/Dashboard';
import Latest from './components/Latest';
import './App.css';

// --- IMPORTANT FIX: Import Firebase services ---
import { auth, firestore } from './firebase/firebase';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* PASS AUTH TO LOGIN */}
          <Route path="/" element={<Login auth={auth} />} /> 
          
          {/* PASS AUTH AND FIRESTORE TO PREFERENCES */}
          <Route 
            path="/preferences" 
            element={<Preferences auth={auth} firestore={firestore} />} 
          />
          <Route 
              path="/latest" 
              element={<Latest auth={auth} firestore={firestore} />} 
            />
          <Route path="/dashboard" element={<Dashboard auth={auth} firestore={firestore} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;