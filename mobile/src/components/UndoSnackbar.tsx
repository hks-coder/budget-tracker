import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface UndoSnackbarProps {
  visible: boolean;
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoSnackbar({ visible, message, onUndo, onDismiss }: UndoSnackbarProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible, opacity]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.message} numberOfLines={1}>
        {message}
      </Text>
      <TouchableOpacity onPress={onUndo} style={styles.undoBtn} accessibilityRole="button">
        <Text style={styles.undoText}>Annuler</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} style={styles.closeBtn} accessibilityRole="button">
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: '#323232',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 200,
  },
  message: {
    flex: 1,
    color: Colors.white,
    fontSize: FontSize.sm,
  },
  undoBtn: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  undoText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    marginLeft: Spacing.xs,
    padding: Spacing.xs,
  },
  closeText: {
    color: Colors.textLight,
    fontSize: FontSize.sm,
  },
});
