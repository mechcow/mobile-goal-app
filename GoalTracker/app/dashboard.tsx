import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import GoalCard from '../components/GoalCard';
import Colors from '../constants/Colors';
import { deleteGoal, getGoalProgress, getGoals } from '../database';
import { GoalWithProgress } from '../types/goals';

const DashboardScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  
  const [goalsWithProgress, setGoalsWithProgress] = useState<GoalWithProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGoalsAndProgress();
  }, []);

  const fetchGoalsAndProgress = async () => {
    try {
      setIsLoading(true);
      const goals = await getGoals();
      const goalsWithProgressData: GoalWithProgress[] = [];

      for (const goal of goals) {
        const progress = await getGoalProgress(goal.id);
        const latestProgress = progress.length > 0 ? progress[progress.length - 1].currentValue : 0;
        const progressPercentage = goal.targetNumber > 0 ? (latestProgress / goal.targetNumber) * 100 : 0;

        goalsWithProgressData.push({
          ...goal,
          progress,
          latestProgress,
          progressPercentage: Math.min(progressPercentage, 100),
        });
      }

      setGoalsWithProgress(goalsWithProgressData);
    } catch (error) {
      console.error('Failed to fetch goals and progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGoal = (goal: GoalWithProgress) => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone and will also delete all associated progress data.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goal.id);
              // Refresh the goals list
              await fetchGoalsAndProgress();
            } catch (error) {
              console.error('Failed to delete goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading your goals...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../assets/images/banner.png')} style={styles.image} />
        <Text style={styles.subtitle}>
          Track your progress towards your goals
        </Text>
      </View>

      {goalsWithProgress.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Goals Set Yet</Text>
          <Text style={styles.emptyStateText}>
            Start your fitness journey by setting some goals!
          </Text>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={() => router.push('/goals')}
          >
            <Text style={styles.primaryButtonText}>Set Your First Goal</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{goalsWithProgress.length}</Text>
              <Text style={styles.statLabel}>Active Goals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {goalsWithProgress.filter(g => g.completed).length}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>
                {goalsWithProgress.length > 0 
                  ? (goalsWithProgress.reduce((sum, g) => sum + g.progressPercentage, 0) / goalsWithProgress.length).toFixed(1)
                  : '0'
                }%
              </Text>
              <Text style={styles.statLabel}>Avg Progress</Text>
            </View>
          </View>

          <View style={styles.goalsSection}>
            <Text style={styles.sectionTitle}>Your Goals</Text>
            {goalsWithProgress.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onDelete={handleDeleteGoal} />
            ))}
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/goals')}
            >
              <Text style={styles.secondaryButtonText}>Add New Goal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => router.push('/initial-measurements')}
            >
              <Text style={styles.secondaryButtonText}>Update Progress</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </ScrollView>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 40,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.8,
    },
    image: {
      width: '100%',
      height: 50,
      borderRadius: 10,
      marginBottom: 15,
    },
    loadingText: {
      fontSize: 18,
      textAlign: 'center',
      color: colors.text,
      marginTop: 100,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    emptyStateTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 10,
    },
    emptyStateText: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.text,
      opacity: 0.8,
      marginBottom: 30,
    },
    statsContainer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginHorizontal: 5,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    statNumber: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 5,
    },
    statLabel: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.8,
    },
    goalsSection: {
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 15,
    },
    actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 30,
      gap: 10,
    },
    primaryButton: {
      backgroundColor: Colors.light.tint,
      paddingVertical: 15,
      paddingHorizontal: 30,
      borderRadius: 8,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.card,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '500',
    },
  });
};

export default DashboardScreen; 