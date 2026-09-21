import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ActressCard from '../components/ActressCard';
import { EmptyState, ListStatus, Rise } from '../components/ui';
import { colors, radius, space, type } from '../theme';
import { useAuth } from '../auth';

export default function FavoritesScreen({ actresses, favorites, onProfile, onFavorite, onNavigate, onRefresh, refreshing, loading, loadError, onRetry }) {
  const { account, openAccount } = useAuth();
  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} />}>
      <AppHeader section="FAVORITES" />

      <View style={s.heading}>
        <Text style={s.title} accessibilityRole="header">My Favorites</Text>
        <View style={s.count}><Text style={s.countText}>{favorites.length} Bookmarked</Text></View>
      </View>
      <Text style={s.copy}>Quick-access list of your shortlisted and favorite Filipina performers.</Text>
      {account ? (
        <View style={s.syncNote}><Ionicons name="cloud-done-outline" size={14} color={colors.success} /><Text style={s.syncNoteText}>Synced to {account.display_name || account.username}'s account</Text></View>
      ) : (
        <Pressable onPress={openAccount} style={s.guestNote} accessibilityRole="button" accessibilityLabel="Saved on this device only. Sign in to keep favorites across devices">
          <Text style={s.guestNoteText}>Saved on this device only. <Text style={s.guestNoteLink}>Sign in</Text> to keep them across devices.</Text>
        </Pressable>
      )}

      <ListStatus loading={loading} error={loadError} onRetry={onRetry} hasItems={actresses.length > 0}>
      {favorites.length ? (
        <>
          <Text style={s.groupLabel}>Curated ({favorites.length})</Text>
          {favorites.map((a, i) => (
            <Rise key={a.id} delay={Math.min(i, 6) * 60}>
              <ActressCard actress={a} variant="favorite" onPress={onProfile} onRemove={onFavorite} />
            </Rise>
          ))}
        </>
      ) : (
        <EmptyState
          icon="heart-outline"
          title="Your shortlist is ready"
          body="Tap the heart on any actress card to save her here for quick casting access."
          action="Browse the Directory"
          onAction={() => onNavigate('directory')}
        />
      )}
      </ListStatus>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: space.xxxl },
  heading: { marginHorizontal: space.page, marginBottom: space.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.h1 },
  count: { backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm },
  countText: { ...type.smallStrong, color: colors.burgundy },
  copy: { ...type.body, marginHorizontal: space.page, marginBottom: space.md },
  syncNote: { flexDirection: 'row', alignItems: 'center', marginHorizontal: space.page, marginBottom: space.lg },
  syncNoteText: { ...type.caption, color: colors.success, marginLeft: space.xs },
  guestNote: { marginHorizontal: space.page, marginBottom: space.lg, backgroundColor: colors.blush, borderRadius: radius.md, padding: space.md },
  guestNoteText: { ...type.caption, fontWeight: '400', lineHeight: 18 },
  guestNoteLink: { color: colors.burgundy, fontWeight: '700' },
  groupLabel: { ...type.kicker, marginHorizontal: space.page, marginBottom: space.md },
});
