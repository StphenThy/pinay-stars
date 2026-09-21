import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, statusMeta, fonts } from '../theme';

export function Kicker({ children, style }) {
  return <Text style={[s.kicker, style]}>{children}</Text>;
}

export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={s.sectionTitle}>{title}</Text>
        {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={s.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress, count, small }) {
  return (
    <Pressable onPress={onPress} style={[s.chip, small && s.chipSmall, active && s.chipActive]}>
      <Text style={[s.chipText, small && s.chipTextSmall, active && s.chipTextActive]}>{label}</Text>
      {count !== undefined ? (
        <Text style={[s.chipCount, active && s.chipCountActive]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

export function Tag({ label, tone = 'blush' }) {
  const tones = {
    blush: { bg: colors.blush, fg: colors.burgundy },
    gold: { bg: '#FFF3D1', fg: '#7A5200' },
    dark: { bg: colors.burgundy, fg: colors.white },
  };
  const t = tones[tone] || tones.blush;
  return (
    <View style={[s.tag, { backgroundColor: t.bg }]}>
      <Text style={[s.tagText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

export function StatusPill({ status, prefix }) {
  const meta = statusMeta[status] || statusMeta.active;
  return (
    <View style={[s.status, { backgroundColor: meta.bg }]}>
      <Text style={[s.statusText, { color: meta.fg }]}>● {prefix ? `${prefix} ` : ''}{meta.label}</Text>
    </View>
  );
}

export function Avatar({ uri, name, style, imageStyle, rounded = radius.md }) {
  const [failed, setFailed] = useState(false);
  const initials = String(name || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  if (!uri || failed) {
    return (
      <View style={[s.avatarFallback, { borderRadius: rounded }, style]}>
        <Text style={s.avatarInitials}>{initials}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      style={[{ borderRadius: rounded, backgroundColor: '#EFDCDC' }, style, imageStyle]}
    />
  );
}

export function EmptyState({ icon = '✦', title, body, action, onAction }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {body ? <Text style={s.emptyBody}>{body}</Text> : null}
      {action ? (
        <Pressable onPress={onAction} style={s.emptyButton}>
          <Text style={s.emptyButtonText}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function LoadingState({ title = 'Loading the registry…', body }) {
  return (
    <View style={s.empty}>
      <ActivityIndicator color={colors.burgundy} size="large" />
      <Text style={[s.emptyTitle, { marginTop: 16 }]}>{title}</Text>
      {body ? <Text style={s.emptyBody}>{body}</Text> : null}
    </View>
  );
}

export function ErrorState({ title = 'Could not reach the registry', message, onRetry }) {
  return (
    <View style={[s.empty, s.emptyError]}>
      <Text style={[s.emptyIcon, { color: colors.danger }]}>!</Text>
      <Text style={s.emptyTitle}>{title}</Text>
      {message ? <Text style={s.emptyBody}>{message}</Text> : null}
      {onRetry ? (
        <Pressable onPress={onRetry} style={s.emptyButton}>
          <Text style={s.emptyButtonText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Shared loading / error gate for list screens. While the first load is in flight, or when it
 * failed and nothing is cached, it shows the matching state; otherwise it renders the children.
 */
export function ListStatus({ loading, error, onRetry, hasItems, children }) {
  if (!hasItems && loading) return <LoadingState />;
  if (!hasItems && error) return <ErrorState message={error} onRetry={onRetry} />;
  return children;
}

export function Button({ label, onPress, variant = 'primary', disabled, style, small }) {
  const variants = {
    primary: [s.btnPrimary, s.btnPrimaryText],
    secondary: [s.btnSecondary, s.btnSecondaryText],
    ghost: [s.btnGhost, s.btnGhostText],
    danger: [s.btnDanger, s.btnDangerText],
  };
  const [box, text] = variants[variant] || variants.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [s.btn, box, small && s.btnSmall, disabled && s.btnDisabled, pressed && !disabled && s.btnPressed, style]}
    >
      <Text style={[s.btnText, text, small && s.btnTextSmall]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  kicker: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, color: colors.rose },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 24, color: colors.burgundy },
  sectionSubtitle: { color: colors.text, fontSize: 13, marginTop: 3, lineHeight: 18 },
  sectionAction: { color: colors.rose, fontWeight: '700', fontSize: 14, paddingBottom: 2 },

  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.line },
  chipSmall: { paddingVertical: 7, paddingHorizontal: 12 },
  chipActive: { backgroundColor: colors.burgundy, borderColor: colors.burgundy },
  chipText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  chipTextSmall: { fontSize: 13 },
  chipTextActive: { color: colors.white },
  chipCount: { marginLeft: 8, fontSize: 12, fontWeight: '700', color: colors.rose, backgroundColor: colors.blush, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 2, overflow: 'hidden' },
  chipCountActive: { color: colors.burgundy, backgroundColor: colors.white },

  tag: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, marginRight: 6, marginBottom: 6 },
  tagText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },

  status: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },

  avatarFallback: { backgroundColor: colors.burgundySoft, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: fonts.serif, fontWeight: '700', color: colors.white, fontSize: 26 },

  empty: { margin: 20, padding: 32, alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line },
  emptyIcon: { fontSize: 44, color: colors.burgundy },
  emptyError: { borderColor: colors.dangerSoft },
  emptyTitle: { fontFamily: fonts.serif, fontWeight: '700', color: colors.burgundy, fontSize: 24, marginTop: 8, textAlign: 'center' },
  emptyBody: { color: colors.text, textAlign: 'center', fontSize: 15, lineHeight: 22, marginTop: 8 },
  emptyButton: { marginTop: 18, backgroundColor: colors.burgundy, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 22 },
  emptyButtonText: { color: colors.white, fontWeight: '700' },

  btn: { borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 14, borderRadius: radius.sm },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontWeight: '700', fontSize: 16 },
  btnTextSmall: { fontSize: 13 },
  btnPrimary: { backgroundColor: colors.burgundy },
  btnPrimaryText: { color: colors.white },
  btnSecondary: { backgroundColor: colors.blushDeep },
  btnSecondaryText: { color: colors.burgundy },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.text },
  btnDanger: { backgroundColor: colors.danger },
  btnDangerText: { color: colors.white },
});
