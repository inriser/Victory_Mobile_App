// src/screens/LearningDetail.js
import React from 'react';
import { View, Text } from 'react-native';

export default function LearningDetail({ route }) {
  const { card } = route.params || {};
  return (
    <View>
      <Text>Learning Detail Screen</Text>
      {card && (
        <Text>{card.title}</Text>
      )}
    </View>
  );
}