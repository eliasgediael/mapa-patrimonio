import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Line, Path, Stop } from 'react-native-svg';
import { colors } from '../theme';

/** Linha com área preenchida. Marca o primeiro ponto como "hoje". */
export function Sparkline({ values, height = 90, color = colors.accent }: { values: number[]; height?: number; color?: string }) {
  const [width, setWidth] = useState(0);
  const pad = 6;

  let line = '';
  let area = '';
  let first = { x: 0, y: 0 };
  let last = { x: 0, y: 0 };

  if (width > 0 && values.length > 1) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;
    const pts = values.map((v, i) => ({
      x: pad + (i / (values.length - 1)) * (width - pad * 2),
      y: pad + (1 - (v - min) / span) * (height - pad * 2),
    }));
    // se tudo for igual, desenha a linha no meio
    if (max === min) pts.forEach((p) => (p.y = height / 2));
    line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    area = `${line} L${pts[pts.length - 1].x.toFixed(1)},${height} L${pts[0].x.toFixed(1)},${height} Z`;
    first = pts[0];
    last = pts[pts.length - 1];
  }

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && values.length > 1 && (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={color} stopOpacity={0.35} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Path d={area} fill="url(#spark)" />
          <Line x1={first.x} y1={pad} x2={first.x} y2={height} stroke={colors.dim} strokeDasharray="3,4" strokeWidth={1} />
          <Path d={line} stroke={color} strokeWidth={2} fill="none" strokeLinejoin="round" />
          <Circle cx={last.x} cy={last.y} r={4} fill={color} />
        </Svg>
      )}
    </View>
  );
}
