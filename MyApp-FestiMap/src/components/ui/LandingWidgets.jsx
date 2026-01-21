
import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.5)',
  glass: 'rgba(255,255,255,0.06)',
};

export const StatItem = ({ val, label, anim, emoji, floatAnim }) => (
  <Animated.View style={[styles.statItem, { opacity: anim, transform: [{ scale: anim }] }]}>
    <Animated.Text style={[styles.statEmoji, { transform: [{ translateY: floatAnim }] }]}>{emoji}</Animated.Text>
    <Text style={styles.statVal}>{val}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </Animated.View>
);

export const RegionCard = ({ name, emoji, color, desc }) => (
  <View style={[styles.regionCard, { backgroundColor: color }]}>
     <Text style={styles.regionEmoji}>{emoji}</Text>
     <Text style={styles.regionName}>{name}</Text>
     <Text style={styles.regionDesc}>{desc}</Text>
  </View>
);

export const FeatureItem = ({ emoji, title, desc, color }) => (
  <View style={styles.featureBox}>
    <View style={[styles.featIcon, { backgroundColor: color + '30', borderColor: color }]}>
      <Text style={{fontSize: 24}}>{emoji}</Text>
    </View>
    <Text style={styles.featTitle}>{title}</Text>
    <Text style={styles.featDesc}>{desc}</Text>
  </View>
);

export const StepItem = ({ num, title, desc }) => (
  <View style={styles.stepItem}>
     <View style={styles.stepCircle}><Text style={styles.stepNum}>{num}</Text></View>
     <View style={{flex: 1}}>
        <Text style={styles.stepTitle}>{title}</Text>
        <Text style={styles.stepDesc}>{desc}</Text>
     </View>
  </View>
);

const styles = StyleSheet.create({
  statItem: { flex: 1, alignItems: 'center' },
  statEmoji: { fontSize: 20, marginBottom: 5 },
  statVal: { color: COLORS.accent, fontSize: 22, fontWeight: '900' },
  statLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 'bold', marginTop: 4 },
  regionCard: { width: 160, height: 200, borderRadius: 25, padding: 20, justifyContent: 'flex-end', elevation: 10 },
  regionEmoji: { fontSize: 40, marginBottom: 10 },
  regionName: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  regionDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 4 },
  featureBox: { flex: 1, backgroundColor: COLORS.glass, padding: 20, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  featIcon: { width: 55, height: 55, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12, borderWidth: 1 },
  featTitle: { color: COLORS.white, fontSize: 14, fontWeight: 'bold' },
  featDesc: { color: COLORS.muted, fontSize: 10, textAlign: 'center', marginTop: 4 },
  stepItem: { flexDirection: 'row', gap: 20, alignItems: 'center' },
  stepCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  stepNum: { color: COLORS.ink, fontWeight: 'bold' },
  stepTitle: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
  stepDesc: { color: COLORS.muted, fontSize: 12, marginTop: 2 },
});
