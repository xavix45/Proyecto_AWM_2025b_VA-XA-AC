
import React from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator.jsx'; 
import { AgendaProvider } from './src/context/AgendaContext.jsx';
import { UserProvider } from './src/context/UserContext.jsx';

export default function App() {
  return (
    <UserProvider>
      <AgendaProvider>
        <NavigationContainer>
          {/* Se oculta la barra del sistema (hora, batería) para visión total */}
          <StatusBar hidden={true} />
          <AppNavigator />
        </NavigationContainer>
      </AgendaProvider>
    </UserProvider>
  );
}
