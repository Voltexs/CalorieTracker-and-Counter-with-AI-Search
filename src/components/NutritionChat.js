import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NUTRITIONIX_CONFIG } from '../config/nutritionix';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    height: '80%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    height: 40,
  },
  searchButton: {
    backgroundColor: '#4ECDC4',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  macros: {
    flexDirection: 'row',
    gap: 10,
  },
  macro: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  }
});

export default function NutritionChat({ visible, onClose, onSelectNutrition }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);

  const searchNutrition = async () => {
    setLoading(true);
    try {
      // First, get similar food suggestions
      const searchResponse = await fetch(`${NUTRITIONIX_CONFIG.BASE_URL}/search/instant?query=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'x-app-id': NUTRITIONIX_CONFIG.APP_ID,
          'x-app-key': NUTRITIONIX_CONFIG.API_KEY,
        },
      });
      
      const searchData = await searchResponse.json();
      
      // Extract quantity and unit from the original query
      const quantity = query.match(/\d+/)?.[0] || '100';
      const unit = query.match(/[g|oz|ml]+/)?.[0] || 'g';
      
      // Get nutrients for each suggested food
      const foodItems = [...(searchData.common || []), ...(searchData.branded || [])].slice(0, 5);
      
      const nutrientPromises = foodItems.map(food => 
        fetch(`${NUTRITIONIX_CONFIG.BASE_URL}/natural/nutrients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-app-id': NUTRITIONIX_CONFIG.APP_ID,
            'x-app-key': NUTRITIONIX_CONFIG.API_KEY,
          },
          body: JSON.stringify({
            query: `${quantity}${unit} ${food.food_name}`,
          }),
        }).then(res => res.json())
      );

      const nutrientResults = await Promise.all(nutrientPromises);
      const combinedResults = nutrientResults.map(result => result.foods[0]).filter(Boolean);
      
      setResults(combinedResults);
    } catch (error) {
      console.error('Error fetching nutrition:', error);
    }
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Nutrition Search</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.input}
              placeholder="Enter food name and grams."
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchNutrition}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={searchNutrition}
            >
              <Ionicons name="search" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#4ECDC4" />
          ) : (
            <FlatList
              data={results}
              keyExtractor={(item) => item.food_name}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.resultItem}
                  onPress={() => onSelectNutrition({
                    name: `${item.serving_qty} ${item.serving_unit} ${item.food_name}`,
                    description: `• ${item.serving_qty} ${item.serving_unit} ${item.food_name}`,
                    calories: Math.round(item.nf_calories),
                    protein: Math.round(item.nf_protein),
                    carbs: Math.round(item.nf_total_carbohydrate),
                    fat: Math.round(item.nf_total_fat)
                  })}
                >
                  <Text style={styles.foodName}>
                    {`${item.serving_qty}${item.serving_unit.toLowerCase()} ${item.food_name}`}
                  </Text>
                  <View style={styles.macros}>
                    <Text style={styles.macro}>{Math.round(item.nf_calories)} cal</Text>
                    <Text style={styles.macro}>{Math.round(item.nf_protein)}g protein</Text>
                    <Text style={styles.macro}>{Math.round(item.nf_total_carbohydrate)}g carbs</Text>
                    <Text style={styles.macro}>{Math.round(item.nf_total_fat)}g fat</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      </View>
    </Modal>
  );
} 