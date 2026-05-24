import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Radius } from '../constants/theme';
import Card from '../components/ui/Card';
import { HIJRI_MONTHS, HIJRI_EVENTS } from '../services/prayerApi';
import { getSavedLocation } from '../services/storage';

const DOW = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface DayCell {
  hijriDay: number;
  gregDay: number;
  gregMonth: string;
  isOther: boolean;
  hasEvent?: boolean;
  eventColor?: string;
  eventLabel?: string;
}

function buildCalendar(hijriMonth: number, hijriYear: number): DayCell[] {
  // Approximate: Dzulhijjah 1447 starts ~18 May 2026 (Monday)
  // For a real app, use the API. Here we build a plausible calendar.
  const days: DayCell[] = [];

  const events: Record<number, { color: string; label: string }> = {
    1: { color: Colors.ink3, label: 'Awal bulan' },
    8: { color: Colors.gold, label: 'Hari Tarwiyah' },
    9: { color: Colors.gold, label: 'Hari Arafah' },
    10: { color: Colors.error, label: 'Idul Adha' },
    11: { color: Colors.error, label: 'Hari Tasyrik' },
    12: { color: Colors.error, label: 'Hari Tasyrik' },
    13: { color: Colors.error, label: 'Hari Tasyrik' },
    15: { color: Colors.ink3, label: 'Pertengahan bulan' },
  };

  // Pad start (day 1 = Monday = index 1)
  days.push({ hijriDay: 30, gregDay: 17, gregMonth: 'Mei', isOther: true });

  const gregStart = 18;
  for (let i = 1; i <= 30; i++) {
    const gDay = gregStart + i - 1;
    const gMonth = gDay > 31 ? 'Jun' : 'Mei';
    const g = gDay > 31 ? gDay - 31 : gDay;
    const ev = events[i];
    days.push({
      hijriDay: i, gregDay: g, gregMonth: gMonth, isOther: false,
      hasEvent: !!ev, eventColor: ev?.color, eventLabel: ev?.label,
    });
  }

  while (days.length < 42) {
    const n = days.length - 31;
    days.push({ hijriDay: n, gregDay: n, gregMonth: 'Jun', isOther: true });
  }

  return days;
}

