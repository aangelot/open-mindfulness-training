import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { spacing } from '@/core/theme';
import { book } from '@/features/book/content';
import { Card, Screen, Text } from '@/ui';

export default function BookIndexScreen() {
  const { t } = useTranslation();
  return (
    <Screen title={t('book.title')}>
      {book.parts.map((part) => (
        <View key={part.id} style={{ gap: spacing.sm }}>
          <Text variant="subtitle" color="heading">
            {part.title}
          </Text>
          {part.sections.map((section) => (
            <Card key={section.id} onPress={() => router.push({ pathname: '/livre/[id]', params: { id: section.id } })}>
              {section.ref ? (
                <Text variant="label" color="primary">
                  {section.ref}
                </Text>
              ) : null}
              <Text>{section.title}</Text>
            </Card>
          ))}
        </View>
      ))}
    </Screen>
  );
}
