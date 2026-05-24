import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { G, Path, Rect, Circle } from 'react-native-svg';

interface Props {
  color?: string;
  opacity?: number;
  size?: number;
}

// Islamic 8-pointed star tessellation as repeating SVG tiles
export default function GeoPattern({ color = '#fff', opacity = 0.08, size = 64 }: Props) {
  // Render multiple tiles to cover the area
  const tiles = [];
  const rows = 8;
  const cols = 8;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      tiles.push(
        <G key={`${r}-${c}`} transform={`translate(${c * size}, ${r * size})`}>
          <Path
            // 4-pointed star: commas inside x,y pairs, spaces between pairs avoids
            // the "merged number" bug that `lX Y` template literals can cause in
            // react-native-svg's native path parser.
            d={[
              `M${size * 0.5},${size * 0.05}`,
              `l${size * 0.125},${size * 0.325}`,
              `${size * 0.325},${size * 0.125}`,
              `-${size * 0.325},${size * 0.125}`,
              `-${size * 0.125},${size * 0.325}`,
              `-${size * 0.125},-${size * 0.325}`,
              `-${size * 0.325},-${size * 0.125}`,
              `${size * 0.325},-${size * 0.125}`,
              'Z',
            ].join(' ')}
            fill="none"
            stroke={color}
            strokeWidth={1}
            opacity={opacity}
          />
          <Rect
            x={size * 0.35}
            y={size * 0.35}
            width={size * 0.3}
            height={size * 0.3}
            transform={`rotate(45 ${size / 2} ${size / 2})`}
            fill="none"
            stroke={color}
            strokeWidth={0.8}
            opacity={opacity * 0.6}
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size * 0.1}
            fill="none"
            stroke={color}
            strokeWidth={0.8}
            opacity={opacity * 0.5}
          />
        </G>
      );
    }
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%">
        {tiles}
      </Svg>
    </View>
  );
}
