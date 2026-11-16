import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { fontFamily, spacing, useTheme } from '@/core/theme';
import { Icon, Text } from '@/ui';

import { book, getSection } from '../content';
import type { Part, Section } from '../types';

export const openSection = (id: string) => router.push({ pathname: '/livre/[id]', params: { id } });

/** Table of contents: one collapsible group per part of the book. */
export function Toc({ readIds, lastOpenedId }: { readIds: ReadonlySet<string>; lastOpenedId: string | null }) {
  // The part being read starts expanded.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(() => {
    const part = lastOpenedId ? getSection(lastOpenedId)?.part.id : undefined;
    return new Set(part ? [part] : []);
  });
  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <View>
      {book.parts.map((part) => (
        <TocPart key={part.id} part={part} open={expanded.has(part.id)} onToggle={() => toggle(part.id)} readIds={readIds} />
      ))}
    </View>
  );
}

function TocPart({ part, open, onToggle, readIds }: { part: Part; open: boolean; onToggle: () => void; readIds: ReadonlySet<string> }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const read = part.sections.filter((s) => readIds.has(s.id)).length;
  return (
    <View style={[styles.part, { borderBottomColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={onToggle}
        android_ripple={{ color: colors.border }}
        style={styles.partHeader}>
        <View style={styles.grow}>
          <Text variant="body" color="heading" style={styles.partTitle}>
            {part.title}
          </Text>
          <Text variant="small" color="textMuted">
            {t('book.partProgress', { read, total: part.sections.length })}
          </Text>
        </View>
        <Icon name={open ? 'expand_less' : 'expand_more'} ios={open ? 'chevron.up' : 'chevron.down'} color={colors.textMuted} />
      </Pressable>
      {open ? part.sections.map((s) => <TocRow key={s.id} section={s} read={readIds.has(s.id)} />) : null}
    </View>
  );
}

function TocRow({ section, read }: { section: Section; read: boolean }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => openSection(section.id)}
      android_ripple={{ color: colors.border }}
      accessibilityHint={[section.audioUrl && t('book.hasAudio'), read && t('book.read')].filter(Boolean).join(', ') || undefined}
      style={styles.row}>
      <Text variant="label" color="primary" style={styles.ref}>
        {section.ref ?? ''}
      </Text>
      <Text style={styles.grow} color={read ? 'textMuted' : 'text'}>
        {section.title}
      </Text>
      {section.audioUrl ? <Icon name="headphones" ios="headphones" size={18} color={colors.primary} /> : null}
      {read ? <Icon name="check_circle" ios="checkmark.circle.fill" size={18} color={colors.heading} /> : <View style={styles.iconSlot} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  part: { borderBottomWidth: StyleSheet.hairlineWidth },
  partHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  partTitle: { fontFamily: fontFamily(600), fontWeight: '600' },
  grow: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingLeft: spacing.xs },
  ref: { width: 36 },
  iconSlot: { width: 18 },
});
