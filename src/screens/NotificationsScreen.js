import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { Button, EmptyState, Kicker, Rise } from '../components/ui';
import { radius, space, touch, fonts } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';
import { timeAgo } from '../notifications';

const tonesFor = colors => ({
  success: { icon: 'checkmark', bg: colors.successSoft, fg: colors.success, label: 'Success' },
  error: { icon: 'alert', bg: colors.dangerSoft, fg: colors.danger, label: 'Error' },
  info: { icon: 'sparkles', bg: colors.blush, fg: colors.burgundy, label: 'Update' },
});

function groupLabel(stamp) {
  const d = new Date(stamp);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return 'Today';
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric' });
}

export default function NotificationsScreen({ notifications, onBack, onOpenActress, onMarkAllRead, onClear, onRefresh, refreshing }) {
  const { colors } = useTheme();
  const s = useThemedStyles(makeStyles);
  const tones = tonesFor(colors);
  const unread = notifications.filter(n => !n.read).length;
  const groups = notifications.reduce((acc, n) => {
    const key = groupLabel(n.time);
    (acc[key] = acc[key] || []).push(n);
    return acc;
  }, {});

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} />}>
      <AppHeader section="NOTIFICATIONS" onBack={onBack} right={<View />} />

      <View style={s.heading}>
        <Kicker>Activity log</Kicker>
        <Text style={s.title} accessibilityRole="header">Notifications</Text>
        <Text style={s.sub}>{unread ? `${unread} unread` : 'You are all caught up'} • {notifications.length} total</Text>
      </View>

      {notifications.length ? (
        <View style={s.actions}>
          <Button label="Mark all read" variant="secondary" small icon="checkmark-done-outline" onPress={onMarkAllRead} disabled={!unread} />
          <Button label="Clear all" variant="ghost" small onPress={onClear} style={{ marginLeft: space.sm }} />
        </View>
      ) : null}

      {notifications.length ? Object.entries(groups).map(([label, items], g) => (
        <Rise key={label} delay={g * 60}>
          <Text style={s.group}>{label}</Text>
          <View style={s.card}>
            {items.map((n, i) => {
              const tone = tones[n.tone] || tones.info;
              const openable = n.actressId !== undefined;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => openable && onOpenActress(n.actressId)}
                  disabled={!openable}
                  accessibilityRole={openable ? 'button' : 'text'}
                  accessibilityLabel={`${tone.label}${n.read ? '' : ', unread'}: ${n.message}. ${timeAgo(n.time)}${openable ? '. Opens profile' : ''}`}
                  style={({ pressed }) => [s.row, i < items.length - 1 && s.rowBorder, !n.read && s.rowUnread, pressed && openable && s.rowPressed]}
                >
                  <View style={[s.icon, { backgroundColor: tone.bg }]}><Ionicons name={tone.icon} size={18} color={tone.fg} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.message, !n.read && s.messageUnread]}>{n.message}</Text>
                    <Text style={s.meta}>{tone.label} • {timeAgo(n.time)}{openable ? ' • Tap to view profile' : ''}</Text>
                  </View>
                  {!n.read ? <View style={s.dot} /> : openable ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Rise>
      )) : (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          body="Adding, editing or deleting an actress, and syncing the registry, will show up here."
        />
      )}
    </ScrollView>
  );
}

const makeStyles = ({ colors, type, shadow }) => StyleSheet.create({
  page: { paddingBottom: space.xxxl },
  heading: { paddingHorizontal: space.page, paddingTop: space.xs },
  title: { ...type.h1, marginTop: space.sm },
  sub: { ...type.small, marginTop: space.xs },
  actions: { flexDirection: 'row', marginHorizontal: space.page, marginTop: space.md },
  group: { ...type.kicker, marginHorizontal: space.page, marginTop: space.xl, marginBottom: space.sm },
  card: { marginHorizontal: space.page, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: space.md, minHeight: touch.min + 12 },
  rowBorder: { borderBottomWidth: 1, borderColor: colors.line },
  rowUnread: { backgroundColor: colors.background },
  rowPressed: { backgroundColor: colors.blush },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  message: { ...type.small, color: colors.textStrong },
  messageUnread: { fontFamily: fonts.sansBold },
  meta: { ...type.caption, fontFamily: fonts.sans, marginTop: space.xs },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.burgundy, marginLeft: space.md },
});
