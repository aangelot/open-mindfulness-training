import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme';
import { Card, Screen, Text } from '@/ui';

export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <Screen>
      <View style={styles.hero}>
        <Image source={require('@/assets/images/logo-circle.png')} style={styles.logo} contentFit="contain" />
        <Text variant="title" color="heading" style={styles.center}>
          {t('home.title')}
        </Text>
        <Text color="textMuted" style={styles.center}>
          {t('home.subtitle')}
        </Text>
      </View>
      <Card onPress={() => router.navigate('/carnet')}>
        <Text variant="subtitle">{t('carnet.title')}</Text>
      </Card>
      <Card onPress={() => router.navigate('/meditations')}>
        <Text variant="subtitle">{t('meditations.title')}</Text>
      </Card>
      <Card onPress={() => router.navigate('/livre')}>
        <Text variant="subtitle">{t('book.title')}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  logo: { width: 120, height: 120 },
  center: { textAlign: 'center' },
});
