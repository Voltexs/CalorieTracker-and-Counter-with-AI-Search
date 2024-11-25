import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.5);

  useEffect(() => {
    // Animate welcome text
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Changed from 'Home' to 'MainApp'
    const timer = setTimeout(() => {
      navigation.replace('MainApp');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#FF6B6B', '#4ECDC4']}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.nameText}>Cassie</Text>
        <View style={styles.decorativeLine} />
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '300',
    letterSpacing: 2,
  },
  nameText: {
    fontSize: 48,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginTop: 10,
  },
  decorativeLine: {
    width: width * 0.3,
    height: 4,
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 2,
  },
}); 