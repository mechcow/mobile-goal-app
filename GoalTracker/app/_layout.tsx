import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dashboard', headerShown: false }} />
      <Stack.Screen name="goals" options={{ title: 'Set Goals' }} />
      <Stack.Screen name="goals-summary" options={{ title: 'Goal Summary' }} />
      <Stack.Screen name="initial-measurements" options={{ title: 'Initial Progress Tracking' }} />
      <Stack.Screen name="goal-detail" options={{ title: 'Goal Details', headerShown: false }} />
    </Stack>
  );
}
