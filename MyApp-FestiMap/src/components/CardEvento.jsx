
import React from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const COLORS = {
  accent: '#ffb800',
  violet: '#5b21b6',
  ink: '#0f172a',
  success: '#10b981',
  white: '#ffffff',
  muted: '#64748b',
  border: 'rgba(255,255,255,0.1)'
};

export default function CardEvento({ evento, distancia }) {
  const navigation = useNavigation();
  const { name, provincia, fecha, imagen, categoria, status } = evento;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('Detalles', { evento })}
      activeOpacity={0.95}
    >
      {/* CONTENEDOR DE IMAGEN (PROTAGONISTA) */}
      <View style={styles.imageWrapper}>
        <Image 
          source={{ uri: imagen }} 
          style={styles.image} 
          resizeMode="cover"
        />
        
        {/* OVERLAY SUPERIOR PARA BADGES */}
        <View style={styles.topOverlay}>
          <View style={styles.badgeRow}>
            {distancia ? (
              <View style={styles.distBadge}>
                <Text style={styles.distText}>{distancia.toFixed(0)} km</Text>
              </View>
            ) : (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{categoria}</Text>
              </View>
            )}
            
            <View style={{flex: 1}} />

            {status && (
              <View style={[styles.statusPoint, status === 'approved' ? styles.bgSuccess : styles.bgWarning]}>
                <Text style={styles.statusIcon}>{status === 'approved' ? '✓' : '⌛'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* GRADIENTE SUTIL INFERIOR (Simulado con View) */}
        <View style={styles.bottomImageShadow} />
      </View>

      {/* BLOQUE DE INFORMACIÓN (LIMPIO Y CLARO) */}
      <View style={styles.infoContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.dateText}>{fecha.split('-')[2] || '??'} ENE</Text>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.locRow}>
            <Text style={styles.locIcon}>📍</Text>
            <Text style={styles.locText}>{provincia}</Text>
          </View>
          
          <View style={styles.actionBtn}>
             <Text style={styles.actionText}>VER MÁS</Text>
             <Text style={styles.arrow}>→</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    marginBottom: 20,
    width: '100%',
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  imageWrapper: {
    width: '100%',
    height: 180, // Espacio dedicado a la foto
    position: 'relative',
    backgroundColor: COLORS.ink,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  bottomImageShadow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // Oscurece un poco la base de la foto
  },
  badgeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  distBadge: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  distText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  categoryBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: COLORS.ink,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusPoint: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  bgSuccess: { backgroundColor: COLORS.success },
  bgWarning: { backgroundColor: '#f59e0b' },
  statusIcon: { color: 'white', fontSize: 12, fontWeight: 'bold' },
  
  infoContainer: {
    padding: 20,
    backgroundColor: '#1e293b',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  name: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.white,
    marginRight: 10,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.accent,
    backgroundColor: 'rgba(255,184,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    textAlign: 'center',
    minWidth: 50,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  locText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.white,
    letterSpacing: 1,
    marginRight: 6,
  },
  arrow: {
    color: COLORS.accent,
    fontSize: 16,
    fontWeight: 'bold',
  }
});
