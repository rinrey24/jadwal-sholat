import React from 'react';
import { View, Text } from 'react-native';
import Svg, { G, Rect } from 'react-native-svg';

interface Props {
  n: number;
  size?: number;
  color?: string;
}

export default function Ornament({ n, size = 38, color = '#2D7A5E' }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        style={{ position: 'absolute' }}
      >
        <G fill="none" stroke={color} strokeWidth={1} opacity={0.55}>
          <Rect
            x={6}
            y={6}
            width={28}
            height={28}
            transform="rotate(45 20 20)"
          />
          <Rect x={6} y={6} width={28} height={28} />
        </G>
      </Svg>
      <Text
        style={{
          fontSize: size * 0.3,
          fontWeight: '600',
          color,
          lineHeight: size * 0.35,
        }}
      >
        {n}
      </Text>
    </View>
  );
}
