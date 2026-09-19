import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import AppHeader from '../components/AppHeader';
import ActressCard from '../components/ActressCard';
import { Button, EmptyState, Kicker } from '../components/ui';
import { colors, radius, shadow, statusMeta, fonts } from '../theme';
import { DEFAULT_FILTERS, ERAS, SORTS, activeFilterCount, applyFilters, sortActresses } from '../data/actressModel';

const PAGE_SIZE = 5;

export default function DirectoryScreen({ actresses, query, setQuery, filters, setFilters, favorites, onFavorite, onProfile, onOpenFilters, onSuggest, onRefresh, refreshing }) {
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
        <Kicker>● ROSTER ARCHIVE</Kicker>
        <View style={s.headingRow}>
          <Text style={s.title}>Actress Directory</Text>
          <View style={s.count}><Text style={s.countText}>✦ {actresses.length} Stars</Text></View>
        </View>
      </View>

      <View style={s.search}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name, film, or keyword..."
          placeholderTextColor={colors.muted}
          style={s.input}
          returnKeyType="search"
        />
        {query ? <Pressable onPress={() => setQuery('')} hitSlop={8}><Text style={s.clear}>✕</Text></Pressable> : null}
      </View>

      <View style={s.toolbar}>
        <Pressable onPress={onOpenFilters} style={[s.filtersButton, activeCount > 0 && s.filtersButtonActive]}>
          <Text style={[s.filtersText, activeCount > 0 && s.filtersTextActive]}>☷ Filters</Text>
          {activeCount > 0 ? <View style={s.badge}><Text style={s.badgeText}>{activeCount}</Text></View> : null}
        </Pressable>
        <Pressable onPress={cycleSort} style={s.sortButton}>
          <Text style={s.sortText}>Sort: {sort.short} ↓</Text>
        </Pressable>
      </View>

      {activeCount > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.activeRow}>
          {filters.genres.map(g => (
            <Pressable key={g} onPress={() => removeGenre(g)} style={s.activeChip}>
              <Text style={s.activeChipText}>Genre: {g}  ✕</Text>
            </Pressable>
          ))}
          {filters.era !== 'all' && era ? (
            <Pressable onPress={() => setFilters({ ...filters, era: 'all' })} style={s.activeChip}>
              <Text style={s.activeChipText}>Era: {era.label.split(' (')[0]}  ✕</Text>
            </Pressable>
          ) : null}
          {filters.status !== 'all' ? (
            <Pressable onPress={() => setFilters({ ...filters, status: 'all' })} style={s.activeChip}>
              <Text style={s.activeChipText}>Status: {statusMeta[filters.status]?.label}  ✕</Text>
            </Pressable>
          ) : null}
          <Pressable onPress={reset} style={s.resetChip}><Text style={s.resetText}>Reset</Text></Pressable>
        </ScrollView>
      ) : null}

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
          icon="⌕"
          title="No stars found"
          body="Try a different search, or clear the active filters."
          action={activeCount || query ? 'Clear search & filters' : undefined}
          onAction={() => { setQuery(''); reset(); }}
        />
      ) : (
        <View style={s.pager}>
          <Text style={s.pagerText}>Showing {shown.length} of {results.length} star{results.length === 1 ? '' : 's'}</Text>
          {visible < results.length ? (
            <Button label="Load More Actresses" variant="secondary" onPress={() => setVisible(v => v + PAGE_SIZE)} style={{ marginTop: 10 }} />
          ) : null}
        </View>
      )}

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
  page: { paddingBottom: 30 },
  heading: { paddingHorizontal: 20, paddingTop: 4 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.burgundy, fontWeight: '700' },
  count: { backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  countText: { color: colors.burgundy, fontWeight: '700', fontSize: 13 },
  search: { height: 54, marginHorizontal: 20, marginTop: 16, backgroundColor: colors.white, borderRadius: radius.lg, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, ...shadow.card },
  searchIcon: { fontSize: 26, color: colors.rose },
  input: { flex: 1, fontSize: 15, marginLeft: 8, color: colors.textStrong },
  clear: { color: colors.muted, fontSize: 16, padding: 4 },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 14 },
  filtersButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.line, borderRadius: radius.pill, paddingVertical: 9, paddingHorizontal: 14 },
  filtersButtonActive: { backgroundColor: colors.burgundy, borderColor: colors.burgundy },
  filtersText: { color: colors.textStrong, fontWeight: '700', fontSize: 14 },
  filtersTextActive: { color: colors.white },
  badge: { marginLeft: 8, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  badgeText: { color: colors.burgundyDeep, fontWeight: '700', fontSize: 12 },
  sortButton: { paddingVertical: 9, paddingHorizontal: 4 },
  sortText: { color: colors.rose, fontWeight: '700', fontSize: 14 },
  activeRow: { paddingHorizontal: 20, paddingTop: 12 },
  activeChip: { backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingVertical: 7, paddingHorizontal: 12, marginRight: 8 },
  activeChipText: { color: colors.burgundy, fontWeight: '700', fontSize: 12 },
  resetChip: { paddingVertical: 7, paddingHorizontal: 8 },
  resetText: { color: colors.rose, fontWeight: '700', fontSize: 12, textDecorationLine: 'underline' },
  pager: { alignItems: 'center', marginHorizontal: 20, marginTop: 4, marginBottom: 8 },
  pagerText: { color: colors.text, fontSize: 13 },
  cta: { margin: 20, backgroundColor: colors.burgundy, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center' },
  ctaTitle: { color: colors.white, fontWeight: '700', fontSize: 16 },
  ctaBody: { color: '#FBD5D9', fontSize: 13, marginTop: 3 },
  suggest: { marginHorizontal: 20, marginBottom: 10, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.line },
  suggestTitle: { color: colors.burgundy, fontWeight: '700', fontSize: 15 },
  suggestBody: { color: colors.text, fontSize: 12, marginTop: 3, marginRight: 10 },
});
