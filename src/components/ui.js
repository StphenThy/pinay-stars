import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, space, statusMeta, touch, type } from '../theme';

/** Fades and lifts its children in on mount. `delay` staggers lists. */
export function Rise({ children, delay = 0, distance = 12, style }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [anim, delay]);
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] });
  return <Animated.View style={[{ opacity: anim, transform: [{ translateY }] }, style]}>{children}</Animated.View>;
}

export function Kicker({ children, style }) {
  return <Text style={[type.kicker, style]}>{children}</Text>;
}

export function SectionHeader({ title, subtitle, action, onAction }) {
  return (
    <View style={s.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={type.h2} accessibilityRole="header">{title}</Text>
        {subtitle ? <Text style={s.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8} style={s.sectionActionHit} accessibilityRole="button">
          <Text style={s.sectionAction}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Chip({ label, active, onPress, count, small }) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, small && s.chipSmall, active && s.chipActive]}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={count !== undefined ? `${label}, ${count}` : label}
    >
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
    gold: { bg: colors.goldSoft, fg: colors.goldText },
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
    <View style={[s.status, { backgroundColor: meta.bg }]} accessibilityLabel={`Status: ${meta.label}`}>
      <View style={[s.statusDot, { backgroundColor: meta.fg }]} />
      <Text style={[s.statusText, { color: meta.fg }]}>{prefix ? `${prefix} ` : ''}{meta.label}</Text>
    </View>
  );
}

export function Avatar({ uri, name, style, imageStyle, rounded = radius.md }) {
  const [failed, setFailed] = useState(false);
  const initials = String(name || '?').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  if (!uri || failed) {
    return (
      <View style={[s.avatarFallback, { borderRadius: rounded }, style]} accessibilityLabel={name ? `Portrait placeholder for ${name}` : undefined}>
        <Text style={s.avatarInitials}>{initials}</Text>
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      onError={() => setFailed(true)}
      accessibilityLabel={name ? `Portrait of ${name}` : undefined}
      style={[{ borderRadius: rounded, backgroundColor: colors.blushDeep }, style, imageStyle]}
    />
  );
}

/**
 * The one card used for empty, loading and error states so every screen's "nothing here"
 * looks the same. `icon` is an Ionicons name.
 */
function StateCard({ icon, iconColor = colors.burgundy, title, body, action, onAction, spinner, tone }) {
  return (
    <Rise style={[s.state, tone === 'error' && s.stateError]}>
      <View style={[s.stateIcon, tone === 'error' && s.stateIconError]}>
        {spinner ? <ActivityIndicator color={colors.burgundy} /> : <Ionicons name={icon} size={26} color={iconColor} />}
      </View>
      <Text style={s.stateTitle} accessibilityRole="header">{title}</Text>
      {body ? <Text style={s.stateBody}>{body}</Text> : null}
      {action ? <Button label={action} onPress={onAction} small style={s.stateButton} /> : null}
    </Rise>
  );
}

export function EmptyState({ icon = 'sparkles-outline', title, body, action, onAction }) {
  return <StateCard icon={icon} title={title} body={body} action={action} onAction={onAction} />;
}

export function LoadingState({ title = 'Loading the registry…', body }) {
  return <StateCard spinner title={title} body={body} />;
}

export function ErrorState({ title = 'Could not reach the registry', message, onRetry }) {
  return <StateCard tone="error" icon="cloud-offline-outline" iconColor={colors.danger} title={title} body={message} action={onRetry ? 'Try again' : undefined} onAction={onRetry} />;
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

export function Button({ label, onPress, variant = 'primary', disabled, style, small, icon, accessibilityLabel }) {
  const variants = {
    primary: [s.btnPrimary, s.btnPrimaryText, colors.white],
    secondary: [s.btnSecondary, s.btnSecondaryText, colors.burgundy],
    ghost: [s.btnGhost, s.btnGhostText, colors.text],
    danger: [s.btnDanger, s.btnDangerText, colors.white],
  };
  const [box, text, iconColor] = variants[variant] || variants.primary;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [s.btn, box, small && s.btnSmall, disabled && s.btnDisabled, pressed && !disabled && s.btnPressed, style]}
    >
      {icon ? <Ionicons name={icon} size={small ? 15 : 18} color={iconColor} style={s.btnIcon} /> : null}
      <Text style={[small ? type.buttonSmall : type.button, text]}>{label}</Text>
    </Pressable>
  );
}

