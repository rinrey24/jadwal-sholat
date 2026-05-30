import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius, Shadow } from '../constants/theme';
import Card from '../components/ui/Card';
import { searchQuranSemantic, SearchResponse, QuranSearchResult } from '../services/geminiApi';
import { addBookmark } from '../services/storage';

// ─── Suggested topic chips ────────────────────────────────────────────────────
const TOPICS = [
  { label: '🤲 Kesabaran',  query: 'Apa kata Al-Quran tentang kesabaran menghadapi cobaan dan ujian hidup?' },
  { label: '💰 Rezeki',     query: 'Ayat Al-Quran tentang rezeki, ikhtiar, dan tawakal kepada Allah' },
  { label: '👨‍👩‍👧 Keluarga',  query: 'Perintah Al-Quran tentang birrul walidain, keluarga, dan orang tua' },
  { label: '🌿 Taubat',     query: 'Ayat tentang taubat, ampunan Allah, dan kembali ke jalan yang benar' },
  { label: '🙏 Doa',        query: 'Cara berdoa yang benar dan waktu mustajab menurut Al-Quran' },
  { label: '💚 Syukur',     query: 'Al-Quran tentang bersyukur atas nikmat Allah dan akibat kufur nikmat' },
  { label: '✨ Ikhlas',     query: 'Makna ikhlas dalam beribadah dan beramal menurut Al-Quran' },
  { label: '❤️ Jodoh',      query: 'Al-Quran tentang jodoh, pernikahan, dan cinta yang halal' },
  { label: '😰 Kecemasan',  query: 'Ayat Al-Quran untuk menenangkan hati yang gelisah dan cemas' },
  { label: '⚖️ Adil',       query: 'Al-Quran tentang keadilan, kebenaran, dan amanah' },
  { label: '🧠 Ilmu',       query: 'Keutamaan menuntut ilmu dan orang berilmu dalam Al-Quran' },
  { label: '🕌 Sholat',     query: 'Perintah mendirikan sholat dan keutamaannya dalam Al-Quran' },
];

// ─── Empty / welcome state ────────────────────────────────────────────────────
function EmptyState() {
  return (
    <View style={es.container}>
      <View style={es.iconWrap}>
        <Text style={es.icon}>📖</Text>
      </View>
      <Text style={es.title}>Tanya Apa Saja</Text>
      <Text style={es.subtitle}>
        Ketik pertanyaan dalam bahasa sehari-hari, atau pilih topik di atas.
        {'\n'}AI akan menemukan ayat yang paling relevan.
      </Text>
      <View style={es.exampleBox}>
        <Text style={es.exampleLabel}>Contoh pertanyaan:</Text>
        {[
          '"Apa kata Quran tentang rezeki?"',
          '"Bagaimana cara sabar menghadapi ujian?"',
          '"Ayat tentang pentingnya kejujuran"',
        ].map((ex, i) => (
          <Text key={i} style={es.exampleItem}>• {ex}</Text>
        ))}
      </View>
    </View>
  );
}

