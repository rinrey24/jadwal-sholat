import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, TouchableWithoutFeedback, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius } from '../../constants/theme';

export interface ModalButton {
  text: string;
  onPress?: () => void;
  style?: 'primary' | 'outline' | 'danger';
}

interface Props {
  visible: boolean;
  title: string;
  message?: string;
  iconName?: React.ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
  buttons?: ModalButton[];
  /** Render options as a radio-style list (ideal for selection with 4+ items) */
  listMode?: boolean;
  onClose: () => void;
}

export default function CustomModal({
  visible, title, message, iconName, iconColor, buttons, listMode, onClose,
}: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scale, {
          toValue: 1, useNativeDriver: true,
          damping: 22, stiffness: 200, mass: 0.8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const btns: ModalButton[] = buttons ?? [{ text: 'OK', style: 'primary' }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* flex:1 guarantees full-screen fill on Android */}
      <Animated.View style={[s.overlay, { opacity }]}>
        {/* Backdrop tap-catcher */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Modal card */}
        <Animated.View style={[s.card, { transform: [{ scale }] }]}>
          {/* Top accent stripe */}
          <View style={s.accent} />

          {/* X close button */}
          <TouchableOpacity style={s.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Ionicons name="close" size={16} color={Colors.ink3} />
          </TouchableOpacity>

          <View style={s.inner}>
            {/* Optional icon */}
            {iconName && (
              <View style={[s.iconWrap, { backgroundColor: (iconColor ?? Colors.primary) + '18' }]}>
                <Ionicons name={iconName} size={28} color={iconColor ?? Colors.primary} />
              </View>
            )}

            <Text style={s.title}>{title}</Text>
            {!!message && <Text style={s.message}>{message}</Text>}

            {/* ── List mode: radio-style rows ── */}
            {listMode ? (
              <ScrollView
                style={s.listScroll}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <View style={s.listContainer}>
                  {btns.map((b, i) => {
                    const isSelected = b.style === 'primary';
                    return (
                      <TouchableOpacity
                        key={i}
                        style={[
                          s.listItem,
                          i < btns.length - 1 && s.listItemDivider,
                          isSelected && s.listItemSelected,
                        ]}
                        onPress={() => { b.onPress?.(); onClose(); }}
                        activeOpacity={0.65}
                      >
                        <View style={[s.radioCircle, isSelected && s.radioCircleActive]}>
                          {isSelected && <View style={s.radioDot} />}
                        </View>
                        <Text style={[s.listItemText, isSelected && s.listItemTextActive]}>
                          {b.text}
                        </Text>
                        {isSelected && (
                          <Ionicons name="checkmark" size={16} color={Colors.primary} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            ) : (
              /* ── Button mode (default) ── */
              <View style={[s.btnRow, btns.length > 1 && s.btnRowHoriz]}>
                {btns.map((b, i) => (
                  <TouchableOpacity
                    key={i}
                    activeOpacity={0.8}
                    style={[
                      s.btn,
                      b.style === 'primary' && s.btnPrimary,
                      b.style === 'outline' && s.btnOutline,
                      b.style === 'danger'  && s.btnDanger,
                      btns.length > 1 && { flex: 1 },
                    ]}
                    onPress={() => { b.onPress?.(); onClose(); }}
                  >
                    <Text style={[
                      s.btnTxt,
                      b.style === 'primary' && s.btnTxtPrimary,
                      b.style === 'danger'  && s.btnTxtDanger,
                    ]}>
                      {b.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(8,18,16,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 36,
    elevation: 24,
  },
  accent: { height: 5, backgroundColor: Colors.primary },

  closeBtn: {
    position: 'absolute',
    top: 14, right: 14,
    width: 28, height: 28,
    borderRadius: 14,
    backgroundColor: Colors.chip,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },

  inner: { padding: 26, alignItems: 'center' },
  iconWrap: {
    width: 64, height: 64, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18, fontWeight: '700',
    color: Colors.ink, textAlign: 'center',
    letterSpacing: -0.3,
  },
  message: {
    marginTop: 10, fontSize: 13.5,
    color: Colors.ink2, textAlign: 'center',
    lineHeight: 22,
  },

  // ── List mode ──────────────────────────────
  listScroll: { width: '100%', marginTop: 18, maxHeight: 280 },
  listContainer: {
    borderWidth: 1, borderColor: Colors.line,
    borderRadius: Radius.lg, overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    gap: 12, backgroundColor: Colors.surface,
  },
  listItemDivider: { borderBottomWidth: 0.5, borderBottomColor: Colors.line },
  listItemSelected: { backgroundColor: Colors.primarySoft },
  radioCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.line,
    alignItems: 'center', justifyContent: 'center',
  },
  radioCircleActive: { borderColor: Colors.primary },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  listItemText: {
    flex: 1, fontSize: 14, color: Colors.ink2, fontWeight: '400',
  },
  listItemTextActive: { color: Colors.primaryInk, fontWeight: '600' },

  // ── Button mode ────────────────────────────
  btnRow: { marginTop: 22, gap: 8, width: '100%' },
  btnRowHoriz: { flexDirection: 'row' },
  btn: {
    paddingVertical: 13, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.chip,
  },
  btnPrimary: { backgroundColor: Colors.primary },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.line },
  btnDanger:  { backgroundColor: '#FEE2E2' },
  btnTxt:        { fontSize: 14, fontWeight: '600', color: Colors.ink2 },
  btnTxtPrimary: { color: '#fff' },
  btnTxtDanger:  { color: Colors.error },
});
