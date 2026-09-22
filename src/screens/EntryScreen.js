import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, PanResponder, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow, space, touch, type } from '../theme';
import { usePosters } from '../posters';

// Poster rails use w342; the hero is full-width, so swap in the larger render of the same file.
const HERO_POSTER_SIZE = '/w780/';

// The sheet rests this far up over the photo, and can be dragged up to leave this much of the
// photo showing at the top when fully expanded.
const SHEET_OVERLAP = 28;
const EXPANDED_PEEK = 72;
// When tucked down, this much of the sheet (handle + "Welcome") stays visible above the home bar.
const COLLAPSED_PEEK = 132;

// One full-bleed film poster at a time, slowly zooming, crossfading to the next every few
// seconds (the Netflix-style hero). Posters are the TMDB art for films the registry's actresses
// starred in; until they resolve (or if TMDB is unavailable) the burgundy wash alone carries the hero.
const SLIDE_MS = 6000;
const FADE_MS = 1200;
const ZOOM_TO = 1.12;

// Two persistent image layers take turns being on top. The incoming layer fades in over the
// outgoing one, which stays fully opaque underneath, so a photo is always visible even
// mid-transition. Nothing is remounted, so the animated values never fall out of sync.
function useSlideLayers(slides) {
  const [layers, setLayers] = useState(() => ({ a: slides[0] || null, b: null, top: 'a', index: 0 }));
  const opacity = useRef({ a: new Animated.Value(1), b: new Animated.Value(0) }).current;
  const zoom = useRef({ a: new Animated.Value(1), b: new Animated.Value(1) }).current;

  // Seed layer A as soon as the first photo arrives (data can land after first render).
  useEffect(() => {
    if (slides.length && !layers.a && !layers.b) setLayers({ a: slides[0], b: null, top: 'a', index: 0 });
  }, [slides, layers.a, layers.b]);

  // Zoom the very first photo too, so it is never static.
  useEffect(() => {
    Animated.timing(zoom.a, { toValue: ZOOM_TO, duration: SLIDE_MS + FADE_MS, easing: Easing.linear, useNativeDriver: true }).start();
  }, [zoom]);

  useEffect(() => {
    if (slides.length < 2) return undefined;
    const timer = setInterval(() => {
      setLayers(prev => {
        const index = (prev.index + 1) % slides.length;
        const incoming = prev.top === 'a' ? 'b' : 'a';
        const next = slides[(index + 1) % slides.length];
        if (next?.image) Image.prefetch(next.image).catch(() => {});
        opacity[incoming].setValue(0);
        zoom[incoming].setValue(1);
        Animated.parallel([
          Animated.timing(opacity[incoming], { toValue: 1, duration: FADE_MS, useNativeDriver: true }),
          Animated.timing(zoom[incoming], { toValue: ZOOM_TO, duration: SLIDE_MS + FADE_MS, easing: Easing.linear, useNativeDriver: true }),
        ]).start();
        return { ...prev, [incoming]: slides[index], top: incoming, index };
      });
    }, SLIDE_MS);
    return () => clearInterval(timer);
  }, [slides, opacity, zoom]);

  return { layers, opacity, zoom };
}

