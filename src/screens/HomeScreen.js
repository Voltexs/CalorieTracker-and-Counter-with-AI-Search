import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Animated, Pressable, Easing, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const MEAL_CATEGORIES = {
  Breakfast: {
    icon: "sunny-outline",
    meals: [
      {
        name: "Breakfast Bowl",
        description: "• 3 large eggs\n• 80g oats\n• ½ scoop whey\n• 30g blueberries",
        calories: 405,
        protein: 27,
        carbs: 35
      },
      {
        name: "Eggs on Toast",
        description: "• 3 large eggs\n• 2 brown bread",
        calories: 310,
        protein: 21,
        carbs: 20
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
        carbs: 18
      },
      {
        name: "Chicken & Brown Rice",
        description: "• 150g chicken breast\n• 100g brown rice\n• 1 tbsp sriracha",
        calories: 355,
        protein: 36,
        carbs: 30
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
        carbs: 18
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
        carbs: 0
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
        carbs: 2
      },
      {
        name: "Protein Shake Plus",
        description: "• 1 scoop whey\n• 1 banana\n• 1 tbsp peanut butter",
        calories: 270,
        protein: 26,
        carbs: 21
      }
    ]
  },
  "Cheat Meals": {
    icon: "pizza-outline",
    meals: [
      {
        name: "Burger & Fries",
        description: "• 1 beef burger\n• 1 brioche bun\n• Regular fries",
        calories: 850,
        protein: 35,
        carbs: 89
      },
      {
        name: "Pizza Slice",
        description: "• 2 slices pizza\n• Ranch dip",
        calories: 560,
        protein: 22,
        carbs: 65
      },
      {
        name: "Ice Cream Bowl",
        description: "• 2 scoops vanilla\n• Chocolate sauce\n• Sprinkles",
        calories: 380,
        protein: 8,
        carbs: 48
      }
    ]
  }
};

