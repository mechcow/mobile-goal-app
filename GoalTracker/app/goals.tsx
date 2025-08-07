import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import GoalForm from '../components/GoalForm';
import Colors from '../constants/Colors';
import { validUnits } from '../constants/units';
import { initDatabase, saveGoal } from '../database';
import { Goal, ValidationErrors } from '../types/goals';
import { hasValidationErrors, validateGoal } from '../utils/validation';

const GoalSettingScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  const [goals, setGoals] = useState<Partial<Goal>[]>([
    { name: '', description: '', targetDate: '', targetNumber: 0, targetUnit: '' },
  ]);
  const [showPickers, setShowPickers] = useState<boolean[]>([false]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    initDatabase();
  }, []);

  const handleAddGoal = () => {
    setGoals([...goals, { name: '', description: '', targetDate: '', targetNumber: 0, targetUnit: '' }]);
    setShowPickers([...showPickers, false]);
    setValidationErrors([...validationErrors, {}]);
  };

  const handleGoalChange = (
    index: number,
    field: keyof Goal,
    value: string | number
  ) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setGoals(newGoals);

    const newValidationErrors = [...validationErrors];
    const errors = validateGoal(newGoals[index] as Goal);
    newValidationErrors[index] = errors;
    setValidationErrors(newValidationErrors);
  };

  const onChangeDate = (index: number, event: any, selectedDate?: Date) => {
    setShowPickers(showPickers.map((_, i) => (i === index ? false : _)));
    if (event.type === 'set' && selectedDate) {
      handleGoalChange(index, 'targetDate', selectedDate.toISOString().split('T')[0]);
    }
  };

  const showDatePicker = (index: number) => {
    setShowPickers(showPickers.map((_, i) => (i === index ? true : false)));
  };

  const handleRemoveGoal = (index: number) => {
    const newGoals = goals.filter((_, i) => i !== index);
    const newValidationErrors = validationErrors.filter((_, i) => i !== index);
    const newShowPickers = showPickers.filter((_, i) => i !== index);
    setGoals(newGoals);
    setValidationErrors(newValidationErrors);
    setShowPickers(newShowPickers);
  };

  const handleSaveGoals = async () => {
    try {
      setIsSubmitting(true);
      setSubmitMessage(null);
      
      const allErrors: ValidationErrors[] = goals.map(goal => validateGoal(goal as Goal));
      setValidationErrors(allErrors);

      const hasAnyErrors = allErrors.some(errors => hasValidationErrors(errors));

      if (hasAnyErrors) {
        setSubmitMessage({ type: 'error', text: 'Please fix the validation errors before saving.' });
        setIsSubmitting(false);
        return;
      }

      for(const goal of goals) {
        await saveGoal(goal.name!, goal.description!, goal.targetDate!, goal.targetNumber!, goal.targetUnit!);
      }

      setSubmitMessage({ type: 'success', text: 'Goals saved successfully!' });
      setTimeout(() => {
        router.push('/initial-measurements');
      }, 1500);
    } catch (error) {
      console.error('Failed to save goals:', error);
      setSubmitMessage({ type: 'error', text: 'Failed to save goals. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
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
        <GoalForm
          key={index}
          index={index}
          goal={goal as Goal}
          validationErrors={validationErrors[index] || {}}
          onGoalChange={(field, value) => handleGoalChange(index, field, value)}
          onRemove={() => handleRemoveGoal(index)}
          showDatePicker={() => showDatePicker(index)}
          showPicker={showPickers[index]}
          onChangeDate={(event, selectedDate) => onChangeDate(index, event, selectedDate)}
        />
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
    addButton: {
      backgroundColor: Colors.light.tint,
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
  });
};

export default GoalSettingScreen;
