import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/core/theme';

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.primary}
      indicatorColor={colors.surfaceAccent}
      labelStyle={{ selected: { color: colors.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabs.home')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="carnet">
        <NativeTabs.Trigger.Label>{t('tabs.carnet')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="edit_note" sf="square.and.pencil" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="meditations">
        <NativeTabs.Trigger.Label>{t('tabs.meditations')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="self_improvement" sf="figure.mind.and.body" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="livre">
        <NativeTabs.Trigger.Label>{t('tabs.book')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="menu_book" sf={{ default: 'book', selected: 'book.fill' }} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profil">
        <NativeTabs.Trigger.Label>{t('tabs.profile')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="person" sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
