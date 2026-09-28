/**
 * Catches deep links to routes that no longer exist (an old push notification,
 * a shortened marketing link). Without this the app shows a bare error screen.
 * `/` resolves to the login screen when signed out and to Home when signed in,
 * so this is safe to reach in either state.
 */
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Font } from '@/constants/rightbank-theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>This page doesn&apos;t exist.</Text>
      <Link href="/" style={styles.link}>
        Back to RightBank
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 26,
    backgroundColor: '#FFFFFF',
  },
  title: { fontFamily: Font.bold, fontSize: 16, color: '#0B1220', textAlign: 'center' },
  link: { fontFamily: Font.semibold, fontSize: 13.5, color: '#EF4E23' },
});
