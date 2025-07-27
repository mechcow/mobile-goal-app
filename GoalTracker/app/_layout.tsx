import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Goal Tracker' }} />
      <Stack.Screen name="goals" options={{ title: 'Set Goals' }} />
      <Stack.Screen name="goals-summary" options={{ title: 'Goal Summary' }} />
    </Stack>
  );
}
