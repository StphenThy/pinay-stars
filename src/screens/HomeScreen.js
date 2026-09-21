import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ActressCard from '../components/ActressCard';
import { Avatar, Button, Chip, EmptyState, IconButton, Kicker, ListStatus, Rise, SectionHeader, Tag } from '../components/ui';
import { colors, radius, shadow, space, touch, type, fonts } from '../theme';
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

export default function HomeScreen({ actresses, query, setQuery, category, setCategory, favorites, onFavorite, onNavigate, onProfile, source, onRefresh, refreshing, loading, loadError, onRetry }) {
  const [page, setPage] = useState(0);
  const carousel = useRef(null);
  // Drives the parallax on the featured portraits; native-driven so it never drops frames.
  const scrollX = useRef(new Animated.Value(0)).current;
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
          <Text style={s.hero} accessibilityRole="header">Discover Filipina{'\n'}Talent</Text>
        </View>
        <View style={s.countPill} accessible accessibilityLabel={`${actresses.length} stars in the registry`}>
          <Text style={s.countValue}>{actresses.length}</Text>
          <Text style={s.countLabel}>Stars</Text>
        </View>
      </View>

      <View style={s.search}>
        <Ionicons name="search-outline" size={20} color={colors.rose} />
        <TextInput
          accessibilityLabel="Search actress, movie, or genre"
          value={query}
          onChangeText={setQuery}
          placeholder="Search actress, movie, or genre..."
          placeholderTextColor={colors.muted}
          style={s.input}
          returnKeyType="search"
          onSubmitEditing={() => onNavigate('directory')}
        />
        <IconButton icon="options-outline" onPress={() => onNavigate('directory')} label="Open directory filters" size={22} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {CATEGORIES.map(c => (
          <View key={c} style={{ marginRight: space.sm }}>
            <Chip label={c} active={category === c} onPress={() => setCategory(c)} />
          </View>
        ))}
      </ScrollView>

      <SectionHeader
        title="Featured Spotlights"
        subtitle={filtered ? `${pool.length} talent${pool.length === 1 ? '' : 's'} in ${category}${query.trim() ? ` matching “${query.trim()}”` : ''}` : 'Tap a card to reveal details'}
        action={featured.length > 1 ? 'Swipe to explore' : undefined}
      />
      <ListStatus loading={loading} error={loadError} onRetry={onRetry} hasItems={actresses.length > 0}>
      {featured.length ? (
        <>
          <Animated.ScrollView
            ref={carousel}
            horizontal
            snapToInterval={CARD_WIDTH}
            snapToAlignment="start"
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.carousel}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
            scrollEventThrottle={16}
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
                parallax={{ scrollX, index: i, width: CARD_WIDTH }}
              />
            ))}
          </Animated.ScrollView>
          <View style={s.dots}>
            {featured.map((a, i) => <View key={a.id} style={[s.dot, page === i && s.dotActive]} />)}
          </View>
        </>
      ) : (
        <EmptyState
          icon="search-outline"
          title={`No ${category === 'All Talents' ? 'stars' : category.toLowerCase() + ' talents'} found`}
          body="Try another category or clear the search."
          action="Show all talents"
          onAction={() => { setCategory('All Talents'); setQuery(''); }}
        />
      )}
      </ListStatus>

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
        {recent.map((a, i) => (
          <Rise key={a.id} delay={i * 70}>
          <PressScale onPress={() => onProfile(a)} style={s.recentRow} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${a.stageName}, ${a.awards[0] || a.occupation}`}>
            <Avatar uri={a.image} name={a.stageName} style={s.recentAvatar} rounded={radius.sm} />
            <View style={{ flex: 1 }}>
              <Text style={s.recentName}>{a.stageName}</Text>
              <Text numberOfLines={1} style={s.recentAward}>{a.awards[0] || a.occupation}</Text>
              <View style={s.recentTags}>
                {a.genres.slice(0, 2).map(g => <Tag key={g} label={g} />)}
                {a.tvSeries.length ? <Tag label="Streaming Lead" tone="gold" /> : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} style={s.chevron} />
          </PressScale>
          </Rise>
        ))}
      </View>

      <View style={s.registry}>
        <View style={s.registryIcon}><Ionicons name="albums-outline" size={20} color={colors.gold} /></View>
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
  page: { paddingBottom: space.xxxl },
  headingRow: { paddingHorizontal: space.page, flexDirection: 'row', alignItems: 'center' },
  hero: { ...type.display, marginTop: space.sm },
  countPill: { backgroundColor: colors.blushDeep, borderRadius: radius.lg, paddingHorizontal: space.lg, paddingVertical: space.md, alignItems: 'center', minWidth: 72 },
  countValue: { ...type.h2 },
  countLabel: { ...type.kicker },
  search: { marginHorizontal: space.page, marginTop: space.xl, height: 56, backgroundColor: colors.white, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, paddingRight: space.sm, ...shadow.card },
  input: { ...type.body, color: colors.textStrong, flex: 1, marginLeft: space.sm, minHeight: touch.min },
  chips: { paddingHorizontal: space.page, paddingVertical: space.lg },
  carousel: { paddingHorizontal: space.page },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: space.md, marginBottom: space.xxl },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line, marginHorizontal: space.xs },
  dotActive: { backgroundColor: colors.burgundy, width: 20 },
  horizontal: { paddingHorizontal: space.page, paddingBottom: space.xxl },
  recentList: { marginHorizontal: space.page, backgroundColor: colors.white, borderRadius: radius.lg, paddingHorizontal: space.md, ...shadow.card },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: space.md, borderBottomWidth: 1, borderColor: colors.line },
  recentAvatar: { width: 56, height: 70, marginRight: space.md },
  recentName: { ...type.h3 },
  recentAward: { ...type.caption, fontFamily: fonts.sans, marginTop: 2 },
  recentTags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.sm },
  chevron: { marginLeft: space.sm },
  registry: { marginHorizontal: space.page, marginTop: space.xxl, backgroundColor: colors.burgundy, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center' },
  registryIcon: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, backgroundColor: colors.onDarkFill, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  registryTitle: { ...type.bodyStrong, color: colors.white },
  registryMeta: { ...type.caption, color: colors.onDarkSoft, marginTop: space.xs },
  footer: { alignItems: 'center', paddingHorizontal: space.xxxl, paddingTop: space.xxxl, paddingBottom: space.md },
  quote: { ...type.body, fontFamily: fonts.serifItalic, color: colors.burgundy, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  cities: { ...type.kicker, marginTop: space.md },
});
