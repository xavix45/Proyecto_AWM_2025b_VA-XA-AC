
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

const { width, height } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#8b5cf6',
  ink: '#020617',
  white: '#ffffff',
  glass: 'rgba(2, 6, 23, 0.95)', // Fondo sólido/vidrio para proteger el saludo
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  cardBg: '#1e293b'
};

const CATEGORIAS_UI = [
  { id: '1', name: 'Todas', icon: '🌈' },
  { id: '2', name: 'Tradición', icon: '🎺' },
  { id: '3', name: 'Gastronomía', icon: '🍲' },
  { id: '4', name: 'Religiosa', icon: '🕯️' },
  { id: '5', name: 'Ancestral', icon: '🗿' },
  { id: '6', name: 'Entretenimiento', icon: '🎭' },
  { id: '7', name: 'Musical', icon: '🎵' },
  { id: '8', name: 'Deportiva', icon: '⚽' },
  { id: '9', name: 'Artística', icon: '🎨' },
  { id: '10', name: 'Tecnología', icon: '💻' },
  { id: '11', name: 'Educativa', icon: '📚' },
];

export default function Home({ navigation }) {
  const { user, preferences } = useUser(); 
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [catSel, setCatSel] = useState("Todas");

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideHeader = useRef(new Animated.Value(-100)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const searchFocusAnim = useRef(new Animated.Value(0)).current;

  const hoy = new Date().toISOString().slice(0, 10);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buenos días";
    if (hour < 18) return "Buenas tardes";
    return "Buenas noches";
  };

  const fetchData = async () => {
    try {
      const res = await axios.get(ENDPOINTS.eventos);
      setEventos(res.data);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.spring(slideHeader, { toValue: 0, friction: 8, useNativeDriver: true })
      ]).start();
    } catch (err) {
      console.error("Error Home API:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const filtrados = useMemo(() => {
    return eventos.filter(ev => {
      // FILTRO PRINCIPAL: Solo mostrar eventos APROBADOS
      const isApproved = ev.status === 'approved';
      
      const matchesSearch = !search || 
        (ev.name && ev.name.toLowerCase().includes(search.toLowerCase())) || 
        (ev.ciudad && ev.ciudad.toLowerCase().includes(search.toLowerCase())) ||
        (ev.provincia && ev.provincia.toLowerCase().includes(search.toLowerCase()));
      
      const matchesCat = catSel === "Todas" || ev.categoria === catSel;
      return isApproved && matchesSearch && matchesCat;
    }).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [eventos, search, catSel]);

  // Organizar eventos por estado temporal
  const eventosPorTiempo = useMemo(() => {
    const hoyDate = new Date(hoy);
    
    const futuros = [];
    const pasando = [];
    const pasados = [];

    filtrados.forEach(ev => {
      const fechaEvento = new Date(ev.fecha);
      const fechaFin = ev.fecha_fin ? new Date(ev.fecha_fin) : fechaEvento;
      
      if (fechaFin < hoyDate) {
        pasados.push(ev);
      } else if (fechaEvento <= hoyDate && fechaFin >= hoyDate) {
        pasando.push(ev);
      } else {
        futuros.push(ev);
      }
    });

    return { futuros, pasando, pasados };
  }, [filtrados, hoy]);

  // Destacados: Solo eventos FUTUROS O PASANDO AHORA (no pasados)
  const destacados = useMemo(() => {
    const hoyDate = new Date(hoy);
    return eventos
      .filter(e => {
        const isApproved = e.status === 'approved';
        const fechaEvento = new Date(e.fecha);
        const fechaFin = e.fecha_fin ? new Date(e.fecha_fin) : fechaEvento;
        
        // NO es pasado (debe ser futuro o pasando ahora)
        const notPassed = !(fechaFin < hoyDate);
        
        return isApproved && notPassed;
      })
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .slice(0, 6);
  }, [eventos, hoy]);

  // Interpolación para el fondo del header al hacer scroll
  const headerBg = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: ['transparent', COLORS.glass],
    extrapolate: 'clamp'
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* HEADER FIJO: NUNCA SE OCULTA NI SE TAPA */}
      <Animated.View style={[styles.fixedHeader, { 
        transform: [{ translateY: slideHeader }],
        backgroundColor: headerBg
      }]}>
        <View>
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{user?.nombre?.split(' ')[0] || 'Explorador'} ✨</Text>
        </View>
        <TouchableOpacity 
          style={styles.avatarCircle} 
          onPress={() => navigation.navigate('PerfilTab')}
        >
          <Text style={styles.avatarInit}>{user?.nombre?.charAt(0) || 'V'}</Text>
          <View style={styles.onlineDot} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : null} 
        style={{ flex: 1 }}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={COLORS.accent} />}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            
            {/* SECCIÓN HERO DESTACADOS */}
            <View style={styles.heroSection}>
               <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>FIESTAS IMPERDIBLES</Text>
                  <TouchableOpacity><Text style={styles.seeAll}>VER MAPA 🗺️</Text></TouchableOpacity>
               </View>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heroScroll}>
                  {destacados.map((ev, i) => (
                    <TouchableOpacity key={i} style={styles.heroCard} onPress={() => navigation.navigate('Detalles', { evento: ev })}>
                      <Image source={{ uri: ev.imagen }} style={styles.heroImg} />
                      <View style={styles.heroOverlay}>
                         <View style={styles.heroBadge}><Text style={styles.heroBadgeText}>{ev.provincia.toUpperCase()}</Text></View>
                         <Text style={styles.heroName}>{ev.name}</Text>
                         <Text style={styles.heroDate}>📅 {ev.fecha}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
               </ScrollView>
            </View>

            {/* FILTROS POR CHIPS */}
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>CATEGORÍAS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
                 {CATEGORIAS_UI.map(c => (
                   <TouchableOpacity 
                     key={c.id} 
                     style={[styles.filterChip, catSel === c.name && styles.filterChipActive]}
                     onPress={() => setCatSel(c.name)}
                   >
                     <Text style={styles.chipIcon}>{c.icon}</Text>
                     <Text style={[styles.chipText, catSel === c.name && styles.chipTextActive]}>{c.name}</Text>
                   </TouchableOpacity>
                 ))}
              </ScrollView>
            </View>

            {/* BUSCADOR PREMIUM */}
            <View style={styles.searchWrapper}>
               <View style={styles.searchBar}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput 
                    style={styles.searchInput}
                    placeholder="Busca por nombre o ciudad..."
                    placeholderTextColor={COLORS.muted}
                    value={search}
                    onChangeText={setSearch}
                    returnKeyType="search"
                    onFocus={() => {
                      Animated.timing(searchFocusAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
                    }}
                    onBlur={() => {
                      Animated.timing(searchFocusAnim, { toValue: 0, duration: 300, useNativeDriver: false }).start();
                    }}
                  />
                  {search.length > 0 && (
                    <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
                      <Text style={{color: COLORS.muted, fontSize: 18}}>✕</Text>
                    </TouchableOpacity>
                  )}
               </View>
            </View>

            {/* LISTADO PRINCIPAL CON SECCIONES TEMPORALES */}
            <View style={styles.mainFeed}>
               <Text style={styles.feedTitle}>
                {search.length > 0 ? `Resultados para "${search}"` : `Explora tu ${preferences?.provincia || 'Ecuador'}`}
               </Text>
               
               {loading ? (
                 <View style={styles.loader}><ActivityIndicator color={COLORS.accent} size="large" /></View>
               ) : filtrados.length === 0 ? (
                 <View style={styles.empty}>
                    <Text style={styles.emptyEmoji}>🏜️</Text>
                    <Text style={styles.emptyText}>No encontramos "{search}" en el inventario.</Text>
                    <TouchableOpacity style={styles.resetBtn} onPress={() => {setSearch(""); setCatSel("Todas");}}>
                       <Text style={styles.resetBtnText}>VER TODO EL MAPA</Text>
                    </TouchableOpacity>
                 </View>
               ) : (
                 <>
                   {/* EVENTOS PASANDO AHORA */}
                   {eventosPorTiempo.pasando.length > 0 && (
                     <View style={styles.timeSection}>
                       <View style={styles.timeSectionHeader}>
                         <View style={styles.timeBadgeLive}>
                           <View style={styles.liveDot} />
                           <Text style={styles.timeBadgeText}>PASANDO AHORA</Text>
                         </View>
                         <Text style={styles.timeCount}>{eventosPorTiempo.pasando.length}</Text>
                       </View>
                       {eventosPorTiempo.pasando.map(item => <CardEvento key={item._id || item.id} evento={item} />)}
                     </View>
                   )}

                   {/* EVENTOS FUTUROS */}
                   {eventosPorTiempo.futuros.length > 0 && (
                     <View style={styles.timeSection}>
                       <View style={styles.timeSectionHeader}>
                         <View style={styles.timeBadge}>
                           <Text style={styles.timeBadgeIcon}>🔮</Text>
                           <Text style={styles.timeBadgeText}>PRÓXIMOS EVENTOS</Text>
                         </View>
                         <Text style={styles.timeCount}>{eventosPorTiempo.futuros.length}</Text>
                       </View>
                       {eventosPorTiempo.futuros.map(item => <CardEvento key={item._id || item.id} evento={item} />)}
                     </View>
                   )}

                   {/* EVENTOS PASADOS */}
                   {eventosPorTiempo.pasados.length > 0 && (
                     <View style={styles.timeSection}>
                       <View style={styles.timeSectionHeader}>
                         <View style={[styles.timeBadge, { backgroundColor: 'rgba(255,255,255,0.03)' }]}>
                           <Text style={styles.timeBadgeIcon}>📜</Text>
                           <Text style={[styles.timeBadgeText, { color: COLORS.muted }]}>EVENTOS PASADOS</Text>
                         </View>
                         <Text style={[styles.timeCount, { color: COLORS.muted }]}>{eventosPorTiempo.pasados.length}</Text>
                       </View>
                       {eventosPorTiempo.pasados.map(item => <CardEvento key={item._id || item.id} evento={item} />)}
                     </View>
                   )}
                 </>
               )}
            </View>

            <View style={{height: 150}} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity 
        style={styles.aiFab} 
        onPress={() => navigation.navigate('AsistenteIA')}
        activeOpacity={0.9}
      >
        <Image source={require('../../alpi.png')} style={styles.aiIcon} />
        <View style={styles.aiGlow} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  fixedHeader: { 
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 30, paddingTop: Platform.OS === 'ios' ? 60 : 55, paddingBottom: 20,
    zIndex: 1000, // Prioridad máxima
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)'
  },
  scrollContent: { paddingTop: Platform.OS === 'ios' ? 140 : 135 },
  greeting: { color: COLORS.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  userName: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 4 },
  avatarCircle: { width: 50, height: 50, borderRadius: 20, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.glassBorder },
  avatarInit: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  onlineDot: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 3, borderColor: COLORS.ink },
  content: { paddingTop: 10 },
  searchWrapper: { paddingHorizontal: 25, marginBottom: 25 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.04)', height: 65, borderRadius: 22, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchIcon: { fontSize: 18, marginRight: 15, opacity: 0.6 },
  searchInput: { flex: 1, color: 'white', fontSize: 15, fontWeight: '500' },
  clearBtn: { padding: 5 },
  heroSection: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, marginBottom: 15 },
  sectionTitle: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  seeAll: { color: COLORS.accent, fontSize: 10, fontWeight: '900' },
  heroScroll: { paddingLeft: 30, paddingRight: 20, gap: 20 },
  heroCard: { width: width * 0.75, height: 380, borderRadius: 40, overflow: 'hidden', backgroundColor: COLORS.cardBg, elevation: 15 },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.4)', padding: 30, justifyContent: 'flex-end' },
  heroBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: COLORS.accent, marginBottom: 12 },
  heroBadgeText: { color: COLORS.ink, fontSize: 9, fontWeight: '900' },
  heroName: { color: 'white', fontSize: 28, fontWeight: '900', lineHeight: 32 },
  heroDate: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 8, fontWeight: '600' },
  filterSection: { marginBottom: 25 },
  filterTitle: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 2, marginLeft: 30, marginBottom: 15 },
  filterScroll: { paddingLeft: 30, gap: 12, paddingRight: 30 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: COLORS.glassBorder },
  filterChipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipIcon: { fontSize: 16, marginRight: 8 },
  chipText: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold' },
  chipTextActive: { color: 'white' },
  mainFeed: { paddingHorizontal: 25 },
  feedTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 20, marginLeft: 5 },
  loader: { paddingVertical: 50 },
  empty: { paddingVertical: 50, alignItems: 'center' },
  emptyEmoji: { fontSize: 50, marginBottom: 15 },
  emptyText: { color: COLORS.muted, fontStyle: 'italic', textAlign: 'center', marginBottom: 20 },
  resetBtn: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  resetBtnText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 12 },
  timeSection: { marginBottom: 30 },
  timeSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, marginLeft: 5 },
  timeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(139, 92, 246, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.3)' },
  timeBadgeLive: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  timeBadgeIcon: { fontSize: 14, marginRight: 6 },
  timeBadgeText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  timeCount: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 },
  aiFab: { position: 'absolute', bottom: 120, right: 25, width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center', elevation: 20, borderWidth: 2, borderColor: COLORS.accent },
  aiIcon: { width: 45, height: 45, zIndex: 10 },
  aiGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 35, backgroundColor: COLORS.accent, opacity: 0.15 }
});
