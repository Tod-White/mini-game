import React, { useEffect, useState } from 'react';
import './BackgroundParticles.css';

const BackgroundParticles = () => {
  const [particles, setParticles] = useState([]);
  
  useEffect(() => {
    // Create background particles
    const particlesCount = 30;
    const newParticles = [];
    
    for (let i = 0; i < particlesCount; i++) {
      newParticles.push({
        id: i,
        size: Math.random() * 6 + 2,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 15,
        opacity: Math.random() * 0.4 + 0.1
      });
    }
    
    setParticles(newParticles);
  }, []);
  
  return (
    <div className="background-particles">
      {particles.map((particle) => (
        <div 
          key={particle.id}
          className="particle"
          style={{
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            opacity: particle.opacity,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundParticles;