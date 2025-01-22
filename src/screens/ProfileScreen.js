import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import * as ImagePicker from 'expo-image-picker';

const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [scrollY] = useState(new Animated.Value(0));
  const [avatarUri, setAvatarUri] = useState(null);
  const calorieWarningAnim = useRef(new Animated.Value(1)).current;
  const [streak, setStreak] = useState(0);
  const fireballAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadUserData();
    
    // Add focus listener to reload data when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });

    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (userData?.nutritionGoals?.calories) {
      const isOverLimit = Number(userData.nutritionGoals.calories - 200) > userData.nutritionGoals.calories;
      
      if (isOverLimit) {
        Animated.sequence([
          Animated.timing(calorieWarningAnim, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true
          }),
          Animated.timing(calorieWarningAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true
          })
        ]).start();
      }
    }
  }, [userData?.nutritionGoals?.calories]);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserData(parsedData);
        // Set avatar URI from stored user data
        if (parsedData.avatarUri) {
          setAvatarUri(parsedData.avatarUri);
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('UserProfileInput', { 
      isEditing: true,
      userData: userData 
    });
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant permission to access your photos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
      // Save the avatar URI with other user data
      const updatedUserData = { ...userData, avatarUri: result.assets[0].uri };
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
    }
  };

  const checkDailyGoals = (totals) => {
    // Allow for ±100 calories from target range
    const caloriesInRange = totals.calories >= (userData?.nutritionGoals?.calories - 300) && 
                           totals.calories <= (userData?.nutritionGoals?.calories + 100);
    
    // Allow for ±20g protein from target range
    const proteinInRange = totals.protein >= (userData?.nutritionGoals?.protein - 40) && 
                          totals.protein <= (userData?.nutritionGoals?.protein + 20);
    
    return caloriesInRange && proteinInRange;
  };

  const loadStreak = async () => {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      if (!history) {
        setStreak(0);
        return;
      }

      const parsedHistory = JSON.parse(history);
      const today = new Date();
      let currentStreak = 0;
      
      // Check consecutive days backwards from yesterday
      for (let i = 1; i <= 999; i++) { // Cap at 100 days to avoid infinite loops
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateKey = date.toISOString().split('T')[0];
        
        const dayData = parsedHistory[dateKey];
        
        // Check if day had meals and met goals
        if (dayData?.totals && checkDailyGoals(dayData.totals)) {
          currentStreak++;
        } else {
          break; // Break the streak if a day was missed
        }
      }
      
      setStreak(currentStreak);
      
      // Animate fireball if streak exists
      if (currentStreak > 0) {
        animateFireball();
      }
    } catch (error) {
      console.error('Error loading streak:', error);
    }
  };

  const animateFireball = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fireballAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(fireballAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const updateStreak = async (totals) => {
    if (checkDailyGoals(totals)) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      await AsyncStorage.setItem('streakData', JSON.stringify({
        currentStreak: newStreak,
        lastUpdate: new Date().toISOString()
      }));
      animateFireball();
    }
  };

  useEffect(() => {
    loadStreak();
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
      loadStreak();
    });
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.headerGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatarInner}>
                {avatarUri ? (
                  <Image 
                    source={{ uri: avatarUri }} 
                    style={styles.avatarImage} 
                  />
                ) : (
                  <Ionicons name="person" size={40} color="#fff" />
                )}
              </View>
              <TouchableOpacity 
                style={styles.editAvatarButton} 
                onPress={pickImage}
              >
                <Ionicons name="camera" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>{userData?.name || 'User'}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={18} color="#fff" />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(78,205,196,0.1)', 'rgba(78,205,196,0.05)']}
                style={styles.statGradient}
              >
                <Ionicons name="flame" size={24} color={theme.colors.primary} />
                <Animated.Text style={[
                  styles.statValue,
                  userData?.nutritionGoals?.calories && 
                  Number(userData.nutritionGoals.calories - 200) > userData.nutritionGoals.calories && {
                    color: '#FF6B6B',
                    transform: [{ scale: calorieWarningAnim }],
                    textShadowColor: 'rgba(255, 107, 107, 0.3)',
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 10
                  }
                ]}>
                  {userData?.nutritionGoals?.calories 
                    ? `${userData.nutritionGoals.calories - 200}`
                    : '-'}
                </Animated.Text>
                <Text style={styles.statLabel}>Daily Target</Text>
                <Text style={styles.statMax}>
                  Max: {userData?.nutritionGoals?.calories || '-'}
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(78,205,196,0.1)', 'rgba(78,205,196,0.05)']}
                style={styles.statGradient}
              >
                <Ionicons name="barbell" size={24} color={theme.colors.primary} />
                <Text style={styles.statValue}>
                  {userData?.nutritionGoals?.protein 
                    ? `${userData.nutritionGoals.protein - 20}g`
                    : '-'}
                </Text>
                <Text style={styles.statLabel}>Protein Target</Text>
                <Text style={styles.statMax}>
                  Max: {userData?.nutritionGoals?.protein || '-'}g
                </Text>
              </LinearGradient>
            </View>
          </View>

          <View style={styles.streakContainer}>
            <Animated.View style={[
              styles.fireballContainer,
              { transform: [{ scale: fireballAnim }] }
            ]}>
              <LinearGradient
                colors={['#FF6B6B', '#FFB84D']}
                style={styles.fireball}
              >
                <Ionicons name="flame" size={32} color="#fff" />
              </LinearGradient>
            </Animated.View>
            <View style={styles.streakInfo}>
              <Text style={styles.streakCount}>{streak}</Text>
              <Text style={styles.streakLabel}>Day Streak!</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="body" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Height</Text>
                    <Text style={styles.infoValue}>{userData?.height || '-'} cm</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="scale" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Weight</Text>
                    <Text style={styles.infoValue}>{userData?.weight || '-'} kg</Text>
                  </View>
                </View>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Ionicons name="person" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Gender</Text>
                    <Text style={styles.infoValue}>{userData?.gender || '-'}</Text>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="fitness" size={20} color={theme.colors.primary} />
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>BMI</Text>
                    <Text style={styles.infoValue}>
                      {userData?.height && userData?.weight 
                        ? (userData.weight / Math.pow(userData.height/100, 2)).toFixed(1)
                        : '-'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 50,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    marginBottom: 16,
    position: 'relative',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    backgroundColor: '#f8f9fa',
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 40,
    gap: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    ...theme.shadows.small,
  },
  statGradient: {
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginTop: 12,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statMax: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  infoSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 20,
    ...theme.shadows.small,
  },
  fireballContainer: {
    marginRight: 16,
  },
  fireball: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  streakInfo: {
    flex: 1,
  },
  streakCount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  streakLabel: {
    fontSize: 14,
    color: '#666',
  },
  targetCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    ...theme.shadows.medium,
  },
  targetItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  targetValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  targetLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  targetUnit: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#eee',
    alignSelf: 'stretch',
    marginVertical: 8,
  },
}); 