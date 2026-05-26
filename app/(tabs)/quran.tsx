import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius } from '../../constants/theme';
import GeoPattern from '../../components/ui/GeoPattern';
import Ornament from '../../components/ui/Ornament';
import { SURAHS } from '../../constants/quranData';
import { getLastRead, getBookmarks, LastRead, Bookmark } from '../../services/storage';

export default function QuranScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);

  // Reload last-read and bookmarks every time this tab comes into focus
  // (user may have added/removed bookmarks in the reader and returned here)
  useFocusEffect(
    React.useCallback(() => {
      getLastRead().then(setLastRead);
      getBookmarks().then(setBookmarks);
    }, [])
  );

  const filteredSurahs = SURAHS.filter(
    (s) =>
      s.latin.toLowerCase().includes(search.toLowerCase()) ||
      s.meaning.toLowerCase().includes(search.toLowerCase()) ||
      String(s.n).includes(search)
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Al-Qur'an</Text>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={[s.iconBtn, showBookmarks && s.iconBtnActive]}
            onPress={() => setShowBookmarks((v) => !v)}
          >
            <Ionicons
              name={showBookmarks ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={showBookmarks ? Colors.primary : Colors.ink2}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Continue reading card */}
        <View style={s.px}>
          <LinearGradient
            colors={[Colors.primaryDeep, Colors.primary]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={s.continueCard}
          >
            <GeoPattern color="#fff" opacity={0.08} size={70} />
            <View style={s.continueRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.continueSub}>TERAKHIR DIBACA</Text>
                <Text style={s.continueSurah}>
                  {lastRead?.surahName ?? 'Al-Fatihah'}
                </Text>
                <Text style={s.continueAyat}>
                  Ayat {lastRead?.ayatN ?? 1} dari {lastRead?.totalAyat ?? 7} · Juz 1
                </Text>
                {lastRead && (
                  <View style={s.progBg}>
                    <View style={[s.progFill, { width: `${(lastRead.ayatN / lastRead.totalAyat) * 100}%` }]} />
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={s.continueBtn}
                onPress={() => router.push({ pathname: '/quran-reader', params: { surah: lastRead?.surahN ?? 1, ayat: lastRead?.ayatN ?? 1 } })}
              >
                <Text style={s.continueBtnText}>Lanjutkan</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.ink3} />
          <TextInput
            style={s.searchInput}
            placeholder="Cari surat, ayat, atau kata kunci"
            placeholderTextColor={Colors.ink3}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.ink3} />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Bookmark list (shown when bookmark icon pressed) ── */}
        {showBookmarks && (
          <View style={s.listContainer}>
            <Text style={s.listSectionLabel}>Bookmark</Text>
            {bookmarks.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="bookmark-outline" size={36} color={Colors.ink4} />
                <Text style={s.emptyText}>Belum ada bookmark</Text>
                <Text style={s.emptySubText}>Tap ikon bookmark pada ayat untuk menyimpannya</Text>
              </View>
            ) : (
              bookmarks.map((bm) => (
                <TouchableOpacity
                  key={bm.id}
                  style={s.bookmarkRow}
                  onPress={() => router.push({ pathname: '/quran-reader', params: { surah: bm.surahN, ayat: bm.ayatN } })}
                >
                  <Ionicons name="bookmark" size={16} color={Colors.gold} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={s.bmSurah}>{bm.surahName} : {bm.ayatN}</Text>
                    <Text style={s.bmNote}>{bm.note || '—'}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.ink3} />
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* ── Surah list ── */}
        {!showBookmarks && (
          <View style={s.listContainer}>
            {filteredSurahs.length === 0 ? (
              <View style={s.emptyState}>
                <Ionicons name="search-outline" size={36} color={Colors.ink4} />
                <Text style={s.emptyText}>Tidak ditemukan</Text>
              </View>
            ) : (
              filteredSurahs.map((sur) => (
                <TouchableOpacity
                  key={sur.n}
                  style={s.surahRow}
                  onPress={() => router.push({ pathname: '/quran-reader', params: { surah: sur.n, ayat: 1 } })}
                  activeOpacity={0.7}
                >
                  <Ornament n={sur.n} size={36} />
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={s.surahLatin}>{sur.latin}</Text>
                    <Text style={s.surahMeta}>{sur.meaning} · {sur.type} · {sur.ayat} ayat</Text>
                  </View>
                  <Text style={s.surahArab}>{sur.arab}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <View style={{ height: 24 }} />
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
  headerActions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.chip,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBtnActive: { backgroundColor: Colors.primarySoft },
  px: { paddingHorizontal: 16 },

  continueCard: { borderRadius: 22, padding: 18, overflow: 'hidden', marginBottom: 12, marginTop: 16 },
  continueRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  continueSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: 1, textTransform: 'uppercase', fontWeight: '600' },
  continueSurah: { fontSize: 26, color: '#fff', fontWeight: '400', marginTop: 4 },
  continueAyat: { fontSize: 12.5, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  progBg: { marginTop: 10, height: 3, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, width: 160 },
  progFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
  continueBtn: { padding: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.gold },
  continueBtnText: { fontSize: 12.5, fontWeight: '700', color: Colors.primaryDeep },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 12, marginBottom: 4,
    padding: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.chip,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.ink },

  listSectionLabel: {
    fontSize: 11, fontWeight: '600', letterSpacing: 1.2,
    textTransform: 'uppercase', color: Colors.ink3,
    marginBottom: 4, marginTop: 12,
  },
  listContainer: { paddingHorizontal: 16, paddingTop: 8 },

  surahRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  surahLatin: { fontSize: 15, fontWeight: '600', color: Colors.ink },
  surahMeta: { fontSize: 11.5, color: Colors.ink3, marginTop: 1 },
  surahArab: { fontSize: 22, color: Colors.primary, fontFamily: 'serif', writingDirection: 'rtl' },

  bookmarkRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  bmSurah: { fontSize: 14, fontWeight: '600', color: Colors.ink },
  bmNote: { fontSize: 11.5, color: Colors.ink3, marginTop: 1 },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600', color: Colors.ink2 },
  emptySubText: { fontSize: 12.5, color: Colors.ink3, textAlign: 'center', paddingHorizontal: 32 },
});
