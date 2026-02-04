
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Platform, 
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { useAgenda } from '../context/AgendaContext.jsx';
import CardEvento from '../components/CardEvento.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  violet: '#8b5cf6', 
  ink: '#0f172a',    
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  card: '#1e293b',
  error: '#ef4444'
};

export default function Agenda({ navigation }) {
  const { agenda, planes, quitarEvento, eliminarPlan, refrescarPlanes } = useAgenda();
  const [tab, setTab] = useState('eventos');
  const [loading, setLoading] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, easing: Easing.out(Easing.quad), useNativeDriver: true })
    ]).start();
  }, [tab]);

  const handleEliminarPlan = async (id) => {
    setLoading(true);
    await eliminarPlan(id);
    setLoading(false);
  };

  const renderEmptyState = (type) => {
    const isEvent = type === 'eventos';
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyEmoji}>{isEvent ? '📅' : '🧭'}</Text>
        </View>
        <Text style={styles.emptyTitle}>
          {isEvent ? 'Tu agenda está libre' : 'Sin rutas trazadas'}
        </Text>
        <Text style={styles.emptySub}>
          {isEvent 
            ? 'Explora las festividades de Ecuador y guarda tus favoritas aquí.' 
            : 'Usa el planificador de rutas para diseñar tu próximo viaje.'}
        </Text>
        <TouchableOpacity 
          style={styles.exploreBtn} 
          onPress={() => navigation.navigate(isEvent ? 'InicioTab' : 'PlanTab')}
        >
          <Text style={styles.exploreBtnText}>DESCUBRIR AHORA</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <View style={styles.header}>
        <View>
          <Text style={styles.preTitle}>MI COLECCIÓN CULTURAL</Text>
          <Text style={styles.title}>Agenda <Text style={{color: COLORS.accent}}>Personal</Text></Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{tab === 'eventos' ? agenda.length : planes.length}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity 
            style={[styles.tabItem, tab === 'eventos' && styles.tabItemActive]} 
            onPress={() => setTab('eventos')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'eventos' && styles.tabTextActive]}>EVENTOS</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, tab === 'planes' && styles.tabItemActive]} 
            onPress={() => setTab('planes')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, tab === 'planes' && styles.tabTextActive]}>RUTAS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scroll}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {tab === 'eventos' ? (
            agenda.length === 0 ? renderEmptyState('eventos') : (
              agenda.map((ev, index) => (
                <View key={ev._id || ev.id} style={styles.eventCardWrapper}>
                  <CardEvento evento={ev} />
                  <TouchableOpacity 
                    style={styles.deleteMiniBtn} 
                    onPress={() => quitarEvento(ev._id || ev.id)}
                  >
                    <Text style={styles.deleteMiniText}>×</Text>
                  </TouchableOpacity>
                </View>
              ))
            )
          ) : (
            loading ? <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: 50}} /> :
            planes.length === 0 ? renderEmptyState('planes') : (
              planes.map((plan, index) => (
                <TouchableOpacity 
                  key={plan._id || plan.idPlan} 
                  style={styles.planCard}
                  onPress={() => navigation.navigate('PlanTab', { planId: plan._id })}
                  activeOpacity={0.9}
                >
                  <View style={styles.planTicketLeft}>
                    <Text style={styles.planDayCount}>{plan.dias}</Text>
                    <Text style={styles.planDayLabel}>DÍAS</Text>
                  </View>
                  
                  <View style={styles.planInfo}>
                    <View style={styles.planHeaderRow}>
                      <Text style={styles.planTitle} numberOfLines={1}>{(plan.nombrePlan || plan.nombre).toUpperCase()}</Text>
                      <TouchableOpacity onPress={() => handleEliminarPlan(plan._id)}>
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.routeRow}>
                      <Text style={styles.routePoint}>{plan.origen}</Text>
                      <View style={styles.routeLine} />
                      <Text style={styles.routePoint}>{plan.destino}</Text>
                    </View>
                    
                    <View style={styles.planFooter}>
                      <Text style={styles.planDate}>📅 {new Date(plan.createdAt).toLocaleDateString()}</Text>
                      <Text style={styles.planStops}>📍 {plan.eventosIds?.length || 0} paradas</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}

          <View style={{height: 120}} />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  header: { paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 50 : 20, paddingBottom: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white, marginTop: 4 },
  countBadge: { width: 45, height: 45, borderRadius: 23, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  countBadgeText: { color: 'white', fontWeight: '900', fontSize: 16 },
  tabContainer: { paddingHorizontal: 25, marginBottom: 25 },
  tabWrapper: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 6, borderWidth: 1, borderColor: COLORS.glassBorder },
  tabItem: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 15 },
  tabItemActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  tabText: { color: COLORS.muted, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  tabTextActive: { color: COLORS.accent },
  scroll: { paddingHorizontal: 25 },
  eventCardWrapper: { position: 'relative' },
  deleteMiniBtn: { position: 'absolute', top: 15, right: 15, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239, 68, 68, 0.9)', alignItems: 'center', justifyContent: 'center', zIndex: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  deleteMiniText: { color: 'white', fontWeight: 'bold', fontSize: 20, lineHeight: 22 },
  planCard: { flexDirection: 'row', backgroundColor: COLORS.glass, borderRadius: 25, marginBottom: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder, height: 140 },
  planTicketLeft: { width: 80, backgroundColor: COLORS.violet + '20', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: COLORS.glassBorder, borderStyle: 'dashed' },
  planDayCount: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  planDayLabel: { fontSize: 9, fontWeight: '900', color: COLORS.accent, letterSpacing: 1 },
  planInfo: { flex: 1, padding: 20, justifyContent: 'space-between' },
  planHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  deleteIcon: { fontSize: 16, opacity: 0.6 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
  routePoint: { fontSize: 11, color: COLORS.white, fontWeight: '700' },
  routeLine: { flex: 1, height: 1, backgroundColor: COLORS.muted, marginHorizontal: 10, opacity: 0.3 },
  planFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planDate: { fontSize: 10, color: COLORS.muted, fontWeight: 'bold' },
  planStops: { fontSize: 10, color: COLORS.accent, fontWeight: '900' },
  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 30 },
  emptyIconCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center', marginBottom: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
  emptyEmoji: { fontSize: 45 },
  emptyTitle: { color: COLORS.white, fontSize: 22, fontWeight: '900', marginBottom: 10 },
  emptySub: { color: COLORS.muted, textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 30 },
  exploreBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 30, paddingVertical: 18, borderRadius: 20 },
  exploreBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});
