import React, { useEffect, useState } from 'react';
import { ImageBackground, Pressable, RefreshControl, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Avatar, Button, StatusPill, Tag } from '../components/ui';
import { Chevron, Collapsible } from '../components/Collapsible';
import StarRating from '../components/StarRating';
import { colors, radius, shadow, fonts } from '../theme';
import { formatBirthday, formatReviews, tenureLabel } from '../data/actressModel';
import { useAuth } from '../auth';
import { reviewApi } from '../api';
import { timeAgo } from '../notifications';
import { haptic } from '../haptics';

function ReviewsSection({ actress, onRatingChange, onSignIn, onError }) {
  const { account, isAdmin, isMember } = useAuth();
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    reviewApi.list(actress.id)
      .then(d => { if (!live) return; setData(d); if (d.mine) { setRating(d.mine.rating); setComment(d.mine.comment || ''); } })
      .catch(() => live && setData({ average: actress.rating, count: actress.reviewsCount, reviews: [], mine: null, offline: true }));
    return () => { live = false; };
  }, [actress.id]);

  const apply = d => {
    setData(d);
    onRatingChange(actress.id, d.average, d.count);
    if (d.mine) { setRating(d.mine.rating); setComment(d.mine.comment || ''); } else { setRating(0); setComment(''); }
  };

  const submit = async () => {
    if (!rating) return;
    setBusy(true);
    try {
      apply(await reviewApi.submit(actress.id, rating, comment.trim()));
      haptic.success();
      setEditing(false);
    } catch (err) { onError(err); } finally { setBusy(false); }
  };

  const removeOwn = async () => {
    setBusy(true);
    try { apply(await reviewApi.remove(actress.id)); haptic.warning(); setEditing(false); } catch (err) { onError(err); } finally { setBusy(false); }
  };

  const removeAsAdmin = async reviewId => {
    setBusy(true);
    try { apply(await reviewApi.remove(actress.id, reviewId)); haptic.warning(); } catch (err) { onError(err); } finally { setBusy(false); }
  };

  const average = data ? data.average : actress.rating;
  const count = data ? data.count : actress.reviewsCount;
  const mine = data?.mine;
  const showForm = isMember && (editing || !mine);

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Ratings & Reviews</Text>

      <View style={s.ratingSummary}>
        <Text style={s.ratingBig}>{count ? average.toFixed(1) : '–'}</Text>
        <View style={{ flex: 1 }}>
          <StarRating value={average} size={20} />
          <Text style={s.ratingCount}>{count ? `${formatReviews(count)} from members` : 'No ratings yet — be the first'}</Text>
        </View>
      </View>

      {!account ? (
        <Pressable onPress={onSignIn} style={s.rateHint}>
          <Ionicons name="lock-closed-outline" size={14} color={colors.burgundy} />
          <Text style={s.rateHintText}>Sign in as a member to rate {actress.stageName}</Text>
        </Pressable>
      ) : null}
      {isAdmin ? <Text style={s.adminNote}>Administrators moderate reviews but do not rate.</Text> : null}

      {isMember && mine && !editing ? (
        <View style={s.mineCard}>
          <View style={s.mineHead}>
            <Text style={s.mineTitle}>Your rating</Text>
            <StarRating value={mine.rating} size={14} />
          </View>
          {mine.comment ? <Text style={s.mineComment}>“{mine.comment}”</Text> : null}
          <View style={s.mineActions}>
            <Button label="Edit" variant="secondary" small onPress={() => setEditing(true)} />
            <Button label="Delete" variant="ghost" small onPress={removeOwn} disabled={busy} style={{ marginLeft: 8 }} />
          </View>
        </View>
      ) : null}

      {showForm ? (
        <View style={s.mineCard}>
          <Text style={s.mineTitle}>{mine ? 'Update your rating' : 'Rate this actress'}</Text>
          <StarRating value={rating} onChange={setRating} size={30} style={{ marginTop: 8 }} />
          <TextInput
            value={comment}
            onChangeText={v => setComment(v.slice(0, 500))}
            placeholder="Share a short review (optional)"
            placeholderTextColor={colors.muted}
            multiline
            style={s.reviewInput}
          />
          <View style={s.mineActions}>
            <Button label={busy ? 'Saving…' : mine ? 'Save changes' : 'Submit rating'} small onPress={submit} disabled={busy || !rating} />
            {mine ? <Button label="Cancel" variant="ghost" small onPress={() => { setEditing(false); setRating(mine.rating); setComment(mine.comment || ''); }} style={{ marginLeft: 8 }} /> : null}
          </View>
        </View>
      ) : null}

      {data === null ? (
        <Text style={s.emptyRow}>Loading reviews…</Text>
      ) : data.offline ? (
        <Text style={s.emptyRow}>Reviews are unavailable offline.</Text>
      ) : data.reviews.length ? data.reviews.map((r, i) => (
        <View key={r.id} style={[s.reviewRow, i === data.reviews.length - 1 && { borderBottomWidth: 0 }]}>
          <Avatar uri={r.user.avatar_url} name={r.user.display_name} style={s.reviewAvatar} rounded={18} />
          <View style={{ flex: 1 }}>
            <View style={s.reviewHead}>
              <Text style={s.reviewName}>{r.user.display_name}{mine && r.id === mine.id ? ' (you)' : ''}</Text>
              <Text style={s.reviewTime}>{timeAgo(Date.parse(String(r.updated_at).replace(' ', 'T') + 'Z') || Date.now())}</Text>
            </View>
            <StarRating value={r.rating} size={12} style={{ marginTop: 2 }} />
            {r.comment ? <Text style={s.reviewComment}>{r.comment}</Text> : null}
            {isAdmin ? (
              <Pressable onPress={() => removeAsAdmin(r.id)} disabled={busy} hitSlop={6} style={s.removeLink}>
                <Text style={s.removeLinkText}>Remove review</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      )) : (
        <Text style={s.emptyRow}>No written reviews yet.</Text>
      )}
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Metric({ value, label }) {
  return (
    <View style={s.metric}>
      <Text style={s.metricValue}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

function ListRows({ items, emptyText, sub }) {
  if (!items.length) return <Text style={s.emptyRow}>{emptyText}</Text>;
  return items.map((item, i) => (
    <View key={`${item}-${i}`} style={[s.listRow, i === items.length - 1 && { borderBottomWidth: 0 }]}>
      <Text style={s.listTitle}>{item}</Text>
      {sub ? <Text style={s.listSub}>{sub}</Text> : null}
    </View>
  ));
}

export default function ProfileScreen({ actress, favorite, onBack, onFavorite, onEdit, onDelete, onApprove, onSignIn, onRatingChange, onError, onRefresh, refreshing }) {
  const tenure = tenureLabel(actress.yearsActive);
  const [showDetails, setShowDetails] = useState(false);
  const { isAdmin } = useAuth();
  const pending = actress.status === 'review';

  const share = () => {
    haptic.tap();
    Share.share({
      title: `${actress.stageName} — Pinay Stars`,
      message: `${actress.stageName}\n${actress.genres.join(' / ')}${actress.films[0] ? ` • Known for “${actress.films[0]}”` : ''}\n\n${actress.biography}${actress.image ? `\n\n${actress.image}` : ''}\n\nvia Pinay Stars`,
    }).catch(() => {});
  };

  return (
    <ScrollView
      contentContainerStyle={s.page}
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.burgundy} colors={[colors.burgundy]} /> : undefined}
    >
      <View style={s.top}>
        <Pressable onPress={onBack} hitSlop={10} style={s.backRow}>
          <Ionicons name="chevron-back" size={20} color={colors.rose} />
          <Text style={s.back}>Back</Text>
        </Pressable>
        <Text style={s.header}>Actress Profile</Text>
        <View style={s.topActions}>
          <Pressable onPress={share} hitSlop={10} style={s.topButton}>
            <Ionicons name="share-outline" size={20} color={colors.burgundy} />
          </Pressable>
          <Pressable onPress={() => { haptic.tap(); onFavorite(actress); }} hitSlop={10} style={s.topButton}>
            <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={22} color={colors.burgundy} />
          </Pressable>
        </View>
      </View>

      <ImageBackground source={{ uri: actress.image }} style={s.hero} imageStyle={s.heroImage}>
        <View style={s.heroTop}>
          <StatusPill status={actress.status} />
          <Text style={s.recordId}>#{actress.displayId}</Text>
        </View>
        <LinearGradient colors={['transparent', 'rgba(50,0,15,0.6)', 'rgba(50,0,15,0.95)']} locations={[0, 0.4, 1]} style={s.heroCopy}>
          <Pressable onPress={() => setShowDetails(x => !x)}>
            <View style={s.heroHead}>
              <View style={{ flex: 1 }}>
                <Text style={s.genre}>{actress.genres.join(' / ').toUpperCase() || 'GENRE PENDING'}</Text>
                <Text style={s.name}>{actress.stageName}</Text>
              </View>
              <Chevron open={showDetails} onPress={() => setShowDetails(x => !x)} light label={showDetails ? 'Less' : 'Details'} />
            </View>
            <View style={s.ratingRow}>
              <StarRating value={actress.rating} size={16} muted="rgba(255,255,255,0.35)" />
              <Text style={s.reviews}>{actress.rating ? `${actress.rating.toFixed(1)} · ` : ''}{formatReviews(actress.reviewsCount)}</Text>
            </View>
          </Pressable>
          <Collapsible open={showDetails} maxHeight={260}>
            {actress.stageName !== actress.name ? <Text style={s.legal}>{actress.name}</Text> : null}
            <Text style={s.tagline}>{actress.occupation} • {actress.agency}</Text>
            <Text style={s.detail}>
              {formatBirthday(actress.birthday, actress.status)}
              {actress.birthplace ? `\n${actress.birthplace}` : ''}
            </Text>
          </Collapsible>
        </LinearGradient>
      </ImageBackground>

      {isAdmin && pending ? (
        <View style={s.pendingBanner}>
          <Text style={s.pendingTitle}>Pending submission</Text>
          <Text style={s.pendingBody}>Suggested by a visitor. Approve to publish her to the public directory, or reject to delete the submission.</Text>
          <View style={s.actions}>
            <Button label="Approve & Publish" onPress={() => onApprove(actress)} style={{ flex: 1 }} />
            <Button label="Reject" variant="danger" onPress={() => onDelete(actress)} style={{ flex: 1, marginLeft: 10 }} />
          </View>
        </View>
      ) : null}

      <View style={s.actions}>
        {isAdmin ? (
          <Button label="Edit Record" onPress={() => onEdit(actress)} style={{ flex: 1 }} />
        ) : null}
        <Button
          label={favorite ? 'Favorited' : 'Favorite'}
          variant={isAdmin ? 'secondary' : 'primary'}
          onPress={() => onFavorite(actress)}
          style={{ flex: 1, marginLeft: isAdmin ? 10 : 0 }}
        />
      </View>
      {!isAdmin ? (
        <Pressable onPress={onSignIn} style={s.signInHint}>
          <Text style={s.signInHintText}>Sign in as an administrator to edit or delete this record</Text>
        </Pressable>
      ) : null}

      <Section title="Biography">
        <Text style={s.body}>{actress.biography || 'No biography on record yet. Tap Edit Record to add one.'}</Text>
        <View style={s.metrics}>
          <Metric value={`${actress.films.length}`} label="Feature Films" />
          <Metric value={`${actress.awards.length}`} label="Honors & Awards" />
          <Metric value={tenure || '—'} label="Years Active" />
        </View>
      </Section>

      {!pending ? <ReviewsSection actress={actress} onRatingChange={onRatingChange} onSignIn={onSignIn} onError={onError} /> : null}

      <Section title="Acting Genres & Style">
        <View style={s.tags}>
          {actress.genres.length ? actress.genres.map(g => <Tag key={g} label={g} />) : <Text style={s.emptyRow}>No genres tagged.</Text>}
        </View>
        {actress.yearsActive ? (
          <View style={s.note}>
            <Text style={s.noteTitle}>Career Era</Text>
            <Text style={s.noteText}>{actress.yearsActive}</Text>
          </View>
        ) : null}
      </Section>

      <Section title="Notable Feature Films">
        <ListRows items={actress.films} emptyText="Filmography pending." sub="Feature role" />
      </Section>

      <Section title="Notable Television Series">
        <ListRows items={actress.tvSeries} emptyText="No television credits on record." sub="Series" />
      </Section>

      <Section title="Awards & Guild Honors">
        <ListRows items={actress.awards} emptyText="No formal citations on record." />
      </Section>

      <View style={s.recordMeta}>
        <Text style={s.recordMetaText}>Record {actress.displayId}</Text>
        {actress.updatedAt ? <Text style={s.recordMetaText}>Last updated {String(actress.updatedAt).slice(0, 10)}</Text> : null}
      </View>

      {isAdmin ? (
        <Button label="Delete Actress Record" variant="danger" onPress={() => onDelete(actress)} style={{ marginTop: 10 }} />
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { padding: 20, paddingBottom: 40 },
  top: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backRow: { flexDirection: 'row', alignItems: 'center', width: 84 },
  back: { color: colors.rose, fontSize: 16, fontWeight: '700' },
  header: { fontFamily: fonts.serif, fontSize: 22, color: colors.burgundy, fontWeight: '700' },
  topActions: { flexDirection: 'row', width: 84, justifyContent: 'flex-end' },
  topButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.blush, alignItems: 'center', justifyContent: 'center', marginLeft: 6 },

  ratingSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.blush, borderRadius: radius.md, padding: 14 },
  ratingBig: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 40, color: colors.burgundy, marginRight: 14, minWidth: 56, textAlign: 'center' },
  ratingCount: { color: colors.text, fontSize: 12, marginTop: 4 },
  rateHint: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  rateHintText: { color: colors.burgundy, fontWeight: '700', fontSize: 13, marginLeft: 6 },
  adminNote: { color: colors.muted, fontSize: 12, marginTop: 10 },
  mineCard: { marginTop: 14, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, padding: 14 },
  mineHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  mineTitle: { color: colors.burgundy, fontWeight: '700', fontSize: 14 },
  mineComment: { color: colors.textStrong, fontSize: 14, lineHeight: 20, marginTop: 8, fontStyle: 'italic' },
  mineActions: { flexDirection: 'row', marginTop: 12 },
  reviewInput: { marginTop: 12, minHeight: 72, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.textStrong, textAlignVertical: 'top' },
  reviewRow: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.line },
  reviewAvatar: { width: 36, height: 36, marginRight: 12 },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reviewName: { color: colors.textStrong, fontWeight: '700', fontSize: 14 },
  reviewTime: { color: colors.muted, fontSize: 11 },
  reviewComment: { color: colors.text, fontSize: 14, lineHeight: 20, marginTop: 6 },
  removeLink: { marginTop: 6, alignSelf: 'flex-start' },
  removeLinkText: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  hero: { height: 480, borderRadius: radius.xl, overflow: 'hidden', justifyContent: 'space-between', marginTop: 8, backgroundColor: colors.burgundySoft, ...shadow.card },
  heroImage: { borderRadius: radius.xl, resizeMode: 'cover' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  heroCopy: { paddingHorizontal: 18, paddingBottom: 18, paddingTop: 50 },
  heroHead: { flexDirection: 'row', alignItems: 'flex-end' },
  genre: { color: '#FFD3DA', fontWeight: '700', fontSize: 11, letterSpacing: 1 },
  name: { fontFamily: fonts.serif, fontSize: 34, color: colors.white, fontWeight: '700', marginTop: 2 },
  legal: { color: '#FBD5D9', fontSize: 13, marginTop: 10 },
  tagline: { color: colors.white, fontSize: 14, marginTop: 6, fontWeight: '600' },
  detail: { color: '#FFE8EA', fontSize: 13, lineHeight: 20, marginTop: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  reviews: { color: '#FBD5D9', fontSize: 12, marginLeft: 8, fontWeight: '600' },
  recordId: { color: colors.white, fontWeight: '700', fontSize: 12, letterSpacing: 1, backgroundColor: 'rgba(50,0,15,0.55)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5, overflow: 'hidden' },
  actions: { flexDirection: 'row', marginTop: 16 },
  pendingBanner: { marginTop: 16, backgroundColor: colors.warningSoft, borderRadius: radius.lg, padding: 16, borderWidth: 1, borderColor: '#F3DFA6' },
  pendingTitle: { color: colors.warning, fontWeight: '700', fontSize: 15 },
  pendingBody: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 4 },
  signInHint: { alignItems: 'center', paddingVertical: 12 },
  signInHintText: { color: colors.rose, fontSize: 12, fontWeight: '600' },
  section: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20, marginTop: 16, ...shadow.card },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 22, color: colors.burgundy, fontWeight: '700', marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24, color: colors.textStrong },
  metrics: { flexDirection: 'row', marginTop: 16 },
  metric: { flex: 1, backgroundColor: colors.blush, borderRadius: radius.md, padding: 10, alignItems: 'center', marginHorizontal: 3 },
  metricValue: { fontFamily: fonts.serif, fontSize: 20, color: colors.burgundy, fontWeight: '700' },
  metricLabel: { fontSize: 11, color: colors.text, textAlign: 'center', marginTop: 3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  note: { backgroundColor: colors.blush, borderRadius: radius.md, padding: 14, marginTop: 10 },
  noteTitle: { color: colors.burgundy, fontSize: 14, fontWeight: '700' },
  noteText: { color: colors.text, fontSize: 14, marginTop: 3 },
  listRow: { borderBottomWidth: 1, borderColor: colors.line, paddingVertical: 12 },
  listTitle: { fontFamily: fonts.serif, fontSize: 18, color: colors.textStrong },
  listSub: { color: colors.rose, fontSize: 12, marginTop: 3 },
  emptyRow: { color: colors.muted, fontSize: 14 },
  recordMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingHorizontal: 4 },
  recordMetaText: { color: colors.muted, fontSize: 12 },
});
