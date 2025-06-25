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

interface PlayerBid {
  name: string;
  bid: number;
}

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
    }>;
  }>;
}

export default function BiddingScreen() {
  const params = useLocalSearchParams();
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerBids, setPlayerBids] = useState<PlayerBid[]>([]);

  useEffect(() => {
    let parsedGameState: GameState | null = null;

    if (params.gameState) {
      parsedGameState = JSON.parse(params.gameState as string);
      setGameState(parsedGameState);

      if (params.round) {
        const roundNum = parseInt(params.round as string, 10);
        setRound(roundNum);

        // Initialize player bids from game state or create new ones
        if (parsedGameState.rounds[roundNum]?.bids) {
          // Get bids from existing round data
          const existingBids = parsedGameState.rounds[roundNum].bids;
          setPlayerBids(
            parsedGameState.players.map(player => ({
              name: player,
              bid: existingBids[player] || 0
            }))
          );
        } else {
          // Create new bids for this round
          setPlayerBids(
            parsedGameState.players.map(player => ({
              name: player,
              bid: 0
            }))
          );
        }
      }
    }
  }, [params.gameState, params.round]);

  const updateBid = (index: number, increment: boolean) => {
    setPlayerBids(prevBids => {
      const newBids = [...prevBids];
      if (increment) {
        newBids[index].bid += 1;
      } else if (newBids[index].bid > 0) {
        newBids[index].bid -= 1;
      }
      return newBids;
    });
  };

  const submitBids = () => {
      if (!gameState) return;

      const newRounds = { ...gameState.rounds };

      // Create or update the round data
      if (!newRounds[round]) {
        newRounds[round] = { bids: {}, scores: {} };
      }

      // Update bids
      const bids: Record<string, number> = {};
      playerBids.forEach(playerBid => {
        bids[playerBid.name] = playerBid.bid;
      });
      newRounds[round].bids = bids;

      const updatedGameState = {
          ...gameState,
          rounds: newRounds
      };

      // Check if we should return to table or go to points
      const returnTo = params.returnTo as string;
      if (returnTo === "table") {
          // Go to points screen
        router.push({
          pathname: "/points",
          params: {
              gameState: JSON.stringify(updatedGameState),
              round: round.toString(),
              returnTo: "table"
            }
        });
      } else {
          // Original behavior
          router.push({
              pathname: "/points",
              params: {
              gameState: JSON.stringify(updatedGameState),
              round: round.toString()
             }
          });
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
        <Text style={styles.title}>Round {round}/{gameState.totalRounds}</Text>
        <Text style={styles.subtitle}>Enter bids for each player:</Text>

        <FlatList
          data={playerBids}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.bidRow}>
              <Text style={styles.playerName}>{item.name}</Text>
              <View style={styles.bidControls}>
                <TouchableOpacity
                  style={styles.bidButton}
                  onPress={() => updateBid(index, false)}
                >
                  <Text style={styles.bidButtonText}>−</Text>
                </TouchableOpacity>

                <Text style={styles.bidValue}>{item.bid}</Text>

                <TouchableOpacity
                  style={styles.bidButton}
                  onPress={() => updateBid(index, true)}
                >
                  <Text style={styles.bidButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />

        <TouchableOpacity
          style={styles.submitButton}
          onPress={submitBids}
        >
          <Text style={styles.submitButtonText}>
            Submit Bids
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// Add the roundButton styles to the existing styles
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
    fontSize: 28,
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
  bidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
    backgroundColor: "#2A2A2A",
    marginBottom: 8,
    borderRadius: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  bidControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  bidButton: {
    width: 40,
    height: 40,
    backgroundColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  bidButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  bidValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 15,
    minWidth: 30,
    textAlign: "center",
    color: "#FFFFFF"
  },
  submitButton: {
    backgroundColor: "#505050",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  submitButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
