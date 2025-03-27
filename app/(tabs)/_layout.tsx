import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { Ionicons } from "@expo/vector-icons";

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
        backgroundColor: "#1E1E1E",
        borderTopColor: "#1E1E1E"
        },
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#888888",
        headerShown: false
      }}
    >

    <Tabs.Screen
      name="index"
        options={{
            title: "Home",
            tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} />
        }}
    />

    {/* Add the Game History tab */}
    <Tabs.Screen
        name="gameLog"
        options={{
            title: "Game History",
            tabBarIcon: ({ color }) => <Ionicons name="list" size={24} color={color} />
        }}
    />

    <Tabs.Screen
          name="gameStats"
            options={{
                title: "Stats",
                tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} />
            }}
        />
  </Tabs>
  );
}
