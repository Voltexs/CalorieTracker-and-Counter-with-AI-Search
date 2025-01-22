import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AddMealModal({ visible, onClose, onAdd }) {
  const [mealName, setMealName] = useState('');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');

  const handleAddMeal = () => {
    // Validate numeric inputs
    const caloriesNum = Number(calories);
    const proteinNum = Number(protein);
    const carbsNum = Number(carbs);

    // Basic validation
    if (!mealName.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (isNaN(caloriesNum) || caloriesNum > 2000) {
      Alert.alert('Error', 'Please enter valid calories (max 2000)');
      return;
    }

    if (isNaN(proteinNum) || proteinNum > 200) {
      Alert.alert('Error', 'Please enter valid protein (max 200g)');
      return;
    }

    if (isNaN(carbsNum) || carbsNum > 300) {
      Alert.alert('Error', 'Please enter valid carbs (max 300g)');
      return;
    }

    // Create meal object with validated numbers
    const newMeal = {
      name: mealName.trim(),
      description: description.trim(),
      calories: caloriesNum,
      protein: proteinNum,
      carbs: carbsNum
    };

    onAdd(newMeal);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setMealName('');
    setDescription('');
    setCalories('');
    setProtein('');
    setCarbs('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ScrollView>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Meal</Text>
              <View style={styles.headerButtons}>
                <TouchableOpacity 
                  style={styles.nutritionButton}
                  onPress={() => {
                    setNutritionChatVisible(true);
                  }}
                >
                  <Ionicons name="search" size={24} color="#4ECDC4" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.inputLabel}>Meal Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Lean Mince Wrap"
              value={mealName}
              onChangeText={setMealName}
            />

            <Text style={styles.inputLabel}>Ingredients/Description</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="e.g., • 150g lean mince&#10;• 1 brown wrap&#10;• 1 tbsp sriracha"
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
                  maxLength={4}
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
                  maxLength={3}
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
                  maxLength={3}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddMeal}
            >
              <Text style={styles.addButtonText}>Add Meal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
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
}); 