// Mock React Native completely to avoid TurboModule issues
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  return {
    ...RN,
    // Core components
    View: 'View',
    Text: 'Text',
    TextInput: 'TextInput',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    Button: 'Button',
    StyleSheet: {
      create: (styles: any) => styles,
    },
    useColorScheme: () => 'light',
    
    // APIs
    Alert: {
      alert: jest.fn(),
    },
    
    // Utilities
    Platform: {
      OS: 'ios',
    },
    
    // Dimensions
    Dimensions: {
      get: () => ({ width: 375, height: 667 }),
    },
    
    // Status bar
    StatusBar: 'StatusBar',
  };
});

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    execAsync: jest.fn(),
    runAsync: jest.fn(),
    getAllAsync: jest.fn(),
  })),
}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

// Global test utilities
global.console = {
  ...console,
  error: jest.fn(),
}; 