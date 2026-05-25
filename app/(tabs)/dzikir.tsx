import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius, Shadow } from '../../constants/theme';
import GeoPattern from '../../components/ui/GeoPattern';
import Card from '../../components/ui/Card';
import { DOA_HARIAN, ASMAUL_HUSNA } from '../../constants/dzikirData';
import TasbihContent from '../../components/TasbihContent';
import AsmaulHusnaContent from '../../components/AsmaulHusnaContent';

type TabId = 'dzikir' | 'doa' | 'tasbih' | 'asma';

const DZIKIR_CATS = [
  { id: 'pagi', emoji: '🌅', label: 'Dzikir Pagi', sub: "Al-Ma'tsurat · 22 dzikir", time: 'Subuh – Dzuhur' },
  { id: 'petang', emoji: '🌆', label: 'Dzikir Petang', sub: "Al-Ma'tsurat · 22 dzikir", time: 'Ashar – Maghrib', highlight: true },
  { id: 'tidur', emoji: '🌙', label: 'Sebelum Tidur', sub: '15 dzikir', time: 'Malam' },
  { id: 'sholat', emoji: '🕌', label: 'Setelah Sholat', sub: '7 dzikir', time: 'Setiap sholat' },
  { id: 'umum', emoji: '📿', label: 'Dzikir Umum', sub: '40 dzikir pilihan', time: 'Kapan saja' },
];

export default function DzikirScreen() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('dzikir');

  const nowHour = new Date().getHours();
  const isAfternoon = nowHour >= 15 && nowHour < 18;
  const featuredLabel = isAfternoon ? 'Dzikir Petang' : nowHour < 11 ? 'Dzikir Pagi' : 'Dzikir Petang';
  const featuredId = isAfternoon ? 'petang' : nowHour < 11 ? 'pagi' : 'petang';

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dzikir', label: 'Dzikir' },
    { id: 'doa', label: 'Doa Harian' },
    { id: 'tasbih', label: 'Tasbih' },
    { id: 'asma', label: 'Asmaul Husna' },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Dzikir & Doa</Text>
        <TouchableOpacity style={s.iconBtn}>
          <Ionicons name="search-outline" size={20} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Hero card */}
        <View style={s.px}>
          <LinearGradient
            colors={['#C2773F', '#8C4A2A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.heroCard}
          >
            <GeoPattern color="#fff" opacity={0.07} size={70} />
            <View style={s.heroRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.heroSub}>SESUAI WAKTU</Text>
                <Text style={s.heroTitle}>{featuredLabel}</Text>
                <Text style={s.heroDesc}>22 dzikir · ±10 menit</Text>
              </View>
              <View style={s.heroIconBox}>
                <Ionicons name="partly-sunny-outline" size={24} color="#fff" />
              </View>
            </View>
            <TouchableOpacity
              style={s.heroBtn}
              onPress={() => router.push({ pathname: '/dzikir-detail', params: { id: featuredId } })}
            >
              <Text style={s.heroBtnText}>Mulai · 0 / 22</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabScroll}
          contentContainerStyle={s.tabContent}
        >
          {tabs.map((t) => (
            <TouchableOpacity
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[s.tabBtn, tab === t.id && s.tabBtnActive]}
            >
              <Text style={[s.tabLabel, tab === t.id && s.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab content */}
        {tab === 'dzikir' && (
          <View style={[s.px, { gap: 10 }]}>
            {DZIKIR_CATS.map((c) => (
              <TouchableOpacity
                key={c.id}
                activeOpacity={0.8}
                onPress={() => router.push({ pathname: '/dzikir-detail', params: { id: c.id } })}
              >
                <Card
                  pad={14}
                  radius={18}
                  style={[
                    s.dzikirCard,
                    c.highlight ? { borderColor: Colors.primary, borderWidth: 1 } : {},
                  ]}
                >
                  <View style={s.dzikirEmojiBox}>
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.dzikirLabel}>{c.label}</Text>
                    <Text style={s.dzikirMeta}>{c.sub} · {c.time}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.ink3} />
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {tab === 'doa' && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            {Array.from({ length: Math.ceil(DOA_HARIAN.length / 2) }).map((_, rowIdx) => {
              const pair = DOA_HARIAN.slice(rowIdx * 2, rowIdx * 2 + 2);
              return (
                <View key={rowIdx} style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  {pair.map((d) => (
                    <TouchableOpacity
                      key={d.id}
                      style={{ flex: 1 }}
                      activeOpacity={0.8}
                      onPress={() => router.push({ pathname: '/dzikir-detail', params: { id: d.id } })}
                    >
                      <Card pad={14} radius={16} style={s.doaCard}>
                        <Text style={{ fontSize: 24 }}>{d.icon}</Text>
                        <Text style={s.doaLabel}>{d.label}</Text>
                        <Text style={s.doaCount}>{d.count} doa</Text>
                      </Card>
                    </TouchableOpacity>
                  ))}
                  {pair.length === 1 && <View style={{ flex: 1 }} />}
                </View>
              );
            })}
          </View>
        )}

        {tab === 'tasbih' && <TasbihContent />}
        {tab === 'asma' && <AsmaulHusnaContent />}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  px: { paddingHorizontal: 16, paddingTop: 8 },

  heroCard: { borderRadius: 22, padding: 18, overflow: 'hidden', marginBottom: 4 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  heroSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  heroTitle: { fontSize: 24, color: '#fff', fontWeight: '400', marginTop: 4 },
  heroDesc: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  heroIconBox: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroBtn: { marginTop: 16, padding: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: '#fff', alignSelf: 'flex-start' },
  heroBtnText: { fontSize: 12.5, fontWeight: '700', color: '#8C4A2A' },

  tabScroll: { flexGrow: 0 },
  tabContent: { paddingHorizontal: 16, paddingVertical: 14, gap: 6 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.chip },
  tabBtnActive: { backgroundColor: Colors.primary },
  tabLabel: { fontSize: 12.5, fontWeight: '600', color: Colors.ink2 },
  tabLabelActive: { color: '#fff' },

  dzikirCard: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dzikirEmojiBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  dzikirLabel: { fontSize: 14.5, fontWeight: '600', color: Colors.ink },
  dzikirMeta: { fontSize: 11.5, color: Colors.ink3, marginTop: 2 },

  doaCard: { gap: 8, minHeight: 110, justifyContent: 'space-between' },
  doaLabel: { fontSize: 13, fontWeight: '600', color: Colors.ink },
  doaCount: { fontSize: 11, color: Colors.ink3 },
});