function PhotoHero({ slides, width, height }) {
  const { layers, opacity, zoom } = useSlideLayers(slides);
  // Render the top layer last so it paints over the other.
  const order = layers.top === 'a' ? ['b', 'a'] : ['a', 'b'];
  // Explicit pixel sizes: the image element itself is never left to infer its box.
  const size = { width, height };

  return (
    <View style={[s.hero, size]}>
      {order.map(slot => (layers[slot] ? (
        <Animated.View key={slot} style={[s.slide, size, { opacity: opacity[slot], transform: [{ scale: zoom[slot] }] }]}>
          <Image source={{ uri: layers[slot].image }} style={size} resizeMode="cover" accessibilityIgnoresInvertColors />
        </Animated.View>
      ) : null))}
      <LinearGradient
        colors={['rgba(74,0,21,0.35)', 'rgba(74,0,21,0.6)', colors.burgundyDeep]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

function OptionRow({ icon, title, body, onPress, tone, delay }) {
  const rise = useRef(new Animated.Value(16)).current;
  const fade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 360, delay, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 0, duration: 360, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [fade, rise, delay]);

  const primary = tone === 'primary';
  const gold = tone === 'gold';
  const fg = primary ? colors.white : colors.burgundyDeep;
  const sub = primary ? colors.onDarkSoft : gold ? colors.goldText : colors.text;

  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${body}`}
        style={({ pressed }) => [s.option, primary && s.optionPrimary, gold && s.optionGold, pressed && { opacity: 0.9 }]}
      >
        <View style={[s.optionIcon, primary && s.optionIconPrimary, gold && s.optionIconGold]}>
          <Ionicons name={icon} size={20} color={primary ? colors.white : colors.burgundyDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.optionTitle, { color: fg }]}>{title}</Text>
          <Text style={[s.optionBody, { color: sub }]}>{body}</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={fg} />
      </Pressable>
    </Animated.View>
  );
}

// Drag state for the sheet: `offset` is how far below its fully-expanded position the sheet
// sits. `snaps` are the resting offsets, ascending (expanded, resting, collapsed). A release
// settles on the nearest snap, or on the next one in the fling direction when the drag was quick.
function useDraggableSheet(snaps, initial) {
  const offset = useRef(new Animated.Value(initial)).current;
  const startOffset = useRef(initial);
  const currentOffset = useRef(initial);
  const min = snaps[0];
  const max = snaps[snaps.length - 1];

  useEffect(() => {
    const id = offset.addListener(({ value }) => { currentOffset.current = value; });
    return () => offset.removeListener(id);
  }, [offset]);

  // Reset when the screen size changes (rotation), so the sheet isn't left mid-air.
  useEffect(() => {
    offset.setValue(initial);
    currentOffset.current = initial;
  }, [offset, initial]);

  const snapTo = target => {
    Animated.spring(offset, { toValue: target, useNativeDriver: true, damping: 20, stiffness: 180 }).start();
  };

  const nearest = value => snaps.reduce((best, snap) => (Math.abs(snap - value) < Math.abs(best - value) ? snap : best), snaps[0]);
  const nextInDirection = (from, up) => {
    const candidates = up ? snaps.filter(snap => snap < from - 1) : snaps.filter(snap => snap > from + 1);
    if (!candidates.length) return nearest(from);
    return up ? candidates[candidates.length - 1] : candidates[0];
  };

  const pan = useMemo(() => PanResponder.create({
    // Only a clear vertical move becomes a drag, so taps on the option rows still work.
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 6 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderGrant: () => { startOffset.current = currentOffset.current; },
    onPanResponderMove: (_, g) => {
      offset.setValue(Math.min(max, Math.max(min, startOffset.current + g.dy)));
    },
    onPanResponderRelease: (_, g) => {
      const flung = Math.abs(g.vy) > 0.5;
      snapTo(flung ? nextInDirection(startOffset.current, g.vy < 0) : nearest(currentOffset.current));
    },
    onPanResponderTerminate: () => snapTo(nearest(currentOffset.current)),
  }), [offset, min, max]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tapping the handle steps through the positions: collapsed → resting → expanded → collapsed.
  const toggle = () => {
    const at = nearest(currentOffset.current);
    const i = snaps.indexOf(at);
    snapTo(snaps[(i - 1 + snaps.length) % snaps.length]);
  };

  return { offset, pan, toggle };
}

export default function EntryScreen({ actresses = [], onSignIn, onRegister, onGuest }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.max(300, Math.round(height * 0.42));
  const columnWidth = Math.min(width, 520);
  // Every actress's first-listed film, then second-listed, and so on, so the hero spreads across
  // the whole registry rather than one prolific filmography.
  const filmTitles = useMemo(() => {
    const byRank = [];
    for (const a of actresses) (a.films || []).forEach((title, rank) => { (byRank[rank] ||= []).push(title); });
    return [...new Set(byRank.flat())].slice(0, 12);
  }, [actresses]);
  const posters = usePosters(filmTitles, 'movie');
  const slides = useMemo(
    () => filmTitles
      .map(title => posters[title])
      .filter(hit => hit?.poster)
      .slice(0, 8)
      .map(hit => ({ id: hit.tmdbId, image: hit.poster.replace('/w342/', HERO_POSTER_SIZE) })),
    [filmTitles, posters],
  );

  // Sheet geometry: its top edge sits at `expandedTop` when pulled up, `restTop` when resting,
  // and `collapsedTop` when tucked down to show off the poster. Offsets are measured from expanded.
  const expandedTop = insets.top + EXPANDED_PEEK;
  const restTop = heroHeight - SHEET_OVERLAP;
  const collapsedTop = height - insets.bottom - COLLAPSED_PEEK;
  const sheetHeight = height - expandedTop;
  const restOffset = Math.max(0, restTop - expandedTop);
  const collapsedOffset = Math.max(restOffset, collapsedTop - expandedTop);
  const snaps = useMemo(() => [...new Set([0, restOffset, collapsedOffset])], [restOffset, collapsedOffset]);
  const { offset, pan, toggle } = useDraggableSheet(snaps, restOffset);

  // The headline fades out as the sheet rises over it.
  const copyOpacity = restOffset > 0
    ? offset.interpolate({ inputRange: [0, restOffset * 0.6, restOffset], outputRange: [0, 0.6, 1], extrapolate: 'clamp' })
    : 1;

  return (
    <View style={s.page}>
      <PhotoHero slides={slides} width={width} height={heroHeight} />

      <Animated.View style={[s.heroCopy, { top: insets.top + space.lg, width: columnWidth, opacity: copyOpacity }]} pointerEvents="none">
        <View style={s.brandRow}>
          <View style={s.brandLogo}>
            <Image source={require('../../assets/logo.png')} style={s.brandLogoImage} resizeMode="contain" />
          </View>
          <Text style={s.brandName}>Pinay Stars</Text>
        </View>
        <Text style={s.headline} accessibilityRole="header">
          Discover,{'\n'}Follow,{'\n'}<Text style={s.headlineAccent}>Celebrate</Text>
        </Text>
        <Text style={s.headlineSub}>The Filipina talent archive.</Text>
      </Animated.View>

      {/* The whole sheet is the drag surface; option rows still take plain taps. */}
      <Animated.View
        {...pan.panHandlers}
        style={[s.sheet, { top: expandedTop, height: sheetHeight, width: columnWidth, transform: [{ translateY: offset }] }]}
      >
        <View style={s.dragArea}>
          <Pressable
            onPress={toggle}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Expand or collapse the sign-in panel"
            style={s.grabberHit}
          >
            <View style={s.grabber} />
          </Pressable>
          <Text style={s.sheetTitle}>Welcome</Text>
          <Text style={s.sheetSub}>Sign in to keep your favorites everywhere, or just start browsing.</Text>
        </View>

        <View style={{ paddingBottom: insets.bottom + space.xl }}>
          <OptionRow
            icon="log-in-outline"
            title="Sign In"
            body="Members and administrators"
            onPress={onSignIn}
            tone="primary"
            delay={80}
          />
          <OptionRow
            icon="person-outline"
            title="Continue as Guest"
            body="Browse every profile, no account needed"
            onPress={onGuest}
            tone="plain"
            delay={160}
          />
          <OptionRow
            icon="person-add-outline"
            title="Create a Free Account"
            body="New here? Join in under a minute"
            onPress={onRegister}
            tone="gold"
            delay={240}
          />

          <Text style={s.footer}>© Pinay Stars · Est. 2026</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.burgundyDeep, alignItems: 'center' },

  hero: { backgroundColor: colors.burgundyDeep, overflow: 'hidden' },
  slide: { position: 'absolute', top: 0, left: 0, backgroundColor: colors.burgundySoft },

  heroCopy: { position: 'absolute', paddingHorizontal: space.page },
  brandRow: { flexDirection: 'row', alignItems: 'center', marginBottom: space.lg },
  brandLogo: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.white, overflow: 'hidden', marginRight: space.sm },
  brandLogoImage: { width: 36, height: 36 },
  brandName: { ...type.h3, color: colors.white },
  headline: { ...type.display, fontSize: 34, lineHeight: 38, color: colors.white },
  headlineAccent: { color: colors.gold },
  headlineSub: { ...type.small, color: colors.onDarkSoft, marginTop: space.sm },

  sheet: {
    position: 'absolute',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space.page,
    ...shadow.card,
  },
  dragArea: { paddingTop: space.sm, paddingBottom: space.lg },
  grabberHit: { alignSelf: 'center', paddingVertical: space.sm, marginBottom: space.sm },
  grabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line },
  sheetTitle: { ...type.h1 },
  sheetSub: { ...type.small, marginTop: space.xs },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touch.min + 12,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    marginBottom: space.md,
  },
  optionPrimary: { backgroundColor: colors.burgundy, borderColor: colors.burgundy },
  optionGold: { backgroundColor: colors.gold, borderColor: colors.gold },
  optionIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', marginRight: space.md },
  optionIconPrimary: { backgroundColor: colors.onDarkFillStrong },
  optionIconGold: { backgroundColor: 'rgba(74,0,21,0.12)' },
  optionTitle: { ...type.h3 },
  optionBody: { ...type.caption, marginTop: 2 },

  footer: { ...type.caption, color: colors.muted, letterSpacing: 1, textAlign: 'center', marginTop: space.lg },
});
