
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  ActivityIndicator,
  Platform, 
  StatusBar,
  Dimensions,
  Animated
} from 'react-native';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';
import { KPICard } from '../components/ui/AdminWidgets.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#8b5cf6',
  ink: '#020617',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  card: '#1e293b',
  error: '#ef4444',
  success: '#10b981',
  info: '#3b82f6'
};

export default function AdminDashboard({ navigation }) {
  const { user, token } = useUser();
  const [stats, setStats] = useState({ total: 0, provincias: 0, pendientes: 0 });
  const [logs, setLogs] = useState([]); // NUEVO: Estado para auditoría
  const [loading, setLoading] = useState(true);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Intentar con token primero
      const config = token ? {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } : {};

      console.log("🔄 Cargando Dashboard... Token:", token ? "✅ Disponible" : "❌ No disponible");

      // Eventos es público, no requiere autenticación obligatoria
      const resEv = await axios.get(ENDPOINTS.eventos, config).catch(err => {
        console.error("❌ GET /eventos falló:", err.message);
        throw err;
      });

      console.log("✅ Eventos cargados:", resEv.data.length);
      
      const uniqueProv = [...new Set(resEv.data.map(item => item.provincia))];
      const pending = resEv.data.filter(e => e.status !== 'approved').length;
      
      setStats({ total: resEv.data.length, provincias: uniqueProv.length, pendientes: pending });

      // Intentar cargar logs si hay token
      if (token) {
        try {
          const resLogs = await axios.get(`${ENDPOINTS.API_BASE_URL}/admin/logs`, config);
          setLogs(resLogs.data || []);
          console.log("✅ Logs cargados:", resLogs.data?.length || 0);
        } catch (logError) {
          console.log("⚠️ Logs no disponibles (esto es normal si no están implementados)");
          setLogs([]);
        }
      }

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
      ]).start();
    } catch (e) {
      console.error("🚨 Dashboard error:", {
        message: e.message,
        status: e.response?.status,
        data: e.response?.data,
        config: e.config?.url
      });
      setStats({ total: 0, provincias: 0, pendientes: 0 });
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      const unsubscribe = navigation.addListener('focus', fetchDashboardData);
      return unsubscribe;
    }
  }, [navigation, token]);

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.loadingText}>SINCROZINANDO CONSOLA...</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar hidden={true} />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View>
            <Text style={styles.preTitle}>MODO CONTROL MAESTRO</Text>
            <Text style={styles.title}>Panel de Gestión</Text>
            <Text style={styles.adminGreet}>Hola, <Text style={{color: COLORS.accent, fontWeight: 'bold'}}>{user?.nombre || 'Administrador'}</Text></Text>
          </View>
          <View style={styles.avatarMini}><Text style={styles.avatarText}>{user?.nombre?.charAt(0) || 'A'}</Text></View>
        </Animated.View>

        <Animated.View style={[styles.kpiGrid, { opacity: fadeAnim }]}>
           <KPICard emoji="🎫" label="EVENTOS" value={stats.total} sub="Registrados" color={COLORS.info} />
           <KPICard emoji="🗺️" label="REGIONES" value={stats.provincias} sub="Activas" color={COLORS.success} />
           <KPICard emoji="⚠️" label="REVISIÓN" value={stats.pendientes} sub="Pendientes" color={stats.pendientes > 0 ? COLORS.error : COLORS.accent} />
        </Animated.View>

        <TouchableOpacity style={styles.previewModeBtn} onPress={() => navigation.navigate('Main')}>
          <Text style={styles.previewModeText}>VER COMO USUARIO 👤</Text>
        </TouchableOpacity>

        {/* NUEVO: SECCIÓN DE AUDITORÍA DE BACKEND (EL PLATO FUERTE) */}
        <View style={styles.auditSection}>
           <Text style={styles.sectionTitle}>TRAZABILIDAD DEL SERVIDOR (LOGS)</Text>
           <View style={styles.auditCard}>
              {logs.length > 0 ? logs.map((log, i) => (
                <View key={i} style={[styles.logItem, i === logs.length -1 && {borderBottomWidth: 0}]}>
                   <View style={[styles.logAction, {backgroundColor: log.accion === 'DELETE' ? COLORS.error+'20' : COLORS.success+'20'}]}>
                      <Text style={[styles.logActionText, {color: log.accion === 'DELETE' ? COLORS.error : COLORS.success}]}>{log.accion}</Text>
                   </View>
                   <View style={{flex: 1, marginLeft: 12}}>
                      <Text style={styles.logDetail} numberOfLines={1}>{log.detalle}</Text>
                      <Text style={styles.logMeta}>{new Date(log.fecha).toLocaleTimeString()} • {log.autor}</Text>
                   </View>
                </View>
              )) : (
                <Text style={styles.emptyLogs}>Sin actividad reciente registrada.</Text>
              )}
           </View>
        </View>

        <Text style={styles.sectionTitle}>MÓDULOS DE OPERACIÓN</Text>

        <TouchableOpacity style={styles.heroAction} onPress={() => navigation.navigate('AdminStats')}>
          <View style={styles.heroContent}>
            <View>
              <Text style={styles.heroTitle}>Analítica de Impacto</Text>
              <Text style={styles.heroSub}>Tráfico, check-ins y éxito real del mapa.</Text>
            </View>
            <View style={styles.heroIconBox}><Text style={styles.heroIcon}>📈</Text></View>
          </View>
          <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>NUEVO MÓDULO V5.6</Text></View>
        </TouchableOpacity>

        <View style={styles.actionsGrid}>
           <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminList')}>
              <View style={[styles.actionIconCircle, {backgroundColor: 'rgba(139, 92, 246, 0.15)'}]}><Text style={styles.actionEmoji}>📋</Text></View>
              <Text style={styles.actionTitle}>Inventario</Text>
           </TouchableOpacity>
           <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('AdminForm')}>
              <View style={[styles.actionIconCircle, {backgroundColor: 'rgba(255, 184, 0, 0.15)'}]}><Text style={styles.actionEmoji}>✨</Text></View>
              <Text style={styles.actionTitle}>Nuevo</Text>
           </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Landing')}>
           <Text style={styles.logoutText}>SALIR DE CONSOLA</Text>
        </TouchableOpacity>

        <View style={{height: 120}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', marginTop: 15, letterSpacing: 2 },
  scroll: { padding: 25 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 35 },
  preTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 4, marginBottom: 5 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  adminGreet: { color: COLORS.muted, fontSize: 15, marginTop: 5 },
  avatarMini: { width: 55, height: 55, borderRadius: 20, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.glassBorder },
  avatarText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
  kpiGrid: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  previewModeBtn: { backgroundColor: 'rgba(255,184,0,0.06)', padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 30, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  previewModeText: { color: COLORS.accent, fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  auditSection: { marginBottom: 35 },
  sectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginBottom: 20, marginLeft: 5 },
  auditCard: { backgroundColor: COLORS.glass, borderRadius: 30, padding: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  logItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  logAction: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  logActionText: { fontSize: 8, fontWeight: '900' },
  logDetail: { color: 'white', fontSize: 11, fontWeight: 'bold' },
  logMeta: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  emptyLogs: { color: COLORS.muted, textAlign: 'center', padding: 20, fontSize: 12, fontStyle: 'italic' },
  heroAction: { backgroundColor: COLORS.violet, borderRadius: 35, padding: 30, marginBottom: 25 },
  heroContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { color: 'white', fontSize: 22, fontWeight: '900' },
  heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 5, maxWidth: '80%' },
  heroIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  heroIcon: { fontSize: 24 },
  heroBadge: { backgroundColor: 'rgba(0,0,0,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start', marginTop: 20 },
  heroBadgeText: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  actionsGrid: { flexDirection: 'row', gap: 15, marginBottom: 40 },
  actionCard: { flex: 1, backgroundColor: COLORS.glass, padding: 25, borderRadius: 30, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center' },
  actionIconCircle: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  actionEmoji: { fontSize: 22 },
  actionTitle: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: 'rgba(239, 68, 68, 0.05)', padding: 22, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)' },
  logoutText: { color: COLORS.error, fontWeight: '900', fontSize: 10, letterSpacing: 1 }
});
