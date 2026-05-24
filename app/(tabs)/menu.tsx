import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { Colors, Radius, Shadow } from '../../constants/theme';
import Card from '../../components/ui/Card';
import CustomModal from '../../components/ui/CustomModal';
import {
  getAppSettings, saveAppSettings, AppSettings, DEFAULT_SETTINGS,
  getSavedLocation, saveLocation,
} from '../../services/storage';

const CALC_METHODS = [
  { id: 20, label: 'Kemenag RI (Indonesia)' },
  { id: 1,  label: 'Karachi (Hanafi)' },
  { id: 2,  label: 'ISNA (Amerika Utara)' },
  { id: 3,  label: 'MWL (Liga Muslim Dunia)' },
  { id: 4,  label: 'Makkah (Umm Al-Qura)' },
  { id: 5,  label: 'Mesir' },
];

const ADZAN_SOUNDS = [
  { id: 'default',  label: 'Default' },
  { id: 'makkah',  label: 'Makkah' },
  { id: 'madinah', label: 'Madinah' },
  { id: 'silent',  label: 'Senyap' },
];

const NOTIFY_MINUTES = [0, 5, 10, 15];
const FONT_SIZES: Array<AppSettings['fontSize']> = ['small', 'medium', 'large'];
const FONT_LABEL: Record<AppSettings['fontSize'], string> = {
  small: 'Kecil', medium: 'Sedang', large: 'Besar',
};
const PRAYER_LABELS: Record<keyof AppSettings['prayerNotify'], string> = {
  Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: 'Isya',
};

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [city, setCity] = useState('—');
  const [locationLoading, setLocationLoading] = useState(false);

  // Modals
  const [methodModal, setMethodModal] = useState(false);
  const [soundModal, setSoundModal] = useState(false);
  const [minuteModal, setMinuteModal] = useState(false);

  useEffect(() => {
    getAppSettings().then(setSettings);
    getSavedLocation().then((loc) => loc && setCity(loc.city));
  }, []);

  const patch = useCallback(async (update: Partial<AppSettings>) => {
    const next = { ...settings, ...update };
    setSettings(next);
    await saveAppSettings(update);
  }, [settings]);

  async function refreshLocation() {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocationLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const geo = await Location.reverseGeocodeAsync(loc.coords);
      const c = geo[0]?.city || geo[0]?.district || geo[0]?.region || 'Unknown';
      await saveLocation(loc.coords.latitude, loc.coords.longitude, c);
      setCity(c);
    } catch { /* ignore */ }
    setLocationLoading(false);
  }

  const selectedMethod = CALC_METHODS.find((m) => m.id === settings.calcMethod) ?? CALC_METHODS[0];
  const selectedSound = ADZAN_SOUNDS.find((s) => s.id === settings.adzanSound) ?? ADZAN_SOUNDS[0];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Pengaturan</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── TAMPILAN ────────────────────────────────────── */}
        <SectionHeader label="Tampilan" />
        <Card pad={0} radius={Radius.xl} style={s.group}>
          <SettingRow icon="text-outline" label="Ukuran Font Qur'an">
            <View style={s.segmented}>
              {FONT_SIZES.map((f) => (
                <TouchableOpacity
                  key={f}
                  style={[s.segBtn, settings.fontSize === f && s.segBtnActive]}
                  onPress={() => patch({ fontSize: f })}
                >
                  <Text style={[s.segLabel, settings.fontSize === f && s.segLabelActive]}>
                    {FONT_LABEL[f]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </SettingRow>
        </Card>

        {/* ── JADWAL SHOLAT ─────────────────────────────── */}
        <SectionHeader label="Jadwal Sholat" />
        <Card pad={0} radius={Radius.xl} style={s.group}>
          <SettingRow icon="location-outline" label="Lokasi" divider>
            <View style={s.locationRight}>
              <Text style={s.valueText}>{city}</Text>
              {locationLoading
                ? <ActivityIndicator size="small" color={Colors.primary} style={{ marginLeft: 8 }} />
                : (
                  <TouchableOpacity onPress={refreshLocation} style={s.refreshBtn}>
                    <Ionicons name="refresh-outline" size={15} color={Colors.primary} />
                  </TouchableOpacity>
                )
              }
            </View>
          </SettingRow>
          <SettingRow icon="calculator-outline" label="Metode Hisab" divider onPress={() => setMethodModal(true)}>
            <View style={s.valueRow}>
              <Text style={s.valueText} numberOfLines={1}>{selectedMethod.label}</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.ink3} />
            </View>
          </SettingRow>
          <SettingRow icon="volume-medium-outline" label="Suara Adzan" onPress={() => setSoundModal(true)}>
            <View style={s.valueRow}>
              <Text style={s.valueText}>{selectedSound.label}</Text>
              <Ionicons name="chevron-forward" size={15} color={Colors.ink3} />
            </View>
          </SettingRow>
        </Card>

        {/* ── NOTIFIKASI ────────────────────────────────── */}
        <SectionHeader label="Notifikasi" />
        <Card pad={0} radius={Radius.xl} style={s.group}>
          <SettingRow icon="notifications-outline" label="Aktifkan Notifikasi" divider={settings.notifications}>
            <Switch
              value={settings.notifications}
              onValueChange={(v) => patch({ notifications: v })}
              trackColor={{ false: Colors.chip, true: Colors.primary }}
              thumbColor="#fff"
            />
          </SettingRow>

          {settings.notifications && (
            <>
              {(Object.keys(PRAYER_LABELS) as Array<keyof typeof PRAYER_LABELS>).map((key, i, arr) => (
                <SettingRow
                  key={key}
                  icon="time-outline"
                  label={`Adzan ${PRAYER_LABELS[key]}`}
                  indent
                  divider={i < arr.length - 1}
                >
                  <Switch
                    value={settings.prayerNotify[key]}
                    onValueChange={(v) => patch({ prayerNotify: { ...settings.prayerNotify, [key]: v } })}
                    trackColor={{ false: Colors.chip, true: Colors.primary }}
                    thumbColor="#fff"
                  />
                </SettingRow>
              ))}
              <SettingRow icon="alarm-outline" label="Menit Sebelum Adzan" divider onPress={() => setMinuteModal(true)}>
                <View style={s.valueRow}>
                  <Text style={s.valueText}>
                    {settings.notifyMinutes === 0 ? 'Tepat waktu' : `${settings.notifyMinutes} menit`}
                  </Text>
                  <Ionicons name="chevron-forward" size={15} color={Colors.ink3} />
                </View>
              </SettingRow>
              <SettingRow icon="phone-portrait-outline" label="Getaran">
                <Switch
                  value={settings.vibration}
                  onValueChange={(v) => patch({ vibration: v })}
                  trackColor={{ false: Colors.chip, true: Colors.primary }}
                  thumbColor="#fff"
                />
              </SettingRow>
            </>
          )}
        </Card>

        {/* ── IZIN APLIKASI ─────────────────────────────── */}
        <SectionHeader label="Izin Aplikasi" />
        <Card pad={0} radius={Radius.xl} style={s.group}>
          <SettingRow icon="location-outline" label="Lokasi" desc="Untuk jadwal sholat akurat" divider
            onPress={() => Linking.openSettings()}>
            <Ionicons name="open-outline" size={15} color={Colors.ink3} />
          </SettingRow>
          <SettingRow icon="notifications-circle-outline" label="Notifikasi" desc="Untuk pengingat sholat"
            onPress={() => Linking.openSettings()}>
            <Ionicons name="open-outline" size={15} color={Colors.ink3} />
          </SettingRow>
        </Card>

        {/* ── TENTANG ───────────────────────────────────── */}
        <SectionHeader label="Tentang" />
        <Card pad={0} radius={Radius.xl} style={s.group}>
          <SettingRow icon="information-circle-outline" label="Versi Aplikasi" divider>
            <Text style={s.valueText}>1.0.0</Text>
          </SettingRow>
          <SettingRow icon="star-outline" label="Beri Penilaian" divider onPress={() => {}}>
            <Ionicons name="chevron-forward" size={15} color={Colors.ink3} />
          </SettingRow>
          <SettingRow icon="code-slash-outline" label="Sumber Data">
            <Text style={[s.valueText, { fontSize: 11 }]}>alquran.cloud · aladhan.com</Text>
          </SettingRow>
        </Card>

        <Text style={s.footer}>Dibuat dengan ❤️ · Muslim App v1.0.0</Text>
      </ScrollView>

      {/* ── Modals ─────────────────────────────────────── */}
      <CustomModal
        visible={methodModal}
        title="Metode Hisab"
        message="Pilih metode perhitungan waktu sholat"
        iconName="calculator-outline"
        onClose={() => setMethodModal(false)}
        buttons={CALC_METHODS.map((m) => ({
          text: m.label,
          style: m.id === settings.calcMethod ? 'primary' : 'outline',
          onPress: () => patch({ calcMethod: m.id }),
        }))}
      />
      <CustomModal
        visible={soundModal}
        title="Suara Adzan"
        iconName="volume-medium-outline"
        onClose={() => setSoundModal(false)}
        buttons={ADZAN_SOUNDS.map((sd) => ({
          text: sd.label,
          style: sd.id === settings.adzanSound ? 'primary' : 'outline',
          onPress: () => patch({ adzanSound: sd.id as AppSettings['adzanSound'] }),
        }))}
      />
      <CustomModal
        visible={minuteModal}
        title="Menit Sebelum Adzan"
        iconName="alarm-outline"
        onClose={() => setMinuteModal(false)}
        buttons={NOTIFY_MINUTES.map((m) => ({
          text: m === 0 ? 'Tepat waktu' : `${m} menit sebelumnya`,
          style: m === settings.notifyMinutes ? 'primary' : 'outline',
          onPress: () => patch({ notifyMinutes: m }),
        }))}
      />
    </View>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionLabel}>{label.toUpperCase()}</Text>
    </View>
  );
}

