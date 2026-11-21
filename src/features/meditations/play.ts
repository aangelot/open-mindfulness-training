/** Starts a session and records it when it ends (or when it is stopped after a minute). */
import { startSession } from '@/core/audio/session';
import type { SessionPlan, SessionResult } from '@/core/audio/types';
import type { Section } from '@/core/book/types';
import type { MeditationKind } from '@/core/db/schema';
import { i18n } from '@/core/i18n';
import { SESSION_CONCLUSION, SESSION_INTRO } from '@/core/program';

import { isPractice } from './catalog';
import { openPlayer, sittingTitle } from './format';
import { practiceClips } from './practice-audio';
import { composeSitting, hasLengths, sittingPlan, type SittingOptions, type SittingSessionDef } from './sitting-sessions';
import { MIN_RECORDED_SECONDS, recordSession } from './store';
import { timerPlan, type TimerSettings } from './timer';

const t = i18n.t.bind(i18n);

/** The last session started, so the player can offer to start it again. */
let last: { plan: SessionPlan; kind: MeditationKind | null; contentRef: string | null } | null = null;

function begin(plan: SessionPlan, kind: MeditationKind | null, contentRef: string | null) {
  last = { plan, kind, contentRef };
  const onEnd = (r: SessionResult) => {
    if (kind && r.listenedSeconds >= MIN_RECORDED_SECONDS) {
      void recordSession({ kind, contentRef, startedAt: r.startedAt, durationSeconds: r.listenedSeconds });
    }
  };
  void startSession(plan, { onEnd });
}

function play(plan: SessionPlan, kind: MeditationKind | null, contentRef: string | null) {
  begin(plan, kind, contentRef);
  openPlayer();
}

/** Plays the last session again, from the start (from the player screen). */
export function replay() {
  if (last) begin(last.plan, last.kind, last.contentRef);
}

/** Whether the session shown by the player is recorded when it ends. */
export const lastIsRecorded = () => last?.kind != null;

/** A book audio. Only practices are recorded as meditations (not talks or summaries). */
export function playBookAudio(section: Section & { audioUrl: string }) {
  const title = section.ref ? `${section.ref} · ${section.title}` : section.title;
  const plan: SessionPlan = {
    title,
    subtitle: t('meditations.catalog.fromBook'),
    parts: [{ label: section.title, ref: section.ref ?? undefined, items: [{ kind: 'track', url: section.audioUrl }] }],
  };
  play(plan, isPractice(section) ? 'guided' : null, section.ref);
}

/** Recorded as "etape-2:light:long" (older records: "etape-2:30", the minutes). */
export function playSitting(def: SittingSessionDef, options: SittingOptions) {
  const session = composeSitting(def, options, practiceClips);
  const plan = sittingPlan(session, practiceClips, {
    title: sittingTitle(def),
    subtitle: t('meditations.sitting.planSubtitle', {
      version: t(`meditations.sitting.versions.${options.version}`).toLowerCase(),
      n: Math.round(session.totalSeconds / 60),
    }),
    intro: SESSION_INTRO.label,
    conclusion: SESSION_CONCLUSION.label,
  });
  const ref = [def.id, options.version, ...(hasLengths(def) ? [options.length] : [])].join(':');
  play(plan, 'sitting_type', ref);
}

export function playTimer(settings: TimerSettings) {
  const plan = timerPlan(settings, {
    title: t('meditations.timer.title'),
    subtitle: t('meditations.timer.planSubtitle', { n: settings.minutes }),
    part: t('meditations.timer.part'),
  });
  play(plan, 'free', null);
}
