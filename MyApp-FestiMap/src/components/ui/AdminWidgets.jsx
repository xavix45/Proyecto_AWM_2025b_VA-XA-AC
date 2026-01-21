
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const COLORS = {
  accent: '#ffb800',
  violet: '#8b5cf6',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.4)',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  ink: '#020617',
};

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export const KPICard = ({ emoji, label, value, sub, color, border }) => (
  <View style={[styles.kpiCard, { borderColor: border || COLORS.glassBorder }]}>
     <View style={[styles.kpiIcon, { backgroundColor: color + '15' }]}>
        <Text style={{fontSize: 20}}>{emoji}</Text>
     </View>
     <Text style={styles.kpiValue}>{value}</Text>
     <Text style={styles.kpiLabel}>{label.toUpperCase()}</Text>
     <Text style={styles.kpiSub}>{sub}</Text>
  </View>
);

export const DataProgress = ({ label, count, total, color, showPerc = true }) => {
  const perc = total > 0 ? (count / total) * 100 : 0;
  return (
    <View style={styles.progContainer}>
      <View style={styles.progHeader}>
        <Text style={styles.progLabel}>{label}</Text>
        <Text style={styles.progVal}>{showPerc ? `${perc.toFixed(1)}%` : count}</Text>
      </View>
      <View style={styles.progTrack}>
        <Animated.View style={[styles.progFill, { width: `${perc}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

export const CircularDonut = ({ data, total }) => {
  return (
    <View style={styles.donutContainer}>
      <View style={styles.donutCircle}>
         <View style={[styles.donutLayer, { backgroundColor: COLORS.violet + '20', width: '100%', height: '100%' }]} />
         <View style={[styles.donutLayer, { backgroundColor: COLORS.accent + '20', width: '85%', height: '85%' }]} />
         <View style={[styles.donutLayer, { backgroundColor: COLORS.info + '20', width: '70%', height: '70%' }]} />
         <View style={styles.donutCenter}>
            <Text style={styles.donutVal}>{total}</Text>
            <Text style={styles.donutLabel}>TOTAL</Text>
         </View>
      </View>
      <View style={styles.donutLegend}>
         {data.map((item, idx) => (
           <View key={idx} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: [COLORS.violet, COLORS.accent, COLORS.info, COLORS.success][idx % 4] }]} />
              <Text style={styles.legendText}>{item.reg}: {item.count}</Text>
           </View>
         ))}
      </View>
    </View>
  );
};

export const SentimentMatrix = ({ counts, total }) => (
  <View style={styles.matrix}>
    {[5, 4, 3, 2, 1].map(star => {
      const count = counts[star];
      const perc = total > 0 ? (count / total) * 100 : 0;
      return (
        <View key={star} style={styles.matrixRow}>
          <Text style={styles.matrixStar}>{star} ★</Text>
          <View style={styles.matrixTrack}>
            <View style={[styles.matrixFill, { width: `${perc}%`, backgroundColor: star >= 4 ? COLORS.success : star === 3 ? COLORS.warning : COLORS.error }]} />
          </View>
          <Text style={styles.matrixCount}>{count}</Text>
        </View>
      );
    })}
  </View>
);

export const SeasonalChart = ({ distribution }) => (
  <View style={styles.seasonContainer}>
    <View style={styles.seasonBars}>
      {distribution.map((val, idx) => {
        const max = Math.max(...distribution, 1);
        const heightPerc = (val / max) * 100;
        return (
          <View key={idx} style={styles.seasonCol}>
             <View style={[styles.seasonBar, { height: `${heightPerc}%`, backgroundColor: val === max ? COLORS.accent : COLORS.violet + '50' }]} />
             <Text style={styles.seasonLabel}>{MESES[idx]}</Text>
          </View>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  kpiCard: { flex: 1, backgroundColor: COLORS.glass, padding: 22, borderRadius: 32, borderWidth: 1, alignItems: 'center' },
  kpiIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  kpiValue: { color: 'white', fontSize: 24, fontWeight: '900' },
  kpiLabel: { color: COLORS.accent, fontSize: 9, fontWeight: '900', marginTop: 4, letterSpacing: 1 },
  kpiSub: { color: COLORS.muted, fontSize: 8, marginTop: 2 },
  progContainer: { marginBottom: 22 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  progLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' },
  progVal: { color: COLORS.accent, fontSize: 12, fontWeight: '900' },
  progTrack: { height: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 5, overflow: 'hidden' },
  progFill: { height: '100%', borderRadius: 5 },
  donutContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginVertical: 10 },
  donutCircle: { width: 140, height: 140, borderRadius: 70, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' },
  donutLayer: { position: 'absolute', borderRadius: 100 },
  donutCenter: { width: 90, height: 90, borderRadius: 45, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  donutVal: { color: 'white', fontSize: 28, fontWeight: '900' },
  donutLabel: { color: COLORS.muted, fontSize: 8, fontWeight: 'bold' },
  donutLegend: { gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  matrix: { gap: 8 },
  matrixRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  matrixStar: { color: COLORS.muted, fontSize: 10, width: 30 },
  matrixTrack: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 4 },
  matrixFill: { height: '100%', borderRadius: 4 },
  matrixCount: { color: COLORS.muted, fontSize: 10, width: 25, textAlign: 'right' },
  seasonContainer: { height: 180, justifyContent: 'flex-end', paddingTop: 20 },
  seasonBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1 },
  seasonCol: { alignItems: 'center', flex: 1 },
  seasonBar: { width: '60%', borderRadius: 4 },
  seasonLabel: { color: COLORS.muted, fontSize: 8, marginTop: 10, fontWeight: 'bold' },
});