interface RowProps {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  desc?: string;
  divider?: boolean;
  indent?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}

function SettingRow({ icon, label, desc, divider, indent, onPress, children }: RowProps) {
  const Wrapper: any = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      style={[s.row, divider && s.rowDivider, indent && s.rowIndent]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.rowIcon, indent && { opacity: 0.6 }]}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={s.rowLabel}>
        <Text style={s.rowLabelText}>{label}</Text>
        {desc ? <Text style={s.rowDesc}>{desc}</Text> : null}
      </View>
      {children}
    </Wrapper>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 0.5, borderBottomColor: Colors.line,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.ink },

  sectionHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1.2, color: Colors.ink3 },

  group: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface,
    borderWidth: 0.5, borderColor: Colors.line,
    ...Shadow.card,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    gap: 12,
  },
  rowDivider: { borderBottomWidth: 0.5, borderBottomColor: Colors.line },
  rowIndent: { paddingLeft: 24 },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1 },
  rowLabelText: { fontSize: 14, fontWeight: '500', color: Colors.ink },
  rowDesc: { fontSize: 11.5, color: Colors.ink3, marginTop: 1 },

  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  valueText: { fontSize: 13, color: Colors.ink2, maxWidth: 140 },
  locationRight: { flexDirection: 'row', alignItems: 'center' },
  refreshBtn: { marginLeft: 6, padding: 4 },

  segmented: { flexDirection: 'row', gap: 4 },
  segBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.chip,
  },
  segBtnActive: { backgroundColor: Colors.primary },
  segLabel: { fontSize: 12, fontWeight: '500', color: Colors.ink2 },
  segLabelActive: { color: '#fff' },

  footer: {
    textAlign: 'center', fontSize: 12,
    color: Colors.ink4, marginTop: 28, marginBottom: 8,
  },
});
