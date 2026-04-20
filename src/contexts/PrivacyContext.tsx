import React, { useState, useEffect } from 'react';
import { PrivacyContext } from './PrivacyContextDefinition';

export const PrivacyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hideValues, setHideValues] = useState(() => {
    return localStorage.getItem('nexus_hide_values') === 'true';
  });

  const toggleHideValues = () => {
    setHideValues(prev => {
      const newVal = !prev;
      localStorage.setItem('nexus_hide_values', String(newVal));
      return newVal;
    });
  };

  useEffect(() => {
    // Also add a class to body so we can use CSS to blur certain elements globally if needed
    if (hideValues) {
      document.body.classList.add('hide-values');
    } else {
      document.body.classList.remove('hide-values');
    }
  }, [hideValues]);

  // Sync across tabs
  useEffect(() => {
    const handleStorage = () => {
      setHideValues(localStorage.getItem('nexus_hide_values') === 'true');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <PrivacyContext.Provider value={{ hideValues, toggleHideValues }}>
      {children}
    </PrivacyContext.Provider>
  );
};
