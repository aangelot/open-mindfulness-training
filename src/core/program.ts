/**
 * Definition of the 8-week fundamental training, transcribed from
 * "Carnet d'entraînement" (Open Mindfulness, 2019).
 *
 * This file is data: screens render it, they must not hard-code weeks.
 * References "P n" / "E n" match the book (practices / talks).
 */

export type PracticeRef = `P${number}`;

/** One step of the "pratique assise type". */
export interface PracticeStep {
  /** Book reference(s). Several refs = alternatives ("P13 ou P15"). */
  refs: PracticeRef[];
  title: string;
  /** Duration in minutes; a range when the booklet gives one. */
  minutes: number | [number, number];
  /** Optional sub-group heading (week 5: pensées / émotions). */
  group?: string;
}

export interface SittingPractice {
  /** Announced total, minutes. */
  totalMinutes: [number, number];
  mainMinutes: number | [number, number];
  steps: PracticeStep[];
  note?: string;
}

export type ReminderCategory = 'instantane' | 'petite_pause' | 'situation';

export interface Reminder {
  /** Stable id: ratings are stored against it. Never rename. */
  id: string;
  category: ReminderCategory;
  label: string;
}

export interface ProgramWeek {
  week: number;
  title: string;
  sitting: SittingPractice;
  reminders: Reminder[];
}

/** Session intro and conclusion are identical every week. */
export const SESSION_INTRO = {
  minutes: 2,
  label: 'Entrée en présence et motivation bienveillante',
  ref: 'E6',
} as const;

export const SESSION_CONCLUSION = {
  minutes: 1,
  label:
    'Clôture de la session dans un état d’esprit positif de réjouissance, de satisfaction et de dédicace altruiste',
} as const;

/**
 * The guided "pratiques types" of a week in Méditations (week 5 has two: thoughts, then
 * emotions), so other screens can link to them. Persisted ids: never rename.
 * sitting-sessions.test.ts checks they match the Méditations definitions.
 */
export const weekSittingSessions = (week: number): { id: string; group?: 'pensees' | 'emotions' }[] =>
  week === 5
    ? [
        { id: 'etape-5-pensees', group: 'pensees' },
        { id: 'etape-5-emotions', group: 'emotions' },
      ]
    : [{ id: `etape-${week}` }];

/** Recommended minimum number of sitting sessions per week. */
export const RECOMMENDED_DAYS_PER_WEEK = 6;

/** Reminder self-assessment scale (footnote 2 of the booklet). */
export const REMINDER_SCALE = {
  A: 'Aucun rappel',
  B: 'Rappels très rares',
  C: 'Quelques rappels',
  D: 'Beaucoup de rappels',
  E: 'Rappels très fréquents',
} as const;
export type ReminderRating = keyof typeof REMINDER_SCALE;

/** Daily sitting report fields (same every week). */
export const DAILY_REPORT_FIELDS = [
  { key: 'positives', label: 'Expériences positives' },
  { key: 'obstacles', label: 'Obstacles et difficultés rencontrés' },
  { key: 'remedies', label: 'Remède appliqué' },
] as const;

/**
 * The six obstacles and nine remedies of E8 ("Les obstacles à l'entraînement et leurs remèdes").
 * Ids are stored in daily reports: never rename them.
 */
export const OBSTACLES = [
  { id: 'paresse', label: 'Paresse' },
  { id: 'oubli', label: 'Oubli' },
  { id: 'agitation', label: 'Agitation' },
  { id: 'torpeur', label: 'Torpeur' },
  { id: 'manque-intervention', label: 'Manque d’intervention' },
  { id: 'exces-intervention', label: 'Excès d’intervention' },
] as const;
export type ObstacleId = (typeof OBSTACLES)[number]['id'];

