
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
  KeyboardAvoidingView
} from 'react-native';
import axios from 'axios';
import { useUser } from '../context/UserContext.jsx';
import { ENDPOINTS } from '../config/api.js';
import CardEvento from '../components/CardEvento.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#8b5cf6',
  ink: '#020617',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.03)',
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
  const slideHeader = useRef(new Animated.Value(-50)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

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

  useEffect(() => { fetchData(); }, []);

  const filtrados = useMemo(() => {
    return eventos.filter(ev => {
      const matchesSearch = !search || ev.name.toLowerCase().includes(search.toLowerCase()) || ev.ciudad.toLowerCase().includes(search.toLowerCase());
      const matchesCat = catSel === "Todas" || ev.categoria === catSel;
      return matchesSearch && matchesCat && ev.fecha >= hoy;
    }).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [eventos, search, catSel]);

  const destacados = useMemo(() => eventos.slice(0, 6), [eventos]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* HEADER FLOTANTE DINÁMICO */}
      <Animated.View style={[styles.floatingHeader, { 
        transform: [{ translateY: slideHeader }],
        opacity: scrollY.interpolate({ inputRange: [0, 100], outputRange: [1, 0.9], extrapolate: 'clamp' })
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

      <ScrollView 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => {setRefreshing(true); fetchData();}} tintColor={COLORS.accent} />}
      >
        <View style={styles.content}>
          
          {/* BUSCADOR PREMIUM */}
          <View style={styles.searchWrapper}>
             <View style={styles.searchBar}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput 
                  style={styles.searchInput}
                  placeholder="Busca el alma de Ecuador..."
                  placeholderTextColor={COLORS.muted}
                  value={search}
                  onChangeText={setSearch}
                />
             </View>
          </View>

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

          {/* LISTADO PRINCIPAL */}
          <View style={styles.mainFeed}>
             <Text style={styles.feedTitle}>Explora tu {preferences?.provincia || 'Ecuador'}</Text>
             {loading ? (
               <View style={styles.loader}><ActivityIndicator color={COLORS.accent} size="large" /></View>
             ) : filtrados.length === 0 ? (
               <View style={styles.empty}><Text style={styles.emptyText}>No hay festividades que coincidan.</Text></View>
             ) : (
               filtrados.map(item => <CardEvento key={item._id || item.id} evento={item} />)
             )}
          </View>

          <View style={{height: 150}} />
        </View>
      </ScrollView>

      {/* ASISTENTE IA FLOATING ACTION */}
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
  floatingHeader: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: 30, paddingTop: Platform.OS === 'ios' ? 20 : 55, paddingBottom: 20,
    zIndex: 100 
  },
  greeting: { color: COLORS.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  userName: { color: 'white', fontSize: 24, fontWeight: '900', marginTop: 4 },
  avatarCircle: { width: 50, height: 50, borderRadius: 20, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.glassBorder },
  avatarInit: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  onlineDot: { position: 'absolute', top: -2, right: -2, width: 14, height: 14, borderRadius: 7, backgroundColor: '#10b981', borderWidth: 3, borderColor: COLORS.ink },
  content: { paddingTop: 10 },
  searchWrapper: { paddingHorizontal: 25, marginBottom: 30 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, height: 65, borderRadius: 22, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchIcon: { fontSize: 18, marginRight: 15, opacity: 0.6 },
  searchInput: { flex: 1, color: 'white', fontSize: 15, fontWeight: '500' },
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
  filterSection: { marginBottom: 30 },
  filterScroll: { paddingLeft: 30, gap: 12, paddingRight: 30 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 18, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder },
  filterChipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipIcon: { fontSize: 16, marginRight: 8 },
  chipText: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold' },
  chipTextActive: { color: 'white' },
  mainFeed: { paddingHorizontal: 25 },
  feedTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 20, marginLeft: 5 },
  loader: { paddingVertical: 50 },
  empty: { paddingVertical: 50, alignItems: 'center' },
  emptyText: { color: COLORS.muted, fontStyle: 'italic' },
  aiFab: { position: 'absolute', bottom: 120, right: 25, width: 70, height: 70, borderRadius: 35, backgroundColor: COLORS.ink, alignItems: 'center', justifyContent: 'center', elevation: 20, borderWidth: 2, borderColor: COLORS.accent },
  aiIcon: { width: 45, height: 45, zIndex: 10 },
  aiGlow: { ...StyleSheet.absoluteFillObject, borderRadius: 35, backgroundColor: COLORS.accent, opacity: 0.15 }
});
