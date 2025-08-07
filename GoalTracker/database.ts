
import * as SQLite from 'expo-sqlite';
import { Goal, GoalProgress } from './types/goals';

// Use a function to get the database instance to allow for better mocking
let db: any = null;

const getDatabase = () => {
  if (!db) {
    db = SQLite.openDatabaseSync('goals.db');
  }
  return db;
};

export const initDatabase = async () => {
  try {
    // Use execAsync for statements that don't return rows.
    // The new API is promise-based, so we use async/await.
    await getDatabase().execAsync(
      'CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, targetDate TEXT, targetNumber REAL, targetUnit TEXT, completed INTEGER DEFAULT 0, photos TEXT);'
    );
    await getDatabase().execAsync(
      'CREATE TABLE IF NOT EXISTS goal_progress (id INTEGER PRIMARY KEY AUTOINCREMENT, goalId INTEGER, currentValue REAL, date TEXT, FOREIGN KEY (goalId) REFERENCES goals (id));'
    );
    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating database tables:', error);
  }
};

export const saveGoal = async (name: string, description: string, targetDate: string, targetNumber: number, targetUnit: string) => {
  // runAsync is used for INSERT, UPDATE, or DELETE statements.
  const result = await getDatabase().runAsync(
    'INSERT INTO goals (name, description, targetDate, targetNumber, targetUnit, completed) VALUES (?, ?, ?, ?, ?, 0);',
    name,
    description,
    targetDate,
    targetNumber,
    targetUnit
  );
  console.log('Goal saved successfully with ID:', result.lastInsertRowId);
  return result;
};

export const getGoals = async (): Promise<Goal[]> => {
  // getAllAsync is used for SELECT statements to get all rows.
  // It returns an array of objects representing the rows.
  const allRows: Goal[] = await getDatabase().getAllAsync('SELECT * FROM goals;');
  console.log('Goals retrieved successfully:', allRows);
  return allRows;
};

export const updateGoalPhotos = async (goalId: number, photos: string[]) => {
  try {
    const photosJson = JSON.stringify(photos);
    await getDatabase().runAsync(
      'UPDATE goals SET photos = ? WHERE id = ?;',
      photosJson,
      goalId
    );
    console.log('Goal photos updated successfully for goal ID:', goalId);
  } catch (error) {
    console.error('Error updating goal photos:', error);
    throw error;
  }
};

export const saveGoalProgress = async (goalId: number, currentValue: number, date: string) => {
  try {
    await getDatabase().runAsync(
      'INSERT INTO goal_progress (goalId, currentValue, date) VALUES (?, ?, ?);',
      goalId,
      currentValue,
      date
    );
    console.log('Goal progress saved successfully for goal ID:', goalId);
  } catch (error) {
    console.error('Error saving goal progress:', error);
    throw error;
  }
};

export const getGoalProgress = async (goalId: number): Promise<GoalProgress[]> => {
  try {
    const progress: GoalProgress[] = await getDatabase().getAllAsync(
      'SELECT * FROM goal_progress WHERE goalId = ? ORDER BY date ASC;',
      goalId
    );
    console.log('Goal progress retrieved successfully for goal ID:', goalId);
    return progress;
  } catch (error) {
    console.error('Error retrieving goal progress:', error);
    throw error;
  }
};

export const getGoalWithProgress = async (goalId: number): Promise<any> => {
  try {
    const goal = await getDatabase().getFirstAsync(
      'SELECT * FROM goals WHERE id = ?;',
      goalId
    );
    
    if (!goal) {
      throw new Error('Goal not found');
    }
    
    const progress = await getGoalProgress(goalId);
    
    // Parse photos if they exist
    let photos: string[] = [];
    if (goal.photos) {
      try {
        photos = JSON.parse(goal.photos);
      } catch (e) {
        console.warn('Failed to parse goal photos:', e);
      }
    }
    
    return {
      ...goal,
      progress,
      photos,
    };
  } catch (error) {
    console.error('Error retrieving goal with progress:', error);
    throw error;
  }
};

export const deleteGoal = async (goalId: number) => {
  try {
    // First delete all progress records for this goal
    await getDatabase().runAsync(
      'DELETE FROM goal_progress WHERE goalId = ?;',
      goalId
    );
    
    // Then delete the goal itself
    await getDatabase().runAsync(
      'DELETE FROM goals WHERE id = ?;',
      goalId
    );
    
    console.log('Goal and associated progress deleted successfully for goal ID:', goalId);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
};
