
import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, 
  ActivityIndicator, Platform, StatusBar, Modal, Dimensions, Animated, 
  KeyboardAvoidingView, ScrollView, Keyboard 
} from 'react-native';
import axios from 'axios';
import { useUser } from '../context/UserContext.jsx';
import { ENDPOINTS } from '../config/api.js';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  white: '#ffffff',
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
      setModal({ show: true, title: '⚠️ Atención', message: 'Ingresa tus credenciales.' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(ENDPOINTS.login, { 
        email: email.toLowerCase(), 
        password: password 
      });

      if (res.data && res.data.token) {
        login(res.data, res.data.token);
        navigation.replace('Main'); 
      }
    } catch (e) {
      const msg = e.response?.data?.mensaje || 'Error de conexión con el servidor.';
      setModal({ show: true, title: '❌ Error', message: msg });
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
              <View style={styles.logoRing}><Text style={styles.logoEmoji}>🇪🇨</Text></View>
              <Text style={styles.brandName}>Festi<Text style={{color: COLORS.accent}}>Map</Text></Text>
              <Text style={styles.brandSub}>CONECTADO A MONGODB</Text>
            </Animated.View>

            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Acceso Seguro</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <View style={styles.inputWrap}>
                   <Text style={styles.inputIcon}>✉️</Text>
                   <TextInput 
                     style={styles.input} 
                     placeholder="tu@email.com" 
                     placeholderTextColor={COLORS.muted}
                     value={email} 
                     onChangeText={setEmail} 
                     autoCapitalize="none"
                     keyboardType="email-address"
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
                   />
                   <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={styles.eyeBtn}>
                      <Text style={styles.eyeIcon}>{verPassword ? '👁️' : '🙈'}</Text>
                   </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.mainBtn, loading && {opacity: 0.8}]} 
                onPress={handleLogin} 
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.mainBtnText}>ENTRAR AL MAPA</Text>}
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Registro')} style={styles.footerLink}>
              <Text style={styles.linkText}>¿Nuevo aquí? <Text style={styles.linkBold}>Crea una cuenta</Text></Text>
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
              <Text style={styles.modalBtnText}>CERRAR</Text>
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
  logoRing: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,184,0,0.2)', marginBottom: 20 },
  logoEmoji: { fontSize: 40 },
  brandName: { fontSize: 38, fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
  brandSub: { fontSize: 9, color: COLORS.accent, fontWeight: '900', letterSpacing: 3, marginTop: 5 },
  formCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 30, padding: 25, borderWidth: 1, borderColor: COLORS.glassBorder },
  formTitle: { color: COLORS.white, fontSize: 18, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 8, fontWeight: '900', color: COLORS.accent, letterSpacing: 1.5, marginBottom: 10 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 15, paddingHorizontal: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  inputIcon: { fontSize: 14, marginRight: 10, opacity: 0.5 },
  input: { flex: 1, height: 55, color: 'white', fontSize: 14 }, 
  eyeBtn: { padding: 10 },
  eyeIcon: { fontSize: 16 },
  mainBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 10 },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 13 },
  footerLink: { marginTop: 30, alignItems: 'center' },
  linkText: { color: COLORS.muted, fontSize: 13 },
  linkBold: { color: COLORS.accent, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 30 },
  modalContent: { backgroundColor: '#1e293b', width: '100%', borderRadius: 25, padding: 30, alignItems: 'center' },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalText: { color: COLORS.muted, textAlign: 'center', marginBottom: 25 },
  modalBtn: { backgroundColor: COLORS.white, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 12 },
  modalBtnText: { color: COLORS.ink, fontWeight: 'bold' }
});
