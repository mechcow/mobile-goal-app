import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import Colors from '../constants/Colors';
import { getGoals } from '../database';
import { Goal } from '../types/goals';

const GoalsSummaryScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const fetchedGoals = await getGoals();
      setGoals(fetchedGoals as Goal[]);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Your Goals</Text>
      {goals.length === 0 ? (
        <Text style={styles.noGoalsText}>No goals set yet. Go to the Goal Setting screen to add some!</Text>
      ) : (
        goals.map((goal) => (
          <View key={goal.id} style={styles.goalCard}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <Text style={styles.goalTargetDate}>Target Date: {goal.targetDate}</Text>
            <Text style={styles.goalStatus}>Status: {goal.completed ? 'Completed' : 'Pending'}</Text>
          </View>
        ))
      )}
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
    noGoalsText: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.text,
      marginTop: 50,
    },
    goalCard: {
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
      fontSize: 16,
      color: colors.text,
      marginBottom: 5,
    },
    goalTargetDate: {
      fontSize: 14,
      color: colors.text,
      marginBottom: 5,
    },
    goalStatus: {
      fontSize: 14,
      color: colors.text,
      fontWeight: 'bold',
    },
  });
};

export default GoalsSummaryScreen;