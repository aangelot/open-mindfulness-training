import { Linking, StyleSheet, View } from 'react-native';

import { spacing, useTheme } from '@/core/theme';
import { Text } from '@/ui';

import type { Block, Inline, Section } from '../types';

/** Minimal renderer for book blocks. Typography and audio come in the "Livre" phase. */
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
  switch (block.type) {
    case 'heading':
      return (
        <Text variant="subtitle" color="heading">
          <Inlines runs={block.inlines} />
        </Text>
      );
    case 'paragraph':
      return (
        <Text>
          <Inlines runs={block.inlines} />
        </Text>
      );
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, i) => (
            <Text key={i}>
              {block.ordered ? `${i + 1}. ` : '• '}
              <Inlines runs={item} />
            </Text>
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
      style={[run.bold && styles.bold, run.italic && styles.italic, run.href ? { color: colors.link } : null]}
      onPress={run.href ? () => Linking.openURL(run.href!) : undefined}>
      {run.text}
    </Text>
  ));
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  list: { gap: spacing.sm, paddingLeft: spacing.sm },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
});
