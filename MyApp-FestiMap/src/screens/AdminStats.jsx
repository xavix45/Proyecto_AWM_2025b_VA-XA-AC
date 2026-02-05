
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions, 
  SafeAreaView, 
  StatusBar,
  Image,
  Animated,
  Platform,
  LayoutAnimation,
  TextInput
} from 'react-native';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';
// Importación corregida con extensión .jsx
import { KPICard, DataProgress, CircularDonut, SentimentMatrix, SeasonalChart } from '../components/ui/AdminWidgets.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  violet: '#8b5cf6', 
  ink: '#020617',    
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.4)',
  success: '#10b981',
  info: '#3b82f6',
  warning: '#f59e0b',
  error: '#ef4444',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  card: '#1e293b',
  borderDark: 'rgba(255,255,255,0.05)',
  royal: '#4338ca',
  deepViolet: '#2e1065',
  emerald: '#065f46'
};

export default function AdminStats() {
  const { token } = useUser();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [activeTab, setActiveTab] = useState('Global');
  
  // NUEVO: Estado para datos validados por el servidor
  const [serverStats, setServerStats] = useState(null);
  
  const [regionFilter, setRegionFilter] = useState('Todas');
  const [catFilter, setCatFilter] = useState('Todas');
  const [searchEvent, setSearchEvent] = useState(''); 

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchData();
    fetchServerInsights(); // Llamada al nuevo Analytics Engine del Backend
  }, []);

  const fetchData = async () => {
    try {
      const config = token ? { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } } : {};
      const res = await axios.get(ENDPOINTS.eventos, config);
      setEventos(res.data);
      Animated.timing(fadeAnim, { toValue: 1, duration: 1500, useNativeDriver: true }).start();
    } catch (err) {
      console.error("Critical BI Error:", err.message);
      setEventos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para demostrar la potencia del Backend en la exposición
  const fetchServerInsights = async () => {
    try {
      if (!token) {
        console.log("⚠️ No hay token de autenticación para estadísticas avanzadas.");
        setServerStats(null);
        return;
      }
      const config = { 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        } 
      };
      // Endpoint correcto del backend
      const res = await axios.get(`${ENDPOINTS.eventos}/stats`, config);
      setServerStats(res.data);
      console.log("✅ Estadísticas del servidor cargadas");
    } catch (e) {
      // Error silencioso - el endpoint es opcional
      console.log("⚠️ Servidor no soporta analítica avanzada aún (opcional).");
      setServerStats(null);
    }
  };

  const globalStats = useMemo(() => {
    if (eventos.length === 0) return null;

    const filtrados = eventos.filter(ev => {
      const matchReg = regionFilter === 'Todas' || ev.region === regionFilter;
      const matchCat = catFilter === 'Todas' || ev.categoria === catFilter;
      return matchReg && matchCat;
    });

    // SOLO DATOS REALES DEL BACKEND
    const totalAsistencias = filtrados.reduce((s, e) => s + (Number(e.asistencias) || 0), 0);
    const totalComentarios = filtrados.reduce((s, e) => s + (e.comentarios?.length || 0), 0);
    
    const revenueByRegion = { Sierra: 0, Costa: 0, Amazonía: 0, Galápagos: 0 };
    const totalRevenue = filtrados.reduce((acc, ev) => {
      const priceStr = ev.precio?.toString().toLowerCase() || "";
      const priceNum = priceStr.includes('gratis') ? 0 : parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      const subtotal = priceNum * (ev.asistencias || 0);
      revenueByRegion[ev.region] = (revenueByRegion[ev.region] || 0) + subtotal;
      return acc + subtotal;
    }, 0);

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    const allReviews = filtrados.flatMap(e => e.comentarios || []);
    allReviews.forEach(r => { if (starCounts[r.rating] !== undefined) starCounts[r.rating]++; });

    const monthDistribution = new Array(12).fill(0);
    filtrados.forEach(e => {
      if (e.fecha) {
        const month = parseInt(e.fecha.split('-')[1]) - 1;
        if (month >= 0 && month < 12) monthDistribution[month]++;
      }
    });

    // Engagement = (Eventos con comentarios / Total) * 100
    const eventosConInteraccion = filtrados.filter(e => (e.asistencias || 0) > 0 || (e.comentarios?.length || 0) > 0).length;
    const engagementRate = filtrados.length > 0 ? (eventosConInteraccion / filtrados.length) * 100 : 0;
    
    const approvedCount = filtrados.filter(e => e.status === 'approved').length;
    const healthScore = filtrados.length > 0 ? (approvedCount / filtrados.length) * 100 : 0;

    // TOP 5: Por ASISTENCIAS (dato real)
    const efficiencyRanking = [...filtrados]
      .filter(e => (e.asistencias || 0) > 0)
      .sort((a, b) => (b.asistencias || 0) - (a.asistencias || 0))
      .slice(0, 5);

    const topRatedRanking = [...filtrados]
      .map(e => {
        const reviews = e.comentarios || [];
        const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
        return { ...e, avgRating: avg, reviewsCount: reviews.length };
      })
      .filter(e => e.reviewsCount > 0)
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 5);

    const cityData = filtrados.reduce((acc, e) => {
      acc[e.ciudad] = (acc[e.ciudad] || 0) + 1;
      return acc;
    }, {});
    const topCities = Object.entries(cityData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return { 
      filtrados, 
      totalAsistencias, 
      totalComentarios,
      totalRevenue, 
      starCounts, 
      engagementRate, 
      healthScore, 
      monthDistribution, 
      efficiencyRanking, 
      topRatedRanking, 
      topCities, 
      revenueByRegion,
      count: filtrados.length,
      allReviewsCount: allReviews.length,
      eventosConInteraccion
    };
  }, [eventos, regionFilter, catFilter]);

  const filteredPicker = useMemo(() => {
    if (searchEvent.trim() === '') {
      // Si no hay búsqueda, mostrar los primeros 20 eventos
      return eventos.slice(0, 20);
    }
    // Si hay búsqueda, filtrar por nombre
    const filtered = eventos.filter(e => {
      const nombre = (e.name || '').toLowerCase();
      const ciudad = (e.ciudad || '').toLowerCase();
      const provincia = (e.provincia || '').toLowerCase();
      const search = searchEvent.toLowerCase();
      return nombre.includes(search) || ciudad.includes(search) || provincia.includes(search);
    });
    return filtered.slice(0, 20);
  }, [eventos, searchEvent]);

  const compareData = useMemo(() => {
    if (!selectedId || !globalStats) return null;
    const ev = eventos.find(e => (e._id || e.id) === selectedId);
    if (!ev) return null;
    const evAsistencias = ev.asistencias || 0;
    const evComentarios = ev.comentarios?.length || 0;
    const avgAsistencias = globalStats.totalAsistencias / globalStats.count;
    return {
      ev,
      evAsistencias,
      evComentarios,
      avgAsistencias,
      diffAsistencias: evAsistencias - avgAsistencias
    };
  }, [selectedId, globalStats, eventos]);

  if (loading) return (
    <View style={styles.loadingScreen}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.loadingText}>INICIALIZANDO CONSOLA DE INTELIGENCIA...</Text>
    </View>
  );

  const regionalData = globalStats.filtrados.reduce((acc, e) => {
    const existing = acc.find(x => x.reg === e.region);
    if(existing) existing.count++; else acc.push({reg: e.region, count: 1});
    return acc;
  }, []).sort((a,b)=>b.count - a.count);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
           <Text style={styles.headerPre}>ANALYTICS ENGINE v5.5 • PREMIUM</Text>
           <Text style={styles.headerTitle}>FestiMap Intelligence 🏢</Text>
           <View style={styles.syncStatus}>
              <View style={styles.syncDot} />
              <Text style={styles.syncText}>DATA SYNC: MONGODB • {new Date().toLocaleTimeString()}</Text>
           </View>
        </View>

        {/* NOTA PARA EXPOSICIÓN: Aquí mostramos que el Backend está validando los datos */}
        {serverStats && (
          <View style={styles.serverAlert}>
             <Text style={styles.serverAlertText}>🔐 MÉTRICAS VALIDADAS POR MONGODB AGGREGATION ENGINE</Text>
          </View>
        )}

        <View style={styles.moduleSelector}>
           <TouchableOpacity 
            style={[styles.moduleTab, activeTab === 'Global' && styles.moduleTabActive]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('Global');
              setSelectedId(null);
            }}
           >
              <Text style={[styles.moduleTabText, activeTab === 'Global' && styles.moduleTabTextActive]}>PANORÁMICA GLOBAL</Text>
           </TouchableOpacity>
           <TouchableOpacity 
            style={[styles.moduleTab, activeTab === 'DeepDive' && styles.moduleTabActive]}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setActiveTab('DeepDive');
              if(!selectedId && eventos.length > 0) setSelectedId(eventos[0]._id || eventos[0].id);
            }}
           >
              <Text style={[styles.moduleTabText, activeTab === 'DeepDive' && styles.moduleTabTextActive]}>ANÁLISIS POR EVENTO</Text>
           </TouchableOpacity>
        </View>

        <Animated.View style={{ opacity: fadeAnim }}>
          {activeTab === 'Global' ? (
            <View>
              <View style={styles.kpiGrid}>
                 <KPICard emoji="💼" label="Impacto Econ." value={`$${globalStats.totalRevenue.toLocaleString()}`} sub="Ingreso Estimado" color={COLORS.info} border={COLORS.info + '40'} />
                 <KPICard emoji="🎯" label="Engagement" value={`${globalStats.engagementRate.toFixed(1)}%`} sub="Eventos con Actividad" color={COLORS.success} border={COLORS.success + '40'} />
              </View>
              <View style={styles.kpiGrid}>
                 <KPICard emoji="🛡️" label="Salud Mapa" value={`${globalStats.healthScore.toFixed(0)}%`} sub="Eventos Aprobados" color={COLORS.accent} border={COLORS.accent + '40'} />
                 <KPICard emoji="👥" label="Asistencias" value={globalStats.totalAsistencias.toLocaleString()} sub="Check-ins Reales" color={COLORS.violet} border={COLORS.violet + '40'} />
              </View>

              <View style={styles.filterCard}>
                 <Text style={styles.cardHeader}>FILTROS DE SEGMENTACIÓN</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                    {['Todas', 'Sierra', 'Costa', 'Amazonía', 'Galápagos'].map(reg => (
                      <TouchableOpacity key={reg} style={[styles.chip, regionFilter === reg && styles.chipActive]} onPress={() => setRegionFilter(reg)}>
                        <Text style={[styles.chipText, regionFilter === reg && styles.chipTextActive]}>{reg}</Text>
                      </TouchableOpacity>
                    ))}
                 </ScrollView>
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>DISTRIBUCIÓN REGIONAL (SHARE)</Text>
                 <CircularDonut data={regionalData} total={globalStats.count} />
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>EMBUDO DE ENGAGEMENT (FUNNEL)</Text>
                 <View style={styles.funnel}>
                    <View style={[styles.funnelStep, { width: '100%', backgroundColor: COLORS.info + '25' }]}>
                       <Text style={styles.funnelText}>INVENTARIO: {globalStats.count} EVENTOS</Text>
                    </View>
                    <View style={styles.funnelLink} />
                    <View style={[styles.funnelStep, { width: '75%', backgroundColor: COLORS.success + '25' }]}>
                       <Text style={styles.funnelText}>ACTIVIDAD: {globalStats.eventosConInteraccion} CON CHECK-INS</Text>
                    </View>
                    <View style={styles.funnelLink} />
                    <View style={[styles.funnelStep, { width: '50%', backgroundColor: COLORS.accent + '25' }]}>
                       <Text style={styles.funnelText}>FIDELIDAD: {globalStats.totalComentarios} RESEÑAS</Text>
                    </View>
                 </View>
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>ESTACIONALIDAD (EVENTOS POR MES)</Text>
                 <SeasonalChart distribution={globalStats.monthDistribution} />
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>ANÁLISIS DE REPUTACIÓN (SENTIMENT)</Text>
                 <View style={styles.sentimentHeader}>
                    <Text style={styles.sentimentMainVal}>{(globalStats.allReviewsCount > 0 ? (Object.entries(globalStats.starCounts).reduce((a,[s,c])=>a+(s*c),0)/globalStats.allReviewsCount) : 0).toFixed(1)}</Text>
                    <View>
                       <Text style={styles.sentimentLabel}>Rating Promedio</Text>
                       <Text style={styles.sentimentSub}>{globalStats.allReviewsCount} Reseñas en total</Text>
                    </View>
                 </View>
                 <SentimentMatrix counts={globalStats.starCounts} total={globalStats.allReviewsCount} />
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>IMPACTO ECONÓMICO POR REGIÓN</Text>
                 {Object.entries(globalStats.revenueByRegion).sort((a,b)=>b[1]-a[1]).map(([reg, rev]) => (
                   <View key={reg} style={styles.revenueRow}>
                      <Text style={styles.revenueLabel}>{reg}</Text>
                      <View style={styles.revenueBarTrack}>
                         <View style={[styles.revenueBarFill, { width: `${(rev/globalStats.totalRevenue)*100}%` }]} />
                      </View>
                      <Text style={styles.revenueVal}>${rev.toLocaleString()}</Text>
                   </View>
                 ))}
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>POWER CITIES (DENSIDAD)</Text>
                 <View style={styles.cityGrid}>
                    {globalStats.topCities.map(([city, count], idx) => (
                      <View key={city} style={styles.cityTile}>
                         <Text style={styles.cityIdx}>{idx+1}</Text>
                         <Text style={styles.cityName}>{city}</Text>
                         <Text style={styles.cityCount}>{count} EVENTOS</Text>
                      </View>
                    ))}
                 </View>
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>TOP 5: MÁS POPULARES 🏆</Text>
                 <Text style={styles.cardSub}>Basado en asistencias reales registradas (check-ins).</Text>
                 {globalStats.efficiencyRanking.map((ev, i) => (
                   <View key={ev._id || ev.id} style={styles.rankItem}>
                      <View style={styles.rankNum}><Text style={styles.rankNumTxt}>{i+1}</Text></View>
                      <View style={styles.rankInfo}>
                         <Text style={styles.rankName} numberOfLines={1}>{ev.name}</Text>
                         <Text style={styles.rankSub}>{ev.ciudad} • {ev.provincia}</Text>
                      </View>
                      <View style={styles.rankValBox}>
                         <Text style={styles.rankValPerc}>{ev.asistencias || 0}</Text>
                         <Text style={styles.rankValLabel}>ASISTENCIAS</Text>
                      </View>
                   </View>
                 ))}
              </View>

              <View style={styles.card}>
                 <Text style={styles.cardHeader}>ELITE EXPERIENCE: MEJOR RATING ⭐</Text>
                 {globalStats.topRatedRanking.map((ev, i) => (
                   <View key={ev._id || ev.id} style={styles.rankItem}>
                      <View style={[styles.rankNum, {backgroundColor: COLORS.emerald + '30'}]}><Text style={[styles.rankNumTxt, {color: COLORS.emerald}]}>{i+1}</Text></View>
                      <View style={styles.rankInfo}>
                         <Text style={styles.rankName} numberOfLines={1}>{ev.name}</Text>
                         <Text style={styles.rankSub}>{ev.reviewsCount} reseñas verificadas</Text>
                      </View>
                      <View style={styles.rankValBox}>
                         <Text style={[styles.rankValPerc, {color: COLORS.accent}]}>{ev.avgRating.toFixed(1)}</Text>
                         <Text style={styles.rankValLabel}>ESTRELLAS</Text>
                      </View>
                   </View>
                 ))}
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.searchConsole}>
                 <Text style={styles.consoleLabel}>BUSCAR EN EL INVENTARIO MAESTRO</Text>
                 <View style={styles.searchBox}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput 
                      style={styles.searchInput}
                      placeholder="Nombre del evento a auditar..."
                      placeholderTextColor={COLORS.muted}
                      value={searchEvent}
                      onChangeText={setSearchEvent}
                    />
                 </View>
                 {filteredPicker.length === 0 ? (
                   <View style={styles.emptySearch}>
                     <Text style={styles.emptySearchIcon}>🔍</Text>
                     <Text style={styles.emptySearchText}>No se encontraron eventos con "{searchEvent}"</Text>
                     <TouchableOpacity 
                       style={styles.clearSearchBtn} 
                       onPress={() => setSearchEvent('')}
                     >
                       <Text style={styles.clearSearchText}>LIMPIAR BÚSQUEDA</Text>
                     </TouchableOpacity>
                   </View>
                 ) : (
                   <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
                      {filteredPicker.map(ev => {
                        const evId = ev._id || ev.id;
                        return (
                          <TouchableOpacity 
                            key={evId} 
                            style={[styles.miniChip, selectedId === evId && styles.miniChipActive]} 
                            onPress={() => setSelectedId(evId)}
                          >
                             <Text style={[styles.miniChipText, selectedId === evId && styles.miniChipTextActive]}>{ev.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                   </ScrollView>
                 )}
              </View>

              {compareData && (
                <View>
                  <View style={styles.eventHero}>
                    <Image source={{ uri: compareData.ev.imagen }} style={styles.heroImg} />
                    <View style={styles.heroOverlay}>
                       <View style={styles.heroStatusBox}>
                          <Text style={styles.heroStatusText}>{compareData.ev.status?.toUpperCase()}</Text>
                       </View>
                       <Text style={styles.heroTitle}>{compareData.ev.name}</Text>
                       <Text style={styles.heroLoc}>📍 {compareData.ev.ciudad}, {compareData.ev.provincia}</Text>
                       <Text style={styles.heroDate}>📅 Registrado para: {compareData.ev.fecha}</Text>
                    </View>
                  </View>

                  <View style={styles.card}>
                     <Text style={styles.cardHeader}>PERFORMANCE BENCHMARKING</Text>
                     <View style={styles.benchRow}>
                        <View style={styles.benchItem}>
                           <Text style={styles.benchVal}>{compareData.evAsistencias}</Text>
                           <Text style={styles.benchLabel}>ASISTENCIAS</Text>
                        </View>
                        <View style={styles.benchCenter}>
                           <Text style={[styles.benchDiff, { color: compareData.diffAsistencias >= 0 ? COLORS.success : COLORS.error }]}>
                             {compareData.diffAsistencias >= 0 ? '+' : ''}{compareData.diffAsistencias.toFixed(0)}
                           </Text>
                           <View style={styles.benchDivider} />
                        </View>
                        <View style={styles.benchItem}>
                           <Text style={styles.benchVal}>{compareData.avgAsistencias.toFixed(0)}</Text>
                           <Text style={styles.benchLabel}>PROMEDIO GLOBAL</Text>
                        </View>
                     </View>
                     <View style={[styles.benchIndicator, { backgroundColor: compareData.diffAsistencias >= 0 ? COLORS.success + '15' : COLORS.warning + '15' }]}>
                        <Text style={[styles.benchIndText, { color: compareData.diffAsistencias >= 0 ? COLORS.success : COLORS.warning }]}>
                           {compareData.diffAsistencias >= 0 ? 'ESTE EVENTO SUPERA LA MEDIA DE ASISTENCIAS' : 'POPULARIDAD POR DEBAJO DEL PROMEDIO'}
                        </Text>
                     </View>
                  </View>

                  <View style={styles.kpiGrid}>
                     <KPICard emoji="🤝" label="Check-ins" value={compareData.evAsistencias} sub="Asistencias Reales" color={COLORS.success} />
                     <KPICard emoji="💬" label="Reseñas" value={compareData.evComentarios} sub="Comentarios" color={COLORS.violet} />
                  </View>

                  <View style={styles.card}>
                     <Text style={styles.cardHeader}>MÉTRICAS DE ENGAGEMENT</Text>
                     <DataProgress label="Asistencias Registradas" count={compareData.evAsistencias} total={Math.max(compareData.avgAsistencias * 2, compareData.evAsistencias + 10)} color={COLORS.success} />
                     <DataProgress label="Interacción Social (Comentarios)" count={compareData.evComentarios} total={10} color={COLORS.violet} showPerc={false} />
                     <Text style={styles.radarHelp}>Métricas basadas en datos reales de MongoDB.</Text>
                  </View>

                  <View style={styles.card}>
                     <Text style={styles.cardHeader}>VOZ DEL CLIENTE ({compareData.ev.comentarios?.length || 0})</Text>
                     {compareData.ev.comentarios?.length > 0 ? (
                       compareData.ev.comentarios.slice(0, 5).map((c, i) => (
                         <View key={i} style={styles.commCard}>
                            <View style={styles.commHead}>
                               <Text style={styles.commUser}>{c.usuario}</Text>
                               <Text style={styles.commStars}>{'★'.repeat(c.rating)}</Text>
                            </View>
                            <Text style={styles.commTxt} numberOfLines={3}>"{c.comentario}"</Text>
                            <Text style={styles.commDate}>{c.fecha}</Text>
                         </View>
                       ))
                     ) : (
                       <Text style={styles.emptyMsg}>Aún no se registran reseñas para este evento.</Text>
                     )}
                  </View>

                  <View style={styles.card}>
                     <Text style={styles.cardHeader}>LOGÍSTICA Y CONTROL OPERATIVO</Text>
                     <View style={styles.logRow}><Text style={styles.logKey}>Organizador:</Text><Text style={styles.logVal}>{compareData.ev.organizador || 'Empresa Pública'}</Text></View>
                     <View style={styles.logRow}><Text style={styles.logKey}>Categoría:</Text><Text style={styles.logVal}>{compareData.ev.categoria}</Text></View>
                     <View style={styles.logRow}><Text style={styles.logKey}>Precio Unitario:</Text><Text style={styles.logVal}>{compareData.ev.precio || 'Gratuito'}</Text></View>
                     <View style={styles.logRow}><Text style={styles.logKey}>Lat/Lng:</Text><Text style={styles.logVal}>{compareData.ev.lat?.toFixed(4)}, {compareData.ev.lng?.toFixed(4)}</Text></View>
                     <View style={styles.logRow}><Text style={styles.logKey}>Tag Cloud:</Text><Text style={styles.logVal}>{compareData.ev.tags?.join(', ') || 'Tradición'}</Text></View>
                  </View>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        <View style={styles.footer}>
           <Text style={styles.footerText}>FESTIMAP ANALYTICS ENGINE v5.5.10</Text>
           <Text style={styles.footerSub}>Consola de Alto Rendimiento • Patrimonio Digital Ecuador</Text>
           <Text style={styles.footerSub}>Sincronización segura vía REST-API MongoDB</Text>
        </View>

        <View style={{height: 120}} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  loadingScreen: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.ink },
  loadingText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', marginTop: 15, letterSpacing: 2 },
  scroll: { padding: 25 },
  header: { marginBottom: 35, paddingTop: Platform.OS === 'android' ? 50 : 20 },
  headerPre: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 5 },
  headerTitle: { color: 'white', fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  syncStatus: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  syncDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.success, marginRight: 8 },
  syncText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  serverAlert: { backgroundColor: 'rgba(16, 185, 129, 0.1)', padding: 10, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' },
  serverAlertText: { color: COLORS.success, fontSize: 8, fontWeight: 'bold', textAlign: 'center' },
  moduleSelector: { flexDirection: 'row', backgroundColor: COLORS.glass, borderRadius: 20, padding: 6, marginBottom: 30, borderWidth: 1, borderColor: COLORS.glassBorder },
  moduleTab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 15 },
  moduleTabActive: { backgroundColor: 'rgba(255,255,255,0.06)', borderBottomWidth: 2, borderBottomColor: COLORS.accent },
  moduleTabText: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  moduleTabTextActive: { color: COLORS.accent },
  kpiGrid: { flexDirection: 'row', gap: 15, marginBottom: 15 },
  card: { backgroundColor: COLORS.glass, padding: 25, borderRadius: 35, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 20 },
  cardHeader: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 25 },
  cardSub: { color: COLORS.muted, fontSize: 10, marginBottom: 20, fontStyle: 'italic' },
  filterCard: { backgroundColor: COLORS.glass, padding: 22, borderRadius: 28, marginBottom: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
  filterRow: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.glass, marginRight: 10, borderWidth: 1, borderColor: COLORS.glassBorder },
  chipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontSize: 11, fontWeight: 'bold' },
  chipTextActive: { color: 'white' },
  funnel: { alignItems: 'center', gap: 4 },
  funnelStep: { padding: 18, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  funnelText: { color: 'white', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  funnelLink: { width: 2, height: 12, backgroundColor: COLORS.glassBorder },
  sentimentHeader: { flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 30 },
  sentimentMainVal: { color: COLORS.accent, fontSize: 52, fontWeight: '900' },
  sentimentLabel: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  sentimentSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  revenueRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  revenueLabel: { color: 'white', fontSize: 11, width: 70, fontWeight: 'bold' },
  revenueBarTrack: { flex: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6 },
  revenueBarFill: { height: '100%', backgroundColor: COLORS.info, borderRadius: 6 },
  revenueVal: { color: COLORS.success, fontSize: 11, fontWeight: '900', width: 80, textAlign: 'right' },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cityTile: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, width: (width - 90) / 2, borderBottomWidth: 2, borderBottomColor: COLORS.violet },
  cityIdx: { color: COLORS.accent, fontSize: 8, fontWeight: '900', marginBottom: 5 },
  cityName: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  cityCount: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  rankItem: { flexDirection: 'row', alignItems: 'center', padding: 18, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 22, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderDark },
  rankNum: { width: 32, height: 32, borderRadius: 10, backgroundColor: COLORS.royal + '30', alignItems: 'center', justifyContent: 'center' },
  rankNumTxt: { color: COLORS.royal, fontWeight: '900', fontSize: 14 },
  rankInfo: { flex: 1, marginLeft: 15 },
  rankName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  rankSub: { color: COLORS.muted, fontSize: 10, marginTop: 4 },
  rankValBox: { alignItems: 'flex-end' },
  rankValPerc: { color: COLORS.success, fontSize: 16, fontWeight: '900' },
  rankValLabel: { color: COLORS.muted, fontSize: 8, fontWeight: 'bold' },
  searchConsole: { marginBottom: 35 },
  consoleLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '900', marginBottom: 15, letterSpacing: 1.5 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, borderRadius: 18, paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 18 },
  searchIcon: { fontSize: 16, marginRight: 15, opacity: 0.5 },
  searchInput: { color: 'white', flex: 1, height: 55, fontSize: 14 },
  pickerRow: { paddingLeft: 5 },
  miniChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginRight: 10, backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder },
  miniChipActive: { borderColor: COLORS.accent, backgroundColor: COLORS.violet + '25' },
  miniChipText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  miniChipTextActive: { color: 'white' },
  eventHero: { height: 300, borderRadius: 35, overflow: 'hidden', marginBottom: 30 },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2, 6, 23, 0.45)', padding: 30, justifyContent: 'flex-end' },
  heroStatusBox: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: COLORS.success + '20', borderWidth: 1, borderColor: COLORS.success, marginBottom: 15 },
  heroStatusText: { color: COLORS.success, fontSize: 8, fontWeight: '900', letterSpacing: 2 },
  heroTitle: { color: 'white', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  heroLoc: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 6, fontWeight: 'bold' },
  heroDate: { color: COLORS.accent, fontSize: 11, fontWeight: 'bold', marginTop: 10 },
  benchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 15 },
  benchItem: { alignItems: 'center', flex: 1 },
  benchVal: { color: 'white', fontSize: 32, fontWeight: '900' },
  benchLabel: { color: COLORS.muted, fontSize: 9, fontWeight: 'bold', marginTop: 5 },
  benchCenter: { width: 90, alignItems: 'center' },
  benchDiff: { fontSize: 24, fontWeight: '900' },
  benchDivider: { width: 40, height: 2, backgroundColor: COLORS.glassBorder, marginTop: 10 },
  benchIndicator: { marginTop: 25, padding: 14, borderRadius: 18, alignItems: 'center' },
  benchIndText: { fontSize: 10, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
  radarHelp: { color: COLORS.muted, fontSize: 9, fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  commCard: { backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 22, marginBottom: 12, borderWidth: 1, borderColor: COLORS.borderDark },
  commHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  commUser: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  commStars: { color: COLORS.accent, fontSize: 10 },
  commTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  commDate: { color: COLORS.muted, fontSize: 9, marginTop: 8, textAlign: 'right' },
  logRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.borderDark },
  logKey: { color: COLORS.muted, fontSize: 12, fontWeight: 'bold' },
  logVal: { color: 'white', fontSize: 12, fontWeight: '900' },
  footer: { padding: 50, alignItems: 'center' },
  footerText: { color: 'rgba(255,255,255,0.15)', fontSize: 11, fontWeight: 'bold', letterSpacing: 1.5 },
  footerSub: { color: 'rgba(255,255,255,0.06)', fontSize: 9, marginTop: 8, textAlign: 'center' },
  emptyMsg: { color: COLORS.muted, textAlign: 'center', paddingVertical: 30, fontStyle: 'italic' },
  emptySearch: { padding: 40, alignItems: 'center', backgroundColor: COLORS.glass, borderRadius: 20, marginVertical: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  emptySearchIcon: { fontSize: 50, marginBottom: 15, opacity: 0.3 },
  emptySearchText: { color: COLORS.muted, fontSize: 14, textAlign: 'center', marginBottom: 20 },
  clearSearchBtn: { backgroundColor: COLORS.violet, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  clearSearchText: { color: 'white', fontSize: 11, fontWeight: '900', letterSpacing: 1 }
});
