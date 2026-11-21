/** The version of the pratiques types last chosen (full or light), remembered on the device. */
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';

import type { SittingVersion } from './sitting-sessions';

const KEY = 'meditations.sittingVersion';

export const useSittingVersion = create<{ version: SittingVersion }>(() => ({ version: 'full' }));

let loaded = false;

/** Restores the saved choice, once (async: the kv-store has no sync API on web). */
export function loadSittingVersion() {
  if (loaded) return;
  loaded = true;
  Storage.getItem(KEY)
    .then((v) => {
      if (v === 'full' || v === 'light') useSittingVersion.setState({ version: v });
    })
    .catch(() => {});
}

export function setSittingVersion(version: SittingVersion) {
  useSittingVersion.setState({ version });
  Storage.setItem(KEY, version).catch(() => {});
}
