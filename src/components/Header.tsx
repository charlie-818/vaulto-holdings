import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  // Removed onRefresh, lastUpdated, and loading props
}

const Header: React.FC<HeaderProps> = () => {

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="logo-section">
            <Link to="/" className="logo">
              <img src="/vlt-logo.png" alt="Vaulto Logo" className="logo-image" />
              <h1>Treasury</h1>
            </Link>
              <div className="page-links">
                <a href="https://app.vaulto.ai" target="_blank" rel="noopener noreferrer" className="page-link">Swap</a>
                <a href="https://search.vaulto.ai" target="_blank" rel="noopener noreferrer" className="page-link">Search</a>
              </div>
          </div>
          

          
          <nav className="nav">
            <ul className="nav-list">
              <li><a href="/contact" className="nav-link">Contact Us</a></li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
