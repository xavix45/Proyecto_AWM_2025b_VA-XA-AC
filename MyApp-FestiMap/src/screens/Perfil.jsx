
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
  Image,
  ActivityIndicator
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

// LOGROS BASE (Lógica local vinculada a MongoDB)
const LOGROS_BASE = [
  { id: 1, title: "Primer Viaje", desc: "Agrega 1 evento", icon: "🥇", target: 1, color: '#ffb800' },
  { id: 2, title: "Ruta Volcanes", desc: "Agrega 3 eventos", icon: "🌋", target: 3, color: '#ef4444' },
  { id: 3, title: "Amazonía Fan", desc: "Agrega 5 eventos", icon: "🌿", target: 5, color: '#10b981' },
  { id: 4, title: "Maestro Festivo", desc: "Agrega 10 eventos", icon: "👑", target: 10, color: '#8b5cf6' },
];

export default function Perfil({ navigation }) {
  const { user, preferences, logout, syncUserWithServer } = useUser();
  const { agenda } = useAgenda();
  
  // Estados UI
  const [modalAccount, setModalAccount] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);
  
  // Estados Edición (Datos temporales antes de MongoDB)
  const [tempName, setTempName] = useState('');
  const [tempEmail, setTempEmail] = useState('');

  // Estado Modal Personalizado
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

  // Lógica: Historial vs Próximos (Filtrado de fechas de la Agenda cargada de MongoDB)
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
      msg: newState ? "Te avisaremos de eventos cercanos." : "Alertas pausadas.",
      type: newState ? 'success' : 'info'
    });
  };

  const openAccountModal = () => {
    setTempName(user?.nombre || '');
    setTempEmail(user?.email || '');
    setIsEditing(false);
    setModalAccount(true);
  };

  const saveProfileChanges = async () => {
    if (!tempName.trim() || !tempEmail.trim()) {
      setCustomAlert({ show: true, title: "⚠️ Error", msg: "Campos obligatorios vacíos.", type: 'error' });
      return;
    }

    setSyncing(true);
    // Persistencia real en MongoDB vía UserContext
    const exito = await syncUserWithServer({ nombre: tempName, email: tempEmail });
    setSyncing(false);

    if (exito) {
      setIsEditing(false);
      setCustomAlert({ show: true, title: "✅ Sincronizado", msg: "Tus datos han sido actualizados en MongoDB.", type: 'success' });
    } else {
      setCustomAlert({ show: true, title: "❌ Error", msg: "No se pudo conectar con el servidor backend.", type: 'error' });
    }
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
                  {agenda.length >= 10 ? "MAESTRO FESTIVO 👑" : agenda.length >= 5 ? "EXPLORADOR ÉLITE" : "VIAJERO INICIAL"}
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

        {/* HISTORIAL DE VIAJES */}
        {historialViajes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>BITÁCORA DE VIAJES ({historialViajes.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.historyScroll}>
              {historialViajes.map((ev, i) => (
                <View key={i} style={styles.historyCard}>
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
            sublabel={preferences.provincia || "Ajustar ubicación"} 
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
                <Text style={{color: COLORS.muted, fontSize: 12}}>Sin filtros activos.</Text>
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
                 <View style={styles.adminIconBox}><Text style={styles.adminEmoji}>🛡️</Text></View>
                 <View>
                    <Text style={styles.adminTitle}>MODO ADMINISTRADOR</Text>
                    <Text style={styles.adminSub}>Gestión avanzada de festividades</Text>
                 </View>
              </View>
              <Text style={styles.adminEnter}>ACCEDER →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* SOPORTE */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>SOPORTE Y CUENTA</Text>
          <ProfileOption 
            icon="👤" 
            label="Datos de Cuenta" 
            sublabel="Ver o editar información en MongoDB" 
            onPress={openAccountModal}
          />
          <ProfileOption 
            icon={notifEnabled ? "🔔" : "🔕"}
            label="Notificaciones" 
            sublabel={notifEnabled ? "Activadas" : "Desactivadas"}
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
          <Text style={styles.version}>FESTIMAP ECUADOR v5.5 PREMIUM</Text>
          <Text style={styles.copyright}>SINCROZINADO CON MONGODB © 2025</Text>
        </View>

        <View style={{height: 120}} />
      </ScrollView>

      {/* MODAL DE CUENTA (CON EDICIÓN MONGODB) */}
      <Modal visible={modalAccount} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
             <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Editar Perfil' : 'Mi Pasaporte'}</Text>
                <TouchableOpacity onPress={() => setModalAccount(false)}><Text style={{fontSize:20, color:'white'}}>✕</Text></TouchableOpacity>
             </View>
             
             <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>NOMBRE COMPLETO</Text>
                {isEditing ? (
                  <TextInput 
                    style={styles.modalInput} 
                    value={tempName} 
                    onChangeText={setTempName} 
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={styles.infoVal}>{user?.nombre || 'Explorador'}</Text>
                )}
             </View>
             
             <View style={styles.divider} />
             
             <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>CORREO ELECTRÓNICO</Text>
                {isEditing ? (
                  <TextInput 
                    style={styles.modalInput} 
                    value={tempEmail} 
                    onChangeText={setTempEmail} 
                    keyboardType="email-address"
                    placeholderTextColor={COLORS.muted}
                  />
                ) : (
                  <Text style={styles.infoVal}>{user?.email || 'email@desconocido.com'}</Text>
                )}
             </View>
             
             <View style={styles.divider} />
             
             <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ESTADO DE CUENTA</Text>
                <View style={styles.roleBadge}>
                   <Text style={styles.roleText}>{user?.tipoViajero?.toUpperCase() || 'TURISTA'}</Text>
                </View>
             </View>

             <View style={styles.modalActions}>
                {isEditing ? (
                  <TouchableOpacity 
                    style={[styles.modalBtn, {backgroundColor: COLORS.success}]} 
                    onPress={saveProfileChanges}
                    disabled={syncing}
                  >
                    {syncing ? <ActivityIndicator color={COLORS.ink} /> : <Text style={[styles.modalBtnText, {color: COLORS.ink}]}>GUARDAR EN BACKEND</Text>}
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
                   {customAlert.type === 'warning' ? 'CONFIRMAR' : 'ENTENDIDO'}
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
  header: { padding: 30, paddingTop: Platform.OS === 'ios' ? 20 : 60, marginBottom: 10 },
  profileMain: { flexDirection: 'row', alignItems: 'center', marginBottom: 35 },
  avatarFrame: { position: 'relative' },
  avatarInner: { 
    width: 90, 
    height: 90, 
    borderRadius: 32, 
    backgroundColor: COLORS.violet, 
    alignItems: 'center', 
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.accent,
    shadowColor: COLORS.violet,
    shadowOpacity: 0.5,
    shadowRadius: 10
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: COLORS.white },
  statusDot: { 
    position: 'absolute', 
    bottom: 2, 
    right: 2, 
    width: 22, 
    height: 22, 
    borderRadius: 11, 
    backgroundColor: COLORS.success, 
    borderWidth: 4, 
    borderColor: COLORS.ink 
  },
  userNameContainer: { marginLeft: 25 },
  userName: { fontSize: 26, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5 },
  rankBadge: { 
    backgroundColor: 'rgba(255,184,0,0.1)', 
    paddingHorizontal: 12, 
    paddingVertical: 5, 
    borderRadius: 10, 
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,184,0,0.2)',
    alignSelf: 'flex-start'
  },
  rankText: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  statsGrid: { 
    flexDirection: 'row', 
    backgroundColor: COLORS.glass, 
    borderRadius: 35, 
    padding: 25, 
    borderWidth: 1, 
    borderColor: COLORS.glassBorder 
  },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { color: COLORS.white, fontSize: 26, fontWeight: '900' },
  statDesc: { color: COLORS.muted, fontSize: 9, marginTop: 5, fontWeight: 'bold' },
  statDivider: { width: 1, height: '50%', backgroundColor: COLORS.glassBorder, alignSelf: 'center' },
  section: { marginVertical: 20 },
  sectionTitle: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginLeft: 30, marginBottom: 20 },
  achievementsScroll: { paddingLeft: 30, gap: 15, paddingRight: 30 },
  achievement: { alignItems: 'center', width: 95 },
  achievementLocked: { opacity: 0.4 },
  achIcon: { width: 65, height: 65, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  achText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold', textAlign: 'center' },
  achLockIcon: { position: 'absolute', top: 0, right: 10, fontSize: 12 },
  historyScroll: { paddingLeft: 30, gap: 15, paddingRight: 30 },
  historyCard: { width: 145, height: 190, borderRadius: 25, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.glassBorder },
  historyImg: { width: '100%', height: '100%', opacity: 0.5 },
  historyOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', padding: 15, justifyContent: 'flex-end' },
  historyBadge: { color: COLORS.success, fontSize: 8, fontWeight: '900', marginBottom: 6, letterSpacing: 1 },
  historyTitle: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  historyDate: { color: COLORS.muted, fontSize: 10 },
  card: { backgroundColor: COLORS.glass, marginHorizontal: 25, borderRadius: 35, padding: 25, marginBottom: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  cardTitle: { color: COLORS.muted, fontSize: 9, fontWeight: '900', marginBottom: 20, letterSpacing: 1.5 },
  optionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' },
  optionIconBox: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.02)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  optionEmoji: { fontSize: 18 },
  optionLabel: { fontSize: 15, fontWeight: 'bold', color: 'white' },
  optionSub: { color: COLORS.muted, fontSize: 11, marginTop: 3 },
  optionArrow: { color: COLORS.muted, fontSize: 20, fontWeight: 'bold' },
  interestsBox: { marginTop: 10, paddingTop: 10 },
  editLink: { color: COLORS.accent, fontSize: 9, fontWeight: '900' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  chipText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  adminCard: { marginHorizontal: 25, marginBottom: 25, borderRadius: 35, overflow: 'hidden', elevation: 15 },
  adminGradient: { backgroundColor: COLORS.violet, padding: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminHeader: { flexDirection: 'row', alignItems: 'center' },
  adminIconBox: { width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  adminEmoji: { fontSize: 24 },
  adminTitle: { color: COLORS.white, fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  adminSub: { color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 3 },
  adminEnter: { color: COLORS.accent, fontWeight: '900', fontSize: 10 },
  footer: { alignItems: 'center', paddingVertical: 40 },
  version: { color: 'rgba(255,255,255,0.1)', fontSize: 9, fontWeight: 'bold', letterSpacing: 2 },
  copyright: { color: 'rgba(255,255,255,0.05)', fontSize: 8, fontWeight: '900', marginTop: 8, letterSpacing: 2 },
  modalBg: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.98)', justifyContent: 'center', padding: 35 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 40, padding: 30, borderWidth: 1, borderColor: COLORS.glassBorder },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: '900' },
  infoRow: { marginBottom: 15 },
  infoLabel: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
  infoVal: { color: 'white', fontSize: 16, fontWeight: '600' },
  modalInput: { backgroundColor: COLORS.inputBg, color: 'white', padding: 15, borderRadius: 15, fontSize: 14, borderWidth: 1, borderColor: COLORS.glassBorder },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: 20 },
  roleBadge: { backgroundColor: COLORS.violet, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, alignSelf: 'flex-start' },
  roleText: { color: 'white', fontSize: 9, fontWeight: 'bold' },
  modalActions: { marginTop: 10 },
  modalBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 18, borderRadius: 18, alignItems: 'center' },
  modalBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  alertContent: { backgroundColor: COLORS.card, padding: 35, borderRadius: 40, alignItems: 'center', borderWidth: 1 },
  alertTitle: { color: 'white', fontSize: 22, fontWeight: '900', marginBottom: 15, textAlign: 'center' },
  alertMsg: { color: COLORS.muted, textAlign: 'center', fontSize: 15, lineHeight: 22 },
  alertBtn: { padding: 18, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  alertBtnCancel: { padding: 18, width: 90, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18 },
  alertBtnText: { fontWeight: '900', fontSize: 12, color: 'white' }
});