// ─── Loading state ────────────────────────────────────────────────────────────
function LoadingState({ query, statusMsg }: { query: string; statusMsg?: string }) {
  const isRetrying = statusMsg && statusMsg.length > 0;
  return (
    <View style={ls.container}>
      <ActivityIndicator size="large" color={isRetrying ? Colors.gold : Colors.primary} />
      <Text style={ls.title}>{isRetrying ? 'Harap Sabar…' : 'Mencari ayat relevan…'}</Text>
      <Text style={ls.subtitle} numberOfLines={2}>"{query}"</Text>
      {isRetrying ? (
        <View style={ls.retryBox}>
          <Text style={ls.retryText}>{statusMsg}</Text>
        </View>
      ) : (
        <Text style={ls.note}>AI sedang membaca seluruh Al-Quran untuk kamu 🤍</Text>
      )}
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View style={er.container}>
      <Text style={er.icon}>⚠️</Text>
      <Text style={er.title}>Terjadi Kesalahan</Text>
      <Text style={er.message}>{message}</Text>
      <TouchableOpacity style={er.retryBtn} onPress={onRetry}>
        <Text style={er.retryText}>Coba Lagi</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Result verse card ────────────────────────────────────────────────────────
function VerseCard({
  item, index, bookmarked, onBookmark,
}: {
  item: QuranSearchResult;
  index: number;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <View style={vc.container}>
      {/* Header row: QS label + bookmark */}
      <View style={vc.header}>
        <View style={vc.qsTag}>
          <Text style={vc.qsNumber}>{index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={vc.surahName}>QS. {item.surahName}</Text>
          <Text style={vc.ayatRef}>Ayat {item.ayatNumber} · Surah {item.surah}</Text>
        </View>
        <TouchableOpacity onPress={onBookmark} style={vc.bookmarkBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons
            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={bookmarked ? Colors.primary : Colors.ink3}
          />
        </TouchableOpacity>
      </View>

      {/* Arabic text */}
      {item.arabicText ? (
        <View style={vc.arabicContainer}>
          <Text style={vc.arabicText}>{item.arabicText}</Text>
        </View>
      ) : null}

      {/* Divider */}
      <View style={vc.divider} />

      {/* Indonesian translation */}
      {item.translation ? (
        <Text style={vc.translation}>"{item.translation}"</Text>
      ) : null}

      {/* Relevance reason */}
      {item.reason ? (
        <View style={vc.reasonBox}>
          <Ionicons name="sparkles" size={13} color={Colors.goldInk} />
          <Text style={vc.reasonText}>{item.reason}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function TanyaQuranScreen() {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<string>>(new Set());
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  async function handleSearch(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    if (q !== query) setQuery(q);

    inputRef.current?.blur();
    setLoading(true);
    setStatusMsg('');
    setError(null);
    setResult(null);
    scrollRef.current?.scrollTo({ y: 0, animated: true });

    try {
      const resp = await searchQuranSemantic(q, (msg) => setStatusMsg(msg));
      setResult(resp);
    } catch (e: any) {
      setError(e.message ?? 'Terjadi kesalahan tidak terduga.');
    } finally {
      setLoading(false);
      setStatusMsg('');
    }
  }

  function handleBookmark(item: QuranSearchResult) {
    const key = `${item.surah}:${item.ayatNumber}`;
    const isCurrentlyBookmarked = bookmarkedSet.has(key);
    if (!isCurrentlyBookmarked) {
      addBookmark(item.surah, item.surahName, item.ayatNumber, item.arabicText, '').catch(() => {});
      setBookmarkedSet(prev => new Set([...prev, key]));
    } else {
      setBookmarkedSet(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" />

      {/* ── Gradient Header ─────────────────────────────────────────────── */}
      <LinearGradient
        colors={[Colors.primaryDeep, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[s.gradientHeader, { paddingTop: insets.top + 8 }]}
      >
        {/* Nav row */}
        <View style={s.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.headerTitle}>Tanya Quran</Text>
            <Text style={s.headerSub}>Cari makna, bukan sekadar kata</Text>
          </View>
          <View style={[s.backBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Text style={{ fontSize: 18 }}>✨</Text>
          </View>
        </View>

        {/* Search input */}
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={18} color={Colors.ink3} style={{ marginRight: 8 }} />
          <TextInput
            ref={inputRef}
            style={s.searchInput}
            placeholder="Apa kata Quran tentang…"
            placeholderTextColor={Colors.ink3}
            value={query}
            onChangeText={setQuery}
            multiline
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            blurOnSubmit
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={18} color={Colors.ink3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search button */}
        <TouchableOpacity
          style={[s.searchBtn, (!query.trim() || loading) && s.searchBtnDisabled]}
          onPress={() => handleSearch()}
          disabled={!query.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="sparkles-outline" size={16} color="#fff" />
              <Text style={s.searchBtnText}>Cari Makna</Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>

      {/* ── Scrollable body ─────────────────────────────────────────────── */}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Topic chips */}
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>TOPIK POPULER</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chipsScroll}
        >
          {TOPICS.map((t) => (
            <TouchableOpacity
              key={t.label}
              style={[
                s.chip,
                result?.query === t.query && s.chipActive,
              ]}
              onPress={() => handleSearch(t.query)}
              activeOpacity={0.75}
            >
              <Text style={[
                s.chipText,
                result?.query === t.query && s.chipTextActive,
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── States ────────────────────────────────────────────────────── */}
        {loading ? (
          <LoadingState query={query} statusMsg={statusMsg} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => handleSearch()} />
        ) : result ? (
          <View style={s.resultArea}>
            {/* Summary card */}
            <Card pad={16} radius={Radius.xl} style={s.summaryCard}>
              <View style={s.summaryHeader}>
                <View style={s.summaryIcon}>
                  <Ionicons name="sparkles" size={16} color={Colors.goldInk} />
                </View>
                <Text style={s.summaryTitle}>Ringkasan Al-Quran</Text>
              </View>
              <Text style={s.summaryText}>{result.summary}</Text>
              <View style={s.summaryFooter}>
                <Text style={s.summaryQuery}>Tentang: "{result.query}"</Text>
                <Text style={s.summaryCount}>{result.results.length} ayat ditemukan</Text>
              </View>
            </Card>

            {/* Verse cards */}
            {result.results.map((item, i) => (
              <VerseCard
                key={`${item.surah}:${item.ayatNumber}`}
                item={item}
                index={i}
                bookmarked={bookmarkedSet.has(`${item.surah}:${item.ayatNumber}`)}
                onBookmark={() => handleBookmark(item)}
              />
            ))}

            {/* Footer note */}
            <View style={s.footerNote}>
              <Ionicons name="information-circle-outline" size={13} color={Colors.ink4} />
              <Text style={s.footerText}>
                Teks Arab & terjemahan dari Al-Quran Cloud (Kemenag RI).
                Hasil pencarian dibantu AI — selalu verifikasi dengan sumber terpercaya.
              </Text>
            </View>
          </View>
        ) : (
          <EmptyState />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  gradientHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 1,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    minHeight: 52,
    ...Shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.ink,
    lineHeight: 22,
    maxHeight: 100,
    paddingTop: 0,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.full,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  searchBtnDisabled: {
    opacity: 0.5,
  },
  searchBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },

  sectionRow: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.ink3,
    letterSpacing: 1.2,
  },
  chipsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.chip,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  chipActive: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.ink2,
  },
  chipTextActive: {
    color: Colors.primaryInk,
    fontWeight: '600',
  },

  resultArea: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    backgroundColor: Colors.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.2)',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  summaryIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(201,162,39,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.goldInk,
    letterSpacing: 0.3,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink,
  },
  summaryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,162,39,0.15)',
  },
  summaryQuery: {
    flex: 1,
    fontSize: 11.5,
    color: Colors.ink3,
    fontStyle: 'italic',
  },
  summaryCount: {
    fontSize: 11.5,
    fontWeight: '600',
    color: Colors.goldInk,
  },

  footerNote: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 4,
    paddingVertical: 4,
    alignItems: 'flex-start',
    marginTop: 4,
  },
  footerText: {
    flex: 1,
    fontSize: 11,
    color: Colors.ink4,
    lineHeight: 16,
  },
});

// ── Verse card styles ─────────────────────────────────────────────────────────
const vc = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    ...Shadow.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 10,
  },
  qsTag: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qsNumber: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  surahName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
  },
  ayatRef: {
    fontSize: 12,
    color: Colors.ink3,
    marginTop: 1,
  },
  bookmarkBtn: {
    padding: 2,
  },
  arabicContainer: {
    backgroundColor: Colors.chip,
    borderRadius: Radius.md,
    padding: 14,
    marginBottom: 12,
  },
  arabicText: {
    fontFamily: 'System',
    fontSize: 24,
    lineHeight: 44,
    color: Colors.ink,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
    marginBottom: 12,
  },
  translation: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink2,
    fontStyle: 'italic',
    marginBottom: 10,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: Colors.goldSoft,
    borderRadius: Radius.sm,
    padding: 10,
  },
  reasonText: {
    flex: 1,
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.goldInk,
  },
});

// ── Empty state styles ────────────────────────────────────────────────────────
const es = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.ink2,
    textAlign: 'center',
    marginBottom: 24,
  },
  exampleBox: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: 16,
    gap: 6,
    ...Shadow.card,
  },
  exampleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink3,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  exampleItem: {
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.ink2,
    fontStyle: 'italic',
  },
});

// ── Loading state styles ──────────────────────────────────────────────────────
const ls = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.ink,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13.5,
    color: Colors.ink3,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  note: {
    fontSize: 13,
    color: Colors.ink3,
    textAlign: 'center',
    marginTop: 4,
  },
  retryBox: {
    backgroundColor: Colors.goldSoft,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    color: Colors.goldInk,
    textAlign: 'center',
    lineHeight: 20,
  },
});

// ── Error state styles ────────────────────────────────────────────────────────
const er = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 10,
  },
  icon: {
    fontSize: 40,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.ink,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.ink2,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 28,
    paddingVertical: 12,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
