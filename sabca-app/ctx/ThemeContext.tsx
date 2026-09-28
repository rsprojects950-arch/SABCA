import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

type ThemeContextType = {
    theme: Theme;
    colors: typeof Colors.light;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
    theme: 'light',
    colors: Colors.light,
    toggleTheme: () => { },
    setTheme: () => { },
    isDark: false,
});

export const useTheme = () => useContext(ThemeContext);

const THEME_KEY = 'APP_THEME';

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const systemScheme = useColorScheme();
    const [theme, setThemeState] = useState<Theme>(systemScheme === 'dark' ? 'dark' : 'light');
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Load saved theme preference
        AsyncStorage.getItem(THEME_KEY).then(savedTheme => {
            if (savedTheme === 'light' || savedTheme === 'dark') {
                setThemeState(savedTheme);
            } else if (systemScheme) {
                setThemeState(systemScheme);
            }
            setIsLoaded(true);
        });
    }, []);

    // Listen for system theme changes if no preference is saved
    useEffect(() => {
        if (!isLoaded) return;
        // Only update if user hasn't manually overridden (logic could be refined)
        // For now, let's keep it simple: manual override sticks, otherwise system
        // But checking if manual override exists is tricky without another state.
        // Let's just trust the initial load for now.
    }, [systemScheme]);

    const setTheme = async (newTheme: Theme) => {
        setThemeState(newTheme);
        await AsyncStorage.setItem(THEME_KEY, newTheme);
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    const value = {
        theme,
        colors: Colors[theme],
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
    };

    if (!isLoaded) return null; // Or a splash screen

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};
