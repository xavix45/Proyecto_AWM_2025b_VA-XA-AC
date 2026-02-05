
import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Image, 
  Alert, 
  ActivityIndicator,
  TextInput,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal
} from 'react-native';
import axios from 'axios';
import { ENDPOINTS } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';

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
  card: '#1e293b'
};

export default function AdminList({ navigation }) {
  const { token } = useUser();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalComentarios, setModalComentarios] = useState({ show: false, event: null });
  const [search, setSearch] = useState("");

  const fetchEventos = async () => {
    try {
      const config = token ? { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } } : {};
      const res = await axios.get(ENDPOINTS.eventos, config);
      setEventos(res.data);
      console.log("✅ Eventos cargados:", res.data.length);
    } catch (e) { 
      console.error("❌ Error en fetchEventos:", e.message);
      Alert.alert("Error de Conexión", "No se pudo sincronizar el inventario. Asegúrate que el servidor esté corriendo.");
      setEventos([]);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchEventos);
    return unsubscribe;
  }, [navigation]);

  const filtrados = useMemo(() => {
    return eventos.filter(ev => {
      return (ev.name || "").toLowerCase().includes(search.toLowerCase()) || 
             (ev.ciudad || "").toLowerCase().includes(search.toLowerCase());
    });
  }, [eventos, search]);

  const quickToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'unpublished' : 'approved';
    const actionText = nextStatus === 'approved' ? 'ACTIVAR' : 'OCULTAR';
    
    try {
      setLoading(true);
      const config = { 
        headers: { 
          'Authorization': `Bearer ${token}`, 
          'Content-Type': 'application/json' 
        } 
      };
      
      // Obtener el evento completo
      const eventRes = await axios.get(`${ENDPOINTS.eventos}/${id}`);
      const eventoCompleto = eventRes.data;
      
      // Actualizar con todos los datos + nuevo status
      await axios.put(`${ENDPOINTS.eventos}/${id}`, {
        ...eventoCompleto,
        status: nextStatus
      }, config);
      
      console.log(`✅ Estado cambiado a: ${nextStatus}`);
      Alert.alert("✅ Éxito", `Evento ${nextStatus === 'approved' ? 'ACTIVADO' : 'OCULTO'} correctamente.`);
      
      await fetchEventos();
    } catch (e) {
      console.error("❌ Error al cambiar estado:", e.response?.data || e.message);
      Alert.alert("❌ Error", e.response?.data?.message || "No se pudo cambiar el estado.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvento = (id, name) => {
    Alert.alert(
      "🗑️ Eliminar Registro",
      `¿Borrar permanentemente "${name}"?`,
      [
        { text: "CANCELAR", style: "cancel" },
        { text: "ELIMINAR", style: "destructive", onPress: async () => {
          setLoading(true);
          try {
            const config = { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } };
            await axios.delete(`${ENDPOINTS.eventos}/${id}`, config);
            fetchEventos();
          } catch (e) { Alert.alert("Error", "No se pudo eliminar."); }
          finally { setLoading(false); }
        }}
      ]
    );
  };

  const renderItem = ({ item }) => {
    const itemId = item._id || item.id;
    return (
      <View style={styles.itemCard}>
        <Image source={{ uri: item.imagen }} style={styles.itemImg} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.itemSub}>{item.ciudad} • {item.provincia}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.miniAction} onPress={() => setModalComentarios({ show: true, event: item })}>
              <Text style={styles.miniActionText}>💬 {item.comentarios?.length || 0}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.miniAction} onPress={() => navigation.navigate('AdminForm', { evento: item })}>
              <Text style={styles.miniActionText}>✏️ EDITAR</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.miniAction, {backgroundColor: item.status === 'approved' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}]} 
              onPress={() => quickToggleStatus(itemId, item.status)}
            >
              <Text style={[styles.miniActionText, {color: item.status === 'approved' ? COLORS.error : COLORS.success}]}>
                {item.status === 'approved' ? 'OCULTAR' : 'ACTIVAR'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminarEvento(itemId, item.name)}>
              <Text style={{fontSize: 14}}>🗑️</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>Inventario Maestro</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AdminForm')}>
             <Text style={styles.addBtnText}>+ NUEVO</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchBar}>
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar..."
            placeholderTextColor={COLORS.muted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={COLORS.accent} size="large" /></View>
      ) : (
        <FlatList 
          data={filtrados}
          keyExtractor={item => (item._id || item.id).toString()}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
        />
      )}

      <Modal visible={modalComentarios.show} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reseñas</Text>
              <TouchableOpacity onPress={() => setModalComentarios({ show: false, event: null })}>
                <Text style={styles.closeModal}>CERRAR ×</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.commentScroll}>
               {modalComentarios.event?.comentarios?.length > 0 ? (
                 modalComentarios.event.comentarios.map(c => (
                   <View key={c.id || Math.random()} style={styles.commentItem}>
                     <Text style={styles.commentUser}>{c.usuario}</Text>
                     <Text style={styles.commentText}>{c.comentario}</Text>
                   </View>
                 ))
               ) : (
                 <Text style={styles.noComments}>Sin reseñas.</Text>
               )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.ink },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 25, backgroundColor: 'rgba(255,255,255,0.02)' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  addBtn: { backgroundColor: COLORS.violet, padding: 10, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  searchBar: { backgroundColor: COLORS.glass, borderRadius: 15, paddingHorizontal: 15, height: 50, justifyContent: 'center' },
  searchInput: { color: 'white' },
  list: { padding: 20, paddingBottom: 100 },
  itemCard: { flexDirection: 'row', backgroundColor: COLORS.glass, borderRadius: 25, padding: 15, marginBottom: 15 },
  itemImg: { width: 80, height: 80, borderRadius: 15 },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  itemSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  actionRow: { flexDirection: 'row', marginTop: 15, gap: 8 },
  miniAction: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8 },
  miniActionText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold' },
  deleteBtn: { padding: 5, marginLeft: 'auto' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '70%', padding: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeModal: { color: COLORS.accent, fontWeight: 'bold' },
  commentScroll: { flex: 1 },
  commentItem: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, marginBottom: 15 },
  commentUser: { color: 'white', fontWeight: 'bold' },
  commentText: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  noComments: { color: COLORS.muted, textAlign: 'center', marginTop: 40 }
});
