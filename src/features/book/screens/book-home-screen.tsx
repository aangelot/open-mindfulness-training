import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { spacing } from '@/core/theme';
import { Screen, Text } from '@/ui';

import { ResumeCard } from '../components/resume-card';
import { SearchField, SearchResults } from '../components/search';
import { Toc } from '../components/toc';
import { readingOrder } from '@/core/book/content';
import { useBookProgress } from '@/core/book/progress';

const MIN_QUERY = 2;

export function BookHomeScreen() {
  const { t } = useTranslation();
  const { readIds, lastOpenedId } = useBookProgress();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const searching = deferredQuery.trim().length >= MIN_QUERY;

  return (
    <Screen title={t('book.title')}>
      <SearchField value={query} onChange={setQuery} />
      {searching ? (
        <SearchResults query={deferredQuery} />
      ) : (
        <View style={{ gap: spacing.md }}>
          {lastOpenedId ? <ResumeCard sectionId={lastOpenedId} /> : null}
          <Text variant="small" color="textMuted">
            {t('book.readCount', { read: readIds.size, total: readingOrder.length })}
          </Text>
          {/* Keyed so the part being read is expanded once progress has loaded. */}
          <Toc key={lastOpenedId ?? 'none'} readIds={readIds} lastOpenedId={lastOpenedId} />
        </View>
      )}
    </Screen>
  );
}
