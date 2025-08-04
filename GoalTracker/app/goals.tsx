
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import Colors from '../constants/Colors';
import { initDatabase, saveGoal } from '../database';
import { Goal } from '../types/goals';

const GoalSettingScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([
    { name: '', description: '', targetDate: '', targetNumber: 0, targetUnit: '' },
  ]);
  const [showPickers, setShowPickers] = useState<boolean[]>([false]);

  useEffect(() => {
    initDatabase();
  }, []);

  const handleAddGoal = () => {
    setGoals([...goals, { name: '', description: '', targetDate: '', targetNumber: 0, targetUnit: '' }]);
    setShowPickers([...showPickers, false]);
  };

  const handleGoalChange = (index: number, field: keyof Goal, value: string | number) => {
    const newGoals = [...goals];
    newGoals[index][field] = value;
    setGoals(newGoals);
  };

  const onChangeDate = (index: number, event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowPickers(showPickers.map((_, i) => (i === index ? false : _)));
    if (event.type === 'set' && selectedDate) {
      handleGoalChange(index, 'targetDate', currentDate.toISOString().split('T')[0]);
    }
  };

  const showDatePicker = (index: number) => {
    setShowPickers(showPickers.map((_, i) => (i === index ? true : false)));
  };

  const handleRemoveGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index);
    setGoals(newGoals);
  };

  const handleSaveGoals = async () => {
    try {
      for (const goal of goals) {
        if (goal.name && goal.description && goal.targetDate) {
          await saveGoal(goal.name, goal.description, goal.targetDate, goal.targetNumber, goal.targetUnit);
        } else {
          Alert.alert('Validation Error', 'Please fill in all fields for each goal.');
          return;
        }
      }
      Alert.alert('Success', 'Goals saved successfully!');
      router.push('/goals-summary'); // Navigate to goal summary screen
    } catch (error) {
      console.error('Failed to save goals:', error);
      Alert.alert('Error', 'Failed to save goals.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Set Your Fitness Goals</Text>
      {goals.map((goal, index) => (
        <View key={index} style={styles.goalContainer}>
          <View style={styles.goalHeader}>
            <Text style={styles.goalTitle}>Goal {index + 1}</Text>
            {index > 0 && (
              <TouchableOpacity onPress={() => handleRemoveGoal(index)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <TextInput
            style={styles.input}
            placeholderTextColor={styles.placeholder.color}
            placeholder="Goal Name"
            value={goal.name}
            onChangeText={(text) => handleGoalChange(index, 'name', text)}
          />
          <TextInput
            style={styles.input}
            placeholderTextColor={styles.placeholder.color}
            placeholder="Description"
            value={goal.description}
            onChangeText={(text) => handleGoalChange(index, 'description', text)}
          />
          <TouchableOpacity onPress={() => showDatePicker(index)} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>
              {goal.targetDate ? goal.targetDate : 'Select Target Date'}
            </Text>
          </TouchableOpacity>
          {showPickers[index] && (
            <DateTimePicker
              value={new Date(goal.targetDate || new Date())}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => onChangeDate(index, event, selectedDate)}
            />
          )}
          <TextInput
            style={styles.input}
            placeholderTextColor={styles.placeholder.color}
            placeholder="Target Number"
            value={goal.targetNumber.toString()}
            keyboardType="numeric"
            onChangeText={(text) => handleGoalChange(index, 'targetNumber', text)}
          />
          <TextInput
            style={styles.input}
            placeholderTextColor={styles.placeholder.color}
            placeholder="Target Unit"
            value={goal.targetUnit}
            onChangeText={(text) => handleGoalChange(index, 'targetUnit', text)}
          />
        </View>
      ))}
      <TouchableOpacity onPress={handleAddGoal} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Another Goal</Text>
      </TouchableOpacity>
      <Button title="Save Goals" onPress={handleSaveGoals} />
    </ScrollView>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: colors.text,
    },
    goalContainer: {
      marginBottom: 20,
      padding: 15,
      borderRadius: 10,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    goalTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    removeButton: {
      padding: 5,
    },
    removeButtonText: {
      color: 'red',
      fontSize: 14,
    },
    input: {
      height: 40,
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 5,
      marginBottom: 10,
      color: colors.text,
    },
    placeholder: {
      color: colors.placeholderTextColor,
    },
    addButton: {
      backgroundColor: '#007BFF',
      padding: 15,
      borderRadius: 5,
      alignItems: 'center',
      marginBottom: 20,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    datePickerButton: {
      height: 40,
      justifyContent: 'center',
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 5,
      marginBottom: 10,
    },
    datePickerButtonText: {
      color: colors.text,
    },
  });
};

export default GoalSettingScreen;
