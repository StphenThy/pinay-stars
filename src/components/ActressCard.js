import React, { useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, shadow, statusMeta, fonts } from '../theme';
import { formatBirthday, formatReviews, tenureLabel } from '../data/actressModel';
import { Avatar, Button, StatusPill, Tag } from './ui';
import { Chevron, Collapsible } from './Collapsible';
import StarRating from './StarRating';
import PressScale from './PressScale';
import { Ionicons } from '@expo/vector-icons';
import { haptic } from '../haptics';

function Heart({ favorite, onPress, light }) {
  return (
    <Pressable hitSlop={12} onPress={() => { haptic.tap(); onPress(); }} style={[s.heart, light && s.heartLight]}>
      <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? colors.burgundy : light ? colors.white : colors.rose} />
    </Pressable>
  );
}

function FeaturedCard({ actress, featureLabel, favorite, onOpen, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={s.featured}>
      <ImageBackground source={{ uri: actress.image }} imageStyle={s.featuredImage} style={s.featuredBg}>
        <Pressable onPress={onOpen} style={StyleSheet.absoluteFill} />
        <View style={s.featuredTop} pointerEvents="box-none">
          <Text style={s.featuredBadge}>{featureLabel || actress.badge}</Text>
          <Heart favorite={favorite} onPress={onToggle} light />
        </View>
        <LinearGradient
          colors={['transparent', 'rgba(50,0,15,0.55)', 'rgba(50,0,15,0.94)']}
          locations={[0, 0.35, 1]}
          style={s.featuredBottom}
        >
          <Pressable onPress={() => setExpanded(x => !x)}>
            <View style={s.featuredHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.featuredGenre}>{actress.genres.join(' / ').toUpperCase()}</Text>
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
      </ImageBackground>
    </View>
  );
}

export default function ActressCard({ actress, variant = 'list', onPress, onFavorite, favorite, featureLabel, onRemove }) {
  const open = () => onPress && onPress(actress);
  const toggle = () => onFavorite && onFavorite(actress);

  if (variant === 'featured') {
    return <FeaturedCard actress={actress} featureLabel={featureLabel} favorite={favorite} onOpen={open} onToggle={toggle} />;
  }

  if (variant === 'compact') {
    return (
      <PressScale onPress={open} style={s.compact}>
        <View>
          <Avatar uri={actress.image} name={actress.stageName} style={s.compactImage} rounded={radius.md} />
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
      <View style={s.fav}>
        <Avatar uri={actress.image} name={actress.stageName} style={s.favImage} rounded={radius.md} />
        <View style={s.favBody}>
          <Tag label={actress.badge} tone="gold" />
          <Text numberOfLines={1} style={s.favName}>{actress.stageName}</Text>
          <Text numberOfLines={1} style={s.favGenres}>{actress.genres.join(', ').toUpperCase()}</Text>
          <Text numberOfLines={1} style={s.favKnown}>Known: “{actress.films[0] || '—'}”</Text>
          <Text style={[s.favStatus, { color: meta.fg }]}>● {meta.label}</Text>
          <View style={s.favActions}>
            <Button label="View Profile" small onPress={open} />
            <Button label="Remove" variant="ghost" small onPress={() => onRemove && onRemove(actress)} style={{ marginLeft: 8 }} />
          </View>
        </View>
      </View>
    );
  }

  const tenure = tenureLabel(actress.yearsActive);
  return (
    <PressScale onPress={open} style={s.card} scaleTo={0.98}>
      <Avatar uri={actress.image} name={actress.stageName} style={s.image} rounded={radius.md} />
      <View style={s.body}>
        <View style={s.row}>
          <Text numberOfLines={1} style={s.name}>{actress.stageName}</Text>
          <Heart favorite={favorite} onPress={toggle} />
        </View>
        <Text style={s.birthday}>{formatBirthday(actress.birthday, actress.status)}</Text>
        <StarRating value={actress.rating} size={13} showValue count={actress.reviewsCount} style={{ marginTop: 4 }} />
        <Text style={s.knownLabel}>KNOWN FOR</Text>
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
          <Text numberOfLines={1} style={s.agency}>• {actress.agency}</Text>
        </View>
        <Button label="View Profile" variant="secondary" small onPress={open} style={{ alignSelf: 'flex-start', marginTop: 10 }} />
      </View>
    </PressScale>
  );
}

