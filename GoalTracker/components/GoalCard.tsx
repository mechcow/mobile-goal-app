import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../constants/Colors';
import { GoalWithProgress } from '../types/goals';

interface GoalCardProps {
  goal: GoalWithProgress;
  onDelete: (goal: GoalWithProgress) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onDelete }) => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

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
        width={screenWidth - 80}
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

  return (
    <TouchableOpacity
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
            onDelete(goal);
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
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return StyleSheet.create({
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

export default GoalCard;
