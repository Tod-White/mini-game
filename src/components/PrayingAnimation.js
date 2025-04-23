import React, { useEffect, useState } from 'react';
import './PrayingAnimation.css';

const PrayingAnimation = ({ onComplete }) => {
  const [particles, setParticles] = useState([]);
  
  // Create celebratory particles on mount
  useEffect(() => {
    const particleCount = 30;
    const newParticles = [];
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100, // random position across screen (%)
        y: Math.random() * 100,
        size: 10 + Math.random() * 20,
        speed: 1 + Math.random() * 3,
        color: getRandomColor(),
        delay: Math.random() * 1.5
      });
    }
    
    setParticles(newParticles);
    
    // Call the completion callback after animation
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 4000); // Animation lasts 4 seconds
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  // Get a random celebratory color
  const getRandomColor = () => {
    const colors = [
      '#FFD700', // Gold
      '#FF6B6B', // Red
      '#4ECDC4', // Teal
      '#9B5DE5', // Purple
      '#F15BB5', // Pink
      '#00BBF9', // Blue
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  return (
    <div className="praying-animation">
      <div className="celebration-message">
        <span>Congratulations!</span>
        <p>You received 10,000 KARMA</p>
      </div>
      
      {particles.map(particle => (
        <div
          key={particle.id}
          className="celebration-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            animationDuration: `${2 + particle.speed}s`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export default PrayingAnimation; 