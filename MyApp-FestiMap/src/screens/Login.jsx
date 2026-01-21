
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ActivityIndicator, 
  Platform, 
  StatusBar,
  Modal,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard
} from 'react-native';
import axios from 'axios';
import { useUser } from '../context/UserContext.jsx';
import { ENDPOINTS } from '../config/api.js';

const { width, height } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
  error: '#ef4444',
  muted: 'rgba(255,255,255,0.4)',
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.1)'
};

export default function Login({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [modal, setModal] = useState({ show: false, title: '', message: '' });
  
  const passwordRef = useRef(null);
  const { login } = useUser();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();
  }, []);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email || !password) {
      setModal({ show: true, title: '⚠️ Atención', message: 'Ingresa tus credenciales para continuar.' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(ENDPOINTS.usuarios);
      const userFound = res.data.find(u => u.email.toLowerCase() === email.toLowerCase() && u.contra === password);

      if (userFound) {
        const userWithRole = { ...userFound, rol: userFound.email === 'admin@epn.edu.ec' ? 'admin' : 'user' };
        login(userWithRole);
        navigation.replace('Main'); 
      } else {
        setModal({ show: true, title: '❌ Error', message: 'Usuario o contraseña no válidos.' });
      }
    } catch (e) {
      setModal({ show: true, title: '🌐 Error', message: 'No hay conexión con el servidor cultural.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      <View style={styles.bgDecor} />
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <SafeAreaView style={{flex: 1}}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            
            <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
              <View style={styles.logoRing}>
                 <Text style={styles.logoEmoji}>🇪🇨</Text>
              </View>
              <Text style={styles.brandName}>Festi<Text style={{color: COLORS.accent}}>Map</Text></Text>
              <Text style={styles.brandSub}>TU PASAPORTE CULTURAL</Text>
            </Animated.View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Bienvenido de nuevo</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <View style={styles.inputWrap}>
                   <Text style={styles.inputIcon}>✉️</Text>
                   <TextInput 
                     style={styles.input} 
                     placeholder="ejemplo@email.com" 
                     placeholderTextColor={COLORS.muted}
                     value={email} 
                     onChangeText={setEmail} 
                     autoCapitalize="none"
                     keyboardType="email-address"
                     returnKeyType="next"
                     onSubmitEditing={() => passwordRef.current?.focus()}
                     blurOnSubmit={false}
                   />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTRASEÑA</Text>
                <View style={styles.inputWrap}>
                   <Text style={styles.inputIcon}>🔒</Text>
                   <TextInput 
                     ref={passwordRef}
                     style={[styles.input, {flex: 1}]} 
                     placeholder="••••••••" 
                     placeholderTextColor={COLORS.muted}
                     value={password} 
                     onChangeText={setPassword} 
                     secureTextEntry={!verPassword}
                     returnKeyType="go"
                     onSubmitEditing={handleLogin}
                   />
                   <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={styles.eyeBtn}>
                      <Text style={styles.eyeIcon}>{verPassword ? '👁️' : '🙈'}</Text>
                   </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.mainBtn, loading && {opacity: 0.8}]} 
                onPress={handleLogin} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.mainBtnText}>INICIAR SESIÓN</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Registro')} style={styles.footerLink}>
              <Text style={styles.linkText}>¿Eres nuevo explorador? <Text style={styles.linkBold}>Crea una cuenta</Text></Text>
            </TouchableOpacity>

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>

      <Modal animationType="fade" transparent visible={modal.show}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{modal.title}</Text>
            <Text style={styles.modalText}>{modal.message}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={() => setModal({ ...modal, show: false })}>
              <Text style={styles.modalBtnText}>ENTENDIDO</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  bgDecor: { position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: 150, backgroundColor: COLORS.violet, opacity: 0.15 },
  scroll: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 40 },
  logoRing: { width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', marginBottom: 20 },
  logoEmoji: { fontSize: 45 },
  brandName: { fontSize: 42, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  brandSub: { fontSize: 10, color: COLORS.accent, fontWeight: '900', letterSpacing: 4, marginTop: 5 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 35, padding: 30, borderWidth: 1, borderColor: COLORS.glassBorder },
  formTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 9, fontWeight: '900', color: COLORS.accent, letterSpacing: 1.5, marginBottom: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 18, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { fontSize: 16, marginRight: 12, opacity: 0.5 },
  input: { flex: 1, height: 60, color: 'white', fontSize: 15 }, 
  eyeBtn: { padding: 10 },
  eyeIcon: { fontSize: 18 },
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 30 },
  forgotText: { color: COLORS.muted, fontSize: 12 },
  mainBtn: { backgroundColor: COLORS.accent, padding: 22, borderRadius: 20, alignItems: 'center', elevation: 10, shadowColor: COLORS.accent, shadowOpacity: 0.3, shadowRadius: 10 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  footerLink: { marginTop: 35, alignItems: 'center' },
  linkText: { color: COLORS.muted, fontSize: 14 },
  linkBold: { color: COLORS.accent, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.95)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { backgroundColor: '#1e293b', width: '100%', borderRadius: 30, padding: 35, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  modalTitle: { color: 'white', fontSize: 22, fontWeight: 'bold', marginBottom: 15 },
  modalText: { color: COLORS.muted, textAlign: 'center', marginBottom: 30, lineHeight: 22 },
  modalBtn: { backgroundColor: COLORS.white, paddingHorizontal: 40, paddingVertical: 18, borderRadius: 15 },
  modalBtnText: { color: COLORS.ink, fontWeight: 'bold', fontSize: 13 }
});
