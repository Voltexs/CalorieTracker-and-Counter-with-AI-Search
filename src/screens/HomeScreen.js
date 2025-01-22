import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Animated, Pressable, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Text as SvgText, Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { theme } from '../theme';
import NutritionChat from '../components/NutritionChat';
import { Pedometer } from 'expo-sensors';

const { width } = Dimensions.get('window');

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MEAL_CATEGORIES = {
  Breakfast: {
    icon: "sunny-outline",
    meals: [
      {
        name: "Breakfast Bowl",
        description: "• 3 large eggs\n• 80g oats\n• ½ scoop whey\n• 30g blueberries",
        calories: 405,
        protein: 27,
        carbs: 35,
        fat: 12
      },
      {
        name: "Eggs on Toast",
        description: "• 3 large eggs\n• 2 brown bread",
        calories: 310,
        protein: 21,
        carbs: 20,
        fat: 10
      }
    ]
  },
  "Chicken Meals": {
    icon: "nutrition-outline",
    meals: [
      {
        name: "Chicken Wrap",
        description: "• 150g chicken breast\n• 1 brown wrap\n• 1 tbsp sriracha",
        calories: 340,
        protein: 38,
        carbs: 18,
        fat: 6
      },
      {
        name: "Chicken & Brown Rice",
        description: "• 150g chicken breast\n• 100g brown rice\n• 1 tbsp sriracha",
        calories: 355,
        protein: 36,
        carbs: 30,
        fat: 5
      }
    ]
  },
  "Mince Meals": {
    icon: "restaurant-outline",
    meals: [
      {
        name: "Lean Mince Wrap",
        description: "• 150g lean mince\n• 1 brown wrap\n• 1 tbsp sriracha",
        calories: 370,
        protein: 36,
        carbs: 18,
        fat: 14
      }
    ]
  },
  "Tuna Meals": {
    icon: "fish-outline",
    meals: [
      {
        name: "Zero Noodle Tuna",
        description: "• 1 pack zero noodles\n• 1 tin tuna\n• 1 tbsp sriracha",
        calories: 130,
        protein: 26,
        carbs: 0,
        fat: 2
      }
    ]
  },
  "Protein Shakes": {
    icon: "fitness-outline",
    meals: [
      {
        name: "NPL Whey Plus",
        description: "• 1 scoop whey",
        calories: 120,
        protein: 24,
        carbs: 2,
        fat: 1
      },
      {
        name: "Protein Shake Plus",
        description: "• 1 scoop whey\n• 1 banana\n• 1 tbsp peanut butter",
        calories: 270,
        protein: 26,
        carbs: 21,
        fat: 12
      }
    ]
  },
  "Cheat Meals": {
    icon: "pizza-outline",
    meals: [
      {
        name: "Burger & Fries",
        description: "• 1 beef burger\n• Regular fries",
        calories: 850,
        protein: 35,
        carbs: 89,
        fat: 42
      },
      {
        name: "Pizza Slice",
        description: "• 2 slices pizza\n• Dip",
        calories: 560,
        protein: 22,
        carbs: 65,
        fat: 24
      },
      {
        name: "Ice Cream Bowl",
        description: "• 2 scoops vanilla\n• Chocolate sauce\n• Sprinkles\n• 1 Waffle",
        calories: 620,
        protein: 12,
        carbs: 30,
        fat: 18
      }
    ]
  },
  "Drinks": {
    icon: "water-outline",
    meals: [
      {
        name: "USN Qhush Energy Drink",
        description: "• 1 Can USN Qhush Energy Drink",
        calories: 15,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      {
        name: "Coke Zero",
        description: "• 1 can Coke Zero",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      {
        name: "Monster Ultra",
        description: "• 1 Can Monster Ultra Zero",
        calories: 10,
        protein: 0,
        carbs: 3,
        fat: 0
      },
      {
        name: "Pre-Workout",
        description: "• 1 scoop pre-workout",
        calories: 5,
        protein: 0,
        carbs: 1,
        fat: 0
      }
    ]
  },
  "Protein Cookies": {
    icon: "cafe-outline",
    meals: [
      {
        name: "Home Protein Cookie",
        description: "• 1 Protein Cookie",
        calories: 190,
        protein: 28,
        carbs: 25,
        fat: 8
      },
      {
        name: "NPL Collagen Bar (50g)",
        description: "• 1 Protein Cookie",
        calories: 210,
        protein: 20,
        carbs: 13,
        fat: 9
      },
      {
        name: "NPL Vegan Bar (45g)",
        description: "• 1 Protein Cookie",
        calories: 190,
        protein: 10,
        carbs: 22,
        fat: 7
      }
    ]
  }
};

const ProgressArc = ({ percentage, userData, todaysTotals, dailyGoal }) => {
  const size = 150;
  const smallSize = 80; // Size for smaller circles
  const strokeWidth = 15;
  const smallStrokeWidth = 8; // Thinner stroke for smaller circles
  const center = size / 2;
  const smallCenter = smallSize / 2;
  const radius = (size - strokeWidth) / 2;
  const smallRadius = (smallSize - smallStrokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const smallCircumference = smallRadius * 2 * Math.PI;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: percentage,
      duration: 1500,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const animatedProgress = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  const caloriesLeft = userData?.nutritionGoals?.calories 
    ? userData.nutritionGoals.calories - todaysTotals.calories 
    : 0;

  const animatedAddedProgress = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [smallCircumference, 0],
  });

  const addedPercentage = Math.min((todaysTotals.calories / dailyGoal) * 100, 100);

  return (
    <View style={styles.progressContainer}>
      {/* Left Circle - Calories Added */}
      <View style={[styles.smallCircle, styles.leftCircle]}>
        <Svg width={smallSize} height={smallSize}>
          <Circle
            cx={smallCenter}
            cy={smallCenter}
            r={smallRadius}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={smallStrokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={smallCenter}
            cy={smallCenter}
            r={smallRadius}
            stroke="#FF6B6B"
            strokeWidth={smallStrokeWidth}
            fill="none"
            strokeDasharray={smallCircumference}
            strokeDashoffset={animatedAddedProgress}
          />
          <Circle
            cx={smallCenter}
            cy={smallCenter}
            r={smallRadius - smallStrokeWidth}
            fill="rgba(255,255,255,0.1)"
          />
          <SvgText
            x={smallCenter}
            y={smallCenter - 5}
            fontSize="16"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
          >
            {todaysTotals.calories}
          </SvgText>
          <SvgText
            x={smallCenter}
            y={smallCenter + 12}
            fontSize="9"
            fill="#fff"
            textAnchor="middle"
            opacity="0.8"
          >
            Added
          </SvgText>
        </Svg>
      </View>

      {/* Main Circle */}
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id="grad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={caloriesLeft < 0 ? "#FF0000" : "#4ECDC4"} stopOpacity="1" />
            <Stop offset="1" stopColor={caloriesLeft < 0 ? "#FF0000" : "#2E8B57"} stopOpacity="1" />
          </SvgGradient>
        </Defs>
        
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke="url(#grad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={animatedProgress}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
        
        <Circle
          cx={center}
          cy={center}
          r={radius - strokeWidth}
          fill="rgba(255,255,255,0.1)"
        />
        
        <SvgText
          x={center}
          y={center - 5}
          fontSize="20"
          fontWeight="bold"
          fill="#fff"
          textAnchor="middle"
        >
          {caloriesLeft}
        </SvgText>
        <SvgText
          x={center}
          y={center + 15}
          fontSize="10"
          fill="#fff"
          textAnchor="middle"
          opacity="0.8"
        >
          calories remaining
        </SvgText>
      </Svg>

      {/* Right Circle - Calories Burned */}
      <View style={[styles.smallCircle, styles.rightCircle]}>
        <Svg width={smallSize} height={smallSize}>
          <Circle
            cx={smallCenter}
            cy={smallCenter}
            r={smallRadius}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={smallStrokeWidth}
            fill="none"
          />
          <AnimatedCircle
            cx={smallCenter}
            cy={smallCenter}
            r={smallRadius}
            stroke="#4ECDC4"
            strokeWidth={smallStrokeWidth}
            fill="none"
            strokeDasharray={smallCircumference}
            strokeDashoffset={smallCircumference * 0.7}
          />
          <Circle
            cx={smallCenter}
            cy={smallCenter}
            r={smallRadius - smallStrokeWidth}
            fill="rgba(255,255,255,0.1)"
          />
          <SvgText
            x={smallCenter}
            y={smallCenter - 5}
            fontSize="16"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
          >
            0
          </SvgText>
          <SvgText
            x={smallCenter}
            y={smallCenter + 12}
            fontSize="9"
            fill="#fff"
            textAnchor="middle"
            opacity="0.8"
          >
            Burned
          </SvgText>
        </Svg>
      </View>
    </View>
  );
};

const FadeInView = ({ delay, children }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }]
      }}
    >
      {children}
    </Animated.View>
  );
};

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customMeals, setCustomMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [pressedAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [mealToDelete, setMealToDelete] = useState(null);
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [allCategories, setAllCategories] = useState(MEAL_CATEGORIES);
  const [editingMeal, setEditingMeal] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMealActions, setSelectedMealActions] = useState(null);
  const [mealSlotModalVisible, setMealSlotModalVisible] = useState(false);
  const [selectedMealToAdd, setSelectedMealToAdd] = useState(null);
  const [todaysTotals, setTodaysTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });
  const [dailyGoal, setDailyGoal] = useState(2000);
  const [expandAnim] = useState(new Animated.Value(0));
  const [nutritionChatVisible, setNutritionChatVisible] = useState(false);
  const [userData, setUserData] = useState(null);
  const [stepCount, setStepCount] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const parsedData = JSON.parse(data);
          setUserData(parsedData);
          if (parsedData.nutritionGoals) {
            setDailyGoal(parsedData.nutritionGoals.calories);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
    const unsubscribe = navigation.addListener('focus', loadUserData);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const floatAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pressedAnim, {
          toValue: 1.05,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pressedAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    floatAnimation.start();
    return () => floatAnimation.stop();
  }, []);

  useEffect(() => {
    loadSavedMeals();
  }, []);

  const loadSavedMeals = async () => {
    try {
      const savedCategories = await AsyncStorage.getItem('mealCategories');
      if (savedCategories) {
        setAllCategories(JSON.parse(savedCategories));
      }
    } catch (error) {
      console.log('Error loading meals:', error);
    }
  };

  const saveMealCategories = async (categories) => {
    try {
      await AsyncStorage.setItem('mealCategories', JSON.stringify(categories));
    } catch (error) {
      console.log('Error saving meals:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!selectedCategory) {
      Alert.alert("Missing Category", "Please select a meal category");
      return;
    }
    
    if (!mealName || !calories || !protein || !carbs || !fat) {
      Alert.alert("Missing Fields", "Please fill in all required fields");
      return;
    }

    const newMeal = {
      name: mealName,
      description: description || '',
      calories: parseInt(calories),
      protein: parseInt(protein),
      carbs: parseInt(carbs),
      fat: parseInt(fat)
    };

    // Create a copy of all categories and add the new meal
    const updatedCategories = { ...allCategories };
    if (!updatedCategories[selectedCategory].meals) {
      updatedCategories[selectedCategory].meals = [];
    }
    updatedCategories[selectedCategory].meals.push(newMeal);

    // Save to AsyncStorage and update state
    await saveMealCategories(updatedCategories);
    setAllCategories(updatedCategories);

    // Reset form
    setMealName('');
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setSelectedCategory('');
    setModalVisible(false);
  };

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setModalVisible(true);
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const handleDeleteMeal = async () => {
    if (!mealToDelete) return;
    
    const updatedCategories = { ...allCategories };
    updatedCategories[mealToDelete.category].meals.splice(mealToDelete.index, 1);
    
    // Save to AsyncStorage
    await saveMealCategories(updatedCategories);
    
    // Update state
    setAllCategories(updatedCategories);
    
    // Reset delete modal state
    setDeleteModalVisible(false);
    setMealToDelete(null);
    setSelectedMealActions(null);
  };

  const handleEditMeal = async () => {
    if (!mealName || !calories || !protein || !carbs) {
      Alert.alert("Missing Fields", "Please fill in all required fields");
      return;
    }

    const updatedMeal = {
      name: mealName,
      description: description || '',
      calories: parseInt(calories),
      protein: parseInt(protein),
      carbs: parseInt(carbs),
    };

    const updatedCategories = { ...allCategories };
    updatedCategories[editingMeal.category].meals[editingMeal.index] = updatedMeal;
    
    await saveMealCategories(updatedCategories);
    setAllCategories(updatedCategories);
    
    // Reset form
    setMealName('');
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setEditingMeal(null);
    setIsEditing(false);
    setModalVisible(false);
  };

  const loadTodaysTotals = async () => {
    try {
      const savedMeals = await AsyncStorage.getItem('todaysMeals');
      if (savedMeals) {
        const meals = JSON.parse(savedMeals);
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

        setTodaysTotals(totals);
      }
    } catch (error) {
      console.log('Error loading today\'s totals:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadTodaysTotals();
    });

    return unsubscribe;
  }, [navigation]);

  const calculatePercentage = (current, total) => {
    if (total === 0) return 0; // Avoid division by zero
    const percentage = (current / total) * 100;
    return Math.round(percentage); // Round to the nearest whole number
  };

  const progress = Math.min(todaysTotals.calories / dailyGoal, 1);

  const toggleCategory = (category) => {
    const isExpanding = expandedCategory !== category;
    setExpandedCategory(isExpanding ? category : null);
    
    Animated.spring(expandAnim, {
      toValue: isExpanding ? 1 : 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    console.log('Calories:', todaysTotals.calories);
    console.log('Daily Goal:', dailyGoal);
    console.log('Percentage:', calculatePercentage(todaysTotals.calories, dailyGoal));
  }, [todaysTotals.calories, dailyGoal]);

  const calculateCaloriePercentage = () => {
    if (!todaysTotals.calories || !dailyGoal) return 0;
    return Math.round((todaysTotals.calories / dailyGoal) * 100);
  };

  const handleNutritionSelect = (nutrition) => {
    setModalVisible(true);
    setNutritionChatVisible(false);
    
    // Pre-fill the form with nutrition data
    setMealName(nutrition.name);
    setDescription(nutrition.description);
    setCalories(nutrition.calories.toString());
    setProtein(nutrition.protein.toString());
    setCarbs(nutrition.carbs.toString());
    setFat(nutrition.fat.toString());
    
    // Keep the modal open so user can:
    // 1. Add more items to description
    // 2. Modify quantities
    // 3. Select category
  };

  useEffect(() => {
    // Add this temporary code to reset the stored categories
    const resetCategories = async () => {
      try {
        await AsyncStorage.removeItem('mealCategories');
        setAllCategories(MEAL_CATEGORIES);
        await saveMealCategories(MEAL_CATEGORIES);
      } catch (error) {
        console.log('Error resetting categories:', error);
      }
    };
    
    resetCategories();
  }, []);

  useEffect(() => {
    let subscription;
    
    const startTracking = async () => {
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        console.log('Pedometer available:', isAvailable); // Debug log
        setIsPedometerAvailable(isAvailable);
        
        if (isAvailable) {
          const now = new Date();
          const start = new Date(now);
          start.setHours(0, 0, 0, 0);
          
          const result = await Pedometer.getStepCountAsync(start, now);
          console.log('Steps result:', result); // Debug log
          
          if (result) {
            setStepCount(result.steps);
            calculateCaloriesBurned(result.steps);
          }
          
          subscription = Pedometer.watchStepCount(result => {
            console.log('New step count:', result.steps); // Debug log
            setStepCount(prevSteps => {
              const newSteps = result.steps;
              calculateCaloriesBurned(newSteps);
              return newSteps;
            });
          });
        }
      } catch (error) {
        console.log('Pedometer error:', error); // Debug log
      }
    };

    startTracking();
    
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  const calculateCaloriesBurned = (steps) => {
    // Average calories burned per step (can be adjusted based on user's weight)
    const caloriesPerStep = 0.04;
    const calories = Math.round(steps * caloriesPerStep);
    setCaloriesBurned(calories);
    
    // Save to AsyncStorage for midnight reset
    AsyncStorage.setItem('todaysCaloriesBurned', calories.toString());
  };

  useEffect(() => {
    const setupMidnightReset = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const timeUntilMidnight = tomorrow - now;

      setTimeout(() => {
        setStepCount(0);
        setCaloriesBurned(0);
        AsyncStorage.removeItem('todaysCaloriesBurned');
        setupMidnightReset();
      }, timeUntilMidnight);
    };

    setupMidnightReset();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>Hi {userData?.name || 'there'}!</Text>
            <Text style={styles.subGreeting}>Let's track your nutrition</Text>
            <ProgressArc 
              percentage={calculateCaloriePercentage()} 
              userData={userData}
              todaysTotals={todaysTotals}
              dailyGoal={dailyGoal}
            />
          </View>
        </LinearGradient>

        <View style={styles.newStatsContainer}>
          {['Protein', 'Carbs', 'Fat'].map((macro, index) => (
            <View key={index} style={styles.newStatCard}>
              <Ionicons 
                name={macro === 'Protein' ? 'fitness-outline' : macro === 'Carbs' ? 'nutrition-outline' : 'flame-outline'} 
                size={24} 
                color={theme.colors.primary} 
              />
              <Text style={styles.newStatLabel}>{macro}</Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progress, 
                    { 
                      width: `${Math.min(calculatePercentage(todaysTotals[macro.toLowerCase()], userData?.nutritionGoals?.[macro.toLowerCase()] || 100), 100)}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {todaysTotals[macro.toLowerCase()]}/{userData?.nutritionGoals?.[macro.toLowerCase()] || 100}g
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.quickMealsSection}>
          <Text style={styles.sectionTitle}>Meal Categories</Text>
          {Object.entries(allCategories).map(([category, { icon, meals }]) => (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity 
                style={styles.categoryCard}
                onPress={() => toggleCategory(category)}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryIcon}>
                    <Ionicons name={icon} size={24} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <Ionicons 
                    name={expandedCategory === category ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.textLight} 
                  />
                </View>
              </TouchableOpacity>
              
              {expandedCategory === category && (
                <View style={styles.mealsGrid}>
                  {meals.map((meal, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.mealCard}
                      onPress={() => {
                        setSelectedMealToAdd(meal);
                        setMealSlotModalVisible(true);
                      }}
                      onLongPress={() => {
                        setSelectedMealActions({
                          meal,
                          category,
                          index
                        });
                      }}
                      delayLongPress={500}
                    >
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.portionText}>{meal.description}</Text>
                      <View style={styles.nutritionInfo}>
                        <View style={[styles.macroItem, styles.caloriesMacro]}>
                          <Text style={[styles.macroText, styles.caloriesText]}>{meal.calories} cal</Text>
                        </View>
                        <View style={[styles.macroItem, styles.proteinMacro]}>
                          <Text style={[styles.macroText, styles.proteinText]}>{meal.protein}g</Text>
                        </View>
                        <View style={[styles.macroItem, styles.carbsMacro]}>
                          <Text style={[styles.macroText, styles.carbsText]}>{meal.carbs}g</Text>
                        </View>
                        <View style={[styles.macroItem, styles.fatMacro]}>
                          <Text style={[styles.macroText, styles.fatText]}>{meal.fat}g</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.fabContainer}>
        <Pressable
          onPress={() => setNutritionChatVisible(true)}
          style={styles.nutritionFab}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.fabGradient}
          >
            <Ionicons name="search" size={24} color="#fff" />
          </LinearGradient>
        </Pressable>
        
        <Pressable
          onPress={handlePress}
          style={styles.mainFab}
        >
          <LinearGradient
            colors={['#4ECDC4', '#2E8B57']}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Meal' : 'Add Custom Meal'}
              </Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setIsEditing(false);
                  setEditingMeal(null);
                  setMealName('');
                  setDescription('');
                  setCalories('');
                  setProtein('');
                  setCarbs('');
                  setFat('');
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <TouchableOpacity
                  style={styles.categorySelector}
                  onPress={() => setCategoryPickerVisible(true)}
                >
                  <Text style={styles.selectedCategory}>
                    {selectedCategory || 'Select a category'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Meal Name</Text>
                <TextInput
                  style={styles.input}
                  value={mealName}
                  onChangeText={setMealName}
                  placeholder="Enter meal name"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.descriptionContainer}>
                <Text style={styles.inputLabel}>Description</Text>
                <View style={styles.descriptionInputContainer}>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Enter meal description"
                    placeholderTextColor="#999"
                    multiline
                    numberOfLines={4}
                  />
                  <TouchableOpacity 
                    style={styles.addMoreButton}
                    onPress={() => setNutritionChatVisible(true)}
                  >
                    <Ionicons name="add-circle-outline" size={24} color="#4ECDC4" />
                    <Text style={styles.addMoreText}>Add more items</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.macrosContainer}>
                {[
                  { label: 'Calories', value: calories, setter: setCalories },
                  { label: 'Protein (g)', value: protein, setter: setProtein },
                  { label: 'Carbs (g)', value: carbs, setter: setCarbs },
                  { label: 'Fat (g)', value: fat, setter: setFat }
                ].map((macro, index) => (
                  <View key={index} style={styles.macroInput}>
                    <Text style={styles.inputLabel}>{macro.label}</Text>
                    <TextInput
                      style={styles.input}
                      value={macro.value}
                      onChangeText={macro.setter}
                      placeholder="0"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
                  </View>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity 
              style={styles.addButton}
              onPress={isEditing ? handleEditMeal : handleAddMeal}
            >
              <LinearGradient
                colors={['#4ECDC4', '#2E8B57']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButtonGradient}
              >
                <Text style={styles.addButtonText}>
                  {isEditing ? 'Save Changes' : 'Add Meal'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContent}>
            <Text style={styles.deleteModalTitle}>Delete Meal</Text>
            <Text style={styles.deleteModalText}>Are you sure you want to delete this meal?</Text>
            <View style={styles.deleteModalButtons}>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setMealToDelete(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteModalButton, styles.confirmButton]}
                onPress={handleDeleteMeal}
              >
                <Text style={styles.confirmButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={categoryPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCategoryPickerVisible(false)}
      >
        <View style={styles.categoryModalContainer}>
          <View style={styles.categoryModalContent}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <TouchableOpacity 
                onPress={() => setCategoryPickerVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {Object.entries(allCategories).map(([category, { icon }]) => (
              <TouchableOpacity
                key={category}
                style={styles.categoryOption}
                onPress={() => {
                  setSelectedCategory(category);
                  setCategoryPickerVisible(false);
                }}
              >
                <View style={styles.categoryOptionContent}>
                  <Ionicons name={icon} size={24} color="#4ECDC4" style={styles.categoryOptionIcon} />
                  <Text style={styles.categoryOptionText}>{category}</Text>
                </View>
                {selectedCategory === category && (
                  <Ionicons name="checkmark" size={24} color="#4ECDC4" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!selectedMealActions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedMealActions(null)}
      >
        <TouchableOpacity 
          style={styles.actionSheetOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMealActions(null)}
        >
          <View style={styles.actionSheetContainer}>
            <LinearGradient
              colors={['#fff', '#f8f8f8']}
              style={styles.actionSheet}
            >
              <View style={styles.actionSheetHeader}>
                <View style={styles.actionSheetIndicator} />
                <Text style={styles.actionSheetTitle}>
                  {selectedMealActions?.meal?.name}
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.actionSheetButton}
                onPress={() => {
                  const meal = selectedMealActions.meal;
                  setMealName(meal.name);
                  setDescription(meal.description);
                  setCalories(meal.calories.toString());
                  setProtein(meal.protein.toString());
                  setCarbs(meal.carbs.toString());
                  setSelectedCategory(selectedMealActions.category);
                  setEditingMeal({ 
                    category: selectedMealActions.category, 
                    index: selectedMealActions.index 
                  });
                  setIsEditing(true);
                  setModalVisible(true);
                  setSelectedMealActions(null);
                }}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#2E8B57']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="pencil" size={22} color="#fff" />
                  <Text style={styles.actionButtonText}>Edit Meal</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionSheetButton, styles.deleteButton]}
                onPress={() => {
                  setMealToDelete({ 
                    category: selectedMealActions.category, 
                    index: selectedMealActions.index 
                  });
                  setDeleteModalVisible(true);
                  setSelectedMealActions(null);
                }}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF4444']}
                  style={styles.actionButtonGradient}
                >
                  <Ionicons name="trash" size={22} color="#fff" />
                  <Text style={styles.actionButtonText}>Delete Meal</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionSheetButton, styles.cancelButton]}
                onPress={() => setSelectedMealActions(null)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={mealSlotModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setMealSlotModalVisible(false);
          setSelectedMealToAdd(null);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setMealSlotModalVisible(false);
            setSelectedMealToAdd(null);
          }}
        >
          <View style={styles.slotModalContainer}>
            <LinearGradient
              colors={['#fff', '#f8f8f8']}
              style={styles.slotModalContent}
            >
              <TouchableOpacity 
                style={styles.slotModalCloseButton}
                onPress={() => {
                  setMealSlotModalVisible(false);
                  setSelectedMealToAdd(null);
                }}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              
              <View style={styles.slotModalHeader}>
                <Text style={styles.slotModalTitle}>Add to Daily Plan</Text>
                <View style={styles.selectedMealInfo}>
                  <Text style={styles.selectedMealName}>{selectedMealToAdd?.name}</Text>
                  <Text style={styles.selectedMealCalories}>{selectedMealToAdd?.calories} calories</Text>
                </View>
              </View>
              
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.slotModalScrollContent}
              >
                {[1, 2, 3, 4, 5, 6].map((slot) => (
                  <FadeInView key={slot} delay={slot * 100}>
                    <TouchableOpacity
                      style={styles.mealSlotButton}
                      onPress={() => {
                        navigation.navigate('Plan', {
                          addMeal: {
                            mealSlot: slot,
                            meal: selectedMealToAdd
                          }
                        });
                        setMealSlotModalVisible(false);
                        setSelectedMealToAdd(null);
                      }}
                    >
                      <LinearGradient
                        colors={['#4ECDC4', '#2E8B57']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.slotButtonGradient}
                      >
                        <View style={styles.slotButtonContent}>
                          <View style={styles.slotIconContainer}>
                            <Ionicons 
                              name={slot === 1 ? 'sunny' : 
                                    slot === 2 ? 'cafe' :
                                    slot === 3 ? 'restaurant' :
                                    slot === 4 ? 'nutrition' :
                                    slot === 5 ? 'moon' : 'ice-cream'} 
                              size={24} 
                              color="#fff" 
                            />
                          </View>
                          <View style={styles.slotTextContainer}>
                            <Text style={styles.slotButtonText}>
                              {slot === 1 ? 'Breakfast' :
                               slot === 2 ? 'Morning Snack' :
                               slot === 3 ? 'Lunch' :
                               slot === 4 ? 'Afternoon Snack' :
                               slot === 5 ? 'Dinner' :
                               'Evening Snack'}
                            </Text>
                            <Text style={styles.slotTimeText}>
                              {slot === 1 ? '6:00 - 9:00 AM' :
                               slot === 2 ? '9:00 - 11:00 AM' :
                               slot === 3 ? '12:00 - 2:00 PM' :
                               slot === 4 ? '2:00 - 5:00 PM' :
                               slot === 5 ? '6:00 - 8:00 PM' :
                               '8:00 - 10:00 PM'}
                            </Text>
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  </FadeInView>
                ))}
              </ScrollView>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>

      <NutritionChat
        visible={nutritionChatVisible}
        onClose={() => setNutritionChatVisible(false)}
        onSelectNutrition={handleNutritionSelect}
      />
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
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerContent: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    marginHorizontal: 4,
    flex: 1,
    ...theme.shadows.small,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  goalNote: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
    marginTop: 4,
  },
  quickMealsSection: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  mealCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  mealName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  portionText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 10,
  },
  nutritionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  macroItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: 2,
    flex: 1,
  },
  caloriesMacro: {
    backgroundColor: 'rgba(255, 99, 99, 0.15)',
  },
  proteinMacro: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
  },
  carbsMacro: {
    backgroundColor: 'rgba(255, 159, 64, 0.15)',
  },
  fatMacro: {
    backgroundColor: 'rgba(255, 186, 0, 0.15)',
  },
  macroText: {
    fontSize: 10,
    marginLeft: 2,
  },
  caloriesText: {
    color: '#FF6363',
  },
  proteinText: {
    color: '#4ECDC4',
  },
  carbsText: {
    color: '#FF9F40',
  },
  fatText: {
    color: '#FFB300',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 25,
    zIndex: 1,
    padding: 5,
  },
  modalScroll: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedCategory: {
    fontSize: 16,
    color: '#333',
  },
  macrosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  macroInput: {
    width: '48%',
  },
  addButton: {
    marginHorizontal: 20,
    marginTop: 10,
  },
  addButtonGradient: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    gap: 10,
  },
  nutritionFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  mainFab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabPressed: {
    opacity: 0.95,
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 24,
    width: '85%',
    alignItems: 'center',
    ...theme.shadows.medium
  },
  deleteModalHeader: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,107,107,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    color: '#333',
  },
  deleteModalText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '95%',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...theme.shadows.small
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    backgroundColor: `${theme.colors.primary}15`,
    padding: 10,
    borderRadius: 12,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    flex: 1,
  },
  categoryPickerContainer: {
    marginBottom: 20,
  },
  categoryPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    height: 48,
  },
  categoryPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryPickerText: {
    fontSize: 16,
    color: '#333',
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  categoryModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    maxHeight: '80%',
  },
  categoryModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryOptionIcon: {
    marginRight: 15,
    width: 24,
  },
  categoryOptionText: {
    fontSize: 16,
    color: '#333',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  actionSheetOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  actionSheetContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  actionSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  actionSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionSheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 10,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  actionSheetButton: {
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 15,
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    padding: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotModalContainer: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    overflow: 'hidden',
    width: '90%',
    maxHeight: '80%',
    alignSelf: 'center',
  },
  slotModalContent: {
    borderRadius: 25,
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
  slotModalScrollContent: {
    padding: 24,
    paddingTop: 0,
  },
  slotModalHeader: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 24,
    padding: 24,
    paddingBottom: 0,
  },
  slotModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  selectedMealInfo: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  selectedMealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  selectedMealCalories: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  mealSlotButton: {
    marginBottom: 16,
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
  },
  slotButtonGradient: {
    padding: 20,
    width: '100%',
  },
  slotButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  slotIconContainer: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  slotTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  slotButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  slotTimeText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  smallCircle: {
    position: 'relative',
  },
  leftCircle: {
    marginRight: 8,
  },
  rightCircle: {
    marginLeft: 8,
  },
  iconContainer: {
    position: 'absolute',
    top: 6,
    left: '50%',
    transform: [{ translateX: -12 }],
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    padding: 3,
    zIndex: 1,
  },
  mainIconContainer: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: [{ translateX: -16 }],
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 16,
    padding: 5,
    zIndex: 1,
  },
  newStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginTop: -30,
  },
  newStatCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    ...theme.shadows.small,
  },
  newStatLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontWeight: '500',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginVertical: 8,
  },
  progress: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  macrosList: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderRadius: 10,
    padding: 8,
    marginTop: 12,
    paddingHorizontal: 4,
    gap: 4
  },
  macroItem: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginHorizontal: 2,
    flex: 1,
  },
  macroText: {
    fontSize: 10,
    color: '#333',
    marginLeft: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  deleteModalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  confirmButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    color: '#666',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  slotModalCloseButton: {
    position: 'absolute',
    right: -5,
    top: 20,
    zIndex: 1,
    padding: 5,
  },
  nutritionSearchInput: {
    height: 40,
    paddingVertical: 5,
  },
}); 