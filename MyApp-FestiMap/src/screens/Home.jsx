
// ... (imports remain mostly the same, ensuring logic matches)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
  StatusBar,
  Dimensions,
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { useUser } from '../context/UserContext.jsx';
import { ENDPOINTS } from '../config/api.js';
import CardEvento from '../components/CardEvento.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)',
  muted: 'rgba(255,255,255,0.4)',
  cardBg: '#1e293b',
  success: '#10b981'
};

// IMAGEN DE ALPI
const ALPI_AVATAR = require('../../alpi.png');

const REGIONES = [
  { name: "Sierra", icon: "🏔️" },
  { name: "Costa", icon: "🌊" },
  { name: "Amazonía", icon: "🌿" },
  { name: "Galápagos", icon: "🐢" }
];

export default function Home({ navigation }) {
  const { user, preferences } = useUser(); 
  
  // VERIFICACIÓN DE ROL DE ADMINISTRADOR
  const esAdmin = user?.email === 'admin@epn.edu.ec' || user?.rol === 'admin' || user?.tipoViajero === 'administrador';

  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ESTADOS DE FILTRO
  const [texto, setTexto] = useState("");
  const [regionSel, setRegionSel] = useState("");
  const [tipoSel, setTipoSel] = useState("");
  
  // REFS Y POSICIONES
  const scrollViewRef = useRef(null);
  const [searchY, setSearchY] = useState(0);

  // ANIMACIONES
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const filterAnim = useRef(new Animated.Value(0)).current;
  
  // Animación del FAB IA
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  // Animación Botón Admin
  const adminPulse = useRef(new Animated.Value(1)).current;

  const hoy = new Date().toISOString().slice(0, 10);

  const fetchData = async () => {
    try {
      const res = await axios.get(ENDPOINTS.eventos);
      setEventos(res.data);
      startEntranceAnimation();
    } catch (err) {
      console.error("Error API:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startEntranceAnimation = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, easing: Easing.out(Easing.back(1)), useNativeDriver: true }),
      Animated.timing(filterAnim, { toValue: 1, duration: 1000, delay: 300, useNativeDriver: true })
    ]).start();
  };

  // Pulso y Rotación
  useEffect(() => {
    // Alpi FAB
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabScale, { toValue: 1.15, duration: 1500, useNativeDriver: true }),
        Animated.timing(fabScale, { toValue: 1, duration: 1500, useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.timing(fabRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();

    // Admin Button Pulse
    if (esAdmin) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(adminPulse, { toValue: 1.05, duration: 800, useNativeDriver: true }),
          Animated.timing(adminPulse, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    }

    fetchData(); 
  }, [esAdmin]);

  const spin = fabRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const TIPOS = useMemo(() => {
    const cats = eventos.map(e => e.categoria).filter(Boolean);
    return [...new Set(cats)].sort();
  }, [eventos]);

  // Lógica Principal de Filtrado
  const eventosFiltrados = useMemo(() => {
    const txt = texto.toLowerCase().trim();
    return eventos.filter(ev => {
      const esFuturo = ev.fecha && ev.fecha >= hoy;
      if (!esFuturo) return false;
      
      // Filtros Explícitos UI
      const matchesText = !txt || ev.name.toLowerCase().includes(txt) || ev.ciudad.toLowerCase().includes(txt);
      const matchesRegion = !regionSel || ev.region === regionSel;
      const matchesTipo = !tipoSel || ev.categoria === tipoSel;
      
      return matchesText && matchesRegion && matchesTipo;
    }).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [eventos, texto, regionSel, tipoSel]);

  // Lógica Inteligente para Destacados
  const destacados = useMemo(() => {
    const eventosProvincia = preferences?.provincia 
      ? eventos.filter(ev => ev.provincia === preferences.provincia && ev.fecha >= hoy) 
      : [];

    const eventosInteres = preferences?.categorias?.length > 0
      ? eventos.filter(ev => preferences.categorias.includes(ev.categoria) && ev.fecha >= hoy)
      : [];

    const mix = [...eventosProvincia, ...eventosInteres, ...eventos.filter(ev => ev.fecha >= hoy)];
    const unique = Array.from(new Set(mix.map(e => e.id)))
        .map(id => mix.find(e => e.id === id));

    return unique.slice(0, 8); // Top 8 recomendados
  }, [eventos, preferences]);

  const resetFiltros = () => {
    setTexto("");
    setRegionSel("");
    setTipoSel("");
  };

  const scrollToSearch = () => {
    scrollViewRef.current?.scrollTo({
      y: searchY,
      animated: true
    });
  };

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    scrollToSearch();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.welcome}>
              {preferences?.provincia ? `DESDE ${preferences.provincia.toUpperCase()}` : 'EXPLORA ECUADOR 🇪🇨'}
            </Text>
            <Text style={styles.title}>FestiMap</Text>
          </View>
          
          {/* BOTÓN ADMIN: SOLO VISIBLE PARA ADMINISTRADORES */}
          {esAdmin && (
            <Animated.View style={{ transform: [{ scale: adminPulse }] }}>
              <TouchableOpacity 
                style={styles.adminBadge} 
                onPress={() => navigation.navigate('AdminDashboard')}
                activeOpacity={0.8}
              >
                <View style={styles.adminIconBox}>
                   <Text style={{fontSize: 12}}>🛡️</Text>
                </View>
                <Text style={styles.adminLabel}>ADMIN</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <ScrollView 
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={COLORS.accent} />
          }
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* 1. DESTACADOS DE LA SEMANA */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {preferences?.categorias?.length > 0 ? "RECOMENDADOS PARA TI" : "DESTACADOS DE LA SEMANA"}
                </Text>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText}>PRÓXIMOS</Text>
                </View>
              </View>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.destacadosScroll}
                snapToInterval={280 + 20}
                decelerationRate="fast"
              >
                {destacados.map(ev => (
                  <TouchableOpacity 
                    key={ev.id} 
                    style={styles.proCard}
                    onPress={() => navigation.navigate('Detalles', { evento: ev })}
                  >
                    <Image source={{ uri: ev.imagen }} style={styles.proCardImg} />
                    <View style={styles.proCardOverlay}>
                      <View style={styles.proCardTop}>
                        <View style={styles.glassBadge}>
                          <Text style={styles.glassBadgeText}>📅 {ev.fecha.split('-')[2]} ENE</Text>
                        </View>
                        {preferences?.provincia === ev.provincia ? (
                           <View style={[styles.glassBadge, {backgroundColor: 'rgba(16, 185, 129, 0.2)'}]}>
                             <Text style={[styles.glassBadgeText, {color: '#10b981'}]}>📍 CERCA</Text>
                           </View>
                        ) : preferences?.categorias?.includes(ev.categoria) ? (
                           <View style={[styles.glassBadge, {backgroundColor: 'rgba(255,184,0,0.2)'}]}>
                             <Text style={[styles.glassBadgeText, {color: COLORS.accent}]}>♥ TU GUSTO</Text>
                           </View>
                        ) : (
                           <View style={[styles.glassBadge, {backgroundColor: 'rgba(255,255,255,0.1)'}]}>
                             <Text style={styles.glassBadgeText}>🔥 TOP</Text>
                           </View>
                        )}
                      </View>
                      
                      <View style={styles.proCardBottom}>
                        <Text style={styles.proCardCategory}>{ev.categoria.toUpperCase()}</Text>
                        <Text style={styles.proCardName} numberOfLines={2}>{ev.name}</Text>
                        <View style={styles.proCardLocRow}>
                          <Text style={styles.proCardLoc}>📍 {ev.ciudad}, {ev.provincia}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* 2. BUSCADOR */}
            <View 
              style={styles.searchSection} 
              onLayout={(e) => setSearchY(e.nativeEvent.layout.y)}
            >
              <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Busca tradiciones, lugares..."
                  placeholderTextColor={COLORS.muted}
                  value={texto}
                  onChangeText={setTexto}
                  onFocus={scrollToSearch}
                  onSubmitEditing={handleSearchSubmit}
                  returnKeyType="search"
                />
              </View>
            </View>

            {/* 3. FILTROS MULTI-TRACK */}
            <Animated.View style={[styles.filtersContainer, { opacity: filterAnim }]}>
              <View style={styles.filterSectionHeader}>
                <Text style={styles.filterLabel}>REGIONES</Text>
                {(regionSel || tipoSel || texto) && (
                  <TouchableOpacity onPress={resetFiltros}>
                    <Text style={styles.clearAllText}>LIMPIAR ×</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTrack}>
                {REGIONES.map(r => (
                  <TouchableOpacity 
                    key={r.name} 
                    style={[styles.regionChip, regionSel === r.name && styles.regionChipActive]}
                    onPress={() => {
                      setRegionSel(regionSel === r.name ? "" : r.name);
                      scrollToSearch();
                    }}
                  >
                    <Text style={styles.regionEmoji}>{r.icon}</Text>
                    <Text style={[styles.regionName, regionSel === r.name && styles.textActive]}>{r.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.filterLabel, {marginTop: 20}]}>CATEGORÍAS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTrack}>
                {TIPOS.map(t => (
                  <TouchableOpacity 
                    key={t} 
                    style={[styles.typeChip, tipoSel === t && styles.typeChipActive]}
                    onPress={() => {
                      setTipoSel(tipoSel === t ? "" : t);
                      scrollToSearch();
                    }}
                  >
                    <Text style={[styles.typeText, tipoSel === t && styles.textActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>

            {/* 4. LISTADO RESULTADOS */}
            <View style={styles.mainList}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>TODAS LAS FESTIVIDADES</Text>
                <Text style={styles.countText}>{eventosFiltrados.length} RESULTADOS</Text>
              </View>

              {loading ? (
                <ActivityIndicator size="large" color={COLORS.accent} style={{marginTop: 40}} />
              ) : eventosFiltrados.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyEmoji}>🔎</Text>
                  <Text style={styles.emptyTitle}>Sin coincidencias</Text>
                  <Text style={styles.emptySub}>Intenta cambiar los filtros para ver más opciones.</Text>
                </View>
              ) : (
                eventosFiltrados.map(item => (
                  <CardEvento key={item.id} evento={item} />
                ))
              )}
            </View>

            <View style={{height: 120}} />
          </Animated.View>
        </ScrollView>

        {/* FAB DEL ASISTENTE IA - ALPI */}
        <Animated.View style={[styles.aiFabContainer, { transform: [{ scale: fabScale }] }]}>
          <TouchableOpacity 
            style={styles.aiFab} 
            onPress={() => navigation.navigate('AsistenteIA')}
            activeOpacity={0.9}
          >
            {/* Anillo Giratorio */}
            <Animated.View style={[styles.aiFabRing, { transform: [{ rotate: spin }] }]} />
            
            <View style={styles.aiFabInner}>
              <Image 
                source={ALPI_AVATAR} 
                style={styles.aiFabImg}
                resizeMode="cover"
              />
            </View>
            <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
          </TouchableOpacity>
        </Animated.View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  header: { 
    paddingHorizontal: 28, 
    paddingTop: Platform.OS === 'android' ? 25 : 15,
    paddingBottom: 15, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  welcome: { fontSize: 10, color: COLORS.accent, fontWeight: '900', letterSpacing: 2 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white, marginTop: 2, letterSpacing: -1 },
  
  // NUEVO ESTILO DE BOTÓN ADMIN
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(91, 33, 182, 0.25)', // Violeta translúcido
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.accent,
    elevation: 8,
    shadowColor: COLORS.violet,
    shadowOpacity: 0.4,
    shadowRadius: 8
  },
  adminIconBox: {
    marginRight: 6,
  },
  adminLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  
  searchSection: { paddingHorizontal: 28, marginBottom: 25, marginTop: 5 },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.glass, 
    borderRadius: 20, 
    paddingHorizontal: 18, 
    paddingVertical: Platform.OS === 'ios' ? 16 : 8,
    borderWidth: 1, 
    borderColor: COLORS.glassBorder 
  },
  searchIcon: { marginRight: 12, opacity: 0.6, fontSize: 18 },
  searchInput: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '500' },

  filtersContainer: { marginBottom: 30 },
  filterSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, marginBottom: 12 },
  filterLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, paddingHorizontal: 28, marginBottom: 12 },
  clearAllText: { color: COLORS.accent, fontSize: 10, fontWeight: 'bold' },
  filterTrack: { paddingLeft: 28, gap: 12, paddingRight: 28 },
  
  regionChip: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.glass, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: COLORS.glassBorder 
  },
  regionChipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  regionEmoji: { fontSize: 18, marginRight: 8 },
  regionName: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 'bold' },
  
  typeChip: { 
    backgroundColor: COLORS.glass, 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: 15, 
    borderWidth: 1, 
    borderColor: COLORS.glassBorder 
  },
  typeChipActive: { backgroundColor: 'rgba(255,184,0,0.15)', borderColor: COLORS.accent },
  typeText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '900' },
  textActive: { color: COLORS.white },

  section: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 28, marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '900', color: COLORS.white, letterSpacing: 1.5 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 6 },
  liveText: { color: COLORS.success, fontSize: 9, fontWeight: 'bold' },
  
  destacadosScroll: { paddingLeft: 28, gap: 20, paddingRight: 28 },
  proCard: { 
    width: 280, 
    height: 380, 
    borderRadius: 35, 
    overflow: 'hidden', 
    backgroundColor: COLORS.cardBg,
    elevation: 15,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 15
  },
  proCardImg: { width: '100%', height: '100%' },
  proCardOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(15,23,42,0.4)', 
    padding: 25, 
    justifyContent: 'space-between' 
  },
  proCardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  glassBadge: { 
    backgroundColor: 'rgba(255,255,255,0.15)', 
    paddingHorizontal: 12, 
    paddingVertical: 6, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)' 
  },
  glassBadgeText: { color: 'white', fontSize: 10, fontWeight: '900' },
  
  proCardBottom: { 
    backgroundColor: 'rgba(15,23,42,0.85)', 
    padding: 20, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  proCardCategory: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginBottom: 5 },
  proCardName: { color: 'white', fontSize: 22, fontWeight: '900', lineHeight: 26 },
  proCardLocRow: { marginTop: 10 },
  proCardLoc: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '600' },

  mainList: { paddingHorizontal: 28 },
  countText: { fontSize: 10, color: COLORS.muted, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji: { fontSize: 50, marginBottom: 15, opacity: 0.5 },
  emptyTitle: { color: 'white', fontSize: 20, fontWeight: '900' },
  emptySub: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginTop: 8, paddingHorizontal: 40 },

  // FAB IA ESTILOS MEJORADOS
  aiFabContainer: {
    position: 'absolute',
    bottom: 110, 
    right: 20,
    zIndex: 100
  },
  aiFab: {
    width: 65,
    height: 65,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiFabRing: {
    position: 'absolute',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    borderWidth: 2,
    borderColor: COLORS.accent,
    borderStyle: 'dashed',
    opacity: 0.5
  },
  aiFabInner: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: COLORS.violet,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: COLORS.violet,
    shadowOpacity: 0.6,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden'
  },
  aiFabImg: {
    width: 38,
    height: 38
  },
  aiBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.ink
  },
  aiBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: COLORS.ink
  }
});
