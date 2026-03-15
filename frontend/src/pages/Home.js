import React from 'react';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1 className="main-title">Welcome to Event Management System</h1>
        <p className="sub-title">
          Your one-stop platform for campus events, club activities, 
          and community gatherings
        </p>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stat-card">
          <span className="stat-icon">📅</span>
          <h3>5+</h3>
          <p>Events Hosted</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <h3>5+</h3>
          <p>Active Members</p>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🏆</span>
          <h3>15+</h3>
          <p>Clubs</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2>What People Say</h2>
        <div className="testimonials">
          <div className="testimonial-card">
            <p>"Great platform! Found all my campus events here."</p>
            <span>- Shambhavi, Student</span>
          </div>
          <div className="testimonial-card">
            <p>"Easy to organize club activities through this."</p>
            <span>- Sarah, Club President</span>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;