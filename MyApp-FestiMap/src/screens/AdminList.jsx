
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Animated,
  Modal
} from 'react-native';
import axios from 'axios';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { ENDPOINTS } from '../config/api.js';

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
  pending: '#f59e0b',
  card: '#1e293b'
};

export default function AdminList({ navigation }) {
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState(new Set());
  
  // Estados para Modal de Comentarios
  const [modalComentarios, setModalComentarios] = useState({ show: false, event: null });
  
  // Filtros
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState('Todos');

  const fetchEventos = async () => {
    try {
      const res = await axios.get(ENDPOINTS.eventos);
      setEventos(res.data);
    } catch (e) { 
      Alert.alert("Error de Conexión", "No se pudo sincronizar el inventario cultural.");
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
      const matchText = (ev.name || "").toLowerCase().includes(search.toLowerCase()) || 
                          (ev.ciudad || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || (ev.status || 'approved') === statusFilter;
      return matchText && matchStatus;
    }).sort((a, b) => b.id - a.id);
  }, [eventos, search, statusFilter]);

  // Acción: Cambiar Estado (Concepto PDF: Métodos HTTP PATCH)
  const quickToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'approved' ? 'unpublished' : 'approved';
    try {
      setLoading(true);
      await axios.patch(`${ENDPOINTS.eventos}/${id}`, { status: nextStatus });
      fetchEventos();
    } catch (e) {
      Alert.alert("Error", "No se pudo cambiar el estado del evento.");
    } finally {
      setLoading(false);
    }
  };

  const eliminarEvento = (id, name) => {
    Alert.alert(
      "🗑️ Eliminar Registro",
      `¿Estás seguro de borrar permanentemente "${name}" del mapa cultural?`,
      [
        { text: "CANCELAR", style: "cancel" },
        { text: "ELIMINAR", style: "destructive", onPress: async () => {
          setLoading(true);
          try {
            await axios.delete(`${ENDPOINTS.eventos}/${id}`);
            fetchEventos();
          } catch (e) { Alert.alert("Error", "No se pudo eliminar."); }
          finally { setLoading(false); }
        }}
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.itemCard}>
      <Image source={{ uri: item.imagen }} style={styles.itemImg} />
      
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.ciudad} • {item.provincia}</Text>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusIndicator, { backgroundColor: item.status === 'approved' ? COLORS.success : COLORS.error }]} />
          <Text style={[styles.statusText, { color: item.status === 'approved' ? COLORS.success : COLORS.error }]}>
            {item.status === 'approved' ? 'PUBLICADO' : 'OCULTO'}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.miniAction} onPress={() => setModalComentarios({ show: true, event: item })}>
            <Text style={styles.miniActionText}>💬 {item.comentarios?.length || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.miniAction} onPress={() => navigation.navigate('AdminForm', { evento: item })}>
            <Text style={styles.miniActionText}>✏️ EDITAR</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.miniAction, {backgroundColor: item.status === 'approved' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}]} 
            onPress={() => quickToggleStatus(item.id, item.status)}
          >
            <Text style={[styles.miniActionText, {color: item.status === 'approved' ? COLORS.error : COLORS.success}]}>
              {item.status === 'approved' ? 'OCULTAR' : 'ACTIVAR'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => eliminarEvento(item.id, item.name)}>
            <Text style={{fontSize: 14}}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
          <Text style={{marginRight: 10}}>🔍</Text>
          <TextInput 
            style={styles.searchInput}
            placeholder="Buscar por nombre o ciudad..."
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
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}><Text style={styles.emptyText}>Sin coincidencias en el mapa.</Text></View>
          }
        />
      )}

      {/* MODAL DE COMENTARIOS (Concepto: Conditional Rendering PDF) */}
      <Modal visible={modalComentarios.show} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reseñas de la Comunidad</Text>
              <TouchableOpacity onPress={() => setModalComentarios({ show: false, event: null })}>
                <Text style={styles.closeModal}>CERRAR ×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.commentScroll}>
               {modalComentarios.event?.comentarios?.length > 0 ? (
                 modalComentarios.event.comentarios.map(c => (
                   <View key={c.id} style={styles.commentItem}>
                     <View style={styles.commentHead}>
                       <Text style={styles.commentUser}>{c.usuario}</Text>
                       <Text style={styles.commentDate}>{c.fecha}</Text>
                     </View>
                     <Text style={styles.commentText}>{c.comentario}</Text>
                     <Text style={styles.commentStars}>{'★'.repeat(c.rating)}</Text>
                   </View>
                 ))
               ) : (
                 <Text style={styles.noComments}>Aún no hay feedback para este evento.</Text>
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
  header: { padding: 25, backgroundColor: 'rgba(255,255,255,0.02)', borderBottomWidth: 1, borderColor: COLORS.glassBorder },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '900', color: COLORS.white },
  addBtn: { backgroundColor: COLORS.violet, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10 },
  addBtnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.glass, paddingHorizontal: 15, borderRadius: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  searchInput: { flex: 1, height: 50, color: 'white' },
  list: { padding: 20, paddingBottom: 100 },
  itemCard: { flexDirection: 'row', backgroundColor: COLORS.glass, borderRadius: 25, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: COLORS.glassBorder },
  itemImg: { width: 80, height: 80, borderRadius: 15 },
  itemInfo: { flex: 1, marginLeft: 15 },
  itemName: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  itemSub: { color: COLORS.muted, fontSize: 11, marginTop: 4 },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  statusIndicator: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  actionRow: { flexDirection: 'row', marginTop: 15, gap: 8 },
  miniAction: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  miniActionText: { color: COLORS.white, fontSize: 9, fontWeight: 'bold' },
  deleteBtn: { padding: 5, marginLeft: 'auto' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { color: COLORS.muted, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: COLORS.card, borderTopLeftRadius: 35, borderTopRightRadius: 35, height: '70%', padding: 30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  closeModal: { color: COLORS.accent, fontWeight: 'bold', fontSize: 12 },
  commentScroll: { flex: 1 },
  commentItem: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, marginBottom: 15 },
  commentHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  commentUser: { color: 'white', fontWeight: 'bold', fontSize: 13 },
  commentDate: { color: COLORS.muted, fontSize: 10 },
  commentText: { color: 'rgba(255,255,255,0.6)', fontSize: 12, lineHeight: 18 },
  commentStars: { color: COLORS.accent, marginTop: 8, fontSize: 10 },
  noComments: { color: COLORS.muted, textAlign: 'center', marginTop: 40, fontStyle: 'italic' }
});
