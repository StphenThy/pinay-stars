import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import { Avatar, Button, Chip, Kicker } from '../components/ui';
import { colors, radius, shadow, statusMeta, fonts } from '../theme';
import { BIO_LIMIT, GENRES, STATUSES, emptyForm, formFromActress, validateForm } from '../data/actressModel';

function Field({ label, required, hint, error, children }) {
  return (
    <View style={s.field}>
      <Text style={s.label}>{label}{required ? <Text style={s.required}> *</Text> : null}</Text>
      {children}
      {error ? <Text style={s.error}>{error}</Text> : hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

function Input({ value, onChangeText, placeholder, multiline, lines = 1, error, ...rest }) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.muted}
      multiline={multiline}
      numberOfLines={multiline ? lines : 1}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[s.input, multiline && { minHeight: 24 * lines + 24 }, error && s.inputError]}
      {...rest}
    />
  );
}

export default function ActressFormScreen({ mode, actress, busy, onSave, onCancel }) {
  const editing = mode === 'edit' && actress;
  const suggesting = mode === 'suggest';
  const [form, setForm] = useState(() => (editing ? formFromActress(actress) : { ...emptyForm(), status: suggesting ? 'review' : 'active' }));
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(false);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const toggleGenre = g => set('genres', form.genres.includes(g) ? form.genres.filter(x => x !== g) : [...form.genres, g]);

  const genreOptions = useMemo(() => {
    const extra = form.genres.filter(g => !GENRES.includes(g));
    return [...GENRES, ...extra];
  }, [form.genres]);

  const submit = status => {
    const next = { ...form, status: status || form.status };
    const found = validateForm(next);
    setErrors(found);
    setTouched(true);
    if (Object.keys(found).length) return;
    onSave(next);
  };

  const bioCount = form.biography.length;
  const isDraft = form.status === 'draft';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.page} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader
          section={suggesting ? 'SUGGEST' : 'MANAGE'}
          onBack={onCancel}
          backLabel={editing ? 'Back to Profile' : 'Cancel'}
          right={isDraft ? <View style={s.draftPill}><Text style={s.draftPillText}>DRAFT</Text></View> : <View />}
        />

        <View style={s.intro}>
          <Kicker>{editing ? 'ADMIN EDITING MODE' : suggesting ? 'COMMUNITY SUBMISSION' : 'CASTING REGISTRY DOSSIER'}</Kicker>
          <Text style={s.title}>{editing ? 'Edit Actress Record' : suggesting ? 'Suggest an Actress' : 'Add New Actress'}</Text>
          <Text style={s.lead}>
            {editing
              ? <>Updating record <Text style={s.leadStrong}>#{actress.displayId} ({actress.stageName})</Text>. Changes will immediately reflect across the public directory.</>
              : suggesting
                ? 'Know a Filipina artist who belongs in the archive? Fill in what you can. An administrator will review your suggestion before it appears in the public directory.'
                : 'Register a new Filipina artist into the official Pinay Stars entertainment database. Please provide accurate filmography and accredited background.'}
          </Text>
        </View>

        <View style={s.card}>
          <Field label="Primary Headshot" required={false} hint="Paste a direct image link (JPG or PNG). A 3:4 studio portrait works best." error={errors.image}>
            <View style={s.headshotRow}>
              <Avatar uri={form.image.trim()} name={form.stageName || form.name} style={s.headshot} rounded={radius.md} />
              <View style={{ flex: 1 }}>
                <Input value={form.image} onChangeText={v => set('image', v)} placeholder="https://…/headshot.jpg" autoCapitalize="none" autoCorrect={false} keyboardType="url" error={errors.image} />
                <Text style={s.headshotNote}>{form.image.trim() ? 'Preview updates as you type.' : 'No photo yet — initials will be shown.'}</Text>
              </View>
            </View>
          </Field>

          <Field label="Full Legal Name" required hint="Official record as recognized by guild registries." error={errors.name}>
            <Input value={form.name} onChangeText={v => set('name', v)} placeholder="e.g. Kathryn Chandria Manuel Bernardo" error={errors.name} />
          </Field>

          <Field label="Stage Name" required hint="Public marquee and billings designation. Leave blank to use the legal name." error={errors.stageName}>
            <Input value={form.stageName} onChangeText={v => set('stageName', v)} placeholder="e.g. Kathryn Bernardo" error={errors.stageName} />
          </Field>

          <Field label="Birth Date" required hint="Month Day, Year (e.g. March 26, 1996)" error={errors.birthday}>
            <Input value={form.birthday} onChangeText={v => set('birthday', v)} placeholder="March 26, 1996" error={errors.birthday} />
          </Field>

          <Field label="Birthplace" hint="City and province, as recorded.">
            <Input value={form.birthplace} onChangeText={v => set('birthplace', v)} placeholder="e.g. Cabanatuan, Nueva Ecija" />
          </Field>

          <Field label="Biography" required error={errors.biography} hint="Concise editorial narrative celebrating milestones.">
            <Input
              value={form.biography}
              onChangeText={v => set('biography', v.slice(0, BIO_LIMIT))}
              placeholder="Enter comprehensive career biography, early life, and artistic highlights..."
              multiline
              lines={5}
              error={errors.biography}
            />
            <Text style={[s.counter, bioCount >= BIO_LIMIT && { color: colors.danger }]}>{bioCount} / {BIO_LIMIT}</Text>
          </Field>

          <Field label="Acting Genre(s)" required hint="Select all that apply" error={errors.genres}>
            <View style={s.chips}>
              {genreOptions.map(g => (
                <View key={g} style={s.chipWrap}>
                  <Chip label={g} active={form.genres.includes(g)} onPress={() => toggleGenre(g)} small />
                </View>
              ))}
            </View>
          </Field>

          <Field label="Notable Feature Films" hint="One title per line. Box office blockbusters and independent critical triumphs.">
            <Input value={form.films} onChangeText={v => set('films', v)} placeholder={'Hello, Love, Goodbye\nA Very Good Girl'} multiline lines={4} />
          </Field>

          <Field label="Notable Television Series" hint="One title per line. Primetime teleseryes and streaming releases.">
            <Input value={form.tvSeries} onChangeText={v => set('tvSeries', v)} placeholder={"2 Good 2 Be True\nPangako Sa 'Yo"} multiline lines={3} />
          </Field>

          <Field label="Awards & Guild Honors" hint="One citation per line. Formal citations and lifetime industry recognitions.">
            <Input value={form.awards} onChangeText={v => set('awards', v)} placeholder={'FAMAS Best Actress\nGawad Urian\nBox Office Queen'} multiline lines={3} />
          </Field>

          <Field label="Career Era / Years Active" hint="e.g. 2003–Present (21 Years)">
            <Input value={form.yearsActive} onChangeText={v => set('yearsActive', v)} placeholder="2003–Present (21 Years)" />
          </Field>

          <Field label="Representation / Agency" hint="Talent management or network affiliation.">
            <Input value={form.agency} onChangeText={v => set('agency', v)} placeholder="e.g. Star Magic" />
          </Field>

          <Field label="Occupation">
            <Input value={form.occupation} onChangeText={v => set('occupation', v)} placeholder="Actress" />
          </Field>

          {!suggesting ? (
            <Field label="Registry Status" hint={statusMeta[form.status] ? `Currently: ${statusMeta[form.status].label}` : undefined}>
              <View style={s.chips}>
                {STATUSES.map(st => (
                  <View key={st.key} style={s.chipWrap}>
                    <Chip label={st.label} active={form.status === st.key} onPress={() => set('status', st.key)} small />
                  </View>
                ))}
              </View>
            </Field>
          ) : null}
        </View>

        {touched && Object.keys(errors).length ? (
          <Text style={s.formError}>Please fix the highlighted fields before saving.</Text>
        ) : (
          <Text style={s.formNote}>All required fields marked with an asterisk (*) are validated.</Text>
        )}

        <View style={s.actions}>
          <Button
            label={busy ? (suggesting ? 'Submitting…' : 'Saving…') : editing ? 'Save Changes' : suggesting ? 'Submit for Review' : 'Save Actress to Database'}
            onPress={() => submit(suggesting ? 'review' : form.status === 'draft' ? 'active' : undefined)}
            disabled={busy}
          />
          {!suggesting && (!editing || isDraft) ? (
            <Button label={busy ? 'Saving…' : 'Save as Draft'} variant="secondary" onPress={() => submit('draft')} disabled={busy} style={{ marginTop: 10 }} />
          ) : null}
          <Pressable onPress={onCancel} disabled={busy} style={s.cancel}>
            <Text style={s.cancelText}>{editing ? 'Cancel' : 'Cancel & Discard'}</Text>
          </Pressable>
        </View>

        <Text style={s.footnote}>
          {editing
            ? "Tap 'Save Changes' to update the registry and return to the verified profile."
            : suggesting
              ? 'Your suggestion is sent to the casting administrators. It will not appear publicly until it is approved.'
              : 'Saving publishes the record to the live directory immediately.'}
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  page: { paddingBottom: 40 },
  draftPill: { backgroundColor: colors.warningSoft, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6 },
  draftPillText: { color: colors.warning, fontWeight: '700', fontSize: 10, letterSpacing: 1 },
  intro: { paddingHorizontal: 20, paddingTop: 4 },
  title: { fontFamily: fonts.serif, fontWeight: '700', fontSize: 30, color: colors.burgundy, marginTop: 6 },
  lead: { color: colors.text, fontSize: 14, lineHeight: 21, marginTop: 8 },
  leadStrong: { fontWeight: '700', color: colors.burgundy },
  card: { margin: 20, backgroundColor: colors.white, borderRadius: radius.lg, padding: 18, ...shadow.card },
  field: { marginBottom: 18 },
  label: { color: colors.burgundy, fontWeight: '700', fontSize: 14, marginBottom: 8 },
  required: { color: colors.danger },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6, lineHeight: 17 },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, fontWeight: '600' },
  input: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.line, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.textStrong },
  inputError: { borderColor: colors.danger },
  headshotRow: { flexDirection: 'row', alignItems: 'flex-start' },
  headshot: { width: 84, height: 112, marginRight: 12 },
  headshotNote: { color: colors.muted, fontSize: 12, marginTop: 6 },
  counter: { alignSelf: 'flex-end', color: colors.muted, fontSize: 12, marginTop: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  chipWrap: { marginRight: 8, marginBottom: 8 },
  formError: { marginHorizontal: 20, color: colors.danger, fontWeight: '600', fontSize: 13, textAlign: 'center' },
  formNote: { marginHorizontal: 20, color: colors.muted, fontSize: 12, textAlign: 'center' },
  actions: { marginHorizontal: 20, marginTop: 14 },
  cancel: { alignItems: 'center', paddingVertical: 14 },
  cancelText: { color: colors.rose, fontWeight: '700', fontSize: 14 },
  footnote: { marginHorizontal: 32, color: colors.muted, fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
