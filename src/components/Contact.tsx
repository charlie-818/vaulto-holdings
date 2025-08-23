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
            <form className="contact-form" onSubmit={handleSubmit} data-netlify="true" name="contact" data-netlify-honeypot="bot-field">
              <p className="hidden">
                <label>
                  Don't fill this out if you're human: <input name="bot-field" />
                </label>
              </p>
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
                  <option value="under-1m">Under $1M</option>
                  <option value="1m-5m">$1M - $5M</option>
                  <option value="5m-10m">$5M - $10M</option>
                  <option value="10m-25m">$10M - $25M</option>
                  <option value="25m-50m">$25M - $50M</option>
                  <option value="50m-100m">$50M - $100M</option>
                  <option value="over-100m">Over $100M</option>
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
