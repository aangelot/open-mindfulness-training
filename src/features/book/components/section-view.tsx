import { Linking, StyleSheet, View } from 'react-native';

import { fontFamily, spacing, useTheme } from '@/core/theme';
import { Text } from '@/ui';

import type { Block, Inline, Section } from '@/core/book/types';

/** Renders the structured blocks of a book section. */
export function SectionView({ section }: { section: Section }) {
  return (
    <View style={styles.body}>
      {section.blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </View>
  );
}

function BlockView({ block }: { block: Block }) {
  const { colors } = useTheme();
  switch (block.type) {
    case 'heading':
      return (
        <Text
          variant={block.level === 3 ? 'subtitle' : 'body'}
          color="heading"
          accessibilityRole="header"
          style={[styles.heading, block.level === 4 && styles.h4]}>
          <Inlines runs={block.inlines} />
        </Text>
      );
    case 'paragraph':
      return (
        <Text selectable>
          <Inlines runs={block.inlines} />
        </Text>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <View key={i} style={styles.item}>
              <Text style={[styles.marker, { color: colors.primary }]}>{block.ordered ? `${i + 1}.` : '•'}</Text>
              <Text selectable style={styles.itemText}>
                <Inlines runs={item} />
              </Text>
            </View>
          ))}
        </View>
      );
  }
}

function Inlines({ runs }: { runs: Inline[] }) {
  const { colors } = useTheme();
  return runs.map((run, i) => (
    <Text
      key={i}
      style={[
        run.bold && styles.bold,
        run.italic && styles.italic,
        run.href ? { color: colors.link, textDecorationLine: 'underline' } : null,
      ]}
      onPress={run.href ? () => Linking.openURL(run.href!) : undefined}>
      {run.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  heading: { marginTop: spacing.sm },
  h4: { fontFamily: fontFamily(600), fontWeight: '600' },
  list: { gap: spacing.sm },
  item: { flexDirection: 'row', gap: spacing.sm, paddingLeft: spacing.xs },
  marker: { minWidth: 16 },
  itemText: { flex: 1 },
  bold: { fontFamily: fontFamily(700), fontWeight: '700' },
  italic: { fontFamily: fontFamily(400, true), fontStyle: 'italic' },
});
