import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const loadUserName = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const { name } = JSON.parse(userData);
          setUserName(name);
          navigation.replace('MainApp');
        } else {
          navigation.replace('UserProfileInput', { isEditing: false });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        navigation.replace('UserProfileInput', { isEditing: false });
      }
    };

    loadUserName();
  }, []);

  return (
    <LinearGradient
      colors={['#4ECDC4', '#2E8B57']}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.nameText}>{userName || ''}</Text>
        <View style={styles.decorativeLine} />
      </View>
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