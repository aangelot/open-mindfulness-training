import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { AudioPlayerBar } from '@/core/audio/player-bar';
import { spacing, useTheme } from '@/core/theme';
import { Card, Icon, Screen, Text } from '@/ui';

import { SectionView } from '../components/section-view';
import { getNeighbors, getSection, refLabel, type SectionEntry } from '../content';
import { markOpened, markRead } from '../progress';

/** Distance from the bottom (px) at which the section counts as read. */
const READ_THRESHOLD = 120;

export function SectionScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const entry = getSection(id);
  const { prev, next } = getNeighbors(id);
  const readMarked = useRef(false);
  const viewport = useRef(0);
  const content = useRef(0);

  useEffect(() => {
    readMarked.current = false;
    if (entry) void markOpened(id);
  }, [id, entry]);

  const maybeMarkRead = (visibleBottom: number, contentHeight: number) => {
    if (readMarked.current || contentHeight === 0 || visibleBottom < contentHeight - READ_THRESHOLD) return;
    readMarked.current = true;
    void markRead(id);
  };

  if (!entry) {
    return (
      <Screen header={<BackLink />}>
        <Text>{t('book.notFound')}</Text>
      </Screen>
    );
  }
  const { section, part } = entry;

  return (
    <Screen
      header={<BackLink />}
      title={section.title}
      subtitle={[section.ref && refLabel(section.ref), part.title].filter(Boolean).join(' · ')}
      scrollProps={{
        scrollEventThrottle: 200,
        // A short section fits on screen: displaying it is reading it.
        onLayout: (e) => {
          viewport.current = e.nativeEvent.layout.height;
          maybeMarkRead(viewport.current, content.current);
        },
        onContentSizeChange: (_w, h) => {
          content.current = h;
          maybeMarkRead(viewport.current, h);
        },
        onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
          maybeMarkRead(contentOffset.y + layoutMeasurement.height, contentSize.height);
        },
      }}>
      {section.audioUrl ? <AudioPlayerBar key={section.id} url={section.audioUrl} title={section.title} /> : null}
      <SectionView section={section} />
      <View style={styles.nav}>
        {next ? <NeighborCard entry={next} label={t('book.next')} direction="next" /> : null}
        {prev ? <NeighborCard entry={prev} label={t('book.previous')} direction="prev" /> : null}
      </View>
    </Screen>
  );
}

function BackLink() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const back = () => (router.canGoBack() ? router.back() : router.replace('/livre'));
  return (
    <Pressable accessibilityRole="button" onPress={back} hitSlop={8} style={styles.back}>
      <Icon name="arrow_back" ios="chevron.left" size={20} color={colors.primary} />
      <Text variant="label" color="primary">
        {t('book.toc')}
      </Text>
    </Pressable>
  );
}

function NeighborCard({ entry, label, direction }: { entry: SectionEntry; label: string; direction: 'prev' | 'next' }) {
  const { colors } = useTheme();
  // Replace instead of push: reading the whole book must not stack 148 screens.
  const go = () => router.replace({ pathname: '/livre/[id]', params: { id: entry.section.id } });
  const icon = direction === 'next' ? <Icon name="arrow_forward" ios="arrow.right" color={colors.primary} /> : <Icon name="arrow_back" ios="arrow.left" color={colors.primary} />;
  return (
    <Card onPress={go}>
      <View style={styles.neighbor}>
        {direction === 'prev' ? icon : null}
        <View style={styles.grow}>
          <Text variant="label" color="primary">
            {label.toUpperCase()}
          </Text>
          <Text>{entry.section.title}</Text>
        </View>
        {direction === 'next' ? icon : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  back: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start' },
  nav: { gap: spacing.sm, marginTop: spacing.lg },
  neighbor: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: 2 },
});
