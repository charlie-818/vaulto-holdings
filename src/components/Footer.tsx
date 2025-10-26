import React, { useState } from 'react';
import { DataSource } from '../types';
import './Footer.css';

interface FooterProps {
  dataSources: DataSource[];
}

const Footer: React.FC<FooterProps> = ({ dataSources }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const formData = new FormData();
      formData.append('EMAIL', email);
      formData.append('u', '4e3f80ec414b40367852952ec');
      formData.append('id', 'dc4af6dff9');
      formData.append('f_id', '00728ce0f0');

      await fetch('https://vaulto.us15.list-manage.com/subscribe/post?u=4e3f80ec414b40367852952ec&id=dc4af6dff9&f_id=00728ce0f0', {
        method: 'POST',
        body: formData,
        mode: 'no-cors'
      });

      setSubmitStatus('success');
      setEmail('');
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="/vlt-logo.png" alt="Vaulto Logo" className="footer-logo-image" />
              <h4>Vaulto</h4>
            </div>
            <div className="email-subscription">
              <form onSubmit={handleEmailSubmit} className="email-form">
                <div className="email-input-group">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    className="email-input"
                  />
                  <button 
                    type="submit" 
                    disabled={isSubmitting || submitStatus === 'success'}
                    className={`email-submit-btn ${submitStatus === 'success' ? 'success' : ''}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  </button>
                </div>
                {submitStatus === 'error' && (
                  <p className="email-status error">Please try again later.</p>
                )}
              </form>
            </div>
            <div className="social-links">
              <a href="https://youtube.com/@VaultoAi" target="_blank" rel="noopener noreferrer" title="YouTube">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a href="https://linkedin.com/company/vaulto" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a href="https://instagram.com/VaultoAi" target="_blank" rel="noopener noreferrer" title="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="https://x.com/VaultoAi" target="_blank" rel="noopener noreferrer" title="X (Twitter)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        
        <div className="footer-disclaimer">
          <div className="disclaimer-content">
            <div className="disclaimer-text">
              <p><strong>IMPORTANT RISK WARNING</strong></p>
              
              <p>Before investing in Vaulto's strategies, you must carefully consider the following risks and understand that cryptocurrency investments, including leveraged exposure to Ethereum, carry significant financial risks. The value of your investment can decrease as well as increase, and you may lose some or all of your invested capital. Past performance does not guarantee future results.</p>
              
              <p><strong>Market & Volatility Risk:</strong> Cryptocurrency markets are highly volatile and subject to extreme price fluctuations. Market conditions can change rapidly, potentially resulting in substantial losses. The inherent volatility of digital assets means that investments can experience significant value changes over short periods.</p>
              
              <p><strong>Leverage Risk:</strong> This vault utilizes leverage mechanisms that amplify both potential gains and losses. Leveraged positions may be subject to liquidation if market conditions deteriorate beyond certain thresholds. You should only invest amounts you can afford to lose completely.</p>
              
              <p><strong>Regulatory Risk:</strong> Cryptocurrency regulations are continuously evolving globally. Changes in regulatory frameworks may impact the operation, availability, or value of vault strategies. Regulatory developments could affect market access, taxation, or the legal status of cryptocurrency investments.</p>
              
              <p><strong>Technical Risk:</strong> Smart contracts, blockchain technology, and decentralized protocols carry inherent technical risks including software bugs, security vulnerabilities, network failures, and potential exploits that could result in partial or total loss of funds.</p>
              
              <p><strong>Operational Risk:</strong> Vault operations depend on various external factors including network stability, liquidity availability, and third-party service providers. Any disruption to these systems could impact vault performance or accessibility.</p>
              
              <p><strong>Disclaimer of Advice:</strong> This information is provided for educational and informational purposes only. It does not constitute investment advice, financial advice, trading advice, or any other form of professional recommendation. Always conduct thorough independent research and consider consulting with qualified financial advisors before making investment decisions.</p>
              
              <p><strong>No Guarantees:</strong> Vaulto makes no representations or warranties regarding investment returns, capital preservation, or the success of any investment strategy. All investments carry inherent risks, and there is no assurance that any investment approach will achieve its objectives or avoid losses.</p>
              
              <p><strong>Your Responsibility:</strong> You acknowledge that you understand these risks and are solely responsible for your investment decisions. You confirm that you have the financial capacity to bear the potential loss of your entire investment and that investing in cryptocurrency vault strategies aligns with your risk tolerance and investment objectives.</p>
              
              <p><em>By proceeding with any investment, you acknowledge that you have read, understood, and accept these risks.</em></p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
