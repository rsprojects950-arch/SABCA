import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../lib/i18n';

type Language = 'en' | 'te';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');

    useEffect(() => {
        // Load persisted language
        const loadLanguage = async () => {
            try {
                const savedLanguage = await AsyncStorage.getItem('user-language');
                if (savedLanguage === 'en' || savedLanguage === 'te') {
                    setLanguageState(savedLanguage);
                    i18n.changeLanguage(savedLanguage);
                }
            } catch (error) {
                console.error('Failed to load language:', error);
            }
        };

        loadLanguage();
    }, []);

    const setLanguage = async (lang: Language) => {
        try {
            await AsyncStorage.setItem('user-language', lang);
            setLanguageState(lang);
            i18n.changeLanguage(lang);
        } catch (error) {
            console.error('Failed to save language:', error);
        }
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
