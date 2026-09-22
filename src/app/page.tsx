import prisma from '@/lib/prisma';
import { seedDatabase } from '@/lib/seed';
import SearchBar from '@/components/SearchBar';
import PropertyCard from '@/components/PropertyCard';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let featuredProperties: any[] = [];
  let dbError = false;

  try {
    // Automatically seeds the database with demo listings/users in MySQL
    await seedDatabase();

    // Fetch up to 6 properties for featured displays
    const rawFeatured = await prisma.property.findMany({
      where: { isAvailable: true },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });

    featuredProperties = rawFeatured.map((prop: any) => ({
      ...prop,
      _id: prop.id,
      images: prop.images ? prop.images.split(',') : [],
    }));
  } catch (error) {
    console.error('Failed to connect to database or seed listings:', error);
    dbError = true;
  }

  let targetHost = 'localhost:3306';
  if (process.env.DATABASE_URL) {
    try {
      const match = process.env.DATABASE_URL.match(/@([^:/]+)(?::(\d+))?/);
      if (match) {
        targetHost = `${match[1]}:${match[2] || 3306}`;
      }
    } catch (_) {}
  }

  const premiumProperties = featuredProperties.slice(0, 3);
  const recommendedProperties = featuredProperties.slice(2, 6);

  return (
    <div className="home-page">

      {/* Database Offline Fail-Safe Banner */}
      {dbError && (
        <div className="container" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <div className="card" style={{ borderColor: 'var(--danger)', padding: '2rem', backgroundColor: '#fef2f2' }}>
            <h3 style={{ color: 'var(--danger)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Database Connection Offline
            </h3>
            <p style={{ color: '#7f1d1d', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              S.R Rental Services is unable to connect to your MySQL database. The system tried connecting to <strong>{targetHost}</strong>, but the connection could not be established.
            </p>
            <div style={{ backgroundColor: '#ffffff', border: '1px solid #fee2e2', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.25rem' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '0.5rem', color: '#991b1b' }}>How to resolve this:</h4>
              <ol style={{ fontSize: '0.8125rem', paddingLeft: '1.25rem', color: '#571c1c', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>
                  <strong>For Remote MySQL (cPanel / Cloud):</strong> Ensure your password special characters (like <code>@</code>) are URL-encoded as <code>%40</code>, and verify that <code>%</code> (wildcard) is added in cPanel under <strong>Remote MySQL &rarr; Add Access Host</strong>.
                </li>
                <li>
                  <strong>For Vercel Deployment:</strong> Add the <code>DATABASE_URL</code> environment variable in your Vercel Project Settings &rarr; Environment Variables.
                </li>
                <li>
                  <strong>For Local Development:</strong> Open your <code>.env.local</code> file and verify that the <code>DATABASE_URL</code> connection string matches your MySQL server credentials.
                </li>
              </ol>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#b91c1c' }}>
              <em>Note: Once MySQL is active and connected, refresh this page to seed the properties and launch authentication.</em>
            </p>
          </div>
        </div>
      )}

      {/* 1. Hero Banner */}
      <section className="hero-section-sr">
        <div className="hero-overlay-sr"></div>
        <div className="container hero-container-sr">
          <div className="hero-text-content-sr">
            <h1 className="hero-title-sr">Discover a place you'll love</h1>
          </div>

          <div className="hero-search-wrapper-sr">
            <SearchBar />
          </div>

          {/* Core Metrics Stats Row */}
          <div className="hero-stats-row">
            <div className="stat-item">
              <span className="stat-icon">🔑</span>
              <div>
                <h4>1,00,000+</h4>
                <p>Tenants Assisted</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🏠</span>
              <div>
                <h4>2,00,000+</h4>
                <p>Happy Owners</p>
              </div>
            </div>
            <div className="stat-item">
              <span className="stat-icon">🛋️</span>
              <div>
                <h4>1,00,000+</h4>
                <p>Homes Managed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Premium Homes. Zero Hassle. Block */}
      <section className="homepage-split-premium-section">
        <div className="container premium-split-container">

          {/* Left Text Block */}
          <div className="premium-left-desc-block">
            <h2 className="premium-title-main">Premium Homes.<br />Zero Hassle.</h2>
            <p className="premium-subtitle-desc">
              Explore fully furnished flatshares, private rooms, and apartments with zero brokerage. Perfect for bachelors and families.
            </p>
            <div className="premium-buttons-box">
              <Link href="/listings" className="btn btn-outline-blue">
                Rent Now
              </Link>
              <Link href="/listings?propertyType=pg" className="btn btn-solid-blue">
                Explore Shared Homes
              </Link>
            </div>
            {/* Inline SVG house decoration */}
            <div className="houses-decor-svg">
              <svg viewBox="0 0 200 100" className="decor-svg" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 70 L50 40 L80 70 M20 70 L20 100 L80 100 L80 70" stroke="#eda920" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="42" y="75" width="16" height="25" fill="#3b4cb8" />
                <path d="M100 60 L130 30 L160 60 M100 60 L100 100 L160 100 L160 60" stroke="#3b4cb8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="122" y="70" width="16" height="30" fill="#eda920" />
              </svg>
            </div>
          </div>

          {/* Right Cards Slider Grid */}
          <div className="premium-right-slider-block">
            <div className="cards-slider-row">
              {premiumProperties.length > 0 ? (
                premiumProperties.map((prop: any) => (
                  <PropertyCard key={prop._id.toString()} property={JSON.parse(JSON.stringify(prop))} />
                ))
              ) : (
                <div className="empty-slider-placeholder">
                  <p>Loading premium properties...</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </section>

      {/* 3. Popular Localities Block */}
      <section className="popular-localities-section">
        <div className="container">
          <h2 className="sr-section-header">Popular Localities</h2>
          <div className="localities-grid">

            <div className="locality-banner-card">
              <div className="locality-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&auto=format&fit=crop" alt="Hinjawadi" className="locality-img" />
                <div className="locality-overlay-box"></div>
                <div className="locality-card-text">
                  <h3>Hinjawadi Infotech Park</h3>
                  <p>150+ Properties</p>
                </div>
              </div>
            </div>

            <div className="locality-banner-card">
              <div className="locality-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&auto=format&fit=crop" alt="Phase 1" className="locality-img" />
                <div className="locality-overlay-box"></div>
                <div className="locality-card-text">
                  <h3>Hinjawadi Phase 1</h3>
                  <p>80+ Properties</p>
                </div>
              </div>
            </div>

            <div className="locality-banner-card">
              <div className="locality-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&auto=format&fit=crop" alt="Phase 2" className="locality-img" />
                <div className="locality-overlay-box"></div>
                <div className="locality-card-text">
                  <h3>Hinjawadi Phase 2</h3>
                  <p>95+ Properties</p>
                </div>
              </div>
            </div>

            <div className="locality-banner-card">
              <div className="locality-image-wrapper">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop" alt="Hinjawadi Hills" className="locality-img" />
                <div className="locality-overlay-box"></div>
                <div className="locality-card-text">
                  <h3>Hinjawadi Hills</h3>
                  <p>65+ Properties</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. Recommended Properties */}
      <section className="recommended-section">
        <div className="container">
          <h2 className="sr-section-header">Recommended Properties</h2>

          <div className="recommended-scroll-grid">
            {recommendedProperties.length > 0 ? (
              recommendedProperties.map((prop: any) => (
                <PropertyCard key={prop._id.toString()} property={JSON.parse(JSON.stringify(prop))} />
              ))
            ) : (
              <div className="empty-slider-placeholder">
                <p>Loading recommended homes...</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5. A lifestyle tailored Made for you Block */}
      <section className="lifestyle-tailored-section">
        <div className="container lifestyle-split-container">

          {/* Left Feature Icons */}
          <div className="lifestyle-left-features">
            <h2 className="tailored-title">A lifestyle tailored<br />Made for you</h2>

            <div className="tailored-features-list">
              <div className="tailored-feature-item">
                <div className="feat-circle-icon">🏠</div>
                <div>
                  <h4>Homes that fit many</h4>
                  <p>Find flatshares, private rooms, or full apartments matching your budget.</p>
                </div>
              </div>

              <div className="tailored-feature-item">
                <div className="feat-circle-icon">🔒</div>
                <div>
                  <h4>Privacy & Comfort</h4>
                  <p>Enjoy personal space with high-speed internet and gated security.</p>
                </div>
              </div>

              <div className="tailored-feature-item">
                <div className="feat-circle-icon">⚡</div>
                <div>
                  <h4>Instant Move-in</h4>
                  <p>Book and move in within 24 hours with pre-verified properties.</p>
                </div>
              </div>

              <div className="tailored-feature-item">
                <div className="feat-circle-icon">🛠️</div>
                <div>
                  <h4>Tenant Support</h4>
                  <p>24/7 support for repairs, maintenance, and rental agreements.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="lifestyle-right-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=400&auto=format&fit=crop"
              alt="Lifestyle Tailored for You"
              className="tailored-lifestyle-img"
            />
          </div>

        </div>
      </section>

      {/* 6. As Seen In Media Block */}
      <section className="media-seen-section">
        <div className="container">
          <h3>Making Headlines: As seen in leading publications</h3>
          <div className="media-ticker-wrapper">
            <div className="media-logos-track">
              <span className="media-logo-text">mint</span>
              <span className="media-logo-text">TechCrunch</span>
              <span className="media-logo-text">VCCIRCLE</span>
              <span className="media-logo-text">Business Standard</span>
              <span className="media-logo-text">THE ECONOMIC TIMES</span>
              {/* Duplicate logos for seamless loops */}
              <span className="media-logo-text">mint</span>
              <span className="media-logo-text">TechCrunch</span>
              <span className="media-logo-text">VCCIRCLE</span>
              <span className="media-logo-text">Business Standard</span>
              <span className="media-logo-text">THE ECONOMIC TIMES</span>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Start a New Chapter Block */}
      <section className="start-new-chapter-section">
        <div className="container chapter-split-container">

          {/* Left App / Phone Showcase Mockup */}
          <div className="chapter-left-mockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop"
              alt="S.R Rentals App"
              className="phone-showcase-img"
            />
          </div>

          {/* Right Mobile Download text */}
          <div className="chapter-right-text">
            <h2 className="chapter-title">Start a New Chapter</h2>
            <h4 className="chapter-subtitle">Join the S.R Rentals community</h4>
            <p className="chapter-desc">
              Your journey to hassle-free renting begins here. Find properties based on your choices, schedule visits, and complete rental verification all in one single app.
            </p>
            <div className="store-buttons-row">
              <button className="store-download-btn">
                <span className="store-icon">🤖</span>
                <div>
                  <span className="small-txt">GET IT ON</span>
                  <span className="bold-txt">Google Play</span>
                </div>
              </button>
              <button className="store-download-btn">
                <span className="store-icon">🍎</span>
                <div>
                  <span className="small-txt">Download on the</span>
                  <span className="bold-txt">App Store</span>
                </div>
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 8. Hassle-Free Property Management Block */}
      <section className="property-management-section">
        <div className="container management-split-container">

          {/* Left details */}
          <div className="management-left-text">
            <h2 className="mgt-title">Hassle-Free Property Management</h2>
            <h4 className="mgt-subtitle">For Owners</h4>

            <div className="mgt-features-grid">
              <div className="mgt-feat-box">
                <h5>✓ Verified Tenants</h5>
                <p>Background verification check and rental history checks.</p>
              </div>
              <div className="mgt-feat-box">
                <h5>✓ On-Time Rent</h5>
                <p>Automated payment cycles with on-time direct bank transfers.</p>
              </div>
              <div className="mgt-feat-box">
                <h5>✓ Maintenance Support</h5>
                <p>Complete property upkeep managed by our dedicated repair team.</p>
              </div>
              <div className="mgt-feat-box">
                <h5>✓ Owner Dashboard</h5>
                <p>Real-time analytics, tax receipts, and agreement tracking.</p>
              </div>
            </div>

            <Link href="/owner" className="btn btn-solid-blue mgt-cta-btn">
              List Your Property
            </Link>
          </div>

          {/* Right mockup image */}
          <div className="management-right-image">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop"
              alt="Hassle-Free Property Management"
              className="mgt-house-img"
            />
          </div>

        </div>
      </section>

      {/* 9. Our Happy Customers (Testimonials) Block */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="sr-section-header">Our Happy Customers</h2>

          <div className="testimonials-grid">

            <div className="testimonial-card">
              <div className="test-header">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" alt="Tamanna" className="test-avatar" />
                <div>
                  <h5>Tamanna Sharma</h5>
                  <p>Software Engineer</p>
                </div>
              </div>
              <p className="test-body-text">
                "Finding a shared flat near Hinjawadi Phase 1 was very quick. The app handled KYC approvals and agreements inside a single afternoon. Maintenance response is very prompt."
              </p>
            </div>

            <div className="testimonial-card">
              <div className="test-header">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="Amit" className="test-avatar" />
                <div>
                  <h5>Amit Sharma</h5>
                  <p>IT Specialist</p>
                </div>
              </div>
              <p className="test-body-text">
                "I listed my villa and found verified tenants in less than a week. The automated rent transfers are very helpful. S.R Rentals took care of all properties repairs."
              </p>
            </div>

            <div className="testimonial-card">
              <div className="test-header">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100" alt="Priya" className="test-avatar" />
                <div>
                  <h5>Priya Patel</h5>
                  <p>UX Designer</p>
                </div>
              </div>
              <p className="test-body-text">
                "Clean spaces, zero brokerage, and easy digital documentation. I would recommend this to anyone relocating to Pune. The map view helps locate tech parks easily."
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 10. Find your tribe, live your life Block */}
      <section className="find-tribe-section">
        <div className="container">
          <div className="tribe-box-callout">
            <div className="tribe-text-block">
              <h2>Find your tribe, live your life</h2>
              <p>Discover co-living spaces designed for the modern working professional. Share spaces, make friendships, and enjoy community social meetups.</p>
              <Link href="/listings?propertyType=pg" className="btn btn-solid-blue">
                Find Shared PG Rooms
              </Link>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&auto=format&fit=crop"
              alt="Co-living Community"
              className="tribe-img"
            />
          </div>
        </div>
      </section>

      {/* 11. Footer City Links Index Block */}
      <section className="footer-links-index-section">
        <div className="container">
          <div className="footer-links-grid">
            <div>
              <h5>Rent Houses in Pune</h5>
              <ul>
                <li><Link href="/listings?location=Hinjawadi">Hinjawadi Infotech Park</Link></li>
                <li><Link href="/listings?location=Phase+1">Hinjawadi Phase 1</Link></li>
                <li><Link href="/listings?location=Phase+2">Hinjawadi Phase 2</Link></li>
                <li><Link href="/listings?location=Phase+3">Hinjawadi Phase 3</Link></li>
              </ul>
            </div>
            <div>
              <h5>Rent Rooms in Pune</h5>
              <ul>
                <li><Link href="/listings?propertyType=pg&location=Hinjawadi">Shared Rooms Hinjawadi</Link></li>
                <li><Link href="/listings?propertyType=pg&location=Phase+1">PG Rooms Phase 1</Link></li>
                <li><Link href="/listings?propertyType=pg&location=Phase+2">Bachelors PG Phase 2</Link></li>
                <li><Link href="/listings?propertyType=pg&location=Hills">Co-living Hinjawadi Hills</Link></li>
              </ul>
            </div>
            <div>
              <h5>Popular Localities</h5>
              <ul>
                <li><Link href="/listings?location=Chowk">Hinjawadi Chowk</Link></li>
                <li><Link href="/listings?location=Phase+1">Embassy TechZone</Link></li>
                <li><Link href="/listings?location=Phase+3">Quadron Business Park</Link></li>
                <li><Link href="/listings?location=Hills">Megapolis Enclave</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
