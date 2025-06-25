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
  Switch,
  TextInput,
  ScrollView
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";

interface PlayerScore {
  name: string;
  bid: number;
  madeBid: boolean;
  tricksWon: number;
  bonusPoints: number;
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

export default function PointsScreen() {
  const params = useLocalSearchParams();
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);

  useEffect(() => {
    let parsedGameState: GameState | null = null;

    if (params.gameState) {
      parsedGameState = JSON.parse(params.gameState as string);
      setGameState(parsedGameState);

      if (params.round) {
        const roundNum = parseInt(params.round as string, 10);
        setRound(roundNum);

        // Ensure round data exists
        if (parsedGameState!.rounds[roundNum]) {
          const roundData = parsedGameState!.rounds[roundNum];

          // Initialize player scores from game state
          const scores: PlayerScore[] = parsedGameState!.players.map(player => {
            const bid = roundData.bids[player] || 0;
            const existingScore = roundData.scores[player];

            return {
              name: player,
              bid: bid,
              madeBid: existingScore?.madeBid || false,
              tricksWon: existingScore?.tricksWon || 0,
              bonusPoints: existingScore?.bonusPoints || 0
            };
          });

          setPlayerScores(scores);
        }
      }
    }
  }, [params.gameState, params.round]);

  const toggleMadeBid = (index: number) => {
    setPlayerScores(prevScores => {
      const newScores = [...prevScores];
      newScores[index].madeBid = !newScores[index].madeBid;

      // If they made the bid, set tricksWon to their bid
      if (newScores[index].madeBid) {
        newScores[index].tricksWon = newScores[index].bid;
      }

      return newScores;
    });
  };

  const updateBid = (index: number, increment: boolean) => {
    setPlayerScores((prevScores) => {
      const newScores = [...prevScores];
      const updatedBid = increment ? newScores[index].bid + 1 : newScores[index].bid - 1;

      // Ensure the bid doesn't go below 0
      if (updatedBid >= 0) {
        newScores[index].bid = updatedBid;
      }

      return newScores;
    });
  };

  const updateTricksWon = (index: number, increment: boolean) => {
    setPlayerScores(prevScores => {
      const newScores = [...prevScores];
      if (increment) {
        newScores[index].tricksWon += 1;
      } else {
        // Ensure tricksWon doesn't go below 0
        if (newScores[index].tricksWon > 0) {
          newScores[index].tricksWon -= 1;
        }
      }
      return newScores;
    });
  };

  const updateBonusPoints = (index: number, increment: boolean) => {
    setPlayerScores(prevScores => {
      const newScores = [...prevScores];
      if (increment) {
        newScores[index].bonusPoints += 10;
      } else {
        // Allow bonus points to go negative
        newScores[index].bonusPoints -= 10;
      }
      return newScores;
    });
  };

  const calculateScore = (player: PlayerScore, round: number): number => {
    let score = 0;

    if (player.madeBid) {
      if (player.bid == 0) {
        score = 10 * round;
      } else {
          score = player.bid * 20;
      }
    } else {
        if (player.bid == 0) {
            score = -10 * round;
        } else {
            const difference = Math.abs(player.bid - player.tricksWon);
            score = -(difference * 10);
        }
    }

    // Add bonus points
    score += player.bonusPoints;

    return score;
  };

