import { useContext } from 'react';
import { PrivacyContext } from '../contexts/PrivacyContextDefinition';

export const usePrivacy = () => {
    const context = useContext(PrivacyContext);
    if (context === undefined) {
        throw new Error('usePrivacy must be used within a PrivacyProvider');
    }
    return context;
};
