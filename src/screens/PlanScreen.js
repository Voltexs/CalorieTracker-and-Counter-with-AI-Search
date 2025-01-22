import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../theme';

// Create a reusable MealSlot component for consistency
const MealSlot = ({ mealNumber, mealName, meals = [], onAddMeal, onRemoveMeal, navigation }) => (
  <View style={styles.mealTimeSection}>
    <View style={styles.mealTimeHeader}>
      <Text style={styles.mealTimeTitle}>Meal {mealNumber}</Text>
    </View>
    
    <View style={styles.mealCard}>
      {Array.isArray(meals) && meals.length > 0 ? (
        <View>
          {meals.map((meal, index) => (
  <View key={index} style={styles.mealItem}>
    <View style={styles.mealInfo}>
      <Text style={styles.mealName}>{meal?.name || 'Unnamed Meal'}</Text>
      {meal?.description && (
        <Text style={styles.mealDescription}>{meal.description}</Text>
      )}
    </View>
    
    <View style={styles.macrosList}>
      <View style={styles.macroItem}>
        <Ionicons name="flame-outline" size={18} color={theme.colors.text} />
        <Text style={styles.macroValue}>{meal.calories} cal</Text>
      </View>
      <View style={styles.macroItem}>
        <Ionicons name="fitness-outline" size={18} color={theme.colors.text} />
        <Text style={styles.macroValue}>{meal.protein}g</Text>
      </View>
      <View style={styles.macroItem}>
        <Ionicons name="nutrition-outline" size={18} color={theme.colors.text} />
        <Text style={styles.macroValue}>{meal.carbs}g</Text>
      </View>
      <View style={styles.macroItem}>
        <Ionicons name="flame-outline" size={18} color={theme.colors.text} />
        <Text style={styles.macroValue}>{meal.fat}g</Text>
      </View>
    </View>
    
    <TouchableOpacity 
      style={styles.removeButton}
      onPress={() => onRemoveMeal(index)}
    >
      <Ionicons name="close-circle" size={24} color="#FF6B6B" />
    </TouchableOpacity>
  </View>
))}
          <TouchableOpacity 
            style={styles.addMoreButton}
            onPress={onAddMeal}
          >
            <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
            <Text style={styles.addMoreText}>Add Another</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity 
          style={styles.addMealButton}
          onPress={onAddMeal}
        >
          <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
          <Text style={styles.addMealText}>Add Meal</Text>
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default function PlanScreen({ route, navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyPlans, setDailyPlans] = useState({});
  const [dailyHistory, setDailyHistory] = useState({});
  const [todaysMeals, setTodaysMeals] = useState({
    'Meal 1': [],
    'Meal 2': [],
    'Meal 3': [],
    'Meal 4': [],
    'Meal 5': [],
    'Meal 6': []
  });
  const [userData, setUserData] = useState(null);

  // Update the useEffect for midnight reset
  useEffect(() => {
    const setupMidnightReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeUntilMidnight = tomorrow - now;

      const timer = setTimeout(async () => {
        // Archive current day's meals before clearing
        await saveToDailyHistory();
        
        // Reset today's meals
        const emptyMeals = {
          'Meal 1': [],
          'Meal 2': [],
          'Meal 3': [],
          'Meal 4': [],
          'Meal 5': [],
          'Meal 6': []
        };
        
        setTodaysMeals(emptyMeals);
        await saveTodaysMeals(emptyMeals);
        await AsyncStorage.removeItem('todaysMeals');
        
        // Update current date
        setCurrentDate(new Date());
        
        // Set up next day's timer
        setupMidnightReset();
      }, timeUntilMidnight);

      return () => clearTimeout(timer);
    };

    setupMidnightReset();
    loadTodaysMeals();
  }, []);

  // Add this useEffect to handle incoming meals
  useEffect(() => {
    if (route.params?.addMeal) {
      const { mealSlot, meal } = route.params.addMeal;
      addMealToPlan(`Meal ${mealSlot}`, meal);
      // Clear the params
      navigation.setParams({ addMeal: undefined });
    }
  }, [route.params?.addMeal]);

  // Function to format the date with relative terms
  const getRelativeDate = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Reset hours to compare dates properly
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (compareDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (compareDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
  };

  // Add date navigation functions
  const goToNextDay = () => {
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setCurrentDate(nextDay);
  };

  const goToPreviousDay = () => {
    const prevDay = new Date(currentDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setCurrentDate(prevDay);
  };

  // Add these functions for managing daily plans
  const saveDailyHistory = async (history) => {
    try {
      await AsyncStorage.setItem('mealHistory', JSON.stringify(history));
    } catch (error) {
      console.log('Error saving meal history:', error);
    }
  };

  const loadDailyHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      if (history) {
        setDailyHistory(JSON.parse(history));
      }
    } catch (error) {
      console.log('Error loading meal history:', error);
    }
  };

  // Update your existing calculateDailyTotals function
  const calculateDailyTotals = (meals) => {
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0
    };

    Object.values(meals).forEach(mealArray => {
      mealArray.forEach(meal => {
        if (meal) {
          totals.calories += Number(meal.calories) || 0;
          totals.protein += Number(meal.protein) || 0;
          totals.carbs += Number(meal.carbs) || 0;
          totals.fat += Number(meal.fat) || 0;
        }
      });
    });

    return totals;
  };

  // Add these functions for basic persistence
  const saveTodaysMeals = async (meals) => {
    try {
      await AsyncStorage.setItem('todaysMeals', JSON.stringify(meals));
    } catch (error) {
      console.log('Error saving today\'s meals:', error);
    }
  };

  const loadTodaysMeals = async () => {
    try {
      const savedMeals = await AsyncStorage.getItem('todaysMeals');
      if (savedMeals) {
        setTodaysMeals(JSON.parse(savedMeals));
      }
    } catch (error) {
      console.log('Error loading today\'s meals:', error);
    }
  };

  // Add this useEffect to load meals when app opens
  useEffect(() => {
    loadTodaysMeals();
  }, []);

  // Update your existing addMealToPlan function
  const addMealToPlan = (mealTime, meal) => {
    const formattedMealTime = typeof mealTime === 'number' 
      ? `Meal ${mealTime}`
      : mealTime;
    
    setTodaysMeals(prev => {
      const newMeals = {
        ...prev,
        [formattedMealTime]: [...prev[formattedMealTime], meal] // Add to array instead of replacing
      };
      saveTodaysMeals(newMeals);
      return newMeals;
    });
  };

  // Update your existing removeMealFromPlan function
  const removeMealFromPlan = (mealTime, index) => {
    setTodaysMeals(prev => {
      const newMeals = {
        ...prev,
        [mealTime]: prev[mealTime].filter((_, i) => i !== index)
      };
      saveTodaysMeals(newMeals);
      return newMeals;
    });
  };

  // Add the useMemo hook near your state declarations
  const dailyTotals = useMemo(() => calculateDailyTotals(todaysMeals), [todaysMeals]);

  // Also add this useEffect to save meals whenever they change
  useEffect(() => {
    const saveMeals = async () => {
      const dateKey = currentDate.toISOString().split('T')[0];
      const updatedHistory = {
        ...dailyHistory,
        [dateKey]: {
          meals: todaysMeals,
          totals: calculateDailyTotals(todaysMeals)
        }
      };
      await saveDailyHistory(updatedHistory);
      setDailyHistory(updatedHistory);
    };

    saveMeals();
  }, [todaysMeals]);

  const saveToDailyHistory = async () => {
    try {
      const dateKey = new Date().toISOString().split('T')[0];
      const currentHistory = await AsyncStorage.getItem('mealHistory') || '{}';
      const parsedHistory = JSON.parse(currentHistory);
      
      const totals = calculateDailyTotals(todaysMeals);
      
      parsedHistory[dateKey] = {
        meals: todaysMeals,
        totals: totals
      };
      
      await AsyncStorage.setItem('mealHistory', JSON.stringify(parsedHistory));
    } catch (error) {
      console.log('Error saving to history:', error);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          setUserData(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.header}
      >
        <View style={styles.dateNavigation}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.dateButton}>
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <View style={styles.dateDisplay}>
            <Text style={styles.headerDate}>
              {currentDate.toLocaleDateString('en-GB', { weekday: 'long' })}
            </Text>
            <Text style={styles.headerFullDate}>
              {currentDate.toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'long'
              })}
            </Text>
          </View>

          <TouchableOpacity onPress={goToNextDay} style={styles.dateButton}>
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.macrosContainer}>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Calorie</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.calories}<Text style={styles.macroUnit}> kcal</Text>
            </Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.protein}<Text style={styles.macroUnit}>g</Text>
            </Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.carbs}<Text style={styles.macroUnit}>g</Text>
            </Text>
          </View>
          <View style={styles.macroCard}>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.fat}<Text style={styles.macroUnit}>g</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.content}>
      {[1, 2, 3, 4, 5, 6].map((slotNumber) => (
        <MealSlot
          key={slotNumber}
          mealNumber={slotNumber}
          meals={todaysMeals[`Meal ${slotNumber}`]}
          onAddMeal={() => navigation.navigate('TabHome')}
          onRemoveMeal={(index) => removeMealFromPlan(`Meal ${slotNumber}`, index)}
          navigation={navigation}
        />
      ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    ...theme.shadows.medium,
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
  },
  dateDisplay: {
    alignItems: 'center',
  },
  headerDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerFullDate: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  macroCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  macroLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '500',
  },
  macroValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  macroUnit: {
    fontSize: 12,
    opacity: 0.9,
    marginLeft: 2,
    fontWeight: '400',
  },
  content: {
    padding: 20,
  },
  mealTimeSection: {
    marginBottom: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    ...theme.shadows.small,
  },
  mealTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTimeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  mealItem: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  mealInfo: {
    marginBottom: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  macrosList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
  },
  macroItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '500',
    color: theme.colors.text,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderRadius: 12,
  },
  addMealText: {
    fontSize: 16,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 12,
    gap: 8,
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderRadius: 12,
  },
  addMoreText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
  },
}); 