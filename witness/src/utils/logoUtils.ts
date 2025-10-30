import { useState, useEffect } from 'react';
import logoOld from '../assets/logo-old.PNG';
import logoYoung from '../assets/logo-young.PNG';

/**
 * Returns a randomly selected logo from the available logo options
 * @returns {string} The path to a randomly selected logo
 */
export const getRandomLogo = (): string => {
  const logos: string[] = [logoOld, logoYoung];
  return logos[Math.floor(Math.random() * logos.length)];
};

/**
 * Hook for using a random logo in React components
 * Returns the logo path that was randomly selected on component mount
 * @returns {string} The path to a randomly selected logo
 */
export const useRandomLogo = (): string => {
  const [logo, setLogo] = useState<string>(logoOld);

  useEffect(() => {
    setLogo(getRandomLogo());
  }, []);

  return logo;
};

// Export individual logos for cases where specific logos are needed
export { logoOld, logoYoung };
