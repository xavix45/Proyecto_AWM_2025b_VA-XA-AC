
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
  Platform,
  StatusBar,
  Dimensions,
  Alert,
  ImageBackground,
  Animated,
  Image,
  PanResponder,
  Modal 
} from 'react-native';
import { WebView } from 'react-native-webview'; 
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import axios from 'axios';
import * as turf from '@turf/turf';
import { useUser } from '../context/UserContext.jsx';
import { useAgenda } from '../context/AgendaContext.jsx';
import { ENDPOINTS } from '../config/api.js';

const { width, height } = Dimensions.get('window');

/** 
 * PALETA DE COLORES PREMIUM 
 * Utilizada para la identidad visual de FestiMap Ecuador.
 */
const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  card: '#1e293b',
  success: '#10b981',
  error: '#ef4444',
  tropical: '#059669',
  gold: '#d4af37',
  sand: '#fdfcf0'
};

/** 
 * COORDENADAS DE REFERENCIA 
 * Lugares precargados para optimizar el geocoding inicial.
 */
const LOCAL_PLACES = {
  "quito": { lat: -0.2201, lng: -78.5126 },
  "guayaquil": { lat: -2.1708, lng: -79.9224 },
  "cuenca": { lat: -2.9001, lng: -79.0059 },
  "otavalo": { lat: 0.233, lng: -78.262 },
};

