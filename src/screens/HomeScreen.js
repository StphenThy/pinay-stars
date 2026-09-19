import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import ActressCard from '../components/ActressCard';
import { Avatar, Button, Chip, EmptyState, Kicker, SectionHeader, Tag } from '../components/ui';
import { colors, radius, shadow, fonts } from '../theme';
import { matchesQuery, sortActresses } from '../data/actressModel';
import { useAuth } from '../auth';
import PressScale from '../components/PressScale';

const CATEGORIES = ['All Talents', 'Drama', 'Comedy', 'Action', 'Romance', 'Television', 'Film'];
const FEATURE_LABELS = ['Top Trending', 'Icon Status', 'Auteur Choice'];
const CARD_WIDTH = 314;

function inCategory(a, category) {
  if (category === 'All Talents') return true;
  if (category === 'Television') return a.tvSeries.length > 0;
  if (category === 'Film') return a.films.length > 0;
  return a.genres.some(g => g.toLowerCase().includes(category.toLowerCase()));
}

export default function HomeScreen({ actresses, query, setQuery, category, setCategory, favorites, onFavorite, onNavigate, onProfile, source, onRefresh, refreshing }) {
  const [page, setPage] = useState(0);
  const carousel = useRef(null);
  const { isAdmin } = useAuth();

  const isFavorite = a => favorites.some(f => f.id === a.id);
  const pool = useMemo(
    () => sortActresses(actresses.filter(a => inCategory(a, category) && matchesQuery(a, query)), 'popular'),
    [actresses, category, query],
  );
  const featured = pool.slice(0, 3);
  const headliners = pool.slice(0, 8);
  const recent = useMemo(() => sortActresses(actresses, 'recent').slice(0, 3), [actresses]);
  const pendingReview = actresses.filter(a => a.status === 'review').length;
  const filtered = category !== 'All Talents' || query.trim();

  useEffect(() => {
    setPage(0);
    carousel.current?.scrollTo({ x: 0, animated: false });
  }, [category, query]);

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} />}
    >
      <AppHeader section="HOME" />

      <View style={s.headingRow}>
        <View style={{ flex: 1 }}>
          <Kicker>EDITORIAL SHOWCASE</Kicker>
          <Text style={s.hero}>Discover Filipina{'\n'}Talent</Text>
        </View>
        <View style={s.countPill}>
          <Text style={s.countValue}>{actresses.length}</Text>
          <Text style={s.countLabel}>Stars</Text>
        </View>
      </View>

      <View style={s.search}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search actress, movie, or genre..."
          placeholderTextColor={colors.muted}
          style={s.input}
          returnKeyType="search"
          onSubmitEditing={() => onNavigate('directory')}
        />
        <Pressable onPress={() => onNavigate('directory')} style={s.filterButton} hitSlop={8}>
          <Text style={s.filterIcon}>☷</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {CATEGORIES.map(c => (
          <View key={c} style={{ marginRight: 8 }}>
            <Chip label={c} active={category === c} onPress={() => setCategory(c)} />
          </View>
        ))}
      </ScrollView>

      <SectionHeader
        title="Featured Spotlights"
        icon="♨"
        subtitle={filtered ? `${pool.length} talent${pool.length === 1 ? '' : 's'} in ${category}${query.trim() ? ` matching “${query.trim()}”` : ''}` : 'Tap a card to reveal details'}
        action={featured.length > 1 ? 'Swipe to explore' : undefined}
      />
      {featured.length ? (
        <>
          <ScrollView
            ref={carousel}
            horizontal
            snapToInterval={CARD_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.carousel}
            onMomentumScrollEnd={e => setPage(Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH))}
          >
            {featured.map((a, i) => (
              <ActressCard
                key={a.id}
                actress={a}
                variant="featured"
                featureLabel={FEATURE_LABELS[i]}
                onPress={onProfile}
                onFavorite={onFavorite}
                favorite={isFavorite(a)}
              />
            ))}
          </ScrollView>
          <View style={s.dots}>
            {featured.map((a, i) => <View key={a.id} style={[s.dot, page === i && s.dotActive]} />)}
          </View>
        </>
      ) : (
        <EmptyState
          icon="⌕"
          title={`No ${category === 'All Talents' ? 'stars' : category.toLowerCase() + ' talents'} found`}
          body="Try another category or clear the search."
          action="Show all talents"
          onAction={() => { setCategory('All Talents'); setQuery(''); }}
        />
      )}

      <SectionHeader
        title="Popular Headliners"
        subtitle="Beloved icons leading historic box office and streaming charts"
        action="See All ›"
        onAction={() => onNavigate('directory')}
      />
      {headliners.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.horizontal}>
          {headliners.map(a => (
            <ActressCard key={a.id} actress={a} variant="compact" onPress={onProfile} onFavorite={onFavorite} favorite={isFavorite(a)} />
          ))}
        </ScrollView>
      ) : null}

      <SectionHeader title="Recently Added to Roster" subtitle="Rising powerhouses and new portfolio updates" />
      <View style={s.recentList}>
        {recent.map(a => (
          <PressScale key={a.id} onPress={() => onProfile(a)} style={s.recentRow} scaleTo={0.98}>
            <Avatar uri={a.image} name={a.stageName} style={s.recentAvatar} rounded={radius.sm} />
            <View style={{ flex: 1 }}>
              <Text style={s.recentName}>{a.stageName}</Text>
              <Text numberOfLines={1} style={s.recentAward}>{a.awards[0] || a.occupation}</Text>
              <View style={s.recentTags}>
                {a.genres.slice(0, 2).map(g => <Tag key={g} label={g} />)}
                {a.tvSeries.length ? <Tag label="Streaming Lead" tone="gold" /> : null}
              </View>
            </View>
            <Text style={s.chevron}>›</Text>
          </PressScale>
        ))}
      </View>

      <View style={s.registry}>
        <View style={s.registryIcon}><Text style={s.registryIconText}>▤</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.registryTitle}>Database {source === 'offline' ? 'Offline Archive' : 'Active Registry'}</Text>
          <Text style={s.registryMeta}>
            {actresses.length} Profiles  •  {pendingReview} Pending Review
          </Text>
        </View>
        <Button label={isAdmin ? 'Manage DB' : 'Suggest a Star'} small onPress={() => onNavigate(isAdmin ? 'manage' : 'suggest')} />
      </View>

      <View style={s.footer}>
        <Text style={s.quote}>“Celebrating the grace, power, and cinematic mastery of Filipina storytellers.”</Text>
        <Text style={s.cities}>MANILA • LOS ANGELES • CANNES</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: 30 },
  headingRow: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center' },
  hero: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 36, lineHeight: 42, color: colors.burgundy, marginTop: 6 },
  countPill: { backgroundColor: colors.blushDeep, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10, alignItems: 'center' },
  countValue: { fontFamily: fonts.serif, fontWeight: '700', color: colors.burgundy, fontSize: 24 },
  countLabel: { color: colors.rose, fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  search: { marginHorizontal: 20, marginTop: 20, height: 56, backgroundColor: colors.white, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, paddingRight: 8, ...shadow.card },
  searchIcon: { fontSize: 26, color: colors.rose },
  input: { flex: 1, fontSize: 15, marginLeft: 8, color: colors.textStrong },
  filterButton: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  filterIcon: { fontSize: 20, color: colors.burgundy },
  chips: { paddingHorizontal: 20, paddingVertical: 16 },
  carousel: { paddingHorizontal: 20 },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 12, marginBottom: 26 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line, marginHorizontal: 3 },
  dotActive: { backgroundColor: colors.burgundy, width: 20 },
  horizontal: { paddingHorizontal: 20, paddingBottom: 26 },
  noneText: { marginHorizontal: 20, marginBottom: 26, color: colors.muted },
  recentList: { marginHorizontal: 20, backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: 12, ...shadow.card },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderColor: colors.line },
  recentAvatar: { width: 56, height: 70, marginRight: 12 },
  recentName: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 18, color: colors.burgundy },
  recentAward: { color: colors.text, fontSize: 12, marginTop: 2 },
  recentTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  chevron: { fontSize: 26, color: colors.muted, marginLeft: 8 },
  registry: { marginHorizontal: 20, marginTop: 24, backgroundColor: colors.burgundy, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center' },
  registryIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  registryIconText: { color: colors.gold, fontSize: 20 },
  registryTitle: { color: colors.white, fontWeight: '700', fontSize: 15 },
  registryMeta: { color: '#FBD5D9', fontSize: 12, marginTop: 3 },
  footer: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 34, paddingBottom: 12 },
  quote: { fontFamily: fonts.serif, fontStyle: 'italic', color: colors.burgundy, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  cities: { color: colors.rose, fontWeight: '700', letterSpacing: 2, fontSize: 11, marginTop: 14 },
});
