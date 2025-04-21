import React, { useEffect } from 'react';
import './PrayingAnimation.css';

const PrayingAnimation = ({ onComplete }) => {
  // Directly call the completion callback, no animation displayed
  useEffect(() => {
    // Simple delay before triggering the callback
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 500); // Using a short delay to ensure smooth state updates
    
    return () => clearTimeout(timer);
  }, [onComplete]);
  
  // Return an empty div, no content displayed
  return (
    <div className="praying-animation"></div>
  );
};

export default PrayingAnimation; 