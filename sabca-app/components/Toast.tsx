import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react-native';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onHide }) => {
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.timing(opacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.delay(3000),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => onHide());
    }, []);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={24} color="#FFF" />;
            case 'error': return <XCircle size={24} color="#FFF" />;
            case 'info': default: return <Info size={24} color="#FFF" />;
        }
    };

    const getBackgroundColor = () => {
        switch (type) {
            case 'success': return '#10B981';
            case 'error': return '#EF4444';
            case 'info': default: return '#3B82F6';
        }
    };

    return (
        <Animated.View style={[styles.container, { opacity, backgroundColor: getBackgroundColor() }]}>
            {getIcon()}
            <Text style={styles.message}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 50,
        left: 20,
        right: 20,
        backgroundColor: '#333',
        padding: 16,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 9999,
    },
    message: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
});
