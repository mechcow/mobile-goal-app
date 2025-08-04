import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import Colors from '../constants/Colors';
import { getGoalWithProgress } from '../database';
import { Goal } from '../types/goals';

interface GoalProgress {
  id: number;
  goalId: number;
  currentValue: number;
  date: string;
}

interface GoalWithProgress extends Goal {
  progress: GoalProgress[];
  photos: string[];
}

const GoalDetailScreen = () => {
  const colorScheme = useColorScheme();
  const styles = getStyles(colorScheme);
  const router = useRouter();
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const screenWidth = Dimensions.get('window').width;
  
  const [goal, setGoal] = useState<GoalWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  const fetchGoalDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const goalData = await getGoalWithProgress(parseInt(goalId));
      setGoal(goalData);
    } catch (error) {
      console.error('Failed to fetch goal detail:', error);
      Alert.alert('Error', 'Failed to load goal details.');
    } finally {
      setIsLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    if (goalId) {
      fetchGoalDetail();
    }
  }, [goalId, fetchGoalDetail]);

  const handleChartPress = (data: any) => {
    if (goal && goal.photos.length > 0) {
      // Find the corresponding photo index
      const photoIndex = Math.min(data.index, goal.photos.length - 1);
      setSelectedPhotoIndex(photoIndex);
    }
  };

  const renderProgressChart = () => {
    if (!goal || goal.progress.length === 0) {
      return (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No progress data yet</Text>
          <Text style={styles.noDataSubtext}>Start tracking your progress!</Text>
        </View>
      );
    }

    const chartData = {
      labels: goal.progress.map(p => {
        const date = new Date(p.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      datasets: [
        {
          data: goal.progress.map(p => p.currentValue),
          color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };

    return (
      <TouchableOpacity onPress={() => {}}>
        <LineChart
          data={chartData}
          width={screenWidth - 40}
          height={200}
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
              r: '6',
              strokeWidth: '2',
              stroke: '#007BFF',
            },
          }}
          bezier
          style={styles.chart}
          onDataPointClick={handleChartPress}
        />
      </TouchableOpacity>
    );
  };

  const renderProgressTimeline = () => {
    if (!goal || goal.progress.length === 0) {
      return null;
    }

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Progress Timeline</Text>
        {goal.progress.map((progress, index) => {
          const date = new Date(progress.date);
          const hasPhoto = goal.photos.length > 0;
          const photoIndex = Math.min(index, goal.photos.length - 1);
          
          return (
            <View key={progress.id} style={styles.timelineItem}>
              <View style={styles.timelineHeader}>
                <Text style={styles.timelineDate}>
                  {date.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
                <Text style={styles.timelineValue}>
                  {progress.currentValue} {goal.targetUnit}
                </Text>
              </View>
              
              {hasPhoto && (
                <TouchableOpacity
                  style={styles.photoThumbnail}
                  onPress={() => setSelectedPhotoIndex(photoIndex)}
                >
                  <Image 
                    source={{ uri: goal.photos[photoIndex] }} 
                    style={styles.thumbnailImage}
                  />
                  <Text style={styles.photoLabel}>Tap to view</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading goal details...</Text>
      </View>
    );
  }

  if (!goal) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Goal not found</Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const latestProgress = goal.progress.length > 0 
    ? goal.progress[goal.progress.length - 1].currentValue 
    : 0;
  const progressPercentage = goal.targetNumber > 0 
    ? (latestProgress / goal.targetNumber) * 100 
    : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>{goal.name}</Text>
        <Text style={styles.description}>{goal.description}</Text>
        
        <View style={styles.goalInfo}>
          <Text style={styles.targetText}>
            Target: {goal.targetNumber} {goal.targetUnit}
          </Text>
          <Text style={styles.dateText}>
            Target Date: {goal.targetDate}
          </Text>
          <Text style={styles.progressText}>
            Current Progress: {latestProgress} / {goal.targetNumber} {goal.targetUnit}
          </Text>
          <Text style={styles.percentageText}>
            {Math.min(progressPercentage, 100).toFixed(1)}% Complete
          </Text>
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Progress Chart</Text>
        <Text style={styles.sectionSubtitle}>
          Tap on any point to view the photo from that time
        </Text>
        {renderProgressChart()}
      </View>

      {renderProgressTimeline()}

      {/* Photo Modal */}
      <Modal
        visible={selectedPhotoIndex !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhotoIndex(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setSelectedPhotoIndex(null)}
          >
            <Text style={styles.modalCloseText}>✕</Text>
          </TouchableOpacity>
          
          {selectedPhotoIndex !== null && goal.photos[selectedPhotoIndex] && (
            <View style={styles.modalContent}>
              <Image 
                source={{ uri: goal.photos[selectedPhotoIndex] }} 
                style={styles.modalImage}
                resizeMode="contain"
              />
              <Text style={styles.modalDate}>
                {goal.progress[selectedPhotoIndex] && 
                  new Date(goal.progress[selectedPhotoIndex].date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })
                }
              </Text>
              <Text style={styles.modalProgress}>
                Progress: {goal.progress[selectedPhotoIndex]?.currentValue} {goal.targetUnit}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
};

const getStyles = (colorScheme: 'light' | 'dark' | null | undefined) => {
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const screenWidth = Dimensions.get('window').width;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      paddingTop: 40,
    },
    backButton: {
      alignSelf: 'flex-start',
      marginBottom: 20,
    },
    backButtonText: {
      fontSize: 16,
      color: '#007BFF',
      fontWeight: '500',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    description: {
      fontSize: 16,
      color: colors.text,
      opacity: 0.8,
      marginBottom: 20,
    },
    goalInfo: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    targetText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 5,
    },
    dateText: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.8,
      marginBottom: 5,
    },
    progressText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
      marginBottom: 5,
    },
    percentageText: {
      fontSize: 14,
      color: '#007BFF',
      fontWeight: '600',
    },
    chartSection: {
      padding: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.text,
      opacity: 0.7,
      marginBottom: 15,
    },
    chart: {
      marginVertical: 8,
      borderRadius: 16,
    },
    chartBackground: {
      backgroundColor: colors.background,
    },
    noDataContainer: {
      height: 200,
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
    timelineContainer: {
      padding: 20,
    },
    timelineItem: {
      backgroundColor: colors.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 15,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timelineHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    timelineDate: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    timelineValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#007BFF',
    },
    photoThumbnail: {
      alignItems: 'center',
    },
    thumbnailImage: {
      width: 120,
      height: 160,
      borderRadius: 8,
      marginBottom: 5,
    },
    photoLabel: {
      fontSize: 12,
      color: '#007BFF',
      fontWeight: '500',
    },
    loadingText: {
      fontSize: 18,
      textAlign: 'center',
      color: colors.text,
      marginTop: 100,
    },
    errorText: {
      fontSize: 18,
      textAlign: 'center',
      color: colors.text,
      marginTop: 100,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalCloseText: {
      color: '#FFFFFF',
      fontSize: 20,
      fontWeight: 'bold',
    },
    modalContent: {
      alignItems: 'center',
      padding: 20,
    },
    modalImage: {
      width: screenWidth - 40,
      height: (screenWidth - 40) * 1.33,
      borderRadius: 10,
    },
    modalDate: {
      fontSize: 18,
      fontWeight: '600',
      color: '#FFFFFF',
      marginTop: 15,
      marginBottom: 5,
    },
    modalProgress: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.8,
    },
  });
};

export default GoalDetailScreen; 