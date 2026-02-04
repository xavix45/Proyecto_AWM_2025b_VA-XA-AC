
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
  FlatList,
  Dimensions,
  StatusBar,
  Animated,
  Platform
} from 'react-native';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import CardEvento from '../components/CardEvento.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  violet: '#8b5cf6', 
  ink: '#020617',    
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)',
  muted: 'rgba(255,255,255,0.4)',
  success: '#10b981',
  error: '#ef4444'
};

const CATEGORIAS = ['Todas', 'Tradición', 'Religiosa', 'Gastronomía', 'Ancestral', 'Cultural', 'Música'];

export default function Resultados({ route, navigation }) {
  const { query: initialQuery } = route.params || { query: '' };
  const [search, setSearch] = useState(initialQuery);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [catSel, setCatSel] = useState('Todas');
  const [sortMode, setSortMode] = useState('fecha'); 

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(ENDPOINTS.eventos);
        setEventos(res.data);
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      } catch (e) {
        console.error("Error al cargar resultados:", e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const filtrados = useMemo(() => {
    let result = eventos.filter(ev => {
      const matchSearch = !search || 
                          ev.name.toLowerCase().includes(search.toLowerCase()) || 
                          ev.ciudad.toLowerCase().includes(search.toLowerCase());
      const matchCat = catSel === 'Todas' || ev.categoria === catSel;
      return matchSearch && matchCat;
    });

    if (sortMode === 'fecha') {
      result.sort((a, b) => a.fecha.localeCompare(b.fecha));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    return result;
  }, [eventos, search, catSel, sortMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.input}
              placeholder="¿Qué hueca o fiesta buscas?"
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {CATEGORIAS.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setCatSel(cat)}
              style={[styles.chip, catSel === cat && styles.chipActive]}
            >
              <Text style={[styles.chipText, catSel === cat && styles.chipTextActive]}>{cat.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <View style={styles.resultsMeta}>
          <Text style={styles.resultsCount}>{filtrados.length} HALLAZGOS</Text>
          <View style={styles.sortToggle}>
             <TouchableOpacity onPress={() => setSortMode('fecha')} style={[styles.sortBtn, sortMode === 'fecha' && styles.sortBtnActive]}>
               <Text style={[styles.sortText, sortMode === 'fecha' && styles.sortTextActive]}>CALENDARIO</Text>
             </TouchableOpacity>
             <TouchableOpacity onPress={() => setSortMode('nombre')} style={[styles.sortBtn, sortMode === 'nombre' && styles.sortBtnActive]}>
               <Text style={[styles.sortText, sortMode === 'nombre' && styles.sortTextActive]}>A-Z</Text>
             </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={COLORS.accent} /></View>
        ) : (
          <FlatList
            data={filtrados}
            keyExtractor={item => (item._id || item.id).toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <CardEvento evento={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Sin coincidencias</Text>
                <Text style={styles.emptySub}>Prueba con términos más generales.</Text>
              </View>
            }
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingTop: Platform.OS === 'android' ? 50 : 10, borderBottomWidth: 1, borderColor: COLORS.glassBorder },
  searchBarContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20, gap: 15 },
  backBtn: { width: 45, height: 45, borderRadius: 22, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: COLORS.white, fontSize: 32, lineHeight: 36 },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 20, paddingHorizontal: 20, height: 60, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchIcon: { fontSize: 18, marginRight: 15, opacity: 0.5 },
  input: { flex: 1, color: COLORS.white, fontSize: 16, fontWeight: '500' },
  filterRow: { paddingLeft: 25, paddingBottom: 20, gap: 12, paddingRight: 25 },
  chip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  chipTextActive: { color: COLORS.white },
  resultsMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 30, paddingVertical: 25 },
  resultsCount: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  sortToggle: { flexDirection: 'row', backgroundColor: COLORS.glass, borderRadius: 15, padding: 5 },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  sortBtnActive: { backgroundColor: 'rgba(255,255,255,0.06)' },
  sortText: { fontSize: 9, fontWeight: '900', color: COLORS.muted },
  sortTextActive: { color: COLORS.white },
  list: { paddingHorizontal: 25, paddingBottom: 120 },
  emptyContainer: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: COLORS.white, fontSize: 20, fontWeight: '900' },
  emptySub: { color: COLORS.muted, fontSize: 14, marginTop: 10 }
});
