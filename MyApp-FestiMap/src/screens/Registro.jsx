
import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, 
  ScrollView, Platform, StatusBar, Modal, ActivityIndicator, 
  KeyboardAvoidingView, Dimensions 
} from 'react-native';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';

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

  const handleRegister = async () => {
    if (!nombre || !email || !password) {
      setModal({ show: true, title: '❌ Error', message: 'Completa todos los campos.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(ENDPOINTS.register, { 
        nombre, 
        email: email.toLowerCase(), 
        password, 
        tipoViajero: viajero 
      });

      if (res.status === 201) {
        login(res.data.user, res.data.token);
        setModal({ show: true, title: '✅ ¡Éxito!', message: 'Tu cuenta ha sido creada en MongoDB.', type: 'success' });
      }
    } catch (e) {
      const errorMsg = e.response?.data?.mensaje || 'No pudimos conectarnos al servidor.';
      setModal({ show: true, title: '❌ Error', message: errorMsg, type: 'error' });
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
               <Text style={styles.preTitle}>PASAPORTE DIGITAL</Text>
               <Text style={styles.title}>Nuevo Usuario ✨</Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE COMPLETO</Text>
                <TextInput style={styles.input} placeholder="Angelo Conterón" placeholderTextColor={COLORS.muted} value={nombre} onChangeText={setNombre} />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                <TextInput style={styles.input} placeholder="angelo@epn.edu.ec" placeholderTextColor={COLORS.muted} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONTRASEÑA SEGURA</Text>
                <View style={styles.passWrap}>
                   <TextInput style={{flex:1, color:'white', height: 55}} placeholder="••••••••" placeholderTextColor={COLORS.muted} secureTextEntry={!verPassword} value={password} onChangeText={setPassword} />
                   <TouchableOpacity onPress={() => setVerPassword(!verPassword)} style={styles.eye}>
                      <Text style={{fontSize: 16}}>{verPassword ? '👁️' : '🙈'}</Text>
                   </TouchableOpacity>
                </View>
              </View>

              <Text style={styles.label}>ESTILO DE VIAJE</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity style={[styles.typeBtn, viajero === 'turista' && styles.typeActive]} onPress={() => setViajero('turista')}>
                  <Text style={[styles.typeText, viajero === 'turista' && {color:'white'}]}>TURISTA 🌍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.typeBtn, viajero === 'estudiante' && styles.typeActive]} onPress={() => setViajero('estudiante')}>
                  <Text style={[styles.typeText, viajero === 'estudiante' && {color:'white'}]}>ESTUDIANTE 🎓</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.mainBtn, loading && {opacity: 0.7}]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.mainBtnText}>REGISTRAR EN BASE DE DATOS</Text>}
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
  blurCircle: { position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: COLORS.accent, opacity: 0.05 },
  scroll: { padding: 30, flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: 30 },
  preTitle: { color: COLORS.accent, fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 5 },
  title: { color: 'white', fontSize: 32, fontWeight: '900' },
  form: { width: '100%' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 8, fontWeight: '900', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, marginBottom: 8 },
  input: { backgroundColor: COLORS.glass, paddingHorizontal: 15, height: 55, borderRadius: 15, color: 'white', borderWidth: 1, borderColor: COLORS.glassBorder },
  passWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  eye: { padding: 5 },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 25 },
  typeBtn: { flex: 1, backgroundColor: COLORS.glass, padding: 15, borderRadius: 15, alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder },
  typeActive: { backgroundColor: 'rgba(91, 33, 182, 0.2)', borderColor: COLORS.violet },
  typeText: { fontSize: 10, fontWeight: 'bold', color: COLORS.muted },
  mainBtn: { backgroundColor: COLORS.accent, padding: 20, borderRadius: 18, alignItems: 'center' },
  mainBtnText: { color: COLORS.ink, fontWeight: '900', fontSize: 12 },
  backLink: { marginTop: 25, alignItems: 'center' },
  backText: { color: COLORS.muted, fontSize: 13 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 30 },
  modalBox: { backgroundColor: '#1e293b', padding: 30, borderRadius: 25, alignItems: 'center', borderWidth: 1 },
  modalTitle: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  modalMsg: { color: COLORS.muted, textAlign: 'center', marginBottom: 20 },
  modalAction: { width: '100%', padding: 15, borderRadius: 12, alignItems: 'center' },
  modalActionText: { color: 'white', fontWeight: 'bold' }
});
