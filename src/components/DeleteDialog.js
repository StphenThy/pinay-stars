import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, type } from '../theme';
import { Avatar, Button } from './ui';

export default function DeleteDialog({ actress, busy, onConfirm, onCancel }) {
  if (!actress) return null;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onCancel}>
      <Pressable style={s.backdrop} onPress={busy ? undefined : onCancel}>
        <Pressable style={s.card} onPress={() => {}}>
          <View style={s.iconWrap}><Ionicons name="trash-outline" size={26} color={colors.danger} /></View>
          <Text style={s.title} accessibilityRole="header">Delete Actress?</Text>
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
          <Button label="Cancel, Keep Record" variant="ghost" onPress={onCancel} disabled={busy} style={{ marginTop: space.sm }} />
          <Text style={s.footnote}>This action cannot be undone by regular editors.</Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(46, 0, 14, 0.55)', justifyContent: 'center', padding: space.xxl },
  card: { backgroundColor: colors.white, borderRadius: radius.xl, padding: space.xxl },
  iconWrap: { alignSelf: 'center', width: 56, height: 56, borderRadius: 28, backgroundColor: colors.dangerSoft, alignItems: 'center', justifyContent: 'center' },
  title: { ...type.h1, textAlign: 'center', marginTop: space.md },
  body: { ...type.body, textAlign: 'center', marginTop: space.sm },
  strong: { fontWeight: '700', color: colors.textStrong },
  summary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blush, borderRadius: radius.md, padding: space.md, marginVertical: space.lg },
  avatar: { width: 56, height: 70, marginRight: space.md },
  name: { ...type.h3 },
  meta: { ...type.small, marginTop: 2 },
  id: { ...type.caption, color: colors.rose, marginTop: space.xs },
  footnote: { ...type.caption, fontWeight: '400', textAlign: 'center', marginTop: space.md },
});