export const REMEDIES: readonly { id: string; label: string; obstacle: ObstacleId }[] = [
  { id: 'motivation', label: 'Motivation', obstacle: 'paresse' },
  { id: 'effort', label: 'Effort', obstacle: 'paresse' },
  { id: 'confiance', label: 'Confiance', obstacle: 'paresse' },
  { id: 'bonnes-experiences', label: 'Bonnes expériences', obstacle: 'paresse' },
  { id: 'rappel', label: 'Rappel', obstacle: 'oubli' },
  { id: 'detente', label: 'Détente', obstacle: 'agitation' },
  { id: 'stimulation', label: 'Stimulation', obstacle: 'torpeur' },
  { id: 'intervention', label: 'Intervention appropriée', obstacle: 'manque-intervention' },
  { id: 'non-intervention', label: 'Non-intervention', obstacle: 'exces-intervention' },
];

/** Book section on obstacles and remedies. */
export const OBSTACLES_REF = 'E8';

// --- Shared reminders -------------------------------------------------------

const r = (id: string, category: ReminderCategory, label: string): Reminder => ({
  id,
  category,
  label,
});

const MATIN = r('matin-intention', 'situation', 'Matin : poser une intention de pratiquer les rappels tout au long de la journée');
const MIDI = r('midi-repas', 'situation', 'Midi : commencer le repas avec une courte pause et manger en pleine présence');
const SOIR = r('soir-bilan', 'situation', 'Soir : faire le bilan de la journée, pratiquer le body scan en s’endormant');
const DAILY = [MATIN, MIDI, SOIR];

const OCC = {
  dents: r('occ-dents', 'situation', 'Se brosser les dents en pleine présence'),
  douche: r('occ-douche', 'situation', 'Prendre sa douche en pleine présence'),
  nature: r('occ-nature', 'situation', 'Contempler les éléments de la nature'),
  marche: r('occ-marche', 'situation', 'Marcher en pleine présence dans vos déplacements quotidiens'),
  ciel: r('occ-ciel', 'situation', 'Contempler le ciel et l’espace'),
  vaisselle: r('occ-vaisselle', 'situation', 'Faire la vaisselle et la cuisine en pleine présence'),
  accueillirEmotions: r('occ-accueillir-emotions', 'situation', 'Accueillir-offrir avec les émotions qui arrivent'),
  habiller: r('occ-habiller', 'situation', 'S’habiller en pleine présence'),
  lieuxPublics: r('occ-lieux-publics', 'situation', 'Pratiquer la pleine présence dans les lieux publics et communs'),
  smartphone: r('occ-smartphone', 'situation', 'En regardant son smartphone'),
  relations: r('occ-relations', 'situation', 'Accueillir-offrir dans toutes les situations relationnelles du quotidien'),
  emotionTroisEtapes: r('occ-emotion-trois-etapes', 'situation', 'Quand une émotion arrive (les trois étapes)'),
};

const P8 = { refs: ['P8'], title: 'Étirements assis', minutes: 3 } satisfies PracticeStep;
const P9 = { refs: ['P9'], title: 'Les sept points de la posture assise', minutes: 1 } satisfies PracticeStep;

// --- The 8 weeks ------------------------------------------------------------

