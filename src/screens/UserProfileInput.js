import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';

const { width } = Dimensions.get('window');

const ActivityOption = ({ label, description, isSelected, onSelect }) => (
  <TouchableOpacity 
    style={[styles.activityOption, isSelected && styles.activityOptionSelected]} 
    onPress={onSelect}
  >
    <View style={styles.activityHeader}>
      <Text style={[styles.activityLabel, isSelected && styles.activityLabelSelected]}>
        {label}
      </Text>
      {isSelected && <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />}
    </View>
    <Text style={[styles.activityDescription, isSelected && styles.activityDescriptionSelected]}>
      {description}
    </Text>
  </TouchableOpacity>
);

const GoalOption = ({ label, description, icon, isSelected, onSelect }) => (
  <TouchableOpacity 
    style={[styles.goalOption, isSelected && styles.goalOptionSelected]} 
    onPress={onSelect}
  >
    <View style={styles.goalContent}>
      <View style={styles.goalIconContainer}>
        <LinearGradient
          colors={isSelected ? [theme.colors.primary, theme.colors.secondary] : ['#f0f0f0', '#f0f0f0']}
          style={styles.goalIcon}
        >
          <Ionicons name={icon} size={20} color={isSelected ? '#fff' : '#666'} />
        </LinearGradient>
        <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
          {label}
        </Text>
      </View>
      {isSelected && <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />}
    </View>
    <Text style={[styles.goalDescription, isSelected && styles.goalDescriptionSelected]} numberOfLines={2}>
      {description}
    </Text>
  </TouchableOpacity>
);

const InputField = ({ label, value, onChangeText, placeholder, unit }) => (
  <View style={styles.inputField}>
    <Text style={styles.inputLabel}>{label}</Text>
    <View style={styles.inputWrapper}>
      <TextInput
        style={styles.inputText}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#999"
        keyboardType="numeric"
      />
      {unit && <Text style={styles.inputUnit}>{unit}</Text>}
    </View>
  </View>
);

const CalculationMethodSelector = ({ calculationMethod, setCalculationMethod }) => (
  <View style={styles.inputContainer}>
    <Text style={styles.label}>Choose Calculation Method:</Text>
    <View style={styles.radioContainer}>
      <TouchableOpacity 
        style={[
          styles.radioButton, 
          calculationMethod === 'mifflin' && styles.radioButtonSelected
        ]}
        onPress={() => setCalculationMethod('mifflin')}
      >
        <Text>Mifflin-St Jeor</Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.radioButton, 
          calculationMethod === 'nippard' && styles.radioButtonSelected
        ]}
        onPress={() => setCalculationMethod('nippard')}
      >
        <Text>Jeff Nippard</Text>
      </TouchableOpacity>
    </View>
  </View>
);

