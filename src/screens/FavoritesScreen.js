import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import AppHeader from '../components/AppHeader';
import ActressCard from '../components/ActressCard';
import { EmptyState } from '../components/ui';
import { colors, radius, fonts } from '../theme';
import { useAuth } from '../auth';

export default function FavoritesScreen({ favorites, onProfile, onFavorite, onNavigate, onRefresh, refreshing }) {
  const { account, openAccount } = useAuth();
  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} />}>
      <AppHeader section="FAVORITES" />

      <View style={s.heading}>
        <Text style={s.title}>My Favorites</Text>
        <View style={s.count}><Text style={s.countText}>{favorites.length} Bookmarked</Text></View>
      </View>
      <Text style={s.copy}>Quick-access list of your shortlisted and favorite Filipina performers.</Text>
      {account ? (
        <Text style={s.syncNote}>Synced to {account.display_name || account.username}'s account</Text>
      ) : (
        <Pressable onPress={openAccount} style={s.guestNote}>
          <Text style={s.guestNoteText}>Saved on this device only. <Text style={s.guestNoteLink}>Sign in</Text> to keep them across devices.</Text>
        </Pressable>
      )}

      {favorites.length ? (
        <>
          <Text style={s.groupLabel}>Curated ({favorites.length})</Text>
          {favorites.map(a => (
            <ActressCard key={a.id} actress={a} variant="favorite" onPress={onProfile} onRemove={onFavorite} />
          ))}
        </>
      ) : (
        <EmptyState
          icon="♡"
          title="Your shortlist is ready"
          body="Tap the heart on any actress card to save her here for quick casting access."
          action="Browse the Directory"
          onAction={() => onNavigate('directory')}
        />
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: 30 },
  heading: { marginHorizontal: 20, marginBottom: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.burgundy, fontWeight: '700' },
  count: { backgroundColor: '#FFA6B5', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  countText: { color: '#793343', fontWeight: '700', fontSize: 13 },
  copy: { marginHorizontal: 20, marginBottom: 10, fontSize: 15, lineHeight: 22, color: colors.text },
  syncNote: { marginHorizontal: 20, marginBottom: 18, color: colors.success, fontSize: 12, fontWeight: '700' },
  guestNote: { marginHorizontal: 20, marginBottom: 18, backgroundColor: colors.blush, borderRadius: radius.md, padding: 12 },
  guestNoteText: { color: colors.text, fontSize: 12, lineHeight: 18 },
  guestNoteLink: { color: colors.burgundy, fontWeight: '700' },
  groupLabel: { marginHorizontal: 20, marginBottom: 10, color: colors.rose, fontWeight: '700', fontSize: 12, letterSpacing: 1.2 },
});
