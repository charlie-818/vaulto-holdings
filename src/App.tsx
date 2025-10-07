import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Contact from './components/Contact';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <div className="App">
      <Router>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </ErrorBoundary>
      </Router>
    </div>
  );
}

export default App;