export default function HomeScreen({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [customMeals, setCustomMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
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
    carbs: 0
  });

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
    
    if (!mealName || !calories || !protein || !carbs) {
      Alert.alert("Missing Fields", "Please fill in all required fields");
      return;
    }

    const newMeal = {
      name: mealName,
      description: description || '',
      calories: parseInt(calories),
      protein: parseInt(protein),
      carbs: parseInt(carbs),
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

  const handleDeleteMeal = async (category, mealIndex) => {
    const updatedCategories = { ...allCategories };
    updatedCategories[category].meals.splice(mealIndex, 1);
    await saveMealCategories(updatedCategories);
    setAllCategories(updatedCategories);
    setDeleteModalVisible(false);
    setMealToDelete(null);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <LinearGradient
          colors={['#4ECDC4', '#2E8B57']}
          style={styles.header}
        >
          <Text style={styles.greeting}>Hi Cassie! 👋</Text>
          <Text style={styles.subGreeting}>Ready to track your meals?</Text>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Calories</Text>
            <Text style={styles.statValue}>{todaysTotals.calories}/2000</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Protein</Text>
            <Text style={styles.statValue}>{todaysTotals.protein}/200g</Text>
          </View>
        </View>

        <View style={styles.quickMealsSection}>
          <Text style={styles.sectionTitle}>Meal Categories</Text>
          {Object.entries(allCategories).map(([category, { icon, meals }]) => (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity 
                style={styles.categoryHeader}
                onPress={() => {
                  setExpandedCategory(expandedCategory === category ? null : category);
                }}
              >
                <View style={styles.categoryTitleContainer}>
                  <Ionicons name={icon} size={24} color="#4ECDC4" style={styles.categoryIcon} />
                  <Text style={styles.categoryTitle}>{category}</Text>
                </View>
                <Ionicons 
                  name={expandedCategory === category ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#4ECDC4" 
                />
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
                    >
                      <Text style={styles.mealName}>{meal.name}</Text>
                      <Text style={styles.portionText}>{meal.description}</Text>
                      <View style={styles.nutritionInfo}>
                        <Text style={styles.mealCalories}>{meal.calories} cal</Text>
                        <Text style={styles.mealProtein}>{meal.protein}g</Text>
                        <Text style={styles.mealCarbs}>{meal.carbs}g</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Enhanced Floating Action Button */}
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: 'rgba(255,255,255,0.3)', radius: 35 }}
        style={({ pressed }) => [
          styles.fabContainer,
          pressed && styles.fabPressed
        ]}
      >
        <Animated.View style={[
          styles.fab,
          { 
            transform: [
              { scale: pressedAnim },
              { rotate: spin }
            ] 
          }
        ]}>
          <LinearGradient
            colors={['#4ECDC4', '#2E8B57']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </LinearGradient>
        </Animated.View>
      </Pressable>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? 'Edit Meal' : 'Add Custom Meal'}
              </Text>
              <TouchableOpacity onPress={() => {
                setModalVisible(false);
                setIsEditing(false);
                setEditingMeal(null);
                setMealName('');
                setDescription('');
                setCalories('');
                setProtein('');
                setCarbs('');
              }}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.categoryPickerContainer}>
              <Text style={styles.inputLabel}>Category *</Text>
              <TouchableOpacity 
                style={styles.categoryPicker}
                onPress={() => setCategoryPickerVisible(true)}
              >
                <View style={styles.categoryPickerContent}>
                  {selectedCategory && (
                    <Ionicons 
                      name={allCategories[selectedCategory].icon} 
                      size={24} 
                      color="#4ECDC4" 
                      style={styles.categoryIcon}
                    />
                  )}
                  <Text style={[
                    styles.categoryPickerText,
                    !selectedCategory && { color: '#999' }
                  ]}>
                    {selectedCategory || "Select a category"}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Meal Name"
              value={mealName}
              onChangeText={setMealName}
            />

            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="• 150g lean mince&#10;• 1 brown wrap&#10;• 1 tbsp sriracha"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <View style={styles.macrosContainer}>
              <View style={styles.macroInput}>
                <Text style={styles.macroLabel}>Calories</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={calories}
                  onChangeText={setCalories}
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.macroLabel}>Protein (g)</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={protein}
                  onChangeText={setProtein}
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.macroLabel}>Carbs (g)</Text>
                <TextInput
                  style={styles.numberInput}
                  placeholder="0"
                  keyboardType="numeric"
                  value={carbs}
                  onChangeText={setCarbs}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.addButton}
              onPress={isEditing ? handleEditMeal : handleAddMeal}
            >
              <Text style={styles.addButtonText}>
                {isEditing ? 'Save Changes' : 'Add Meal'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.deleteModalContainer}>
          <View style={styles.deleteModalContent}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E8E']}
              style={styles.deleteModalHeader}
            >
              <Ionicons name="trash-outline" size={30} color="white" />
            </LinearGradient>
            
            <Text style={styles.deleteModalTitle}>Delete Meal</Text>
            <Text style={styles.deleteModalText}>
              Are you sure you want to delete this meal?
            </Text>
            
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
                style={[styles.deleteModalButton, styles.deleteButton]}
                onPress={() => {
                  if (mealToDelete) {
                    handleDeleteMeal(mealToDelete.category, mealToDelete.index);
                  }
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
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
              <View style={styles.slotModalHeader}>
                <View style={styles.modalIndicator} />
                <Text style={styles.slotModalTitle}>Add to Daily Plan</Text>
                <Text style={styles.selectedMealName}>{selectedMealToAdd?.name}</Text>
              </View>

              {[1, 2, 3, 4, 5, 6].map((slot) => (
                <TouchableOpacity
                  key={slot}
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
                    style={styles.slotButtonGradient}
                  >
                    <Ionicons 
                      name={slot === 1 ? 'sunny' : 
                            slot === 2 ? 'cafe' :
                            slot === 3 ? 'restaurant' :
                            slot === 4 ? 'nutrition' :
                            slot === 5 ? 'moon' : 'ice-cream'} 
                      size={24} 
                      color="#fff" 
                    />
                    <Text style={styles.slotButtonText}>
                      Meal {slot}
                      <Text style={styles.slotTimeText}>
                        {slot === 1 ? ' (Breakfast)' :
                         slot === 2 ? ' (Morning Snack)' :
                         slot === 3 ? ' (Lunch)' :
                         slot === 4 ? ' (Afternoon Snack)' :
                         slot === 5 ? ' (Dinner)' :
                         ' (Evening Snack)'}
                      </Text>
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Modal>
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
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    marginTop: -30,
  },
  statCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 15,
    width: width * 0.43,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
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
    alignItems: 'center',
    marginTop: 'auto',
  },
  mealCalories: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  mealProtein: {
    fontSize: 12,
    color: '#4ECDC4',
    fontWeight: '500',
    backgroundColor: '#e6f7f5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 4,
  },
  mealCarbs: {
    fontSize: 12,
    color: '#FF6B6B',
    fontWeight: '500',
    backgroundColor: '#ffe6e6',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  descriptionInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  macroLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#4ECDC4',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addMealContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMealText: {
    color: '#4ECDC4',
    marginTop: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 999,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 10,
  },
  fabGradient: {
    width: 80,
    height: 80,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  fabPressed: {
    opacity: 0.95,
  },
  deleteModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  deleteModalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  deleteModalHeader: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  deleteModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  deleteModalText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
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
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: '#FF6B6B',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  categorySection: {
    marginBottom: 15,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryIcon: {
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  actionSheet: {
    padding: 20,
    paddingBottom: 30,
  },
  actionSheetHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  actionSheetIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  slotModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  slotModalContent: {
    padding: 20,
    paddingBottom: 30,
  },
  slotModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 10,
  },
  slotModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  selectedMealName: {
    fontSize: 16,
    color: '#666',
  },
  mealSlotButton: {
    marginBottom: 10,
    borderRadius: 15,
    overflow: 'hidden',
  },
  slotButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  slotButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  slotTimeText: {
    fontWeight: '400',
    opacity: 0.9,
  },
}); 