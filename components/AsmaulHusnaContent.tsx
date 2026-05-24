import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

import { Colors, Radius, Shadow } from '../constants/theme';
import GeoPattern from './ui/GeoPattern';
import Card from './ui/Card';
import { ASMAUL_HUSNA } from '../constants/dzikirData';

export default function AsmaulHusnaContent() {
  // Show first 12 in the grid, with a "lihat semua" button
  const preview = ASMAUL_HUSNA.slice(0, 12);

  return (
    <View style={s.root}>
      {/* Hero */}
      <LinearGradient
        colors={[Colors.primaryDeep, Colors.primary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.hero}
      >
        <GeoPattern color="#fff" opacity={0.08} size={70} />
        <View style={{ alignItems: 'center' }}>
          <Text style={s.heroSub}>99 NAMA ALLAH</Text>
          <Text style={s.heroArab}>ٱلرَّحْمَٰن</Text>
          <Text style={s.heroLatin}>Ar-Rahman</Text>
          <Text style={s.heroMeaning}>Yang Maha Pengasih</Text>
          <TouchableOpacity
            style={s.playAllBtn}
            onPress={() => router.push('/asmaul-husna')}
          >
            <Ionicons name="play" size={12} color="#fff" />
            <Text style={s.playAllText}>Lihat Semua 99 Nama</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Grid */}
      <View style={s.grid}>
        {preview.map((a) => (
          <TouchableOpacity
            key={a.n}
            style={s.cell}
            activeOpacity={0.8}
            onPress={() => router.push('/asmaul-husna')}
          >
            <Card pad={12} radius={14} style={s.card}>
              <Text style={s.num}>{String(a.n).padStart(2, '0')}</Text>
              <Text style={s.arab}>{a.arab}</Text>
              <Text style={s.latin}>{a.latin}</Text>
              <Text style={s.meaning}>{a.meaning}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* View all */}
      <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/asmaul-husna')}>
        <Text style={s.viewAllText}>Lihat Semua 99 Asmaul Husna</Text>
        <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  hero: {
    borderRadius: 22, padding: 20, overflow: 'hidden', marginBottom: 14,
  },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  heroArab: { fontFamily: 'serif', fontSize: 52, color: Colors.gold, marginTop: 6, lineHeight: 60 },
  heroLatin: { fontSize: 22, color: '#fff', fontWeight: '400', marginTop: 6 },
  heroMeaning: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  playAllBtn: {
    marginTop: 16, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  playAllText: { fontSize: 12, fontWeight: '600', color: '#fff' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '47%' },
  card: { alignItems: 'center' },
  num: { fontSize: 10, color: Colors.ink3, fontWeight: '600' },
  arab: { fontFamily: 'serif', fontSize: 22, color: Colors.primary, writingDirection: 'rtl', marginTop: 4, lineHeight: 32, minHeight: 30 },
  latin: { fontSize: 12, fontWeight: '600', color: Colors.ink, marginTop: 6 },
  meaning: { fontSize: 10.5, color: Colors.ink3, marginTop: 2, textAlign: 'center' },

  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginTop: 12, padding: 14, borderRadius: 14,
    backgroundColor: Colors.primarySoft,
  },
  viewAllText: { fontSize: 13.5, fontWeight: '600', color: Colors.primary },
});
