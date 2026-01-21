
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
  accent: '#ffb800', // Oro
  violet: '#5b21b6', // Violeta
  ink: '#0f172a',    // Fondo
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)',
  muted: 'rgba(255,255,255,0.4)',
  success: '#10b981',
  error: '#ef4444'
};

const CATEGORIAS = ['Todas', 'Tradición', 'Religiosa', 'Gastronomía', 'Ancestral', 'Cultural', 'Música'];
const REGIONES = ['Todas', 'Sierra', 'Costa', 'Amazonía', 'Galápagos'];

export default function Resultados({ route, navigation }) {
  // FASE 3: Recepción de parámetros y estados iniciales (PDF 1)
  const { query: initialQuery } = route.params || { query: '' };
  const [search, setSearch] = useState(initialQuery);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados de Filtro
  const [catSel, setCatSel] = useState('Todas');
  const [regSel, setRegSel] = useState('Todas');
  const [sortMode, setSortMode] = useState('fecha'); // 'fecha' o 'nombre'

  const fadeAnim = useRef(new Animated.Value(0)).current;

  // FASE 4: Consumo de API (PDF 2)
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

  // LÓGICA DE FILTRADO MAESTRA (useMemo para alto rendimiento)
  const filtrados = useMemo(() => {
    let result = eventos.filter(ev => {
      const matchSearch = !search || 
                          ev.name.toLowerCase().includes(search.toLowerCase()) || 
                          ev.ciudad.toLowerCase().includes(search.toLowerCase());
      const matchCat = catSel === 'Todas' || ev.categoria === catSel;
      const matchReg = regSel === 'Todas' || ev.region === regSel;
      return matchSearch && matchCat && matchReg;
    });

    // Ordenamiento
    if (sortMode === 'fecha') {
      result.sort((a, b) => a.fecha.localeCompare(b.fecha));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [eventos, search, catSel, regSel, sortMode]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* HEADER DE BÚSQUEDA FLOTANTE */}
      <View style={styles.header}>
        <View style={styles.searchBarContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput 
              style={styles.input}
              placeholder="¿Qué fiesta buscas?"
              placeholderTextColor={COLORS.muted}
              value={search}
              onChangeText={setSearch}
              autoFocus={!initialQuery}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={styles.clearIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* SELECTOR DE CATEGORÍAS TÁCTIL */}
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
        
        {/* SUBHEADER DE RESULTADOS Y ORDEN */}
        <View style={styles.resultsMeta}>
          <Text style={styles.resultsCount}>{filtrados.length} EVENTOS ENCONTRADOS</Text>
          <View style={styles.sortToggle}>
             <TouchableOpacity onPress={() => setSortMode('fecha')} style={sortMode === 'fecha' && styles.sortBtnActive}>
               <Text style={[styles.sortText, sortMode === 'fecha' && styles.sortTextActive]}>MÁS CERCANOS</Text>
             </TouchableOpacity>
             <View style={styles.sortDivider} />
             <TouchableOpacity onPress={() => setSortMode('nombre')} style={sortMode === 'nombre' && styles.sortBtnActive}>
               <Text style={[styles.sortText, sortMode === 'nombre' && styles.sortTextActive]}>A-Z</Text>
             </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={COLORS.accent} />
            <Text style={styles.loadingText}>Escaneando el territorio...</Text>
          </View>
        ) : (
          <FlatList
            data={filtrados}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => <CardEvento evento={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                  <Text style={styles.emptyEmoji}>🏜️</Text>
                </View>
                <Text style={styles.emptyTitle}>Sin coincidencias</Text>
                <Text style={styles.emptySub}>No encontramos festividades con estos filtros en {regSel !== 'Todas' ? regSel : 'Ecuador'}.</Text>
                <TouchableOpacity style={styles.resetBtn} onPress={() => {setSearch(''); setCatSel('Todas'); setRegSel('Todas');}}>
                   <Text style={styles.resetBtnText}>LIMPIAR TODOS LOS FILTROS</Text>
                </TouchableOpacity>
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
  header: { 
    paddingTop: Platform.OS === 'android' ? 40 : 10,
    backgroundColor: 'rgba(15, 23, 42, 0.8)', 
    borderBottomWidth: 1, 
    borderColor: COLORS.glassBorder 
  },
  searchBarContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginBottom: 15,
    gap: 12
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: COLORS.white, fontSize: 30, lineHeight: 32, fontWeight: '300' },
  inputWrapper: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: COLORS.glass, 
    borderRadius: 18, 
    paddingHorizontal: 15,
    height: 54,
    borderWidth: 1,
    borderColor: COLORS.glassBorder
  },
  searchIcon: { fontSize: 16, marginRight: 10, opacity: 0.5 },
  input: { flex: 1, color: COLORS.white, fontSize: 15, fontWeight: '500' },
  clearIcon: { color: COLORS.muted, fontSize: 14, padding: 5 },
  
  filterRow: { paddingLeft: 20, paddingBottom: 20, gap: 10, paddingRight: 20 },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.03)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.05)' 
  },
  chipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  chipTextActive: { color: COLORS.white },

  resultsMeta: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingVertical: 20 
  },
  resultsCount: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sortToggle: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderRadius: 10, padding: 4 },
  sortText: { fontSize: 8, fontWeight: '900', color: COLORS.muted, paddingHorizontal: 8 },
  sortTextActive: { color: COLORS.accent },
  sortBtnActive: { backgroundColor: 'rgba(255,184,0,0.05)', borderRadius: 6, paddingVertical: 4 },
  sortDivider: { width: 1, height: 10, backgroundColor: 'rgba(255,255,255,0.1)' },

  list: { paddingHorizontal: 20, paddingBottom: 100 },
  loadingText: { color: COLORS.muted, marginTop: 15, fontSize: 12, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 30, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center', marginBottom: 25 },
  emptyEmoji: { fontSize: 50, opacity: 0.3 },
  emptyTitle: { color: COLORS.white, fontSize: 22, fontWeight: '900', marginBottom: 10 },
  emptySub: { color: COLORS.muted, textAlign: 'center', lineHeight: 22, fontSize: 14 },
  resetBtn: { marginTop: 30, paddingVertical: 15, paddingHorizontal: 25, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  resetBtnText: { color: COLORS.accent, fontWeight: 'bold', fontSize: 11, letterSpacing: 1 }
});
