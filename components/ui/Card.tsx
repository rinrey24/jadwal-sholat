import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp, TouchableOpacity } from 'react-native';
import { Colors, Shadow, Radius } from '../../constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  pad?: number;
  radius?: number;
  onPress?: () => void;
}

export default function Card({ children, style, pad = 16, radius = Radius.xl, onPress }: Props) {
  const inner = (
    <View
      style={[
        styles.card,
        { padding: pad, borderRadius: radius },
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {inner}
      </TouchableOpacity>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderWidth: 0.5,
    borderColor: Colors.line,
    ...Shadow.card,
  },
});
