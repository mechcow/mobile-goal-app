
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('goals.db');

export const initDatabase = async () => {
  try {
    // Use execAsync for statements that don't return rows.
    // The new API is promise-based, so we use async/await.
    await db.execAsync(
      'CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, targetDate TEXT, targetNumber REAL, targetUnit TEXT, completed INTEGER DEFAULT 0);'
    );
    console.log('Goals table created successfully');
  } catch (error) {
    console.error('Error creating goals table:', error);
  }
};

export const saveGoal = async (name: string, description: string, targetDate: string, targetNumber: number, targetUnit: string) => {
  // runAsync is used for INSERT, UPDATE, or DELETE statements.
  const result = await db.runAsync(
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

export const getGoals = async (): Promise<any[]> => {
  // getAllAsync is used for SELECT statements to get all rows.
  // It returns an array of objects representing the rows.
  const allRows = await db.getAllAsync('SELECT * FROM goals;');
  console.log('Goals retrieved successfully:', allRows);
  return allRows;
};
