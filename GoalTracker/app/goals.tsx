
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import Colors from '../constants/Colors';
import { initDatabase, saveGoal } from '../database';
import { Goal, ValidationErrors } from '../types/goals';
import { hasValidationErrors, validateGoal } from '../utils/validation';

const GoalSettingScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  const [goals, setGoals] = useState<Goal[]>([
    { id: -1, name: '', description: '', targetDate: '', targetNumber: 0, targetUnit: '' },
  ]);
  const [showPickers, setShowPickers] = useState<boolean[]>([false]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>([]);
  const [hasValidated, setHasValidated] = useState<boolean[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const validUnits = ['km', 'miles', 'lbs', 'kg'];

  useEffect(() => {
    initDatabase();
  }, []);

  const handleAddGoal = () => {
    setGoals([...goals, { id: -1, name: '', description: '', targetDate: '', targetNumber: 0, targetUnit: '' }]);
    setShowPickers([...showPickers, false]);
    setValidationErrors([...validationErrors, {}]);
    setHasValidated([...hasValidated, false]);
  };

  const handleGoalChange = (
    index: number,
    field: keyof Goal,
    value: string | number
  ) => {
    const newGoals = [...goals];
    // Type-safe assignment for known Goal fields
    if (field === 'name' || field === 'description' || field === 'targetDate' || field === 'targetUnit') {
      newGoals[index][field] = value as string;
    } else if (field === 'targetNumber' || field === 'id') {
      newGoals[index][field] = value as number;
    }
    setGoals(newGoals);

    // Live validation
    if (hasValidated[index] || value !== '') {
      const newValidationErrors = [...validationErrors];
      const goal = newGoals[index];
      const errors = validateGoal(goal);
      newValidationErrors[index] = errors;
      setValidationErrors(newValidationErrors);
    }
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
    const newValidationErrors = validationErrors.filter((_, i) => i !== index);
    const newHasValidated = hasValidated.filter((_, i) => i !== index);
    const newShowPickers = showPickers.filter((_, i) => i !== index);
    setGoals(newGoals);
    setValidationErrors(newValidationErrors);
    setHasValidated(newHasValidated);
    setShowPickers(newShowPickers);
  };

  const handleSaveGoals = async () => {
    try {
      setIsSubmitting(true);
      setSubmitMessage(null);
      
      // Validate all goals
      const allErrors: ValidationErrors[] = [];
      const newHasValidated = goals.map(() => true);
      setHasValidated(newHasValidated);

      for (let i = 0; i < goals.length; i++) {
        const errors = validateGoal(goals[i]);
        allErrors.push(errors);
      }

      setValidationErrors(allErrors);

      const hasAnyErrors = allErrors.some(errors => hasValidationErrors(errors));

      if (hasAnyErrors) {
        setSubmitMessage({ type: 'error', text: 'Please fix the validation errors before saving.' });
        setIsSubmitting(false);
        return;
      }

      for(const goal of goals) {
        await saveGoal(goal.name, goal.description, goal.targetDate, goal.targetNumber, goal.targetUnit);
      }

      setSubmitMessage({ type: 'success', text: 'Goals saved successfully!' });
      setTimeout(() => {
        router.push('/goals-summary');
      }, 1500);
    } catch (error) {
      console.error('Failed to save goals:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to save goals. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderErrorText = (error: string | undefined) => {
    if (!error) return null;
    return <Text style={styles.errorText}>{error}</Text>;
  };

  const getInputStyle = (hasError: boolean) => {
    return [
      styles.input,
      hasError && styles.inputError
    ];
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Set Your Fitness Goals</Text>
      
      {submitMessage && (
        <View style={[styles.messageContainer, submitMessage.type === 'success' ? styles.successMessage : styles.errorMessage]}>
          <Text style={styles.messageText}>{submitMessage.text}</Text>
        </View>
      )}

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
          
          <View style={styles.inputContainer}>
            <TextInput
              style={getInputStyle(!!validationErrors[index]?.name)}
              placeholderTextColor={styles.placeholder.color}
              placeholder="Goal Name"
              value={goal.name}
              onChangeText={(text) => handleGoalChange(index, 'name', text)}
            />
            {renderErrorText(validationErrors[index]?.name)}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={getInputStyle(!!validationErrors[index]?.description)}
              placeholderTextColor={styles.placeholder.color}
              placeholder="Description"
              value={goal.description}
              onChangeText={(text) => handleGoalChange(index, 'description', text)}
            />
            {renderErrorText(validationErrors[index]?.description)}
          </View>

          <View style={styles.inputContainer}>
            <TouchableOpacity 
              onPress={() => showDatePicker(index)} 
              style={[styles.datePickerButton, !!validationErrors[index]?.targetDate && styles.inputError]}
            >
              <Text style={styles.datePickerButtonText}>
                {goal.targetDate ? goal.targetDate : 'Select Target Date'}
              </Text>
            </TouchableOpacity>
            {renderErrorText(validationErrors[index]?.targetDate)}
          </View>

          {showPickers[index] && (
            <DateTimePicker
              value={new Date(goal.targetDate || new Date())}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => onChangeDate(index, event, selectedDate)}
            />
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={getInputStyle(!!validationErrors[index]?.targetNumber)}
              placeholderTextColor={styles.placeholder.color}
              placeholder="Target Number"
              value={goal.targetNumber.toString()}
              keyboardType="numeric"
              onChangeText={(text) => handleGoalChange(index, 'targetNumber', text)}
            />
            {renderErrorText(validationErrors[index]?.targetNumber)}
          </View>

          <View style={styles.inputContainer}>
            <View style={[styles.unitPickerContainer, !!validationErrors[index]?.targetUnit && styles.inputError]}>
              <Picker
                selectedValue={goal.targetUnit}
                onValueChange={(itemValue) => {
                  handleGoalChange(index, 'targetUnit', itemValue);
                }}
                style={styles.picker}
                mode="dropdown"
              >
                <Picker.Item label="Select a unit..." value="" />
                {validUnits.map((unit) => (
                  <Picker.Item key={unit} label={unit} value={unit} />
                ))}
              </Picker>
            </View>
            {renderErrorText(validationErrors[index]?.targetUnit)}
          </View>
        </View>
      ))}
      
      <TouchableOpacity onPress={handleAddGoal} style={styles.addButton}>
        <Text style={styles.addButtonText}>Add Another Goal</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        onPress={handleSaveGoals} 
        style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
        disabled={isSubmitting}
      >
        <Text style={styles.saveButtonText}>
          {isSubmitting ? 'Saving...' : 'Save Goals'}
        </Text>
      </TouchableOpacity>
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
    messageContainer: {
      padding: 12,
      borderRadius: 8,
      marginBottom: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    successMessage: {
      backgroundColor: '#d4edda',
      borderColor: '#c3e6cb',
      borderWidth: 1,
    },
    errorMessage: {
      backgroundColor: '#f8d7da',
      borderColor: '#f5c6cb',
      borderWidth: 1,
    },
    messageText: {
      fontSize: 14,
      fontWeight: '500',
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
      color: '#dc3545',
      fontSize: 14,
      fontWeight: '500',
    },
    inputContainer: {
      marginBottom: 10,
    },
    input: {
      height: 40,
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 5,
      color: colors.text,
      backgroundColor: colors.background,
    },
    inputError: {
      borderColor: '#dc3545',
      borderWidth: 2,
    },
    errorText: {
      color: '#dc3545',
      fontSize: 12,
      marginTop: 4,
      marginLeft: 4,
    },
    placeholder: {
      color: colors.placeholderTextColor,
    },
    addButton: {
      backgroundColor: '#007BFF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    saveButton: {
      backgroundColor: '#28a745',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    saveButtonDisabled: {
      backgroundColor: '#6c757d',
      opacity: 0.7,
    },
    saveButtonText: {
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
      backgroundColor: colors.background,
    },
    datePickerButtonText: {
      color: colors.text,
    },
    unitPickerButton: {
      height: 40,
      justifyContent: 'center',
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 5,
      backgroundColor: colors.background,
    },
    unitPickerButtonText: {
      color: colors.text,
    },
    unitPickerContainer: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 5,
      backgroundColor: colors.background,
    },
    pickerContainer: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 5,
      backgroundColor: colors.background,
      marginTop: 1,
    },
    picker: {
      height: 50,
      color: colors.text,
    },
  });
};

export default GoalSettingScreen;
