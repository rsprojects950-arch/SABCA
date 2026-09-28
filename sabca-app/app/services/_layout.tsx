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

            <Stack.Screen name="membership/register" options={{ title: 'Member Registration' }} />
            <Stack.Screen name="membership/id-card" options={{ title: 'Digital ID Card' }} />

            <Stack.Screen name="training/index" options={{ title: 'Training & Development' }} />
            <Stack.Screen name="training/[id]" options={{ title: 'Course Details' }} />

            <Stack.Screen name="legal/index" options={{ title: 'Legal Support' }} />
        </Stack>
    );
}
