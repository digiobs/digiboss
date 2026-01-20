import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PreAuthContextType {
  isPreAuthenticated: boolean;
  preLogin: (username: string, password: string) => boolean;
  preLogout: () => void;
}

const PreAuthContext = createContext<PreAuthContextType | undefined>(undefined);

const PRE_AUTH_KEY = 'digiobs_pre_auth';
const VALID_USERNAME = 'user';
const VALID_PASSWORD = 'user22';

export function PreAuthProvider({ children }: { children: ReactNode }) {
  const [isPreAuthenticated, setIsPreAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem(PRE_AUTH_KEY) === 'true';
  });

  const preLogin = (username: string, password: string): boolean => {
    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      sessionStorage.setItem(PRE_AUTH_KEY, 'true');
      setIsPreAuthenticated(true);
      return true;
    }
    return false;
  };

  const preLogout = () => {
    sessionStorage.removeItem(PRE_AUTH_KEY);
    setIsPreAuthenticated(false);
  };

  return (
    <PreAuthContext.Provider value={{ isPreAuthenticated, preLogin, preLogout }}>
      {children}
    </PreAuthContext.Provider>
  );
}

export function usePreAuth() {
  const context = useContext(PreAuthContext);
  if (context === undefined) {
    throw new Error('usePreAuth must be used within a PreAuthProvider');
  }
  return context;
}
