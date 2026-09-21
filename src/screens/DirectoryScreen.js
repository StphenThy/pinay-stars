import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import ActressCard from '../components/ActressCard';
import { Button, EmptyState, Kicker, ListStatus } from '../components/ui';
import { colors, radius, shadow, space, statusMeta, touch, type, fonts } from '../theme';
import { DEFAULT_FILTERS, ERAS, SORTS, activeFilterCount, applyFilters, sortActresses } from '../data/actressModel';

const PAGE_SIZE = 5;

export default function DirectoryScreen({ actresses, query, setQuery, filters, setFilters, favorites, onFavorite, onProfile, onOpenFilters, onSuggest, onRefresh, refreshing, loading, loadError, onRetry }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const results = useMemo(
    () => sortActresses(applyFilters(actresses, filters, query), filters.sort),
    [actresses, filters, query],
  );

  useEffect(() => { setVisible(PAGE_SIZE); }, [query, filters]);

  const shown = results.slice(0, visible);
  const activeCount = activeFilterCount(filters);
  const sort = SORTS.find(x => x.key === filters.sort) || SORTS[0];
  const era = ERAS.find(e => e.key === filters.era);

  const cycleSort = () => {
    const i = SORTS.findIndex(x => x.key === filters.sort);
    setFilters({ ...filters, sort: SORTS[(i + 1) % SORTS.length].key });
  };
  const reset = () => setFilters({ ...DEFAULT_FILTERS, sort: filters.sort });
  const removeGenre = g => setFilters({ ...filters, genres: filters.genres.filter(x => x !== g) });

  const inquire = () => {
    const names = (favorites.length ? favorites : shown).map(a => `• ${a.stageName} (${a.agency})`).join('\n');
    Share.share({
      title: 'Pinay Stars casting inquiry',
      message: `Casting inquiry from Pinay Stars\n\nShortlist:\n${names}\n\nPlease confirm availability.`,
    }).catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} />}>
      <AppHeader section="ACTRESSES" />

      <View style={s.heading}>
        <Kicker>Roster archive</Kicker>
        <View style={s.headingRow}>
          <Text style={s.title} accessibilityRole="header">Actress Directory</Text>
          <View style={s.count} accessible accessibilityLabel={`${actresses.length} stars`}><Text style={s.countText}>{actresses.length} Stars</Text></View>
        </View>
      </View>

      <View style={s.search}>
        <Ionicons name="search-outline" size={20} color={colors.rose} />
        <TextInput
          accessibilityLabel="Search by name, film, or keyword"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, film, or keyword..."
          placeholderTextColor={colors.muted}
          style={s.input}
          returnKeyType="search"
        />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={8} style={s.clear} accessibilityRole="button" accessibilityLabel="Clear search"><Ionicons name="close-circle" size={20} color={colors.muted} /></Pressable> : null}
      </View>

      <View style={s.toolbar}>
        <Pressable onPress={onOpenFilters} style={[s.filtersButton, activeCount > 0 && s.filtersButtonActive]} accessibilityRole="button" accessibilityLabel={activeCount > 0 ? `Filters, ${activeCount} active` : 'Filters'}>
          <Ionicons name="options-outline" size={16} color={activeCount > 0 ? colors.white : colors.burgundy} style={{ marginRight: 6 }} />
          <Text style={[s.filtersText, activeCount > 0 && s.filtersTextActive]}>Filters</Text>
          {activeCount > 0 ? <View style={s.badge}><Text style={s.badgeText}>{activeCount}</Text></View> : null}
        </Pressable>
        <Pressable onPress={cycleSort} style={s.sortButton} accessibilityRole="button" accessibilityLabel={`Sort by ${sort.short}. Tap to change`}>
          <Text style={s.sortText}>Sort: {sort.short}</Text>
          <Ionicons name="swap-vertical" size={16} color={colors.rose} style={{ marginLeft: 4 }} />
        </Pressable>
      </View>

      {activeCount > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.activeRow}>
          {filters.genres.map(g => (
            <Pressable key={g} onPress={() => removeGenre(g)} style={s.activeChip}>
              <Text style={s.activeChipText}>Genre: {g}</Text><Ionicons name="close" size={14} color={colors.burgundy} style={{ marginLeft: 4 }} />
            </Pressable>
          ))}
          {filters.era !== 'all' && era ? (
            <Pressable onPress={() => setFilters({ ...filters, era: 'all' })} style={s.activeChip}>
              <Text style={s.activeChipText}>Era: {era.label.split(' (')[0]}</Text><Ionicons name="close" size={14} color={colors.burgundy} style={{ marginLeft: 4 }} />
            </Pressable>
          ) : null}
          {filters.status !== 'all' ? (
            <Pressable onPress={() => setFilters({ ...filters, status: 'all' })} style={s.activeChip}>
              <Text style={s.activeChipText}>Status: {statusMeta[filters.status]?.label}</Text><Ionicons name="close" size={14} color={colors.burgundy} style={{ marginLeft: 4 }} />
            </Pressable>
          ) : null}
          <Pressable onPress={reset} style={s.resetChip}><Text style={s.resetText}>Reset</Text></Pressable>
        </ScrollView>
      ) : null}

      <ListStatus loading={loading} error={loadError} onRetry={onRetry} hasItems={actresses.length > 0}>
      {shown.map(a => (
        <ActressCard
          key={a.id}
          actress={a}
          onPress={onProfile}
          onFavorite={onFavorite}
          favorite={favorites.some(f => f.id === a.id)}
        />
      ))}

      {!results.length ? (
        <EmptyState
          icon="search-outline"
          title="No stars found"
          body="Try a different search, or clear the active filters."
          action={activeCount || query ? 'Clear search & filters' : undefined}
          onAction={() => { setQuery(''); reset(); }}
        />
      ) : (
        <View style={s.pager}>
          <Text style={s.pagerText}>Showing {shown.length} of {results.length} star{results.length === 1 ? '' : 's'}</Text>
          {visible < results.length ? (
            <Button label="Load More Actresses" variant="secondary" onPress={() => setVisible(v => v + PAGE_SIZE)} style={{ marginTop: 12 }} />
          ) : null}
        </View>
      )}
      </ListStatus>

      <View style={s.cta}>
        <View style={{ flex: 1 }}>
          <Text style={s.ctaTitle}>Looking to cast a role?</Text>
          <Text style={s.ctaBody}>Export shortlist or request availability</Text>
        </View>
        <Button label="Inquire" small onPress={inquire} />
      </View>

      <View style={s.suggest}>
        <View style={{ flex: 1 }}>
          <Text style={s.suggestTitle}>Someone missing from the archive?</Text>
          <Text style={s.suggestBody}>Suggest an actress — an admin reviews it before it goes live.</Text>
        </View>
        <Button label="Suggest" variant="secondary" small onPress={onSuggest} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: space.xxxl },
  heading: { paddingHorizontal: space.page, paddingTop: space.xs },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.sm },
  title: { ...type.h1 },
  count: { backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm },
  countText: { ...type.smallStrong, color: colors.burgundy },
  search: { height: 56, marginHorizontal: space.page, marginTop: space.lg, backgroundColor: colors.white, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, ...shadow.card },
  input: { ...type.body, color: colors.textStrong, flex: 1, marginLeft: space.sm, minHeight: touch.min },
  clear: { width: touch.min - 8, height: touch.min - 8, alignItems: 'center', justifyContent: 'center', marginRight: -space.sm },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: space.page, marginTop: space.md },
  filtersButton: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min - 4, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: space.sm, paddingHorizontal: space.md },
  filtersButtonActive: { backgroundColor: colors.burgundy, borderColor: colors.burgundy },
  filtersText: { ...type.smallStrong },
  filtersTextActive: { color: colors.white },
  badge: { marginLeft: space.sm, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs },
  badgeText: { ...type.caption, color: colors.burgundyDeep },
  sortButton: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min - 4, paddingVertical: space.sm, paddingHorizontal: space.xs },
  sortText: { ...type.smallStrong, color: colors.rose },
  activeRow: { paddingHorizontal: space.page, paddingTop: space.md },
  activeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingVertical: space.sm, paddingHorizontal: space.md, marginRight: space.sm, minHeight: 36 },
  activeChipText: { ...type.caption, color: colors.burgundy },
  resetChip: { paddingVertical: space.sm, paddingHorizontal: space.sm, minHeight: 36, justifyContent: 'center' },
  resetText: { ...type.caption, color: colors.rose, textDecorationLine: 'underline' },
  pager: { alignItems: 'center', marginHorizontal: space.page, marginTop: space.xs, marginBottom: space.sm },
  pagerText: { ...type.small },
  cta: { margin: space.page, backgroundColor: colors.burgundy, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center' },
  ctaTitle: { ...type.title, color: colors.white },
  ctaBody: { ...type.small, color: colors.onDarkSoft, marginTop: space.xs },
  suggest: { marginHorizontal: space.page, marginBottom: space.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  suggestTitle: { ...type.bodyStrong, color: colors.burgundy },
  suggestBody: { ...type.caption, fontFamily: fonts.sans, marginTop: space.xs, marginRight: space.md },
});
