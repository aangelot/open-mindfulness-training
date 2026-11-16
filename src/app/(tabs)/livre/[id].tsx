import { useLocalSearchParams } from 'expo-router';

import { getSection } from '@/features/book/content';
import { SectionView } from '@/features/book/components/section-view';
import { Screen, Text } from '@/ui';

export default function BookSectionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = getSection(id);
  if (!entry) {
    return (
      <Screen>
        <Text>Section introuvable.</Text>
      </Screen>
    );
  }
  return (
    <Screen title={entry.section.title} subtitle={entry.part.title}>
      <SectionView section={entry.section} />
    </Screen>
  );
}
