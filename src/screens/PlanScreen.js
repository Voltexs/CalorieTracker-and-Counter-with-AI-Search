import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

// Create a reusable MealSlot component for consistency
const MealSlot = ({ mealNumber, mealName, meals, onAddMeal, onRemoveMeal, navigation }) => (
  <View style={styles.mealTimeSection}>
    <View style={styles.mealTimeHeader}>
      <Text style={styles.mealTimeTitle}>Meal {mealNumber}</Text>
    </View>
    
    <View style={styles.mealCard}>
      {meals && meals.length > 0 ? (
        <View style={styles.plannedMealContent}>
          {meals.map((meal, index) => (
            <View key={index} style={styles.mealItem}>
              <View style={styles.mealHeader}>
                <Text style={styles.plannedMealName}>
                  {meal.name}
                </Text>
                <TouchableOpacity 
                  style={styles.removeMealButton}
                  onPress={() => onRemoveMeal(index)}
                >
                  <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.macrosList}>
                <View style={styles.macroItem}>
                  <Ionicons name="flame-outline" size={20} color="#FF6B6B" />
                  <Text style={styles.macroLabel}>Calories</Text>
                  <Text style={styles.macroValue}>{meal.calories}</Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Ionicons name="barbell-outline" size={20} color="#4ECDC4" />
                  <Text style={styles.macroLabel}>Protein</Text>
                  <Text style={styles.macroValue}>{meal.protein}g</Text>
                </View>
                
                <View style={styles.macroItem}>
                  <Ionicons name="nutrition-outline" size={20} color="#FFB100" />
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <Text style={styles.macroValue}>{meal.carbs}g</Text>
                </View>
              </View>
              
              {index < meals.length - 1 && <View style={styles.mealDivider} />}
            </View>
          ))}
          <TouchableOpacity 
            style={styles.addAnotherButton}
            onPress={() => navigation.navigate('MainApp', { screen: 'TabHome' })}
          >
            <Text style={styles.addAnotherText}>Add another item</Text>
            <Ionicons name="add-circle" size={20} color="#4ECDC4" />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.emptyMealContent}>
          <Text style={styles.emptyMealText}>Add {mealName}</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => navigation.navigate('MainApp', { screen: 'TabHome' })}
          >
            <Ionicons name="add-circle" size={24} color="#4ECDC4" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  </View>
);

