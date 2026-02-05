// === SECCIÓN 1: IMPORTS (herramientas y librerías) ===
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
// WebView: para renderizar el mapa Leaflet dentro de la app
import { WebView } from 'react-native-webview'; 
// PDF y compartir
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// GPS y permisos de ubicación
import * as Location from 'expo-location';
// HTTP para llamar al backend
import axios from 'axios';
// Contextos globales (usuario y agenda)
import { useUser } from '../context/UserContext.jsx';
import { useAgenda } from '../context/AgendaContext.jsx';
// Endpoints del backend
import { ENDPOINTS } from '../config/api.js';

const { width, height } = Dimensions.get('window');

/** 
 * PALETA DE COLORES PREMIUM - FESTIMAP EDITION
 * Diseño de alta fidelidad para el planificador cultural.
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

// === SECCIÓN 2: COMPONENTE PRINCIPAL ===
export default function PlanViaje({ route, navigation }) {
  // HOOKS DE CONTEXTO (datos globales)
  // useAgenda = lógica de la agenda del usuario (agregarEvento, guardarPlan)
  const { agregarEvento, guardarPlan, planes } = useAgenda();
  const { user, token } = useUser();

  // ==========================================================
  // SECCIÓN: FORMULARIO PRINCIPAL (inputs del usuario)
  // ==========================================================

  // ESTADOS DE CONFIGURACIÓN DE VIAJE (inputs del usuario)
  const [origen, setOrigen] = useState("Quito");
  const [destino, setDestino] = useState("Otavalo");
  const [fechaInicio, setFechaInicio] = useState("2026-01-02");
  const [dias, setDias] = useState("3"); 
  const [radio, setRadio] = useState(15); 
  const [activeDay, setActiveDay] = useState(0);

  // ESTADOS DE DATOS Y CARGA (datos del backend + UI)
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [eventosBase, setEventosBase] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [itinerario, setItinerario] = useState({}); 
  const [geoData, setGeoData] = useState(null);
  const [notificacion, setNotificacion] = useState({ show: false, text: '', type: 'info' });
  const [showFolio, setShowFolio] = useState(false);
  const [nombrePlan, setNombrePlan] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // REFS Y ANIMACIONES (notificaciones y slider)
  const animNotif = useRef(new Animated.Value(-120)).current;
  const sliderWidth = width - 100;

  /**
   * EFECTO 1 (BACKEND): Cargar eventos desde MongoDB
   * Se consulta GET /api/eventos y se filtra solo 'approved'.
   */
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        // BACKEND: GET /api/eventos (lista general de eventos)
        const res = await axios.get(ENDPOINTS.eventos);
        // FILTRAR: Solo eventos aprobados
        const eventosAprobados = res.data.filter(e => e.status === 'approved');
        setEventosBase(eventosAprobados);
        console.log(`✅ ${eventosAprobados.length} eventos aprobados cargados para PlanViaje`);
      } catch (err) {
        console.error("Fallo al conectar con el motor de datos:", err);
      }
    };
    fetchEventos();
  }, []);

  /**
   * EFECTO 2: Cargar un plan existente (si se abre desde Agenda)
   */
  useEffect(() => {
    if (route.params?.planId && planes.length > 0) {
      const planEncontrado = planes.find(p => p._id === route.params.planId);
      if (planEncontrado) {
        // Cargar datos del plan existente en el formulario
        cargarPlanAFormulario(planEncontrado);
      }
    }
  }, [route.params?.planId, planes]);

  const cargarPlanAFormulario = (plan) => {
    setNombrePlan(plan.nombrePlan || plan.nombre);
    setOrigen(plan.origen);
    setDestino(plan.destino);
    setFechaInicio(plan.fechaInicio);
    setDias(plan.dias.toString());
    setRadio(plan.radio || 15);
    
    if (plan.itinerario) {
      const nuevoItin = {};
      Object.keys(plan.itinerario).forEach(day => {
        const idsInDay = plan.itinerario[day];
        nuevoItin[day] = eventosBase.filter(ev => idsInDay.includes(ev._id || ev.id));
      });
      setItinerario(nuevoItin);
    }
    
    triggerNotif("Hoja de ruta cargada 📜", "success");
  };

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

  const getFriendlyDate = (dateStr) => {
    const d = parseLocalDate(dateStr);
    if (!d) return "Formato esperado: AAAA-MM-DD";
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('es-ES', options);
  };

  /**
   * LÓGICA DEL SLIDER PERSONALIZADA (PAN RESPONDER)
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

  const triggerNotif = (text, type = 'info') => {
    setNotificacion({ show: true, text, type });
    Animated.sequence([
      Animated.timing(animNotif, { toValue: 60, duration: 600, useNativeDriver: true }),
      Animated.delay(3000),
      Animated.timing(animNotif, { toValue: -120, duration: 600, useNativeDriver: true })
    ]).start();
  };

  /**
   * MOTOR GPS (PERMISOS + UBICACIÓN)
   * 1) Verifica si GPS está activo
   * 2) Pide permiso al sistema
   * 3) Obtiene lat/lng
   * 4) Envía lat/lng al backend (POST /api/rutas/reverse)
   */
  const handleUseCurrentLocation = async () => {
    setLoadingGPS(true);

    try {
      // 1. Verificar si los servicios de ubicación están activos en el celular
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert("📡 GPS Apagado", "Por favor, enciende la ubicación en el panel de control de tu celular.");
        setLoadingGPS(false);
        return;
      }

      // 2. Pedir permiso explícito al sistema operativo (Android/iOS)
      let { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert("🚫 Permiso Requerido", "Para detectar tu ciudad automáticamente, necesitamos que aceptes el permiso de ubicación.");
        setLoadingGPS(false);
        return;
      }

      // 3. Obtener posición del sensor físico
      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;
      
      // 4. Obtener nombre de ciudad (Geocoding Inverso)
      // BACKEND: POST /api/rutas/reverse  (lat/lng -> ciudad)
      const res = await axios.post(ENDPOINTS.rutasReverse, { lat: latitude, lng: longitude }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const city = res.data?.city || "Mi ubicación";
      setOrigen(city);
      triggerNotif("Punto de partida detectado 🛰️", "success");

    } catch (error) {
      console.log("Error GPS Nativo:", error);
      Alert.alert("❌ Error de Sensor", "No pudimos conectar con el GPS. Asegúrate de estar en un lugar con señal.");
    } finally {
      setLoadingGPS(false);
    }
  };

  /**
   * MOTOR DE RUTA (BACKEND)
   * Envía origen/destino/fecha/días/radio a POST /api/rutas/generar
   * Backend devuelve geoData + sugerencias
   */
  const handleGenerarRuta = async () => {
    const start = parseLocalDate(fechaInicio);
    if (!start) return Alert.alert("Fecha inválida", "Usa el formato AAAA-MM-DD");
    
    setLoading(true);
    setSugerencias([]); 

    try {
      // BACKEND: POST /api/rutas/generar
      // Envía datos del plan y recibe ruta + buffer + eventos sugeridos
      const res = await axios.post(ENDPOINTS.rutasGenerar, {
        origen,
        destino,
        fechaInicio,
        dias,
        radio
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dentro = res.data?.sugerencias || [];
      const geo = res.data?.geoData || null;

      setSugerencias(dentro);
      setGeoData(geo);

      if (dentro.length === 0) {
        triggerNotif("Ruta Despejada: No hay eventos en este rango.", "info");
      } else {
        triggerNotif(`¡Éxito! ${dentro.length} paradas encontradas.`, "success");
      }
    } catch (e) {
      triggerNotif("Error de conexión con el motor de rutas.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Agrega un evento al día correcto del itinerario
  const addStop = (ev) => {
    // Determina en qué día cae el evento según fechaInicio
    const start = parseLocalDate(fechaInicio);
    const evDate = parseLocalDate(ev.fecha);
    const diffTime = evDate.getTime() - start.getTime();
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (dayIndex < 0 || dayIndex >= (parseInt(dias) || 1)) {
        triggerNotif("Este evento ocurre fuera de tus días de viaje.", "info");
        return;
    }

    const currentDayStops = itinerario[dayIndex] || [];
    if (currentDayStops.some(s => (s._id || s.id) === (ev._id || ev.id))) {
        triggerNotif("Ya está en tu agenda para este día.", "info");
        return;
    }
    
    // Agrega el evento al día correspondiente
    setItinerario({ ...itinerario, [dayIndex]: [...currentDayStops, ev] });
    agregarEvento(ev);
    setActiveDay(dayIndex);
    triggerNotif(`Agregado al Día ${dayIndex + 1} ✅`, "success");
  };

  // Guarda el plan en MongoDB (POST /api/planes)
  const handleGuardarPlanFinal = async () => {
    if (!nombrePlan.trim()) return Alert.alert("Atención", "Escribe un nombre para el plan.");
    
    const itinerarioIds = {};
    Object.keys(itinerario).forEach(day => {
        itinerarioIds[day] = itinerario[day].map(ev => ev._id || ev.id);
    });

    // BACKEND: POST /api/planes (guarda el plan del usuario)
    const success = await guardarPlan({
      nombre: nombrePlan,
      origen, destino, fechaInicio, dias: parseInt(dias),
      itinerario: itinerarioIds,
      radio: radio,
      eventosIds: Object.values(itinerario).flat().map(ev => ev._id || ev.id),
      geoData: { origen: geoData?.points?.o, destino: geoData?.points?.d },
      creado: new Date().toLocaleDateString()
    });

    if (success) {
        setShowSaveModal(false);
        setNombrePlan("");
        triggerNotif("Plan sincronizado en MongoDB ✨", "success");
    } else {
        Alert.alert("Error de Persistencia", "No pudimos conectar con el servidor backend.");
    }
  };

  const getFormattedDateForDay = (index) => {
    const date = parseLocalDate(fechaInicio);
    if (!date) return "--";
    date.setDate(date.getDate() + index);
    const months = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
    return `${date.getDate().toString().padStart(2, '0')} ${months[date.getMonth()]}`;
  };

  /**
   * GENERADOR DE PDF
   * Convierte el plan en un PDF y lo comparte.
   */
  const handleDescargarPDF = async () => {
    const html = `
    <html>
      <body style="font-family: 'Helvetica', sans-serif; padding: 40px; background: #fdfcf0; color: #1a1a1a;">
        <div style="text-align: center; border-bottom: 2px solid #d4af37; padding-bottom: 20px;">
          <h1 style="color: #059669; margin: 0; letter-spacing: 5px; font-size: 30px;">FESTIMAP ECUADOR</h1>
          <p style="color: #d4af37; font-weight: bold; margin: 5px 0;">Premium Travel Edition • Bitácora Digital</p>
        </div>
        
        <h2 style="text-align: center; font-size: 28px; margin: 30px 0;">${nombrePlan || 'Ruta del Explorador'}</h2>
        
        <div style="background: white; padding: 25px; border-radius: 15px; margin-bottom: 30px; border-left: 5px solid #d4af37; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
          <p>👤 <b>Viajero:</b> ${user?.nombre || 'Explorador Cultural'}</p>
          <p>🛣️ <b>Ruta trazada:</b> ${origen} &rarr; ${destino}</p>
          <p>📅 <b>Fecha de Salida:</b> ${getFriendlyDate(fechaInicio)}</p>
          <p>⏱️ <b>Duración:</b> ${dias} Días de Tradición</p>
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
                <img src="${ev.imagen}" style="width: 110px; height: 110px; border-radius: 10px; object-fit: cover;" />
                <div style="flex: 1;">
                  <h4 style="margin: 0; color: #1a1a1a; font-size: 17px;">${ev.name.toUpperCase()}</h4>
                  <p style="margin: 5px 0; color: #059669; font-weight: bold; font-size: 11px;">📍 ${ev.ciudad}, ${ev.provincia}</p>
                  <p style="margin-top: 8px; color: #666; font-size: 12px; line-height: 1.4; font-style: italic;">"${ev.descripcion}"</p>
                </div>
              </div>
            `).join('')}
          </div>
        `).join('')}

        <div style="text-align: center; margin-top: 50px; color: #999; font-size: 10px;">
          DOCUMENTO GENERADO POR FESTIMAP ECUADOR ENGINE v5.5 • PATRIMONIO DIGITAL
        </div>
      </body>
    </html>`;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert("Error PDF", "No se pudo generar el documento."); }
  };

  // MAPA (Leaflet en WebView) dibuja ruta + buffer + puntos
  const mapHtml = useMemo(() => {
    // Este HTML se renderiza en un WebView (Leaflet)
    if (!geoData) return '<html><body style="background:#0f172a"></body></html>';

    const routeCoords = geoData.route?.coordinates || geoData.route?.geometry?.coordinates;
    const bufferCoords = geoData.buffer?.coordinates || geoData.buffer?.geometry?.coordinates;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          #map { height: 100vh; width: 100vw; background: #0f172a; } 
          body { margin: 0; }
          .leaflet-tile { filter: brightness(0.6) invert(1) contrast(3) hue-rotate(200deg) saturate(0.3) brightness(0.7); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          try {
            // Crear mapa base
            const map = L.map('map', { zoomControl: false });
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
              attribution: '© OpenStreetMap'
            }).addTo(map);
            
            const bufferStyle = { 
              color: '#ffb800', 
              weight: 2, 
              fillColor: '#ffb800',
              fillOpacity: 0.12, 
              dashArray: '5, 5' 
            };
            
            const routeStyle = { 
              color: '#8b5cf6', 
              weight: 6, 
              opacity: 0.85, 
              lineCap: 'round',
              lineJoin: 'round'
            };

            let bounds = L.latLngBounds();
            
            // Origen y destino (puntos principales)
            const o = [${geoData.points.o.lat}, ${geoData.points.o.lng}];
            const d = [${geoData.points.d.lat}, ${geoData.points.d.lng}];
            
            L.circleMarker(o, { 
              radius: 10, 
              color: 'white', 
              fillColor: '#10b981', 
              fillOpacity: 1,
              weight: 3
            }).bindPopup('<b>Origen</b><br>${origen}').addTo(map);
            
            L.circleMarker(d, { 
              radius: 10, 
              color: 'white', 
              fillColor: '#ffb800', 
              fillOpacity: 1,
              weight: 3
            }).bindPopup('<b>Destino</b><br>${destino}').addTo(map);
            
            bounds.extend(o);
            bounds.extend(d);

            // BUFFER: área de búsqueda alrededor de la ruta
            const bufferCoords = ${JSON.stringify(bufferCoords)};
            if (bufferCoords && Array.isArray(bufferCoords)) {
              let bufferGeoJSON;
              if (bufferCoords[0] && Array.isArray(bufferCoords[0][0]) && Array.isArray(bufferCoords[0][0][0])) {
                bufferGeoJSON = {
                  type: 'Feature',
                  geometry: {
                    type: 'MultiPolygon',
                    coordinates: bufferCoords
                  }
                };
              } else if (bufferCoords[0] && Array.isArray(bufferCoords[0][0])) {
                bufferGeoJSON = {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: bufferCoords
                  }
                };
              }
              if (bufferGeoJSON) {
                const bufferLayer = L.geoJSON(bufferGeoJSON, { 
                  style: bufferStyle 
                }).addTo(map);
                bounds.extend(bufferLayer.getBounds());
              }
            }

            // RUTA: línea principal entre origen y destino
            const routeCoords = ${JSON.stringify(routeCoords)};
            if (routeCoords && Array.isArray(routeCoords)) {
              let routeGeoJSON;
              if (routeCoords[0] && Array.isArray(routeCoords[0])) {
                routeGeoJSON = {
                  type: 'Feature',
                  geometry: {
                    type: 'LineString',
                    coordinates: routeCoords
                  }
                };
              }
              if (routeGeoJSON) {
                const routeLayer = L.geoJSON(routeGeoJSON, { 
                  style: routeStyle 
                }).addTo(map);
                bounds.extend(routeLayer.getBounds());
              }
            }

            ${sugerencias.map(ev => `
              L.circleMarker([${ev.lat}, ${ev.lng}], { 
                radius: 7, 
                color: '#d4af37', 
                fillColor: '#fbbf24', 
                fillOpacity: 0.8, 
                weight: 2 
              }).bindPopup('<b>${String(ev.name || '').replace(/'/g, "\\'")}</b><br>📍 ${ev.ciudad}').addTo(map);
              bounds.extend([${ev.lat}, ${ev.lng}]);
            `).join('\n')}

            if (bounds.isValid()) {
              map.fitBounds(bounds, { padding: [40, 40] });
            } else {
              const center = [(o[0] + d[0]) / 2, (o[1] + d[1]) / 2];
              map.setView(center, 10);
            }

            setTimeout(() => map.invalidateSize(true), 200);
          } catch (error) {
            document.body.innerHTML = '<div style="color:white;padding:20px;">Error: ' + error.message + '</div>';
          }
        </script>
      </body>
      </html>
    `;
  }, [geoData, sugerencias, origen, destino]);

  const staticMapUrl = geoData ? `https://static-maps.yandex.ru/1.x/?lang=es_ES&l=map&size=600,300&bbox=${geoData.points.o.lng},${geoData.points.o.lat}~${geoData.points.d.lng},${geoData.points.d.lat}&pt=${geoData.points.o.lng},${geoData.points.o.lat},pm2rdl~${geoData.points.d.lng},${geoData.points.d.lat},pm2grl` : null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
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

        <View style={styles.cardForm}>
           <View style={styles.routeSection}>
              <View style={styles.routeVisual}>
                <View style={styles.routeDotActive} />
                <View style={styles.routeLine} />
                <View style={styles.routeDotAccent} />
              </View>
              <View style={styles.routeInputs}>
                 <View style={styles.inputWrap}>
                    <View style={styles.labelRow}>
                       <Text style={styles.label}>PUNTO DE PARTIDA</Text>
                       <TouchableOpacity onPress={handleUseCurrentLocation} style={styles.gpsAutoBtn}>
                          {loadingGPS ? <ActivityIndicator size="small" color={COLORS.accent} /> : <Text style={styles.gpsAutoText}>🛰️ AUTO GPS</Text>}
                       </TouchableOpacity>
                    </View>
                    <TextInput style={styles.input} value={origen} onChangeText={setOrigen} placeholder="Ej: Quito" placeholderTextColor={COLORS.muted} />
                 </View>
                 <View style={styles.inputWrap}>
                    <Text style={styles.label}>LLEGADA FINAL</Text>
                    <TextInput style={styles.input} value={destino} onChangeText={setDestino} placeholder="Ej: Otavalo" placeholderTextColor={COLORS.muted} />
                 </View>
              </View>
           </View>

           <View style={[styles.row, {marginTop: 25, alignItems: 'flex-start'}]}>
              <View style={{flex: 1, marginRight: 15}}>
                <Text style={styles.label}>SALIDA (AAAA-MM-DD)</Text>
                <TextInput style={styles.input} value={fechaInicio} onChangeText={setFechaInicio} />
                <Text style={styles.dateHelper}>{getFriendlyDate(fechaInicio)}</Text>
              </View>
              <View style={{width: 80}}>
                <Text style={[styles.label, {textAlign: 'center'}]}>DÍAS</Text>
                <View style={styles.daysInputWrapper}>
                  <TextInput style={styles.daysInput} value={dias} onChangeText={setDias} keyboardType="numeric" maxLength={3} textAlign="center" />
                  <Text style={styles.daysLabel}>Días</Text>
                </View>
              </View>
           </View>

           <View style={styles.radioBox}>
              <View style={styles.rowBetween}>
                <Text style={styles.label}>RADIO DE EXPLORACIÓN</Text>
                <Text style={styles.radioValue}>{radio} KM</Text>
              </View>
              <View style={styles.sliderContainer} {...panResponder.panHandlers}>
                <View style={styles.sliderTrack}>
                  <View style={[styles.sliderFill, { width: `${radio}%` }]} />
                  <View style={[styles.sliderThumb, { left: `${radio}%` }]} />
                </View>
              </View>
           </View>

           <TouchableOpacity style={styles.mainBtn} onPress={handleGenerarRuta} disabled={loading}>
              {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.mainBtnText}>GENERAR RUTA INTELIGENTE 🚀</Text>}
           </TouchableOpacity>
        </View>

        {geoData && (
          <View style={styles.mapContainer}>
            <WebView
              key={geoData ? JSON.stringify(geoData.points) : 'map'}
              originWhitelist={['*']}
              source={{ html: mapHtml }}
              style={{ flex: 1 }}
              scrollEnabled={false}
            />
          </View>
        )}

        {sugerencias.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PARADAS RECOMENDADAS EN RUTA ({sugerencias.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestionTrack}>
              {sugerencias.map(ev => (
                <TouchableOpacity key={ev._id || ev.id} style={styles.suggestCard} onPress={() => addStop(ev)} activeOpacity={0.9}>
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

        <View style={styles.itineraryMain}>
           <Text style={styles.sectionTitle}>MI PLAN PERSONALIZADO</Text>
           <View style={styles.actionsBar}>
              <TouchableOpacity style={styles.actionBtnPrimary} onPress={() => setShowSaveModal(true)}>
                <Text style={{color: COLORS.ink, fontWeight: 'bold'}}>💾 GUARDAR PLAN</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setShowFolio(true)}>
                <Text style={{color: 'white', fontWeight: 'bold'}}>📥 FOLIO PDF</Text>
              </TouchableOpacity>
           </View>

           <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {Array.from({length: parseInt(dias) || 1}).map((_, i) => (
                  <TouchableOpacity key={i} style={[styles.dayTab, activeDay === i && styles.dayTabActive]} onPress={() => setActiveDay(i)}>
                    <Text style={[styles.dayTabText, activeDay === i && styles.dayTabTextActive]}>DÍA {i+1}</Text>
                    <Text style={[styles.dayTabSub, activeDay === i && styles.dayTabSubActive]}>{getFormattedDateForDay(i)}</Text>
                  </TouchableOpacity>
                ))}
           </ScrollView>

           <View style={styles.timeline}>
              {(itinerario[activeDay] || []).length === 0 ? (
                <View style={styles.emptyDayBox}>
                   <Text style={styles.emptyDayEmoji}>🏜️</Text>
                   <Text style={styles.emptyDayText}>Día en blanco. Agrega paradas desde las sugerencias.</Text>
                </View>
              ) : 
              (itinerario[activeDay].map((stop, idx) => (
                <View key={stop._id || stop.id} style={styles.timelineItem}>
                  <View style={styles.stopCard}>
                    <Image source={{ uri: stop.imagen }} style={styles.stopImg} />
                    <View style={{flex: 1, marginLeft: 15}}>
                      <Text style={styles.stopName}>{stop.name}</Text>
                      <Text style={styles.stopLoc}>📍 {stop.ciudad}</Text>
                    </View>
                    <TouchableOpacity onPress={() => {
                      const n = itinerario[activeDay].filter(s => (s._id || s.id) !== (stop._id || stop.id)); 
                      setItinerario({...itinerario, [activeDay]: n});
                    }}>
                      <View style={styles.removeCircle}><Text style={styles.removeText}>✕</Text></View>
                    </TouchableOpacity>
                  </View>
                </View>
              )))}
           </View>
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* MODAL DE GUARDADO */}
      <Modal visible={showSaveModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.saveBox}>
            <Text style={styles.modalTitle}>Nombre del Plan de Viaje</Text>
            <Text style={styles.modalSub}>Se guardará en tu agenda y en MongoDB.</Text>
            <TextInput style={styles.modalInput} value={nombrePlan} onChangeText={setNombrePlan} placeholder="Ej: Tour Carnaval 2026" placeholderTextColor={COLORS.muted} />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={()=>setShowSaveModal(false)} style={styles.mBtnCancel}>
                <Text style={{color:'white', fontWeight:'bold'}}>Cerrar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleGuardarPlanFinal} style={styles.mBtnConfirm}>
                <Text style={{fontWeight: 'bold', color: COLORS.ink}}>CONFIRMAR GUARDADO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* VISTA PREVIA DEL FOLIO EDITORIAL */}
      <Modal visible={showFolio} animationType="slide" transparent={false}>
        <View style={styles.folioBg}>
           <SafeAreaView style={{flex: 1}}>
              <ScrollView contentContainerStyle={{padding: 25}}>
                <TouchableOpacity onPress={() => setShowFolio(false)} style={styles.closeFolio}>
                  <Text style={styles.closeText}>✕ CERRAR VISTA PREVIA</Text>
                </TouchableOpacity>
                
                <Text style={styles.folioBrand}>FESTIMAP ECUADOR</Text>
                <Text style={styles.folioTitle}>{nombrePlan || 'PLAN DE RUTA'}</Text>
                
                {staticMapUrl && (
                  <View style={styles.folioMapBox}>
                    <Image source={{ uri: staticMapUrl }} style={styles.folioImg} />
                  </View>
                )}

                <View style={styles.folioSummary}>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold', color: COLORS.tropical}}>DE:</Text> {origen}</Text>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold', color: COLORS.tropical}}>A:</Text> {destino}</Text>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold', color: COLORS.tropical}}>SALIDA:</Text> {getFriendlyDate(fechaInicio)}</Text>
                  <Text style={styles.folioDataText}><Text style={{fontWeight: 'bold', color: COLORS.tropical}}>RADIO:</Text> {radio} KM a la redonda</Text>
                </View>

                {Object.keys(itinerario).sort().map(dayIdx => (
                  <View key={dayIdx} style={{marginTop: 30}}>
                    <Text style={styles.dayNumText}>DÍA {parseInt(dayIdx) + 1} • {getFormattedDateForDay(parseInt(dayIdx))}</Text>
                    {itinerario[dayIdx].map(ev => (
                      <View key={ev._id || ev.id} style={styles.folioEventCard}>
                        <Image source={{ uri: ev.imagen }} style={styles.folioEventImg} />
                        <View style={{flex:1}}>
                          <Text style={styles.folioEventName}>{ev.name}</Text>
                          <Text style={{fontSize: 11, color: COLORS.tropical, fontWeight:'bold'}}>📍 {ev.ciudad}</Text>
                          <Text style={{fontSize: 10, color: '#666', marginTop: 4}} numberOfLines={2}>{ev.descripcion}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ))}

                <TouchableOpacity style={styles.folioDownload} onPress={handleDescargarPDF}>
                  <Text style={{color:'white', fontWeight:'bold', fontSize: 16}}>GENERAR PDF OFICIAL 📥</Text>
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
  header: { paddingHorizontal: 30, paddingTop: Platform.OS === 'ios' ? 20 : 60, marginBottom: 10 },
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
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  gpsAutoBtn: { backgroundColor: 'rgba(255,184,0,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,184,0,0.3)' },
  gpsAutoText: { color: COLORS.accent, fontSize: 8, fontWeight: '900' },
  label: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2 },
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
  sliderThumb: { position: 'absolute', top: -11, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.accent, marginLeft: -15, elevation: 10 },
  mainBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 25, alignItems: 'center', marginTop: 35 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  mapContainer: { height: 220, marginHorizontal: 20, borderRadius: 35, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder, marginBottom: 40 },
  section: { marginBottom: 45 },
  sectionTitle: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginLeft: 30, marginBottom: 20 },
  suggestionTrack: { paddingLeft: 30, gap: 18 },
  suggestCard: { width: 220, backgroundColor: COLORS.card, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  suggestImg: { width: '100%', height: 130 },
  suggestFooter: { padding: 18 },
  suggestName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  suggestLoc: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  suggestAddBtn: { position: 'absolute', top: 12, right: 12, width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  plus: { color: COLORS.ink, fontWeight: '900', fontSize: 18 },
  itineraryMain: { paddingHorizontal: 30 },
  actionsBar: { flexDirection: 'row', gap: 12, marginBottom: 25 },
  actionBtnPrimary: { flex: 1, backgroundColor: COLORS.accent, padding: 15, borderRadius: 18, alignItems:'center' },
  actionBtnSecondary: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 18, alignItems:'center' },
  dayTab: { paddingHorizontal: 22, paddingVertical: 18, borderRadius: 22, marginRight: 12, backgroundColor: COLORS.glass, alignItems: 'center', minWidth: 100 },
  dayTabActive: { backgroundColor: COLORS.accent },
  dayTabText: { color: COLORS.muted, fontWeight: 'bold', fontSize: 13 },
  dayTabTextActive: { color: COLORS.ink },
  dayTabSub: { color: COLORS.muted, fontSize: 9 },
  dayTabSubActive: { color: 'rgba(0,0,0,0.5)' },
  timelineItem: { marginBottom: 15 },
  stopCard: { backgroundColor: COLORS.card, padding: 18, borderRadius: 28, flexDirection: 'row', alignItems: 'center' },
  stopImg: { width: 60, height: 60, borderRadius: 18 },
  stopName: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  stopLoc: { color: COLORS.accent, fontSize: 11 },
  removeCircle: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(239, 68, 68, 0.1)', alignItems: 'center', justifyContent: 'center' },
  removeText: { color: COLORS.error, fontWeight: 'bold' },
  emptyDayBox: { alignItems: 'center', marginTop: 30, padding: 30, backgroundColor: COLORS.glass, borderRadius: 25, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.glassBorder },
  emptyDayEmoji: { fontSize: 40, marginBottom: 10 },
  emptyDayText: { color: COLORS.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 40 },
  saveBox: { backgroundColor: COLORS.card, padding: 35, borderRadius: 40, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalSub: { color: COLORS.muted, fontSize: 12, marginBottom: 25 },
  modalInput: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 18, color: 'white', marginBottom: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalBtns: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  mBtnCancel: { flex: 1, padding: 15, alignItems: 'center' },
  mBtnConfirm: { flex: 2, backgroundColor: COLORS.accent, padding: 15, borderRadius: 15, alignItems: 'center' },
  folioBg: { flex: 1, backgroundColor: COLORS.sand },
  closeFolio: { alignSelf: 'flex-end', padding: 10, marginBottom: 10 },
  closeText: { color: COLORS.tropical, fontWeight: '900', fontSize: 11 },
  folioBrand: { fontSize: 14, fontWeight: '900', color: COLORS.tropical, textAlign: 'center', letterSpacing: 5 },
  folioTitle: { fontSize: 32, fontWeight: '800', textAlign: 'center', marginTop: 10, color: '#1a1a1a', letterSpacing: -1 },
  folioMapBox: { height: 180, borderRadius: 25, overflow: 'hidden', marginVertical: 25, borderWidth: 1, borderColor: COLORS.gold, elevation: 5 },
  folioImg: { width: '100%', height: '100%' },
  folioSummary: { backgroundColor: 'white', padding: 25, borderRadius: 25, elevation: 3, borderLeftWidth: 6, borderLeftColor: COLORS.gold },
  folioDataText: { fontSize: 13, marginBottom: 8, color: '#444' },
  dayNumText: { color: COLORS.tropical, fontSize: 18, fontWeight: '900', marginTop: 35, borderBottomWidth: 1, borderBottomColor: COLORS.gold, paddingBottom: 10 },
  folioEventCard: { flexDirection: 'row', gap: 15, backgroundColor: 'white', padding: 18, borderRadius: 20, marginTop: 15, elevation: 2, borderWidth: 1, borderColor: '#eee' },
  folioEventImg: { width: 70, height: 70, borderRadius: 12 },
  folioEventName: { fontWeight: '900', fontSize: 14, color: '#1a1a1a' },
  folioDownload: { backgroundColor: COLORS.tropical, padding: 22, borderRadius: 22, alignItems: 'center', marginTop: 40, elevation: 5 }
});
