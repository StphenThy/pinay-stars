import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

const native = Platform.OS === 'ios' || Platform.OS === 'android';
const safe = fn => { if (native) fn().catch(() => {}); };

export const haptic = {
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  select: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