const s = StyleSheet.create({
  heart: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },
  heartLight: { backgroundColor: 'rgba(255,255,255,0.22)' },

  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 12, marginHorizontal: 20, marginBottom: 14, flexDirection: 'row', ...shadow.card },
  image: { width: 108, height: 150 },
  body: { flex: 1, paddingLeft: 12 },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { flex: 1, fontFamily: fonts.serif, fontSize: 22, color: colors.burgundy, fontWeight: '700' },
  birthday: { color: colors.text, fontSize: 13, marginTop: 2 },
  knownLabel: { marginTop: 8, fontSize: 10, letterSpacing: 1.2, fontWeight: '700', color: colors.rose },
  known: { color: colors.textStrong, fontSize: 13, marginTop: 2 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 8 },
  footer: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  agency: { color: colors.text, fontSize: 12, marginLeft: 6, flex: 1 },

  featured: { width: 300, marginRight: 14, ...shadow.card },
  featuredBg: { height: 420, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'space-between', backgroundColor: colors.burgundySoft },
  featuredImage: { borderRadius: radius.xl },
  featuredTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  featuredBadge: { backgroundColor: 'rgba(101,0,29,0.9)', color: colors.white, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, fontWeight: '700', fontSize: 12, overflow: 'hidden' },
  featuredBottom: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 44 },
  featuredHead: { flexDirection: 'row', alignItems: 'flex-end' },
  featuredGenre: { fontSize: 11, color: '#FBD5D9', fontWeight: '700', letterSpacing: 1 },
  featuredName: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 28, color: colors.white, marginTop: 2 },
  featuredMeta: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  featuredBody: { fontSize: 14, color: '#FFF2F3', marginTop: 10, lineHeight: 20 },
  featuredFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  featuredKnown: { flex: 1, color: '#FBD5D9', fontSize: 12, marginRight: 10, fontStyle: 'italic' },
  featuredRating: { color: colors.gold, fontWeight: '700', fontSize: 17 },
  featuredReviews: { color: '#FBD5D9', fontSize: 12, marginLeft: 6 },

  compact: { width: 170, marginRight: 14 },
  compactImage: { width: 170, height: 210 },
  compactRating: { position: 'absolute', top: 10, left: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 4 },
  compactRatingText: { color: colors.burgundy, fontWeight: '700', fontSize: 12, marginLeft: 4 },
  compactBadge: { position: 'absolute', bottom: 10, left: 10, right: 10, backgroundColor: 'rgba(101,0,29,0.9)', borderRadius: radius.pill, paddingHorizontal: 9, paddingVertical: 5 },
  compactBadgeText: { color: colors.white, fontWeight: '700', fontSize: 11 },
  compactName: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 18, color: colors.burgundy, marginTop: 10 },
  compactFilm: { color: colors.textStrong, fontSize: 13, marginTop: 2 },
  compactMeta: { color: colors.rose, fontSize: 12, marginTop: 3, fontWeight: '600' },

  fav: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 12, marginHorizontal: 20, marginBottom: 14, flexDirection: 'row', ...shadow.card },
  favImage: { width: 100, height: 140 },
  favBody: { flex: 1, paddingLeft: 12 },
  favName: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 21, color: colors.burgundy },
  favGenres: { color: colors.rose, fontWeight: '700', fontSize: 11, letterSpacing: 0.8, marginTop: 2 },
  favKnown: { color: colors.textStrong, fontSize: 13, marginTop: 6 },
  favStatus: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  favActions: { flexDirection: 'row', marginTop: 10 },
});
