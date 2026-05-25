import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { isOnboardingDone } from '../services/storage';
import { Colors } from '../constants/theme';

/**
 * Root index — acts as a silent splash screen.
 * Checks AsyncStorage once, then immediately replaces itself with
 * either the onboarding flow or the main tabs (no back-stack entry).
 */
export default function SplashIndex() {
  useEffect(() => {
    // Wrap in try/catch — unhandled Promise rejections are fatal in
    // Hermes production builds and will silently close the app.
    isOnboardingDone()
      .then((done) => {
        router.replace(done ? '/(tabs)' : '/onboarding');
      })
      .catch((err) => {
        console.error('Startup navigation error:', err);
        // Fall back to onboarding so the user sees something
        router.replace('/onboarding');
      });
  }, []);

  return (
    <LinearGradient
      colors={[Colors.primaryDeep, Colors.primary]}
      style={s.root}
    >
      <Ionicons name="moon" size={64} color="rgba(255,255,255,0.85)" />
      <Text style={s.appName}>Muslim App</Text>
      <Text style={s.tagline}>Panduan Ibadah Harian</Text>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  appName: { fontSize: 30, fontWeight: '700', color: '#fff', marginTop: 16, letterSpacing: -0.5 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.65)', fontWeight: '400' },
});
