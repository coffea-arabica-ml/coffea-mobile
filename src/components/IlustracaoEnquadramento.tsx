import Svg, { Circle, G, Path } from 'react-native-svg'
import { cores } from '../theme'

// Folha: x, y, rotação, escala (mesmo desenho do coffea-web).
const FOLHAS: [number, number, number, number][] = [
  [120, 70, -60, 0.8],
  [120, 70, -120, 0.8],
  [120, 100, -25, 1],
  [120, 100, -155, 1],
  [120, 135, -15, 1.15],
  [120, 135, -165, 1.15],
  [120, 170, -8, 1.3],
  [120, 170, -172, 1.3],
  [120, 205, -2, 1.35],
  [120, 205, -178, 1.35],
]
const FRUTOS = [
  [112, 150],
  [128, 186],
  [114, 190],
]
const FOLHA = 'M0 0 C 10 -9, 30 -9, 40 0 C 30 9, 10 9, 0 0 Z'

/** Visor de câmera com um cafeeiro: indica onde a foto vai aparecer e como enquadrar a planta. */
export function IlustracaoEnquadramento({ altura = 180 }: { altura?: number }) {
  return (
    <Svg width={(altura * 240) / 300} height={altura} viewBox="0 0 240 300" fill="none" accessible={false}>
      {/* cantos do visor */}
      <Path
        d="M20 50 V20 H50 M190 20 H220 V50 M220 250 V280 H190 M50 280 H20 V250"
        stroke={cores.folha600}
        strokeOpacity={0.5}
        strokeWidth={3}
        strokeLinecap="round"
      />
      {/* a lente */}
      <Circle cx={160} cy={118} r={30} stroke={cores.cereja500} strokeOpacity={0.7} strokeWidth={2} strokeDasharray="4 6" />
      {/* vaso e caule */}
      <Path d="M92 236 H148 L141 268 H99 Z" fill={cores.folha900} fillOpacity={0.15} />
      <Path d="M120 238 V58" stroke={cores.folha700} strokeOpacity={0.6} strokeWidth={3} strokeLinecap="round" />
      <G>
        {FOLHAS.map(([x, y, r, s], i) => (
          <Path
            key={i}
            d={FOLHA}
            transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}
            fill={i % 3 === 0 ? cores.folha500 : cores.folha600}
            fillOpacity={i % 3 === 0 ? 0.55 : 0.4}
          />
        ))}
      </G>
      {FRUTOS.map(([cx, cy], i) => (
        <Circle key={i} cx={cx} cy={cy} r={4.5} fill={cores.cereja500} fillOpacity={0.5} />
      ))}
    </Svg>
  )
}
