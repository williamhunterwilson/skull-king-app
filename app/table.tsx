import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Platform,
    Alert,
    Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

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

export default function TableScreen() {
const params = useLocalSearchParams();
const [gameState, setGameState] = useState<GameState | null>(null);

useEffect(() => {
    if (params.gameState) {
    const parsedGameState = JSON.parse(params.gameState as string);
    setGameState(parsedGameState);
    }
    }, [params.gameState]);

    if (!gameState) {
    return (
    <SafeAreaView style={styles.container}>
    <Text style={styles.errorText}>Loading...</Text>
    </SafeAreaView>
    );
}

const addRound = () => {
Alert.alert(
"Add Round",
"Do you want to add another round?",
[
{
text: "Cancel",
style: "cancel"
},
{
text: "Add Round",
onPress: () => {
const newGameState = {
...gameState,
totalRounds: gameState.totalRounds + 1
};
setGameState(newGameState);
}
}
]
);
};

const goToBidding = (roundNumber: number) => {
router.push({
pathname: "/bidding",
params: {
gameState: JSON.stringify(gameState),
round: roundNumber.toString(),
returnTo: "table"
}
});
};

const goToResults = () => {
router.push({
pathname: "/results",
params: {
gameState: JSON.stringify(gameState)
}
});
};

const calculateRunningTotal = (playerName: string, upToRound: number): number => {
let total = 0;
for (let i = 1; i <= upToRound; i++) {
const roundData = gameState.rounds[i];
if (roundData && roundData.scores[playerName]) {
total += roundData.scores[playerName].totalPoints;
}
}
return total;
};

const getRoundStatus = (roundNumber: number): 'not-started' | 'bidding' | 'scoring' | 'completed' => {
const roundData = gameState.rounds[roundNumber];
if (!roundData) return 'not-started';

const allBids = Object.keys(roundData.bids).length === gameState.players.length;
const allScores = roundData.scores && Object.keys(roundData.scores).length === gameState.players.length;

if (allScores) return 'completed';
if (allBids) return 'scoring';
return 'bidding';
};

const getRoundDisplayValue = (playerName: string, roundNumber: number): string => {
const roundData = gameState.rounds[roundNumber];
if (!roundData) return '-';

const status = getRoundStatus(roundNumber);
if (status === 'completed' && roundData.scores[playerName]) {
return roundData.scores[playerName].totalPoints.toString();
} else if (status === 'scoring' && roundData.bids[playerName] !== undefined) {
return `B:${roundData.bids[playerName]}`;
} else if (status === 'bidding' && roundData.bids[playerName] !== undefined) {
return `B:${roundData.bids[playerName]}`;
}
return '-';
};

const getCellBackgroundColor = (roundNumber: number): string => {
const status = getRoundStatus(roundNumber);
switch (status) {
case 'not-started': return '#333';
case 'bidding': return '#4A4A4A';
case 'scoring': return '#5A5A2A';
case 'completed': return '#2A5A2A';
default: return '#333';
}
};

// Calculate dynamic player cell width to ensure table fits within screen
const ROUND_CELL_WIDTH = 60; // Fixed width for round column
const HORIZONTAL_PADDING = 20; // Total horizontal padding for the container (10px on each side)
const BORDER_WIDTH = gameState.players.length + 1; // Account for border widths
const availableWidth = screenWidth - ROUND_CELL_WIDTH - HORIZONTAL_PADDING - BORDER_WIDTH;
const playerCellWidth = Math.floor(availableWidth / gameState.players.length);

return (
<>
<Stack.Screen options={{ headerShown: false }} />
<SafeAreaView style={styles.container}>
<StatusBar barStyle="light-content" backgroundColor="#1E1E1E" />

<View style={styles.header}>
<Text style={styles.title}>Skull King Scoring</Text>
<Text style={styles.subtitle}>Rounds: {gameState.totalRounds}</Text>
</View>

<View style={styles.tableContainer}>
<View style={styles.tableWrapper}>
{/* Header Row */}
<View style={styles.tableRow}>
<View style={[styles.cell, styles.headerCell, styles.roundNameCell]}>
<Text style={styles.headerText}>Round</Text>
</View>
{gameState.players.map((player, index) => (
<View key={index} style={[styles.cell, styles.headerCell, styles.playerCell, { width: playerCellWidth }]}>
<Text style={styles.headerText} numberOfLines={1} ellipsizeMode="tail">{player}</Text>
</View>
))}
</View>

<ScrollView showsVerticalScrollIndicator={true} style={styles.verticalScroll}>
{/* Round Rows */}
{Array.from({ length: gameState.totalRounds }, (_, i) => i + 1).map((round) => (
<View key={round} style={styles.tableRow}>
<TouchableOpacity
style={[styles.cell, styles.roundNameCell]}
onPress={() => goToBidding(round)}
>
<Text style={styles.roundText}>R{round}</Text>
</TouchableOpacity>
{gameState.players.map((player, playerIndex) => (
<View
key={playerIndex}
style={[
styles.cell,
styles.playerCell,
{ backgroundColor: getCellBackgroundColor(round), width: playerCellWidth }
]}
>
<Text style={styles.cellText} numberOfLines={1}>
{getRoundDisplayValue(player, round)}
</Text>
</View>
))}
</View>
))}

{/* Total Row */}
<View style={[styles.tableRow, styles.totalRow]}>
<View style={[styles.cell, styles.roundNameCell, styles.totalHeaderCell]}>
<Text style={styles.totalHeaderText}>Total</Text>
</View>
{gameState.players.map((player, playerIndex) => (
<View key={playerIndex} style={[styles.cell, styles.playerCell, styles.totalCell, { width: playerCellWidth }]}>
<Text style={styles.totalText}>
{calculateRunningTotal(player, gameState.totalRounds)}
</Text>
</View>
))}
</View>
</ScrollView>
</View>
</View>

<View style={styles.footer}>
<TouchableOpacity style={styles.addRoundButton} onPress={addRound}>
<Text style={styles.buttonText}>Add Round</Text>
</TouchableOpacity>

<TouchableOpacity style={styles.resultsButton} onPress={goToResults}>
<Text style={styles.buttonText}>View Results</Text>
</TouchableOpacity>
</View>
</SafeAreaView>
</>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#1E1E1E',
paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0
},
header: {
padding: 20,
alignItems: 'center',
},
title: {
fontSize: 24,
fontWeight: 'bold',
color: '#FFFFFF',
marginBottom: 5,
},
subtitle: {
fontSize: 16,
color: '#CCCCCC',
},
tableContainer: {
flex: 1,
alignItems: 'center',
paddingHorizontal: 10,
},
tableWrapper: {
alignSelf: 'center',
},
verticalScroll: {
flex: 1, // Take up available space in the table container
},
tableRow: {
flexDirection: 'row',
},
totalRow: {
borderTopWidth: 2,
borderTopColor: '#666',
},
cell: {
borderWidth: 1,
borderColor: '#444',
justifyContent: 'center',
alignItems: 'center',
minHeight: 50,
paddingHorizontal: 4,
},
headerCell: {
backgroundColor: '#2A2A2A',
},
roundNameCell: {
width: 60,
paddingHorizontal: 4,
},
playerCell: {
// Width will be set dynamically
},
totalCell: {
backgroundColor: '#3A3A3A',
},
totalHeaderCell: {
backgroundColor: '#3A3A3A',
},
headerText: {
color: '#FFFFFF',
fontWeight: 'bold',
fontSize: 12,
textAlign: 'center',
},
roundText: {
color: '#FFFFFF',
fontWeight: 'bold',
fontSize: 12,
textAlign: 'center',
},
cellText: {
color: '#FFFFFF',
fontSize: 11,
textAlign: 'center',
},
totalText: {
color: '#FFFFFF',
fontWeight: 'bold',
fontSize: 13,
},
totalHeaderText: {
color: '#FFFFFF',
fontWeight: 'bold',
fontSize: 13,
},
footer: {
flexDirection: 'row',
padding: 20,
justifyContent: 'space-between',
},
addRoundButton: {
backgroundColor: '#505050',
paddingHorizontal: 20,
paddingVertical: 12,
borderRadius: 8,
flex: 1,
marginRight: 10,
alignItems: 'center',
},
resultsButton: {
backgroundColor: '#4A7C4A',
paddingHorizontal: 20,
paddingVertical: 12,
borderRadius: 8,
flex: 1,
marginLeft: 10,
alignItems: 'center',
},
buttonText: {
color: '#FFFFFF',
fontWeight: 'bold',
fontSize: 16,
},
errorText: {
color: '#FFFFFF',
fontSize: 18,
textAlign: 'center',
marginTop: 50,
},
});
