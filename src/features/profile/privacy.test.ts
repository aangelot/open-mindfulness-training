import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import fr from '@/core/i18n/fr.json';

/** docs/confidentialite.md is the public URL given to the Play Store: it must say what the app says. */
describe('privacy policy', () => {
  const online = readFileSync(join(__dirname, '../../../docs/confidentialite.md'), 'utf8');

  it('has the same text online and in the app', () => {
    expect(online).toContain(fr.privacy.updated);
    for (const section of fr.privacy.sections) {
      expect(online).toContain(`## ${section.title}\n`);
      for (const paragraph of section.paragraphs) expect(online).toContain(`\n${paragraph}\n`);
    }
  });
});
