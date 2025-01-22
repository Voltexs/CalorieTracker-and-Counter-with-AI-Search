import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Calendar } from 'react-native-calendars';

export default function TrackScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyHistory, setDailyHistory] = useState({});
  const [userData, setUserData] = useState(null);
  const [todaysTotals, setTodaysTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0
  });
  const [markedDates, setMarkedDates] = useState({});
  const [mealsVisible, setMealsVisible] = useState(false);

  useEffect(() => {
    loadUserData();
    loadDailyHistory();
    setupMidnightReset();
    updateMarkedDates();
    
    // Add interval to check for updates
    const syncInterval = setInterval(() => {
      loadTodaysTotals();
    }, 5000); // Check every 5 seconds
    
    // Initial load
    loadTodaysTotals();
    
    // Cleanup
    return () => {
      clearInterval(syncInterval);
    };
  }, []);

  useEffect(() => {
    const loadPreviousDayTotals = async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      setSelectedDate(yesterday);
    };

    loadPreviousDayTotals();
  }, []);

  const loadTodaysTotals = async () => {
    try {
      const savedMeals = await AsyncStorage.getItem('todaysMeals');
      const history = await AsyncStorage.getItem('mealHistory');
      
      if (savedMeals) {
        const meals = JSON.parse(savedMeals);
        let totals = {
          calories: 0,
          protein: 0,
          carbs: 0
        };

        Object.values(meals).forEach(mealArray => {
          mealArray.forEach(meal => {
            if (meal) {
              totals.calories += Number(meal.calories) || 0;
              totals.protein += Number(meal.protein) || 0;
              totals.carbs += Number(meal.carbs) || 0;
            }
          });
        });

        setTodaysTotals(totals);
      }

      if (history) {
        setDailyHistory(JSON.parse(history));
      }
    } catch (error) {
      console.log('Error loading totals:', error);
    }
  };

  const setupMidnightReset = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow - now;

    setTimeout(() => {
      archiveDay();
      setupMidnightReset();
    }, timeUntilMidnight);
  };

  const archiveDay = async () => {
    try {
      // Get yesterday's date as the key
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateKey = yesterday.toISOString().split('T')[0];
      
      const currentHistory = await AsyncStorage.getItem('mealHistory') || '{}';
      const parsedHistory = JSON.parse(currentHistory);
      
      // Get the final totals for yesterday
      const savedMeals = await AsyncStorage.getItem('todaysMeals');
      const meals = savedMeals ? JSON.parse(savedMeals) : null;
      
      // Save yesterday's totals to history
      parsedHistory[dateKey] = {
        meals: meals,
        totals: todaysTotals
      };
      
      await AsyncStorage.setItem('mealHistory', JSON.stringify(parsedHistory));
      setDailyHistory(parsedHistory);
      
      // Reset today's totals
      setTodaysTotals({
        calories: 0,
        protein: 0,
        carbs: 0
      });

      // Clear today's meals from storage
      await AsyncStorage.removeItem('todaysMeals');
      
      await updateMarkedDates();
    } catch (error) {
      console.error('Error archiving day:', error);
    }
  };

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) setUserData(JSON.parse(data));
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadDailyHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      if (history) setDailyHistory(JSON.parse(history));
    } catch (error) {
      console.error('Error loading meal history:', error);
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

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const getDayTotal = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return dailyHistory[dateKey]?.totals || {
      calories: 0,
      protein: 0,
      carbs: 0
    };
  };

  const updateMarkedDates = async () => {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      if (history) {
        const parsedHistory = JSON.parse(history);
        const marked = {};
        
        Object.keys(parsedHistory).forEach(date => {
          const totals = parsedHistory[date].totals;
          const isInRange = checkDailyGoals(totals);
          
          marked[date] = {
            marked: true,
            dotColor: isInRange ? theme.colors.primary : '#FF6B6B'
          };
        });
        
        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('Error updating marked dates:', error);
    }
  };

  const onDayPress = (day) => {
    const selected = new Date(day.dateString);
    setSelectedDate(selected);
  };

  const getDayMeals = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    return dailyHistory[dateKey]?.meals || null;
  };

  const toggleMealsVisibility = () => {
    setMealsVisible(!mealsVisible);
  };

  const calculateWeeklyAverage = (metric) => {
    const today = new Date();
    const lastWeek = new Array(7).fill().map((_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const values = lastWeek.map(date => {
      return dailyHistory[date]?.totals[metric] || 0;
    });

    const average = values.reduce((a, b) => a + b, 0) / 7;
    return Math.round(average);
  };

  const calculateAdherence = () => {
    const lastWeek = new Array(7).fill().map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const daysInRange = lastWeek.filter(date => {
      const totals = dailyHistory[date]?.totals;
      return totals && checkDailyGoals(totals);
    }).length;

    return Math.round((daysInRange / 7) * 100);
  };

  const calculateConsistentDays = () => {
    const today = new Date();
    let streak = 0;
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (dailyHistory[dateKey]?.totals) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  const getWeeklyTip = () => {
    const tips = [
      "Try meal prepping on Sundays to stay consistent",
      "Eating protein with every meal helps control hunger",
      "Track meals as you go for better accuracy",
      "Small daily improvements lead to big results",
      "Consistency beats perfection"
    ];
    
    return tips[Math.floor(Math.random() * tips.length)];
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>Nutrition History</Text>
        </LinearGradient>

        <View style={styles.calendarContainer}>
          <Calendar
            onDayPress={onDayPress}
            markedDates={markedDates}
            theme={{
              selectedDayBackgroundColor: theme.colors.primary,
              todayTextColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
            }}
          />
        </View>

        <View style={styles.totalsContainer}>
          <Text style={styles.totalsTitle}>Daily Totals</Text>
          <Text style={styles.totalsDate}>{selectedDate.toDateString()}</Text>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Calories:</Text>
            <Text style={styles.totalsValue}>{getDayTotal(selectedDate).calories}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Protein:</Text>
            <Text style={styles.totalsValue}>{getDayTotal(selectedDate).protein}g</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Carbs:</Text>
            <Text style={styles.totalsValue}>{getDayTotal(selectedDate).carbs}g</Text>
          </View>
        </View>

        <View style={styles.mealsContainer}>
          <TouchableOpacity onPress={toggleMealsVisibility} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              {mealsVisible ? 'Hide Meals' : 'Show Meals'}
            </Text>
            <Ionicons 
              name={mealsVisible ? 'chevron-up-outline' : 'chevron-down-outline'} 
              size={20} 
              color={theme.colors.primary} 
            />
          </TouchableOpacity>

          {mealsVisible && getDayMeals(selectedDate) && (
            <View>
              <Text style={styles.mealsTitle}>Meals</Text>
              {Object.entries(getDayMeals(selectedDate)).map(([mealTime, meals]) => (
                meals.length > 0 && (
                  <View key={mealTime} style={styles.mealTimeBlock}>
                    <Text style={styles.mealTimeTitle}>{mealTime}</Text>
                    {meals.map((meal, index) => (
                      <View key={index} style={styles.mealItem}>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealDescription}>{meal.description}</Text>
                        <View style={styles.mealMacros}>
                          <Text style={styles.macroText}>{meal.calories} cal</Text>
                          <Text style={styles.macroText}>{meal.protein}g protein</Text>
                          <Text style={styles.macroText}>{meal.carbs}g carbs</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )
              ))}
            </View>
          )}
        </View>

        <View style={styles.weeklyOverview}>
          <Text style={styles.sectionTitle}>Weekly Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {calculateWeeklyAverage('calories')}
              </Text>
              <Text style={styles.statLabel}>Avg. Daily Calories</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {calculateWeeklyAverage('protein')}g
              </Text>
              <Text style={styles.statLabel}>Avg. Daily Protein</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.adherenceValue]}>
                {calculateAdherence()}%
              </Text>
              <Text style={styles.statLabel}>Goal Adherence</Text>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {calculateConsistentDays()}
              </Text>
              <Text style={styles.statLabel}>Consistent Days</Text>
            </View>
          </View>

          <View style={styles.weeklyTip}>
            <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.tipText}>{getWeeklyTip()}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  dailyCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...theme.shadows.medium,
  },
  totalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  totalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 12,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 15,
  },
  totalUnit: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  historySection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    ...theme.shadows.small,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  historyMacros: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyMacro: {
    fontSize: 14,
    color: '#666',
  },
  calendarContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    ...theme.shadows.small,
  },
  totalsContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    ...theme.shadows.small,
  },
  totalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  totalsDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalsLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  mealsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    ...theme.shadows.small,
  },
  mealsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 16,
  },
  mealTimeBlock: {
    marginBottom: 16,
  },
  mealTimeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  mealItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  mealName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  mealDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  mealMacros: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  macroText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: theme.colors.primary,
    marginRight: 8,
  },
  weeklyOverview: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  adherenceValue: {
    color: theme.colors.success,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  weeklyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    gap: 12,
    ...theme.shadows.small,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});