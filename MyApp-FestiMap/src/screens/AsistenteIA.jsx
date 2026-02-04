
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
import { GoogleGenAI } from "@google/genai";
import { ENDPOINTS, GEMINI_API_KEY } from '../config/api.js';
import { useUser } from '../context/UserContext.jsx';
import { ChatBubble } from '../components/ui/ChatWidgets';

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

export default function AsistenteIA({ navigation }) {
  const { user, preferences } = useUser();
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      text: `¡Habla ${user?.nombre?.split(' ')[0] || 'pana'}! ✌️ Soy Alpi.\n\n¿Qué planes tienes para hoy en ${preferences?.provincia || 'Ecuador'}? ¡Tira el dato y te acolito con la ruta!`, 
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
        // Construimos un contexto compacto para Gemini
        const contextString = eventos.map(e => 
          `ID:${e._id || e.id}|${e.name}|${e.ciudad}|${e.provincia}|${e.fecha}|${e.categoria}|${e.precio}`
        ).join('\n');
        setEventsContext(contextString);
      } catch (e) {
        console.error("Error contexto IA", e);
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
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const systemPrompt = `
        ERES: Alpi, una alpaca experta en fiestas y turismo de Ecuador.
        CONTEXTO USUARIO: El usuario vive en ${preferences?.provincia || 'alguna parte de Ecuador'}.
        PERSONALIDAD: Divertida, usas jerga ecuatoriana (bacán, de ley, acolita). Eres amable y te encanta la comida típica.
        
        LISTA DE EVENTOS ACTUALES (MONGODB):
        ${eventsContext}

        TU TAREA: Responder la consulta del usuario. Si mencionan un lugar o interés, busca en la lista de eventos arriba y sugiere los IDs que más calcen. 
        Si el usuario pregunta algo general de Ecuador, responde con orgullo patrio.
        
        IMPORTANTE: Tu respuesta debe ser un JSON raw (sin markdown) con este formato:
        {
          "reply": "Tu respuesta aquí...",
          "suggested_ids": ["ID1", "ID2"]
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview', 
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\nUSUARIO PREGUNTA: " + textToSend }] }
        ],
        config: { responseMimeType: "application/json" }
      });

      const parsed = JSON.parse(response.text);

      const suggestions = allEvents.filter(ev => 
        parsed.suggested_ids?.includes(ev._id) || parsed.suggested_ids?.includes(ev.id)
      );

      const botMsg = { 
        id: (Date.now() + 1).toString(), 
        text: parsed.reply, 
        sender: 'bot',
        suggestions: suggestions
      };
      
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now().toString(), text: "¡Chuta! El servidor está más lento que desfile de pueblo. ¿Me lo repites?", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };

  const renderEventCard = (ev) => (
    <TouchableOpacity 
      key={ev._id || ev.id} 
      style={styles.cardContainer}
      onPress={() => navigation.navigate('Detalles', { evento: ev })}
    >
      <Image source={{ uri: ev.imagen }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <Text style={styles.cardTitle} numberOfLines={1}>{ev.name}</Text>
        <Text style={styles.cardLoc}>📍 {ev.ciudad}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Text style={styles.backIcon}>✕</Text></TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Alpi AI</Text>
          <Text style={styles.headerSub}>Tu Pana Turístico 🦙</Text>
        </View>
        <Image source={ALPI_AVATAR} style={styles.headerAvatar} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex: 1}}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={({ item }) => (
            <ChatBubble item={item} isUser={item.sender === 'user'} avatarSource={ALPI_AVATAR}>
              <Text style={styles.msgText}>{item.text}</Text>
              {item.suggestions?.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 10}}>
                  {item.suggestions.map(renderEventCard)}
                </ScrollView>
              )}
            </ChatBubble>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: 20}}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input} 
            value={input} 
            onChangeText={setInput} 
            placeholder="Pregunta por una hueca o desfile..." 
            placeholderTextColor={COLORS.textMuted}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.bg} size="small" /> : <Text style={styles.sendIcon}>🚀</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { width: 35, height: 35, borderRadius: 18, backgroundColor: COLORS.glass, alignItems: 'center', justifyContent: 'center' },
  backIcon: { color: 'white', fontWeight: 'bold' },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  headerSub: { color: COLORS.accent, fontSize: 10, fontWeight: '900' },
  headerAvatar: { width: 45, height: 45 },
  msgText: { color: 'white', fontSize: 14, lineHeight: 20 },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: 'rgba(30,41,59,0.8)', alignItems: 'center' },
  input: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 20, paddingHorizontal: 20, height: 50, color: 'white', borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.accent, marginLeft: 10, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { fontSize: 20 },
  cardContainer: { width: 140, height: 100, borderRadius: 15, overflow: 'hidden', marginRight: 10, backgroundColor: '#000' },
  cardImage: { width: '100%', height: '100%', opacity: 0.6 },
  cardOverlay: { position: 'absolute', bottom: 5, left: 10, right: 10 },
  cardTitle: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  cardLoc: { color: COLORS.accent, fontSize: 8 }
});
