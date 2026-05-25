import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { setupNotificationHandler } from '../services/notifications';

// ─── Production Error Boundary ───────────────────────────────────────────────
// In Hermes production builds, React errors crash silently.
// This boundary catches them and shows the stack trace so we can debug.
interface EBState { hasError: boolean; error: Error | null }
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, EBState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('=== APP CRASH ===', error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message ?? 'Unknown error';
      const stack = this.state.error?.stack ?? '';
      return (
        <View style={eb.root}>
          <Text style={eb.title}>App Error (Debug Mode)</Text>
          <Text style={eb.msg}>{msg}</Text>
          <ScrollView style={eb.scroll}>
            <Text style={eb.stack}>{stack}</Text>
          </ScrollView>
          <TouchableOpacity
            style={eb.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
          >
            <Text style={eb.btnTxt}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const eb = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0C1E12', padding: 24, paddingTop: 60 },
  title: { fontSize: 18, fontWeight: '700', color: '#F87171', marginBottom: 12 },
  msg: { fontSize: 14, color: '#FCA5A5', marginBottom: 16, lineHeight: 22 },
  scroll: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 12 },
  stack: { fontSize: 11, color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace', lineHeight: 18 },
  btn: { marginTop: 20, padding: 14, backgroundColor: '#2D7A5E', borderRadius: 14, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '600', fontSize: 14 },
});

// ─── Root Layout ─────────────────────────────────────────────────────────────
export default function RootLayout() {
  useEffect(() => {
    setupNotificationHandler();
  }, []);

  return (
    <ErrorBoundary>
      {/* Default: dark icons for light/white backgrounds.
          Screens with dark headers override this with style="light". */}
      <StatusBar style="dark" backgroundColor="transparent" translucent />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Splash router — checks onboarding status, redirects immediately */}
        <Stack.Screen name="index"      options={{ headerShown: false, animation: 'none' }} />
        {/* Onboarding — shown only on first launch */}
        <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)"     options={{ headerShown: false }} />
        <Stack.Screen
          name="prayer-schedule"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="quran-reader"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="calendar"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="dzikir-detail"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="asmaul-husna"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="tasbih"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="monthly-schedule"
          options={{ headerShown: false, animation: 'slide_from_right' }}
        />
      </Stack>
    </ErrorBoundary>
  );
}
