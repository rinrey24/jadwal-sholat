import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Radius, Shadow } from '../constants/theme';
import GeoPattern from '../components/ui/GeoPattern';
import { ASMAUL_HUSNA } from '../constants/dzikirData';

export default function AsmaulHusnaScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof ASMAUL_HUSNA[0] | null>(null);

  const filtered = ASMAUL_HUSNA.filter(
    (a) =>
      a.latin.toLowerCase().includes(search.toLowerCase()) ||
      a.meaning.toLowerCase().includes(search.toLowerCase()) ||
      String(a.n).includes(search)
  );

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Asmaul Husna</Text>
          <Text style={s.headerSub}>99 Nama Allah Yang Indah</Text>
        </View>
      </View>

      {/* Search */}
      <View style={s.searchBox}>
        <Ionicons name="search-outline" size={16} color={Colors.ink3} />
        <TextInput
          style={s.searchInput}
          placeholder="Cari nama Allah..."
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

      <FlatList
        data={filtered}
        keyExtractor={(a) => String(a.n)}
        numColumns={2}
        columnWrapperStyle={s.row}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.card}
            onPress={() => setSelected(item)}
            activeOpacity={0.8}
          >
            <Text style={s.num}>{String(item.n).padStart(2, '0')}</Text>
            <Text style={s.arab}>{item.arab}</Text>
            <Text style={s.latin}>{item.latin}</Text>
            <Text style={s.meaning}>{item.meaning}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" transparent>
        <TouchableOpacity style={s.modalOverlay} onPress={() => setSelected(null)} />
        {selected && (
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.dragHandle} />
            <LinearGradient
              colors={[Colors.primaryDeep, Colors.primary]}
              style={s.modalHero}
            >
              <GeoPattern color="#fff" opacity={0.08} size={70} />
              <Text style={s.modalNum}>{String(selected.n).padStart(2, '0')}</Text>
              <Text style={s.modalArab}>{selected.arab}</Text>
              <Text style={s.modalLatin}>{selected.latin}</Text>
              <Text style={s.modalMeaning}>{selected.meaning}</Text>
            </LinearGradient>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.modalBody}>
              <Text style={s.modalDescLabel}>Penjelasan</Text>
              <Text style={s.modalDesc}>{selected.desc}</Text>
            </ScrollView>
          </View>
        )}
      </Modal>
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
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.chip, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.ink },
  headerSub: { fontSize: 12, color: Colors.ink3, marginTop: 2 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    padding: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: Colors.chip,
  },
  searchInput: { flex: 1, fontSize: 13, color: Colors.ink },

  listContent: { paddingHorizontal: 10, paddingBottom: 20 },
  row: { gap: 10, marginBottom: 10, paddingHorizontal: 6 },
  card: {
    flex: 1, alignItems: 'center', padding: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 0.5, borderColor: Colors.line,
    ...Shadow.card,
  },
  num: { fontSize: 10, color: Colors.ink3, fontWeight: '600' },
  arab: { fontFamily: 'serif', fontSize: 22, color: Colors.primary, writingDirection: 'rtl', marginTop: 4, lineHeight: 32, minHeight: 30 },
  latin: { fontSize: 12, fontWeight: '600', color: Colors.ink, marginTop: 6, textAlign: 'center' },
  meaning: { fontSize: 10.5, color: Colors.ink3, marginTop: 2, textAlign: 'center' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  dragHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.line, alignSelf: 'center', marginTop: 12, marginBottom: 8 },
  modalHero: { padding: 24, alignItems: 'center', overflow: 'hidden', borderRadius: 16, marginHorizontal: 16 },
  modalNum: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  modalArab: { fontFamily: 'serif', fontSize: 52, color: Colors.gold, marginTop: 8, lineHeight: 64 },
  modalLatin: { fontSize: 22, fontWeight: '400', color: '#fff', marginTop: 6 },
  modalMeaning: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  modalBody: { padding: 20 },
  modalDescLabel: { fontSize: 11, fontWeight: '600', color: Colors.ink3, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  modalDesc: { fontSize: 15, color: Colors.ink, lineHeight: 24 },
});
