import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const [mealHistory, setMealHistory] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // 'week' or 'month'

  useEffect(() => {
    loadMealHistory();
  }, []);

  const loadMealHistory = async () => {
    try {
      const history = await AsyncStorage.getItem('mealHistory');
      if (history) {
        setMealHistory(JSON.parse(history));
      }
    } catch (error) {
      console.log('Error loading meal history:', error);
    }
  };

  const calculateAverages = () => {
    const dates = Object.keys(mealHistory);
    const daysToInclude = selectedPeriod === 'week' ? 7 : 30;
    const recentDates = dates.slice(-daysToInclude);

    let totals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      completedMeals: 0
    };

    recentDates.forEach(date => {
      const dayData = mealHistory[date];
      if (dayData?.totals) {
        totals.calories += dayData.totals.calories;
        totals.protein += dayData.totals.protein;
        totals.carbs += dayData.totals.carbs;
        totals.completedMeals += Object.values(dayData.meals).filter(meal => meal).length;
      }
    });

    const days = recentDates.length;
    return {
      avgCalories: Math.round(totals.calories / days),
      avgProtein: Math.round(totals.protein / days),
      avgCarbs: Math.round(totals.carbs / days),
      avgMeals: (totals.completedMeals / days).toFixed(1)
    };
  };

  const averages = calculateAverages();

  const clearMealHistory = async () => {
    try {
      await AsyncStorage.removeItem('mealHistory');
      setMealHistory({}); // Clear the state as well
    } catch (error) {
      console.log('Error clearing meal history:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#4ECDC4', '#2E8B57']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Your Progress</Text>
        <View style={styles.periodSelector}>
          <TouchableOpacity 
            style={[
              styles.periodButton, 
              selectedPeriod === 'week' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive
            ]}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.periodButton, 
              selectedPeriod === 'month' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.periodButtonTextActive
            ]}>Month</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="flame" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{averages.avgCalories}</Text>
          <Text style={styles.statLabel}>Avg. Daily Calories</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="barbell" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{averages.avgProtein}g</Text>
          <Text style={styles.statLabel}>Avg. Daily Protein</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="restaurant" size={24} color="#4ECDC4" />
          <Text style={styles.statValue}>{averages.avgMeals}</Text>
          <Text style={styles.statLabel}>Avg. Meals per Day</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent History</Text>
      <View style={styles.historyContainer}>
        {Object.entries(mealHistory)
          .slice(-7)
          .reverse()
          .map(([date, dayData]) => (
            <View key={date} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyDate}>
                  {new Date(date).toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  })}
                </Text>
                <Text style={styles.historyMeals}>
                  {Object.values(dayData.meals).filter(meal => meal).length} meals
                </Text>
              </View>
              <View style={styles.historyMacros}>
                <Text style={styles.historyMacro}>
                  {dayData.totals.calories} cal
                </Text>
                <Text style={styles.historyMacro}>
                  {dayData.totals.protein}g protein
                </Text>
                <Text style={styles.historyMacro}>
                  {dayData.totals.carbs}g carbs
                </Text>
              </View>
            </View>
          ))}
      </View>
      <View style={styles.clearButtonContainer}>
        <TouchableOpacity 
          style={styles.clearButton}
          onPress={clearMealHistory}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.clearButtonText}>Clear History</Text>
        </TouchableOpacity>
      </View>
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
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 15,
    padding: 4,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  periodButtonActive: {
    backgroundColor: '#fff',
  },
  periodButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: '#4ECDC4',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
  },
  historyContainer: {
    padding: 20,
    paddingTop: 0,
  },
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyMeals: {
    fontSize: 14,
    color: '#666',
  },
  historyMacros: {
    flexDirection: 'row',
    gap: 10,
  },
  historyMacro: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearButtonContainer: {
    padding: 20,
    alignItems: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
}); 