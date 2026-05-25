import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Line, Text as SvgText, G, Path, Rect } from 'react-native-svg';

import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/theme';
import GeoPattern from '../../components/ui/GeoPattern';
import CustomModal from '../../components/ui/CustomModal';

// Calculate qibla bearing from a given location to Mecca
function calcQibla(lat: number, lng: number): number {
  const MECCA_LAT = 21.4225;
  const MECCA_LNG = 39.8262;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;

  const φ1 = toRad(lat);
  const φ2 = toRad(MECCA_LAT);
  const Δλ = toRad(MECCA_LNG - lng);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const bearing = toDeg(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

function calcDistance(lat: number, lng: number): number {
  const MECCA_LAT = 21.4225;
  const MECCA_LNG = 39.8262;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(MECCA_LAT - lat);
  const dLng = toRad(MECCA_LNG - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(MECCA_LAT)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export default function QiblaScreen() {
  const insets = useSafeAreaInsets();
  const [heading, setHeading] = useState(0);
  const [qibla, setQibla] = useState(295); // default Jakarta
  const [distance, setDistance] = useState(7926);
  // `aligned` is derived during render — keeping it as state caused a
  // "maximum update depth exceeded" loop because setAligned inside a
  // [heading]-dep effect triggered re-renders that re-fired the effect.
  const [accuracy] = useState<'good' | 'low' | 'uncalibrated'>('good');
  const [showCalibModal, setShowCalibModal] = useState(false);
  const dialAnim = useRef(new Animated.Value(0)).current;
  const wasAligned = useRef(false);

  useEffect(() => {
    setupLocation();
    const sub = Magnetometer.addListener(({ x, y }) => {
      // atan2(-x, y) gives clockwise bearing from magnetic North.
      // atan2(y,x) was wrong — that measures from the East axis (off by 90°).
      let h = Math.atan2(-x, y) * (180 / Math.PI);
      h = (h + 360) % 360;
      setHeading(h);
    });
    Magnetometer.setUpdateInterval(100);
    return () => sub.remove();
  }, []);

  async function setupLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      const q = calcQibla(loc.coords.latitude, loc.coords.longitude);
      const d = calcDistance(loc.coords.latitude, loc.coords.longitude);
      setQibla(q);
      setDistance(d);
    } catch (e) { console.warn(e); }
  }

  // Animate dial rotation only — no setState here to avoid render loops.
  useEffect(() => {
    const anim = Animated.timing(dialAnim, {
      toValue: -heading,
      duration: 150,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [heading]);

  // Derived alignment (computed during render, see below) — fire haptics
  // only when alignment edge changes. This effect is cheap and won't loop.
  const arrowDir = (qibla - heading + 360) % 360;
  const aligned = arrowDir < 5 || arrowDir > 355;
  useEffect(() => {
    if (aligned && !wasAligned.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    wasAligned.current = aligned;
  }, [aligned]);

  // Pass the ABSOLUTE qibla bearing (not arrowDir) to the dial SVG.
  // The dial already rotates by -heading, so the arrow's on-screen angle
  // becomes (qibla - heading) automatically — i.e. how far to turn to face Mecca.
  // Using arrowDir here caused heading to be subtracted twice.
  const qiblaArrowRot = qibla;

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <GeoPattern color={Colors.gold} opacity={0.05} size={100} />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Arah Kiblat</Text>
          <Text style={s.headerSub}>Menggunakan sensor magnetometer</Text>
        </View>
        <TouchableOpacity style={s.refreshBtn} onPress={setupLocation}>
          <Ionicons name="refresh-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bearing readout */}
      <View style={s.readout}>
        <Text style={s.readoutLabel}>BEARING DARI UTARA</Text>
        <Text style={s.readoutDeg}>
          {Math.round(qibla)}<Text style={s.readoutDegSup}>°</Text>
        </Text>
        <Text style={s.readoutSub}>
          Barat Laut · {distance.toLocaleString()} km ke Ka'bah
        </Text>
      </View>

      {/* Compass */}
      <View style={s.compassWrapper}>
        <Animated.View
          style={[
            s.dialWrapper,
            { transform: [{ rotate: dialAnim.interpolate({ inputRange: [-3600, 3600], outputRange: ['-3600deg', '3600deg'] }) }] },
          ]}
        >
          <CompassDial qiblaRot={qiblaArrowRot} />
        </Animated.View>

        {/* Fixed center pin */}
        <View style={s.centerPin}>
          <View style={s.centerDot} />
        </View>

        {/* Fixed top indicator */}
        <View style={s.topIndicator} />
      </View>

      {/* Status pill */}
      <View style={[s.statusPill, aligned && s.statusPillAligned]}>
        <View style={[s.statusDot, { backgroundColor: aligned ? Colors.gold : 'rgba(255,255,255,0.6)' }]} />
        <Text style={[s.statusText, aligned && { color: Colors.gold }]}>
          {aligned ? 'Anda menghadap kiblat ✓' : 'Putar perlahan ke arah kiblat'}
        </Text>
      </View>

      {/* Accuracy warning */}
      {accuracy === 'uncalibrated' && (
        <Text style={s.accuracyWarn}>⚠ Kalibrasi sensor diperlukan</Text>
      )}

      {/* Bottom actions */}
      <View style={s.bottomActions}>
        <TouchableOpacity
          style={s.calibrateBtn}
          onPress={() => setShowCalibModal(true)}
        >
          <Ionicons name="hand-left-outline" size={16} color="#fff" />
          <Text style={s.calibrateBtnText}>Kalibrasi</Text>
        </TouchableOpacity>
        <View style={s.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" />
          <Text style={s.infoText}>Jauhkan dari logam & elektronik</Text>
        </View>
      </View>

      {/* Calibration modal */}
      <CustomModal
        visible={showCalibModal}
        title="Kalibrasi Kompas"
        message="Gerakkan ponsel Anda membentuk angka 8 beberapa kali untuk mengkalibrasi sensor magnetometer."
        iconName="compass-outline"
        onClose={() => setShowCalibModal(false)}
        buttons={[{ text: 'Mengerti', style: 'primary', onPress: () => setShowCalibModal(false) }]}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────
// SVG Compass Dial
// ─────────────────────────────────────────────────────────────
function CompassDial({ qiblaRot }: { qiblaRot: number }) {
  const SIZE = 300;
  const CX = SIZE / 2;
  const CY = SIZE / 2;
  const R = 142;

  const ticks = [];
  for (let i = 0; i < 360; i += 6) {
    const isMajor = i % 30 === 0;
    const rad = (i * Math.PI) / 180;
    const x1 = CX + (R - (isMajor ? 16 : 8)) * Math.sin(rad);
    const y1 = CY - (R - (isMajor ? 16 : 8)) * Math.cos(rad);
    const x2 = CX + R * Math.sin(rad);
    const y2 = CY - R * Math.cos(rad);
    ticks.push(
      <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
        stroke={isMajor ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.18)'}
        strokeWidth={isMajor ? 1.5 : 1}
      />
    );
  }

  const cardinals = [
    { d: 0, l: 'U', color: '#F87171' },
    { d: 90, l: 'T', color: 'rgba(255,255,255,0.8)' },
    { d: 180, l: 'S', color: 'rgba(255,255,255,0.8)' },
    { d: 270, l: 'B', color: 'rgba(255,255,255,0.8)' },
  ];

  const qiblaRad = (qiblaRot * Math.PI) / 180;

  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={1} />
      <Circle cx={CX} cy={CY} r={110} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
      {ticks}

      {cardinals.map((c) => {
        const rad = (c.d * Math.PI) / 180;
        const tx = CX + (R - 34) * Math.sin(rad);
        const ty = CY - (R - 34) * Math.cos(rad) + 6;
        return (
          <SvgText key={c.d} x={tx} y={ty} textAnchor="middle" fontSize={18} fontWeight="500" fill={c.color}>
            {c.l}
          </SvgText>
        );
      })}

      {/* Qibla Arrow */}
      <G rotation={qiblaRot} origin={`${CX}, ${CY}`}>
        {/* Ka'bah icon at top */}
        <G transform={`translate(${CX - 12}, ${CY - R + 2})`}>
          <Rect x={0} y={6} width={24} height={20} rx={2} fill={Colors.gold} />
          <Rect x={0} y={6} width={24} height={4} fill="#1B3026" />
          <Rect x={8} y={14} width={8} height={6} fill="#1B3026" opacity={0.5} />
        </G>
        {/* Arrow shaft */}
        <Path
          d={`M${CX} ${CY - R + 26} L${CX - 8} ${CY - R + 46} L${CX} ${CY - R + 42} L${CX + 8} ${CY - R + 46} Z`}
          fill={Colors.gold}
        />
        <Line x1={CX} y1={CY - R + 42} x2={CX} y2={CY - 40}
          stroke={Colors.gold} strokeWidth={2} />
      </G>
    </Svg>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.qiblaBg,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 8,
    flexDirection: 'row', alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  refreshBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  readout: { alignItems: 'center', marginTop: 4 },
  readoutLabel: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', fontWeight: '600' },
  readoutDeg: { fontSize: 60, fontWeight: '400', letterSpacing: -1, color: Colors.gold, marginTop: 4 },
  readoutDegSup: { fontSize: 32 },
  readoutSub: { fontSize: 13, color: 'rgba(255,255,255,0.78)' },

  compassWrapper: {
    position: 'relative', width: 300, height: 300,
    alignSelf: 'center', marginTop: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  dialWrapper: { position: 'absolute', width: 300, height: 300 },
  centerPin: {
    position: 'absolute', width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center', justifyContent: 'center',
  },
  centerDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold,
    shadowColor: Colors.gold, shadowRadius: 6, shadowOpacity: 1,
  },
  topIndicator: {
    position: 'absolute', top: -4, width: 0, height: 0,
    borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 12,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#fff',
  },

  statusPill: {
    alignSelf: 'center', marginTop: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statusPillAligned: {
    backgroundColor: 'rgba(201,162,39,0.2)',
    borderColor: Colors.gold,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.85)' },
  accuracyWarn: { textAlign: 'center', color: Colors.warning, fontSize: 12, marginTop: 8 },

  bottomActions: {
    position: 'absolute', left: 0, right: 0, bottom: 30,
    paddingHorizontal: 22, gap: 10, alignItems: 'center',
  },
  calibrateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  calibrateBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  infoText: { fontSize: 11.5, color: 'rgba(255,255,255,0.55)' },
});
