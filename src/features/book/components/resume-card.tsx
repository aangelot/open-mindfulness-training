import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/core/theme';
import { Card, Icon, Text } from '@/ui';

import { getSection } from '../content';
import { useBookProgress } from '../progress';
import { openSection } from './toc';

/** "Reprendre la lecture" on the last opened section. */
export function ResumeCard({ sectionId }: { sectionId: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const entry = getSection(sectionId);
  if (!entry) return null;
  return (
    <Card onPress={() => openSection(sectionId)}>
      <View style={styles.row}>
        <View style={styles.grow}>
          <Text variant="label" color="primary">
            {t('book.resume').toUpperCase()}
          </Text>
          <Text variant="subtitle">{entry.section.title}</Text>
          <Text variant="small" color="textMuted">
            {entry.part.title}
          </Text>
        </View>
        <Icon name="chevron_right" ios="chevron.right" color={colors.primary} />
      </View>
    </Card>
  );
}

/** Resume card for screens outside the book (home): renders nothing before the first reading. */
export function ResumeReading() {
  const { lastOpenedId } = useBookProgress();
  return lastOpenedId ? <ResumeCard sectionId={lastOpenedId} /> : null;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  grow: { flex: 1, gap: 2 },
});
