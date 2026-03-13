import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Colors, BorderRadius } from '../constants/theme';

interface FABProps {
  onPress: () => void;
  label?: string;
}

export function FAB({ onPress, label = '+' }: FABProps) {
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={onPress}
      accessibilityLabel="Ajouter une transaction"
      accessibilityRole="button"
    >
      <Text style={styles.fabText}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 58,
    height: 58,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 100,
  },
  fabText: {
    color: Colors.white,
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '400',
  },
});
