import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Share, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// expo-audio requires a native module that is NOT included in Expo Go.
// We detect Expo Go at module load time and skip the require entirely.
const AUDIO_SUPPORTED = Constants.executionEnvironment === 'bare';
type SoundObj = { play(): void; pause(): void; remove(): void; addListener(event: string, cb: (s: any) => void): { remove(): void } };

import { Colors, Radius, Shadow } from '../constants/theme';
import Ornament from '../components/ui/Ornament';
import { fetchSurah, AyatData } from '../services/quranApi';
import { SURAHS } from '../constants/quranData';
import { saveLastRead, addBookmark, removeBookmark, getBookmarks, getAppSettings } from '../services/storage';

export default function QuranReaderScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ surah?: string; ayat?: string }>();
  const surahN = parseInt(params.surah ?? '1');
  const initAyat = parseInt(params.ayat ?? '1');

  const [ayat, setAyat] = useState<AyatData[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingN, setPlayingN] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());
  const [showTranslit, setShowTranslit] = useState(true);
  const [fontSize, setFontSize] = useState(24);

  // Font-size map for the 3-level setting in menu
  const FONT_SIZE_MAP: Record<string, number> = { small: 20, medium: 24, large: 30 };
  const scrollRef = useRef<ScrollView>(null);
  const soundRef = useRef<SoundObj | null>(null);
  const autoPlayRef = useRef(false);
  const playingNRef = useRef<number | null>(null);
  const ayatRef = useRef<AyatData[]>([]);

  const surahInfo = SURAHS.find((s) => s.n === surahN);

  useEffect(() => {
    loadSurah();
    // Load font size from settings
    getAppSettings().then((s) => setFontSize(FONT_SIZE_MAP[s.fontSize] ?? 24));
    // Load existing bookmarks for this surah
    getBookmarks().then((bms) => {
      const set = new Set(bms.filter((b) => b.surahN === surahN).map((b) => b.ayatN));
      setBookmarkedSet(set);
    });
    return () => { soundRef.current?.remove(); };
  }, [surahN]);

  async function loadSurah() {
    setLoading(true);
    try {
      const data = await fetchSurah(surahN);
      setAyat(data);
      // Save last read
      await saveLastRead({
        surahN,
        surahName: surahInfo?.latin ?? 'Al-Fatihah',
        ayatN: initAyat,
        totalAyat: data.length,
      });
    } catch (e) {
      console.warn('Failed to fetch surah:', e);
    } finally {
      setLoading(false);
    }
  }

  // Keep ayatRef always pointing to the latest list (safe inside listener callbacks)
  useEffect(() => { ayatRef.current = ayat; }, [ayat]);

  async function playAudio(url: string, n: number, autoAdvance = false) {
    if (!AUDIO_SUPPORTED) {
      Alert.alert(
        'Audio tidak tersedia di Expo Go',
        'Untuk mendengarkan tilawah, buka aplikasi menggunakan development build.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Stop and clean up any currently playing audio
      if (soundRef.current) {
        soundRef.current.remove();
        soundRef.current = null;
      }

      // If the same ayat is tapped again (not an auto-advance), toggle off
      if (!autoAdvance && playingNRef.current === n) {
        playingNRef.current = null;
        setPlayingN(null);
        return;
      }

      const { createAudioPlayer } = require('expo-audio') as typeof import('expo-audio');
      playingNRef.current = n;
      setPlayingN(n);
      const player = createAudioPlayer({ uri: url });
      soundRef.current = player as unknown as SoundObj;
      player.play();
      player.addListener('playbackStatusUpdate', (status: any) => {
        if (status.didJustFinish) {
          const currentN = playingNRef.current;
          if (autoPlayRef.current && currentN !== null) {
            // Auto-advance to the next ayat
            const nextAyat = ayatRef.current.find(a => a.numberInSurah === currentN + 1);
            if (nextAyat) {
              playAudio(nextAyat.audio, nextAyat.numberInSurah, true);
            } else {
              // Reached end of surah
              autoPlayRef.current = false;
              setIsAutoPlaying(false);
              playingNRef.current = null;
              setPlayingN(null);
              soundRef.current = null;
            }
          } else {
            playingNRef.current = null;
            setPlayingN(null);
            soundRef.current = null;
          }
        }
      });
    } catch (e) {
      console.warn('Audio error:', e);
      playingNRef.current = null;
      setPlayingN(null);
      soundRef.current = null;
    }
  }

  function toggleAutoPlay() {
    if (isAutoPlaying) {
      // Stop everything
      autoPlayRef.current = false;
      setIsAutoPlaying(false);
      if (soundRef.current) { soundRef.current.remove(); soundRef.current = null; }
      playingNRef.current = null;
      setPlayingN(null);
    } else {
      // Start playing from the first ayat
      autoPlayRef.current = true;
      setIsAutoPlaying(true);
      const firstAyat = ayatRef.current[0];
      if (firstAyat) playAudio(firstAyat.audio, firstAyat.numberInSurah, true);
    }
  }

  async function toggleBookmark(a: AyatData) {
    if (bookmarkedSet.has(a.numberInSurah)) {
      // Remove from storage AND local state
      await removeBookmark(`${surahN}_${a.numberInSurah}`);
      const next = new Set(bookmarkedSet);
      next.delete(a.numberInSurah);
      setBookmarkedSet(next);
    } else {
      await addBookmark({
        surahN,
        surahName: surahInfo?.latin ?? '',
        ayatN: a.numberInSurah,
        note: '',
      });
      setBookmarkedSet(new Set([...bookmarkedSet, a.numberInSurah]));
    }
  }

  async function shareAyat(a: AyatData) {
    await Share.share({
      message: `${a.arab}\n\n${a.translation}\n\n— ${surahInfo?.latin} : ${a.numberInSurah}`,
    });
  }

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <StatusBar style="dark" />
        <ActivityIndicator color={Colors.primary} size="large" />
        <Text style={{ color: Colors.ink3, marginTop: 12 }}>Memuat {surahInfo?.latin}...</Text>
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      {/* Sticky Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>{surahInfo?.latin ?? 'Al-Fatihah'}</Text>
          <Text style={s.headerSub}>
            Juz {surahInfo?.juz} · {surahInfo?.type} · {surahInfo?.ayat} ayat
          </Text>
        </View>
        <TouchableOpacity onPress={() => setShowTranslit(!showTranslit)} style={s.iconBtn}>
          <Ionicons name={showTranslit ? 'text' : 'text-outline'} size={18} color={Colors.ink2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.iconBtn, isAutoPlaying && { backgroundColor: Colors.primary }]}
          onPress={toggleAutoPlay}
        >
          <Ionicons
            name={isAutoPlaying ? 'stop-circle-outline' : 'play-circle-outline'}
            size={20}
            color={isAutoPlaying ? '#fff' : Colors.ink2}
          />
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Basmala */}
        {surahN !== 9 && (
          <View style={s.basmala}>
            <Text style={[s.arabicText, { fontSize: 26, color: Colors.primary }]}>
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </Text>
            <Text style={s.basmalaOrb}>۞  ۞  ۞</Text>
          </View>
        )}

        {/* Ayat list */}
        <View style={s.ayatList}>
          {ayat.map((a) => {
            const isPlaying = playingN === a.numberInSurah;
            const bmked = bookmarkedSet.has(a.numberInSurah);
            return (
              <View
                key={a.number}
                style={[
                  s.ayatItem,
                  isPlaying && s.ayatItemActive,
                ]}
              >
                {/* Row top: ornament + actions */}
                <View style={s.ayatTopRow}>
                  <Ornament n={a.numberInSurah} size={28} color={isPlaying ? Colors.primary : Colors.ink3} />
                  <View style={s.ayatActions}>
                    <TouchableOpacity
                      style={[s.ayatActionBtn, isPlaying && { backgroundColor: Colors.primary }]}
                      onPress={() => playAudio(a.audio, a.numberInSurah)}
                    >
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={13}
                        color={isPlaying ? '#fff' : Colors.ink3}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.ayatActionBtn}
                      onPress={() => toggleBookmark(a)}
                    >
                      <Ionicons
                        name={bmked ? 'bookmark' : 'bookmark-outline'}
                        size={14}
                        color={bmked ? Colors.gold : Colors.ink3}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity style={s.ayatActionBtn} onPress={() => shareAyat(a)}>
                      <Ionicons name="share-outline" size={14} color={Colors.ink3} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Arabic text */}
                <Text style={[s.arabicText, { fontSize, marginTop: 10 }]}>
                  {a.arab}
                </Text>

                {/* Transliteration (if available - only for Al-Fatihah) */}
                {showTranslit && surahN === 1 && a.numberInSurah <= 7 && (
                  <Text style={s.translit}>
                    {['Bismillāhir-raḥmānir-raḥīm', "Al-ḥamdu lillāhi rabbil-'ālamīn",
                      'Ar-raḥmānir-raḥīm', 'Māliki yawmid-dīn',
                      "Iyyāka na'budu wa iyyāka nasta'īn",
                      'Ihdinaṣ-ṣirāṭal-mustaqīm',
                      "Ṣirāṭal-ladhīna an'amta 'alayhim"][a.numberInSurah - 1]}
                  </Text>
                )}

                {/* Translation */}
                <Text style={s.translation}>{a.translation}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Audio Player Bar */}
      {playingN !== null && (
        <View style={[s.playerBar, { bottom: insets.bottom + 10 }]}>
          <View style={s.playerIcon}>
            <Ionicons name="book-outline" size={17} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.playerTitle}>{surahInfo?.latin} · Ayat {playingN}</Text>
            <Text style={s.playerSub}>{isAutoPlaying ? 'Auto-play aktif' : 'Mishary Rashid · 1.0×'}</Text>
          </View>
          <TouchableOpacity onPress={() => {
            const prev = playingNRef.current;
            if (prev && prev > 1) {
              const prevAyat = ayatRef.current.find(a => a.numberInSurah === prev - 1);
              if (prevAyat) playAudio(prevAyat.audio, prevAyat.numberInSurah, autoPlayRef.current);
            }
          }}>
            <Ionicons name="play-skip-back" size={18} color={Colors.ink2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={s.playerPlayBtn}
            onPress={() => {
              autoPlayRef.current = false;
              setIsAutoPlaying(false);
              if (soundRef.current) { soundRef.current.remove(); soundRef.current = null; }
              playingNRef.current = null;
              setPlayingN(null);
            }}
          >
            <Ionicons name="pause" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            const curr = playingNRef.current;
            if (curr !== null) {
              const nextAyat = ayatRef.current.find(a => a.numberInSurah === curr + 1);
              if (nextAyat) playAudio(nextAyat.audio, nextAyat.numberInSurah, autoPlayRef.current);
            }
          }}>
            <Ionicons name="play-skip-forward" size={18} color={Colors.ink2} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
    backgroundColor: Colors.bg,
  },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 19, fontWeight: '500', color: Colors.ink },
  headerSub: { fontSize: 10.5, color: Colors.ink3, marginTop: 2, letterSpacing: 0.3 },

  basmala: { alignItems: 'center', padding: 24, paddingBottom: 12 },
  basmalaOrb: { marginTop: 4, fontSize: 11, color: Colors.ink3, letterSpacing: 0.5 },

  ayatList: { paddingHorizontal: 18 },
  ayatItem: {
    paddingVertical: 16, paddingHorizontal: 6,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  ayatItemActive: {
    backgroundColor: Colors.primarySoft,
    borderRadius: 14,
    marginHorizontal: -6,
    paddingHorizontal: 12,
    borderBottomWidth: 0,
  },
  ayatTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  ayatActions: { flexDirection: 'row', gap: 4 },
  ayatActionBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center' },

  arabicText: {
    textAlign: 'right', color: Colors.ink,
    fontFamily: 'serif', lineHeight: 54,
    writingDirection: 'rtl',
  },
  translit: { marginTop: 8, fontSize: 12.5, fontStyle: 'italic', color: Colors.ink3, lineHeight: 22 },
  translation: { marginTop: 6, fontSize: 13.5, color: Colors.ink2, lineHeight: 22 },

  playerBar: {
    position: 'absolute', left: 12, right: 12,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    ...Shadow.strong,
    borderWidth: 0.5, borderColor: Colors.line,
    padding: 12, paddingHorizontal: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  playerIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  playerTitle: { fontSize: 12.5, fontWeight: '600', color: Colors.ink },
  playerSub: { fontSize: 11, color: Colors.ink3 },
  playerPlayBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
});
