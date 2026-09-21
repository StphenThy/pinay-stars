import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, shadow, space, statusMeta, type } from '../theme';
import { formatBirthday, formatReviews, tenureLabel } from '../data/actressModel';
import { Avatar, Button, HeartButton, StatusPill, Tag } from './ui';
import { Chevron, Collapsible } from './Collapsible';
import StarRating from './StarRating';
import PressScale from './PressScale';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '../haptics';

const PARALLAX = 32; // px the portrait drifts against its frame while the carousel moves

function FeaturedCard({ actress, featureLabel, favorite, onOpen, onToggle, parallax }) {
  const [expanded, setExpanded] = useState(false);
  // The portrait is a little wider than the card and slides the opposite way to the scroll,
  // so the photo reads as sitting behind the frame (2.5D) using nothing but the real image.
  const translateX = parallax
    ? parallax.scrollX.interpolate({
        inputRange: [(parallax.index - 1) * parallax.width, (parallax.index + 1) * parallax.width],
        outputRange: [PARALLAX, -PARALLAX],
        extrapolate: 'clamp',
      })
    : 0;
  return (
    <View style={s.featured}>
      <View style={s.featuredBg}>
        <Animated.Image
          source={{ uri: actress.image }}
          style={[s.featuredImage, { transform: [{ translateX }] }]}
          accessibilityLabel={`Portrait of ${actress.stageName}`}
        />
        <Pressable onPress={onOpen} style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={`Open ${actress.stageName}'s profile`} />
        <View style={s.featuredTop} pointerEvents="box-none">
          <View style={s.featuredBadge}>
            <Ionicons name="ribbon" size={12} color={colors.gold} />
            <Text style={s.featuredBadgeText}>{featureLabel || actress.badge}</Text>
          </View>
          <HeartButton favorite={favorite} onPress={() => { haptic.tap(); onToggle(); }} light name={actress.stageName} />
        </View>
        <LinearGradient colors={gradients.scrim.colors} locations={gradients.scrim.locations} style={s.featuredBottom}>
          <Pressable onPress={() => setExpanded(x => !x)} accessibilityRole="button" accessibilityLabel={`${expanded ? 'Hide' : 'Show'} details for ${actress.stageName}`}>
            <View style={s.featuredHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.featuredGenre}>{actress.genres.join(' / ')}</Text>
                <Text style={s.featuredName}>{actress.stageName}</Text>
              </View>
              <Chevron open={expanded} onPress={() => setExpanded(x => !x)} light />
            </View>
            <View style={s.featuredMeta}>
              <StarRating value={actress.rating} size={15} muted="rgba(255,255,255,0.35)" />
              <Text style={s.featuredReviews}>{actress.rating ? `${actress.rating.toFixed(1)} · ` : ''}{formatReviews(actress.reviewsCount)}</Text>
            </View>
          </Pressable>
          <Collapsible open={expanded} maxHeight={220}>
            <Text numberOfLines={3} style={s.featuredBody}>{actress.biography}</Text>
            <View style={s.featuredFooter}>
              <Text numberOfLines={1} style={s.featuredKnown}>Known for “{actress.films[0] || actress.occupation}”</Text>
              <Button label="View Profile" variant="secondary" small onPress={onOpen} />
            </View>
          </Collapsible>
        </LinearGradient>
      </View>
    </View>
  );
}

