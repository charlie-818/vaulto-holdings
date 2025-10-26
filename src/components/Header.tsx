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
          <Link to="/" className="logo">
            <img src="/vlt-logo.png" alt="Vaulto Logo" className="logo-image" />
            <h1>Treasury</h1>
          </Link>
          

          
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