export default function UserProfileInput({ navigation, route }) {
  const isEditing = route.params?.isEditing || false;
  const existingData = route.params?.userData || {};

  const [name, setName] = useState(existingData.name || '');
  const [age, setAge] = useState(existingData.age?.toString() || '');
  const [height, setHeight] = useState(existingData.height?.toString() || '');
  const [weight, setWeight] = useState(existingData.weight?.toString() || '');
  const [gender, setGender] = useState(existingData.gender || '');
  const [activityLevel, setActivityLevel] = useState(existingData.activityLevel || 'moderate');
  const [goal, setGoal] = useState(existingData.goal || 'maintain');
  const [calculationMethod, setCalculationMethod] = useState('mifflin');

  const calculateBMR = (weight, height, age, gender) => {
    // Mifflin-St Jeor Equation with more precise coefficients
    const bmr = gender === 'male'
      ? (10 * weight) + (6.25 * height) - (5 * age) + 5
      : (10 * weight) + (6.25 * height) - (5 * age) - 161;
    return Math.round(bmr);
  };

  const getActivityMultiplier = (level) => {
    const multipliers = {
      sedentary: 1.2,    // Little or no exercise
      light: 1.375,      // Exercise 1-3 days/week
      moderate: 1.55,    // Exercise 3-5 days/week
      active: 1.725,     // Exercise 6-7 days/week
      veryActive: 1.9    // Hard exercise daily
    };
    return multipliers[level];
  };

  const calculateNutritionGoals = (weight, height, age, gender, activity, goal) => {
    if (calculationMethod === 'nippard') {
      // Jeff Nippard's method
      const weightInLbs = weight * 2.20462;
      
      // Calculate base calories (bodyweight in lbs × 10)
      const baseCalories = Math.round(weightInLbs * 10);
      
      // Adjust calories based on goal
      let calorieGoal;
      switch(goal) {
        case 'cut':
          calorieGoal = Math.round(baseCalories * 0.8);
          break;
        case 'bulk':
          calorieGoal = Math.round(baseCalories * 1.1);
          break;
        default:
          calorieGoal = baseCalories;
      }

      const proteinGoal = Math.round(weightInLbs);
      const fatGoal = 50;
      const proteinCals = proteinGoal * 4;
      const fatCals = fatGoal * 9;
      const remainingCals = calorieGoal - proteinCals - fatCals;
      const carbsGoal = Math.round(remainingCals / 4);

      return {
        calories: calorieGoal,
        protein: proteinGoal,
        carbs: carbsGoal,
        fat: fatGoal
      };
    } else {
      // Mifflin-St Jeor method
      const bmr = calculateBMR(weight, height, age, gender);
      const tdee = Math.round(bmr * getActivityMultiplier(activity));
      
      let calorieGoal;
      switch(goal) {
        case 'cut':
          calorieGoal = Math.round(tdee * 0.8);
          break;
        case 'bulk':
          calorieGoal = Math.round(tdee * 1.1);
          break;
        default:
          calorieGoal = tdee;
      }

      const proteinPerKg = {
        cut: 2.2,
        maintain: 1.6,
        bulk: 2.0
      };

      const carbsPerKg = {
        cut: 3.5,
        maintain: 4.5,
        bulk: 6.0
      };

      const proteinGoal = Math.round(weight * proteinPerKg[goal]);
      const carbsGoal = Math.round(weight * carbsPerKg[goal]);
      
      const proteinCals = proteinGoal * 4;
      const carbsCals = carbsGoal * 4;
      const remainingCals = calorieGoal - proteinCals - carbsCals;
      const fatGoal = Math.max(Math.round(remainingCals / 9), Math.round(weight * 0.8));

      return {
        calories: calorieGoal,
        protein: proteinGoal,
        carbs: carbsGoal,
        fat: fatGoal
      };
    }
  };

  const handleSubmit = async () => {
    if (!name || !age || !height || !weight || !gender || !activityLevel || !goal) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const nutritionGoals = calculateNutritionGoals(
      parseFloat(weight),
      parseFloat(height),
      parseInt(age),
      gender,
      activityLevel,
      goal
    );

    const userData = {
      name,
      age: parseInt(age),
      height: parseFloat(height),
      weight: parseFloat(weight),
      gender,
      activityLevel,
      goal,
      nutritionGoals,
      calculationMethod
    };

    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      navigation.replace('MainApp');
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save your information');
    }
  };

  return (
    <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Your Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.genderButtons}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive
                ]}
                onPress={() => setGender('male')}
              >
                <Ionicons 
                  name="male" 
                  size={24} 
                  color={gender === 'male' ? '#4ECDC4' : '#666'} 
                />
                <Text style={[
                  styles.genderText,
                  gender === 'male' && styles.genderTextActive
                ]}>Male</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive
                ]}
                onPress={() => setGender('female')}
              >
                <Ionicons 
                  name="female" 
                  size={24} 
                  color={gender === 'female' ? '#4ECDC4' : '#666'} 
                />
                <Text style={[
                  styles.genderText,
                  gender === 'female' && styles.genderTextActive
                ]}>Female</Text>
              </TouchableOpacity>
            </View>

            <CalculationMethodSelector 
              calculationMethod={calculationMethod} 
              setCalculationMethod={setCalculationMethod} 
            />

            <View style={styles.measurementsContainer}>
              <InputField
                label="Height"
                value={height}
                onChangeText={setHeight}
                placeholder="175"
                unit="cm"
              />
              <InputField
                label="Weight"
                value={weight}
                onChangeText={setWeight}
                placeholder="70"
                unit="kg"
              />
              <InputField
                label="Age"
                value={age}
                onChangeText={setAge}
                placeholder="25"
                unit="years"
              />
            </View>

            <Text style={styles.sectionTitle}>Activity Level</Text>
            <View style={styles.activityContainer}>
              <ActivityOption
                label="Sedentary"
                description="Little or no exercise, desk job"
                isSelected={activityLevel === 'sedentary'}
                onSelect={() => setActivityLevel('sedentary')}
              />
              <ActivityOption
                label="Light"
                description="Light exercise 1-3 days/week"
                isSelected={activityLevel === 'light'}
                onSelect={() => setActivityLevel('light')}
              />
              <ActivityOption
                label="Moderate"
                description="Moderate exercise 3-5 days/week"
                isSelected={activityLevel === 'moderate'}
                onSelect={() => setActivityLevel('moderate')}
              />
              <ActivityOption
                label="Active"
                description="Heavy exercise 6-7 days/week"
                isSelected={activityLevel === 'active'}
                onSelect={() => setActivityLevel('active')}
              />
              <ActivityOption
                label="Very Active"
                description="Very heavy exercise, physical job"
                isSelected={activityLevel === 'veryActive'}
                onSelect={() => setActivityLevel('veryActive')}
              />
            </View>

            <Text style={styles.sectionTitle}>Your Goal</Text>
            <View style={styles.goalsContainer}>
              <GoalOption
                label="Cut"
                description="Lose fat while maintaining muscle"
                icon="trending-down"
                isSelected={goal === 'cut'}
                onSelect={() => setGoal('cut')}
              />
              <GoalOption
                label="Maintain"
                description="Maintain current weight"
                icon="fitness"
                isSelected={goal === 'maintain'}
                onSelect={() => setGoal('maintain')}
              />
              <GoalOption
                label="Bulk"
                description="Build muscle mass"
                icon="trending-up"
                isSelected={goal === 'bulk'}
                onSelect={() => setGoal('bulk')}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>
                {isEditing ? 'Save Changes' : 'Get Started'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  form: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 20,
    padding: 20,
    width: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
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
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fffd',
  },
  genderText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  genderTextActive: {
    color: '#4ECDC4',
  },
  measurementsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    ...theme.shadows.small,
  },
  inputField: {
    marginBottom: 12,
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
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputUnit: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  submitButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionButton: {
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
  optionButtonActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#f0fffd',
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  optionTextActive: {
    color: '#4ECDC4',
  },
  goalsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    ...theme.shadows.small,
  },
  goalOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  goalOptionSelected: {
    backgroundColor: '#fff',
    borderColor: theme.colors.primary,
  },
  goalContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  goalIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  goalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goalLabelSelected: {
    color: theme.colors.primary,
  },
  goalDescription: {
    fontSize: 13,
    color: '#666',
    marginLeft: 44,
  },
  goalDescriptionSelected: {
    color: '#333',
  },
  activityOption: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityOptionSelected: {
    backgroundColor: '#fff',
    borderColor: theme.colors.primary,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityLabelSelected: {
    color: theme.colors.primary,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  activityDescriptionSelected: {
    color: '#333',
  },
  checkmark: {
    marginLeft: 'auto',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    marginTop: 24,
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10,
  },
  radioButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    flex: 1,
    marginHorizontal: 8,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#e0e0e0',
    borderColor: theme.colors.primary,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
});