import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fonts, radius, gradients, space } from '../theme';

function RoleCard({ icon, title, body, bullets, cta, onPress, primary, delay }) {
  const rise = useRef(new Animated.Value(30)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 500, delay, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise, delay]);
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }, { scale }] }}>
      <Pressable
        onPress={onPress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={[s.card, primary && s.cardPrimary]}
      >
        <View style={[s.iconWrap, primary && s.iconWrapPrimary]}><Ionicons name={icon} size={24} color={primary ? colors.burgundy : colors.white} /></View>
        <Text style={[s.cardTitle, primary && s.cardTitlePrimary]}>{title}</Text>
        <Text style={[s.cardBody, primary && s.cardBodyPrimary]}>{body}</Text>
        <View style={s.bullets}>
          {bullets.map(b => (
            <Text key={b} style={[s.bullet, primary && s.bulletPrimary]}>{b}</Text>
          ))}
        </View>
        <View style={[s.cta, primary && s.ctaPrimary]}>
          <Text style={[s.ctaText, primary && s.ctaTextPrimary]}>{cta}</Text><Ionicons name="arrow-forward" size={16} color={primary ? colors.burgundy : colors.white} style={{ marginLeft: 6 }} />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function EntryScreen({ onSignIn, onRegister, onGuest }) {
  return (
    <LinearGradient colors={gradients.hero.colors} locations={gradients.hero.locations} style={s.page}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.head}>
        <Text style={s.kicker}>CHOOSE HOW TO ENTER</Text>
        <Text style={s.title}>Welcome to the Archive</Text>
        <Text style={s.sub}>Create a free account to keep your favorites, or browse as a guest.</Text>
      </View>

      <RoleCard
        icon="sparkles-outline"
        title="Sign In or Join"
        body="Members and administrators."
        bullets={['Favorites synced across devices', 'Track the actresses you suggest', 'Admins: curate the registry']}
        cta="Sign in"
        onPress={onSignIn}
        primary
        delay={150}
      />
      <RoleCard
        icon="person-outline"
        title="Continue as Guest"
        body="Open access, no account needed."
        bullets={['Browse & search every profile', 'Favorites stay on this device', 'Suggest an actress anonymously']}
        cta="Enter the directory"
        onPress={onGuest}
        delay={300}
      />

      <Pressable onPress={onRegister} style={({ pressed }) => [s.registerButton, pressed && { opacity: 0.85 }]}>
        <Text style={s.registerIcon}>＋</Text>
        <View style={{ flex: 1 }}>
          <Text style={s.registerTitle}>Create a Free Account</Text>
          <Text style={s.registerBody}>New here? Join in under a minute.</Text>
        </View>
        <Ionicons name="arrow-forward" size={22} color={colors.burgundyDeep} style={{ marginLeft: space.sm }} />
      </Pressable>

      <Text style={s.footer}>© PINAY STARS • EST. 2026</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  page: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  head: { alignItems: 'center', marginBottom: 20 },
  kicker: { color: colors.onDarkSoft, fontSize: 11, fontWeight: '700', letterSpacing: 1.8 },
  title: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 36, color: colors.onDarkSoft, marginTop: 12, textAlign: 'center' },
  sub: { color: colors.onDarkSoft, fontSize: 13, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  card: { backgroundColor: colors.onDarkFill, borderRadius: radius.xl, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: colors.onDarkFill },
  cardPrimary: { backgroundColor: colors.onDarkSoft, borderColor: colors.onDarkSoft },
  iconWrap: { width: 48, height: 48, borderRadius: radius.xl, backgroundColor: colors.onDarkFill, alignItems: 'center', justifyContent: 'center' },
  iconWrapPrimary: { backgroundColor: colors.burgundy },
  icon: { fontSize: 22 },
  cardTitle: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 22, color: colors.onDarkSoft, marginTop: 12 },
  cardTitlePrimary: { color: colors.burgundy },
  cardBody: { color: colors.onDarkSoft, fontSize: 13, marginTop: 4 },
  cardBodyPrimary: { color: colors.text },
  bullets: { marginTop: 12 },
  bullet: { color: colors.onDarkSoft, fontSize: 13, lineHeight: 22 },
  bulletPrimary: { color: colors.textStrong },
  cta: { alignSelf: 'flex-start', marginTop: 12, borderRadius: radius.pill, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.onDarkFill },
  ctaPrimary: { backgroundColor: colors.burgundy },
  ctaText: { color: colors.onDarkSoft, fontWeight: '700', fontSize: 13 },
  ctaTextPrimary: { color: colors.white },
  registerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.gold, borderRadius: radius.xl, paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8 },
  registerIcon: { color: colors.burgundyDeep, fontSize: 28, fontWeight: '700', marginRight: 12 },
  registerTitle: { color: colors.burgundyDeep, fontFamily: fonts.serif, fontWeight: '700', fontSize: 18 },
  registerBody: { color: colors.goldText, fontSize: 12, marginTop: 2 },
  registerArrow: { color: colors.burgundyDeep, fontSize: 22, fontWeight: '700', marginLeft: 12 },
  footer: { color: colors.onDarkMuted, fontSize: 11, letterSpacing: 1.6, textAlign: 'center', marginTop: 'auto', paddingTop: 16 },
});
