import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Chip, Kicker } from '../components/ui';
import { colors, radius, statusMeta, fonts } from '../theme';
import { DEFAULT_FILTERS, ERAS, GENRES, SORTS, STATUSES, applyFilters } from '../data/actressModel';

function Radio({ label, tag, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[s.radio, active && s.radioActive]}>
      <View style={[s.radioDot, active && s.radioDotActive]}>{active ? <View style={s.radioInner} /> : null}</View>
      <Text style={[s.radioLabel, active && s.radioLabelActive]}>{label}</Text>
      {tag ? <Text style={[s.radioTag, active && s.radioTagActive]}>{tag}</Text> : null}
    </Pressable>
  );
}

export default function FiltersScreen({ visible, actresses, filters, query, onApply, onClose }) {
  const [draft, setDraft] = useState(filters);

  const genreCounts = useMemo(() => {
    const counts = {};
    GENRES.forEach(g => { counts[g] = 0; });
    actresses.forEach(a => a.genres.forEach(g => { counts[g] = (counts[g] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [actresses]);

  const statusCounts = useMemo(() => {
    const counts = {};
    actresses.forEach(a => { counts[a.status] = (counts[a.status] || 0) + 1; });
    return counts;
  }, [actresses]);

  const matching = useMemo(() => applyFilters(actresses, draft, query).length, [actresses, draft, query]);

  const toggleGenre = g => setDraft(d => ({
    ...d,
    genres: d.genres.includes(g) ? d.genres.filter(x => x !== g) : [...d.genres, g],
  }));

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => setDraft(filters)}>
      <View style={s.page}>
        <View style={s.header}>
          <Pressable onPress={onClose} hitSlop={10}><Text style={s.headerLink}>Close</Text></Pressable>
          <Text style={s.headerTitle}>Filters & Refinements</Text>
          <Pressable onPress={() => setDraft({ ...DEFAULT_FILTERS, sort: draft.sort })} hitSlop={10}>
            <Text style={s.headerLink}>Clear All</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Primary Genre</Text>
            <Kicker>MULTI-SELECT</Kicker>
          </View>
          <View style={s.wrap}>
            {genreCounts.map(([g, n]) => (
              <View key={g} style={s.chipWrap}>
                <Chip label={g} count={n} active={draft.genres.includes(g)} onPress={() => toggleGenre(g)} small />
              </View>
            ))}
          </View>

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Years Active & Era</Text>
            <Kicker>SINGLE CHOICE</Kicker>
          </View>
          {ERAS.map(e => (
            <Radio key={e.key} label={e.label} tag={e.tag} active={draft.era === e.key} onPress={() => setDraft(d => ({ ...d, era: e.key }))} />
          ))}

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Current Representation & Status</Text>
            <Kicker>SINGLE CHOICE</Kicker>
          </View>
          <View style={s.wrap}>
            <View style={s.chipWrap}>
              <Chip label="All" active={draft.status === 'all'} onPress={() => setDraft(d => ({ ...d, status: 'all' }))} small />
            </View>
            {STATUSES.map(st => (
              <View key={st.key} style={s.chipWrap}>
                <Chip label={st.label} count={statusCounts[st.key] || 0} active={draft.status === st.key} onPress={() => setDraft(d => ({ ...d, status: st.key }))} small />
              </View>
            ))}
          </View>

          <View style={s.sectionHead}>
            <Text style={s.sectionTitle}>Sort Talent By</Text>
            <Pressable onPress={() => setDraft(d => ({ ...d, sort: DEFAULT_FILTERS.sort }))} hitSlop={8}>
              <Text style={s.resetLink}>Reset to Default</Text>
            </Pressable>
          </View>
          {SORTS.map(so => (
            <Radio key={so.key} label={so.label} active={draft.sort === so.key} onPress={() => setDraft(d => ({ ...d, sort: so.key }))} />
          ))}

          <View style={s.curators}>
            <Kicker style={{ color: colors.gold }}>FEATURED CURATORS</Kicker>
            <Text style={s.curatorsTitle}>Selected by Manunuri ng Pelikulang Pilipino</Text>
            <Text style={s.curatorsBody}>Includes Gawad Urian & FAP honorees across every era.</Text>
          </View>
        </ScrollView>

        <View style={s.footer}>
          <Text style={s.footerCount}>
            Showing {matching} Actress{matching === 1 ? '' : 'es'} Matching Filters
          </Text>
          <Button label={`Apply Filters (${matching} Result${matching === 1 ? '' : 's'})`} onPress={() => onApply(draft)} />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12, backgroundColor: colors.white, borderBottomWidth: 1, borderColor: colors.line },
  headerLink: { color: colors.rose, fontWeight: '700', fontSize: 13 },
  headerTitle: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 18, color: colors.burgundy },
  body: { padding: 20, paddingBottom: 40 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 18, color: colors.burgundy },
  wrap: { flexDirection: 'row', flexWrap: 'wrap' },
  chipWrap: { marginRight: 8, marginBottom: 8 },
  radio: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.line },
  radioActive: { borderColor: colors.burgundy, backgroundColor: colors.blush },
  radioDot: { width: 20, height: 20, borderRadius: radius.sm, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioDotActive: { borderColor: colors.burgundy },
  radioInner: { width: 10, height: 10, borderRadius: radius.xs, backgroundColor: colors.burgundy },
  radioLabel: { flex: 1, color: colors.textStrong, fontSize: 13, fontWeight: '600' },
  radioLabelActive: { color: colors.burgundy },
  radioTag: { color: colors.rose, fontWeight: '700', fontSize: 11, backgroundColor: colors.blushDeep, borderRadius: radius.pill, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
  radioTagActive: { backgroundColor: colors.white },
  resetLink: { color: colors.rose, fontWeight: '700', fontSize: 13, textDecorationLine: 'underline' },
  curators: { marginTop: 24, backgroundColor: colors.burgundy, borderRadius: radius.lg, padding: 16 },
  curatorsTitle: { color: colors.white, fontWeight: '700', fontSize: 15, marginTop: 8 },
  curatorsBody: { color: colors.onDarkSoft, fontSize: 13, marginTop: 4 },
  footer: { padding: 20, paddingBottom: 24, backgroundColor: colors.white, borderTopWidth: 1, borderColor: colors.line },
  footerCount: { textAlign: 'center', color: colors.text, fontSize: 13, marginBottom: 12 },
});
