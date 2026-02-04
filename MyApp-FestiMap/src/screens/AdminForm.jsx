
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
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';

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
const TIPOS = ["festiva", "académico", "show", "feria", "vida nocturna", "concierto", "recreativo", "competencia", "mercado"];
const REPETICIONES = ["Anual", "Mensual", "Semanal", "Diario", "Sábados", "No se repite"];
const ESTADOS = ["approved", "pending", "unpublished", "rejected"];

export default function AdminForm({ route, navigation }) {
  const editData = route.params?.evento;
  const [loading, setLoading] = useState(false);
  
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
   * JUSTIFICACIÓN TEÓRICA (PREGUNTA 2 - INTEGRACIÓN):
   * Implementamos validación síncrona en el cliente y asíncrona en el servidor.
   * Realizamos un parseo de tipos (lat/lng/durMin) antes del envío para asegurar la
   * compatibilidad con los tipos de datos definidos en el Mongoose Schema.
   */
  const handleSave = async () => {
    if (!form.name || !form.ciudad || !form.lat || !form.lng || !form.fecha) {
      return Alert.alert("⚠️ Campos Críticos", "Nombre, Ciudad, Fecha y Coordenadas GPS son obligatorios.");
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
        durMin: parseInt(form.durMin) || 0,
        tags: typeof form.tags === 'string' ? form.tags.split(',').map(tag => tag.trim()).filter(t => t !== "") : form.tags,
        fecha_fin: form.fecha_fin || null,
        comentarios: editData?.comentarios || []
      };

      if (editData) {
        const targetId = editData._id || editData.id;
        await axios.put(`${ENDPOINTS.eventos}/${targetId}`, payload);
        Alert.alert("✅ Sincronizado", "Registro actualizado en el inventario nacional.");
      } else {
        await axios.post(ENDPOINTS.eventos, payload);
        Alert.alert("✅ Publicado", "Nueva festividad añadida exitosamente al mapa.");
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert("❌ Error de Red", "No se pudo conectar con el servidor MongoDB.");
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
          <Text style={styles.subtitle}>Configuración técnica y logística del evento en MongoDB.</Text>

          <View style={styles.previewContainer}>
            <Image 
              source={{ uri: form.imagen || 'https://images.unsplash.com/photo-1589405270457-238478427778?q=80&w=600' }} 
              style={styles.previewImg} 
            />
            <View style={styles.previewOverlay}>
               <Text style={styles.previewLabel}>VISTA PREVIA DE PORTADA</Text>
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
            <TextInput style={styles.input} value={form.tags} onChangeText={t => setForm({...form, tags: t})} placeholder="tradicion, baile, quito" placeholderTextColor={COLORS.muted} />
          </View>

          <SectionTitle title="Ubicación y Geografía" icon="📍" />
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
                  <Text style={styles.label}>CIUDAD / CANTÓN</Text>
                  <TextInput style={styles.input} value={form.ciudad} onChangeText={t => setForm({...form, ciudad: t})} placeholder="Latacunga" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>LUGAR / PLAZA</Text>
                  <TextInput style={styles.input} value={form.lugar} onChangeText={t => setForm({...form, lugar: t})} placeholder="Centro Histórico" placeholderTextColor={COLORS.muted} />
               </View>
            </View>

            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>LATITUD (GPS)*</Text>
                  <TextInput style={styles.input} value={form.lat} onChangeText={t => setForm({...form, lat: t})} keyboardType="numeric" placeholder="-0.123" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>LONGITUD (GPS)*</Text>
                  <TextInput style={styles.input} value={form.lng} onChangeText={t => setForm({...form, lng: t})} keyboardType="numeric" placeholder="-78.456" placeholderTextColor={COLORS.muted} />
               </View>
            </View>
          </View>

          <SectionTitle title="Cronograma y Contacto" icon="📅" />
          <View style={styles.card}>
            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>FECHA INICIO*</Text>
                  <TextInput style={styles.input} value={form.fecha} onChangeText={t => setForm({...form, fecha: t})} placeholder="2026-01-01" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>DURACIÓN (MIN)</Text>
                  <TextInput style={styles.input} value={form.durMin} onChangeText={t => setForm({...form, durMin: t})} keyboardType="numeric" />
               </View>
            </View>

            <View style={styles.row}>
               <View style={{flex: 1}}>
                  <Text style={styles.label}>PRECIO / ENTRADA</Text>
                  <TextInput style={styles.input} value={form.precio} onChangeText={t => setForm({...form, precio: t})} placeholder="Gratis" placeholderTextColor={COLORS.muted} />
               </View>
               <View style={{width: 15}} />
               <View style={{flex: 1}}>
                  <Text style={styles.label}>TELÉFONO ORGANIZADOR</Text>
                  <TextInput style={styles.input} value={form.telefono} onChangeText={t => setForm({...form, telefono: t})} keyboardType="phone-pad" />
               </View>
            </View>

            <Text style={styles.label}>NOMBRE DEL ORGANIZADOR</Text>
            <TextInput style={styles.input} value={form.organizador} onChangeText={t => setForm({...form, organizador: t})} />

            <Text style={styles.label}>URL WEB OFICIAL</Text>
            <TextInput style={styles.input} value={form.url} onChangeText={t => setForm({...form, url: t})} placeholder="https://..." placeholderTextColor={COLORS.muted} />
          </View>

          <SectionTitle title="Ajustes de Interacción" icon="⚙️" />
          <View style={styles.card}>
            <View style={styles.switchRow}>
              <View>
                 <Text style={styles.switchLabel}>COMENTARIOS PÚBLICOS</Text>
                 <Text style={styles.switchSub}>Permitir que viajeros califiquen.</Text>
              </View>
              <Switch 
                value={form.allowComments} 
                onValueChange={v => setForm({...form, allowComments: v})} 
                trackColor={{ false: '#334155', true: COLORS.violet }}
                thumbColor={form.allowComments ? COLORS.accent : '#94a3b8'}
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
  label: { color: 'rgba(255,255,255,0.3)', fontSize: 9, fontWeight: '900', marginBottom: 12, letterSpacing: 1.5 },
  input: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 18, padding: 18, color: COLORS.white, fontSize: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
  area: { height: 120, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  rowInputs: { marginBottom: 20 },
  chipsRow: { flexDirection: 'row', marginBottom: 5 },
  chip: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, marginRight: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  chipActive: { backgroundColor: COLORS.violet, borderColor: COLORS.accent },
  chipText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  chipTextActive: { color: COLORS.white },
  regBtn: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', paddingVertical: 14, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  regBtnActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  regText: { color: COLORS.muted, fontSize: 9, fontWeight: '900' },
  regTextActive: { color: COLORS.ink },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  switchLabel: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  switchSub: { color: COLORS.muted, fontSize: 10, marginTop: 2 },
  saveBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 25, alignItems: 'center', elevation: 15 },
  saveText: { color: COLORS.ink, fontWeight: '900', fontSize: 13, letterSpacing: 1.5 }
});
