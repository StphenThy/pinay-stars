import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, fonts } from '../theme';
import { Avatar, Button } from './ui';

export default function DeleteDialog({ actress, busy, onConfirm, onCancel }) {
  if (!actress) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={busy ? undefined : onCancel}>
        <Pressable style={s.card} onPress={() => {}}>
          <View style={s.iconWrap}><Text style={s.icon}>🗑</Text></View>
          <Text style={s.title}>Delete Actress?</Text>
          <Text style={s.body}>
            Are you sure you want to permanently remove{' '}
            <Text style={s.strong}>{actress.stageName}</Text> from the Pinay Stars database?
            This will delete all filmography, awards records, and archive photos.
          </Text>

          <View style={s.summary}>
            <Avatar uri={actress.image} name={actress.stageName} style={s.avatar} rounded={radius.sm} />
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{actress.stageName}</Text>
              <Text style={s.meta}>
                {actress.films.length} Feature Film{actress.films.length === 1 ? '' : 's'}  •  {actress.awards.length} Award{actress.awards.length === 1 ? '' : 's'}
              </Text>
              <Text style={s.id}>#{actress.displayId}</Text>
            </View>
          </View>

          <Button label={busy ? 'Deleting…' : 'Yes, Delete Actress'} variant="danger" onPress={onConfirm} disabled={busy} />
          <Button label="Cancel, Keep Record" variant="ghost" onPress={onCancel} disabled={busy} style={{ marginTop: 10 }} />
          <Text style={s.footnote}>This action cannot be undone by regular editors.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46, 0, 14, 0.55)', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: 24 },
  iconWrap: { alignSelf: 'center', width: 60, height: 60, borderRadius: 30, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  icon: { fontSize: 26 },
  title: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 26, color: colors.burgundy, textAlign: 'center', marginTop: 14 },
  body: { color: colors.text, textAlign: 'center', lineHeight: 22, fontSize: 15, marginTop: 10 },
  strong: { fontWeight: '700', color: colors.textStrong },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blush, borderRadius: radius.md, padding: 12, marginVertical: 18 },
  avatar: { width: 56, height: 70, marginRight: 12 },
  name: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 18, color: colors.burgundy },
  meta: { color: colors.text, fontSize: 13, marginTop: 3 },
  id: { color: colors.rose, fontWeight: '700', fontSize: 12, marginTop: 4 },
  footnote: { color: colors.muted, fontSize: 12, textAlign: 'center', marginTop: 14 },
});