const UPCOMING_EVENTS = [
  { h: '9', label: 'Hari Arafah', sub: 'Puasa Arafah sangat dianjurkan', when: '2 hari lagi', tone: 'gold' },
  { h: '10', label: 'Idul Adha', sub: 'Sholat Ied · Penyembelihan hewan kurban', when: '3 hari lagi', tone: 'red' },
  { h: '11-13', label: 'Hari Tasyrik', sub: 'Larangan berpuasa · Takbir', when: '4-6 hari lagi', tone: 'red' },
];

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(7);
  const [hijriMonth] = useState(12); // Dzulhijjah
  const [hijriYear] = useState(1447);
  const days = buildCalendar(hijriMonth, hijriYear);
  const monthName = HIJRI_MONTHS[hijriMonth];

  const selDay = days.find((d) => d.hijriDay === selected && !d.isOther);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kalender Hijriah</Text>
        <TouchableOpacity style={s.iconBtn}>
          <Ionicons name="settings-outline" size={20} color={Colors.ink2} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month header */}
        <View style={s.monthHeader}>
          <View>
            <Text style={s.monthTitle}>
              {monthName} <Text style={{ color: Colors.primary }}>{hijriYear} H</Text>
            </Text>
            <Text style={s.monthSub}>18 Mei – 16 Juni 2026</Text>
          </View>
          <View style={s.monthNav}>
            <TouchableOpacity style={s.navBtn}>
              <Ionicons name="chevron-back" size={18} color={Colors.ink2} />
            </TouchableOpacity>
            <TouchableOpacity style={s.todayBtn}>
              <Text style={s.todayBtnText}>Hari ini</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.navBtn}>
              <Ionicons name="chevron-forward" size={18} color={Colors.ink2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* DOW header */}
        <View style={s.dowRow}>
          {DOW.map((d, i) => (
            <Text key={d} style={[s.dowLabel, i === 5 && { color: Colors.primary }]}>{d}</Text>
          ))}
        </View>

        {/* Grid */}
        <View style={s.grid}>
          {days.map((d, i) => {
            const isSel = !d.isOther && d.hijriDay === selected;
            const isToday = !d.isOther && d.hijriDay === 7;
            return (
              <TouchableOpacity
                key={i}
                style={[
                  s.dayCell,
                  isSel && s.dayCellSelected,
                  isToday && !isSel && s.dayCellToday,
                ]}
                onPress={() => !d.isOther && setSelected(d.hijriDay)}
                disabled={d.isOther}
              >
                <Text style={[
                  s.dayHijri,
                  isSel && { color: '#fff' },
                  isToday && !isSel && { fontWeight: '700' },
                  d.isOther && s.dayOther,
                ]}>
                  {d.hijriDay}
                </Text>
                <Text style={[
                  s.dayGreg,
                  isSel && { color: 'rgba(255,255,255,0.7)' },
                  d.isOther && { opacity: 0.4 },
                ]}>
                  {d.gregDay}
                </Text>
                {d.hasEvent && (
                  <View style={[s.eventDot, { backgroundColor: isSel ? Colors.gold : d.eventColor }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Selected detail */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>DETAIL HARI TERPILIH</Text>
        </View>
        <View style={s.px}>
          <Card pad={18} radius={Radius.xl}>
            <View style={s.detailTop}>
              <View>
                <Text style={s.detailHijri}>{selected} {monthName} {hijriYear} H</Text>
                <Text style={s.detailGreg}>Senin · 24 Mei 2026</Text>
              </View>
              {selDay?.hasEvent && (
                <View style={s.eventBadge}>
                  <Text style={s.eventBadgeText}>Event</Text>
                </View>
              )}
            </View>

            <View style={s.upcomingList}>
              {UPCOMING_EVENTS.map((e, i) => (
                <View key={i} style={s.upcomingItem}>
                  <View style={[
                    s.upcomingNumBox,
                    { backgroundColor: e.tone === 'gold' ? Colors.goldSoft : Colors.primarySoft },
                  ]}>
                    <Text style={[
                      s.upcomingNum,
                      { color: e.tone === 'gold' ? Colors.goldInk : Colors.primary },
                    ]}>{e.h}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.upcomingLabel}>{e.label}</Text>
                    <Text style={s.upcomingSub}>{e.sub}</Text>
                  </View>
                  <Text style={s.upcomingWhen}>{e.when}</Text>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Tools */}
        <View style={s.sectionLabel}>
          <Text style={s.sectionLabelText}>ALAT</Text>
        </View>
        <View style={s.toolGrid}>
          <Card pad={14} radius={16} style={{ flex: 1 }}>
            <Ionicons name="refresh-outline" size={18} color={Colors.primary} />
            <Text style={s.toolTitle}>Konverter Tanggal</Text>
            <Text style={s.toolSub}>Hijriah ⇄ Masehi</Text>
          </Card>
          <Card pad={14} radius={16} style={{ flex: 1 }}>
            <Ionicons name="star-outline" size={18} color={Colors.gold} />
            <Text style={s.toolTitle}>Hari Penting</Text>
            <Text style={s.toolSub}>13 event tahunan</Text>
          </Card>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
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
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '600', color: Colors.ink },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  px: { paddingHorizontal: 16 },

  monthHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  monthTitle: { fontSize: 26, fontWeight: '400', color: Colors.ink },
  monthSub: { fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
  monthNav: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  navBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  todayBtn: { paddingHorizontal: 12, height: 34, borderRadius: 17, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  todayBtnText: { fontSize: 11.5, fontWeight: '600', color: Colors.primary },

  dowRow: { flexDirection: 'row', paddingHorizontal: 14, marginBottom: 4 },
  dowLabel: { flex: 1, textAlign: 'center', fontSize: 10.5, fontWeight: '600', letterSpacing: 0.5, color: Colors.ink3, textTransform: 'uppercase', paddingVertical: 6 },

  grid: { paddingHorizontal: 14, flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`, aspectRatio: 0.95, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 1, padding: 4, position: 'relative',
  },
  dayCellSelected: { backgroundColor: Colors.primary },
  dayCellToday: { backgroundColor: Colors.primarySoft },
  dayHijri: { fontSize: 15, fontWeight: '500', color: Colors.ink, lineHeight: 18 },
  dayGreg: { fontSize: 9, color: Colors.ink3, lineHeight: 12 },
  dayOther: { color: Colors.ink4 },
  eventDot: { position: 'absolute', bottom: 4, width: 4, height: 4, borderRadius: 2 },

  sectionLabel: { paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
  sectionLabelText: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, color: Colors.ink3 },

  detailTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  detailHijri: { fontSize: 22, fontWeight: '400', color: Colors.ink },
  detailGreg: { fontSize: 12.5, color: Colors.ink3, marginTop: 2 },
  eventBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: Colors.goldSoft },
  eventBadgeText: { fontSize: 10.5, fontWeight: '600', color: Colors.goldInk },

  upcomingList: { marginTop: 16, gap: 12 },
  upcomingItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  upcomingNumBox: {
    // minWidth so single-digit ("9") and ranges ("11–13") both fit without wrapping
    minWidth: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  upcomingNum: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  upcomingLabel: { fontSize: 13.5, fontWeight: '600', color: Colors.ink },
  upcomingSub: { fontSize: 11.5, color: Colors.ink3, marginTop: 1 },
  upcomingWhen: { fontSize: 11, color: Colors.ink3 },

  toolGrid: { paddingHorizontal: 16, flexDirection: 'row', gap: 12 },
  toolTitle: { fontSize: 13, fontWeight: '600', color: Colors.ink, marginTop: 8 },
  toolSub: { fontSize: 11, color: Colors.ink3, marginTop: 2 },
});
