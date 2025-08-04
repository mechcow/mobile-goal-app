import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../constants/Colors';
import { deleteGoal, getGoalProgress, getGoals } from '../database';
import { Goal } from '../types/goals';

interface GoalProgress {
  id: number;
  goalId: number;
  currentValue: number;
  date: string;
}

interface GoalWithProgress extends Goal {
  progress: GoalProgress[];
  latestProgress?: number;
  progressPercentage: number;
}

const DashboardScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  
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

  const renderProgressChart = (goal: GoalWithProgress) => {
    if (goal.progress.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No progress data yet</Text>
          <Text style={styles.noDataSubtext}>Start tracking your progress!</Text>
        </View>
      );
    }

    const chartData = {
      labels: goal.progress.slice(-7).map(p => {
        const date = new Date(p.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: goal.progress.slice(-7).map(p => p.currentValue),
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <LineChart
        data={chartData}
        width={screenWidth - 40}
        height={180}
        chartConfig={{
          backgroundColor: styles.chartBackground.backgroundColor,
          backgroundGradientFrom: styles.chartBackground.backgroundColor,
          backgroundGradientTo: styles.chartBackground.backgroundColor,
          decimalPlaces: 1,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: '#007BFF',
          },
        }}
        bezier
        style={styles.chart}
      />
    );
  };

  const renderProgressBar = (goal: GoalWithProgress) => {
    return (
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${goal.progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {goal.latestProgress?.toFixed(1) || '0'} / {goal.targetNumber} {goal.targetUnit}
        </Text>
        <Text style={styles.percentageText}>
          {goal.progressPercentage.toFixed(1)}%
        </Text>
      </View>
    );
  };

  const renderGoalCard = (goal: GoalWithProgress) => (
    <TouchableOpacity 
      key={goal.id} 
      style={styles.goalCard}
      onPress={() => router.push(`/goal-detail?goalId=${goal.id}`)}
    >
      <View style={styles.goalHeader}>
        <View style={styles.goalHeaderLeft}>
          <Text style={styles.goalName}>{goal.name}</Text>
          <Text style={styles.goalStatus}>
            {goal.completed ? 'Completed' : 'In Progress'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteGoal(goal);
          }}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.goalDescription}>{goal.description}</Text>
      <Text style={styles.targetDate}>Target Date: {goal.targetDate}</Text>
      
      {renderProgressBar(goal)}
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Progress Over Time</Text>
        {renderProgressChart(goal)}
      </View>
    </TouchableOpacity>
  );

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
            {goalsWithProgress.map(renderGoalCard)}
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
    goalCard: {
      backgroundColor: colors.card,
      padding: 20,
      borderRadius: 15,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    goalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    goalHeaderLeft: {
      flex: 1,
    },
    goalName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    goalStatus: {
      fontSize: 12,
      color: '#28a745',
      fontWeight: '500',
    },
    goalDescription: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 8,
      opacity: 0.8,
    },
    targetDate: {
      fontSize: 12,
      color: colors.text,
      marginBottom: 15,
      opacity: 0.7,
    },
    progressBarContainer: {
      marginBottom: 20,
    },
    progressBarBackground: {
      height: 8,
      backgroundColor: colors.border,
      borderRadius: 4,
      marginBottom: 8,
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: '#007BFF',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    percentageText: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.7,
      marginTop: 2,
    },
    chartContainer: {
      marginTop: 10,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 10,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    chartBackground: {
      backgroundColor: colors.background,
    },
    noDataContainer: {
      height: 180,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noDataText: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.7,
    },
    noDataSubtext: {
      fontSize: 12,
      color: colors.text,
      opacity: 0.5,
      marginTop: 5,
    },
    actionButtons: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 30,
      gap: 10,
    },
    primaryButton: {
      backgroundColor: '#007BFF',
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
    deleteButton: {
      backgroundColor: '#dc3545',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      marginLeft: 10,
    },
    deleteButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
    },
  });
};

export default DashboardScreen; 