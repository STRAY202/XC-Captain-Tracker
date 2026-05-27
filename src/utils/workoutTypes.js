export const WORKOUT_TYPES = [
  { id: 'long_run',       label: 'Long Run',        emoji: '🏃',  color: '#3b82f6', category: 'endurance' },
  { id: 'workout',        label: 'Workout',          emoji: '⚡',  color: '#f59e0b', category: 'speed'     },
  { id: 'easy',           label: 'Easy Run',         emoji: '😌',  color: '#10b981', category: 'recovery'  },
  { id: 'recovery',       label: 'Recovery Run',     emoji: '🔄',  color: '#8b5cf6', category: 'recovery'  },
  { id: 'hills',          label: 'Hill Workout',     emoji: '⛰️',  color: '#ef4444', category: 'strength'  },
  { id: 'tempo',          label: 'Tempo Run',        emoji: '🔥',  color: '#f97316', category: 'speed'     },
  { id: 'track',          label: 'Track Workout',    emoji: '🏟️',  color: '#06b6d4', category: 'speed'     },
  { id: 'fartlek',        label: 'Fartlek',          emoji: '🎲',  color: '#a78bfa', category: 'speed'     },
  { id: 'cross_training', label: 'Cross Training',   emoji: '🏊',  color: '#14b8a6', category: 'fitness'   },
  { id: 'time_trial',     label: 'Time Trial',       emoji: '⏱️',  color: '#6366f1', category: 'race'      },
  { id: 'team_event',     label: 'Team Event',       emoji: '🎉',  color: '#ec4899', category: 'team'      },
];

export const WORKOUT_BY_ID = Object.fromEntries(
  WORKOUT_TYPES.map(w => [w.id, w])
);

/** Return the workout type object, or a generic fallback */
export function getWorkoutType(id) {
  return WORKOUT_BY_ID[id] || { id: 'run', label: 'Practice', emoji: '👟', color: '#6b7280', category: 'general' };
}

export const CATEGORY_COLORS = {
  endurance: '#3b82f6',
  speed:     '#f59e0b',
  recovery:  '#8b5cf6',
  strength:  '#ef4444',
  fitness:   '#14b8a6',
  race:      '#6366f1',
  team:      '#ec4899',
  general:   '#6b7280',
};
