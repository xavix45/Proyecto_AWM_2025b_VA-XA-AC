
import React, { useEffect, useRef } from 'react';
import { View, Text, Image, Animated, StyleSheet } from 'react-native';

const COLORS = {
  userBubble: '#6366f1',
  alpiBubble: '#334155',
  accent: '#ffb800',
  white: '#ffffff',
  glass: 'rgba(255,255,255,0.05)',
  border: 'rgba(255,255,255,0.1)'
};

export const ChatBubble = ({ item, isUser, avatarSource, children }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  }, []);

  return (
    <Animated.View style={{ 
      opacity: opacityAnim, 
      transform: [{ scale: scaleAnim }],
      alignSelf: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 20,
      flexDirection: 'row',
      maxWidth: '85%',
      alignItems: 'flex-end'
    }}>
      {!isUser && (
        <View style={styles.avatarContainer}>
          <Image source={avatarSource} style={styles.avatarImg} />
        </View>
      )}
      <View style={[styles.bubbleContent, isUser ? styles.bubbleUser : styles.bubbleAlpi]}>
        {!isUser && <Text style={styles.senderName}>Alpi 🦙</Text>}
        {children}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: { marginRight: 8, paddingBottom: 5 },
  avatarImg: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.glass },
  bubbleContent: { padding: 14, borderRadius: 22, minWidth: 100 },
  bubbleUser: { backgroundColor: COLORS.userBubble, borderBottomRightRadius: 4, borderTopRightRadius: 22, marginLeft: 50 },
  bubbleAlpi: { backgroundColor: COLORS.alpiBubble, borderTopLeftRadius: 4, borderBottomLeftRadius: 22, borderWidth: 1, borderColor: COLORS.border },
  senderName: { color: COLORS.accent, fontSize: 10, fontWeight: '900', marginBottom: 6 },
});
