import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

const InputField = ({ label, value, onChangeText, icon, unit = 'mm' }) => (
  <View style={styles.inputField}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <Ionicons name={icon} size={20} color={theme.colors.primary} />
      <TextInput
        style={styles.inputText}
        value={value}
        onChangeText={onChangeText}
        keyboardType="numeric"
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#999"
      />
      <Text style={styles.inputUnit}>{unit}</Text>
    </View>
  </View>
);

export default function BodyFatCalcScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [slideAnim] = useState(new Animated.Value(height));
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState('');
  const [back, setBack] = useState('');
  const [tricep, setTricep] = useState('');
  const [supraIliac, setSupraIliac] = useState('');
  const [abdomen, setAbdomen] = useState('');
  const [thigh, setThigh] = useState('');
  const [calf, setCalf] = useState('');
  const [bodyFat, setBodyFat] = useState(null);
  const [measurementModalVisible, setMeasurementModalVisible] = useState(false);
  const [measurementSlideAnim] = useState(new Animated.Value(height));
  const [chest, setChest] = useState('');
  const [waist, setWaist] = useState('');
  const [hips, setHips] = useState('');
  const [thighs, setThighs] = useState('');
  const [bicep, setBicep] = useState('');
  const [bicepFlexed, setBicepFlexed] = useState('');
  const [calves, setCalves] = useState('');
  const [measurements, setMeasurements] = useState({
    before: null,
    after: null
  });

  useEffect(() => {
    const loadBodyFat = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          if (parsedData.bodyFat) {
            setBodyFat(parsedData.bodyFat);
          }
        }
      } catch (error) {
        console.error('Error loading body fat data:', error);
      }
    };

    loadBodyFat();
  }, []);

  useEffect(() => {
    const loadMeasurements = async () => {
      try {
        const savedMeasurements = await AsyncStorage.getItem('bodyMeasurements');
        if (savedMeasurements) {
          setMeasurements(JSON.parse(savedMeasurements));
        }
      } catch (error) {
        console.error('Error loading measurements:', error);
      }
    };

    loadMeasurements();
  }, []);

  const resetInputs = () => {
    setWeight('');
    setBack('');
    setTricep('');
    setSupraIliac('');
    setAbdomen('');
    setThigh('');
    setCalf('');
    setBodyFat(null);
    setChest('');
    setWaist('');
    setHips('');
    setThighs('');
    setBicep('');
    setBicepFlexed('');
    setCalves('');
  };

  const calculateBodyFat = async () => {
    if (!weight || !back || !tricep || !supraIliac || !abdomen || !thigh || !calf) {
      return;
    }

    const sumSkinfolds = parseFloat(back) + parseFloat(tricep) + 
                        parseFloat(supraIliac) + parseFloat(abdomen) + 
                        parseFloat(thigh) + parseFloat(calf);

    let result;
    if (gender === 'male') {
      result = (0.1051 * sumSkinfolds) + 2.585;
    } else {
      result = (0.1548 * sumSkinfolds) + 3.58;
    }
    
    const finalResult = Math.max(Math.min(result, 100), 0).toFixed(1);
    setBodyFat(finalResult);

    // Save to AsyncStorage
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        const parsedData = JSON.parse(userData);
        parsedData.bodyFat = finalResult;
        await AsyncStorage.setItem('userData', JSON.stringify(parsedData));
      }
    } catch (error) {
      console.error('Error saving body fat data:', error);
    }
  };

  const saveMeasurements = async (type) => {
    const newMeasurement = {
      date: new Date().toISOString(),
      bodyFat,
      measurements: {
        weight,
        back,
        tricep,
        supraIliac,
        abdomen,
        thigh,
        calf,
        chest,
        waist,
        hips,
        thighs,
        bicep,
        bicepFlexed,
        calves
      }
    };

    const updatedMeasurements = {
      ...measurements,
      [type]: newMeasurement
    };

    setMeasurements(updatedMeasurements);
    
    try {
      await AsyncStorage.setItem('bodyMeasurements', JSON.stringify(updatedMeasurements));
    } catch (error) {
      console.error('Error saving measurements:', error);
    }
  };

  const openModal = () => {
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setModalVisible(false));
  };

  const openMeasurementModal = () => {
    setMeasurementModalVisible(true);
    Animated.spring(measurementSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const closeMeasurementModal = () => {
    Animated.timing(measurementSlideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setMeasurementModalVisible(false));
  };

  const swapMeasurements = () => {
    const updatedMeasurements = {
      before: measurements.after,
      after: measurements.before
    };
    setMeasurements(updatedMeasurements);
    AsyncStorage.setItem('bodyMeasurements', JSON.stringify(updatedMeasurements));
  };

  const deleteMeasurement = (type) => {
    const updatedMeasurements = {
      ...measurements,
      [type]: null
    };
    setMeasurements(updatedMeasurements);
    AsyncStorage.setItem('bodyMeasurements', JSON.stringify(updatedMeasurements));
  };

  const getComparisons = () => {
    if (!measurements.before || !measurements.after) return [];

    const before = measurements.before;
    const after = measurements.after;

    return [
      {
        label: 'Body Fat',
        change: (after.bodyFat - before.bodyFat).toFixed(1),
        unit: '%',
        isPositive: after.bodyFat < before.bodyFat
      },
      {
        label: 'Weight',
        change: (after.measurements.weight - before.measurements.weight).toFixed(1),
        unit: 'kg',
        isPositive: after.measurements.weight < before.measurements.weight
      },
      {
        label: 'Waist',
        change: (after.measurements.waist - before.measurements.waist).toFixed(1),
        unit: 'cm',
        isPositive: after.measurements.waist < before.measurements.waist
      },
      // Add more comparisons as needed
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <Text style={styles.title}>Body Composition</Text>
      </LinearGradient>

      <ScrollView>
        <TouchableOpacity style={styles.cardButton} onPress={openModal}>
          <View style={styles.cardContent}>
            <Ionicons name="body-outline" size={32} color={theme.colors.primary} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Body Fat Calculator</Text>
              <Text style={styles.cardSubtitle}>6-Site Skinfold Method</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cardButton} onPress={openMeasurementModal}>
          <View style={styles.cardContent}>
            <Ionicons name="fitness-outline" size={32} color={theme.colors.primary} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>Body Measurements</Text>
              <Text style={styles.cardSubtitle}>Track your progress</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Progress Tracking</Text>
          
          <View style={styles.beforeAfterContainer}>
            {['before', 'after'].map((type) => (
              <View key={type} style={styles.measurementCard}>
                <Text style={styles.measurementTitle}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
                {measurements[type] ? (
                  <>
                    <View style={styles.measurementRow}>
                      <View style={styles.measurementItem}>
                        <Text style={styles.measurementLabel}>Body Fat</Text>
                        <Text style={styles.measurementValue}>
                          {measurements[type].bodyFat}%
                        </Text>
                      </View>
                      <View style={styles.measurementItem}>
                        <Text style={styles.measurementLabel}>Weight</Text>
                        <Text style={styles.measurementValue}>
                          {measurements[type].measurements.weight} kg
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.measurementSubtitle}>Measurements</Text>
                    
                    <View style={styles.measurementGrid}>
                      {Object.entries({
                        Chest: measurements[type].measurements.chest,
                        Waist: measurements[type].measurements.waist,
                        Hips: measurements[type].measurements.hips,
                        Thighs: measurements[type].measurements.thighs,
                        Bicep: measurements[type].measurements.bicep,
                        'Bicep Flexed': measurements[type].measurements.bicepFlexed,
                        Calves: measurements[type].measurements.calves,
                      }).map(([key, value]) => (
                        <View key={key} style={styles.gridItem}>
                          <Text style={styles.gridLabel}>{key}</Text>
                          <Text style={styles.gridValue}>{value} cm</Text>
                        </View>
                      ))}
                    </View>

                    <Text style={styles.measurementDate}>
                      {new Date(measurements[type].date).toLocaleDateString()}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => deleteMeasurement(type)}
                    >
                      <Ionicons name="trash-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => {
                      saveMeasurements(type);
                      closeModal();
                    }}
                  >
                    <Ionicons name="save-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Save as {type}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          {measurements.before && measurements.after && (
            <>
              <TouchableOpacity 
                style={styles.swapButton}
                onPress={swapMeasurements}
              >
                <Ionicons name="swap-horizontal-outline" size={20} color={theme.colors.primary} />
                <Text style={styles.swapButtonText}>Swap Before/After</Text>
              </TouchableOpacity>

              <View style={styles.comparisonCard}>
                <Text style={styles.comparisonTitle}>Progress Analysis</Text>
                <View style={styles.comparisonGrid}>
                  {getComparisons().map((item, index) => (
                    <View key={index} style={styles.comparisonItem}>
                      <Text style={styles.comparisonLabel}>{item.label}</Text>
                      <View style={styles.comparisonValue}>
                        <Text style={[
                          styles.comparisonNumber,
                          item.change > 0 ? styles.increase : styles.decrease
                        ]}>
                          {item.change > 0 ? '+' : ''}{item.change}{item.unit}
                        </Text>
                        <Ionicons 
                          name={item.isPositive ? 'trending-up' : 'trending-down'} 
                          size={16} 
                          color={item.isPositive ? theme.colors.success : theme.colors.error} 
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [
                    { scale: slideAnim.interpolate({
                      inputRange: [0, height],
                      outputRange: [1, 0.3]
                    }) },
                    { translateY: slideAnim.interpolate({
                      inputRange: [0, height],
                      outputRange: [0, height/2]
                    }) }
                  ],
                  opacity: slideAnim.interpolate({
                    inputRange: [0, height],
                    outputRange: [1, 0]
                  })
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Body Fat Calculator</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.form}>
                  <View style={styles.genderButtons}>
                    <TouchableOpacity
                      style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                      onPress={() => {
                        setGender('male');
                        resetInputs();
                      }}
                    >
                      <Ionicons name="male" size={24} color={gender === 'male' ? theme.colors.primary : '#666'} />
                      <Text style={[styles.genderText, gender === 'male' && styles.genderTextActive]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
                      onPress={() => {
                        setGender('female');
                        resetInputs();
                      }}
                    >
                      <Ionicons name="female" size={24} color={gender === 'female' ? theme.colors.primary : '#666'} />
                      <Text style={[styles.genderText, gender === 'female' && styles.genderTextActive]}>Female</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.measurementsContainer}>
                    <InputField label="Weight" value={weight} onChangeText={setWeight} icon="scale" unit="kg" />
                    <InputField label="Back Skinfold" value={back} onChangeText={setBack} icon="body" />
                    <InputField label="Tricep Skinfold" value={tricep} onChangeText={setTricep} icon="body" />
                    <InputField label="Supra Iliac Skinfold" value={supraIliac} onChangeText={setSupraIliac} icon="body" />
                    <InputField label="Abdomen Skinfold" value={abdomen} onChangeText={setAbdomen} icon="body" />
                    <InputField label="Thigh Skinfold" value={thigh} onChangeText={setThigh} icon="body" />
                    <InputField label="Calf Skinfold" value={calf} onChangeText={setCalf} icon="body" />
                  </View>

                  <TouchableOpacity 
                    style={styles.calculateButton} 
                    onPress={() => {
                      calculateBodyFat();
                      if (bodyFat !== null) {
                        closeModal();
                      }
                    }}
                  >
                    <Text style={styles.calculateButtonText}>Calculate Body Fat</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={measurementModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMeasurementModal}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.modalOverlay}>
            <Animated.View 
              style={[
                styles.modalContent,
                {
                  transform: [
                    { scale: measurementSlideAnim.interpolate({
                      inputRange: [0, height],
                      outputRange: [1, 0.3]
                    }) },
                    { translateY: measurementSlideAnim.interpolate({
                      inputRange: [0, height],
                      outputRange: [0, height/2]
                    }) }
                  ],
                  opacity: measurementSlideAnim.interpolate({
                    inputRange: [0, height],
                    outputRange: [1, 0]
                  })
                }
              ]}
            >
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={closeMeasurementModal}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Body Measurements</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView style={styles.modalScroll}>
                <View style={styles.measurementsContainer}>
                  <InputField label="Chest" value={chest} onChangeText={setChest} icon="fitness" unit="cm" />
                  <InputField label="Waist" value={waist} onChangeText={setWaist} icon="fitness" unit="cm" />
                  <InputField label="Hips" value={hips} onChangeText={setHips} icon="fitness" unit="cm" />
                  <InputField label="Thighs" value={thighs} onChangeText={setThighs} icon="fitness" unit="cm" />
                  <InputField label="Bicep" value={bicep} onChangeText={setBicep} icon="fitness" unit="cm" />
                  <InputField label="Bicep Flexed" value={bicepFlexed} onChangeText={setBicepFlexed} icon="fitness" unit="cm" />
                  <InputField label="Calves" value={calves} onChangeText={setCalves} icon="fitness" unit="cm" />
                </View>

                <TouchableOpacity 
                  style={styles.calculateButton} 
                  onPress={() => {
                    // Save measurements logic here
                    closeMeasurementModal();
                  }}
                >
                  <Text style={styles.calculateButtonText}>Save Measurements</Text>
                </TouchableOpacity>
              </ScrollView>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
    ...theme.shadows.medium,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  form: {
    paddingBottom: 20,
  },
  measurementsContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  genderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  genderButtonActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#f0fffd',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  genderTextActive: {
    color: theme.colors.primary,
  },
  inputField: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(78,205,196,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  inputUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  calculateButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
    ...theme.shadows.small,
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    padding: 24,
    ...theme.shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  modalScroll: {
    flexGrow: 1,
  },
  cardButton: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardText: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  beforeAfterContainer: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    ...theme.shadows.medium,
  },
  measurementCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...theme.shadows.medium,
  },
  measurementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
  measurementRow: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 16,
    marginBottom: 20,
    gap: 30,
  },
  measurementItem: {
    flex: 1,
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  measurementValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  measurementGrid: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 16,
  },
  gridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  gridLabel: {
    fontSize: 14,
    color: '#666',
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  measurementSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginTop: 8,
  },
  measurementDate: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    padding: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  swapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
  },
  swapButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  comparisonCard: {
    margin: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.medium,
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  comparisonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  comparisonItem: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  comparisonLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  comparisonValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  comparisonNumber: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  increase: {
    color: theme.colors.error,
  },
  decrease: {
    color: theme.colors.success,
  }
}); 