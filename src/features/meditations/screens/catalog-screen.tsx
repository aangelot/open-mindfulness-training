import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/core/theme';
import { BackLink, Chip, Icon, Screen, Text } from '@/ui';

import { filterCatalog, type CatalogEntry, type CatalogFilter } from '../catalog';
import { formatClock } from '../format';
import { playBookAudio } from '../play';

const FILTERS: CatalogFilter[] = ['pratiques', 'exposes', 'all'];

/** Every audio of the book, by part; a tap plays it in the session player. */
export function CatalogScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [filter, setFilter] = useState<CatalogFilter>('pratiques');
  const groups = filterCatalog(filter);
  const count = groups.reduce((sum, g) => sum + g.entries.length, 0);

  return (
    <Screen header={<BackLink label={t('meditations.title')} fallback="/meditations" />} title={t('meditations.catalog.title')}>
      <View style={styles.chips}>
        {FILTERS.map((f) => (
          <Chip key={f} label={t(`meditations.catalog.filters.${f}`)} selected={f === filter} onPress={() => setFilter(f)} />
        ))}
      </View>
      <Text variant="small" color="textMuted">
        {t('meditations.catalog.count', { count })}
      </Text>
      {groups.map((group) => (
        <View key={group.part.id} style={styles.group}>
          <Text variant="label" color="heading" style={[styles.partTitle, { borderBottomColor: colors.border }]}>
            {group.part.title.toUpperCase()}
          </Text>
          {group.entries.map((entry) => (
            <Row key={entry.section.id} entry={entry} />
          ))}
        </View>
      ))}
    </Screen>
  );
}

function Row({ entry }: { entry: CatalogEntry }) {
  const { colors } = useTheme();
  const { section, seconds } = entry;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => playBookAudio(section)}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}>
      <Text variant="label" color="primary" style={styles.ref}>
        {section.ref ?? ''}
      </Text>
      <Text style={styles.grow}>{section.title}</Text>
      <Text variant="small" color="textMuted">
        {formatClock(seconds)}
      </Text>
      <Icon name="play_circle" ios="play.circle" size={22} color={colors.primary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  group: { gap: 2 },
  partTitle: { paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  ref: { minWidth: 36 },
  grow: { flex: 1 },
});
