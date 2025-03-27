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
        if (parsedGameState.rounds[roundNum]) {
          const roundData = parsedGameState.rounds[roundNum];

          // Initialize player scores from game state
          const scores: PlayerScore[] = parsedGameState.players.map(player => {
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

  const updateTricksWon = (index: number, value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setPlayerScores(prevScores => {
      const newScores = [...prevScores];
      newScores[index].tricksWon = numValue;
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

  const calculateScore = (player: PlayerScore, round: round_number): number => {
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

  // Generate round navigation buttons
  const renderRoundButtons = () => {
    if (!gameState) return null;

    const buttons = [];
    for (let i = 1; i <= gameState.totalRounds; i++) {
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.roundButton,
            round === i && styles.currentRoundButton
          ]}
          onPress={() => navigateToRound(i)}
        >
          <Text
            style={[
              styles.roundButtonText,
              round === i && styles.currentRoundButtonText
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    return buttons;
  };

  const navigateToRound = (roundNumber: number) => {
    if (!gameState) return;

    // Update current game state with current scores
    const updatedGameState = {...gameState};

    // Save current round data before navigating
    if (!updatedGameState.rounds[round]) {
      updatedGameState.rounds[round] = { bids: {}, scores: {} };
    }

    // Save scores
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

    updatedGameState.currentRound = roundNumber;

    // Navigate to bidding for the selected round
    router.push({
      pathname: "/bidding",
      params: {
        gameState: JSON.stringify(updatedGameState),
        round: roundNumber.toString()
      }
    });
  };

  const submitScores = () => {
    if (!gameState) return;

    // Update game state with current scores
    const updatedGameState = {...gameState};

    // Save scores
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

    // Determine next action
    if (round < updatedGameState.totalRounds) {
      // Move to next round
      updatedGameState.currentRound = round + 1;
      router.push({
        pathname: "/bidding",
        params: {
          gameState: JSON.stringify(updatedGameState),
          round: (round + 1).toString()
        }
      });
    } else {
      // Game is over, navigate to results or back to start
      router.push("/");
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

        {/* Round navigation buttons */}
        <View style={styles.roundNavigationContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.roundButtonsRow}>
              {renderRoundButtons()}
            </View>
          </ScrollView>
        </View>

        <FlatList
          data={playerScores}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.scoreRow}>
              <View style={styles.playerInfo}>
                <Text style={styles.playerName}>{item.name}</Text>

                {/* Bid with + and - buttons */}
                <View style={styles.bidControls}>
                  <TouchableOpacity
                    style={styles.bidButton}
                    onPress={() => updateBid(index, false)} // Decrease bid
                  >
                    <Text style={styles.bidButtonText}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.bidValue}>{item.bid}</Text>

                  <TouchableOpacity
                    style={styles.bidButton}
                    onPress={() => updateBid(index, true)} // Increase bid
                  >
                    <Text style={styles.bidButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rest of the controls for tricks won, made bid, etc... */}
              <View style={styles.scoreControls}>
                {/* Made Bid Switch */}
                <View style={styles.switchContainer}>
                  <Text style={styles.label}>Made bid:</Text>
                  <Switch
                    value={item.madeBid}
                    onValueChange={() => toggleMadeBid(index)}
                    trackColor={{ false: "#FF6B6B", true: "#7FFF7F" }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* Tricks Won (only visible if didn't make bid) */}
                {!item.madeBid && (
                  <View style={styles.tricksContainer}>
                    <Text style={styles.label}>Tricks won:</Text>
                    <TextInput
                      style={styles.tricksInput}
                      keyboardType="numeric"
                      value={item.tricksWon.toString()}
                      onChangeText={(value) => updateTricksWon(index, value)}
                      placeholderTextColor="#888"
                    />
                  </View>
                )}

                {/* Bonus Points */}
                <View style={styles.bonusContainer}>
                  <Text style={styles.label}>Bonus:</Text>
                  <View style={styles.bonusControls}>
                    <TouchableOpacity
                      style={styles.bonusButton}
                      onPress={() => updateBonusPoints(index, false)}
                    >
                      <Text style={styles.bonusButtonText}>−</Text>
                    </TouchableOpacity>

                    <Text style={[styles.bonusValue, item.bonusPoints < 0 && styles.negativeBonus]}>
                      {item.bonusPoints}
                    </Text>

                    <TouchableOpacity
                      style={styles.bonusButton}
                      onPress={() => updateBonusPoints(index, true)}
                    >
                      <Text style={styles.bonusButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Score preview */}
                <View style={styles.scorePreview}>
                  <Text style={styles.scoreLabel}>Score:</Text>
                  <Text style={[styles.scoreValue, calculateScore(item, round) < 0 && styles.negativeScore]}>
                    {calculateScore(item, round)}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />

        <View style={styles.buttonContainer}>
          {round === gameState.totalRounds && (
            <TouchableOpacity
              style={[styles.submitButton, styles.extendButton]}
              onPress={() => {
                // Extend the game by 1 round
                if (!gameState) return;

                const updatedGameState = {...gameState};

                // Save current scores
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

                // Increase total rounds
                updatedGameState.totalRounds += 1;

                // Move to next round
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
            onPress={() => {
              // Update game state with current scores
              if (!gameState) return;

              const updatedGameState = {...gameState};

              // Save scores
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

              if (round < updatedGameState.totalRounds) {
                // Move to next round
                updatedGameState.currentRound = round + 1;
                router.push({
                  pathname: "/bidding",
                  params: {
                    gameState: JSON.stringify(updatedGameState),
                    round: (round + 1).toString()
                  }
                });
              } else {
                // Game is over, navigate to results
                router.push({
                  pathname: "/results",
                  params: {
                    gameState: JSON.stringify(updatedGameState)
                  }
                });
              }
            }}
          >
            <Text style={styles.submitButtonText}>
              {round < gameState.totalRounds ? "Next Round" : "Finish Game"}
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
  roundNavigationContainer: {
    marginBottom: 15,
  },
  roundButtonsRow: {
    flexDirection: 'row',
    paddingVertical: 5,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#333",
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  currentRoundButton: {
    backgroundColor: "#505050",
  },
  roundButtonText: {
    color: "#BBBBBB",
    fontWeight: "bold",
  },
  currentRoundButtonText: {
    color: "#FFFFFF",
  },
  scoreRow: {
    padding: 15,
    backgroundColor: "#2A2A2A",
    marginBottom: 12,
    borderRadius: 10,
  },
  playerInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    paddingBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: "500",
    color: "#FFFFFF"
  },
  bidInfo: {
    color: "#BBBBBB",
    fontSize: 16,
  },
  scoreControls: {
    gap: 12,
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  tricksContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bonusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
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
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#444",
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
    marginTop: 20,
  },
  extendButton: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "#3D3D3D",
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#505050",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  bidControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
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
});