export default function ActressCard({ actress, variant = 'list', onPress, onFavorite, favorite, featureLabel, onRemove, parallax }) {
  const open = () => onPress && onPress(actress);
  const toggle = () => onFavorite && onFavorite(actress);

  if (variant === 'featured') {
    return <FeaturedCard actress={actress} featureLabel={featureLabel} favorite={favorite} onOpen={open} onToggle={toggle} parallax={parallax} />;
  }

  if (variant === 'compact') {
    return (
      <PressScale onPress={open} style={s.compact} accessibilityRole="button" accessibilityLabel={`${actress.stageName}, ${actress.rating ? actress.rating.toFixed(1) + ' stars' : 'not yet rated'}`}>
        <View>
          <Avatar uri={actress.image} name={actress.stageName} style={s.compactImage} rounded={radius.lg} />
          <View style={s.compactRating}>
            <Ionicons name="star" size={11} color={actress.rating ? colors.gold : colors.muted} />
            <Text style={s.compactRatingText}>{actress.rating ? actress.rating.toFixed(1) : 'New'}</Text>
          </View>
          <View style={s.compactBadge}><Text style={s.compactBadgeText} numberOfLines={1}>{actress.badge}</Text></View>
        </View>
        <Text numberOfLines={1} style={s.compactName}>{actress.stageName}</Text>
        <Text numberOfLines={1} style={s.compactFilm}>{actress.films[0] || actress.occupation}</Text>
        <Text numberOfLines={1} style={s.compactMeta}>{actress.awards[1] || actress.genres.join(' / ')}</Text>
      </PressScale>
    );
  }

  if (variant === 'favorite') {
    const meta = statusMeta[actress.status] || statusMeta.active;
    return (
      <View style={s.card}>
        <Avatar uri={actress.image} name={actress.stageName} style={s.favImage} rounded={radius.md} />
        <View style={s.body}>
          <Tag label={actress.badge} tone="gold" />
          <Text numberOfLines={1} style={s.name}>{actress.stageName}</Text>
          <Text numberOfLines={1} style={s.favGenres}>{actress.genres.join(', ')}</Text>
          <Text numberOfLines={1} style={s.known}>Known for “{actress.films[0] || '—'}”</Text>
          <View style={s.favStatusRow}>
            <View style={[s.favStatusDot, { backgroundColor: meta.fg }]} />
            <Text style={[s.favStatus, { color: meta.fg }]}>{meta.label}</Text>
          </View>
          <View style={s.actions}>
            <Button label="View Profile" small onPress={open} />
            <Button label="Remove" variant="ghost" small icon="heart-dislike-outline" onPress={() => onRemove && onRemove(actress)} style={{ marginLeft: space.sm }} accessibilityLabel={`Remove ${actress.stageName} from favorites`} />
          </View>
        </View>
      </View>
    );
  }

  const tenure = tenureLabel(actress.yearsActive);
  return (
    <PressScale onPress={open} style={s.card} scaleTo={0.98} accessibilityRole="button" accessibilityLabel={`${actress.stageName}, ${actress.agency}`}>
      <Avatar uri={actress.image} name={actress.stageName} style={s.image} rounded={radius.md} />
      <View style={s.body}>
        <View style={s.row}>
          <Text numberOfLines={1} style={s.name}>{actress.stageName}</Text>
          <HeartButton favorite={favorite} onPress={() => { haptic.tap(); toggle(); }} name={actress.stageName} />
        </View>
        <Text style={s.birthday}>{formatBirthday(actress.birthday, actress.status)}</Text>
        <StarRating value={actress.rating} size={13} showValue count={actress.reviewsCount} style={{ marginTop: space.xs }} />
        <Text style={s.knownLabel}>Known for</Text>
        <Text numberOfLines={1} style={s.known}>
          {actress.films.length ? actress.films.slice(0, 3).map(f => `“${f}”`).join(', ') : 'Filmography pending'}
        </Text>
        <View style={s.tags}>
          {tenure ? <Tag label={tenure} tone="gold" /> : null}
          {actress.genres.slice(0, 3).map(g => <Tag key={g} label={g} />)}
          {actress.awards[0] ? <Tag label={actress.awards[0]} tone="dark" /> : null}
        </View>
        <View style={s.footer}>
          <StatusPill status={actress.status} />
          <Text numberOfLines={1} style={s.agency}>{actress.agency}</Text>
        </View>
        <Button label="View Profile" variant="secondary" small onPress={open} style={s.viewButton} />
      </View>
    </PressScale>
  );
}

const s = StyleSheet.create({
  // List + favorite cards share one shell so the two screens look like the same product.
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: space.md, marginHorizontal: space.page, marginBottom: space.md, flexDirection: 'row', ...shadow.card },
  image: { width: 108, height: 150 },
  favImage: { width: 100, height: 140 },
  body: { flex: 1, paddingLeft: space.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { ...type.h2, flex: 1 },
  birthday: { ...type.small, marginTop: 2 },
  knownLabel: { ...type.kicker, marginTop: space.sm },
  known: { ...type.smallStrong, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: space.sm },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  agency: { ...type.caption, marginLeft: space.sm, flex: 1 },
  viewButton: { alignSelf: 'flex-start', marginTop: space.sm },
  actions: { flexDirection: 'row', marginTop: space.sm },

  favGenres: { ...type.kicker, marginTop: 2 },
  favStatusRow: { flexDirection: 'row', alignItems: 'center', marginTop: space.xs },
  favStatusDot: { width: 6, height: 6, borderRadius: 3, marginRight: space.xs },
  favStatus: { ...type.caption },

  featured: { width: 300, marginRight: space.md, ...shadow.card },
  featuredBg: { height: 420, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'space-between', backgroundColor: colors.burgundySoft },
  featuredImage: { position: 'absolute', top: 0, bottom: 0, left: -PARALLAX, width: 300 + PARALLAX * 2, resizeMode: 'cover' },
  featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(101,0,29,0.9)', borderRadius: radius.pill, paddingHorizontal: space.md, paddingVertical: space.sm },
  featuredBadgeText: { ...type.caption, color: colors.white, marginLeft: space.xs },
  featuredBottom: { paddingHorizontal: space.lg, paddingBottom: space.lg, paddingTop: space.huge },
  featuredHead: { flexDirection: 'row', alignItems: 'flex-end' },
  featuredGenre: { ...type.kicker, color: colors.onDarkSoft },
  featuredName: { ...type.h1, color: colors.white, marginTop: 2 },
  featuredMeta: { flexDirection: 'row', alignItems: 'baseline', marginTop: space.xs },
  featuredBody: { ...type.small, color: colors.onDark, marginTop: space.sm },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: space.md },
  featuredKnown: { ...type.caption, color: colors.onDarkSoft, flex: 1, marginRight: space.sm },
  featuredReviews: { ...type.caption, color: colors.onDarkSoft, marginLeft: space.sm },

  compact: { width: 170, marginRight: space.md },
  compactImage: { width: 170, height: 210 },
  compactRating: { position: 'absolute', top: space.sm, left: space.sm, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xs },
  compactRatingText: { ...type.caption, color: colors.burgundy, marginLeft: space.xs },
  compactBadge: { position: 'absolute', bottom: space.sm, left: space.sm, right: space.sm, backgroundColor: 'rgba(101,0,29,0.9)', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xs },
  compactBadgeText: { ...type.micro, color: colors.white },
  compactName: { ...type.h3, marginTop: space.sm },
  compactFilm: { ...type.smallStrong, marginTop: 2 },
  compactMeta: { ...type.caption, color: colors.rose, marginTop: 2 },
});
