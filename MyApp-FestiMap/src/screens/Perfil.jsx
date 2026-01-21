
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView,
  Platform,
  StatusBar,
  Dimensions,
  Animated,
  Modal,
  TextInput,
  Image
} from 'react-native';
import { useUser } from '../context/UserContext.jsx';
import { useAgenda } from '../context/AgendaContext.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  violet: '#8b5cf6', 
  ink: '#020617',    
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.08)',
  muted: 'rgba(255,255,255,0.4)',
  error: '#ef4444',
  success: '#10b981',
  card: '#1e293b',
  inputBg: 'rgba(0,0,0,0.3)'
};

// LOGROS
const LOGROS_BASE = [
  { id: 1, title: "Primer Viaje", desc: "Agrega 1 evento", icon: "🥇", target: 1, color: '#ffb800' },
  { id: 2, title: "Ruta Volcanes", desc: "Agrega 3 eventos", icon: "🌋", target: 3, color: '#ef4444' },
  { id: 3, title: "Amazonía Fan", desc: "Agrega 5 eventos", icon: "🌿", target: 5, color: '#10b981' },
  { id: 4, title: "Maestro Festivo", desc: "Agrega 10 eventos", icon: "👑", target: 10, color: '#8b5cf6' },
];

export default function Perfil({ navigation }) {
  const { user, preferences, logout, login } = useUser(); // Usamos login para actualizar datos
  const { agenda } = useAgenda();
  
  // Estados UI
  const [modalAccount, setModalAccount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  
  // Estados Edición
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // Estado Modal Personalizado (Alert Replacement)
  const [customAlert, setCustomAlert] = useState({ show: false, title: '', msg: '', type: 'info', action: null });

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, useNativeDriver: true })
    ]).start();
  }, []);

  // Lógica: Historial vs Próximos (Filtrado de fechas)
  const historialViajes = useMemo(() => {
    const hoy = new Date().toISOString().slice(0, 10);
    return agenda.filter(ev => ev.fecha < hoy);
  }, [agenda]);

  const handleLogout = () => {
    setCustomAlert({
      show: true,
      title: "Cerrar Sesión",
      msg: "¿Estás seguro de que quieres salir de tu pasaporte digital?",
      type: 'warning',
      action: () => {
        logout();
        navigation.replace('Landing');
      }
    });
  };

  const toggleNotif = () => {
    const newState = !notifEnabled;
    setNotifEnabled(newState);
    setCustomAlert({
      show: true,
      title: newState ? "🔔 Activadas" : "🔕 Desactivadas",
      msg: newState ? "Te avisaremos de eventos cercanos a tu ubicación." : "Ya no recibirás alertas de eventos.",
      type: newState ? 'success' : 'info'
    });
  };

  const openAccountModal = () => {
    setTempName(user?.nombre || '');
    setTempEmail(user?.email || '');
    setIsEditing(false);
    setModalAccount(true);
  };

  const saveProfileChanges = () => {
    if (!tempName.trim() || !tempEmail.trim()) {
      setCustomAlert({ show: true, title: "⚠️ Error", msg: "El nombre y correo no pueden estar vacíos.", type: 'error' });
      return;
    }
    // Actualizamos el contexto (Simulación de API PUT)
    login({ ...user, nombre: tempName, email: tempEmail });
    setIsEditing(false);
    setCustomAlert({ show: true, title: "✅ Actualizado", msg: "Tus datos de viajero han sido guardados.", type: 'success' });
  };

  const esAdmin = user?.rol === 'admin' || user?.tipoViajero === 'administrador' || user?.email === 'admin@epn.edu.ec';

  // Componente Opción de Menú
  const ProfileOption = ({ icon, label, sublabel, onPress, isLast = false, color = COLORS.white }) => (
    <TouchableOpacity 
      style={[styles.optionItem, isLast && { borderBottomWidth: 0 }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.optionIconBox}>
        <Text style={styles.optionEmoji}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.optionLabel, { color }]}>{label}</Text>
        <Text style={styles.optionSub}>{sublabel}</Text>
      </View>
      <Text style={styles.optionArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* HEADER: EL PASAPORTE */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.profileMain}>
            <View style={styles.avatarFrame}>
               <View style={styles.avatarInner}>
                  <Text style={styles.avatarText}>
                    {user?.nombre ? user.nombre.substring(0, 1).toUpperCase() : 'V'}
                  </Text>
               </View>
               <View style={styles.statusDot} />
            </View>
            
            <View style={styles.userNameContainer}>
              <Text style={styles.userName}>{user?.nombre || 'Explorador'}</Text>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>
                  {agenda.length > 5 ? "EXPLORADOR ÉLITE" : "VIAJERO INICIAL"}
                </Text>
              </View>
            </View>
          </View>

          {/* KPI STATS */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{agenda.length}</Text>
              <Text style={styles.statDesc}>Eventos Agenda</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{preferences.categorias?.length || 0}</Text>
              <Text style={styles.statDesc}>Intereses Activos</Text>
            </View>
          </View>
        </Animated.View>

        {/* LOGROS CULTURALES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MIS LOGROS CULTURALES</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementsScroll}>
            {LOGROS_BASE.map(logro => {
              const unlocked = agenda.length >= logro.target;
              return (
                <View key={logro.id} style={[styles.achievement, !unlocked && styles.achievementLocked]}>
                   <View style={[styles.achIcon, {backgroundColor: unlocked ? logro.color + '20' : '#ffffff10', borderColor: unlocked ? logro.color : 'transparent'}]}>
                     <Text style={{fontSize: 20, opacity: unlocked ? 1 : 0.3}}>{logro.icon}</Text>
                   </View>
                   <Text style={[styles.achText, !unlocked && {color: COLORS.muted}]}>{logro.title}</Text>
                   {!unlocked && <Text style={styles.achLockIcon}>🔒</Text>}
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* HISTORIAL DE VIAJES (NUEVA SECCIÓN PEDAGÓGICA) */}
        {historialViajes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BITÁCORA DE VIAJES ({historialViajes.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
              {historialViajes.map((ev) => (
                <View key={ev.id} style={styles.historyCard}>
                  <Image source={{ uri: ev.imagen }} style={styles.historyImg} />
                  <View style={styles.historyOverlay}>
                    <Text style={styles.historyBadge}>VISITADO</Text>
                    <Text style={styles.historyTitle} numberOfLines={1}>{ev.name}</Text>
                    <Text style={styles.historyDate}>{ev.fecha}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* PREFERENCIAS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>PREFERENCIAS DE VIAJE</Text>
          
          <ProfileOption 
            icon="📍" 
            label="Ubicación Base" 
            sublabel={preferences.provincia || "No definida"} 
            onPress={() => navigation.navigate('Ubicacion', { fromProfile: true })}
          />
          
          <TouchableOpacity 
            style={styles.interestsBox}
            onPress={() => navigation.navigate('Intereses', { fromProfile: true })}
          >
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
               <View style={{flexDirection:'row', alignItems:'center'}}>
                  <View style={styles.optionIconBox}><Text style={styles.optionEmoji}>🎯</Text></View>
                  <Text style={styles.optionLabel}>Mis Intereses</Text>
               </View>
               <Text style={styles.editLink}>EDITAR</Text>
            </View>
            
            <View style={styles.chipsContainer}>
              {preferences.categorias && preferences.categorias.length > 0 ? (
                preferences.categorias.map((cat, i) => (
                  <View key={i} style={styles.chip}><Text style={styles.chipText}>{cat}</Text></View>
                ))
              ) : (
                <Text style={{color: COLORS.muted, fontSize: 12}}>Sin intereses seleccionados.</Text>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* PANEL ADMIN */}
        {esAdmin && (
          <TouchableOpacity 
            style={styles.adminCard} 
            onPress={() => navigation.navigate('AdminDashboard')}
            activeOpacity={0.9}
          >
            <View style={styles.adminGradient}>
              <View style={styles.adminHeader}>
                 <Text style={styles.adminEmoji}>🛡️</Text>
                 <View>
                    <Text style={styles.adminTitle}>MODO ADMINISTRADOR</Text>
                    <Text style={styles.adminSub}>Gestión avanzada de festividades</Text>
                 </View>
              </View>
              <Text style={styles.adminEnter}>ACCEDER →</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>SOPORTE Y CUENTA</Text>
          <ProfileOption 
            icon="👤" 
            label="Datos de Cuenta" 
            sublabel="Ver o editar información" 
            onPress={openAccountModal}
          />
          <ProfileOption 
            icon={notifEnabled ? "🔔" : "🔕"}
            label="Notificaciones" 
            sublabel={notifEnabled ? "Activadas (Simulación)" : "Desactivadas"}
            onPress={toggleNotif}
          />
          <ProfileOption 
            icon="🚪" 
            label="Cerrar Sesión" 
            sublabel="Salir de forma segura" 
            onPress={handleLogout}
            color={COLORS.error}
            isLast={true}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.version}>FESTIMAP ECUADOR v2.9.2</Text>
          <Text style={styles.copyright}>© 2025 PATRIMONIO DIGITAL VIVO</Text>
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* MODAL DE CUENTA (CON EDICIÓN) */}
      <Modal visible={modalAccount} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Editar Perfil' : 'Mi Pasaporte'}</Text>
                <TouchableOpacity onPress={() => setModalAccount(false)}><Text style={{fontSize:20, color:'white'}}>✕</Text></TouchableOpacity>
             </View>
             
             <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NOMBRE</Text>
                {isEditing ? (
                  <TextInput 
                    style={styles.modalInput} 
                    value={tempName} 
                    onChangeText={setTempName} 
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={styles.infoVal}>{user?.nombre}</Text>
                )}
             </View>
             
             <View style={styles.divider} />
             
             <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CORREO</Text>
                {isEditing ? (
                  <TextInput 
                    style={styles.modalInput} 
                    value={tempEmail} 
                    onChangeText={setTempEmail} 
                    keyboardType="email-address"
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={styles.infoVal}>{user?.email}</Text>
                )}
             </View>
             
             <View style={styles.divider} />
             
             <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TIPO DE VIAJERO</Text>
                <View style={styles.roleBadge}>
                   <Text style={styles.roleText}>{user?.tipoViajero?.toUpperCase() || 'TURISTA'}</Text>
                </View>
             </View>

             <View style={styles.modalActions}>
                {isEditing ? (
                  <TouchableOpacity style={[styles.modalBtn, {backgroundColor: COLORS.success}]} onPress={saveProfileChanges}>
                    <Text style={[styles.modalBtnText, {color: COLORS.ink}]}>GUARDAR CAMBIOS</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.modalBtn} onPress={() => setIsEditing(true)}>
                    <Text style={styles.modalBtnText}>EDITAR DATOS</Text>
                  </TouchableOpacity>
                )}
             </View>
          </View>
        </View>
      </Modal>

      {/* ALERT PERSONALIZADO */}
      <Modal visible={customAlert.show} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={[styles.alertContent, { borderColor: customAlert.type === 'error' ? COLORS.error : (customAlert.type === 'warning' ? COLORS.accent : COLORS.success) }]}>
             <Text style={{fontSize: 40, marginBottom: 15}}>
               {customAlert.type === 'success' ? '✅' : (customAlert.type === 'error' ? '❌' : (customAlert.type === 'warning' ? '⚠️' : 'ℹ️'))}
             </Text>
             <Text style={styles.alertTitle}>{customAlert.title}</Text>
             <Text style={styles.alertMsg}>{customAlert.msg}</Text>
             
             <View style={{flexDirection: 'row', gap: 10, marginTop: 20}}>
               {customAlert.type === 'warning' && (
                 <TouchableOpacity 
                   style={styles.alertBtnCancel} 
                   onPress={() => setCustomAlert({...customAlert, show: false})}
                 >
                   <Text style={styles.alertBtnText}>CANCELAR</Text>
                 </TouchableOpacity>
               )}
               <TouchableOpacity 
                 style={[styles.alertBtn, { flex: 1, backgroundColor: customAlert.type === 'error' ? COLORS.error : (customAlert.type === 'warning' ? COLORS.accent : COLORS.success) }]} 
                 onPress={() => {
                   setCustomAlert({...customAlert, show: false});
                   if (customAlert.action) customAlert.action();
                 }}
               >
                 <Text style={[styles.alertBtnText, {color: COLORS.ink}]}>
                   {customAlert.type === 'warning' ? 'CONFIRMA' : 'ENTENDIDO'}
                 </Text>
               </TouchableOpacity>
             </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  scroll: { flexGrow: 1 },
  header: { padding: 25, paddingTop: Platform.OS === 'ios' ? 20 : 60, marginBottom: 10 },
  profileMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 30 },
  avatarFrame: { position: 'relative' },
  avatarInner: { 
    width: 85, 
    height: 85, 
    borderRadius: 30, 
    backgroundColor: COLORS.violet, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.violet,
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  avatarText: { fontSize: 32, fontWeight: '900', color: COLORS.white },
  statusDot: { 
    position: 'absolute', 
    bottom: -2, 
    right: -2, 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    backgroundColor: COLORS.success, 
    borderWidth: 4, 
    borderColor: COLORS.ink 
  },
  userNameContainer: { marginLeft: 20 },
  userName: { fontSize: 24, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  rankBadge: { 
    backgroundColor: 'rgba(255,184,0,0.15)', 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: 8, 
    marginTop: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.3)',
    alignSelf: 'flex-start'
  },
  rankText: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statsGrid: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.glass, 
    borderRadius: 30, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.glassBorder 
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { color: COLORS.white, fontSize: 24, fontWeight: '900' },
  statDesc: { color: COLORS.muted, fontSize: 10, marginTop: 4, fontWeight: 'bold' },
  statDivider: { width: 1, height: '60%', backgroundColor: COLORS.glassBorder, alignSelf: 'center' },
  
  section: { marginVertical: 15 },
  sectionTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginLeft: 30, marginBottom: 15 },
  achievementsScroll: { paddingLeft: 30, gap: 15, paddingRight: 30 },
  achievement: { alignItems: 'center', width: 90 },
  achievementLocked: { opacity: 0.5 },
  achIcon: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  achText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold', textAlign: 'center', marginTop: 5 },
  achLockIcon: { position: 'absolute', top: 0, right: 10, fontSize: 12 },

  // HISTORIAL
  historyScroll: { paddingLeft: 30, gap: 15, paddingRight: 30 },
  historyCard: { width: 140, height: 180, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder },
  historyImg: { width: '100%', height: '100%', opacity: 0.6 },
  historyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', padding: 12, justifyContent: 'flex-end' },
  historyBadge: { color: COLORS.success, fontSize: 8, fontWeight: '900', marginBottom: 4, letterSpacing: 1 },
  historyTitle: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  historyDate: { color: COLORS.muted, fontSize: 10 },

  card: { backgroundColor: COLORS.glass, marginHorizontal: 25, borderRadius: 30, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardTitle: { color: COLORS.muted, fontSize: 10, fontWeight: '900', marginBottom: 20, letterSpacing: 1 },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  optionIconBox: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  optionEmoji: { fontSize: 18 },
  optionLabel: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  optionSub: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  optionArrow: { color: COLORS.muted, fontSize: 20, fontWeight: 'bold' },
  
  // INTERESTS BOX STYLES
  interestsBox: { marginTop: 10, paddingTop: 10 },
  editLink: { color: COLORS.accent, fontSize: 10, fontWeight: '900' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 5 },
  chip: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  chipText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  adminCard: { marginHorizontal: 25, marginBottom: 20, borderRadius: 30, overflow: 'hidden', elevation: 10 },
  adminGradient: { backgroundColor: COLORS.violet, padding: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminHeader: { flexDirection: 'row', alignItems: 'center' },
  adminEmoji: { fontSize: 28, marginRight: 15 },
  adminTitle: { color: COLORS.white, fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  adminSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 },
  adminEnter: { color: COLORS.accent, fontWeight: '900', fontSize: 11 },
  
  footer: { alignItems: 'center', paddingVertical: 40 },
  version: { color: 'rgba(255,255,255,0.1)', fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  copyright: { color: 'rgba(255,255,255,0.05)', fontSize: 8, fontWeight: '900', marginTop: 8, letterSpacing: 2 },

  // MODAL STYLES
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.95)', justifyContent: 'center', padding: 30 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 30, padding: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  infoRow: { marginBottom: 15 },
  infoLabel: { color: COLORS.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 5 },
  infoVal: { color: 'white', fontSize: 16, fontWeight: '500' },
  modalInput: { backgroundColor: COLORS.inputBg, color: 'white', padding: 12, borderRadius: 12, fontSize: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 15 },
  roleBadge: { backgroundColor: COLORS.violet, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  roleText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  modalActions: { marginTop: 10 },
  modalBtn: { backgroundColor: 'rgba(255,255,255,0.1)', padding: 15, borderRadius: 15, alignItems: 'center' },
  modalBtnText: { color: 'white', fontWeight: 'bold' },

  // ALERT MODAL
  alertContent: { backgroundColor: COLORS.card, padding: 30, borderRadius: 30, alignItems: 'center', borderWidth: 2 },
  alertTitle: { color: 'white', fontSize: 20, fontWeight: '900', marginBottom: 10, textAlign: 'center' },
  alertMsg: { color: COLORS.muted, textAlign: 'center', fontSize: 14, lineHeight: 22 },
  alertBtn: { paddingVertical: 15, paddingHorizontal: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  alertBtnCancel: { paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  alertBtnText: { fontWeight: '900', fontSize: 12, color: 'white' }
});
