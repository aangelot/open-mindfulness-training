import type { AndroidSymbol, SFSymbol } from 'expo-symbols';
import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { OfflineAudioOffer } from '@/core/audio/offline-audio-card';
import { spacing, useTheme } from '@/core/theme';
import { HomeJourney } from '@/features/journey/components/home-journey';
import { Card, Icon, Screen, Text } from '@/ui';

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
      <HomeJourney />
      <OfflineAudioOffer />
      <TabCard href="/livre" icon="menu_book" ios="book" title={t('book.title')} hint={t('home.bookHint')} />
      <TabCard href="/meditations" icon="self_improvement" ios="figure.mind.and.body" title={t('meditations.title')} hint={t('home.meditationsHint')} />
      <TabCard href="/carnet" icon="edit_note" ios="square.and.pencil" title={t('carnet.title')} hint={t('home.carnetHint')} />
    </Screen>
  );
}

function TabCard({ href, icon, ios, title, hint }: { href: Href; icon: AndroidSymbol; ios: SFSymbol; title: string; hint: string }) {
  const { colors } = useTheme();
  return (
    <Card onPress={() => router.navigate(href)}>
      <View style={styles.row}>
        <Icon name={icon} ios={ios} color={colors.primary} />
        <View style={styles.grow}>
          <Text variant="subtitle">{title}</Text>
          <Text variant="small" color="textMuted">
            {hint}
          </Text>
        </View>
        <Icon name="chevron_right" ios="chevron.right" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
  logo: { width: 120, height: 120 },
  center: { textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  grow: { flex: 1, gap: 2 },
});
