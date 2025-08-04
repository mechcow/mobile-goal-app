import * as SQLite from 'expo-sqlite';

// Mock expo-sqlite before importing database
const mockExecAsync = jest.fn();
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();

const mockDatabase = {
  execAsync: mockExecAsync,
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
};

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => mockDatabase),
}));

// Import database after mocking
import { getGoals, initDatabase, saveGoal } from '../database';

// Add Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCalledWith(...args: any[]): R;
    }
  }
}

describe('Database Functions - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initDatabase', () => {
    it('should create goals table successfully', async () => {
      mockExecAsync.mockResolvedValue(undefined);
      
      await initDatabase();
      
      expect(SQLite.openDatabaseSync).toHaveBeenCalledWith('goals.db');
      expect(mockExecAsync).toHaveBeenCalledWith(
        'CREATE TABLE IF NOT EXISTS goals (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, description TEXT, targetDate TEXT, targetNumber REAL, targetUnit TEXT, completed INTEGER DEFAULT 0);'
      );
    });

    it('should handle database initialization errors gracefully', async () => {
      mockExecAsync.mockRejectedValue(new Error('Database error'));
      
      // Should not throw, should log error
      await expect(initDatabase()).resolves.toBeUndefined();
      
      expect(mockExecAsync).toHaveBeenCalled();
    });
  });

  describe('saveGoal', () => {
    it('should save a goal successfully', async () => {
      mockRunAsync.mockResolvedValue({ lastInsertRowId: 1 });
      
      const result = await saveGoal('Test Goal', 'Test Description', '2024-12-31', 10, 'km');
      
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO goals (name, description, targetDate, targetNumber, targetUnit, completed) VALUES (?, ?, ?, ?, ?, 0);',
        'Test Goal',
        'Test Description',
        '2024-12-31',
        10,
        'km'
      );
      expect(result.lastInsertRowId).toBe(1);
    });

    it('should handle database save errors', async () => {
      mockRunAsync.mockRejectedValue(new Error('Database error'));
      
      await expect(saveGoal('Test Goal', 'Test Description', '2024-12-31', 10, 'km'))
        .rejects.toThrow('Database error');
    });

    it('should accept negative target numbers (current behavior - no validation)', async () => {
      mockRunAsync.mockResolvedValue({ lastInsertRowId: 1 });
      
      const result = await saveGoal('Test Goal', 'Test Description', '2024-12-31', -5, 'km');
      
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO goals (name, description, targetDate, targetNumber, targetUnit, completed) VALUES (?, ?, ?, ?, ?, 0);',
        'Test Goal',
        'Test Description',
        '2024-12-31',
        -5,
        'km'
      );
      expect(result.lastInsertRowId).toBe(1);
    });

    it('should accept zero target numbers (current behavior - no validation)', async () => {
      mockRunAsync.mockResolvedValue({ lastInsertRowId: 1 });
      
      const result = await saveGoal('Test Goal', 'Test Description', '2024-12-31', 0, 'km');
      
      expect(mockRunAsync).toHaveBeenCalledWith(
        'INSERT INTO goals (name, description, targetDate, targetNumber, targetUnit, completed) VALUES (?, ?, ?, ?, ?, 0);',
        'Test Goal',
        'Test Description',
        '2024-12-31',
        0,
        'km'
      );
      expect(result.lastInsertRowId).toBe(1);
    });
  });

  describe('getGoals', () => {
    it('should retrieve all goals successfully', async () => {
      const sampleGoals = [
        {
          id: 1,
          name: 'Run 5K',
          description: 'Complete a 5K run',
          targetDate: '2024-12-31',
          targetNumber: 5,
          targetUnit: 'km',
          completed: 0,
        },
      ];
      
      mockGetAllAsync.mockResolvedValue(sampleGoals);
      
      const goals = await getGoals();
      
      expect(mockGetAllAsync).toHaveBeenCalledWith('SELECT * FROM goals;');
      expect(goals).toEqual(sampleGoals);
    });

    it('should handle database retrieval errors', async () => {
      mockGetAllAsync.mockRejectedValue(new Error('Database error'));
      
      await expect(getGoals()).rejects.toThrow('Database error');
    });

    it('should return empty array when no goals exist', async () => {
      mockGetAllAsync.mockResolvedValue([]);
      
      const goals = await getGoals();
      
      expect(goals).toEqual([]);
    });
  });
}); 