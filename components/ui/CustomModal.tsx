import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet,
  Animated, TouchableWithoutFeedback,
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
  onClose: () => void;
}

export default function CustomModal({
  visible, title, message, iconName, iconColor, buttons, onClose,
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
      {/* flex:1 guarantees full-screen fill on Android (absoluteFillObject siblings
          are unreliable with statusBarTranslucent on some devices) */}
      <Animated.View style={[s.overlay, { opacity }]}>
        {/* Backdrop tap-catcher — rendered before card so card sits on top */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Modal card */}
        <Animated.View style={[s.card, { transform: [{ scale }] }]}>
          {/* Top accent stripe */}
          <View style={s.accent} />

          <View style={s.inner}>
            {/* Optional icon */}
            {iconName && (
              <View style={[s.iconWrap, { backgroundColor: (iconColor ?? Colors.primary) + '18' }]}>
                <Ionicons name={iconName} size={28} color={iconColor ?? Colors.primary} />
              </View>
            )}

            <Text style={s.title}>{title}</Text>
            {!!message && <Text style={s.message}>{message}</Text>}

            {/* Buttons */}
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
