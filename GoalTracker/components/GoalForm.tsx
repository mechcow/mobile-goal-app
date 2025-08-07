import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, useColorScheme, View } from 'react-native';
import Colors from '../constants/Colors';
import { Goal, ValidationErrors } from '../types/goals';

interface GoalFormProps {
  goal: Goal;
  validationErrors: ValidationErrors;
  onGoalChange: (field: keyof Goal, value: string | number) => void;
  onRemove: () => void;
  showDatePicker: () => void;
  showPicker: boolean;
  onChangeDate: (event: any, selectedDate?: Date) => void;
  index: number;
}

const validUnits = ['km', 'miles', 'lbs', 'kg'];

const GoalForm: React.FC<GoalFormProps> = ({
  goal,
  validationErrors,
  onGoalChange,
  onRemove,
  showDatePicker,
  showPicker,
  onChangeDate,
  index,
}) => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);

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
    <View style={styles.goalContainer}>
      <View style={styles.goalHeader}>
        <Text style={styles.goalTitle}>Goal {index + 1}</Text>
        {index > 0 && (
          <TouchableOpacity onPress={onRemove} style={styles.removeButton}>
            <Text style={styles.removeButtonText}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle(!!validationErrors?.name)}
          placeholderTextColor={styles.placeholder.color}
          placeholder="Goal Name"
          value={goal.name}
          onChangeText={(text) => onGoalChange('name', text)}
        />
        {renderErrorText(validationErrors?.name)}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle(!!validationErrors?.description)}
          placeholderTextColor={styles.placeholder.color}
          placeholder="Description"
          value={goal.description}
          onChangeText={(text) => onGoalChange('description', text)}
        />
        {renderErrorText(validationErrors?.description)}
      </View>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          onPress={showDatePicker}
          style={[styles.datePickerButton, !!validationErrors?.targetDate && styles.inputError]}
        >
          <Text style={styles.datePickerButtonText}>
            {goal.targetDate ? goal.targetDate : 'Select Target Date'}
          </Text>
        </TouchableOpacity>
        {renderErrorText(validationErrors?.targetDate)}
      </View>

      {showPicker && (
        <DateTimePicker
          value={new Date(goal.targetDate || new Date())}
          mode="date"
          display="spinner"
          onChange={onChangeDate}
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={getInputStyle(!!validationErrors?.targetNumber)}
          placeholderTextColor={styles.placeholder.color}
          placeholder="Target Number"
          value={goal.targetNumber.toString()}
          keyboardType="numeric"
          onChangeText={(text) => onGoalChange('targetNumber', text)}
        />
        {renderErrorText(validationErrors?.targetNumber)}
      </View>

      <View style={styles.inputContainer}>
        <View style={[styles.unitPickerContainer, !!validationErrors?.targetUnit && styles.inputError]}>
          <Picker
            selectedValue={goal.targetUnit}
            onValueChange={(itemValue) => {
              onGoalChange('targetUnit', itemValue);
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
        {renderErrorText(validationErrors?.targetUnit)}
      </View>
    </View>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
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
    unitPickerContainer: {
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: 5,
      backgroundColor: colors.background,
    },
    picker: {
      height: 50,
      color: colors.text,
    },
  });
};

export default GoalForm;
