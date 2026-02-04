
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  SafeAreaView, 
  StatusBar, 
  Dimensions,
  Animated,
  Platform,
  Modal,
  ActivityIndicator,
  Alert
} from 'react-native';
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
  success: '#10b981',
  error: '#ef4444',
  card: '#1e293b'
};

const CATEGORIAS = [
  { id: '1', name: 'Ancestral', icon: '🗿', desc: 'Sabiduría y ritos antiguos' },
  { id: '2', name: 'Cultural', icon: '🎭', desc: 'Museos, teatros y arte' },
  { id: '3', name: 'Religiosa', icon: '🕯️', desc: 'Procesiones y fe viva' },
  { id: '4', name: 'Tradición', icon: '🎺', desc: 'Bailes y desfiles típicos' },
  { id: '5', name: 'Gastronomía', icon: '🍲', desc: 'Sabores de la tierra' },
  { id: '6', name: 'Música', icon: '🎸', desc: 'Conciertos y ritmos' },
  { id: '7', name: 'Naturaleza', icon: '🌿', desc: 'Aventuras al aire libre' },
  { id: '8', name: 'Vida Nocturna', icon: '✨', desc: 'Diversión y juerga' },
];

export default function Intereses({ navigation, route }) {
  const { user, preferences, updatePreferences, syncUserWithServer } = useUser();
  const [selected, setSelected] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const isEditing = route.params?.fromProfile || false;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    if (preferences.categorias && preferences.categorias.length > 0) {
      setSelected(preferences.categorias);
    }
  }, []);

  const toggleCategory = (name) => {
    if (selected.includes(name)) {
      setSelected(selected.filter(c => c !== name));
    } else {
      setSelected([...selected, name]);
    }
  };

  const handleFinish = async () => {
    if (selected.length < 3) return;

    setSyncing(true);
    const nuevasPreferencias = { ...preferences, categorias: selected };
    
    // Sincronizamos con el servidor pasando los datos directamente
    const exito = await syncUserWithServer(null, nuevasPreferencias);
    
    if (exito) {
      updatePreferences({ categorias: selected });
      setModalVisible(true);
    } else {
      Alert.alert(
        "Error de Conexión", 
        "No pudimos conectar con MongoDB. Verifica que tu servidor esté corriendo en el puerto 8000."
      );
    }
    setSyncing(false);
  };

  const handleModalConfirm = () => {
    setModalVisible(false);
    if (isEditing) {
      navigation.goBack();
    } else {
      navigation.replace('Main');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.header}>
          {isEditing && (
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={{color: 'white', fontSize: 18}}>✕</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.step}>{isEditing ? 'REFRESCAR FILTROS' : 'ÚLTIMO PASO'}</Text>
          <Text style={styles.title}>
            {isEditing ? 'Edita tus gustos' : `Define tu estilo,\n` }
            {!isEditing && <Text style={{color: COLORS.accent}}>{user?.nombre?.split(' ')[0] || 'Viajero'}</Text>}
          </Text>
          <Text style={styles.subtitle}>
            Selecciona al menos 3 categorías para que MongoDB personalice tu feed.
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.grid}>
            {CATEGORIAS.map((cat) => {
              const isSelected = selected.includes(cat.name);
              return (
                <TouchableOpacity 
                  key={cat.id}
                  activeOpacity={0.8}
                  style={[styles.card, isSelected && styles.cardActive]}
                  onPress={() => toggleCategory(cat.name)}
                >
                  <View style={[styles.iconCircle, isSelected && styles.iconCircleActive]}>
                    <Text style={styles.icon}>{cat.icon}</Text>
                  </View>
                  <Text style={[styles.catName, isSelected && styles.catNameActive]}>{cat.name}</Text>
                  <Text style={styles.catDesc} numberOfLines={2}>{cat.desc}</Text>
                  
                  {isSelected && (
                    <View style={styles.checkBadge}>
                       <Text style={styles.checkText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{height: 160}} />
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.progressContainer}>
           <Text style={styles.progressText}>{selected.length} SELECCIONADOS</Text>
           <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min((selected.length / 3) * 100, 100)}%` }]} />
           </View>
        </View>

        <TouchableOpacity 
          style={[styles.mainBtn, (selected.length < 3 || syncing) && styles.btnDisabled]} 
          onPress={handleFinish}
          disabled={selected.length < 3 || syncing}
        >
          {syncing ? <ActivityIndicator color={COLORS.ink} /> : (
            <Text style={[styles.mainBtnText, selected.length < 3 && {color: 'rgba(255,255,255,0.2)'}]}>
              {isEditing ? 'ACTUALIZAR EN MONGODB 💾' : (selected.length < 3 ? `FALTAN ${3 - selected.length}` : '¡EMPEZAR AVENTURA! 🚀')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal animationType="fade" transparent visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalEmoji}>🎉</Text>
            <Text style={styles.modalTitle}>¡Todo Listo!</Text>
            <Text style={styles.modalMessage}>
              Tus preferencias han sido sincronizadas en el servidor remoto con éxito.
            </Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handleModalConfirm}>
              <Text style={styles.modalBtnText}>{isEditing ? 'VOLVER AL PERFIL' : 'ENTRAR AL MAPA'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  content: { flex: 1 },
  header: { paddingHorizontal: 30, paddingTop: Platform.OS === 'android' ? 60 : 20, marginBottom: 25 },
  backBtn: { alignSelf: 'flex-start', padding: 10, marginLeft: -10, marginBottom: 10 },
  step: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
  title: { fontSize: 32, fontWeight: '900', color: COLORS.white, lineHeight: 38 },
  subtitle: { color: COLORS.muted, fontSize: 13, marginTop: 12, lineHeight: 20 },
  scroll: { paddingHorizontal: 20 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: (width - 60) / 2, backgroundColor: COLORS.glass, borderRadius: 35, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder, alignItems: 'center', position: 'relative' },
  cardActive: { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: COLORS.accent, elevation: 10, shadowColor: COLORS.accent, shadowOpacity: 0.2, shadowRadius: 10 },
  iconCircle: { width: 65, height: 65, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  iconCircleActive: { backgroundColor: 'rgba(255,184,0,0.1)' },
  icon: { fontSize: 30 },
  catName: { color: 'rgba(255,255,255,0.5)', fontWeight: '900', fontSize: 13, letterSpacing: 0.5 },
  catNameActive: { color: COLORS.white },
  catDesc: { color: 'rgba(255,255,255,0.2)', fontSize: 9, textAlign: 'center', marginTop: 8, fontWeight: '600' },
  checkBadge: { position: 'absolute', top: 15, right: 15, backgroundColor: COLORS.accent, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  checkText: { color: COLORS.ink, fontWeight: '900', fontSize: 12 },
  footer: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: COLORS.ink, padding: 30, borderTopWidth: 1, borderTopColor: COLORS.glassBorder },
  progressContainer: { marginBottom: 20 },
  progressText: { color: COLORS.muted, fontSize: 8, fontWeight: '900', marginBottom: 12, textAlign: 'center', letterSpacing: 2 },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: COLORS.accent },
  mainBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 25, alignItems: 'center', elevation: 15 },
  btnDisabled: { backgroundColor: 'rgba(255,255,255,0.05)', elevation: 0 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.98)', justifyContent: 'center', padding: 35 },
  modalContent: { backgroundColor: COLORS.card, padding: 35, borderRadius: 40, alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent },
  modalEmoji: { fontSize: 45, marginBottom: 20 },
  modalTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  modalMessage: { color: COLORS.muted, textAlign: 'center', fontSize: 14, lineHeight: 22, marginBottom: 30 },
  modalBtn: { backgroundColor: COLORS.accent, paddingVertical: 18, paddingHorizontal: 40, borderRadius: 18, width: '100%', alignItems: 'center' },
  modalBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12, letterSpacing: 1 }
});
