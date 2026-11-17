import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { foundationSections, readingStatus, stepSections, type ReadingStatus } from '@/core/book/content';
import { useBookProgress } from '@/core/book/progress';
import { openBookSection } from '@/core/links';
import { spacing, useTheme } from '@/core/theme';
import { Button, Card, Icon, ProgressBar, Text } from '@/ui';

/** Before the first cycle: the introduction and chapters 1 and 2 are advised, not required. Hidden once read. */
export function FoundationsAdvice() {
  const { t } = useTranslation();
  const { readIds } = useBookProgress();
  const status = readingStatus(foundationSections, readIds);
  if (status.done) return null;
  return (
    <Card>
      <Text variant="label" color="primary">
        {t('journey.foundations.title').toUpperCase()}
      </Text>
      <Text>{t('journey.foundations.body')}</Text>
      <ProgressBar value={status.read / status.total} />
      <Text variant="small" color="textMuted">
        {t('journey.sectionsRead', { read: status.read, total: status.total })}
      </Text>
      <Button
        label={t(status.read === 0 ? 'journey.start.startReading' : 'journey.start.continueReading')}
        variant="secondary"
        icon="menu_book"
        iosIcon="book"
        onPress={() => openBookSection(status.next.section.id)}
      />
    </Card>
  );
}

/** "Lire l'étape n" with its progress, opening the first unread section in the Livre tab. */
export function ReadStepLink({ week }: { week: number }) {
  const { t } = useTranslation();
  const { readIds } = useBookProgress();
  const status = readingStatus(stepSections(week), readIds);
  return <ReadingRow label={t('journey.week.readInBook', { n: week })} status={status} />;
}

function ReadingRow({ label, status }: { label: string; status: ReadingStatus }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => openBookSection(status.next.section.id)}
      android_ripple={{ color: colors.border }}
      style={({ pressed }) => [styles.row, { backgroundColor: colors.surfaceAccent }, pressed && { opacity: 0.8 }]}>
      <Icon name={status.done ? 'check_circle' : 'menu_book'} ios={status.done ? 'checkmark.circle.fill' : 'book'} color={colors.primary} />
      <View style={styles.grow}>
        <Text variant="label" color="link">
          {label}
        </Text>
        <Text variant="small" color="textMuted">
          {t('journey.sectionsRead', { read: status.read, total: status.total })}
        </Text>
        {status.done ? null : <ProgressBar value={status.read / status.total} />}
      </View>
      <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 8 },
  grow: { flex: 1, gap: spacing.xs },
});
