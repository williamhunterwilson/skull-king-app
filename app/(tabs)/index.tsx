import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
{/* Testing imports */}
import { render, screen, fireEvent } from '@testing-library/react';
import Index from './index';

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

export default function PlayerEntry(): JSX.Element {
  const [players, setPlayers] = useState<string[]>([]);
  const [playerName, setPlayerName] = useState<string>("");
  const [rounds, setRounds] = useState<string>("10");
  const [savedNames, setSavedNames] = useState<string[]>([]);

  useEffect(() => {
    const loadNames = async () => {
      const storedNames = await AsyncStorage.getItem("savedNames");
      if (storedNames) {
        setSavedNames(JSON.parse(storedNames));
      }
    };
    loadNames();
  }, []);

  const addPlayer = async () => {
    if (players.includes(playerName)) {
              alert("This name has already been added!");
              return; // Stop if the name is already in the list
    }
    if (playerName.trim() === "") return;
    setPlayers(prev => [...prev, playerName]);

    if (!savedNames.includes(playerName)) {
      const newSavedNames = [...savedNames, playerName];
      setSavedNames(newSavedNames);
      await AsyncStorage.setItem("savedNames", JSON.stringify(newSavedNames));
    }

    setPlayerName("");
  };

  const removePlayer = (nameToRemove: string) => {
      setPlayers(players.filter(player => player !== nameToRemove));
  };

  const loadPlayerFromSaved = (name: string) => {
    if (!players.includes(name)) {
      setPlayers(prev => [...prev, name]);
    }
  };

  const clearSavedNames = async () => {
      await AsyncStorage.removeItem("savedNames");
      setSavedNames([]);
  };

  const startGame = () => {
      const totalRounds = parseInt(rounds, 10) || 10;
      const gameState: GameState = {
          players: players,
          totalRounds: totalRounds,
          currentRound: 1,
          rounds: {}
      };
      router.push({
          pathname: "/table", // Changed from "/bidding" to "/table"
          params: {
          gameState: JSON.stringify(gameState)
          }
      });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />

      <View style={{ paddingHorizontal: 20, flex: 1 }}>

        <Text style={styles.title}>Skull King Scorer</Text>

        {/* Player Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Enter Player Name"
            placeholderTextColor="#888"
            value={playerName}
            onChangeText={setPlayerName}
            autoCorrect={false}
            returnKeyType="done"
            onSubmitEditing={addPlayer}
          />
          <TouchableOpacity style={styles.addButton} onPress={addPlayer}>
            <Text style={styles.buttonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {/* Rounds Input */}
        <View style={styles.roundsContainer}>
          <Text style={styles.label}>Number of Rounds:</Text>
          <TextInput
            style={styles.roundsInput}
            keyboardType="numeric"
            value={rounds}
            onChangeText={(text) => setRounds(text.replace(/[^0-9]/g, ''))}
            placeholderTextColor="#888"
          />
        </View>

        {/* Suggested Players */}
        {savedNames.length > 0 && (
          <View style={styles.suggestedSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.sectionTitle}>Suggested Players</Text>
              <TouchableOpacity onPress={clearSavedNames} style={styles.clearButton}>
                <Text>Clear</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.suggestedPlayersContainer}>
              {savedNames.map((name, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.suggestedPlayerButton,
                    players.includes(name) && styles.suggestedPlayerButtonActive
                  ]}
                  onPress={() => loadPlayerFromSaved(name)}
                >
                  <Text style={[
                    styles.suggestedPlayerText,
                    players.includes(name) && styles.suggestedPlayerTextActive
                  ]}>{name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Scrollable Players List */}
        <Text style={styles.sectionTitle}>Current Players</Text>
        <ScrollView style={{ flex: 1, marginBottom: 10 }}>
          {players.length > 0 ? (
            players.map((player, index) => (
              <View key={index} style={styles.playerRow}>
                <Text style={styles.playerName}>{player}</Text>
                <TouchableOpacity
                  onPress={() => removePlayer(player)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>✖</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noPlayersText}>No players added yet</Text>
          )}
        </ScrollView>

        {/* Start Button */}
        {players.length >= 2 && (
          <TouchableOpacity style={styles.startButton} onPress={startGame}>
            <Text style={styles.buttonText}>Start Game</Text>
          </TouchableOpacity>
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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#FFFFFF",
    textAlign: "center"
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    color: "#FFFFFF"
  },
  inputContainer: {
    flexDirection: "row",
    marginBottom: 15
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#333",
    padding: 12,
    borderRadius: 8,
    color: "#FFFFFF",
    marginRight: 10,
  },
  addButton: {
    backgroundColor: "#505050",
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    width: 80
  },
  clearButton: {
    backgroundColor: "#444",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  roundsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    marginRight: 10
  },
  roundsInput: {
    width: 60,
    borderWidth: 1,
    borderColor: "#444",
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 8,
    color: "#FFFFFF",
    textAlign: "center"
  },
  playerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#333",
    marginBottom: 8
  },
  removeButton: {
    backgroundColor: '#3D3D3D',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  removeButtonText: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '500',
  },
  playerName: {
    color: "#FFFFFF",
    fontSize: 16
  },
  noPlayersText: {
    color: "#888",
    fontStyle: "italic",
    marginTop: 10
  },
  startButton: {
    backgroundColor: "#505050",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    margin:20
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16
  },
  scrollView: {
    flex: 1,
  },
  suggestedSection: {
    marginBottom: 10,
  },
  suggestedPlayersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestedPlayerButton: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  suggestedPlayerButtonActive: {
    backgroundColor: '#505050',
    borderColor: '#666',
  },
  suggestedPlayerText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  suggestedPlayerTextActive: {
    color: '#FFD700',
  },
  listContent: {
    padding: 20,
  },
});