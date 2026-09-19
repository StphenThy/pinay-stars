import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import AppHeader from '../components/AppHeader';
import { Button, EmptyState, Kicker } from '../components/ui';
import { colors, fonts, radius, shadow } from '../theme';
import { timeAgo } from '../notifications';

const TONES = {
  success: { icon: '✓', bg: colors.successSoft, fg: colors.success, label: 'Success' },
  error: { icon: '!', bg: colors.dangerSoft, fg: colors.danger, label: 'Error' },
  info: { icon: '✦', bg: colors.blush, fg: colors.burgundy, label: 'Update' },
};

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
        <View style={{ flex: 1 }}>
          <Kicker>ACTIVITY LOG</Kicker>
          <Text style={s.title}>Notifications</Text>
          <Text style={s.sub}>{unread ? `${unread} unread` : 'You are all caught up'} • {notifications.length} total</Text>
        </View>
      </View>

      {notifications.length ? (
        <View style={s.actions}>
          <Button label="Mark all read" variant="secondary" small onPress={onMarkAllRead} disabled={!unread} />
          <Button label="Clear all" variant="ghost" small onPress={onClear} style={{ marginLeft: 8 }} />
        </View>
      ) : null}

      {notifications.length ? Object.entries(groups).map(([label, items]) => (
        <View key={label}>
          <Text style={s.group}>{label.toUpperCase()}</Text>
          <View style={s.card}>
            {items.map((n, i) => {
              const tone = TONES[n.tone] || TONES.info;
              return (
                <Pressable
                  key={n.id}
                  onPress={() => n.actressId !== undefined && onOpenActress(n.actressId)}
                  style={[s.row, i < items.length - 1 && s.rowBorder, !n.read && s.rowUnread]}
                >
                  <View style={[s.icon, { backgroundColor: tone.bg }]}><Text style={[s.iconText, { color: tone.fg }]}>{tone.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.message, !n.read && s.messageUnread]}>{n.message}</Text>
                    <Text style={s.meta}>{tone.label} • {timeAgo(n.time)}{n.actressId !== undefined ? ' • Tap to view profile' : ''}</Text>
                  </View>
                  {!n.read ? <View style={s.dot} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      )) : (
        <EmptyState
          icon="🔔"
          title="No notifications yet"
          body="Adding, editing or deleting an actress, and syncing the registry, will show up here."
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: 30 },
  heading: { paddingHorizontal: 20, paddingTop: 4 },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.burgundy, fontWeight: '700', marginTop: 6 },
  sub: { color: colors.text, fontSize: 13, marginTop: 4 },
  actions: { flexDirection: 'row', marginHorizontal: 20, marginTop: 14 },
  group: { marginHorizontal: 20, marginTop: 20, marginBottom: 8, color: colors.rose, fontWeight: '700', fontSize: 11, letterSpacing: 1.4 },
  card: { marginHorizontal: 20, backgroundColor: colors.white, borderRadius: radius.lg, overflow: 'hidden', ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  rowBorder: { borderBottomWidth: 1, borderColor: colors.line },
  rowUnread: { backgroundColor: '#FFF6F7' },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  iconText: { fontWeight: '700', fontSize: 15 },
  message: { color: colors.textStrong, fontSize: 14, lineHeight: 20 },
  messageUnread: { fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.burgundy, marginLeft: 10 },
});
