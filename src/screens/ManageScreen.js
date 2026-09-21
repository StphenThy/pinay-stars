import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import AppHeader from '../components/AppHeader';
import { Avatar, Button, Chip, EmptyState, ListStatus, StatusPill } from '../components/ui';
import { colors, radius, shadow, fonts } from '../theme';
import { recentlyUpdated, toCsv } from '../data/actressModel';

const TABS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'review', label: 'Needs Verification', match: a => a.status === 'review' },
  { key: 'draft', label: 'Drafts', match: a => a.status === 'draft' },
  { key: 'recent', label: 'Recently Updated', match: a => recentlyUpdated(a, 30) },
];

function sinceLabel(stamp) {
  if (!stamp) return 'Not yet synced';
  const mins = Math.round((Date.now() - stamp) / 60000);
  if (mins < 1) return 'Refreshed just now';
  if (mins < 60) return `Refreshed ${mins} min ago`;
  return `Refreshed ${Math.round(mins / 60)} h ago`;
}

export default function ManageScreen({ actresses, source, syncing, lastSync, onProfile, onAdd, onEdit, onDelete, onApprove, onSync, onToast, onRefresh, refreshing, loading, loadError, onRetry }) {
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => Object.fromEntries(TABS.map(t => [t.key, actresses.filter(t.match).length])), [actresses]);
  const pending = counts.review;

  const rows = useMemo(() => {
    const active = TABS.find(t => t.key === tab) || TABS[0];
    const q = search.trim().toLowerCase();
    return actresses
      .filter(active.match)
      .filter(a => !q || a.stageName.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.genres.join(' ').toLowerCase().includes(q))
      .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  }, [actresses, tab, search]);

  const exportCsv = () => {
    Share.share({ title: 'pinay_stars_roster.csv', message: toCsv(actresses) })
      .then(() => onToast && onToast({ tone: 'success', message: `Exported ${actresses.length} records as CSV` }))
      .catch(() => {});
  };

  return (
    <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} />}>
      <AppHeader
        section="MANAGE"
        right={<View style={s.adminBadge}><Text style={s.adminBadgeText}>ADMIN MODE • FULL ACCESS</Text></View>}
      />

      <View style={s.headingRow}>
        <Text style={s.heading}>Manage Actresses</Text>
        <Text style={s.records}>• {actresses.length} Records</Text>
      </View>
      <Text style={s.desc}>Editorial roster verification, metadata curation, and cast availability.</Text>

      <Pressable onPress={onAdd} style={s.add}>
        <View style={s.addIcon}><Text style={s.addIconText}>＋</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={s.addTitle}>Add New Actress</Text>
          <Text style={s.addBody}>Draft profile, headshots & representation data</Text>
        </View>
        <Text style={s.addChevron}>›</Text>
      </Pressable>

      {pending ? (
        <Pressable onPress={() => setTab('review')} style={s.pendingBanner}>
          <View style={s.pendingIcon}><Text style={s.pendingIconText}>{pending}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.pendingTitle}>{pending} submission{pending === 1 ? '' : 's'} awaiting review</Text>
            <Text style={s.pendingBody}>Suggested by visitors. Approve to publish or reject to remove.</Text>
          </View>
          <Text style={s.pendingChevron}>›</Text>
        </Pressable>
      ) : null}

      <View style={s.roster}>
        <View style={s.rosterHead}>
          <Text style={s.rosterKicker}>ROSTER STATUS</Text>
          <View style={[s.rosterState, source === 'offline' && s.rosterStateOffline]}>
            <Text style={s.rosterStateText}>{source === 'offline' ? '● Offline Archive' : '● Cloud Synced'}</Text>
          </View>
        </View>
        <Text style={s.rosterTitle}>{actresses.length} Actresses</Text>
        <Text style={s.rosterSub}>Live Talent Directory • {syncing ? 'Syncing…' : sinceLabel(lastSync)}</Text>
        {source === 'offline' ? (
          <Text style={s.rosterWarn}>The registry could not be reached. You are viewing the bundled archive; edits will not save until the connection returns.</Text>
        ) : null}
      </View>

      <View style={s.search}>
        <Text style={s.searchIcon}>⌕</Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Filter database records by name or genre..."
          placeholderTextColor={colors.muted}
          style={s.input}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabs}>
        {TABS.map(t => (
          <View key={t.key} style={{ marginRight: 8 }}>
            <Chip label={t.label} count={counts[t.key]} active={tab === t.key} onPress={() => setTab(t.key)} small />
          </View>
        ))}
      </ScrollView>

      <ListStatus loading={loading} error={loadError} onRetry={onRetry} hasItems={actresses.length > 0}>
      {rows.length ? rows.map(a => (
        <View key={a.id} style={s.card}>
          <Pressable onPress={() => onProfile(a)} style={s.cardTop}>
            <Avatar uri={a.image} name={a.stageName} style={s.avatar} rounded={radius.sm} />
            <View style={{ flex: 1 }}>
              <View style={s.cardTitleRow}>
                <Text numberOfLines={1} style={s.name}>{a.stageName}</Text>
                <StatusPill status={a.status} />
              </View>
              <Text numberOfLines={1} style={s.meta}>
                Born {a.birthday ? a.birthday.slice(0, 4) : '—'} • {a.genres.slice(0, 2).join(' / ') || 'No genre'}
              </Text>
              <Text style={s.id}>ID: {a.displayId}{recentlyUpdated(a, 1) ? '  •  Updated today' : ''}</Text>
            </View>
          </Pressable>
          {a.status === 'review' ? (
            <View style={s.cardActions}>
              <Button label="Approve" small onPress={() => onApprove(a)} style={{ flex: 1.3 }} />
              <Button label="Edit" variant="secondary" small onPress={() => onEdit(a)} style={{ flex: 1, marginLeft: 8 }} />
              <Button label="Reject" variant="danger" small onPress={() => onDelete(a)} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          ) : (
            <View style={s.cardActions}>
              <Button label="View" variant="ghost" small onPress={() => onProfile(a)} style={{ flex: 1 }} />
              <Button label="Edit" variant="secondary" small onPress={() => onEdit(a)} style={{ flex: 1, marginLeft: 8 }} />
              <Button label="Delete" variant="danger" small onPress={() => onDelete(a)} style={{ flex: 1, marginLeft: 8 }} />
            </View>
          )}
        </View>
      )) : (
        <EmptyState icon="⌕" title="No records in this view" body="Switch tabs or adjust the search to see more of the registry." />
      )}
      </ListStatus>

      <View style={s.footerActions}>
        <Button label="⤓ Export Database CSV" variant="secondary" onPress={exportCsv} style={{ flex: 1 }} />
        <Button label={syncing ? 'Syncing…' : '⟳ Sync Cloud Registry'} onPress={onSync} disabled={syncing} style={{ flex: 1, marginLeft: 10 }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: 30 },
  adminBadge: { backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  adminBadgeText: { color: colors.burgundy, fontWeight: '700', fontSize: 9, letterSpacing: 0.8 },
  headingRow: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 20 },
  heading: { fontFamily: fonts.serif, fontSize: 32, color: colors.burgundy, fontWeight: '700' },
  records: { color: colors.rose, fontWeight: '700', fontSize: 13, marginLeft: 10 },
  desc: { paddingHorizontal: 20, fontSize: 14, color: colors.text, lineHeight: 21, marginTop: 4 },
  add: { margin: 20, marginBottom: 12, padding: 16, borderRadius: radius.lg, backgroundColor: colors.burgundy, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  addIconText: { color: colors.white, fontSize: 24, fontWeight: '700' },
  addTitle: { color: colors.white, fontSize: 17, fontWeight: '700' },
  addBody: { color: '#FBD5D9', fontSize: 12, marginTop: 2 },
  addChevron: { color: colors.white, fontSize: 26, marginLeft: 8 },
  pendingBanner: { marginHorizontal: 20, marginBottom: 14, padding: 14, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: '#F3DFA6', flexDirection: 'row', alignItems: 'center' },
  pendingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  pendingIconText: { color: colors.white, fontWeight: '700', fontSize: 16 },
  pendingTitle: { color: colors.warning, fontWeight: '700', fontSize: 15 },
  pendingBody: { color: colors.text, fontSize: 12, marginTop: 2 },
  pendingChevron: { color: colors.warning, fontSize: 26, marginLeft: 8 },
  roster: { marginHorizontal: 20, marginBottom: 14, backgroundColor: colors.white, borderRadius: radius.lg, padding: 16, ...shadow.card },
  rosterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rosterKicker: { color: colors.rose, fontWeight: '700', fontSize: 11, letterSpacing: 1.4 },
  rosterState: { backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  rosterStateOffline: { backgroundColor: colors.warningSoft },
  rosterStateText: { color: colors.textStrong, fontWeight: '700', fontSize: 11 },
  rosterTitle: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 26, color: colors.burgundy, marginTop: 8 },
  rosterSub: { color: colors.text, fontSize: 13, marginTop: 2 },
  rosterWarn: { color: colors.warning, fontSize: 12, lineHeight: 18, marginTop: 8 },
  search: { height: 50, marginHorizontal: 20, backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line },
  searchIcon: { fontSize: 22, color: colors.rose },
  input: { flex: 1, fontSize: 14, marginLeft: 8, color: colors.textStrong },
  tabs: { paddingHorizontal: 20, paddingVertical: 14 },
  card: { marginHorizontal: 20, marginBottom: 12, padding: 14, borderRadius: radius.lg, backgroundColor: colors.white, ...shadow.card },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 54, height: 68, marginRight: 12 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flex: 1, fontFamily: fonts.serif, fontSize: 19, color: colors.burgundy, fontWeight: '700', marginRight: 8 },
  meta: { color: colors.text, fontSize: 13, marginTop: 4 },
  id: { color: colors.muted, fontSize: 12, marginTop: 3 },
  cardActions: { flexDirection: 'row', marginTop: 12 },
  footerActions: { flexDirection: 'row', margin: 20, marginTop: 10 },
});