export default function PlanViaje() {
  // HOOKS DE CONTEXTO (BACKEND INTEGRATION)
  const { agregarEvento, guardarPlan } = useAgenda();
  const { user } = useUser();

  // ESTADOS DE CONFIGURACIÓN DE VIAJE
  const [origen, setOrigen] = useState("Quito");
  const [destino, setDestino] = useState("Otavalo");
  const [fechaInicio, setFechaInicio] = useState("2026-01-02");
  const [dias, setDias] = useState("3"); 
  const [radio, setRadio] = useState(15); 
  const [activeDay, setActiveDay] = useState(0);

  // ESTADOS DE DATOS Y CARGA
  const [loading, setLoading] = useState(false);
  const [eventosBase, setEventosBase] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [itinerario, setItinerario] = useState({}); 
  const [geoData, setGeoData] = useState(null);
  const [notificacion, setNotificacion] = useState({ show: false, text: '', type: 'info' });
  const [showFolio, setShowFolio] = useState(false);
  const [nombrePlan, setNombrePlan] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // REFS Y ANIMACIONES
  const animNotif = useRef(new Animated.Value(-120)).current;
  const sliderWidth = width - 100;

  /**
   * EFECTO INICIAL: Carga el inventario de eventos desde MongoDB
   * para tener la base lista antes de cualquier cálculo espacial.
   */
  useEffect(() => {
    axios.get(ENDPOINTS.eventos)
      .then(res => setEventosBase(res.data))
      .catch(err => console.error("Fallo al conectar con MongoDB:", err));
  }, []);

  /** 
   * LÓGICA DE PROCESAMIENTO DE FECHAS
   * Convierte strings YYYY-MM-DD a objetos Date locales de forma segura.
   */
  const parseLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const cleanStr = dateStr.replace(/\//g, '-').trim();
    const parts = cleanStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1;
      const day = parseInt(parts[2]);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  };

  /** 
   * FORMATO AMIGABLE 
   * Retorna una fecha legible para humanos (Ej: Lunes 2 de Enero).
   */
  const getFriendlyDate = (dateStr) => {
    const d = parseLocalDate(dateStr);
    if (!d) return "Formato inválido (Ej: 2026-01-02)";
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('es-ES', options);
  };

  /** 
   * SLIDER PERSONALIZADO 
   * Manejador táctil para el radio de exploración usando PanResponder.
   */
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const touchX = gestureState.moveX - 50;
        let percent = touchX / sliderWidth;
        if (percent < 0) percent = 0;
        if (percent > 1) percent = 1;
        const newVal = Math.round(percent * 100);
        setRadio(newVal < 1 ? 1 : newVal);
      },
    })
  ).current;

  /** 
   * SISTEMA DE NOTIFICACIONES TOAST 
   * Muestra avisos animados en la parte superior de la pantalla.
   */
  const triggerNotif = (text, type = 'info') => {
    setNotificacion({ show: true, text, type });
    Animated.sequence([
      Animated.timing(animNotif, { toValue: 60, duration: 600, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(animNotif, { toValue: -120, duration: 600, useNativeDriver: true })
    ]).start();
  };

  /** 
   * MOTOR DE RUTA INTELIGENTE (TURF.JS) 
   * Calcula la ruta por carretera, genera un buffer (tubo) de exploración 
   * y filtra eventos por proximidad espacial y coincidencia temporal.
   */
  const handleGenerarRuta = async () => {
    const start = parseLocalDate(fechaInicio);
    if (!start) return Alert.alert("Fecha inválida", "Usa el formato YYYY-MM-DD");
    
    setLoading(true);
    setSugerencias([]); 

    const o = await geocode(origen);
    const d = await geocode(destino);

    if (!o || !d) {
      setLoading(false);
      return Alert.alert("Lugar no encontrado", "Intenta con ciudades principales.");
    }

    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${o.lng},${o.lat};${d.lng},${d.lat}?overview=full&geometries=geojson`;
      const res = await axios.get(osrmUrl);
      const routeGeometry = res.data.routes[0].geometry;
      
      const line = turf.lineString(routeGeometry.coordinates);
      const buffer = turf.buffer(line, radio, { units: 'kilometers' });

      const end = new Date(start);
      end.setDate(start.getDate() + (parseInt(dias) || 1));

      const pts = turf.featureCollection(eventosBase.map(e => turf.point([e.lng, e.lat], { ...e })));
      const dentro = turf.pointsWithinPolygon(pts, buffer).features
        .map(f => f.properties)
        .filter(ev => {
          const evDate = parseLocalDate(ev.fecha);
          if (!evDate) return false;
          // Validación estricta de tiempo: el evento debe estar dentro de la duración del viaje
          return evDate.getTime() >= start.getTime() && evDate.getTime() < end.getTime();
        });

      setSugerencias(dentro);
      setGeoData({ route: routeGeometry, buffer: buffer.geometry, points: { o, d } });

      if (dentro.length === 0) {
        triggerNotif("Ruta Despejada: No hay eventos en este rango.", "empty");
      } else {
        triggerNotif(`¡Éxito! ${dentro.length} eventos encontrados.`, "success");
      }
    } catch (e) {
      triggerNotif("Error de conexión.", "error");
    } finally {
      setLoading(false);
    }
  };

  /** 
   * GEOCODIFICADOR 
   * Resuelve nombres de ciudades a coordenadas lat/lng.
   */
  const geocode = async (q) => {
    if (!q) return null;
    const raw = q.toLowerCase().trim();
    if (LOCAL_PLACES[raw]) return LOCAL_PLACES[raw];
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(raw)}&limit=1`;
      const res = await axios.get(url);
      if (res.data[0]) return { lat: parseFloat(res.data[0].lat), lng: parseFloat(res.data[0].lon) };
    } catch (e) { return null; }
    return null;
  };

  /** 
   * LÓGICA DE ASIGNACIÓN DE PARADAS 
   * Calcula automáticamente a qué día (0, 1, 2...) corresponde un evento 
   * basándose en su fecha y la fecha de salida.
   */
  const addStop = (ev) => {
    const start = parseLocalDate(fechaInicio);
    const evDate = parseLocalDate(ev.fecha);
    
    // Diferencia en milisegundos convertida a días
    const diffTime = evDate.getTime() - start.getTime();
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Seguridad: Verificar que el índice sea válido dentro de la duración
    if (dayIndex < 0 || dayIndex >= (parseInt(dias) || 1)) {
        triggerNotif("Este evento ocurre fuera de tu itinerario.", "info");
        return;
    }

    const currentDayStops = itinerario[dayIndex] || [];
    if (currentDayStops.some(s => (s._id || s.id) === (ev._id || ev.id))) {
        triggerNotif("Ya está en este día", "info");
        return;
    }
    
    setItinerario({ ...itinerario, [dayIndex]: [...currentDayStops, ev] });
    agregarEvento(ev);
    setActiveDay(dayIndex);
    triggerNotif(`Agregado al Día ${dayIndex + 1}`, "success");
  };

  /** 
   * PERSISTENCIA EN BACKEND 
   * Guarda el plan finalizado en la base de datos MongoDB del usuario.
   */
  const handleGuardarPlanFinal = async () => {
    if (!nombrePlan.trim()) return Alert.alert("Falta nombre", "Ponle un nombre a tu plan.");
    
    // Mapear el itinerario para enviar solo IDs a MongoDB si es necesario
    const itinerarioIds = {};
    Object.keys(itinerario).forEach(day => {
        itinerarioIds[day] = itinerario[day].map(ev => ev._id || ev.id);
    });

    const success = await guardarPlan({
      nombre: nombrePlan,
      origen,
      destino,
      fechaInicio,
      dias: parseInt(dias),
      itinerario: itinerarioIds, // Estructura compatible con el Schema de Plan
      eventosIds: Object.values(itinerario).flat().map(ev => ev._id || ev.id),
      geoData: {
          origen: geoData?.points?.o,
          destino: geoData?.points?.d
      },
      creado: new Date().toLocaleDateString()
    });

    if (success) {
        setShowSaveModal(false);
        setNombrePlan("");
        triggerNotif("Plan guardado en tu Agenda ✨", "success");
    } else {
        Alert.alert("Error de Sincronización", "No se pudo guardar en MongoDB. Verifica tu servidor.");
    }
  };

  /** 
   * GENERADOR DE FOLIO PDF PREMIUM 
   * Construye un documento de alta calidad editorial con los detalles del viaje.
   */
  const handleDescargarPDF = async () => {
    const html = `
    <html>
      <body style="font-family: 'Helvetica', sans-serif; padding: 40px; background: #fdfcf0; color: #1a1a1a;">
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px;">
          <h1 style="color: #059669; margin: 0; letter-spacing: 5px; font-size: 30px;">FESTIMAP ECUADOR</h1>
          <p style="color: #d4af37; font-weight: bold; margin: 5px 0;">Premium Travel Edition</p>
        </div>
        
        <h2 style="text-align: center; font-size: 28px; margin: 30px 0;">${nombrePlan || 'Bitácora de Viaje'}</h2>
        
        <div style="background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); margin-bottom: 30px; border-left: 5px solid #d4af37;">
          <p style="margin: 5px 0;"><b>👤 Viajero:</b> ${user?.nombre || 'Explorador'}</p>
          <p style="margin: 5px 0;"><b>🛣️ Ruta:</b> ${origen} &rarr; ${destino}</p>
          <p style="margin: 5px 0;"><b>📅 Salida:</b> ${getFriendlyDate(fechaInicio)}</p>
          <p style="margin: 5px 0;"><b>⏱️ Duración:</b> ${dias} Días</p>
        </div>

        ${Object.keys(itinerario).sort().map(dayIdx => `
          <div style="margin-bottom: 40px;">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="background: #059669; color: white; padding: 5px 15px; border-radius: 20px; font-weight: bold;">
                DÍA ${parseInt(dayIdx) + 1}
              </div>
              <span style="color: #d4af37; font-weight: bold; font-size: 18px;">${getFormattedDateForDay(parseInt(dayIdx))}</span>
            </div>
            <div style="height: 1px; background: #ddd; width: 100%; margin: 15px 0;"></div>
            
            ${itinerario[dayIdx].map(ev => `
              <div style="display: flex; gap: 20px; margin-bottom: 25px; background: white; padding: 15px; border-radius: 12px; border: 1px solid #eee;">
                <img src="${ev.imagen}" style="width: 120px; height: 120px; border-radius: 10px; object-fit: cover;" />
                <div style="flex: 1;">
                  <h4 style="margin: 0; color: #1a1a1a; font-size: 18px;">${ev.name.toUpperCase()}</h4>
                  <p style="margin: 5px 0; color: #059669; font-weight: bold; font-size: 12px;">
                    📍 ${ev.ciudad}, ${ev.provincia}
                  </p>
                  <p style="margin: 5px 0; font-size: 12px; color: #444;">
                    <b>Ubicación Exacta:</b> ${ev.lugar || 'No especificado'} <br/>
                    <b>Referencia:</b> ${ev.referencia || 'Centro de la ciudad'} <br/>
                    <b>Coordenadas:</b> ${ev.lat}, ${ev.lng}
                  </p>
                  <p style="margin-top: 10px; color: #666; font-size: 12px; line-height: 1.4; font-style: italic;">
                    "${ev.descripcion}"
                  </p>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}
        
        <div style="margin-top: 50px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #eee; padding-top: 20px;">
          Generado automáticamente por FestiMap Ecuador • Tu guía cultural definitiva • Sincronizado con MongoDB Engine
        </div>
      </body>
    </html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (e) { 
      Alert.alert("Error", "No se pudo generar el documento."); 
    }
  };

  /** 
   * FORMATO DÍA CALENDARIO 
   * Calcula el texto del día (Día 1, Día 2...) junto con su fecha específica.
   */
  const getFormattedDateForDay = (index) => {
    const date = parseLocalDate(fechaInicio);
    if (!date) return "--";
    date.setDate(date.getDate() + index);
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}`;
  };

  /** 
   * RENDER DE MAPA 
   * Memoización del HTML para el WebView para evitar re-renderizados innecesarios.
   */
  const mapHtml = useMemo(() => {
    if (!geoData) return '<html><body style="background:#0f172a"></body></html>';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>#map { height: 100vh; width: 100vw; background: #0f172a; } body { margin: 0; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false });
          L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png').addTo(map);
          L.geoJSON(${JSON.stringify(geoData.buffer)}, { 
            style: { color: '#ffb800', weight: 1, fillOpacity: 0.15, dashArray: '5, 5' } 
          }).addTo(map);
          L.geoJSON(${JSON.stringify(geoData.route)}, { 
            style: { color: '#5b21b6', weight: 5, lineCap: 'round' } 
          }).addTo(map);
          L.marker([${geoData.points.o.lat}, ${geoData.points.o.lng}]).addTo(map);
          L.marker([${geoData.points.d.lat}, ${geoData.points.d.lng}]).addTo(map);
          map.fitBounds(L.geoJSON(${JSON.stringify(geoData.buffer)}).getBounds(), { padding: [30, 30] });
        </script>
      </body>
      </html>
    `;
  }, [geoData]);

  // URL para el mapa estático del Folio
  const staticMapUrl = geoData ? `https://static-maps.yandex.ru/1.x/?lang=es_ES&l=map&size=600,300&bbox=${geoData.points.o.lng},${geoData.points.o.lat}~${geoData.points.d.lng},${geoData.points.d.lat}&pt=${geoData.points.o.lng},${geoData.points.o.lat},pm2rdl~${geoData.points.d.lng},${geoData.points.d.lat},pm2grl` : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* BARRA DE NOTIFICACIÓN TOAST */}
      <Animated.View style={[styles.notif, { transform: [{ translateY: animNotif }] }, notificacion.type === 'success' && { backgroundColor: COLORS.success }]}>
         <View style={styles.notifContent}>
            <View style={styles.notifBadge}><Text style={styles.notifEmoji}>{notificacion.type === 'success' ? '✅' : '🧭'}</Text></View>
            <Text style={styles.notifText}>{notificacion.text}</Text>
         </View>
      </Animated.View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 40}}>
        <View style={styles.header}>
          <Text style={styles.preTitle}>PLANIFICADOR TROPICAL</Text>
          <Text style={styles.title}>Diseño de Ruta 🛣️</Text>
        </View>

        {/* FORMULARIO DE RUTA */}
        <View style={styles.cardForm}>
           <View style={styles.routeSection}>
              <View style={styles.routeVisual}>
                 <View style={styles.routeDotActive} />
                 <View style={styles.routeLine} />
                 <View style={styles.routeDotAccent} />
              </View>
              <View style={styles.routeInputs}>
                 <View style={styles.inputWrap}>
                    <Text style={styles.label}>PUNTO DE PARTIDA</Text>
                    <TextInput style={styles.input} value={origen} onChangeText={setOrigen} placeholder="Ej: Quito" placeholderTextColor={COLORS.muted} />
                 </View>
                 <View style={styles.inputWrap}>
                    <Text style={styles.label}>LLEGADA FINAL</Text>
                    <TextInput style={styles.input} value={destino} onChangeText={setDestino} placeholder="Ej: Otavalo" placeholderTextColor={COLORS.muted} />
                 </View>
              </View>
           </View>

           {/* LOGISTICA: FECHAS Y DÍAS */}
           <View style={[styles.row, {marginTop: 25, alignItems: 'flex-start'}]}>
              <View style={{flex: 1, marginRight: 15}}>
                 <Text style={styles.label}>FECHA SALIDA (AAAA-MM-DD)</Text>
                 <TextInput style={styles.input} value={fechaInicio} onChangeText={setFechaInicio} />
                 <Text style={[styles.dateHelper, !parseLocalDate(fechaInicio) && {color: COLORS.error}]}>
                    {getFriendlyDate(fechaInicio)}
                 </Text>
              </View>
              
              <View style={{width: 80}}>
                 <Text style={[styles.label, {textAlign: 'center'}]}>DURACIÓN</Text>
                 <View style={styles.daysInputWrapper}>
                    <TextInput 
                        style={styles.daysInput} 
                        value={dias} 
                        onChangeText={setDias} 
                        keyboardType="numeric" 
                        maxLength={3}
                        textAlign="center"
                    />
                    <Text style={styles.daysLabel}>Días</Text>
                 </View>
              </View>
           </View>

           {/* CONTROL DE RADIO DE EXPLORACIÓN */}
           <View style={styles.radioBox}>
              <View style={styles.rowBetween}>
                 <Text style={styles.label}>RADIO DE EXPLORACIÓN</Text>
                 <Text style={styles.radioValue}>{radio} KM</Text>
              </View>
              <View style={styles.sliderContainer} {...panResponder.panHandlers}>
                 <View style={styles.sliderTrack}>
                    <View style={[styles.sliderFill, { width: `${radio}%` }]} />
                    <View style={[styles.sliderThumb, { left: `${radio}%` }]}>
                       <View style={styles.thumbGlow} />
                    </View>
                 </View>
              </View>
              <Text style={styles.radioHelp}>Descubrir eventos dentro de este rango de la ruta.</Text>
           </View>

           <TouchableOpacity style={styles.mainBtn} onPress={handleGenerarRuta} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.mainBtnText}>GENERAR RUTA 🚀</Text>}
           </TouchableOpacity>
        </View>

        {/* MAPA INTERACTIVO */}
        {geoData && (
          <View style={styles.mapContainer}>
             <WebView originWhitelist={['*']} source={{ html: mapHtml }} style={{ flex: 1 }} scrollEnabled={false} />
          </View>
        )}

        {/* SECCIÓN DE SUGERENCIAS FILTRADAS */}
        {sugerencias.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARADAS RECOMENDADAS ({sugerencias.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionTrack}>
              {sugerencias.map(ev => (
                <TouchableOpacity key={ev._id || ev.id} style={styles.suggestCard} onPress={() => addStop(ev)}>
                  <Image source={{ uri: ev.imagen }} style={styles.suggestImg} />
                  <View style={styles.suggestFooter}>
                     <Text style={styles.suggestName} numberOfLines={1}>{ev.name}</Text>
                     <Text style={styles.suggestLoc}>📍 {ev.ciudad}</Text>
                  </View>
                  <View style={styles.suggestAddBtn}><Text style={styles.plus}>+</Text></View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ÁREA DE ITINERARIO (TIMELINE) */}
        <View style={styles.itineraryMain}>
           <View style={styles.itineraryHeader}>
              <View>
                 <Text style={styles.sectionTitle}>MI PLAN PERSONALIZADO</Text>
                 <Text style={styles.itSub}>Organización de paradas por día</Text>
              </View>
           </View>

           {/* BOTONES DE ACCIÓN MONGODB / PDF */}
           <View style={styles.actionsBar}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowSaveModal(true)}>
                 <Text style={{fontSize: 16, marginRight: 8}}>💾</Text>
                 <Text style={styles.actionTextPrimary}>GUARDAR</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setShowFolio(true)}>
                 <Text style={{fontSize: 16, marginRight: 8}}>📥</Text>
                 <Text style={styles.actionTextSecondary}>FOLIO PDF</Text>
              </TouchableOpacity>
           </View>

           {/* SELECTOR DE DÍAS (SCROLL HORIZONTAL) */}
           <View style={{ marginBottom: 35 }}>
             <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingRight: 30 }}
             >
                {Array.from({length: parseInt(dias) || 1}).map((_, i) => (
                  <TouchableOpacity key={i} style={[styles.dayTab, activeDay === i && styles.dayTabActive]} onPress={() => setActiveDay(i)}>
                    <Text style={[styles.dayTabText, activeDay === i && styles.dayTabTextActive]}>DÍA {i+1}</Text>
                    <Text style={[styles.dayTabSub, activeDay === i && styles.dayTabSubActive]}>{getFormattedDateForDay(i)}</Text>
                  </TouchableOpacity>
                ))}
             </ScrollView>
           </View>

           {/* LÍNEA DE TIEMPO DEL DÍA ACTIVO */}
           <View style={styles.timeline}>
              {(itinerario[activeDay] || []).length === 0 ? (
                <View style={styles.emptyPlan}>
                   <View style={styles.emptyCircle}><Text style={{fontSize: 30}}>🧭</Text></View>
                   <Text style={styles.emptyTitle}>Día en blanco</Text>
                   <Text style={styles.emptyText}>Explora las sugerencias arriba para llenar este día de cultura.</Text>
                </View>
              ) : (
                itinerario[activeDay].map((stop, idx) => (
                  <View key={stop._id || stop.id} style={styles.timelineItem}>
                     <View style={styles.timelineGuide}>
                        <View style={[styles.node, idx === 0 && {backgroundColor: COLORS.accent}]} />
                        {idx !== itinerario[activeDay].length - 1 && <View style={styles.timelineLine} />}
                     </View>
                     <View style={styles.stopCard}>
                        <Image source={{ uri: stop.imagen }} style={styles.stopImg} />
                        <View style={{flex: 1, marginLeft: 15}}>
                           <Text style={styles.stopName}>{stop.name}</Text>
                           <Text style={styles.stopLoc}>📍 {stop.ciudad}</Text>
                        </View>
                        <TouchableOpacity style={styles.deleteStop} onPress={() => {
                           const next = itinerario[activeDay].filter(s => (s._id || s.id) !== (stop._id || stop.id));
                           setItinerario({...itinerario, [activeDay]: next});
                        }}><Text style={{color: COLORS.error, fontWeight: 'bold'}}>✕</Text></TouchableOpacity>
                     </View>
                  </View>
                ))
              )}
           </View>
        </View>

        <View style={{height: 100}} />
      </ScrollView>

      {/* MODAL PARA ASIGNAR NOMBRE AL PLAN (MONGODB SAVE) */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
            <View style={styles.saveBox}>
                <Text style={styles.modalTitle}>Nombre del Viaje ✨</Text>
                <TextInput style={styles.modalInput} placeholder="Ej: Ruta Ancestral 2026" placeholderTextColor={COLORS.muted} value={nombrePlan} onChangeText={setNombrePlan} />
                <View style={styles.modalBtns}>
                   <TouchableOpacity style={styles.mBtnCancel} onPress={() => setShowSaveModal(false)}><Text style={{color: 'white'}}>Cancelar</Text></TouchableOpacity>
                   <TouchableOpacity style={styles.mBtnConfirm} onPress={handleGuardarPlanFinal}><Text style={{color: COLORS.ink, fontWeight:'bold'}}>GUARDAR</Text></TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>

      {/* MODAL DE VISTA PREVIA DEL FOLIO PDF */}
      <Modal visible={showFolio} animationType="slide" transparent={false}>
        <View style={styles.folioBg}>
           <SafeAreaView style={{flex: 1}}>
              <ScrollView contentContainerStyle={{padding: 25}}>
                <TouchableOpacity onPress={() => setShowFolio(false)} style={styles.closeFolio}>
                  <Text style={styles.closeText}>✕ CERRAR</Text>
                </TouchableOpacity>
                
                <Text style={styles.folioBrand}>FESTIMAP ECUADOR</Text>
                <Text style={styles.folioTitle}>{nombrePlan || 'PLAN DE RUTA'}</Text>
                <View style={styles.folioDivider} />
                
                {staticMapUrl && (
                  <View style={styles.folioMapBox}>
                    <Image source={{ uri: staticMapUrl }} style={styles.folioImg} />
                  </View>
                )}

                <View style={styles.folioSummary}>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold'}}>ORIGEN:</Text> {origen}</Text>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold'}}>DESTINO:</Text> {destino}</Text>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold'}}>DURACIÓN:</Text> {dias} DÍAS</Text>
                </View>

                {Object.keys(itinerario).length === 0 ? (
                  <Text style={styles.noDataText}>No has seleccionado eventos para tu itinerario aún.</Text>
                ) : (
                  Object.keys(itinerario).sort().map(dayIdx => (
                    <View key={dayIdx} style={styles.folioDayContainer}>
                      <View style={styles.folioDayHeader}>
                        <Text style={styles.dayNumText}>DÍA {parseInt(dayIdx) + 1}</Text>
                        <Text style={styles.dayDateText}>{getFormattedDateForDay(parseInt(dayIdx))}</Text>
                      </View>
                      {itinerario[dayIdx].map(ev => (
                        <View key={ev._id || ev.id} style={styles.folioEventCard}>
                          <Image source={{ uri: ev.imagen }} style={styles.folioEventImg} />
                          <View style={{flex: 1}}>
                            <Text style={styles.folioEventName}>{ev.name.toUpperCase()}</Text>
                            <Text style={styles.folioEventLoc}>📍 {ev.ciudad}, {ev.provincia}</Text>
                            <Text style={styles.folioEventDesc} numberOfLines={3}>{ev.descripcion}</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  ))
                )}

                <TouchableOpacity style={styles.folioDownload} onPress={handleDescargarPDF}>
                  <Text style={styles.folioDownloadText}>DESCARGAR PDF ITINERARIO 📥</Text>
                </TouchableOpacity>
                <View style={{height: 50}} />
              </ScrollView>
           </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  notif: { position: 'absolute', top: 0, left: 15, right: 15, backgroundColor: COLORS.violet, padding: 18, borderRadius: 25, zIndex: 1000, elevation: 15 },
  notifContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  notifBadge: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  notifEmoji: { fontSize: 16 },
  notifText: { color: 'white', fontWeight: 'bold', fontSize: 13, flex: 1 },
  header: { paddingHorizontal: 30, paddingTop: Platform.OS === 'android' ? 55 : 20, marginBottom: 10 },
  preTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 3 },
  title: { color: 'white', fontSize: 34, fontWeight: '900', marginTop: 5 },
  cardForm: { margin: 20, padding: 30, backgroundColor: COLORS.glass, borderRadius: 40, borderWidth: 1, borderColor: COLORS.glassBorder },
  routeSection: { flexDirection: 'row', gap: 20 },
  routeVisual: { alignItems: 'center', width: 12, paddingTop: 30 },
  routeDotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.3)' },
  routeDotAccent: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.accent },
  routeLine: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginVertical: 5, borderStyle: 'dashed' },
  routeInputs: { flex: 1, gap: 25 },
  inputWrap: { flex: 1 },
  label: { color: COLORS.accent, fontSize: 9, fontWeight: '900', marginBottom: 10, letterSpacing: 2 },
  input: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 18, borderRadius: 18, color: 'white', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', fontSize: 14 },
  daysInputWrapper: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', paddingVertical: 10 },
  daysInput: { color: 'white', fontSize: 22, fontWeight: 'bold', width: '100%', textAlign: 'center', padding: 0 },
  daysLabel: { color: COLORS.muted, fontSize: 8, fontWeight: 'bold' },
  row: { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateHelper: { color: COLORS.success, fontSize: 10, fontWeight: 'bold', fontStyle: 'italic', marginTop: 8, marginLeft: 5 },
  radioBox: { marginTop: 35 },
  radioValue: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  sliderContainer: { height: 45, justifyContent: 'center', marginVertical: 12 },
  sliderTrack: { height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4, position: 'relative' },
  sliderFill: { position: 'absolute', height: '100%', backgroundColor: COLORS.accent, borderRadius: 4 },
  sliderThumb: { position: 'absolute', top: -11, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.accent, marginLeft: -15, elevation: 10, justifyContent: 'center', alignItems: 'center' },
  thumbGlow: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.ink },
  radioHelp: { color: COLORS.muted, fontSize: 10, fontStyle: 'italic', textAlign: 'center', marginTop: 5 },
  mainBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 25, alignItems: 'center', marginTop: 35, elevation: 5 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  mapContainer: { height: 220, marginHorizontal: 20, borderRadius: 35, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 40, elevation: 15 },
  section: { marginBottom: 45 },
  sectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginLeft: 30, marginBottom: 20 },
  suggestionTrack: { paddingLeft: 30, gap: 18, paddingRight: 30 },
  suggestCard: { width: 220, backgroundColor: COLORS.card, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  suggestImg: { width: '100%', height: 130 },
  suggestFooter: { padding: 18 },
  suggestName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  suggestLoc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  suggestAddBtn: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  plus: { color: COLORS.ink, fontWeight: '900', fontSize: 18 },
  itineraryMain: { paddingHorizontal: 30 },
  itineraryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  itSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  actionsBar: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  actionBtnPrimary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.accent, padding: 15, borderRadius: 18 },
  actionTextPrimary: { color: COLORS.ink, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 18, borderWidth: 1, borderColor: COLORS.glassBorder },
  actionTextSecondary: { color: COLORS.white, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  dayTab: { paddingHorizontal: 22, paddingVertical: 18, borderRadius: 22, marginRight: 12, backgroundColor: COLORS.glass, alignItems: 'center', minWidth: 100 },
  dayTabActive: { backgroundColor: COLORS.accent },
  dayTabText: { color: COLORS.muted, fontWeight: 'bold', fontSize: 13 },
  dayTabTextActive: { color: COLORS.ink },
  dayTabSub: { color: COLORS.muted, fontSize: 9, marginTop: 4 },
  dayTabSubActive: { color: 'rgba(15,23,42,0.6)' },
  timeline: { paddingLeft: 10 },
  timelineItem: { flexDirection: 'row', marginBottom: 25 },
  timelineGuide: { alignItems: 'center', marginRight: 20, width: 14 },
  node: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.1)', marginTop: 25, borderWidth: 2, borderColor: COLORS.ink },
  timelineLine: { width: 2, flex: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginVertical: 8 },
  stopCard: { flex: 1, backgroundColor: COLORS.card, padding: 18, borderRadius: 28, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', elevation: 4 },
  stopImg: { width: 60, height: 60, borderRadius: 18 },
  stopName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  stopLoc: { color: COLORS.accent, fontSize: 11, fontWeight: '600', marginTop: 4 },
  deleteStop: { padding: 10 },
  emptyPlan: { padding: 50, alignItems: 'center', backgroundColor: COLORS.glass, borderRadius: 40, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '900' },
  emptyText: { color: COLORS.muted, textAlign: 'center', fontSize: 13, marginTop: 10, lineHeight: 22 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.96)', justifyContent: 'center', padding: 40 },
  saveBox: { backgroundColor: COLORS.card, padding: 35, borderRadius: 40, borderWidth: 1, borderColor: COLORS.accent },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 20, color: 'white', marginBottom: 30, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalBtns: { flexDirection: 'row', gap: 15 },
  mBtnCancel: { flex: 1, alignItems: 'center', padding: 15 },
  mBtnConfirm: { flex: 1, backgroundColor: COLORS.accent, padding: 18, borderRadius: 18, alignItems: 'center' },
  folioBg: { flex: 1, backgroundColor: COLORS.sand },
  closeFolio: { alignSelf: 'flex-end', padding: 10 },
  closeText: { color: COLORS.tropical, fontWeight: '900', fontSize: 12 },
  folioBrand: { fontSize: 14, fontWeight: '900', color: COLORS.tropical, textAlign: 'center', letterSpacing: 6, marginTop: 10 },
  folioTitle: { fontSize: 36, fontWeight: '800', textAlign: 'center', color: '#1a1a1a', marginTop: 15 },
  folioDivider: { height: 2, backgroundColor: COLORS.gold, width: 60, alignSelf: 'center', marginVertical: 30 },
  folioMapBox: { height: 200, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.gold, marginBottom: 35 },
  folioImg: { width: '100%', height: '100%' },
  folioSummary: { backgroundColor: 'white', padding: 25, borderRadius: 25, marginBottom: 35, elevation: 2 },
  folioDataText: { fontSize: 13, marginBottom: 8, color: '#333' },
  folioDownload: { backgroundColor: COLORS.tropical, padding: 22, borderRadius: 25, alignItems: 'center' },
  folioDownloadText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  noDataText: { textAlign: 'center', color: '#999', marginVertical: 30 },
  folioDayContainer: { marginBottom: 40 },
  folioDayHeader: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: COLORS.gold, paddingBottom: 10 },
  dayNumText: { color: COLORS.tropical, fontSize: 22, fontWeight: '900' },
  dayDateText: { color: COLORS.gold, fontSize: 12, fontWeight: 'bold' },
  folioEventCard: { flexDirection: 'row', gap: 15, backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 15, elevation: 2 },
  folioEventImg: { width: 80, height: 80, borderRadius: 10 },
  folioEventName: { fontSize: 14, fontWeight: '900', color: '#1a1a1a' },
  folioEventLoc: { fontSize: 11, color: COLORS.tropical, fontWeight: 'bold', marginVertical: 4 },
  folioEventDesc: { fontSize: 11, color: '#666', lineHeight: 16 }
});
