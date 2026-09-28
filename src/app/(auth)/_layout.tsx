/**
 * Unauthenticated flow. Exists as its own stack so sign-up, OTP entry and
 * password recovery can be added as sibling files here without touching the
 * root navigator or the protected side of the app.
 */
import { Stack } from 'expo-router';

export const unstable_settings = {
  anchor: 'index',
};

export default function AuthLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }} />
    </>
  );
}
