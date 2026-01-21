
import React, { useEffect, useRef } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, Platform, Animated, Dimensions, TouchableOpacity } from 'react-native';

import Landing from '../screens/Landing.jsx';
import Login from '../screens/Login.jsx';
import Registro from '../screens/Registro.jsx';
import Ubicacion from '../screens/Ubicacion.jsx';
import Intereses from '../screens/Intereses.jsx';
import Home from '../screens/Home.jsx';
import Resultados from '../screens/Resultados.jsx';
import Detalles from '../screens/Detalles.jsx';
import Agenda from '../screens/Agenda.jsx';
import PlanViaje from '../screens/PlanViaje.jsx';
import Perfil from '../screens/Perfil.jsx';
import AdminDashboard from '../screens/AdminDashboard.jsx';
import AdminList from '../screens/AdminList.jsx';
import AdminForm from '../screens/AdminForm.jsx';
import AdminStats from '../screens/AdminStats.jsx';
import AsistenteIA from '../screens/AsistenteIA.jsx';

const { width } = Dimensions.get('window');
const MARGIN = 20;
const DOCK_WIDTH = width - (MARGIN * 2);
const TAB_WIDTH = DOCK_WIDTH / 4;

const COLORS = {
  accent: '#ffb800', 
  primary: '#8b5cf6', 
  ink: '#020617',    
  white: '#ffffff',
  glass: 'rgba(15, 23, 42, 0.92)',
  glassBorder: 'rgba(255,255,255,0.1)'
};

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function CustomTabBar({ state, descriptors, navigation }) {
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scrollX, {
      toValue: state.index * TAB_WIDTH,
      friction: 8,
      tension: 50,
      useNativeDriver: true
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.dock}>
        <Animated.View style={[styles.blob, { transform: [{ translateX: scrollX }] }]}>
          <View style={styles.blobInner} />
        </Animated.View>

        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          const emojiMap = { InicioTab: "🏠", PlanTab: "🧭", AgendaTab: "📅", PerfilTab: "👤" };
          const labelMap = { InicioTab: "INICIO", PlanTab: "RUTA", AgendaTab: "AGENDA", PerfilTab: "PERFIL" };

          return (
            <TouchableOpacity key={index} onPress={onPress} style={styles.tabItem} activeOpacity={0.7}>
              <Text style={[styles.emoji, { opacity: isFocused ? 1 : 0.5 }]}>{emojiMap[route.name]}</Text>
              <Text style={[styles.label, { color: isFocused ? COLORS.accent : 'rgba(255,255,255,0.4)' }]}>{labelMap[route.name]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={props => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="InicioTab" component={Home} />
      <Tab.Screen name="PlanTab" component={PlanViaje} />
      <Tab.Screen name="AgendaTab" component={Agenda} />
      <Tab.Screen name="PerfilTab" component={Perfil} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator 
      initialRouteName="Landing" 
      screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.ink },
        animation: 'fade_from_bottom',
        headerStyle: { 
          backgroundColor: COLORS.ink,
          height: Platform.OS === 'ios' ? 70 : 55, 
        },
        headerTitleAlign: 'center',
        headerTintColor: COLORS.accent, 
        headerTitleStyle: { 
          fontWeight: '900', 
          fontSize: 10, 
          letterSpacing: 2,
          textTransform: 'uppercase'
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false
      }}
    >
      <Stack.Screen name="Landing" component={Landing} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Registro" component={Registro} />
      <Stack.Screen name="Ubicacion" component={Ubicacion} />
      <Stack.Screen name="Intereses" component={Intereses} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Resultados" component={Resultados} />
      <Stack.Screen name="Detalles" component={Detalles} />
      
      {/* Pantalla IA */}
      <Stack.Screen 
        name="AsistenteIA" 
        component={AsistenteIA} 
        options={{ 
          animation: 'slide_from_right', // Animación diferente para sentir que es un "chat"
          headerShown: false 
        }} 
      />
      
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} options={{ headerShown: true, title: '• CONTROL MAESTRO •' }} />
      <Stack.Screen name="AdminList" component={AdminList} options={{ headerShown: true, title: '• INVENTARIO CULTURAL •' }} />
      <Stack.Screen name="AdminForm" component={AdminForm} options={{ headerShown: true, title: '• EDITOR DE PATRIMONIO •' }} />
      <Stack.Screen name="AdminStats" component={AdminStats} options={{ headerShown: true, title: '• ANALYTICS ENGINE •' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: { position: 'absolute', bottom: Platform.OS === 'ios' ? 35 : 25, width: '100%', alignItems: 'center', paddingHorizontal: MARGIN },
  dock: { width: DOCK_WIDTH, height: 70, backgroundColor: COLORS.glass, borderRadius: 35, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.glassBorder, elevation: 20 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  emoji: { fontSize: 20, marginBottom: 2 },
  label: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  blob: { position: 'absolute', width: TAB_WIDTH, height: '100%', alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  blobInner: { width: '80%', height: '70%', backgroundColor: 'rgba(139, 92, 246, 0.25)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 184, 0, 0.2)' }
});
