import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, gradients, radius, space, touch, type } from '../theme';

function RoleCard({ icon, title, body, bullets, cta, onPress, primary, delay }) {
  const rise = useRef(new Animated.Value(24)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise, delay]);

  // One palette per card: the primary card is light on the burgundy page, the guest card is
  // a translucent panel. Every text and icon colour below is chosen against that surface.
  const fg = primary ? colors.burgundy : colors.white;
  const body_ = primary ? colors.text : colors.onDarkSoft;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }, { scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={[s.card, primary && s.cardPrimary]}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body} ${cta}`}
      >
        <View style={s.cardHead}>
          <View style={[s.iconWrap, primary && s.iconWrapPrimary]}>
            <Ionicons name={icon} size={22} color={primary ? colors.white : colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.cardTitle, { color: fg }]}>{title}</Text>
            <Text style={[s.cardBody, { color: body_ }]}>{body}</Text>
          </View>
        </View>

        <View style={s.bullets}>
          {bullets.map(b => (
            <View key={b} style={s.bulletRow}>
              <Ionicons name="checkmark-circle" size={16} color={primary ? colors.burgundySoft : colors.onDarkSoft} />
              <Text style={[s.bullet, { color: primary ? colors.textStrong : colors.onDark }]}>{b}</Text>
            </View>
          ))}
        </View>

        <View style={[s.cta, primary ? s.ctaPrimary : s.ctaGuest]}>
          <Text style={[type.button, { color: primary ? colors.white : colors.white }]}>{cta}</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} style={s.ctaIcon} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function EntryScreen({ onSignIn, onRegister, onGuest }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Wide phones and tablets get a centred column instead of edge-to-edge cards.
  const columnWidth = Math.min(width, 520);

  return (
    <LinearGradient colors={gradients.hero.colors} locations={gradients.hero.locations} style={s.page}>
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.column, { width: columnWidth }]}>
          <View style={s.head}>
            <Text style={s.kicker}>Choose how to enter</Text>
            <Text style={s.title} accessibilityRole="header">Welcome to the Archive</Text>
            <Text style={s.sub}>Create a free account to keep your favorites, or browse as a guest.</Text>
          </View>

          <RoleCard
            icon="log-in-outline"
            title="Sign In or Join"
            body="Members and administrators."
            bullets={['Favorites synced across devices', 'Track the actresses you suggest', 'Admins: curate the registry']}
            cta="Sign in"
            onPress={onSignIn}
            primary
            delay={120}
          />
          <RoleCard
            icon="person-outline"
            title="Continue as Guest"
            body="Open access, no account needed."
            bullets={['Browse & search every profile', 'Favorites stay on this device', 'Suggest an actress anonymously']}
            cta="Enter the directory"
            onPress={onGuest}
            delay={240}
          />

          <Pressable
            onPress={onRegister}
            style={({ pressed }) => [s.registerButton, pressed && { opacity: 0.9 }]}
            accessibilityRole="button"
            accessibilityLabel="Create a free account. New here? Join in under a minute"
          >
            <View style={s.registerIcon}><Ionicons name="person-add" size={20} color={colors.burgundyDeep} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.registerTitle}>Create a Free Account</Text>
              <Text style={s.registerBody}>New here? Join in under a minute.</Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color={colors.burgundyDeep} />
          </Pressable>

          <Text style={s.footer}>© Pinay Stars · Est. 2026</Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: space.page },
  column: { flexGrow: 1 },
  head: { alignItems: 'center', marginBottom: space.xxl, paddingHorizontal: space.sm },
  kicker: { ...type.kicker, color: colors.onDarkSoft, letterSpacing: 1.8 },
  title: { ...type.display, fontSize: 32, lineHeight: 38, color: colors.white, marginTop: space.md, textAlign: 'center' },
  sub: { ...type.body, color: colors.onDarkSoft, marginTop: space.sm, textAlign: 'center', maxWidth: 320 },

  card: { backgroundColor: colors.onDarkFill, borderRadius: radius.xl, padding: space.xl, marginBottom: space.lg, borderWidth: 1, borderColor: colors.onDarkFill },
  cardPrimary: { backgroundColor: colors.white, borderColor: colors.white },
  cardHead: { flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: touch.min, height: touch.min, borderRadius: touch.min / 2, backgroundColor: colors.onDarkFillStrong, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  iconWrapPrimary: { backgroundColor: colors.burgundy },
  cardTitle: { ...type.h2 },
  cardBody: { ...type.small, marginTop: 2 },
  bullets: { marginTop: space.lg },
  bulletRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.sm },
  bullet: { ...type.small, marginLeft: space.sm, flex: 1 },

  // Full-width so the two cards' buttons line up; 48pt tall so it is an easy target.
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', minHeight: touch.min + 4, marginTop: space.md, borderRadius: radius.sm, paddingHorizontal: space.lg },
  ctaPrimary: { backgroundColor: colors.burgundy },
  ctaGuest: { backgroundColor: colors.onDarkFillStrong, borderWidth: 1, borderColor: colors.onDarkLine },
  ctaIcon: { marginLeft: space.sm },

  registerButton: { flexDirection: 'row', alignItems: 'center', minHeight: 64, backgroundColor: colors.gold, borderRadius: radius.lg, paddingVertical: space.md, paddingHorizontal: space.lg, marginBottom: space.sm },
  registerIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(74,0,21,0.12)', alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  registerTitle: { ...type.h3, color: colors.burgundyDeep },
  registerBody: { ...type.caption, color: colors.goldText, marginTop: 2 },
  footer: { ...type.caption, color: colors.onDarkMuted, letterSpacing: 1, textAlign: 'center', marginTop: 'auto', paddingTop: space.xl },
});
