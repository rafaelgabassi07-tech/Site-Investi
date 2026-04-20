import React, { createContext } from 'react';

export interface PrivacyContextType {
  hideValues: boolean;
  toggleHideValues: () => void;
}

export const PrivacyContext = createContext<PrivacyContextType>({
  hideValues: false,
  toggleHideValues: () => {},
});
