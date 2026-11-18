/**
 * Small charts drawn with Views (no chart library): stat tiles, weekly bars, the practice
 * calendar and the reminder ratings. One hue (the brand blue); tapping a mark shows its value.
 */
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';

import { parseLocalDate } from '@/core/cycle';
import { formatDuration } from '@/core/format';
import { radius, spacing, useTheme } from '@/core/theme';
import { Text } from '@/ui';

import { CALENDAR_LEVELS, scoreRating, type CalendarDay, type WeekTotal } from '../stats';

// --- Tiles -------------------------------------------------------------------

export function StatTiles({ tiles }: { tiles: { value: string; label: string }[] }) {
  const { colors } = useTheme();
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => (
        <View key={tile.label} style={[styles.tile, { flexBasis: tiles.length === 4 ? '45%' : '30%', backgroundColor: colors.surfaceAccent }]}>
          <Text variant="subtitle" color="text">
            {tile.value}
          </Text>
          <Text variant="small" color="textMuted">
            {tile.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// --- Weekly minutes ------------------------------------------------------------

const BAR_AREA = 120;

const shortDate = (date: string) => parseLocalDate(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

/** Minutes per week, the current week last and selected by default. */
export function WeekBars({ weeks }: { weeks: WeekTotal[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selected, setSelected] = useState(weeks.length - 1);
  const max = Math.max(...weeks.map((w) => w.seconds), 1);
  const week = weeks[selected];
  const isCurrent = selected === weeks.length - 1;

  return (
    <View style={styles.chart}>
      <Text variant="small">
        {isCurrent ? t('profile.stats.thisWeek') : t('profile.stats.weekOf', { date: shortDate(week.start) })}
        {' : '}
        <Text variant="small" style={styles.strong}>
          {week.seconds ? formatDuration(week.seconds) : t('profile.stats.none')}
        </Text>
      </Text>
      <View style={[styles.bars, styles.baseline, { height: BAR_AREA, borderBottomColor: colors.border }]}>
        {weeks.map((w, i) => {
          const label = `${i === weeks.length - 1 ? t('profile.stats.thisWeek') : t('profile.stats.weekOf', { date: shortDate(w.start) })} : ${formatDuration(w.seconds)}`;
          return (
            <Pressable
              key={w.start}
              accessibilityRole="button"
              accessibilityLabel={label}
              accessibilityState={{ selected: i === selected }}
              onPress={() => setSelected(i)}
              style={styles.barSlot}>
              <View
                style={[
                  styles.bar,
                  {
                    height: w.seconds ? Math.max(3, (w.seconds / max) * BAR_AREA) : 0,
                    backgroundColor: colors.primary,
                    opacity: i === selected ? 1 : 0.45,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.axis}>
        <Text variant="small" color="textMuted">
          {shortDate(weeks[0].start)}
        </Text>
        <Text variant="small" color="textMuted">
          {t('profile.stats.thisWeek')}
        </Text>
      </View>
    </View>
  );
}

// --- Calendar ----------------------------------------------------------------

const LEVEL_OPACITY = [0, 0.3, 0.55, 0.8, 1] as const;
const MONTHS_HEIGHT = 12;

const longDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

/** Weeks shown at once; older ones are reached by scrolling left. */
const VISIBLE_WEEKS = 20;
const CELL_GAP = 3;

/** Month under which a week column is labelled: the one starting during that week. */
function monthLabel(week: CalendarDay[]): string | null {
  const first = week.find((d) => d.date.endsWith('-01'));
  if (!first) return null;
  const date = parseLocalDate(first.date);
  const month = date.toLocaleDateString('fr-FR', { month: 'short' });
  return date.getMonth() === 0 ? `${month} ${date.getFullYear()}` : month;
}

/**
 * One column per week (Monday at the top), one square per day, darker with more practice.
 * Opens on the current week; scrolls horizontally back to the first session.
 */
export function PracticeCalendar({ weeks }: { weeks: CalendarDay[][] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const [width, setWidth] = useState(0);
  const scroll = useRef<ScrollViewInstance>(null);
  const days = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  const cell = width ? (width - (VISIBLE_WEEKS - 1) * CELL_GAP) / VISIBLE_WEEKS : 0;
  const cellColor = (level: CalendarDay['level']) => (level ? colors.primary : colors.border);

  return (
    <View style={styles.chart}>
      <View style={styles.calendar}>
        <View style={[styles.calColumn, styles.dayLabels]}>
          {days.map((d, i) => (
            <View key={i} style={[styles.dayLabel, { height: cell }]}>
              <Text variant="label" color="textMuted" style={styles.tiny}>
                {i % 2 === 0 ? d : ''}
              </Text>
            </View>
          ))}
        </View>
        <ScrollView
          ref={scroll}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.grow}
          onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
          onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
          {cell > 0 && (
            <View style={styles.calColumn}>
              <View style={styles.months}>
                {weeks.map((week, i) => {
                  const label = monthLabel(week);
                  return label ? (
                    <Text
                      key={week[0].date}
                      variant="label"
                      color="textMuted"
                      numberOfLines={1}
                      style={[styles.tiny, styles.month, { left: i * (cell + CELL_GAP) }]}>
                      {label}
                    </Text>
                  ) : null;
                })}
              </View>
              <View style={styles.calendar}>
                {weeks.map((week) => (
                  <View key={week[0].date} style={styles.calColumn}>
                    {week.map((day) =>
                      day.level === null ? (
                        <View key={day.date} style={{ width: cell, height: cell }} />
                      ) : (
                        <Pressable
                          key={day.date}
                          accessibilityRole="button"
                          accessibilityLabel={`${longDate(day.date)} : ${day.seconds ? formatDuration(day.seconds) : t('profile.stats.none')}`}
                          onPress={() => setSelected(day)}
                          hitSlop={2}
                          style={[
                            styles.cell,
                            {
                              width: cell,
                              height: cell,
                              backgroundColor: cellColor(day.level),
                              opacity: day.level ? LEVEL_OPACITY[day.level] : 1,
                              borderColor: colors.text,
                              borderWidth: selected?.date === day.date ? 1.5 : 0,
                            },
                          ]}
                        />
                      ),
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
      <View style={styles.legend}>
        <Text variant="small" color="textMuted" style={styles.grow}>
          {selected
            ? `${longDate(selected.date)} : ${selected.seconds ? formatDuration(selected.seconds) : t('profile.stats.none')}`
            : t('profile.stats.calendarHint')}
        </Text>
        <Text variant="small" color="textMuted">
          {t('profile.stats.less')}
        </Text>
        {LEVEL_OPACITY.map((opacity, level) => (
          <View
            key={level}
            accessibilityLabel={level ? t('profile.stats.levelFrom', { minutes: CALENDAR_LEVELS[level - 1] }) : undefined}
            style={[styles.legendCell, { backgroundColor: cellColor(level as CalendarDay['level']), opacity: level ? opacity : 1 }]}
          />
        ))}
        <Text variant="small" color="textMuted">
          {t('profile.stats.more')}
        </Text>
      </View>
    </View>
  );
}

// --- Reminder ratings ------------------------------------------------------------

const RATING_AREA = 90;

/** Average A–E rating per week of a cycle: the letter above each bar. */
export function RatingBars({ averages }: { averages: (number | null)[] }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={styles.chart}>
      <View style={[styles.bars, styles.baseline, styles.ratingBars, { borderBottomColor: colors.border }]}>
        {averages.map((avg, i) => (
          <View
            key={i}
            accessible
            accessibilityLabel={
              avg === null
                ? t('profile.stats.ratingNone', { week: i + 1 })
                : t('profile.stats.ratingWeek', { week: i + 1, rating: scoreRating(avg) })
            }
            style={styles.barSlot}>
            <Text variant="label" color={avg === null ? 'textMuted' : 'text'}>
              {avg === null ? '–' : scoreRating(avg)}
            </Text>
            <View style={[styles.bar, { height: avg === null ? 0 : (avg / 5) * RATING_AREA, backgroundColor: colors.primary }]} />
          </View>
        ))}
      </View>
      <View style={styles.bars}>
        {averages.map((_, i) => (
          <Text key={i} variant="small" color="textMuted" style={styles.weekLabel}>
            {t('profile.stats.weekShort', { n: i + 1 })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { flexGrow: 1, minWidth: 96, borderRadius: radius.md, padding: spacing.sm, gap: 2 },
  chart: { gap: spacing.sm },
  strong: { fontWeight: '600' },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  baseline: { borderBottomWidth: StyleSheet.hairlineWidth },
  ratingBars: { height: RATING_AREA + 22 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 2 },
  bar: { width: '100%', maxWidth: 28, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  axis: { flexDirection: 'row', justifyContent: 'space-between' },
  calendar: { flexDirection: 'row', gap: CELL_GAP },
  calColumn: { gap: CELL_GAP },
  grow: { flex: 1 },
  cell: { borderRadius: 2 },
  dayLabels: { paddingTop: MONTHS_HEIGHT + CELL_GAP },
  dayLabel: { justifyContent: 'center', minWidth: 12 },
  months: { height: MONTHS_HEIGHT },
  month: { position: 'absolute', top: 0, width: 80 },
  tiny: { fontSize: 10, lineHeight: 12 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  weekLabel: { flex: 1, textAlign: 'center' },
});
