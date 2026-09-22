import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../theme';
import { useTheme, useThemedStyles } from '../theme-context';
import { Avatar } from '../components/ui';

const FACE = 64;
const FACE_GAP = 14;

function useCountUp(target, go, duration = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!go) return undefined;
    const start = Date.now();
    const tick = setInterval(() => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t >= 1) clearInterval(tick);
    }, 30);
    return () => clearInterval(tick);
  }, [target, go, duration]);
  return value;
}

function Stat({ value, label }) {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

export default function IntroScreen({ ready, source, actresses = [], onStart }) {
  const { colors, gradients } = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(24)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const marquee = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  const faces = useMemo(() => actresses.filter(a => a.image).slice(0, 12), [actresses]);
  const stripWidth = faces.length * (FACE + FACE_GAP);

  const stars = useCountUp(actresses.length, ready);
  const genres = useCountUp(new Set(actresses.flatMap(a => a.genres)).size, ready);
  const honors = useCountUp(actresses.reduce((n, a) => n + a.awards.length, 0), ready);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(fade, { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 700, delay: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    const spinLoop = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true }));
    spinLoop.start();
    return () => spinLoop.stop();
  }, [fade, rise, logoScale, spin]);

  useEffect(() => {
    if (!stripWidth) return undefined;
    marquee.setValue(0);
    const loop = Animated.loop(Animated.timing(marquee, { toValue: -stripWidth, duration: faces.length * 2600, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [marquee, stripWidth, faces.length]);

  useEffect(() => {
    if (ready) return undefined;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [ready, pulse]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const entrance = { opacity: fade, transform: [{ translateY: rise }] };

  return (
    <LinearGradient colors={gradients.hero.colors} locations={gradients.hero.locations} style={[s.page, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={s.archive}>
        <Text style={s.archiveText}>NATIONAL ARCHIVE • CASTING DOSSIER</Text>
      </View>

      <View style={s.center}>
        <Animated.View style={[s.logo, { transform: [{ scale: logoScale }] }]}>
          <Image source={require('../../assets/logo.png')} style={s.logoImage} resizeMode="contain" />
          <Animated.View style={[s.logoSpark, { transform: [{ rotate }] }]}><Ionicons name="sparkles" size={18} color={colors.gold} /></Animated.View>
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center' }, entrance]}>
          <Text style={s.brand}>Pinay Stars</Text>
          <Text style={s.tagline}>Celebrating Filipina Talent</Text>
          <View style={s.box}>
            <Text style={s.boxText}>THE DEFINITIVE PHILIPPINE{'\n'}ENTERTAINMENT & TALENT DATABASE</Text>
          </View>
        </Animated.View>

        <Animated.View style={[s.stats, entrance]}>
          <Stat value={stars} label="Stars" />
          <View style={s.statDivider} />
          <Stat value={genres} label="Genres" />
          <View style={s.statDivider} />
          <Stat value={honors} label="Honors" />
        </Animated.View>
      </View>

      {faces.length ? (
        <Animated.View style={[s.stripWrap, { opacity: fade }]}>
          <Text style={s.stripLabel}>NOW IN THE ARCHIVE — TAP A STAR</Text>
          <View style={{ width, overflow: 'hidden', marginLeft: -28 }}>
            <Animated.View style={[s.strip, { width: stripWidth * 2, transform: [{ translateX: marquee }] }]}>
              {[...faces, ...faces].map((a, i) => (
                <Pressable key={`${a.id}-${i}`} onPress={() => ready && onStart(a)} style={s.face}>
                  <Avatar uri={a.image} name={a.stageName} style={s.faceImage} rounded={FACE / 2} />
                </Pressable>
              ))}
            </Animated.View>
          </View>
        </Animated.View>
      ) : null}

      <View style={s.statusRow}>
        {ready ? <View style={s.readyDot} /> : <ActivityIndicator color={colors.gold} size="small" />}
        <Animated.Text style={[s.statusText, !ready && { opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] }) }]}>
          {ready ? `Ready${source === 'offline' ? ' • Offline archive' : ''}` : 'ENTERING THE SPOTLIGHT...'}
        </Animated.Text>
      </View>

      <Animated.View style={{ width: '100%', transform: [{ scale: pressScale }] }}>
        <Pressable
          onPress={() => onStart()}
          disabled={!ready}
          onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true }).start()}
          onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true }).start()}
          style={[s.button, !ready && s.buttonDisabled]}
        >
          <Text style={s.buttonText}>DISCOVER ACTRESSES</Text>
        </Pressable>
      </Animated.View>

      <Text style={s.footer}>© PINAY STARS • EST. 2026</Text>
    </LinearGradient>
  );
}

const makeStyles = ({ colors }) => StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 24, alignItems: 'center' },
  archive: { backgroundColor: colors.onDarkFill, borderRadius: radius.pill, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.onDarkFillStrong },
  archiveText: { color: colors.onDarkSoft, fontSize: 11, fontFamily: fonts.sansBold, letterSpacing: 1.6, textAlign: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 168, height: 168, borderRadius: 36, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12, overflow: 'hidden' },
  logoImage: { width: 168, height: 168 },
  logoSpark: { position: 'absolute', top: 10, right: 12, color: colors.gold, fontFamily: fonts.sans, fontSize: 18 },
  brand: { fontFamily: fonts.serif, fontSize: 36, color: colors.onDarkSoft, marginTop: 24, letterSpacing: 0.5 },
  tagline: { fontFamily: fonts.sans, fontSize: 16, color: colors.onDarkSoft, marginTop: 8, letterSpacing: 0.6 },
  box: { backgroundColor: colors.onDarkFill, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16, marginTop: 20, borderWidth: 1, borderColor: colors.onDarkFill },
  boxText: { color: colors.onDarkSoft, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.4, textAlign: 'center', lineHeight: 20 },
  stats: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  stat: { alignItems: 'center', paddingHorizontal: 16 },
  statValue: { fontFamily: fonts.serif, fontSize: 28, color: colors.gold },
  statLabel: { color: colors.onDarkSoft, fontSize: 11, letterSpacing: 1.4, fontFamily: fonts.sansBold, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.onDarkFillStrong },
  stripWrap: { width: '100%', marginBottom: 16 },
  stripLabel: { color: colors.onDarkSoft, fontSize: 10, letterSpacing: 1.6, fontFamily: fonts.sansBold, marginBottom: 12, textAlign: 'center' },
  strip: { flexDirection: 'row' },
  face: { marginRight: FACE_GAP },
  faceImage: { width: FACE, height: FACE, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  readyDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success, marginRight: 8 },
  statusText: { color: colors.onDarkSoft, fontSize: 12, fontFamily: fonts.sansBold, letterSpacing: 1.6, marginLeft: 8 },
  button: { backgroundColor: colors.onDarkSoft, borderRadius: radius.lg, paddingVertical: 16, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  buttonDisabled: { opacity: 0.55 },
  buttonText: { color: colors.burgundyDeep, fontSize: 16, fontFamily: fonts.sansBold, letterSpacing: 1 },
  footer: { color: colors.onDarkMuted, fontFamily: fonts.sans, fontSize: 11, letterSpacing: 1.6, marginTop: 16 },
});
