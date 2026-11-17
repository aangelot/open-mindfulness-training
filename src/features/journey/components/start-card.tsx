import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { useBookProgress } from '@/core/book/progress';
import { foundationSections, furtherSections, readingStatus } from '@/core/book/content';
import type { Cycle } from '@/core/cycle-store';
import { openBookSection, openCarnet } from '@/core/links';
import { spacing } from '@/core/theme';
import { Button, Card, StepRow, Text } from '@/ui';

/**
 * The path through the method when no cycle runs: read the foundations (introduction,
 * chapters 1 and 2), train for eight weeks with the carnet, then carry on (chapter 4, conclusion).
 */
export function StartCard({ cycles }: { cycles: readonly Cycle[] }) {
  const { t } = useTranslation();
  const { readIds } = useBookProgress();
  const foundations = readingStatus(foundationSections, readIds);
  const further = readingStatus(furtherSections, readIds);
  const completed = cycles.filter((c) => c.status === 'completed').length;
  const current = completed > 0 ? 3 : foundations.done ? 2 : 1;
  const ratio = (s: typeof foundations) => s.read / s.total;
  const readDetail = (s: typeof foundations) => t('journey.sectionsRead', { read: s.read, total: s.total });

  return (
    <Card>
      <Text variant="label" color="primary">
        {t(current === 1 ? 'journey.start.label' : 'journey.start.labelPath').toUpperCase()}
      </Text>
      {current === 1 ? <Text>{t('journey.start.intro')}</Text> : null}
      <View style={styles.steps}>
        <StepRow
          index={1}
          title={t('journey.start.discover')}
          detail={`${t('journey.start.discoverBody')} ${readDetail(foundations)}.`}
          progress={ratio(foundations)}
          done={foundations.done}
          current={current === 1}
          onPress={() => openBookSection(foundations.next.section.id)}>
          {current === 1 ? (
            <Button
              label={t(foundations.read === 0 ? 'journey.start.startReading' : 'journey.start.continueReading')}
              icon="menu_book"
              iosIcon="book"
              onPress={() => openBookSection(foundations.next.section.id)}
            />
          ) : null}
        </StepRow>
        <StepRow
          index={2}
          title={t('journey.start.train')}
          detail={completed > 0 ? t('journey.start.cyclesDone', { count: completed }) : t('journey.start.trainBody')}
          done={completed > 0}
          current={current === 2}
          onPress={openCarnet}>
          {current === 2 ? <Button label={t('journey.start.startCycle')} icon="play_arrow" iosIcon="play.fill" onPress={openCarnet} /> : null}
        </StepRow>
        <StepRow
          index={3}
          title={t('journey.start.continue')}
          detail={`${t('journey.start.continueBody')} ${readDetail(further)}.`}
          progress={current === 3 ? ratio(further) : undefined}
          done={further.done && completed > 0}
          current={current === 3}
          last
          onPress={() => openBookSection(further.next.section.id)}>
          {current === 3 ? (
            <Button label={t('journey.start.newCycle')} variant="secondary" icon="replay" iosIcon="arrow.counterclockwise" onPress={openCarnet} />
          ) : null}
        </StepRow>
      </View>
      {current === 1 ? (
        <Pressable accessibilityRole="link" onPress={openCarnet} hitSlop={8}>
          <Text variant="small" color="link">
            {t('journey.start.skip')}
          </Text>
        </Pressable>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  steps: { marginTop: spacing.sm },
});
