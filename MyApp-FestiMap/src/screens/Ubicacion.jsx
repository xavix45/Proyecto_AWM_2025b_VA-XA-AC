import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  Alert
} from 'react-native';
import { useUser } from '../context/UserContext.jsx';
import axios from 'axios';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)',
  muted: 'rgba(255,255,255,0.4)',
  success: '#10b981',
  error: '#ef4444',
  card: '#1e293b'
};

const PROVINCIAS = [
  { id: '1', name: 'Pichincha', icon: '🏔️' },
  { id: '2', name: 'Guayas', icon: '🌊' },
  { id: '3', name: 'Azuay', icon: '🏛️' },
  { id: '4', name: 'Tungurahua', icon: '🌋' },
  { id: '5', name: 'Imbabura', icon: '🛶' },
  { id: '6', name: 'Manabí', icon: '🏖️' },
  { id: '7', name: 'Loja', icon: '🎻' },
  { id: '8', name: 'Galápagos', icon: '🐢' },
];

export default function Ubicacion({ navigation, route }) {
  const { updatePreferences, syncUserWithServer } = useUser();
  const [loadingGPS, setLoadingGPS] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info', action: null });
  
  const isEditing = route.params?.fromProfile || false;

  const handleManualSelect = (prov) => {
    updatePreferences({ provincia: prov });
    if (isEditing) {
      setModal({
        show: true,
        title: '✅ Ubicación Actualizada',
        message: `Ahora verás eventos cercanos a ${prov}.`,
        type: 'success',
        action: () => navigation.goBack()
      });
    } else {
      navigation.navigate('Intereses');
    }
  };

  const rescueIP = async () => {
    try {
      const res = await axios.get('http://ip-api.com/json/'); 
      if (res.data && res.data.regionName) {
        updatePreferences({ 
          provincia: res.data.regionName, 
          coords: { lat: res.data.lat, lng: res.data.lon } 
        });
        setModal({
          show: true,
          title: '🌐 Ubicación por Red (B)',
          message: `Te localizamos en ${res.data.regionName}. Brújula ajustada.`,
          type: 'success',
          action: () => isEditing ? navigation.goBack() : navigation.navigate('Intereses')
        });
      } else {
        throw new Error("Fallo total");
      }
    } catch (e) {
      setModal({ show: true, title: '⚠️ Sin Acceso', message: 'No pudimos determinar tu ubicación automáticamente. Por favor elige una provincia manualmente.', type: 'error' });
    } finally {
      setLoadingGPS(false);
    }
  };

  const ubicarPorIP = async () => {
    try {
      const res = await axios.get('https://ipapi.co/json/');
      const { region, latitude, longitude } = res.data;
      updatePreferences({ provincia: region || "Pichincha", coords: { lat: latitude, lng: longitude } });
      setModal({
        show: true,
        title: '🌐 Ubicación por Red',
        message: `Te detectamos cerca de ${region}. Hemos ajustado tu brújula festiva.`,
        type: 'success',
        action: () => isEditing ? navigation.goBack() : navigation.navigate('Intereses')
      });
    } catch (e) {
      rescueIP(); 
    } finally {
      setLoadingGPS(false);
    }
  };

  const manejarGPS = () => {
    setLoadingGPS(true);
    
    // Verificación robusta: Si el objeto global no existe, saltamos directo a IP sin alertar "No soportado"
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      ubicarPorIP();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const prov = res.data.address.state || res.data.address.region || "Pichincha";
          const provLimpia = prov.replace("Provincia de ", "");
          
          updatePreferences({ provincia: provLimpia, coords: { lat: latitude, lng: longitude } });
          
          setLoadingGPS(false);
          setModal({ 
            show: true, 
            title: '📍 GPS Detectado', 
            message: `Bienvenido a ${provLimpia}. Hemos ajustado el mapa de forma nativa.`, 
            type: 'success', 
            action: () => isEditing ? navigation.goBack() : navigation.navigate('Intereses') 
          });
        } catch (e) { 
          ubicarPorIP(); 
        }
      },
      (error) => {
        // Si el usuario niega el permiso o hay error de sensor, usamos IP como respaldo
        console.log("Error de ubicación:", error);
        ubicarPorIP();
      },
      { 
        enableHighAccuracy: true, // Esto es lo que dispara el diálogo de "Alta precisión" en Android
        timeout: 15000, 
        maximumAge: 10000 
      }
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        {isEditing && (
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={{color: 'white', fontSize: 18}}>✕</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.preTitle}>{isEditing ? 'ACTUALIZAR ZONA' : 'PASO 1 DE 2'}</Text>
        <Text style={styles.title}>{isEditing ? 'Cambiar Base 📍' : '¿Dónde estás? 📍'}</Text>
        <Text style={styles.subtitle}>{isEditing ? 'Cambia tu ubicación base para recibir recomendaciones locales.' : 'Personalizaremos tu mapa festivo según tu ubicación actual.'}</Text>
      </View>

      <View style={styles.gpsContainer}>
        <TouchableOpacity style={[styles.gpsCard, loadingGPS && {opacity: 0.6}]} onPress={manejarGPS} disabled={loadingGPS}>
          {loadingGPS ? <ActivityIndicator color={COLORS.accent} /> : (
            <>
              <View style={styles.gpsIconCircle}><Text style={styles.gpsEmoji}>📡</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.gpsTitle}>USAR MI UBICACIÓN ACTUAL</Text>
                <Text style={styles.gpsSub}>Detección nativa inteligente</Text>
              </View>
              <Text style={styles.gpsArrow}>›</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.line} /><Text style={styles.dividerText}>O SELECCIONA MANUALMENTE</Text><View style={styles.line} />
      </View>

      <FlatList
        data={PROVINCIAS}
        numColumns={2}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => handleManualSelect(item.name)}>
            <View style={styles.iconBox}><Text style={styles.icon}>{item.icon}</Text></View>
            <Text style={styles.name}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <Modal animationType="fade" transparent visible={modal.show}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { borderColor: modal.type === 'error' ? COLORS.error : COLORS.success }]}>
            <Text style={styles.modalEmoji}>{modal.type === 'success' ? '✅' : '⚠️'}</Text>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalMessage}>{modal.message}</Text>
            <TouchableOpacity style={[styles.modalBtn, { backgroundColor: modal.type === 'error' ? COLORS.error : COLORS.success }]} onPress={() => { setModal({ ...modal, show: false }); if (modal.action) modal.action(); }}>
              <Text style={styles.modalBtnText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  header: { paddingHorizontal: 30, paddingTop: 50, marginBottom: 20 },
  backBtn: { alignSelf: 'flex-start', padding: 10, marginLeft: -10, marginBottom: 10 },
  preTitle: { fontSize: 10, fontWeight: '900', color: COLORS.accent, letterSpacing: 2, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.4)', marginTop: 10, lineHeight: 22 },
  gpsContainer: { paddingHorizontal: 30, marginBottom: 30 },
  gpsCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 184, 0, 0.05)', padding: 20, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255, 184, 0, 0.2)' },
  gpsIconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  gpsEmoji: { fontSize: 24 },
  gpsTitle: { color: 'white', fontWeight: '900', fontSize: 13 },
  gpsSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  gpsArrow: { color: COLORS.accent, fontSize: 24, fontWeight: 'bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 30, marginBottom: 20 },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
  dividerText: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 'bold', marginHorizontal: 15 },
  list: { paddingHorizontal: 20, paddingBottom: 40 },
  card: { flex: 1, backgroundColor: COLORS.glass, margin: 10, padding: 25, borderRadius: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.03)' },
  iconBox: { width: 60, height: 60, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  icon: { fontSize: 30 },
  name: { fontWeight: '800', color: COLORS.white, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.95)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: COLORS.card, padding: 30, borderRadius: 30, alignItems: 'center', borderWidth: 2 },
  modalEmoji: { fontSize: 40, marginBottom: 15 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 10 },
  modalMessage: { color: COLORS.muted, textAlign: 'center', fontSize: 14, marginBottom: 25 },
  modalBtn: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 15, width: '100%', alignItems: 'center' },
  modalBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12 }
});