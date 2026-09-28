export const Colors = {
    light: {
        text: '#1F2937', // Primary Text
        background: '#F4F6F8', // Main Background
        tint: '#E53935', // Primary Red as tint
        icon: '#6B7280', // Secondary Text/Icon
        tabIconDefault: '#9CA3AF', // Inactive Tab
        tabIconSelected: '#E53935', // Active Tab (start of gradient)

        // Brand Colors
        primary: '#E53935', // Primary Red
        secondary: '#8E44AD', // Brand Purple
        tertiary: '#3B82F6', // Brand Blue

        // UI Elements
        card: '#FFFFFF',
        inputBackground: '#F1F3F5',
        border: '#E0E0E0',
        inputBorder: '#E5E7EB',
        inputFocus: '#8E44AD',

        // Status
        success: '#22C55E',
        warning: '#F97316',
        error: '#EF4444',
        notification: '#FACC15', // Yellow dot

        // Community Actions
        like: '#EF4444',
        comment: '#3B82F6',
        share: '#6B7280',

        // Grievance Status
        grievance: {
            submitted: '#3B82F6',   // Blue
            underReview: '#8E44AD', // Purple
            inProgress: '#F97316',  // Orange
            resolved: '#22C55E',    // Green
            rejected: '#EF4444',    // Red
            escalated: '#EA580C',   // Dark Orange
        },

        glass: 'rgba(255, 255, 255, 0.8)',
        glassBorder: 'rgba(255, 255, 255, 0.4)',
        shadow: '#000000',
    },
    dark: {
        text: '#F1F5F9',
        background: '#111214', // Deeper rich black as requested
        tint: '#E53935',
        icon: '#9CA3AF',
        tabIconDefault: '#6B7280',
        tabIconSelected: '#E53935',

        primary: '#E53935',
        secondary: '#8E44AD',
        tertiary: '#3B82F6',

        card: '#1C1D21', // Slightly lighter than background for contrast
        inputBackground: '#2A2C32',
        border: '#374151',
        inputBorder: '#374151',
        inputFocus: '#A855F7',

        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        notification: '#FEF08A',

        like: '#F87171',
        comment: '#60A5FA',
        share: '#94A3B8',

        glass: 'rgba(17, 18, 20, 0.6)',
        glassBorder: 'rgba(255, 255, 255, 0.1)',
        grievance: {
            submitted: '#3B82F6',
            underReview: '#8E44AD',
            inProgress: '#F97316',
            resolved: '#22C55E',
            rejected: '#EF4444',
            escalated: '#EA580C',
        },
        shadow: '#000000',
    },
    gradients: {
        primary: ['#E53935', '#8E44AD', '#3B82F6'] as const, // Red -> Purple -> Blue (Brand Gradient)
        button: ['#E53935', '#3B82F6'] as const, // Red -> Blue (CTA)
        membership: ['#E53935', '#8E44AD'] as const, // Red -> Purple
        training: ['#F97316', '#FB923C'] as const, // Orange -> Light Orange
        legal: ['#14B8A6', '#10B981'] as const, // Teal -> Green
        tabActive: ['#E53935', '#3B82F6'] as const, // Red -> Blue
    }
};
