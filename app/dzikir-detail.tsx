import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { Colors, Radius } from '../constants/theme';
import { DZIKIR_PAGI, DZIKIR_PETANG, DZIKIR_SETELAH_SHOLAT, DzikirItem } from '../constants/dzikirData';
import { saveDzikirProgress, getDzikirProgress } from '../services/storage';

const DATA: Record<string, { title: string; items: DzikirItem[] }> = {
  pagi: { title: 'Dzikir Pagi', items: DZIKIR_PAGI },
  petang: { title: 'Dzikir Petang', items: DZIKIR_PETANG },
  sholat: { title: 'Dzikir Setelah Sholat', items: DZIKIR_SETELAH_SHOLAT },
  tidur: { title: 'Dzikir Sebelum Tidur', items: DZIKIR_PAGI.slice(0, 3) },
  umum: { title: 'Dzikir Umum', items: [...DZIKIR_PAGI, ...DZIKIR_PETANG] },
};

export default function DzikirDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const catId = id ?? 'pagi';
  const cat = DATA[catId] ?? DATA.pagi;

  const [counts, setCounts] = useState<Record<number, number>>({});
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Initialize counts
    const init: Record<number, number> = {};
    cat.items.forEach((item) => { init[item.id] = 0; });
    setCounts(init);
  }, [catId]);

  function tap(item: DzikirItem) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCounts((prev) => {
      const next = Math.min((prev[item.id] ?? 0) + 1, item.count);
      return { ...prev, [item.id]: next };
    });
  }

  function reset() {
    const init: Record<number, number> = {};
    cat.items.forEach((item) => { init[item.id] = 0; });
    setCounts(init);
  }

  const doneCount = cat.items.filter((item) => (counts[item.id] ?? 0) >= item.count).length;
  const progress = cat.items.length > 0 ? doneCount / cat.items.length : 0;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{cat.title}</Text>
          <Text style={s.headerSub}>{doneCount} dari {cat.items.length} dzikir</Text>
        </View>
        <TouchableOpacity onPress={reset} style={s.resetBtn}>
          <Ionicons name="refresh-outline" size={18} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={s.progBg}>
        <View style={[s.progFill, { width: `${progress * 100}%` }]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        {cat.items.map((item, idx) => {
          const c = counts[item.id] ?? 0;
          const done = c >= item.count;
          const open = expanded[item.id];

          return (
            <View key={item.id} style={[s.itemCard, done && s.itemCardDone]}>
              {/* Number badge */}
              <View style={[s.numBadge, done && { backgroundColor: Colors.primary }]}>
                {done
                  ? <Ionicons name="checkmark" size={14} color="#fff" />
                  : <Text style={s.numText}>{idx + 1}</Text>
                }
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                {/* Arabic */}
                <Text style={s.arabicText}>{item.arab}</Text>

                {/* Transliteration */}
                <Text style={s.translit}>{item.translit}</Text>

                {/* Translation */}
                <Text style={s.translation}>{item.translation}</Text>

                {/* Virtue (collapsible) */}
                {item.virtue && (
                  <TouchableOpacity
                    style={s.virtueRow}
                    onPress={() => setExpanded((prev) => ({ ...prev, [item.id]: !open }))}
                  >
                    <Ionicons
                      name={open ? 'chevron-up' : 'chevron-down'}
                      size={12}
                      color={Colors.primary}
                    />
                    <Text style={s.virtueLabel}>Fadhilah</Text>
                  </TouchableOpacity>
                )}
                {open && item.virtue && (
                  <Text style={s.virtueText}>{item.virtue}</Text>
                )}

                {item.source && (
                  <Text style={s.source}>{item.source}</Text>
                )}

                {/* Counter row */}
                <View style={s.counterRow}>
                  <TouchableOpacity
                    style={[s.countBtn, done && s.countBtnDone]}
                    onPress={() => tap(item)}
                    disabled={done}
                    activeOpacity={0.8}
                  >
                    <Text style={[s.countBtnText, done && { color: '#fff' }]}>
                      {done ? '✓ Selesai' : `${c} / ${item.count}×`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Done overlay */}
      {progress >= 1 && (
        <View style={s.doneOverlay}>
          <Text style={s.doneEmoji}>🤲</Text>
          <Text style={s.doneTitle}>Alhamdulillah!</Text>
          <Text style={s.doneSub}>{cat.title} telah selesai</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
            <Text style={s.doneBtnText}>Kembali</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  resetBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.ink },
  headerSub: { fontSize: 12, color: Colors.ink3, marginTop: 2 },

  progBg: { height: 3, backgroundColor: Colors.chip },
  progFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  itemCard: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 16, paddingVertical: 18,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  itemCardDone: { backgroundColor: Colors.primarySoft + '80' },

  numBadge: {
    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
    backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  numText: { fontSize: 11.5, fontWeight: '600', color: Colors.ink2 },

  arabicText: {
    fontFamily: 'serif', fontSize: 22, textAlign: 'right',
    color: Colors.ink, lineHeight: 40, writingDirection: 'rtl',
  },
  translit: { marginTop: 6, fontSize: 12, fontStyle: 'italic', color: Colors.ink3, lineHeight: 18 },
  translation: { marginTop: 6, fontSize: 13.5, color: Colors.ink2, lineHeight: 22 },
  source: { marginTop: 4, fontSize: 11, color: Colors.ink3, fontStyle: 'italic' },

  virtueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  virtueLabel: { fontSize: 12, fontWeight: '600', color: Colors.primary },
  virtueText: { marginTop: 6, fontSize: 12.5, color: Colors.ink2, lineHeight: 20, fontStyle: 'italic', backgroundColor: Colors.primarySoft, padding: 10, borderRadius: 10 },

  counterRow: { marginTop: 12, alignItems: 'flex-end' },
  countBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.chip, borderWidth: 1, borderColor: Colors.line,
  },
  countBtnDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  countBtnText: { fontSize: 13, fontWeight: '600', color: Colors.ink },

  doneOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(15,40,30,0.9)',
    alignItems: 'center', justifyContent: 'center', gap: 12,
  } as any,
  doneEmoji: { fontSize: 56 },
  doneTitle: { fontSize: 28, fontWeight: '600', color: '#fff' },
  doneSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)' },
  doneBtn: { marginTop: 12, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.gold },
  doneBtnText: { fontSize: 15, fontWeight: '700', color: Colors.primaryDeep },
});
