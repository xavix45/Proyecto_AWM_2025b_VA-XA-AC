
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Switch,
  Dimensions,
  SafeAreaView,
  StatusBar
} from 'react-native';
import * as Location from 'expo-location';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#8b5cf6',
  ink: '#020617',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.04)',
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  error: '#ef4444',
  success: '#10b981',
  card: '#1e293b'
};

const REGIONES_DATA = {
  Sierra: ["Pichincha", "Imbabura", "Cotopaxi", "Tungurahua", "Azuay", "Loja", "Chimborazo", "Bolívar", "Cañar", "Carchi"],
  Costa: ["Guayas", "Manabí", "Esmeraldas", "El Oro", "Santa Elena", "Los Ríos", "Santo Domingo"],
  Amazonía: ["Napo", "Orellana", "Pastaza", "Sucumbíos", "Morona Santiago", "Zamora Chinchipe"],
  Insular: ["Galápagos"]
};

const CATEGORIAS = ["Entretenimiento", "Tecnología", "Educativo", "Cultural", "Musical", "Deportes", "Gastronomía", "Ancestral", "Tradición"];
const TIPOS = ["festiva", "académico", "show", "feria", "vida nocturna", "concierto", "recreativo", "competencia", "mercado", "festival"];
const REPETICIONES = ["Anual", "Mensual", "Semanal", "Diario", "Sábados", "No se repite"];
const ESTADOS = ["approved", "pending", "unpublished", "rejected"];

