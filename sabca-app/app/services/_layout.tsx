import { Stack } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function ServicesLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.light.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen name="grievances/index" options={{ headerShown: false }} />
            <Stack.Screen name="grievances/create" options={{ headerShown: false }} />
            <Stack.Screen name="grievances/[id]" options={{ title: 'Grievance Details' }} />
            <Stack.Screen name="go-list" options={{ title: 'Government Orders' }} />
        </Stack>
    );
}