    const submitScores = () => {
        if (!gameState) return;

        const newRounds = { ...gameState.rounds };

        // Ensure round exists
        if (!newRounds[round]) {
            newRounds[round] = { bids: {}, scores: {} };
        }

        // Calculate and store scores
        const scores: Record<string, any> = {};
        playerScores.forEach(playerScore => {
            const totalPoints = calculateScore(playerScore, round);
            scores[playerScore.name] = {
                bid: playerScore.bid,
                madeBid: playerScore.madeBid,
                tricksWon: playerScore.tricksWon,
                bonusPoints: playerScore.bonusPoints,
                totalPoints: totalPoints
            };
        });

        newRounds[round].scores = scores;

        const updatedGameState = {
            ...gameState,
            rounds: newRounds
        };

        // Check if we should return to table
        const returnTo = params.returnTo as string;
        if (returnTo === "table") {
            router.push({
                pathname: "/table",
                params: {
                    gameState: JSON.stringify(updatedGameState)
                }
            });
        } else {
            // Original behavior - determine next round or go to results
            if (round < gameState.totalRounds) {
                router.push({
                pathname: "/bidding",
                params: {
                    gameState: JSON.stringify(updatedGameState),
                    round: (round + 1).toString()
                    }
                });
            } else {
                router.push({
                    pathname: "/results",
                    params: {
                    gameState: JSON.stringify(updatedGameState)
                    }
                });
            }
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

        {/* Player Scores */}
        <FlatList
          data={playerScores}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.scoreRow}>
              <View style={styles.playerInfo}>
                <View style={styles.nameAndBidContainer}>
                  <Text style={styles.playerName}>{item.name}</Text>
                  <View style={styles.switchContainer}>
                    <Text style={styles.bidLabel}>Made bid:</Text>
                    <Switch
                      value={item.madeBid}
                      onValueChange={() => toggleMadeBid(index)}
                      trackColor={{ false: "#FF6B6B", true: "#7FFF7F" }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>
                <View style={styles.bidControls}>
                  <TouchableOpacity style={styles.bidButton} onPress={() => updateBid(index, false)}>
                    <Text style={styles.bidButtonText}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.bidValue}>{item.bid}</Text>
                  <TouchableOpacity style={styles.bidButton} onPress={() => updateBid(index, true)}>
                    <Text style={styles.bidButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.controlsContainer}>
                {/* Tricks Won */}
                <View style={styles.tricksContainer}>
                  <Text style={styles.label}>Tricks Won</Text>
                  <View style={styles.controlsRow}>
                    <TouchableOpacity style={styles.tricksButton} onPress={() => updateTricksWon(index, false)}>
                      <Text style={styles.tricksButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.tricksValue}>{item.tricksWon}</Text>
                    <TouchableOpacity style={styles.tricksButton} onPress={() => updateTricksWon(index, true)}>
                      <Text style={styles.tricksButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Bonus */}
                <View style={styles.bonusContainer}>
                  <Text style={styles.label}>Bonus</Text>
                  <View style={styles.controlsRow}>
                    <TouchableOpacity style={styles.bonusButton} onPress={() => updateBonusPoints(index, false)}>
                      <Text style={styles.bonusButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={[styles.bonusValue, item.bonusPoints < 0 && styles.negativeBonus]}>
                      {item.bonusPoints}
                    </Text>
                    <TouchableOpacity style={styles.bonusButton} onPress={() => updateBonusPoints(index, true)}>
                      <Text style={styles.bonusButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Points Total */}
              <View style={styles.scorePreview}>
                <Text style={styles.scoreLabel}>Points Total:</Text>
                <Text style={[styles.scoreValue, calculateScore(item, round) < 0 && styles.negativeScore]}>
                  {calculateScore(item, round)}
                </Text>
              </View>
            </View>
          )}
        />

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {round === gameState.totalRounds && (
            <TouchableOpacity
              style={[styles.submitButton, styles.extendButton]}
              onPress={() => {
                if (!gameState) return;
                const updatedGameState = { ...gameState };
                playerScores.forEach(player => {
                  if (!updatedGameState.rounds[round].scores) {
                    updatedGameState.rounds[round].scores = {};
                  }
                  updatedGameState.rounds[round].scores[player.name] = {
                    bid: player.bid,
                    madeBid: player.madeBid,
                    tricksWon: player.tricksWon,
                    bonusPoints: player.bonusPoints
                  };
                });
                updatedGameState.totalRounds += 1;
                updatedGameState.currentRound = round + 1;
                router.push({
                  pathname: "/bidding",
                  params: {
                    gameState: JSON.stringify(updatedGameState),
                    round: (round + 1).toString()
                  }
                });
              }}
            >
              <Text style={styles.submitButtonText}>Play Another Round</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.submitButton}
            onPress={submitScores}
          >
            <Text style={styles.submitButtonText}>
              {params.returnTo === "table" ? "Save & Return to Table" : (round < gameState.totalRounds ? "Next Round" : "Finish Game")}
            </Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#FFFFFF",
    textAlign: "center"
  },
  scoreRow: {
    padding: 15,
    paddingTop: 5,
    backgroundColor: "#2A2A2A",
    marginBottom: 12,
    borderRadius: 10,
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  nameAndBidContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  playerName: {
    fontSize: 20,
    fontWeight: "500",
    color: "#FFFFFF",
    marginRight: 10,
  },
  bidInfo: {
    color: "#BBBBBB",
    fontSize: 16,
  },
 switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tricksContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  bonusContainer: {
    flexDirection: "column",
    alignItems: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  bidLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 30,
  },
  tricksInput: {
    width: 60,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 8,
    color: "#FFFFFF",
    textAlign: "center"
  },
  bonusControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  bonusButton: {
    width: 36,
    height: 36,
    backgroundColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  bonusButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  bonusValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    minWidth: 40,
    textAlign: "center",
    color: "#FFFFFF"
  },
  negativeBonus: {
    color: "#FF6666"
  },
  scorePreview: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  scoreLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold"
  },
  scoreValue: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold"
  },
  negativeScore: {
    color: "#FF6666"
  },
  submitButton: {
    flex: 1,
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  extendButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#3D3D3D",
  },
  bidControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  bidButton: {
    width: 36,
    height: 36,
    backgroundColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  bidButtonText: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  bidValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 20,
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  tricksButton: {
    width: 36,
    height: 36,
    backgroundColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  tricksButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF"
  },
  tricksValue: {
    fontSize: 16,
    fontWeight: "bold",
    marginHorizontal: 10,
    minWidth: 40,
    textAlign: "center",
    color: "#FFFFFF"
  },
  controlsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    paddingBottom: 10,
  },
});