/** Round icon-only button: always a 44pt target and always labelled for screen readers. */
export function IconButton({ icon, onPress, label, size = 20, color = colors.burgundy, style, badge, tone = 'blush' }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge}` : label}
      style={({ pressed }) => [s.iconButton, tone === 'light' && s.iconButtonLight, tone === 'plain' && s.iconButtonPlain, pressed && s.btnPressed, style]}
    >
      <Ionicons name={icon} size={size} color={color} />
      {badge ? <View style={s.iconBadge}><Text style={s.iconBadgeText}>{badge}</Text></View> : null}
    </Pressable>
  );
}

/** Heart toggle that pops when favourited. `light` is for use over photos. */
export function HeartButton({ favorite, onPress, light, name }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.spring(scale, { toValue: favorite ? 0.85 : 1.35, useNativeDriver: true, speed: 40, bounciness: 12 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }),
    ]).start();
    onPress();
  };
  return (
    <Pressable
      onPress={press}
      hitSlop={4}
      accessibilityRole="button"
      accessibilityLabel={favorite ? `Remove ${name || 'this actress'} from favorites` : `Add ${name || 'this actress'} to favorites`}
      accessibilityState={{ selected: !!favorite }}
      style={[s.iconButton, light && s.iconButtonLight]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={favorite ? (light ? colors.onDarkSoft : colors.burgundy) : light ? colors.white : colors.rose} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginHorizontal: space.page, marginBottom: space.md },
  sectionSubtitle: { ...type.small, marginTop: space.xs },
  sectionActionHit: { minHeight: touch.min, justifyContent: 'flex-end', paddingBottom: space.xs },
  sectionAction: { ...type.smallStrong, color: colors.rose },

  chip: { flexDirection: 'row', alignItems: 'center', minHeight: touch.min, backgroundColor: colors.white, borderRadius: radius.pill, paddingVertical: space.sm, paddingHorizontal: space.lg, borderWidth: 1, borderColor: colors.line },
  chipSmall: { minHeight: 36, paddingVertical: space.xs, paddingHorizontal: space.md },
  chipActive: { backgroundColor: colors.burgundy, borderColor: colors.burgundy },
  chipText: { ...type.bodyStrong, color: colors.text },
  chipTextSmall: { ...type.smallStrong, color: colors.text },
  chipTextActive: { color: colors.white },
  chipCount: { ...type.caption, color: colors.rose, marginLeft: space.sm, backgroundColor: colors.blush, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: 2, overflow: 'hidden' },
  chipCountActive: { color: colors.burgundy, backgroundColor: colors.white },

  tag: { borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xs, marginRight: space.xs, marginBottom: space.xs },
  tagText: { ...type.micro, letterSpacing: 0.3 },

  status: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xs },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: space.xs },
  statusText: { ...type.caption },

  avatarFallback: { backgroundColor: colors.burgundySoft, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { ...type.h1, color: colors.white },

  state: { marginHorizontal: space.page, marginVertical: space.lg, padding: space.xxl, alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line },
  stateError: { borderColor: colors.dangerSoft, backgroundColor: '#FFFBFA' },
  stateIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', marginBottom: space.md },
  stateIconError: { backgroundColor: colors.dangerSoft },
  stateTitle: { ...type.h3, textAlign: 'center' },
  stateBody: { ...type.small, textAlign: 'center', marginTop: space.sm, maxWidth: 280 },
  stateButton: { marginTop: space.lg },

  btn: { flexDirection: 'row', minHeight: touch.min + 4, borderRadius: radius.sm, paddingVertical: space.md, paddingHorizontal: space.xl, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { minHeight: 36, paddingVertical: space.sm, paddingHorizontal: space.md },
  btnIcon: { marginRight: space.sm },
  btnPressed: { opacity: 0.85 },
  btnDisabled: { opacity: 0.5 },
  btnPrimary: { backgroundColor: colors.burgundy },
  btnPrimaryText: { color: colors.white },
  btnSecondary: { backgroundColor: colors.blushDeep },
  btnSecondaryText: { color: colors.burgundy },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.line },
  btnGhostText: { color: colors.text },
  btnDanger: { backgroundColor: colors.danger },
  btnDangerText: { color: colors.white },

  iconButton: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center' },
  iconButtonLight: { backgroundColor: 'rgba(255,255,255,0.22)' },
  iconButtonPlain: { backgroundColor: 'transparent' },
  iconBadge: { position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.xs, borderWidth: 2, borderColor: colors.background },
  iconBadgeText: { ...type.micro, color: colors.white },
});
