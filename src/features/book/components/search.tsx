import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { fontFamily, radius, spacing, typography, useTheme } from '@/core/theme';
import { Icon, Text } from '@/ui';

import { searchBook } from '../content';
import { openSection } from './toc';

export function SearchField({ value, onChange }: { value: string; onChange: (q: string) => void }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={[styles.field, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Icon name="search" ios="magnifyingglass" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={t('book.searchPlaceholder')}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        autoCorrect={false}
        style={[styles.input, { color: colors.text }]}
      />
      {value ? (
        <Pressable accessibilityLabel={t('book.clearSearch')} hitSlop={8} onPress={() => onChange('')}>
          <Icon name="close" ios="xmark" size={20} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

/** Search results, best (title) matches first. */
export function SearchResults({ query }: { query: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const hits = searchBook(query);

  if (hits.length === 0) {
    return <Text color="textMuted">{t('book.noResults', { query: query.trim() })}</Text>;
  }
  return (
    <View>
      <Text variant="small" color="textMuted">
        {t('book.resultsCount', { count: hits.length })}
      </Text>
      {hits.map(({ entry, snippet }) => (
        <Pressable
          key={entry.section.id}
          onPress={() => openSection(entry.section.id)}
          android_ripple={{ color: colors.border }}
          style={[styles.hit, { borderBottomColor: colors.border }]}>
          <Text variant="small" color="textMuted">
            {[entry.section.ref, entry.part.title].filter(Boolean).join(' · ')}
          </Text>
          <Text style={styles.hitTitle}>{entry.section.title}</Text>
          {snippet ? (
            <Text variant="small" color="textMuted">
              {snippet.before}
              <Text variant="small" style={[styles.match, { color: colors.text, backgroundColor: colors.surfaceAccent }]}>
                {snippet.match}
              </Text>
              {snippet.after}
            </Text>
          ) : null}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    minHeight: 44,
  },
  input: { flex: 1, ...typography.body, fontFamily: fontFamily(400), paddingVertical: spacing.sm },
  hit: { paddingVertical: spacing.md, gap: 2, borderBottomWidth: StyleSheet.hairlineWidth },
  hitTitle: { fontFamily: fontFamily(600), fontWeight: '600' },
  match: { fontFamily: fontFamily(700), fontWeight: '700' },
});
