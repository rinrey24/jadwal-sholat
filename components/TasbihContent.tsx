import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

import { Colors, Radius, Shadow } from '../constants/theme';
import Card from './ui/Card';
import { getTasbihTotal, addTasbihCount } from '../services/storage';

const PRESETS = [
  { id: 'Subhanallah', arab: 'سُبْحَانَ ٱللّٰه', target: 33 },
  { id: 'Alhamdulillah', arab: 'ٱلْحَمْدُ لِلَّٰه', target: 33 },
  { id: 'Allahu Akbar', arab: 'ٱللّٰهُ أَكْبَر', target: 34 },
  { id: 'Astaghfirullah', arab: 'أَسْتَغْفِرُ ٱللّٰه', target: 100 },
];

const CIRCUMFERENCE = 2 * Math.PI * 96;

export default function TasbihContent() {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState('Subhanallah');
  const [dailyTotal, setDailyTotal] = useState(0);
  const [vibrate, setVibrate] = useState(true);

  const preset = PRESETS.find((p) => p.id === active) || PRESETS[0];
  const target = preset.target;
  const pct = Math.min(1, count / target);
  const dashArr = `${pct * CIRCUMFERENCE} ${CIRCUMFERENCE}`;

  useEffect(() => {
    getTasbihTotal().then(setDailyTotal);
  }, []);

  async function handleTap() {
    if (vibrate) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const next = count + 1;
    if (next <= target) {
      setCount(next);
      await addTasbihCount(1);
      setDailyTotal((d) => d + 1);
      if (next === target) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  }

  function reset() {
    setCount(0);
  }

  function selectPreset(id: string) {
    setActive(id);
    setCount(0);
  }

  return (
    <View style={s.root}>
      {/* Preset chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {PRESETS.map((p) => {
          const on = p.id === active;
          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => selectPreset(p.id)}
              style={[s.chip, on && s.chipActive]}
            >
              <Text style={[s.chipText, on && s.chipTextActive]}>{p.id}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <Card pad={20} radius={24}>
        {/* Arabic */}
        <Text style={s.arabic}>{preset.arab}</Text>
        <Text style={s.latinText}>{preset.id}</Text>

        {/* Circular counter */}
        <View style={s.counterWrapper}>
          <Svg width={220} height={220} viewBox="0 0 220 220" style={{ position: 'absolute' }}>
            <Circle cx={110} cy={110} r={96} fill="none" stroke={Colors.chip} strokeWidth={10} />
            <Circle
              cx={110} cy={110} r={96}
              fill="none" stroke={Colors.primary} strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={dashArr}
              transform="rotate(-90 110 110)"
            />
          </Svg>
          <View style={s.counterInner}>
            <Text style={s.countNum}>{count}</Text>
            <Text style={s.countOf}>dari {target}</Text>
          </View>
        </View>

        {/* Tap button */}
        <TouchableOpacity style={s.tapBtn} onPress={handleTap} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={s.tapBtnText}>Tap untuk dzikir</Text>
        </TouchableOpacity>

        {/* Meta row */}
        <View style={s.metaRow}>
          <TouchableOpacity onPress={reset} style={s.resetBtn}>
            <Ionicons name="refresh-outline" size={14} color={Colors.ink2} />
            <Text style={s.resetText}>Reset</Text>
          </TouchableOpacity>
          <Text style={s.totalText}>Total hari ini · {dailyTotal}×</Text>
          <TouchableOpacity
            style={s.vibrateRow}
            onPress={() => setVibrate(!vibrate)}
          >
            <View style={[s.vibrateDot, { backgroundColor: vibrate ? Colors.primary : Colors.ink4 }]} />
            <Text style={s.vibrateText}>{vibrate ? 'Getar On' : 'Getar Off'}</Text>
          </TouchableOpacity>
        </View>
      </Card>
    </View>
  );
}

const s = StyleSheet.create({
  root: { padding: 16, paddingTop: 8, paddingBottom: 24 },
  chips: { paddingBottom: 8, marginBottom: 8, gap: 6, paddingHorizontal: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: Colors.chip },
  chipActive: { backgroundColor: Colors.primarySoft },
  chipText: { fontSize: 11.5, fontWeight: '600', color: Colors.ink2 },
  chipTextActive: { color: Colors.primary },

  arabic: { fontFamily: 'serif', fontSize: 30, textAlign: 'center', color: Colors.primary, writingDirection: 'rtl', lineHeight: 44 },
  latinText: { fontSize: 12.5, textAlign: 'center', color: Colors.ink3, marginTop: 4 },

  counterWrapper: { width: 220, height: 220, alignSelf: 'center', marginTop: 20, alignItems: 'center', justifyContent: 'center' },
  counterInner: { alignItems: 'center', justifyContent: 'center' },
  countNum: { fontSize: 72, fontWeight: '400', color: Colors.ink, letterSpacing: -2, fontVariant: ['tabular-nums'] as any },
  countOf: { fontSize: 12, color: Colors.ink3, marginTop: 4, letterSpacing: 0.5 },

  tapBtn: {
    width: '100%', marginTop: 20, padding: 18,
    borderRadius: 18, backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: Colors.primaryDeep, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22, shadowRadius: 14, elevation: 6,
  },
  tapBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },

  metaRow: {
    marginTop: 14, paddingTop: 14, borderTopWidth: 0.5, borderTopColor: Colors.line,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  resetBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  resetText: { fontSize: 12, fontWeight: '600', color: Colors.ink2 },
  totalText: { fontSize: 11.5, color: Colors.ink3 },
  vibrateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  vibrateDot: { width: 8, height: 8, borderRadius: 4 },
  vibrateText: { fontSize: 11.5, color: Colors.ink3 },
});
