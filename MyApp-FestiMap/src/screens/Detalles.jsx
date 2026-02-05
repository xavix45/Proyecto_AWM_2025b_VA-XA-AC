
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ActivityIndicator,
  Animated
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
  const { user, token } = useUser();
  const { agregarEvento, quitarEvento, estaEnAgenda } = useAgenda();
  
  const [evento, setEvento] = useState(initialEvento);
  const [rating, setRating] = useState(0);
  const [comentario, setComentario] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  const eventId = evento._id || evento.id;
  const favorito = estaEnAgenda(eventId);

  const fetchEventoData = async () => {
    try {
      const res = await axios.get(`${ENDPOINTS.eventos}/${eventId}`);
      setEvento(res.data);
    } catch (e) {
      console.error("Error al refrescar evento:", e);
    }
  };

  useEffect(() => {
    fetchEventoData();
    // Animación de pulso para el botón de check-in
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true })
      ])
    ).start();
  }, []);

  const handleCheckIn = async () => {
    if (checkedIn) return;
    
    if (!user || !token) {
      setModal({ 
        show: true, 
        title: '🔐 Inicia Sesión', 
        message: 'Debes estar registrado para marcar tu asistencia.', 
        type: 'error' 
      });
      return;
    }

    setLoadingAction(true);
    try {
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      // Obtener datos actuales del evento
      const currentEvento = await axios.get(`${ENDPOINTS.eventos}/${eventId}`);
      const asistenciasActuales = currentEvento.data.asistencias || 0;
      const asistentesActuales = currentEvento.data.asistentes || [];

      // Verificar si ya hizo check-in
      const yaRegistrado = asistentesActuales.some(
        a => a.userId === (user.id || user._id)
      );

      if (yaRegistrado) {
        setModal({ 
          show: true, 
          title: '⚠️ Ya Registrado', 
          message: 'Ya registraste tu asistencia a este evento anteriormente.', 
          type: 'error' 
        });
        setCheckedIn(true);
        setLoadingAction(false);
        return;
      }

      // Crear nuevo registro de asistente
      const nuevoAsistente = {
        userId: user.id || user._id,
        userName: user.name || user.email,
        timestamp: new Date().toISOString()
      };

      // Actualizar evento con nueva asistencia
      await axios.put(`${ENDPOINTS.eventos}/${eventId}`, {
        ...currentEvento.data,
        asistencias: asistenciasActuales + 1,
        asistentes: [...asistentesActuales, nuevoAsistente]
      }, config);

      setCheckedIn(true);
      setModal({ 
        show: true, 
        title: '🎊 ¡Asistencia Registrada!', 
        message: 'Gracias por fortalecer la cultura. Tu visita ahora es parte de las estadísticas oficiales.', 
        type: 'success' 
      });
      
      // Refrescar datos del evento
      await fetchEventoData();
      
    } catch (e) {
      console.error("Error en check-in:", e.response?.data || e.message);
      setModal({ 
        show: true, 
        title: '❌ Ups', 
        message: e.response?.data?.message || 'No pudimos registrar tu check-in. Verifica tu conexión.', 
        type: 'error' 
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const comentarios = evento.comentarios || [];

  const fechas = useMemo(() => {
    if (!evento?.fecha) return "Fecha no definida";
    if (evento.fecha_fin && evento.fecha_fin !== evento.fecha) {
      return `${evento.fecha} – ${evento.fecha_fin}`;
    }
    return evento.fecha;
  }, [evento]);

  const handleSubmitOpinion = async () => {
    if (!comentario.trim() || rating === 0) {
      setModal({ 
        show: true, 
        title: '⚠️ Faltan datos', 
        message: 'Selecciona una calificación y escribe tu experiencia.', 
        type: 'warning' 
      });
      return;
    }

    if (!user) {
      setModal({ 
        show: true, 
        title: '🔐 Inicia Sesión', 
        message: 'Debes estar registrado para comentar.', 
        type: 'error' 
      });
      return;
    }

    setLoadingAction(true);
    try {
      const config = token ? {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      } : {};

      // Obtener datos actuales del evento
      const currentEvento = await axios.get(`${ENDPOINTS.eventos}/${eventId}`);
      const comentariosActuales = currentEvento.data.comentarios || [];

      // Crear nuevo comentario
      const nuevoComentario = {
        id: comentariosActuales.length + 1,
        usuario: user?.name || user?.nombre || user?.email || "Explorador",
        rating: rating,
        comentario: comentario.trim(),
        fecha: new Date().toISOString().split('T')[0]
      };

      // Actualizar evento con nuevo comentario
      await axios.put(`${ENDPOINTS.eventos}/${eventId}`, {
        ...currentEvento.data,
        comentarios: [...comentariosActuales, nuevoComentario]
      }, config);

      await fetchEventoData();
      
      setModal({ 
        show: true, 
        title: '🚀 ¡Opinión Guardada!', 
        message: 'Tu reseña se ha sincronizado con MongoDB.', 
        type: 'success' 
      });
      
      setComentario("");
      setRating(0);
      
    } catch (e) {
      console.error("Error al guardar comentario:", e.response?.data || e.message);
      setModal({ 
        show: true, 
        title: '❌ Error', 
        message: e.response?.data?.message || 'No pudimos guardar tu reseña.', 
        type: 'error' 
      });
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
      
      <ScrollView showsVerticalScrollIndicator={false}>
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
          <View style={styles.checkInRow}>
             <View style={{flex: 1}}>
                <Text style={styles.statsLabel}>ASISTENCIAS REALES</Text>
                <Text style={styles.statsVal}>{evento.asistencias || 0} Viajeros</Text>
             </View>
             <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <TouchableOpacity 
                  style={[styles.checkInBtn, checkedIn && { backgroundColor: COLORS.success }]} 
                  onPress={handleCheckIn}
                  disabled={checkedIn}
                >
                   <Text style={styles.checkInBtnText}>{checkedIn ? '✓ ASISTIDO' : '¡ESTUVE AQUÍ! 📍'}</Text>
                </TouchableOpacity>
             </Animated.View>
          </View>

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
            <Text style={styles.description}>{evento.descripcion}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCIA COMUNITARIA</Text>
            <RatingSummary />
            {comentarios.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyReviewsText}>Nadie ha calificado esta experiencia aún.</Text>
              </View>
            ) : (
              comentarios.map((c, idx) => (
                <View key={idx} style={styles.reviewCard}>
                  <View style={styles.reviewHeader}>
                    <View style={styles.avatarMini}><Text style={styles.avatarMiniText}>{c.usuario.substring(0,1).toUpperCase()}</Text></View>
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

          <View style={styles.experienceCard}>
            <Text style={styles.expTitle}>¿Qué te pareció? ✨</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity key={n} onPress={() => setRating(n)} style={styles.starTouch}>
                  <Text style={[styles.star, n <= rating && styles.starActive]}>{n <= rating ? '★' : '☆'}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Cuéntanos tu experiencia..."
              placeholderTextColor={COLORS.muted}
              multiline
              value={comentario}
              onChangeText={setComentario}
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitOpinion}>
              <Text style={styles.submitBtnText}>PUBLICAR RESEÑA</Text>
            </TouchableOpacity>
          </View>

          <View style={{height: 140}} />
        </View>
      </ScrollView>

      <View style={styles.fixedFooter}>
        <TouchableOpacity 
          style={[styles.mainFab, favorito ? styles.fabRemove : styles.fabAdd]}
          onPress={() => favorito ? quitarEvento(eventId) : agregarEvento(evento)}
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
  topNav: { height: 70, paddingHorizontal: 28, justifyContent: 'center', backgroundColor: 'rgba(15,23,42,0.85)', zIndex: 100 },
  backBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12, marginTop: 10 },
  backBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  hero: { height: 400, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.35)' },
  heroContent: { position: 'absolute', bottom: 40, left: 25, right: 25 },
  badgeRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
  catBadge: { backgroundColor: COLORS.accent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  catText: { color: COLORS.ink, fontWeight: '900', fontSize: 10 },
  regionBadge: { backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  regionText: { color: 'white', fontWeight: 'bold', fontSize: 10 },
  mainTitle: { fontSize: 32, fontWeight: '900', color: 'white' },
  body: { paddingHorizontal: 25, marginTop: -30, backgroundColor: COLORS.ink, borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 30 },
  checkInRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,184,0,0.05)', padding: 20, borderRadius: 25, marginBottom: 25, borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)' },
  statsLabel: { color: COLORS.accent, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  statsVal: { color: 'white', fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  checkInBtn: { backgroundColor: COLORS.accent, paddingHorizontal: 15, paddingVertical: 10, borderRadius: 15 },
  checkInBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 10 },
  quickInfoCard: { flexDirection: 'row', backgroundColor: COLORS.card, padding: 20, borderRadius: 25, marginBottom: 35, borderWidth: 1, borderColor: COLORS.glassBorder },
  qItem: { flex: 1, alignItems: 'center' },
  qIcon: { fontSize: 20, marginBottom: 5 },
  qLabel: { color: COLORS.muted, fontSize: 8, fontWeight: '900' },
  qVal: { color: 'white', fontSize: 10, fontWeight: 'bold', marginTop: 4, textAlign: 'center' },
  qDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.05)', alignSelf: 'center' },
  section: { marginBottom: 35 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: COLORS.accent, letterSpacing: 2, marginBottom: 15 },
  description: { color: 'rgba(255,255,255,0.65)', fontSize: 15, lineHeight: 24 },
  ratingSummary: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.02)', padding: 20, borderRadius: 20, marginBottom: 20, alignItems: 'center' },
  ratingLeft: { alignItems: 'center', marginRight: 20 },
  avgNum: { color: 'white', fontSize: 36, fontWeight: '900' },
  totalReviews: { color: COLORS.muted, fontSize: 9, fontWeight: 'bold' },
  ratingRight: { flex: 1, gap: 4 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barNum: { color: COLORS.muted, fontSize: 8, width: 10 },
  barTrack: { flex: 1, height: 4, backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 2 },
  barFill: { height: '100%', backgroundColor: COLORS.accent, borderRadius: 2 },
  emptyReviews: { padding: 20, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.01)', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  emptyReviewsText: { color: COLORS.muted, fontSize: 12 },
  reviewCard: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 20, marginBottom: 10 },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarMini: { width: 30, height: 30, borderRadius: 10, backgroundColor: COLORS.violet, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  avatarMiniText: { color: 'white', fontWeight: '900', fontSize: 14 },
  reviewUser: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  starsMiniRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  miniStar: { fontSize: 8 },
  reviewDate: { color: COLORS.muted, fontSize: 8, marginLeft: 5 },
  reviewText: { color: 'rgba(255,255,255,0.5)', fontSize: 12, lineHeight: 18 },
  experienceCard: { backgroundColor: 'rgba(139, 92, 246, 0.05)', padding: 25, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(139, 92, 246, 0.2)' },
  expTitle: { color: 'white', fontSize: 16, fontWeight: '900', marginBottom: 15 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20, gap: 5 },
  starTouch: { padding: 5 },
  star: { fontSize: 32, color: 'rgba(255,255,255,0.1)' },
  starActive: { color: COLORS.accent },
  commentInput: { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 15, padding: 15, color: 'white', height: 80, textAlignVertical: 'top' },
  submitBtn: { backgroundColor: COLORS.violet, marginTop: 15, padding: 15, borderRadius: 15, alignItems: 'center' },
  submitBtnText: { color: 'white', fontWeight: '900', fontSize: 11 },
  fixedFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 25 },
  mainFab: { padding: 20, borderRadius: 20, alignItems: 'center', elevation: 10 },
  fabAdd: { backgroundColor: COLORS.accent },
  fabRemove: { backgroundColor: COLORS.error },
  fabText: { fontWeight: '900', fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.96)', justifyContent: 'center', padding: 40 },
  modalBox: { backgroundColor: COLORS.card, borderRadius: 30, padding: 30, alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: '900', marginBottom: 10 },
  modalMsg: { color: COLORS.muted, textAlign: 'center', marginBottom: 25, fontSize: 14 },
  modalBtn: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  modalBtnText: { color: COLORS.ink, fontWeight: 'bold' }
});
