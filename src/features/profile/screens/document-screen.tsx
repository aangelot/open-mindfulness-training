import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/core/theme';
import { BackLink, Button, Screen, Text } from '@/ui';

import { LINKS, openPage } from '../links';

export interface DocumentSection {
  title: string;
  paragraphs: string[];
}

/** Text pages kept in fr.json (`<key>.sections`), so the in-app and online versions stay in step. */
function DocumentScreen({ docKey, subtitle, links }: { docKey: 'privacy' | 'legal'; subtitle?: string; links: { label: string; url: string }[] }) {
  const { t } = useTranslation();
  const sections = t(`${docKey}.sections`, { returnObjects: true }) as DocumentSection[];
  return (
    <Screen header={<BackLink label={t('profile.title')} fallback="/profil" />} title={t(`${docKey}.title`)} subtitle={subtitle}>
      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text variant="subtitle" color="heading">
            {section.title}
          </Text>
          {section.paragraphs.map((p) => (
            <Text key={p.slice(0, 40)} selectable>
              {p}
            </Text>
          ))}
        </View>
      ))}
      <View style={styles.links}>
        {links.map((link) => (
          <Button key={link.url} label={link.label} variant="secondary" icon="open_in_new" iosIcon="arrow.up.right.square" onPress={() => openPage(link.url)} />
        ))}
      </View>
    </Screen>
  );
}

export function PrivacyScreen() {
  const { t } = useTranslation();
  return <DocumentScreen docKey="privacy" subtitle={t('privacy.updated')} links={[{ label: t('privacy.online'), url: LINKS.privacy }]} />;
}

export function LegalScreen() {
  const { t } = useTranslation();
  return (
    <DocumentScreen
      docKey="legal"
      links={[
        { label: t('legal.contentLicense'), url: LINKS.contentLicense },
        { label: t('legal.codeLicense'), url: LINKS.codeLicense },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  links: { gap: spacing.sm, marginTop: spacing.md },
});
