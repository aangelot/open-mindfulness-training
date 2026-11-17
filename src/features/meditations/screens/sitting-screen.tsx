import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { book } from '@/core/book/content';
import { PROGRAM } from '@/core/program';
import { spacing, useTheme } from '@/core/theme';
import { BackLink, Button, Chip, Screen, Text } from '@/ui';

import { RefBadge } from '../components/ref-badge';
import { formatDuration, openBookSection, sittingTitle } from '../format';
import { playSitting } from '../play';
import { practiceClips } from '../practice-audio';
import { TARGET_MINUTES, composeSitting, getSittingSession, type TargetMinutes } from '../sitting-sessions';

/** The book's "pratique type" page of a step. */
const sittingSectionId = (week: number) =>
  book.parts.find((p) => p.step === week)?.sections.find((s) => s.kind === 'pratique-type')?.id;

export function SittingScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [minutes, setMinutes] = useState<TargetMinutes>(30);
  const def = getSittingSession(id);
  const back = <BackLink label={t('meditations.title')} fallback="/meditations" />;
  if (!def) {
    return (
      <Screen header={back}>
        <Text>{t('meditations.sitting.notFound')}</Text>
      </Screen>
    );
  }

  const session = composeSitting(def, minutes, practiceClips);
  const included = new Set(session.steps.map((s) => s.ref));
  const omitted = def.steps.filter((s) => !included.has(s.ref)).map((s) => s.ref);
  const sectionId = sittingSectionId(def.week);

  return (
    <Screen header={back} title={sittingTitle(def)} subtitle={def.group ? PROGRAM[def.week - 1].title : undefined}>
      <View style={styles.block}>
        <Text variant="label" color="textMuted">
          {t('meditations.sitting.duration').toUpperCase()}
        </Text>
        <View style={styles.chips}>
          {TARGET_MINUTES.map((m) => (
            <Chip key={m} label={t('meditations.sitting.minutes', { n: m })} selected={m === minutes} onPress={() => setMinutes(m)} />
          ))}
        </View>
      </View>
      <Button label={t('meditations.sitting.start', { n: minutes })} icon="play_arrow" iosIcon="play.fill" onPress={() => playSitting(def, minutes)} />

      <View style={styles.block}>
        <Text variant="subtitle" color="heading">
          {t('meditations.sitting.composition')}
        </Text>
        <Text variant="small" color="textMuted">
          {t('meditations.sitting.explain')}
        </Text>
      </View>

      <View style={[styles.list, { borderColor: colors.border }]}>
        {session.introSeconds > 0 ? (
          <Row title={t('meditations.sitting.introPart')} detail={t('meditations.sitting.silence', { duration: formatDuration(session.introSeconds) })} refName="E6" />
        ) : null}
        {session.steps.map((step) => (
          <Row
            key={step.ref}
            refName={step.ref}
            title={step.title}
            detail={
              step.guided
                ? [
                    t('meditations.sitting.voice', { duration: formatDuration(step.guideSeconds) }),
                    step.silenceSeconds >= 30 ? t('meditations.sitting.silence', { duration: formatDuration(step.silenceSeconds) }) : null,
                  ]
                    .filter(Boolean)
                    .join(' + ')
                : `${t('meditations.sitting.silence', { duration: formatDuration(step.silenceSeconds) })}. ${
                    def.steps.find((s) => s.ref === step.ref)?.silent ? t('meditations.sitting.settle') : t('meditations.sitting.noAudio')
                  }`
            }
          />
        ))}
        {session.conclusionSeconds > 0 ? (
          <Row title={t('meditations.sitting.conclusionPart')} detail={t('meditations.sitting.silence', { duration: formatDuration(session.conclusionSeconds) })} />
        ) : null}
      </View>

      {def.selfContained ? (
        <Text variant="small" color="textMuted">
          {t('meditations.sitting.selfContained')}
        </Text>
      ) : null}
      {omitted.length > 0 ? (
        <Text variant="small" color="textMuted">
          {t('meditations.sitting.omitted', { count: omitted.length, refs: omitted.join(', ') })}
        </Text>
      ) : null}
      {sectionId ? (
        <Pressable accessibilityRole="link" onPress={() => openBookSection(sectionId)} hitSlop={6}>
          <Text color="link">{t('meditations.sitting.readInBook')}</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
}

function Row({ refName, title, detail }: { refName?: string; title: string; detail: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }]}>
      <View style={styles.ref}>{refName ? <RefBadge refName={refName} /> : null}</View>
      <View style={styles.grow}>
        <Text>{title}</Text>
        <Text variant="small" color="textMuted">
          {detail}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.sm },
  list: { borderTopWidth: StyleSheet.hairlineWidth },
  row: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth },
  ref: { minWidth: 44 },
  grow: { flex: 1, gap: 2 },
});