export const PROGRAM: ProgramWeek[] = [
  {
    week: 1,
    title: 'La présence attentive au corps',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: 35,
      steps: [
        { refs: ['P6'], title: 'Stimuler la sensation corporelle (rebondissements ou auto-massages)', minutes: 3 },
        P8,
        P9,
        { refs: ['P5'], title: 'Apprendre à « sentir son corps »', minutes: 3 },
        { refs: ['P10'], title: 'Approfondir l’expérience du corps : le body scan allongé', minutes: 20 },
        { refs: ['P7'], title: 'La simple présence assise', minutes: 5 },
      ],
      note: 'Pour une pratique en 30 minutes, il est possible de ne faire que le body scan allongé.',
    },
    reminders: [
      r('w1-instantane', 'instantane', 'Simple rappel à la sensation corporelle'),
      r('w1-pause-body-scan', 'petite_pause', 'Trois minutes de body scan quelques fois dans la journée'),
      ...DAILY,
      OCC.dents,
    ],
  },
  {
    week: 2,
    title: 'La présence attentive au souffle',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: [25, 30],
      steps: [
        P8,
        P9,
        { refs: ['P11'], title: 'Trois respirations lentes et profondes', minutes: 1 },
        { refs: ['P13', 'P15'], title: 'La respiration abdominale ou la respiration complète', minutes: 5 },
        { refs: ['P14'], title: 'La sensation du souffle au niveau des narines', minutes: 5 },
        { refs: ['P16'], title: 'La sensation continue du souffle', minutes: [10, 15] },
      ],
    },
    reminders: [
      r('w2-instantane', 'instantane', 'Simple rappel à la sensation du souffle'),
      r('w2-pause-21-cycles', 'petite_pause', 'Une petite pause de présence attentive pendant 21 cycles respiratoires'),
      ...DAILY,
      OCC.dents,
      OCC.douche,
    ],
  },
  {
    week: 3,
    title: 'La présence ouverte à ce qui nous entoure',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: [25, 30],
      steps: [
        P8,
        P9,
        { refs: ['P19'], title: 'L’ouverture dans l’expiration', minutes: 10 },
        { refs: ['P20'], title: 'La vision panoramique, vision nue et sensorialité globale', minutes: 5 },
        { refs: ['P21'], title: 'La présence ouverte au son : l’audition nue', minutes: 5 },
        { refs: ['P23'], title: 'La vision nue, ouverte, d’un objet proche ou lointain', minutes: 5 },
      ],
    },
    reminders: [
      r('w3-instantane', 'instantane', 'Simple rappel à la présence ouverte à ce qui nous entoure'),
      r('w3-pause-ouverture-expiration', 'petite_pause', 'Trois minutes de pratique de l’ouverture dans l’expiration'),
      r('w3-pause-presence-ouverte', 'petite_pause', 'Petites pauses de présence attentive ouverte'),
      ...DAILY,
      OCC.dents,
      OCC.douche,
      OCC.nature,
      OCC.marche,
    ],
  },
  {
    week: 4,
    title: 'La présence ouverte et relâchée',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: 30,
      steps: [
        P8,
        P9,
        { refs: ['P19'], title: 'L’ouverture dans l’expiration', minutes: 5 },
        { refs: ['P26'], title: 'La vision panoramique dans l’ouverture relâchée', minutes: 10 },
        { refs: ['P28'], title: 'L’observateur abstrait et absent', minutes: 10 },
      ],
    },
    reminders: [
      r('w4-instantane', 'instantane', 'Simple rappel à la présence ouverte et relâchée'),
      r('w4-pause-vision-panoramique', 'petite_pause', 'Trois minutes de pratique de la vision panoramique'),
      r('w4-pause-observateur', 'petite_pause', 'Trois minutes de pratique de l’observateur abstrait et de l’observateur absent'),
      ...DAILY,
      OCC.dents,
      OCC.douche,
      OCC.nature,
      OCC.ciel,
      OCC.vaisselle,
    ],
  },
  {
    week: 5,
    title: 'L’intégration des pensées et des émotions dans la pleine présence',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: 30,
      steps: [
        P8,
        P9,
        { refs: ['P31'], title: 'L’intégration des pensées avec et sans étiquetage', minutes: 10, group: 'pensees' },
        { refs: ['P29'], title: 'L’intégration des pensées dans la présence ouverte relâchée', minutes: 7, group: 'pensees' },
        { refs: ['P30'], title: 'L’intégration des pensées en l’état d’observateur abstrait', minutes: 7, group: 'pensees' },
        { refs: ['P32'], title: 'L’intégration des émotions avec la méthode en trois temps', minutes: 10, group: 'emotions' },
        { refs: ['P34'], title: 'Pleine présence en une émotion désagréable', minutes: 7, group: 'emotions' },
        { refs: ['P33'], title: 'Pleine présence en une émotion agréable', minutes: 7, group: 'emotions' },
      ],
      note: 'Deux entraînements : intégration des pensées, puis intégration des émotions.',
    },
    reminders: [
      r('w5-instantane', 'instantane', 'Simple rappel à l’intégration des pensées et des émotions dans la présence ouverte et relâchée'),
      r('w5-pause-pensees', 'petite_pause', 'Trois minutes de pratique d’intégration des pensées dans l’une ou l’autre des trois méthodes'),
      r('w5-pause-emotions', 'petite_pause', 'Trois minutes de pratique d’intégration des émotions avec la méthode en trois temps'),
      ...DAILY,
      OCC.ciel,
      OCC.vaisselle,
      OCC.accueillirEmotions,
      OCC.habiller,
      OCC.lieuxPublics,
    ],
  },
  {
    week: 6,
    title: 'La présence altruiste dans la relation et la communication',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: 30,
      steps: [
        P8,
        P9,
        { refs: ['P36'], title: 'Accueillir-offrir en général : réceptivité-disponibilité dans la pulsation du souffle', minutes: 5 },
        { refs: ['P37'], title: 'La pratique d’accueillir-offrir avec soi', minutes: 5 },
        { refs: ['P38'], title: 'Découvrir accueillir-offrir avec l’autre', minutes: 10 },
        { refs: ['P39'], title: 'Accueillir-offrir en toutes situations', minutes: 5 },
      ],
    },
    reminders: [
      r('w6-instantane', 'instantane', 'Simple rappel à la présence ouverte en pratiquant accueillir-offrir'),
      r('w6-pause-souffle', 'petite_pause', 'Trois minutes de la pratique d’accueillir-offrir en général dans la pulsation du souffle'),
      r('w6-pause-autre', 'petite_pause', 'Trois minutes de la pratique d’accueillir-offrir avec l’autre'),
      r('w6-pause-ecoute', 'petite_pause', 'Trois minutes de la pratique à l’écoute profonde'),
      ...DAILY,
      OCC.accueillirEmotions,
      OCC.habiller,
      OCC.smartphone,
      OCC.relations,
    ],
  },
  {
    week: 7,
    title: 'La pleine présence dans la vie quotidienne',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: 30,
      steps: [{ refs: ['P42'], title: 'La pratique principale de la méditation en huit points', minutes: 30 }],
    },
    reminders: [
      r('w7-instantane', 'instantane', 'Simple rappel à la présence ouverte et relâchée en toutes circonstances'),
      r('w7-pause-soi', 'petite_pause', 'Trois minutes de la pratique d’accueillir-offrir avec soi'),
      r('w7-pause-autre', 'petite_pause', 'Trois minutes de la pratique d’accueillir-offrir avec l’autre'),
      ...DAILY,
      OCC.emotionTroisEtapes,
      OCC.habiller,
      OCC.smartphone,
      OCC.relations,
    ],
  },
  {
    week: 8,
    title: 'La pleine présence dans toute la vie',
    sitting: {
      totalMinutes: [30, 40],
      mainMinutes: [20, 30],
      steps: [
        P8,
        P9,
        { refs: ['P42', 'P43'], title: 'La méditation essentielle en huit points ou en cinq points', minutes: [20, 30] },
      ],
    },
    reminders: [
      r('w8-instantane', 'instantane', 'Simple rappel à la présence ouverte et relâchée en toutes circonstances'),
      r('w8-pause-vision-panoramique', 'petite_pause', 'Trois minutes de la pratique de la vision panoramique'),
      r('w8-pause-emotions', 'petite_pause', 'Trois minutes de la pratique de l’intégration des émotions avec la méthode en trois temps'),
      ...DAILY,
      OCC.emotionTroisEtapes,
      OCC.habiller,
      OCC.smartphone,
      OCC.relations,
    ],
  },
];
