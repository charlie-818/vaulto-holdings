import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Contact from './components/Contact';

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
