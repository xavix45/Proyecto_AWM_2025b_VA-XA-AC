
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  Image, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Linking,
  Platform,
  StatusBar,
  TextInput,
  Modal,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview'; 
import axios from 'axios';
import { useAgenda } from '../context/AgendaContext.jsx';
import { useUser } from '../context/UserContext.jsx';
import { ENDPOINTS } from '../config/api.js';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  violet: '#8b5cf6', 
  ink: '#020617',    
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  success: '#10b981',
  error: '#ef4444',
  card: '#1e293b'
};

export default function Detalles({ route, navigation }) {
  const { evento: initialEvento } = route.params;
  const { user } = useUser();
  const { agregarEvento, quitarEvento, estaEnAgenda } = useAgenda();
  
  const [evento, setEvento] = useState(initialEvento);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

  const favorito = estaEnAgenda(evento.id);

  const fetchEventoData = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.eventos}/${evento.id}`);
      setEvento(res.data);
    } catch (e) {
      console.error("Error al refrescar evento:", e);
    }
  };

  useEffect(() => {
    fetchEventoData();
  }, []);

  const comentarios = evento.comentarios || [];

  const fechas = useMemo(() => {
    if (!evento?.fecha) return "Fecha no definida";
    if (evento.fecha_fin && evento.fecha_fin !== evento.fecha) {
      return `${evento.fecha} – ${evento.fecha_fin}`;
    }
    return evento.fecha;
  }, [evento]);

  const handleVerMapa = () => {
    const latLng = `${evento.lat},${evento.lng}`;
    const url = Platform.OS === 'ios' 
      ? `maps:0,0?q=${evento.name}@${latLng}` 
      : `geo:${latLng}?q=${latLng}(${evento.name})`;
    Linking.openURL(url);
  };

  const handleSubmitOpinion = async () => {
    if (!comentario.trim() || rating === 0) {
      setModal({ show: true, title: '⚠️ Faltan datos', message: 'Selecciona una calificación y escribe tu experiencia.', type: 'warning' });
      return;
    }

    setLoadingAction(true);
    const nuevaResena = {
      id: Date.now(),
      usuario: user?.nombre || "Explorador",
      rating: rating,
      comentario: comentario,
      fecha: new Date().toISOString().split('T')[0]
    };

    try {
      const nuevosComentarios = [nuevaResena, ...comentarios];
      await axios.patch(`${ENDPOINTS.eventos}/${evento.id}`, {
        comentarios: nuevosComentarios
      });

      setEvento({ ...evento, comentarios: nuevosComentarios });
      setModal({ show: true, title: '🚀 ¡Opinión Guardada!', message: 'Tu reseña se ha sincronizado con el mapa cultural.', type: 'success' });
      setComentario("");
      setRating(0);
    } catch (e) {
      setModal({ show: true, title: '❌ Error', message: 'No pudimos guardar tu reseña en el servidor.', type: 'error' });
    } finally {
      setLoadingAction(false);
    }
  };

  const RatingSummary = () => {
    const total = comentarios.length;
    const avg = total > 0 
      ? (comentarios.reduce((acc, c) => acc + c.rating, 0) / total).toFixed(1)
      : "0.0";
    
    return (
      <View style={styles.ratingSummary}>
        <View style={styles.ratingLeft}>
          <Text style={styles.avgNum}>{avg}</Text>
          <View style={styles.miniStars}>
            <Text style={{color: COLORS.accent, fontSize: 14}}>
              {'★'.repeat(Math.round(parseFloat(avg)))}{'☆'.repeat(5 - Math.round(parseFloat(avg)))}
            </Text>
          </View>
          <Text style={styles.totalReviews}>{total} opiniones reales</Text>
        </View>
        <View style={styles.ratingRight}>
          {[5, 4, 3, 2, 1].map(num => {
            const count = comentarios.filter(c => c.rating === num).length;
            const progress = total > 0 ? (count / total) * 100 : 0;
            return (
              <View key={num} style={styles.barRow}>
                <Text style={styles.barNum}>{num}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${progress}%` }]} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const zoomFactor = 0.0012;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${evento.lng-zoomFactor}%2C${evento.lat-zoomFactor}%2C${evento.lng+zoomFactor}%2C${evento.lat+zoomFactor}&layer=mapnik&marker=${evento.lat}%2C${evento.lng}`;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[0]}>
        {/* BARRA SUPERIOR SLIM CON MARGENES DE SEGURIDAD */}
        <View style={styles.topNav}>
           <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.backBtnText}>← Volver</Text>
           </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <Image source={{ uri: evento.imagen }} style={styles.heroImg} />
          <View style={styles.heroGradient} />
          <View style={styles.heroContent}>
            <View style={styles.badgeRow}>
              <View style={styles.catBadge}><Text style={styles.catText}>{evento.categoria?.toUpperCase()}</Text></View>
              <View style={styles.regionBadge}><Text style={styles.regionText}>🇪🇨 {evento.region}</Text></View>
            </View>
            <Text style={styles.mainTitle}>{evento.name}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.quickInfoCard}>
             <View style={styles.qItem}>
                <Text style={styles.qIcon}>📅</Text>
                <Text style={styles.qLabel}>FECHA</Text>
                <Text style={styles.qVal}>{fechas}</Text>
             </View>
             <View style={styles.qDivider} />
             <View style={styles.qItem}>
                <Text style={styles.qIcon}>📍</Text>
                <Text style={styles.qLabel}>CIUDAD</Text>
                <Text style={styles.qVal}>{evento.ciudad}</Text>
             </View>
             <View style={styles.qDivider} />
             <View style={styles.qItem}>
                <Text style={styles.qIcon}>🎟️</Text>
                <Text style={styles.qLabel}>COSTO</Text>
                <Text style={styles.qVal}>{evento.precio || 'Gratis'}</Text>
             </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DETALLES DE LA TRADICIÓN</Text>
            <Text style={styles.description}>
              {evento.descripcion_larga || evento.descripcion}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>EXPERIENCIA COMUNITARIA</Text>
                <View style={styles.verifiedBadge}>
                   <Text style={styles.verifiedText}>✓ PERSISTENTE</Text>
                </View>
            </View>
            
            <RatingSummary />

            {comentarios.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyReviewsText}>Nadie ha calificado esta experiencia aún. ¡Cuéntanos la tuya!</Text>
              </View>
            ) : (
              comentarios.map((c) => (
                <View key={c.id} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarMiniText}>{c.usuario.substring(0,1).toUpperCase()}</Text>
                    </View>
                    <View style={{flex: 1}}>
                      <Text style={styles.reviewUser}>{c.usuario}</Text>
                      <View style={styles.starsMiniRow}>
                         {[1,2,3,4,5].map(s => (
                           <Text key={s} style={[styles.miniStar, { color: s <= c.rating ? COLORS.accent : 'rgba(255,255,255,0.1)' }]}>★</Text>
                         ))}
                         <Text style={styles.reviewDate}>{c.fecha}</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.reviewText}>{c.comentario}</Text>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
             <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>CÓMO LLEGAR</Text>
                <TouchableOpacity onPress={handleVerMapa}>
                   <Text style={styles.linkText}>Abrir en GPS →</Text>
                </TouchableOpacity>
             </View>
             <View style={styles.mapContainer}>
                <WebView source={{ uri: mapUrl }} style={styles.mapWeb} scrollEnabled={false} />
                <View style={styles.mapOverlay} pointerEvents="none" />
             </View>
          </View>

          <View style={styles.experienceCard}>
            <View style={styles.experienceHeader}>
               <Text style={styles.expEmoji}>✍️</Text>
               <View>
                  <Text style={styles.expTitle}>¿Estuviste allí?</Text>
                  <Text style={styles.expSub}>Tu reseña se guardará para siempre en la comunidad</Text>
               </View>
            </View>
            
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starTouch}>
                  <Text style={[styles.star, n <= rating && styles.starActive]}>
                    {n <= rating ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.commentInput}
              placeholder="¿Qué fue lo mejor de este evento?..."
              placeholderTextColor={COLORS.muted}
              multiline
              maxLength={150}
              value={comentario}
              onChangeText={setComentario}
            />
            
            <TouchableOpacity 
              style={[styles.submitBtn, loadingAction && {opacity: 0.6}]} 
              onPress={handleSubmitOpinion}
              disabled={loadingAction}
            >
              {loadingAction ? <ActivityIndicator color="white" /> : <Text style={styles.submitBtnText}>PUBLICAR MI RESEÑA</Text>}
            </TouchableOpacity>
          </View>

          <View style={{height: 140}} />
        </View>
      </ScrollView>

      <View style={styles.fixedFooter}>
        <TouchableOpacity 
          style={[styles.mainFab, favorito ? styles.fabRemove : styles.fabAdd]}
          onPress={() => favorito ? quitarEvento(evento.id) : agregarEvento(evento)}
        >
          <Text style={[styles.fabText, {color: favorito ? 'white' : COLORS.ink}]}>
            {favorito ? 'REMOVER DE MI AGENDA' : 'GUARDAR EN MI AGENDA ✨'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent={true} visible={modal.show}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalMsg}>{modal.message}</Text>
            <TouchableOpacity 
              style={[styles.modalBtn, {backgroundColor: modal.type === 'success' ? COLORS.success : COLORS.accent}]} 
              onPress={() => setModal({...modal, show: false})}
            >
              <Text style={styles.modalBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  // MEJORA: PADDING HORIZONTAL Y MARGEN SUPERIOR PARA EVITAR BORDES FÍSICOS
  topNav: { 
    height: 70, 
    paddingHorizontal: 28, 
    justifyContent: 'center', 
    backgroundColor: 'rgba(15,23,42,0.85)', 
    zIndex: 100,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingTop: 5 // Un pequeño ajuste hacia abajo
  },
  backBtn: { 
    backgroundColor: 'rgba(255,255,255,0.1)', 
    paddingHorizontal: 15, 
    paddingVertical: 8, 
    borderRadius: 12, 
    alignSelf: 'flex-start', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.2)',
    marginTop: 5 // Alejado del borde superior real
  },
  backBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  hero: { height: 450, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.35)' },
  heroContent: { position: 'absolute', bottom: 40, left: 25, right: 25 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  catBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  catText: { color: COLORS.ink, fontWeight: '900', fontSize: 10 },
  regionBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  regionText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  mainTitle: { fontSize: 36, fontWeight: '900', color: 'white', lineHeight: 42, letterSpacing: -1 },
  body: { paddingHorizontal: 25, marginTop: -40, backgroundColor: COLORS.ink, borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingTop: 30 },
  quickInfoCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 22, borderRadius: 30, marginBottom: 35, borderWidth: 1, borderColor: COLORS.glassBorder, elevation: 10 },
  qItem: { flex: 1, alignItems: 'center' },
  qIcon: { fontSize: 22, marginBottom: 8 },
  qLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  qVal: { color: 'white', fontSize: 11, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  qDivider: { width: 1, height: '70%', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'center' },
  section: { marginBottom: 35 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.accent, letterSpacing: 2 },
  verifiedBadge: { backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  verifiedText: { color: COLORS.success, fontSize: 8, fontWeight: '900' },
  linkText: { color: COLORS.muted, fontSize: 10, fontWeight: 'bold' },
  description: { color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 26 },
  ratingSummary: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', padding: 25, borderRadius: 25, marginBottom: 20, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  ratingLeft: { alignItems: 'center', marginRight: 25 },
  avgNum: { color: 'white', fontSize: 46, fontWeight: '900' },
  miniStars: { marginVertical: 4 },
  totalReviews: { color: COLORS.muted, fontSize: 9, fontWeight: 'bold' },
  ratingRight: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barNum: { color: COLORS.muted, fontSize: 9, fontWeight: 'bold', width: 10 },
  barTrack: { flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 3 },
  emptyReviews: { padding: 30, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 20, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  emptyReviewsText: { color: COLORS.muted, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 20, borderRadius: 22, marginBottom: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarMini: { width: 36, height: 36, borderRadius: 12, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  avatarMiniText: { color: 'white', fontWeight: '900', fontSize: 16 },
  reviewUser: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  starsMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  miniStar: { fontSize: 9 },
  reviewDate: { color: COLORS.muted, fontSize: 9, marginLeft: 8 },
  reviewText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 20 },
  mapContainer: { height: 220, borderRadius: 30, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder },
  mapWeb: { flex: 1 },
  mapOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'transparent' },
  experienceCard: { backgroundColor: 'rgba(139, 92, 246, 0.05)', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  experienceHeader: { flexDirection: 'row', gap: 15, alignItems: 'center', marginBottom: 20 },
  expEmoji: { fontSize: 28 },
  expTitle: { color: 'white', fontSize: 16, fontWeight: '900' },
  expSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 25, gap: 8 },
  starTouch: { padding: 5 },
  star: { fontSize: 40, color: 'rgba(255,255,255,0.1)' },
  starActive: { color: COLORS.accent },
  commentInput: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 20, padding: 20, color: 'white', height: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', fontSize: 14 },
  submitBtn: { backgroundColor: COLORS.violet, marginTop: 20, padding: 18, borderRadius: 20, alignItems: 'center', elevation: 5 },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  fixedFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25, backgroundColor: 'transparent' },
  mainFab: { padding: 22, borderRadius: 25, alignItems: 'center', elevation: 15, shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10 },
  fabAdd: { backgroundColor: COLORS.accent },
  fabRemove: { backgroundColor: COLORS.error },
  fabText: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.96)', justifyContent: 'center', padding: 40 },
  modalBox: { backgroundColor: COLORS.card, borderRadius: 35, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 15 },
  modalMsg: { color: COLORS.muted, textAlign: 'center', lineHeight: 24, marginBottom: 30, fontSize: 14 },
  modalBtn: { width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  modalBtnText: { color: COLORS.ink, fontWeight: 'bold', fontSize: 12 }
});
