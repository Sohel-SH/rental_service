import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h3><span>S.R</span> Rental Services</h3>
          <p>Your premium rental management partner in Hinjawadi, Pune. We provide verified property listings and seamless digital leasing for tenants and landlords.</p>
        </div>
        <div className="footer-nav">
          <h4>Navigation</h4>
          <Link href="/">Home</Link>
          <Link href="/listings">Properties</Link>
          <Link href="/contact">Contact</Link>
        </div>
        <div className="footer-contact">
          <h4>Contact Info</h4>
          <p>📍 Hinjawadi Phase 1, Pune, MH</p>
          <p>📞 +91 98765 43210</p>
          <p>✉️ support@srrentals.com</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} S.R Rental Services. All rights reserved.</p>
      </div>
    </footer>
  );
}
