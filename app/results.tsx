import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Platform,
  ScrollView
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface GameState {
  players: string[];
  totalRounds: number;
  currentRound: number;
  rounds: Record<number, {
    bids: Record<string, number>;
    scores: Record<string, {
      bid: number;
      madeBid: boolean;
      tricksWon: number;
      bonusPoints: number;
      totalPoints: number;
    }>;
  }>;
}

interface PlayerTotalScore {
  name: string;
  totalScore: number;
  roundScores: number[];
}

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerResults, setPlayerResults] = useState<PlayerTotalScore[]>([]);

  useEffect(() => {
    if (params.gameState) {
      const parsedGameState = JSON.parse(params.gameState as string);
      setGameState(parsedGameState);
      calculateFinalScores(parsedGameState);
    }
  }, [params.gameState]);

  // Add a new useEffect to save the game when playerResults are available
  useEffect(() => {
    if (gameState && playerResults.length > 0) {
      saveGameToHistory();
    }
  }, [gameState, playerResults]);

  const calculateFinalScores = (gameState: GameState) => {
    const { players, rounds, totalRounds } = gameState;

    const results: PlayerTotalScore[] = players.map(player => {
      let totalScore = 0;
      const roundScores: number[] = [];

      // Calculate score for each round
      for (let i = 1; i <= totalRounds; i++) {
        if (rounds[i] && rounds[i].scores && rounds[i].scores[player]) {
          // Use the totalPoints value already stored in the game state
          const roundScore = rounds[i].scores[player].totalPoints || 0;
          totalScore += roundScore;
          roundScores.push(roundScore);
        } else {
          roundScores.push(0);
        }
      }

      return {
        name: player,
        totalScore,
        roundScores
      };
    });

    // Sort by total score (highest first)
    results.sort((a, b) => b.totalScore - a.totalScore);

    setPlayerResults(results);
  };

  const startNewGame = () => {
    router.push("/");
  };

  const saveGameToHistory = async () => {
    try {
      if (!gameState) {
        console.log('Cannot save game: gameState is null');
        return;
      }

      if (playerResults.length === 0) {
        console.log('Cannot save game: playerResults is empty');
        return;
      }

      // Create game summary
      const gameSummary = {
        id: Date.now().toString(), // Unique ID
        date: new Date().toISOString(),
        players: gameState.players,
        winner: playerResults[0]?.name || "Unknown",
        winnerScore: playerResults[0]?.totalScore || 0,
        roundsPlayed: gameState.totalRounds
      };

      // Save to game log
      try {
        const existingLog = await AsyncStorage.getItem('skullKingGameLog');
        let gameLog = existingLog ? JSON.parse(existingLog) : [];
        gameLog.push(gameSummary);
        await AsyncStorage.setItem('skullKingGameLog', JSON.stringify(gameLog));
      } catch (error) {
        console.error('Error saving to game log:', error);
      }

      // Update player stats independently
      try {
        const existingStatsStr = await AsyncStorage.getItem('skullKingStats');
        let existingStats = existingStatsStr ? JSON.parse(existingStatsStr) : {};

        // Update stats for each player
        for (const player of gameState.players) {
          if (!existingStats[player]) {
            existingStats[player] = {
              name: player,
              wins: 0,
              losses: 0,
              gamesPlayed: 0,
              totalScore: 0
            };
          }

          const playerResult = playerResults.find(p => p.name === player);
          if (playerResult) {
            existingStats[player].gamesPlayed++;
            existingStats[player].totalScore += playerResult.totalScore;

            if (player === gameSummary.winner) {
              existingStats[player].wins++;
            } else {
              existingStats[player].losses++;
            }
          }
        }

        await AsyncStorage.setItem('skullKingStats', JSON.stringify(existingStats));
      } catch (error) {
        console.error('Error updating player stats:', error);
      }
    } catch (error) {
      console.error('Error in saveGameToHistory:', error);
    }
  };

  // If game state is not loaded yet
  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <View style={styles.content}>
        <Text style={styles.title}>Results</Text>
        <Text style={styles.subtitle}>{gameState.totalRounds} Rounds Completed</Text>

        {/* Player rankings */}
        <FlatList
          data={playerResults}
          keyExtractor={(item) => item.name}
          renderItem={({ item, index }) => (
            <View style={[styles.resultRow, index === 0 && styles.winnerRow]}>
              <View style={styles.rankContainer}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <View style={styles.playerInfo}>
                <Text style={[styles.playerName, index === 0 && styles.winnerText]}>
                  {item.name}
                </Text>
                <View style={styles.scoreDetails}>
                  <Text style={styles.detailsLabel}>Score Breakdown:</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {item.roundScores.map((score, idx) => (
                      <View key={idx} style={styles.roundScoreContainer}>
                        <Text style={styles.roundLabel}>R{idx + 1}</Text>
                        <Text style={[
                          styles.roundScore,
                          score < 0 && styles.negativeScore
                        ]}>
                          {score}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </View>
              <Text
                style={[
                  styles.totalScore,
                  item.totalScore < 0 && styles.negativeScore,
                  index === 0 && styles.winnerText
                ]}
              >
                {item.totalScore}
              </Text>
            </View>
          )}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.newGameButton}
              onPress={startNewGame}
            >
              <Text style={styles.buttonText}>New Game</Text>
            </TouchableOpacity>
          }
        />
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
  resultRow: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#2A2A2A",
    marginBottom: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  winnerRow: {
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
  winnerText: {
    color: "#FFD700" // Gold color for winner
  },
  totalScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginLeft: 10
  },
  negativeScore: {
    color: "#FF6666"
  },
  scoreDetails: {
    marginTop: 5
  },
  detailsLabel: {
    color: "#AAAAAA",
    fontSize: 12,
    marginBottom: 3
  },
  roundScoreContainer: {
    alignItems: "center",
    marginRight: 8,
    minWidth: 30
  },
  roundLabel: {
    color: "#888888",
    fontSize: 10
  },
  roundScore: {
    color: "#FFFFFF",
    fontSize: 12
  },
  newGameButton: {
    backgroundColor: "#505050",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  }
});
