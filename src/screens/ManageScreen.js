import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppHeader from '../components/AppHeader';
import { Avatar, Button, Chip, EmptyState, ListStatus, StatusPill } from '../components/ui';
import { colors, radius, shadow, space, touch, type, fonts } from '../theme';
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
        right={<View style={s.adminBadge} accessible accessibilityLabel="Admin mode, full access"><Ionicons name="shield-checkmark" size={12} color={colors.burgundy} /><Text style={s.adminBadgeText}>ADMIN</Text></View>}
      />

      <View style={s.headingRow}>
        <Text style={s.heading} accessibilityRole="header">Manage Actresses</Text>
        <Text style={s.records}>{actresses.length} records</Text>
      </View>
      <Text style={s.desc}>Editorial roster verification, metadata curation, and cast availability.</Text>

      <Pressable onPress={onAdd} style={({ pressed }) => [s.add, pressed && { opacity: 0.9 }]} accessibilityRole="button" accessibilityLabel="Add new actress">
        <View style={s.addIcon}><Ionicons name="add" size={26} color={colors.white} /></View>
        <View style={{ flex: 1 }}>
          <Text style={s.addTitle}>Add New Actress</Text>
          <Text style={s.addBody}>Draft profile, headshots & representation data</Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color={colors.white} style={s.chevron} />
      </Pressable>

      {pending ? (
        <Pressable onPress={() => setTab('review')} style={s.pendingBanner} accessibilityRole="button" accessibilityLabel={`${pending} submissions awaiting review. Show them`}>
          <View style={s.pendingIcon}><Text style={s.pendingIconText}>{pending}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.pendingTitle}>{pending} submission{pending === 1 ? '' : 's'} awaiting review</Text>
            <Text style={s.pendingBody}>Suggested by visitors. Approve to publish or reject to remove.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={colors.warning} style={s.chevron} />
        </Pressable>
      ) : null}

      <View style={s.roster}>
        <View style={s.rosterHead}>
          <Text style={s.rosterKicker}>Roster status</Text>
          <View style={[s.rosterState, source === 'offline' && s.rosterStateOffline]}>
            <Ionicons name={source === 'offline' ? 'cloud-offline-outline' : 'cloud-done-outline'} size={13} color={source === 'offline' ? colors.warning : colors.success} style={{ marginRight: 4 }} />
            <Text style={s.rosterStateText}>{source === 'offline' ? 'Offline Archive' : 'Cloud Synced'}</Text>
          </View>
        </View>
        <Text style={s.rosterTitle}>{actresses.length} Actresses</Text>
        <Text style={s.rosterSub}>Live Talent Directory • {syncing ? 'Syncing…' : sinceLabel(lastSync)}</Text>
        {source === 'offline' ? (
          <Text style={s.rosterWarn}>The registry could not be reached. You are viewing the bundled archive; edits will not save until the connection returns.</Text>
        ) : null}
      </View>

      <View style={s.search}>
        <Ionicons name="search-outline" size={18} color={colors.rose} />
        <TextInput
          accessibilityLabel="Filter records by name or genre"
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
        <EmptyState icon="search-outline" title="No records in this view" body="Switch tabs or adjust the search to see more of the registry." />
      )}
      </ListStatus>

      <View style={s.footerActions}>
        <Button label="Export CSV" icon="download-outline" variant="secondary" onPress={exportCsv} style={{ flex: 1 }} accessibilityLabel="Export database as CSV" />
        <Button label={syncing ? 'Syncing…' : 'Sync Registry'} icon="sync-outline" onPress={onSync} disabled={syncing} style={{ flex: 1, marginLeft: space.sm }} />
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: space.xxxl },
  adminBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: 36 },
  adminBadgeText: { ...type.kicker, marginLeft: space.xs },
  headingRow: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: space.page },
  heading: { ...type.h1 },
  records: { ...type.smallStrong, color: colors.rose, marginLeft: space.md },
  desc: { ...type.small, paddingHorizontal: space.page, marginTop: space.xs },
  add: { margin: space.page, marginBottom: space.md, padding: space.lg, borderRadius: radius.lg, backgroundColor: colors.burgundy, flexDirection: 'row', alignItems: 'center' },
  addIcon: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, backgroundColor: colors.onDarkFillStrong, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  addTitle: { ...type.title, color: colors.white },
  addBody: { ...type.caption, color: colors.onDarkSoft, marginTop: 2 },
  chevron: { marginLeft: space.sm },
  pendingBanner: { marginHorizontal: space.page, marginBottom: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningLine, flexDirection: 'row', alignItems: 'center' },
  pendingIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.warning, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  pendingIconText: { ...type.title, color: colors.white },
  pendingTitle: { ...type.bodyStrong, color: colors.warning },
  pendingBody: { ...type.caption, fontFamily: fonts.sans, marginTop: 2 },
  roster: { marginHorizontal: space.page, marginBottom: space.md, backgroundColor: colors.white, borderRadius: radius.lg, padding: space.lg, ...shadow.card },
  rosterHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rosterKicker: { ...type.kicker },
  rosterState: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successSoft, borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.xs },
  rosterStateOffline: { backgroundColor: colors.warningSoft },
  rosterStateText: { ...type.caption, color: colors.textStrong },
  rosterTitle: { ...type.h1, marginTop: space.sm },
  rosterSub: { ...type.small, marginTop: 2 },
  rosterWarn: { ...type.caption, fontFamily: fonts.sans, color: colors.warning, lineHeight: 18, marginTop: space.sm },
  search: { height: 52, marginHorizontal: space.page, backgroundColor: colors.white, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.md, borderWidth: 1, borderColor: colors.line },
  input: { ...type.small, color: colors.textStrong, flex: 1, marginLeft: space.sm, minHeight: touch.min },
  tabs: { paddingHorizontal: space.page, paddingVertical: space.md },
  card: { marginHorizontal: space.page, marginBottom: space.md, padding: space.md, borderRadius: radius.lg, backgroundColor: colors.white, ...shadow.card },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 54, height: 68, marginRight: space.md },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { ...type.h3, flex: 1, marginRight: space.sm },
  meta: { ...type.small, marginTop: space.xs },
  id: { ...type.caption, fontFamily: fonts.sans, marginTop: space.xs },
  cardActions: { flexDirection: 'row', marginTop: space.md },
  footerActions: { flexDirection: 'row', margin: space.page, marginTop: space.md },
});
