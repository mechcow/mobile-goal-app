import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Colors from '../constants/Colors';
import { getGoals, saveGoalProgress, updateGoalPhotos } from '../database';
import { Goal } from '../types/goals';

interface GoalProgress {
  goalId: number;
  currentValue: number;
  date: string;
}

const InitialMeasurementsScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [goalProgress, setGoalProgress] = useState<GoalProgress[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const fetchedGoals = await getGoals();
      setGoals(fetchedGoals as Goal[]);
      // Initialize progress tracking for each goal
      const initialProgress = fetchedGoals.map((goal: Goal) => ({
        goalId: goal.id,
        currentValue: 0,
        date: new Date().toISOString().split('T')[0],
      }));
      setGoalProgress(initialProgress);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to take photos for your progress tracking.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
             const result = await ImagePicker.launchCameraAsync({
         mediaTypes: ['images'],
         allowsEditing: true,
         aspect: [3, 4],
         quality: 0.8,
       });

      if (!result.canceled && result.assets[0]) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleProgressChange = (goalId: number, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setGoalProgress(prev => 
      prev.map(progress => 
        progress.goalId === goalId 
          ? { ...progress, currentValue: numValue }
          : progress
      )
    );
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      Alert.alert('Photo Required', 'Please take at least one photo for your progress tracking.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Save photos for each goal
      for (const goal of goals) {
        await updateGoalPhotos(goal.id, photos);
      }

      // Save progress measurements for each goal
      for (const progress of goalProgress) {
        await saveGoalProgress(progress.goalId, progress.currentValue, progress.date);
      }

      Alert.alert(
        'Success!',
        'Your initial photos and progress measurements have been saved. You can now track your progress!',
        [
          {
            text: 'Continue',
            onPress: () => router.push('/'),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
      Alert.alert('Error', 'Failed to save your progress. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderGoalProgressInput = (goal: Goal) => {
    const progress = goalProgress.find(p => p.goalId === goal.id);
    return (
      <View style={styles.goalProgressContainer}>
        <Text style={styles.goalName}>{goal.name}</Text>
        <Text style={styles.goalDescription}>{goal.description}</Text>
        <Text style={styles.targetText}>
          Target: {goal.targetNumber} {goal.targetUnit}
        </Text>
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Current Progress</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0.0"
              keyboardType="numeric"
              value={progress?.currentValue.toString() || '0'}
              onChangeText={(value) => handleProgressChange(goal.id, value)}
              placeholderTextColor={styles.placeholder.color}
            />
            <Text style={styles.unitText}>{goal.targetUnit}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.title}>Initial Progress Tracking</Text>
        <Text style={styles.subtitle}>
          Take photos and record your current progress towards each goal
        </Text>

      {/* Photo Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Photos</Text>
        <Text style={styles.sectionDescription}>
          Take photos from different angles to track your visual progress
        </Text>
        
        <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
          <Text style={styles.photoButtonText}>Take Photo</Text>
        </TouchableOpacity>

        {photos.length > 0 && (
          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoItem}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.removePhotoButton}
                  onPress={() => removePhoto(index)}
                >
                  <Text style={styles.removePhotoText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Goal Progress Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Initial Progress Tracking</Text>
        <Text style={styles.sectionDescription}>
          Record your current progress towards each goal
        </Text>

                 {goals.map((goal) => (
           <View key={goal.id}>
             {renderGoalProgressInput(goal)}
           </View>
         ))}
      </View>

              <TouchableOpacity
          style={[styles.saveButton, isSubmitting && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={styles.saveButtonText}>
            {isSubmitting ? 'Saving...' : 'Save & Continue'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flex: 1,
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.text,
      marginBottom: 30,
      opacity: 0.8,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 10,
      color: colors.text,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 15,
      opacity: 0.8,
    },
    photoButton: {
      backgroundColor: '#007BFF',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 15,
    },
    photoButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    photosContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    photoItem: {
      alignItems: 'center',
    },
    photo: {
      width: 100,
      height: 133,
      borderRadius: 8,
      marginBottom: 5,
    },
    removePhotoButton: {
      padding: 5,
    },
    removePhotoText: {
      color: '#dc3545',
      fontSize: 12,
      fontWeight: '500',
    },
    inputContainer: {
      marginBottom: 15,
    },
    goalProgressContainer: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    goalName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    goalDescription: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 5,
      opacity: 0.8,
    },
    targetText: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 10,
      fontWeight: '500',
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 5,
      color: colors.text,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    input: {
      flex: 1,
      height: 40,
      borderColor: colors.border,
      borderWidth: 1,
      paddingHorizontal: 10,
      borderRadius: 5,
      color: colors.text,
      backgroundColor: colors.background,
      marginRight: 10,
    },
    unitText: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '500',
      minWidth: 40,
    },
    placeholder: {
      color: colors.placeholderTextColor,
    },
    saveButton: {
      backgroundColor: '#28a745',
      padding: 15,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 20,
    },
    saveButtonDisabled: {
      backgroundColor: '#6c757d',
      opacity: 0.7,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 20,
    },
  });
};

export default InitialMeasurementsScreen; 