import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  StatusBar,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import axios from 'axios';

import { ENDPOINTS, GROQ_API_KEY } from '../config/api.js'; 
import { useUser } from '../context/UserContext.jsx';
import { ChatBubble } from '../components/ui/ChatWidgets.jsx';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800', 
  bg: '#0f172a',      
  white: '#ffffff',
  inputBg: '#1e293b',
  textMuted: '#94a3b8',
  glass: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)'
};

const ALPI_AVATAR = require('../../alpi.png');

// Modelos disponibles de Groq (actualizados)
const GROQ_MODELS = {
  primary: 'llama-3.3-70b-versatile',
  fallback: 'llama-3.1-8b-instant'
};

export default function AsistenteIA({ navigation }) {
  const { user, preferences } = useUser();
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      text: `¡Hola ${user?.nombre?.split(' ')[0] || 'Explorador'}! ✌️ Soy Alpi.\n\nLa alpaca más fiestera de los Andes. Conozco las mejores "huecas" y festivales en ${preferences?.provincia || 'Ecuador'}. ¿Qué plan buscamos hoy?`, 
      sender: 'bot',
      suggestions: [] 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [eventsContext, setEventsContext] = useState('');
  
  const flatListRef = useRef();

  useEffect(() => {
    const buildContext = async () => {
      try {
        const res = await axios.get(ENDPOINTS.eventos);
        const eventos = res.data;
        setAllEvents(eventos);
        const contextString = eventos.map(e => 
          `ID:${e._id || e.id}|NAME:${e.name}|UBICACIÓN:${e.ciudad},${e.provincia}|CATEGORÍA:${e.categoria}|PRECIO:${e.precio}`
        ).join('\n');
        setEventsContext(contextString);
      } catch (e) {
        console.error("Error cargando contexto de eventos para Alpi:", e);
      }
    };
    buildContext();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const textToSend = input;
    setInput(''); 
    
    const userMsg = { id: Date.now().toString(), text: textToSend, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      console.log("🦙 Conectando Alpi con Groq API...");

      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

      const systemPrompt = `Eres Alpi, una alpaca ecuatoriana experta en turismo. Tu tono es joven, divertido y usas jerga local (bacán, de una, pana, acolita) y emojis. El usuario está en ${preferences?.provincia || 'Ecuador'}.

EVENTOS DISPONIBLES:
${eventsContext}

Tu objetivo es responder de forma amigable y recomendar eventos si es relevante. Mantén tu respuesta corta (máximo 2 oraciones) y siempre en español.`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: GROQ_MODELS.primary, // ✅ MODELO ACTUALIZADO
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: textToSend }
          ],
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error?.message || 'Error desconocido'}`);
      }

      const data = await response.json();
      console.log("✅ Respuesta Groq recibida");
      
      if (data.error) {
        throw new Error(`API Error: ${data.error.message}`);
      }

      const responseText = data.choices?.[0]?.message?.content || "No pude responder";
      console.log("💬 Respuesta Alpi:", responseText);

      // Buscar IDs de eventos mencionados
      const suggested_ids = [];
      allEvents.forEach(ev => {
        if (responseText.includes(ev.name) || responseText.includes(ev._id)) {
          suggested_ids.push(ev._id);
        }
      });
      
      const suggestions = allEvents.filter(ev => suggested_ids.includes(ev._id));

      const botMsg = { 
        id: (Date.now() + 1).toString(), 
        text: responseText, 
        sender: 'bot',
        suggestions: suggestions
      };
      
      setMessages(prev => [...prev, botMsg]);

    } catch (error) {
      console.error("❌ Error DETALLADO:", error);
      
      let errorMessage = '¡Chuta! Hubo un problema conectando con Alpi. ';
      
      if (error.message.includes('decommissioned')) {
        errorMessage += 'El modelo de IA está desactualizado. Contacta al desarrollador.';
      } else if (error.message.includes('API Error')) {
        errorMessage += error.message;
      } else if (error.message.includes('Network')) {
        errorMessage += 'Verifica tu conexión a internet.';
      } else {
        errorMessage += 'Intenta de nuevo en un momento.';
      }
      
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        text: errorMessage, 
        sender: 'bot' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const renderEventCard = (ev) => (
    <TouchableOpacity 
      key={ev._id || ev.id} 
      style={styles.cardContainer}
      onPress={() => navigation.navigate('Detalles', { evento: ev })}
      activeOpacity={0.9}
    >
      <Image source={{ uri: ev.imagen }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={1}>{ev.name}</Text>
        <Text style={styles.cardDate}>📅 {ev.fecha || 'Próx'} • {ev.ciudad}</Text>
        <View style={styles.cardBtn}><Text style={styles.cardBtnText}>→</Text></View>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }) => {
    const isUser = item.sender === 'user';
    return (
      <ChatBubble item={item} isUser={isUser} avatarSource={ALPI_AVATAR}>
        <Text style={styles.msgText}>{item.text}</Text>
        
        {item.suggestions && item.suggestions.length > 0 && (
          <View style={{ marginTop: 12 }}>
            <Text style={styles.suggestLabel}>Checa estos planes pana 👇</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              style={{ marginHorizontal: -10 }} 
              contentContainerStyle={{ paddingHorizontal: 10 }}
            >
              {item.suggestions.map(renderEventCard)}
            </ScrollView>
          </View>
        )}
      </ChatBubble>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>✕</Text>
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <View style={styles.onlineIndicator} />
          <Text style={styles.headerTitle}>Alpi AI</Text>
          <Text style={styles.headerSub}>Tu Pana de Viajes 🕶️</Text>
        </View>
        
        <View style={styles.headerAvatarFrame}>
           <Image source={ALPI_AVATAR} style={styles.headerAvatar} />
        </View>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardArea}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator size="small" color={COLORS.accent} />
            <Text style={styles.typingText}>Alpi está pensando bacán...</Text>
          </View>
        )}

        <View style={styles.inputWrapper}>
          <View style={styles.inputGlass}>
            <TextInput
              style={styles.textInput}
              placeholder="Habla con Alpi..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              maxLength={200}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
              onPress={handleSend}
              disabled={!input.trim() || loading}
            >
              <Image 
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/60/60525.png' }} 
                style={[styles.sendIconImg, { tintColor: COLORS.bg }]} 
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 45 : 10, paddingBottom: 15,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
    backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 10
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: COLORS.glass },
  backIcon: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { color: COLORS.white, fontSize: 18, fontWeight: '900' },
  headerSub: { color: COLORS.accent, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  onlineIndicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', position: 'absolute', left: 45, top: 8 },
  headerAvatarFrame: { 
    width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.glass, 
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.accent 
  },
  headerAvatar: { width: 38, height: 38 },
  keyboardArea: { flex: 1 },
  listContent: { paddingHorizontal: 15, paddingBottom: 20, paddingTop: 20 },
  msgText: { color: COLORS.white, fontSize: 15, lineHeight: 22 },
  suggestLabel: { color: COLORS.textMuted, fontSize: 11, fontStyle: 'italic', marginBottom: 10, marginTop: 5 },
  cardContainer: { width: 200, height: 160, borderRadius: 18, marginRight: 12, overflow: 'hidden', backgroundColor: '#000', borderWidth: 1, borderColor: COLORS.border },
  cardImage: { width: '100%', height: '100%', opacity: 0.8 },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, backgroundColor: 'rgba(0,0,0,0.7)' },
  cardTitle: { color: 'white', fontWeight: 'bold', fontSize: 13, marginBottom: 2 },
  cardDate: { color: COLORS.accent, fontSize: 10 },
  cardBtn: { position: 'absolute', right: 10, bottom: 10, backgroundColor: COLORS.accent, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardBtnText: { color: COLORS.bg, fontWeight: 'bold', fontSize: 12 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', marginLeft: 60, marginBottom: 15 },
  typingText: { color: COLORS.textMuted, fontSize: 12, marginLeft: 8, fontStyle: 'italic' },
  inputWrapper: { padding: 12, backgroundColor: COLORS.bg, borderTopWidth: 1, borderTopColor: COLORS.border },
  inputGlass: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBg,
    borderRadius: 28, paddingHorizontal: 6, paddingVertical: 6, borderWidth: 1, borderColor: COLORS.border
  },
  textInput: { flex: 1, color: COLORS.white, paddingHorizontal: 15, paddingVertical: 10, fontSize: 16, maxHeight: 100 },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent,
    alignItems: 'center', justifyContent: 'center', marginLeft: 5, elevation: 5
  },
  sendBtnDisabled: { backgroundColor: COLORS.glass, elevation: 0 },
  sendIconImg: { width: 20, height: 20, resizeMode: 'contain' }
});