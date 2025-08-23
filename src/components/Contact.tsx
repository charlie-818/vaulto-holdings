import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import { mockDataSources } from '../data/mockData';
import './Contact.css';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    institutionName: '',
    contactName: '',
    email: '',
    phone: '',
    assetsUnderManagement: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Contact form submitted:', formData);
    // You can add API call or email service here
  };

  return (
    <div className="contact-page">
      <Header />
      
      <main className="main-content">
        <div className="container">
          <div className="contact-form-container">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="institutionName">Institution Name *</label>
                  <input
                    type="text"
                    id="institutionName"
                    name="institutionName"
                    value={formData.institutionName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="contactName">Contact Name *</label>
                  <input
                    type="text"
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email Address *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="assetsUnderManagement">Assets Under Management *</label>
                <select
                  id="assetsUnderManagement"
                  name="assetsUnderManagement"
                  value={formData.assetsUnderManagement}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select range</option>
                  <option value="under-100m">Under $100M</option>
                  <option value="100m-500m">$100M - $500M</option>
                  <option value="500m-1b">$500M - $1B</option>
                  <option value="1b-5b">$1B - $5B</option>
                  <option value="5b-10b">$5B - $10B</option>
                  <option value="over-10b">Over $10B</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Tell us about your interest in Vaulto Holdings and how we can help..."
                  required
                />
              </div>

              <button type="submit" className="submit-button">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
      
      <Footer dataSources={mockDataSources} />
    </div>
  );
};

export default Contact;
