
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Platform, 
  StatusBar,
  Modal,
  ActivityIndicator,
  KeyboardAvoidingView,
  Dimensions
} from 'react-native';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
  error: '#ef4444',
  success: '#10b981',
  muted: 'rgba(255,255,255,0.4)',
  glass: 'rgba(255,255,255,0.03)',
  glassBorder: 'rgba(255,255,255,0.08)'
};

export default function Registro({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [viajero, setViajero] = useState('turista');
  const [loading, setLoading] = useState(false);
  const { login } = useUser();

  const [modal, setModal] = useState({ show: false, title: '', message: '', type: 'info' });

  const validatePassword = (pass) => /^(?=.*[A-Z])(?=.*\d).{8,}$/.test(pass);

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      setModal({ show: true, title: '❌ Campos Vacíos', message: 'Toda aventura requiere un nombre y una llave.', type: 'error' });
      return;
    }
    if (!validatePassword(password)) {
      setModal({ show: true, title: '🔒 Seguridad', message: 'Tu contraseña debe tener 8 caracteres, una mayúscula y un número.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const checkRes = await axios.get(`${ENDPOINTS.usuarios}?email=${email.toLowerCase()}`);
      if (checkRes.data.length > 0) {
        setModal({ show: true, title: '❌ Duplicado', message: 'Este correo ya es parte de nuestra comunidad.', type: 'error' });
        setLoading(false);
        return;
      }

      // ID numérico basado en timestamp para evitar conflictos y strings
      const numericId = Date.now(); 

      const nuevoUsuario = { 
        id: numericId, 
        nombre, 
        email: email.toLowerCase(), 
        contra: password, 
        tipoViajero: viajero, 
        rol: 'user', // Rol por defecto
        agenda: [] 
      };
      
      const saveRes = await axios.post(ENDPOINTS.usuarios, nuevoUsuario);
      login(saveRes.data);
      setModal({ show: true, title: '✅ ¡Éxito!', message: 'Tu pasaporte cultural está listo.', type: 'success' });
    } catch (e) {
      console.error(e);
      setModal({ show: true, title: '❌ Error', message: 'No pudimos registrarte. Intenta de nuevo.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    const wasSuccess = modal.type === 'success';
    setModal({ ...modal, show: false });
    if (wasSuccess) navigation.replace('Ubicacion');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.blurCircle} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <SafeAreaView style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            
            <View style={styles.header}>
               <Text style={styles.preTitle}>COMIENZA TU VIAJE</Text>
               <Text style={styles.title}>Crear Cuenta ✨</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE COMPLETO</Text>
                <TextInput style={styles.input} placeholder="Xavier Anatoa" placeholderTextColor={COLORS.muted} value={nombre} onChangeText={setNombre} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <TextInput style={styles.input} placeholder="tu@email.com" placeholderTextColor={COLORS.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.passWrap}>
                   <TextInput style={{flex:1, color:'white', height: 60}} placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry={!verPassword} value={password} onChangeText={setPassword} />
                   <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={styles.eye}>
                      <Text style={{fontSize: 18}}>{verPassword ? '👁️' : '🙈'}</Text>
                   </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>¿CÓMO EXPLORARÁS ECUADOR?</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity style={[styles.typeBtn, viajero === 'turista' && styles.typeActive]} onPress={() => setViajero('turista')}>
                  <Text style={styles.typeIcon}>🌍</Text>
                  <Text style={[styles.typeText, viajero === 'turista' && styles.typeTextActive]}>TURISTA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, viajero === 'residente' && styles.typeActive]} onPress={() => setViajero('residente')}>
                  <Text style={styles.typeIcon}>🏠</Text>
                  <Text style={[styles.typeText, viajero === 'residente' && styles.typeTextActive]}>RESIDENTE</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.mainBtn, loading && {opacity: 0.7}]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.mainBtnText}>REGISTRARME AHORA</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backLink}>
               <Text style={styles.backText}>¿Ya tienes cuenta? <Text style={{color: COLORS.accent, fontWeight: 'bold'}}>Inicia Sesión</Text></Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent visible={modal.show}>
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, { borderColor: modal.type === 'success' ? COLORS.success : COLORS.error }]}>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalMsg}>{modal.message}</Text>
            <TouchableOpacity style={[styles.modalAction, { backgroundColor: modal.type === 'success' ? COLORS.success : COLORS.error }]} onPress={closeModal}>
              <Text style={styles.modalActionText}>CONTINUAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  blurCircle: { position: 'absolute', bottom: -50, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: COLORS.accent, opacity: 0.05 },
  scroll: { padding: 40, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 35 },
  preTitle: { color: COLORS.accent, fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 5 },
  title: { color: 'white', fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  form: { width: '100%' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 9, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 12 },
  input: { backgroundColor: COLORS.glass, paddingHorizontal: 20, height: 60, borderRadius: 20, color: 'white', borderWidth: 1, borderColor: COLORS.glassBorder },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, paddingHorizontal: 20, borderRadius: 20, borderWidth: 1, borderColor: COLORS.glassBorder },
  eye: { padding: 5 },
  typeSelector: { flexDirection: 'row', gap: 15, marginBottom: 35, marginTop: 10 },
  typeBtn: { flex: 1, backgroundColor: COLORS.glass, padding: 20, borderRadius: 25, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  typeActive: { backgroundColor: 'rgba(91, 33, 182, 0.2)', borderColor: COLORS.violet },
  typeIcon: { fontSize: 24, marginBottom: 8 },
  typeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted },
  typeTextActive: { color: 'white' },
  mainBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 22, alignItems: 'center', elevation: 10 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  backLink: { marginTop: 35, alignItems: 'center' },
  backText: { color: COLORS.muted, fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.96)', justifyContent: 'center', padding: 35 },
  modalBox: { backgroundColor: '#1e293b', padding: 35, borderRadius: 35, alignItems: 'center', borderWidth: 1 },
  modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalMsg: { color: COLORS.muted, textAlign: 'center', lineHeight: 24, marginBottom: 30 },
  modalAction: { width: '100%', padding: 20, borderRadius: 18, alignItems: 'center' },
  modalActionText: { color: 'white', fontWeight: 'bold' }
});
