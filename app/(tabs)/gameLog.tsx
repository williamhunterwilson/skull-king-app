import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  Platform,
  Alert,
  Animated
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from "expo-router";
import { useFocusEffect } from '@react-navigation/native';

interface GameSummary {
  id: string;
  date: string;
  players: string[];
  winner: string;
  winnerScore: number;
  roundsPlayed: number;
}

export default function GameLogScreen() {
  const [games, setGames] = React.useState<GameSummary[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Use useFocusEffect instead of router.addListener
  useFocusEffect(
    useCallback(() => {
      loadGames();
      return () => {};
    }, [])
  );

  const loadGames = async () => {
    try {
      setLoading(true);
      const savedGames = await AsyncStorage.getItem('skullKingGameLog');
      
      if (savedGames) {
        const parsedGames = JSON.parse(savedGames);
        // Sort by most recent first
        parsedGames.sort((a: GameSummary, b: GameSummary) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setGames(parsedGames);
      } else {
        setGames([]);
      }
    } catch (error) {
      console.error('Error loading games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const clearGameHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all game history? This cannot be undone.',
      [
        { text: 'Cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await AsyncStorage.setItem('skullKingGameLog', JSON.stringify([]));
              setGames([]);
            } catch (error) {
              console.error('Error clearing game history:', error);
              Alert.alert('Error', 'Failed to clear game history');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerPlaceholder} />
      <Text style={styles.title}>Game History</Text>
      <TouchableOpacity
        style={styles.clearButton}
        onPress={clearGameHistory}
      >
        <Text style={styles.clearButtonText}>Clear</Text>
      </TouchableOpacity>
    </View>
  );

  const newGame = () => {
    router.push('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />
      <View style={styles.content}>
        {loading ? (
          <Text style={styles.loadingText}>Loading game history...</Text>
        ) : games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No completed games yet</Text>
            <TouchableOpacity
              style={styles.startButton}
              onPress={newGame}
            >
              <Text style={styles.buttonText}>Start New Game</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={games}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.gameCard}>
                <View style={styles.gameHeader}>
                  <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                  <Text style={styles.roundsText}>{item.roundsPlayed} rounds</Text>
                </View>

                <View style={styles.winnerContainer}>
                  <Text style={styles.winnerLabel}>Winner:</Text>
                  <Text style={styles.winnerName}>{item.winner}</Text>
                  <Text style={styles.winnerScore}>{item.winnerScore} points</Text>
                </View>

                <Text style={styles.playersLabel}>Players:</Text>
                <Text style={styles.playersText}>{item.players.join(', ')}</Text>
              </View>
            )}
            ListHeaderComponent={renderHeader}
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  headerPlaceholder: {
    width: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  clearButton: {
    backgroundColor: '#3D3D3D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingText: {
    color: "#AAAAAA",
    textAlign: "center",
    marginTop: 50,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#AAAAAA",
    fontSize: 16,
    marginBottom: 20,
  },
  gameCard: {
    backgroundColor: "#2A2A2A",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  gameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  dateText: {
    color: "#BBBBBB",
    fontSize: 14,
  },
  roundsText: {
    color: "#BBBBBB",
    fontSize: 14,
  },
  winnerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  winnerLabel: {
    color: "#AAAAAA",
    fontSize: 14,
    marginRight: 5,
  },
  winnerName: {
    color: "#FFD700",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
  },
  winnerScore: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  playersLabel: {
    color: "#AAAAAA",
    fontSize: 14,
    marginBottom: 3,
  },
  playersText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  startButton: {
    backgroundColor: "#505050",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});