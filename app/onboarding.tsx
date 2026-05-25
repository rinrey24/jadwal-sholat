import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors } from '../constants/theme';
import { markOnboardingDone } from '../services/storage';

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    icon:       'moon-outline'    as const,
    badge:      'Bismillah',
    accent:     '#C9A227',
    title:      'Selamat Datang',
    desc:       'Muslim App hadir sebagai panduan ibadah harian Anda — lengkap, akurat, dan mudah digunakan.',
    gradColors: ['#0F3520', '#1A5C3A', '#1F6B42'] as [string, string, string],
  },
  {
    icon:       'book-outline'    as const,
    badge:      "Iqra' — Bacalah!",
    accent:     '#6EC6A0',
    title:      "Al-Qur'an & Jadwal Sholat",
    desc:       "Baca Al-Qur'an lengkap dengan terjemahan Bahasa Indonesia. Pantau jadwal sholat akurat berdasarkan lokasi Anda.",
    gradColors: ['#0C2E3A', '#1A566A', '#1F6B7A'] as [string, string, string],
  },
  {
    icon:       'compass-outline' as const,
    badge:      'Allahu Akbar',
    accent:     '#A8D8A8',
    title:      'Kiblat, Dzikir & Doa',
    desc:       'Temukan arah kiblat, lengkapi ibadah dengan dzikir pagi-petang, tasbih digital, dan 99 Asmaul Husna.',
    gradColors: ['#1A2C0E', '#2D5A1B', '#336B20'] as [string, string, string],
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const slide  = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  // Slide-out → update state → slide-in
  function goTo(idx: number) {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 0,    duration: 180, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: -40,  duration: 180, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.94, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setCurrent(idx);
      slideAnim.setValue(50);
      scaleAnim.setValue(0.94);
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 200, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, damping: 22, stiffness: 200, useNativeDriver: true }),
      ]).start();
    });
  }

  async function finish() {
    await markOnboardingDone();
    router.replace('/(tabs)');
  }

  function next() {
    if (!isLast) goTo(current + 1);
    else finish();
  }

  return (
    <View style={[s.root, { backgroundColor: slide.gradColors[0] }]}>
      {/* Solid status bar — prevents icons turning black on Samsung */}
      <StatusBar barStyle="light-content" backgroundColor={slide.gradColors[0]} />

      {/* Gradient background — changes per slide */}
      <LinearGradient
        colors={slide.gradColors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Decorative circles */}
      <View style={s.circleTopRight} />
      <View style={s.circleBottomLeft} />

      {/* Skip button (hidden on last slide) */}
      {!isLast && (
        <TouchableOpacity
          style={s.skipBtn}
          onPress={finish}
          activeOpacity={0.7}
        >
          <Text style={s.skipText}>Lewati</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      )}

      {/* ── Main animated content ── */}
      <Animated.View
        style={[
          s.content,
          { paddingTop: 24, opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
        ]}
      >
        {/* Decorative badge */}
        <View style={[s.badge, { borderColor: slide.accent + '60' }]}>
          <Text style={[s.badgeText, { color: slide.accent }]}>✦ {slide.badge} ✦</Text>
        </View>

        {/* Icon halo */}
        <View style={s.iconHalo}>
          <View style={[s.iconRing, { borderColor: slide.accent + '30' }]} />
          <View style={[s.iconCircle, { backgroundColor: slide.accent + '28', borderColor: slide.accent + '55' }]}>
            <Ionicons name={slide.icon} size={56} color={slide.accent} />
          </View>
        </View>

        {/* Title */}
        <Text style={s.title}>{slide.title}</Text>

        {/* Description */}
        <Text style={s.desc}>{slide.desc}</Text>
      </Animated.View>

      {/* ── Bottom section (always visible) ── */}
      <View style={[s.bottom, { paddingBottom: insets.bottom + 24 }]}>
        {/* Dot indicators */}
        <View style={s.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)} activeOpacity={0.7}>
              <Animated.View
                style={[
                  s.dot,
                  i === current
                    ? s.dotActive
                    : s.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA button */}
        <TouchableOpacity style={s.ctaBtn} onPress={next} activeOpacity={0.88}>
          <LinearGradient
            colors={[Colors.gold, '#E0A820']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.ctaBtnGrad}
          >
            <Text style={s.ctaBtnText}>
              {isLast ? 'Mulai Sekarang' : 'Selanjutnya'}
            </Text>
            <View style={s.ctaIconWrap}>
              <Ionicons
                name={isLast ? 'checkmark' : 'arrow-forward'}
                size={18}
                color={Colors.primaryDeep}
              />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={s.footerText}>Muslim App · Gratis &amp; Selamanya</Text>
      </View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1 },

  // Decorative background blobs
  circleTopRight: {
    position: 'absolute', top: -80, right: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  circleBottomLeft: {
    position: 'absolute', bottom: 80, left: -100,
    width: 280, height: 280, borderRadius: 140,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },

  skipBtn: {
    position: 'absolute', top: 14, right: 22,
    flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
  },
  skipText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },

  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  badge: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginBottom: 32,
  },
  badgeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.95)',
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  iconHalo: {
    width: 170, height: 170,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 36,
  },
  iconRing: {
    position: 'absolute',
    width: 170, height: 170, borderRadius: 85,
    borderWidth: 1.5,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  iconCircle: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 24,
    elevation: 12,
  },

  title: {
    fontSize: 28, fontWeight: '700',
    color: '#fff', textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  desc: {
    marginTop: 14,
    fontSize: 15, color: 'rgba(255,255,255,0.72)',
    textAlign: 'center', lineHeight: 24,
  },

  bottom: {
    paddingHorizontal: 28,
    alignItems: 'center',
    gap: 16,
  },
  dots: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
  },
  dot: {
    borderRadius: 4, height: 8,
  },
  dotActive: {
    width: 28, backgroundColor: Colors.gold,
  },
  dotInactive: {
    width: 8, backgroundColor: 'rgba(255,255,255,0.3)',
  },

  ctaBtn: {
    width: '100%',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: Colors.gold, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  ctaBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, paddingHorizontal: 28, gap: 10,
  },
  ctaBtnText: {
    fontSize: 16, fontWeight: '700', color: Colors.primaryDeep,
    letterSpacing: -0.2,
  },
  ctaIconWrap: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  footerText: {
    fontSize: 12, color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },
});