export default function PlanScreen({ route, navigation }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyPlans, setDailyPlans] = useState({});
  const [dailyHistory, setDailyHistory] = useState({});
  const [todaysMeals, setTodaysMeals] = useState({
    meal1: [],
    meal2: [],
    meal3: [],
    meal4: [],
    meal5: [],
    meal6: []
  });

  // Add this useEffect for midnight reset
  useEffect(() => {
    loadDailyHistory();
    
    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;

    // Set up timer to archive current day's meals
    const timer = setTimeout(async () => {
      // Archive current day's meals
      const dateKey = currentDate.toISOString().split('T')[0];
      const updatedHistory = {
        ...dailyHistory,
        [dateKey]: {
          meals: todaysMeals,
          totals: calculateDailyTotals(todaysMeals)
        }
      };
      
      // Save history
      await saveDailyHistory(updatedHistory);
      setDailyHistory(updatedHistory);
      
      // Reset today's meals
      setTodaysMeals({
        meal1: [],
        meal2: [],
        meal3: [],
        meal4: [],
        meal5: [],
        meal6: []
      });

      // Update current date
      setCurrentDate(new Date());
    }, timeUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  // Add this useEffect to handle incoming meals
  useEffect(() => {
    if (route.params?.addMeal) {
      const { mealSlot, meal } = route.params.addMeal;
      addMealToPlan(`meal${mealSlot}`, meal);
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
  const calculateDailyTotals = () => {
    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0
    };

    // Loop through all meal slots
    Object.values(todaysMeals).forEach(mealArray => {
      // For each meal in the slot, add up the macros
      mealArray.forEach(meal => {
        if (meal) {
          totals.calories += Number(meal.calories) || 0;
          totals.protein += Number(meal.protein) || 0;
          totals.carbs += Number(meal.carbs) || 0;
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
    setTodaysMeals(prev => {
      const newMeals = {
        ...prev,
        [mealTime]: Array.isArray(prev[mealTime]) ? [...prev[mealTime], meal] : [meal]
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
  const dailyTotals = useMemo(() => calculateDailyTotals(), [todaysMeals]);

  // Also add this useEffect to save meals whenever they change
  useEffect(() => {
    const saveMeals = async () => {
      const dateKey = currentDate.toISOString().split('T')[0];
      const updatedHistory = {
        ...dailyHistory,
        [dateKey]: {
          meals: todaysMeals,
          totals: calculateDailyTotals()
        }
      };
      await saveDailyHistory(updatedHistory);
      setDailyHistory(updatedHistory);
    };

    saveMeals();
  }, [todaysMeals]);

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4ECDC4', '#2E8B57']}
        style={styles.header}
      >
        <View style={styles.dateDisplay}>
          <Text style={styles.headerDate}>Today</Text>
          <Text style={styles.headerFullDate}>
            {currentDate.toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long'
            })}
          </Text>
        </View>

        <Text style={styles.headerTitle}>Today's Plan</Text>
        <View style={styles.macrosContainer}>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Calories</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.calories}<Text style={styles.macroUnit}> cal</Text>
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.protein}<Text style={styles.macroUnit}>g Protein</Text>
            </Text>
          </View>
          <View style={styles.macroItem}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {dailyTotals.carbs}<Text style={styles.macroUnit}>g Carbs</Text>
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.mealsContainer}>
        <MealSlot 
          mealNumber={1}
          mealName="breakfast"
          meals={todaysMeals.meal1 || []}
          onAddMeal={(meal) => addMealToPlan('meal1', meal)}
          onRemoveMeal={(index) => removeMealFromPlan('meal1', index)}
          navigation={navigation}
        />
        <MealSlot 
          mealNumber={2}
          mealName="morning snack"
          meals={todaysMeals.meal2 || []}
          onAddMeal={(meal) => addMealToPlan('meal2', meal)}
          onRemoveMeal={(index) => removeMealFromPlan('meal2', index)}
          navigation={navigation}
        />
        <MealSlot 
          mealNumber={3}
          mealName="lunch"
          meals={todaysMeals.meal3 || []}
          onAddMeal={(meal) => addMealToPlan('meal3', meal)}
          onRemoveMeal={(index) => removeMealFromPlan('meal3', index)}
          navigation={navigation}
        />
        <MealSlot 
          mealNumber={4}
          mealName="afternoon snack"
          meals={todaysMeals.meal4 || []}
          onAddMeal={(meal) => addMealToPlan('meal4', meal)}
          onRemoveMeal={(index) => removeMealFromPlan('meal4', index)}
          navigation={navigation}
        />
        <MealSlot 
          mealNumber={5}
          mealName="dinner"
          meals={todaysMeals.meal5 || []}
          onAddMeal={(meal) => addMealToPlan('meal5', meal)}
          onRemoveMeal={(index) => removeMealFromPlan('meal5', index)}
          navigation={navigation}
        />
        <MealSlot 
          mealNumber={6}
          mealName="evening snack"
          meals={todaysMeals.meal6 || []}
          onAddMeal={(meal) => addMealToPlan('meal6', meal)}
          onRemoveMeal={(index) => removeMealFromPlan('meal6', index)}
          navigation={navigation}
        />
      </View>

      {/* <DateTimePicker
        value={currentDate}
        mode="date"
        display="default"
        onChange={(event, date) => {
          if (date) setCurrentDate(date);
        }}
      /> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15
  },
  macroItem: {
    alignItems: 'center',
  },
  macroLabel: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.9,
  },
  macroValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  mealsContainer: {
    padding: 20,
  },
  mealTimeSection: {
    marginBottom: 20,
  },
  mealTimeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  mealTimeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: 4,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  emptyMealText: {
    color: '#666',
    fontSize: 16,
  },
  dateDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  headerDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerFullDate: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  plannedMealContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  plannedMealName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  removeMealButton: {
    padding: 4,
  },
  macrosList: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  macroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  macroLabel: {
    fontSize: 15,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  macroValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  mealDescription: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyMealContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  emptyMealText: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    padding: 4,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 15,
  },
}); 