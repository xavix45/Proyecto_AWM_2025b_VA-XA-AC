
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  ScrollView, 
  StatusBar, 
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
  Animated,
  Easing,
  Modal
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import axios from 'axios';
import { ENDPOINTS } from '../config/api';
import { useUser } from '../context/UserContext';
import { StatItem, RegionCard, FeatureItem, StepItem } from '../components/ui/LandingWidgets';

const { width, height } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  violet: '#5b21b6', 
  ink: '#0f172a',    
  white: '#ffffff',
  muted: 'rgba(255,255,255,0.5)',
  glass: 'rgba(255,255,255,0.06)',
  glassOro: 'rgba(255,184,0,0.15)',
  success: '#10b981'
};

export default function Landing({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useUser();
  const scrollRef = useRef(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0.8)).current;
  const floatingIcons = useRef(new Animated.Value(0)).current;
  const btnPulse = useRef(new Animated.Value(1)).current;
  const statsAnims = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoFloat, { toValue: -5, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(logoFloat, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(logoOpacity, { toValue: 1, duration: 2000, useNativeDriver: true }),
          Animated.timing(logoOpacity, { toValue: 0.8, duration: 2000, useNativeDriver: true })
        ])
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatingIcons, { toValue: -15, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatingIcons, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true })
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(btnPulse, { toValue: 1.04, duration: 1200, useNativeDriver: true }),
        Animated.timing(btnPulse, { toValue: 1, duration: 1200, useNativeDriver: true })
      ])
    ).start();

    Animated.stagger(200, statsAnims.map(anim => 
      Animated.spring(anim, { toValue: 1, friction: 5, useNativeDriver: true })
    )).start();

    axios.get(ENDPOINTS.eventos)
      .then(res => setEventos(res.data.slice(0, 4)))
      .catch(err => console.log('API Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleEventPress = (evento) => {
    if (!user) setModalVisible(true);
    else navigation.navigate('Detalles', { evento });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <Video
        source={require('../../assets/intro2.mp4')} 
        style={styles.videoBg}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={true}
        isMuted={true}
      />
      <View style={styles.overlay} />

      <ScrollView 
        ref={scrollRef}
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <SafeAreaView style={styles.heroSection}>
          <View style={styles.nav}>
            <Animated.View style={{ transform: [{ translateY: logoFloat }], opacity: logoOpacity }}>
              <Text style={styles.logo}>Festi<Text style={{color: COLORS.accent}}>Map</Text></Text>
            </Animated.View>
            {!user && (
              <TouchableOpacity style={styles.btnNav} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.btnNavText}>INGRESAR</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.heroBody}>
            <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EL CORAZÓN DE LOS ANDES</Text>
              </View>
              <Text style={styles.heroTitle}>Siente la Fiesta,{'\n'}Vive la Tradición</Text>
              <Text style={styles.heroSub}>Descubre la magia de Ecuador a través de sus colores, danzas y sabores ancestrales.</Text>

              <Animated.View style={{ transform: [{ scale: btnPulse }], width: '100%', alignItems: 'center' }}>
                <TouchableOpacity style={styles.mainBtn} onPress={() => navigation.navigate(user ? 'Main' : 'Registro')}>
                  <Text style={styles.mainBtnText}>{user ? 'CONTINUAR EXPLORANDO 🗺️' : 'EMPEZAR AVENTURA GRATIS 🚀'}</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity 
                style={styles.secondaryBtn} 
                onPress={() => scrollRef.current?.scrollTo({y: height * 0.92, animated: true})}
              >
                <Text style={styles.secondaryBtnText}>¿CÓMO FUNCIONA? ↓</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>

          <View style={styles.statsBar}>
            <StatItem val="500+" label="FIESTAS" anim={statsAnims[0]} emoji="🎉" floatAnim={floatingIcons} />
            <View style={styles.statDivider} />
            <StatItem val="24" label="PROVINCIAS" anim={statsAnims[1]} emoji="📍" floatAnim={floatingIcons} />
            <View style={styles.statDivider} />
            <StatItem val="2k+" label="VIAJEROS" anim={statsAnims[2]} emoji="👤" floatAnim={floatingIcons} />
          </View>
        </SafeAreaView>

        <View style={styles.regionSection}>
          <Text style={styles.infoPre}>DESCUBRE TU DESTINO</Text>
          <Text style={styles.infoTitle}>Explora las 4 Regiones</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.regionScroll}>
            <RegionCard name="Sierra" emoji="🏔️" color="#6366f1" desc="Volcanes y Tradición" />
            <RegionCard name="Costa" emoji="🌊" color="#0ea5e9" desc="Sol y Gastronomía" />
            <RegionCard name="Amazonía" emoji="🌿" color="#10b981" desc="Selva y Ancestralidad" />
            <RegionCard name="Galápagos" emoji="🐢" color="#f59e0b" desc="Naturaleza Pura" />
          </ScrollView>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoPre}>TECNOLOGÍA Y CULTURA</Text>
          <Text style={styles.infoTitle}>Todo en una App</Text>
          <View style={styles.featureGrid}>
            <View style={styles.featureRow}>
               <FeatureItem emoji="🗺️" title="Rutas GPS" desc="No te pierdas ningún desfile." color="#5b21b6" />
               <FeatureItem emoji="🍱" title="Comida" desc="Lo mejor de cada feria." color="#ffb800" />
            </View>
            <View style={styles.featureRow}>
               <FeatureItem emoji="🎭" title="Historia" desc="Significado de cada baile." color="#10b981" />
               <FeatureItem emoji="📅" title="Agenda" desc="Guarda tus favoritos." color="#ef4444" />
            </View>
          </View>
        </View>

        <View style={styles.stepsSection}>
           <Text style={styles.infoPre}>¿CÓMO FUNCIONA?</Text>
           <Text style={styles.infoTitle}>Tu Viaje en 3 Pasos</Text>
           <View style={styles.stepsContainer}>
              <StepItem num="1" title="Crea tu Perfil" desc="Cuéntanos qué te apasiona." />
              <StepItem num="2" title="Elige Provincia" desc="Filtra eventos cerca de ti." />
              <StepItem num="3" title="¡A Disfrutar!" desc="Recibe alertas de inicio." />
           </View>
        </View>

        <View style={styles.eventsSection}>
          <View style={styles.eventsHeader}>
            <Text style={styles.eventsTitle}>Fiestas de Hoy 🎊</Text>
            <TouchableOpacity onPress={() => navigation.navigate(user ? 'Main' : 'Login')}>
              <Text style={styles.seeAll}>VER TODAS →</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color={COLORS.accent} size="large" style={{marginVertical: 40}} />
          ) : (
            <View style={styles.gridEvents}>
              {eventos.map((ev) => (
                <TouchableOpacity key={ev._id || ev.id} style={styles.eventCard} onPress={() => handleEventPress(ev)}>
                  <Image source={{ uri: ev.imagen }} style={styles.cardImg} />
                  <View style={styles.cardOverlay}>
                    <View style={styles.provBadge}><Text style={styles.provText}>{ev.provincia}</Text></View>
                    <Text style={styles.eventName}>{ev.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLogo}>FestiMap Ecuador</Text>
          <View style={styles.footerLine} />
          <Text style={styles.footerCopyright}>TU GUÍA DEFINITIVA • 2025</Text>
        </View>

      </ScrollView>

      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Experiencia Completa</Text>
            <Text style={styles.modalText}>Regístrate para ver el mapa interactivo y guardar festividades en tu agenda personal.</Text>
            <TouchableOpacity style={styles.modalBtnPrimary} onPress={() => {setModalVisible(false); navigation.navigate('Registro');}}>
              <Text style={styles.modalBtnTextPrimary}>UNIRSE AHORA 🚀</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{padding: 10}} onPress={() => setModalVisible(false)}>
              <Text style={{color: COLORS.muted, fontSize: 12}}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  videoBg: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.7)' },
  scrollContent: { flexGrow: 1 },
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, paddingTop: Platform.OS === 'android' ? 50 : 20, marginBottom: 20 },
  logo: { fontSize: 28, fontWeight: '900', color: COLORS.white, letterSpacing: -1.5 },
  btnNav: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  btnNavText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  heroSection: { minHeight: height * 0.95, justifyContent: 'space-between' },
  heroBody: { paddingHorizontal: 30, alignItems: 'center' },
  badge: { backgroundColor: COLORS.glassOro, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: COLORS.accent, marginTop: 10, marginBottom: 15 },
  badgeText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  heroTitle: { color: COLORS.white, fontSize: 44, fontWeight: '900', textAlign: 'center', lineHeight: 52 },
  heroSub: { color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 15, fontSize: 16, lineHeight: 24 },
  mainBtn: { backgroundColor: COLORS.accent, paddingVertical: 20, borderRadius: 20, alignItems: 'center', width: width * 0.85, marginTop: 35, elevation: 20 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 14 },
  secondaryBtn: { marginTop: 25, padding: 15 },
  secondaryBtnText: { color: COLORS.white, fontSize: 11, fontWeight: 'bold', opacity: 0.5, letterSpacing: 1 },
  statsBar: { flexDirection: 'row', backgroundColor: 'rgba(15,23,42,0.9)', marginHorizontal: 20, marginBottom: 30, borderRadius: 30, padding: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statDivider: { width: 1, height: '60%', backgroundColor: 'rgba(255,255,255,0.1)', alignSelf: 'center' },
  regionSection: { paddingVertical: 40 },
  regionScroll: { paddingLeft: 25, gap: 15 },
  infoSection: { padding: 25, backgroundColor: COLORS.ink },
  infoPre: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  infoTitle: { color: COLORS.white, fontSize: 32, fontWeight: '900', textAlign: 'center', marginTop: 10, marginBottom: 30 },
  featureGrid: { gap: 15 },
  featureRow: { flexDirection: 'row', gap: 15 },
  stepsSection: { padding: 30, backgroundColor: COLORS.ink },
  stepsContainer: { gap: 20, marginTop: 20 },
  eventsSection: { padding: 25, backgroundColor: COLORS.ink },
  eventsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  eventsTitle: { color: COLORS.white, fontSize: 24, fontWeight: '900' },
  seeAll: { color: COLORS.accent, fontWeight: 'bold', fontSize: 12 },
  gridEvents: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  eventCard: { width: '48%', height: 240, borderRadius: 25, overflow: 'hidden', marginBottom: 15 },
  cardImg: { ...StyleSheet.absoluteFillObject },
  cardOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: 15 },
  provBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,184,0,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.accent },
  provText: { color: COLORS.accent, fontSize: 9, fontWeight: 'bold' },
  eventName: { color: 'white', fontWeight: 'bold', fontSize: 14 },
  footer: { padding: 60, alignItems: 'center', backgroundColor: '#000' },
  footerLogo: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
  footerLine: { width: 40, height: 2, backgroundColor: COLORS.accent, marginVertical: 20 },
  footerCopyright: { color: 'rgba(255,255,255,0.2)', fontSize: 9, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.95)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: COLORS.ink, borderRadius: 30, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: COLORS.accent },
  modalTitle: { color: COLORS.white, fontSize: 24, fontWeight: '900', marginBottom: 10 },
  modalText: { color: COLORS.muted, textAlign: 'center', marginBottom: 25, lineHeight: 20 },
  modalBtnPrimary: { backgroundColor: COLORS.accent, width: '100%', padding: 18, borderRadius: 15, alignItems: 'center' },
  modalBtnTextPrimary: { color: COLORS.ink, fontWeight: 'bold' }
});
