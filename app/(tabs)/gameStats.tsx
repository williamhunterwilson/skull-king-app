import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Platform
} from "react-native";
import { Alert } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from '@react-navigation/native';

// Define types
interface PlayerStats {
  name: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
  totalScore: number;
  highestScore: number;
  winRate: number;
  averageScore: number;
}

export default function StatsScreen() {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Load player stats from AsyncStorage
  useEffect(() => {
    const loadPlayerStats = async () => {
      try {
        setLoading(true);
        const statsJson = await AsyncStorage.getItem('skullKingStats');

        if (statsJson) {
          const stats = JSON.parse(statsJson);
          // Convert object to array and calculate derived stats
          const statsArray = Object.values(stats).map((player: any) => ({
            ...player,
            winRate: player.gamesPlayed > 0 ? (player.wins / player.gamesPlayed) * 100 : 0,
            averageScore: player.wins > 0 ? player.totalScore / player.wins : 0
          }));
          // Sort by win rate (highest first)
          statsArray.sort((a: PlayerStats, b: PlayerStats) => b.winRate - a.winRate);
          setPlayerStats(statsArray);
        } else {
          setPlayerStats([]);
        }
      } catch (error) {
        console.error('Error loading player stats:', error);
        Alert.alert('Error', 'Failed to load player statistics');
      } finally {
        setLoading(false);
      }
    };

    loadPlayerStats();
  }, [refreshTrigger]);

  // Refresh stats
  const refreshStats = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Clear all stats
  const clearAllStats = async () => {
    try {
      await AsyncStorage.removeItem('skullKingStats');
      setPlayerStats([]);
    } catch (error) {
      console.error('Error clearing stats:', error);
      Alert.alert('Error', 'Failed to clear statistics');
    }
  };

  // Show confirmation dialog for clearing stats
  const confirmClearStats = () => {
    Alert.alert(
      'Clear All Stats',
      'Are you sure you want to clear all player statistics? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', onPress: clearAllStats, style: 'destructive' }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading Stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <View style={styles.content}>
        <Text style={styles.title}>Player Statistics</Text>
        <Text style={styles.subtitle}>
          {playerStats.length} Players
        </Text>

        {playerStats.length > 0 ? (
          <FlatList
            data={playerStats}
            keyExtractor={(item) => item.name}
            renderItem={({ item, index }) => (
              <View style={[styles.statRow, index === 0 && styles.topPlayerRow]}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>

                <View style={styles.playerInfo}>
                  <Text style={styles.playerName}>
                    {item.name}
                  </Text>

                  <View style={styles.statsDetails}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Games</Text>
                      <Text style={styles.statValue}>{item.gamesPlayed}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Wins</Text>
                      <Text style={[styles.statValue, styles.winsText]}>{item.wins}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Losses</Text>
                      <Text style={[styles.statValue, styles.lossesText]}>{item.losses}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Avg Score</Text>
                      <Text style={styles.statValue}>{item.averageScore.toFixed(0)}</Text>
                    </View>

                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Best</Text>
                      <Text style={styles.statValue}>{item.highestScore}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.winRateContainer}>
                  <Text style={[styles.winRate, index === 0 && styles.topPlayerText]}>
                    {item.winRate.toFixed(1)}%
                  </Text>
                  <Text style={styles.winRateLabel}>Win Rate</Text>

                  {/* Win/Loss Bar Chart */}
                  <View style={styles.chartContainer}>
                    <View
                      style={[
                        styles.winBar,
                        { width: `${item.winRate}%` }
                      ]}
                    />
                    <View
                      style={[
                        styles.lossBar,
                        { width: `${100 - item.winRate}%` }
                      ]}
                    />
                  </View>
                </View>
              </View>
            )}
            ListFooterComponent={
              <View style={styles.footer}>
                <TouchableOpacity
                  style={[styles.button, styles.refreshButton]}
                  onPress={refreshStats}
                >
                  <Text style={styles.buttonText}>Refresh Stats</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.clearButton]}
                  onPress={confirmClearStats}
                >
                  <Text style={styles.buttonText}>Clear All Stats</Text>
                </TouchableOpacity>
              </View>
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No player statistics found.{'\n'}Play some games to see statistics.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton, styles.emptyStateButton]}
              onPress={refreshStats}
            >
              <Text style={styles.buttonText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1E1E1E",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#FFFFFF",
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: "#AAAAAA",
    marginBottom: 20,
    textAlign: "center"
  },
  statRow: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#2A2A2A",
    marginBottom: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  topPlayerRow: {
    backgroundColor: "#3D3D3D",
    borderWidth: 1,
    borderColor: "#666"
  },
  rankContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10
  },
  rankText: {
    color: "#FFFFFF",
    fontWeight: "bold"
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5
  },
  statsDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  statItem: {
    marginRight: 15,
    marginTop: 5,
  },
  statLabel: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  winsText: {
    color: "#7FFF7F"
  },
  lossesText: {
    color: "#FF7F7F"
  },
  winRateContainer: {
    alignItems: "flex-end",
    minWidth: 80,
  },
  winRate: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  winRateLabel: {
    color: "#AAAAAA",
    fontSize: 12,
  },
  chartContainer: {
    marginTop: 8,
    height: 6,
    width: 80,
    backgroundColor: "#444444",
    borderRadius: 3,
    flexDirection: "row",
    overflow: "hidden",
  },
  winBar: {
    height: "100%",
    backgroundColor: "#7FFF7F",
  },
  lossBar: {
    height: "100%",
    backgroundColor: "#FF7F7F",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 30,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 130,
    alignItems: "center",
  },
  refreshButton: {
    backgroundColor: "#3A3A3A",
  },
  clearButton: {
    backgroundColor: "#8B0000",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    color: "#AAAAAA",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 20,
  },
  emptyStateButton: {
    marginTop: 20,
  }
});