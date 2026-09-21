import React from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow, space, type } from '../theme';
import { usePosters } from '../posters';
import { Rise } from './ui';

const POSTER_W = 112;
const POSTER_H = Math.round(POSTER_W * 1.5); // TMDB posters are 2:3

/**
 * Horizontal "Known for" rail of film / series posters, Netflix-style. Titles that TMDB
 * cannot match still get a card: a burgundy tile with the title, so the rail never has holes.
 */
export default function PosterRail({ titles, kind = 'movie', label, edge = space.page }) {
  const posters = usePosters(titles, kind);
  const list = (titles || []).filter(Boolean);
  if (!list.length) return null;
  return (
    // `edge` lets the rail sit inside a padded page yet scroll edge to edge.
    <View style={[s.wrap, { marginHorizontal: -edge }]}>
      {label ? <Text style={[s.label, { marginHorizontal: edge }]}>{label}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: edge }}>
        {list.map((title, i) => {
          const hit = posters[title];
          return (
            <Rise key={title} delay={Math.min(i, 8) * 50} style={s.item}>
              <View style={s.poster} accessible accessibilityLabel={`${kind === 'tv' ? 'Series' : 'Film'}: ${title}${hit?.year ? `, ${hit.year}` : ''}`}>
                {hit?.poster ? (
                  <Image source={{ uri: hit.poster }} style={s.image} />
                ) : (
                  <View style={s.fallback}>
                    <Ionicons name={kind === 'tv' ? 'tv-outline' : 'film-outline'} size={22} color={colors.onDarkSoft} />
                    <Text style={s.fallbackTitle} numberOfLines={4}>{title}</Text>
                  </View>
                )}
              </View>
              <Text style={s.title} numberOfLines={2}>{hit?.name || title}</Text>
              {hit?.year ? <Text style={s.year}>{hit.year}</Text> : null}
            </Rise>
          );
        })}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginTop: space.lg },
  label: { ...type.kicker, marginBottom: space.sm },
  item: { width: POSTER_W, marginRight: space.md },
  poster: { width: POSTER_W, height: POSTER_H, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.burgundySoft, ...shadow.card },
  image: { width: '100%', height: '100%' },
  fallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: space.sm, backgroundColor: colors.burgundy },
  fallbackTitle: { ...type.smallStrong, color: colors.white, textAlign: 'center', marginTop: space.sm },
  title: { ...type.smallStrong, marginTop: space.sm },
  year: { ...type.caption, marginTop: 2 },
});
