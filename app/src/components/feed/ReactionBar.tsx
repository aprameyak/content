import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ReactionType, ReactionCounts } from '@/types';
import { Colors } from '@/constants/colors';
import { REACTIONS, REACTION_TYPES } from '@/constants';

interface ReactionBarProps {
  counts: ReactionCounts;
  userReaction: ReactionType | null | undefined;
  onReact: (type: ReactionType) => void;
  onRemoveReaction: () => void;
}

const EMOJI_TO_TYPE: Record<string, ReactionType> = {
  '❤️': 'HEART',
  '👏': 'CLAP',
  '🔥': 'FIRE',
  '😊': 'SMILE',
  '😭': 'CRY',
  '💪': 'MUSCLE',
};

export function ReactionBar({ counts, userReaction, onReact, onRemoveReaction }: ReactionBarProps) {
  function handlePress(type: ReactionType) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (userReaction === type) {
      onRemoveReaction();
    } else {
      onReact(type);
    }
  }

  return (
    <View style={styles.container}>
      {REACTIONS.map((emoji, i) => {
        const type = EMOJI_TO_TYPE[emoji];
        const count = counts[type] ?? 0;
        const isSelected = userReaction === type;

        return (
          <TouchableOpacity
            key={emoji}
            style={[styles.reaction, isSelected && styles.selected]}
            onPress={() => handlePress(type)}
            activeOpacity={0.7}
            accessibilityLabel={`${emoji} reaction, ${count} reactions`}
            accessibilityRole="button"
          >
            <Text style={styles.emoji}>{emoji}</Text>
            {count > 0 && (
              <Text style={[styles.count, isSelected && styles.countSelected]}>
                {count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 20,
    backgroundColor: Colors.backgroundElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSurface,
  },
  emoji: { fontSize: 15 },
  count: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  countSelected: { color: Colors.accentLight },
});