export default function AdminForm({ route, navigation }) {
  const editData = route.params?.evento;
  const { user, token } = useUser();
  const [loading, setLoading] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(false); 
  
  // FORM PRINCIPAL: datos que se enviarán al backend (POST/PUT eventos)
  const [form, setForm] = useState({
    name: '',
    descripcion: '',
    categoria: 'Cultural',
    tipo: 'festiva',
    region: 'Sierra',
    provincia: 'Pichincha',
    ciudad: '',
    lugar: '',
    referencia: '',
    lat: '',
    lng: '',
    fecha: new Date().toISOString().split('T')[0],
    fecha_fin: '',
    horario: '09:00 - 18:00',
    repeticion: 'Anual',
    durMin: '60',
    organizador: '',
    telefono: '',
    url: '',
    precio: 'Gratuito',
    imagen: '',
    tags: '',
    allowComments: true,
    requireApproval: false,
    status: 'approved',
    rejectReason: ''
  });

  useEffect(() => {
    if (editData) {
      // MODO EDICIÓN: cargar datos del evento en el formulario
      setForm({
        ...editData,
        lat: editData.lat?.toString() || '',
        lng: editData.lng?.toString() || '',
        durMin: editData.durMin?.toString() || '0',
        tags: Array.isArray(editData.tags) ? editData.tags.join(', ') : '',
        fecha_fin: editData.fecha_fin || ''
      });
    }
  }, [editData]);

  const handleRegionChange = (reg) => {
    setForm({ 
      ...form, 
      region: reg, 
      provincia: REGIONES_DATA[reg][0] 
    });
  };

  /**
   * CAPTURA GPS (EXPO-LOCATION)
   * Sirve para obtener lat/lng y enviarlo en el payload del evento.
   */
  const handleAutoLocation = async () => {
    setLoadingGPS(true);
    
    try {
      // 1. Verificar si el servicio GPS está disponible
      const available = await Location.hasServicesEnabledAsync();
      if (!available) {
        Alert.alert(
          "⚠️ GPS Deshabilitado", 
          "Por favor activa el GPS en la configuración de tu dispositivo."
        );
        setLoadingGPS(false);
        return;
      }

      // 2. Solicitar permisos de ubicación
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          "❌ Permiso Denegado", 
          "Necesitas otorgar permisos de ubicación para usar esta función."
        );
        setLoadingGPS(false);
        return;
      }

      // 3. Obtener ubicación actual con alta precisión
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 0
      });

      const { latitude, longitude } = location.coords;
      
      setForm(prev => ({
        ...prev,
        lat: latitude.toFixed(6),
        lng: longitude.toFixed(6)
      }));

      Alert.alert(
        "✅ Ubicación Capturada", 
        `Lat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`
      );
      
    } catch (error) {
      console.error("Error GPS:", error);
      Alert.alert(
        "❌ Error GPS", 
        error.message || "No se pudo obtener la ubicación. Verifica que el GPS esté activo."
      );
    } finally {
      setLoadingGPS(false);
    }
  };

  // GUARDAR EVENTO (BACKEND):
  // - Si hay editData => PUT /api/eventos/:id
  // - Si NO hay editData => POST /api/eventos
  // Requiere token de admin en Authorization
  const handleSave = async () => {
    if (!form.name || !form.ciudad || !form.lat || !form.lng || !form.fecha) {
      return Alert.alert("⚠️ Campos Críticos", "Nombre, Ciudad, Fecha y Coordenadas GPS son obligatorios.");
    }

    if (!token) {
      return Alert.alert("🚫 Sesión Requerida", "Por favor inicia sesión como administrador para crear eventos.");
    }

    setLoading(true);
    try {
      // PAYLOAD que se envía al backend
      const payload = {
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        durMin: parseInt(form.durMin) || 0,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(tag => tag.trim()).filter(t => t !== "") : form.tags,
        fecha_fin: form.fecha_fin || null,
        comentarios: editData?.comentarios || []
      };

      // HEADERS con token (admin)
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      if (editData) {
        // BACKEND: actualizar evento existente
        const targetId = editData._id || editData.id;
        await axios.put(`${ENDPOINTS.eventos}/${targetId}`, payload, config);
        Alert.alert("✅ Actualizado", "Registro sincronizado en MongoDB.");
      } else {
        // BACKEND: crear evento nuevo
        await axios.post(ENDPOINTS.eventos, payload, config);
        Alert.alert("✅ Publicado", "Nuevo registro cultural añadido.");
      }
      navigation.goBack();
    } catch (err) {
      console.error("Error detallado:", err.response?.data || err.message);
      const errorMsg = err.response?.data?.message || err.message;
      Alert.alert("❌ Error de Servidor", `No se pudo guardar: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const SectionTitle = ({ title, icon }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{icon}</Text>
      <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          
          <Text style={styles.title}>{editData ? 'Editor de Patrimonio' : 'Nuevo Registro'}</Text>
          <Text style={styles.subtitle}>Gestión de datos en el motor MongoDB de FestiMap.</Text>

          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: form.imagen || 'https://images.unsplash.com/photo-1589405270457-238478427778?q=80&w=600' }} 
              style={styles.previewImg} 
            />
            <View style={styles.previewOverlay}>
               <Text style={styles.previewLabel}>VISTA PREVIA DEL RECURSO</Text>
            </View>
          </View>

          <SectionTitle title="Identidad y Clasificación" icon="🎭" />
          <View style={styles.card}>
            <Text style={styles.label}>NOMBRE DE LA FESTIVIDAD*</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={t => setForm({...form, name: t})} placeholder="Ej: La Mama Negra" placeholderTextColor={COLORS.muted} />

            <Text style={styles.label}>URL DE IMAGEN (JPG/PNG)</Text>
            <TextInput style={styles.input} value={form.imagen} onChangeText={t => setForm({...form, imagen: t})} placeholder="https://..." placeholderTextColor={COLORS.muted} />

            <Text style={styles.label}>DESCRIPCIÓN EXTENDIDA*</Text>
            <TextInput style={[styles.input, styles.area]} multiline value={form.descripcion} onChangeText={t => setForm({...form, descripcion: t})} placeholder="Detalles históricos..." placeholderTextColor={COLORS.muted} />
          </View>

          <SectionTitle title="Geolocalización" icon="📍" />
          <View style={styles.card}>
            
            <TouchableOpacity 
              style={[styles.gpsQuickBtn, loadingGPS && { opacity: 0.7 }]} 
              onPress={handleAutoLocation}
              disabled={loadingGPS}
            >
              {loadingGPS ? (
                <ActivityIndicator color={COLORS.accent} size="small" />
              ) : (
                <Text style={styles.gpsQuickText}>🛰️ CAPTURAR COORDENADAS CON GPS NATIVO</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>REFERENCIA / PUNTO CLAVE</Text>
            <TextInput style={styles.input} value={form.referencia} onChangeText={t => setForm({...form, referencia: t})} placeholder="Ej: Faldas del Ruco Pichincha" placeholderTextColor={COLORS.muted} />

            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>LATITUD*</Text>
                  <TextInput style={styles.input} value={form.lat} onChangeText={t => setForm({...form, lat: t})} keyboardType="numeric" placeholder="-0.123" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>LONGITUD*</Text>
                  <TextInput style={styles.input} value={form.lng} onChangeText={t => setForm({...form, lng: t})} keyboardType="numeric" placeholder="-78.456" placeholderTextColor={COLORS.muted} />
               </View>
            </View>
          </View>

          <SectionTitle title="Clasificación y Tags" icon="🏷️" />
          <View style={styles.card}>
            <View style={styles.rowInputs}>
              <View style={{flex: 1}}>
                 <Text style={styles.label}>CATEGORÍA PRINCIPAL</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                   {CATEGORIAS.map(c => (
                     <TouchableOpacity key={c} style={[styles.chip, form.categoria === c && styles.chipActive]} onPress={() => setForm({...form, categoria: c})}>
                       <Text style={[styles.chipText, form.categoria === c && styles.chipTextActive]}>{c}</Text>
                     </TouchableOpacity>
                   ))}
                 </ScrollView>
              </View>
            </View>

            <View style={styles.rowInputs}>
              <View style={{flex: 1}}>
                 <Text style={styles.label}>TIPO DE EVENTO</Text>
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                   {TIPOS.map(t => (
                     <TouchableOpacity key={t} style={[styles.chip, form.tipo === t && styles.chipActive]} onPress={() => setForm({...form, tipo: t})}>
                       <Text style={[styles.chipText, form.tipo === t && styles.chipTextActive]}>{t}</Text>
                     </TouchableOpacity>
                   ))}
                 </ScrollView>
              </View>
            </View>

            <Text style={styles.label}>ETIQUETAS (SEPARADAS POR COMA)</Text>
            <TextInput style={styles.input} value={form.tags} onChangeText={t => setForm({...form, tags: t})} placeholder="tradición, baile, quito" placeholderTextColor={COLORS.muted} />
          </View>

          <SectionTitle title="Ubicación Geográfica" icon="🗺️" />
          <View style={styles.card}>
            <Text style={styles.label}>REGIÓN POLÍTICA</Text>
            <View style={styles.row}>
               {Object.keys(REGIONES_DATA).map(r => (
                 <TouchableOpacity key={r} style={[styles.regBtn, form.region === r && styles.regBtnActive]} onPress={() => handleRegionChange(r)}>
                   <Text style={[styles.regText, form.region === r && styles.regTextActive]}>{r}</Text>
                 </TouchableOpacity>
               ))}
            </View>

            <Text style={styles.label}>PROVINCIA (BASADO EN REGIÓN)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
               {REGIONES_DATA[form.region].map(p => (
                 <TouchableOpacity key={p} style={[styles.chip, form.provincia === p && styles.chipActive]} onPress={() => setForm({...form, provincia: p})}>
                    <Text style={[styles.chipText, form.provincia === p && styles.chipTextActive]}>{p}</Text>
                 </TouchableOpacity>
               ))}
            </ScrollView>

            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>CIUDAD / CANTÓN*</Text>
                  <TextInput style={styles.input} value={form.ciudad} onChangeText={t => setForm({...form, ciudad: t})} placeholder="Latacunga" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>LUGAR / PLAZA</Text>
                  <TextInput style={styles.input} value={form.lugar} onChangeText={t => setForm({...form, lugar: t})} placeholder="Centro Histórico" placeholderTextColor={COLORS.muted} />
               </View>
            </View>
          </View>

          <SectionTitle title="Cronograma y Duración" icon="📅" />
          <View style={styles.card}>
            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>FECHA INICIO*</Text>
                  <TextInput style={styles.input} value={form.fecha} onChangeText={t => setForm({...form, fecha: t})} placeholder="2026-01-01" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>FECHA FIN</Text>
                  <TextInput style={styles.input} value={form.fecha_fin} onChangeText={t => setForm({...form, fecha_fin: t})} placeholder="2026-01-02" placeholderTextColor={COLORS.muted} />
               </View>
            </View>

            <Text style={styles.label}>HORARIO DEL EVENTO</Text>
            <TextInput style={styles.input} value={form.horario} onChangeText={t => setForm({...form, horario: t})} placeholder="09:00 - 18:00" placeholderTextColor={COLORS.muted} />

            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>DURACIÓN (MINUTOS)</Text>
                  <TextInput style={styles.input} value={form.durMin} onChangeText={t => setForm({...form, durMin: t})} keyboardType="numeric" placeholder="60" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>REPETICIÓN</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={{flexDirection: 'row'}}>
                      {REPETICIONES.map((rep, idx) => (
                        <TouchableOpacity key={rep} style={[styles.chip, form.repeticion === rep && styles.chipActive, {marginRight: idx === REPETICIONES.length - 1 ? 0 : 10}]} onPress={() => setForm({...form, repeticion: rep})}>
                          <Text style={[styles.chipText, form.repeticion === rep && styles.chipTextActive]}>{rep}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </ScrollView>
               </View>
            </View>
          </View>

          <SectionTitle title="Información de Contacto" icon="📞" />
          <View style={styles.card}>
            <Text style={styles.label}>NOMBRE DEL ORGANIZADOR</Text>
            <TextInput style={styles.input} value={form.organizador} onChangeText={t => setForm({...form, organizador: t})} placeholder="Ej: TelefériQo Quito" placeholderTextColor={COLORS.muted} />

            <Text style={styles.label}>TELÉFONO CONTACTO</Text>
            <TextInput style={styles.input} value={form.telefono} onChangeText={t => setForm({...form, telefono: t})} keyboardType="phone-pad" placeholder="02-222-2951" placeholderTextColor={COLORS.muted} />

            <Text style={styles.label}>URL / SITIO WEB OFICIAL</Text>
            <TextInput style={styles.input} value={form.url} onChangeText={t => setForm({...form, url: t})} placeholder="https://..." placeholderTextColor={COLORS.muted} />

            <Text style={styles.label}>PRECIO / ENTRADA</Text>
            <TextInput style={styles.input} value={form.precio} onChangeText={t => setForm({...form, precio: t})} placeholder="Gratuito o $XX" placeholderTextColor={COLORS.muted} />
          </View>

          <SectionTitle title="Configuración Avanzada" icon="⚙️" />
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                 <Text style={styles.switchLabel}>PERMITIR COMENTARIOS</Text>
                 <Text style={styles.switchSub}>Viajeros pueden dejar opiniones.</Text>
              </View>
              <Switch 
                value={form.allowComments} 
                onValueChange={v => setForm({...form, allowComments: v})} 
                trackColor={{ false: '#334155', true: COLORS.violet }}
                thumbColor={form.allowComments ? COLORS.accent : '#94a3b8'}
              />
            </View>

            <View style={styles.switchRow}>
              <View>
                 <Text style={styles.switchLabel}>REQUIERE APROBACIÓN</Text>
                 <Text style={styles.switchSub}>Admin debe revisar antes de publicar.</Text>
              </View>
              <Switch 
                value={form.requireApproval} 
                onValueChange={v => setForm({...form, requireApproval: v})} 
                trackColor={{ false: '#334155', true: COLORS.violet }}
                thumbColor={form.requireApproval ? COLORS.accent : '#94a3b8'}
              />
            </View>

            <Text style={styles.label}>ESTADO DEL EVENTO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
              {ESTADOS.map(s => (
                <TouchableOpacity key={s} style={[styles.chip, form.status === s && styles.chipActive]} onPress={() => setForm({...form, status: s})}>
                  <Text style={[styles.chipText, form.status === s && styles.chipTextActive]}>{s.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {form.status === 'rejected' && (
              <>
                <Text style={styles.label}>MOTIVO DEL RECHAZO</Text>
                <TextInput style={[styles.input, styles.area]} multiline value={form.rejectReason} onChangeText={t => setForm({...form, rejectReason: t})} placeholder="Explica por qué se rechazó..." placeholderTextColor={COLORS.muted} />
              </>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.saveBtn, loading && {opacity: 0.7}]} 
            onPress={handleSave} 
            disabled={loading}
          >
             {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.saveText}>{editData ? 'ACTUALIZAR EN MONGODB 🔄' : 'PUBLICAR EN EL MAPA 🚀'}</Text>}
          </TouchableOpacity>

          <View style={{height: 100}} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  scroll: { padding: 25 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 5, marginBottom: 30 },
  previewContainer: { height: 200, borderRadius: 30, overflow: 'hidden', marginBottom: 35, borderWidth: 1, borderColor: COLORS.glassBorder },
  previewImg: { width: '100%', height: '100%' },
  previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', padding: 12, alignItems: 'center' },
  previewLabel: { color: COLORS.accent, fontSize: 8, fontWeight: '900', letterSpacing: 3 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15, marginTop: 10 },
  sectionIcon: { fontSize: 18 },
  sectionLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  card: { backgroundColor: COLORS.glass, borderRadius: 30, padding: 25, marginBottom: 30, borderWidth: 1, borderColor: COLORS.glassBorder },
  gpsQuickBtn: { backgroundColor: 'rgba(255, 184, 0, 0.08)', padding: 15, borderRadius: 15, marginBottom: 25, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255, 184, 0, 0.3)' },
  gpsQuickText: { color: COLORS.accent, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  label: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', marginBottom: 12, letterSpacing: 1.5 },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 18, padding: 18, color: COLORS.white, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
  area: { height: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  rowInputs: { marginBottom: 20 },
  chipsRow: { flexDirection: 'row', marginBottom: 20 },
  chip: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  chipTextActive: { color: COLORS.white },
  regBtn: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 14, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginRight: 8 },
  regBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  regText: { color: COLORS.muted, fontSize: 9, fontWeight: '900' },
  regTextActive: { color: COLORS.ink },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  switchLabel: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  switchSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  saveBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 25, alignItems: 'center', elevation: 15, marginBottom: 20 },
  saveText: { color: COLORS.ink, fontWeight: '900', fontSize: 13, letterSpacing: 1.5 }
});
