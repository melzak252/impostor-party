import {
  APP_VERSION,
  QUESTION_TOPIC_LIST,
  type GameLanguage,
  type QuestionPair,
  type QuestionSuggestion,
  type QuestionTopicId,
} from "../shared/protocol";
import { POP_QUESTION_ITEMS } from "./questionsPop";
import { PARTY_QUESTION_ITEMS } from "./questionsParty";
import { TOPIC_QUESTION_ITEMS } from "./questionTopics";
import { getLocalizedItems, getLocalizedPairs } from "./questionsLocalized";

interface QuestionPoolItem {
  id: string;
  pool: string;
  spicy?: boolean;
  angle?: "pos" | "neg" | "weird";
  text: string;
}

export const BUILTIN_QUESTION_PAIRS: readonly QuestionPair[] = [
  { id: "builtin-01", normalQuestion: "How many push-ups can you do in a row?", impostorQuestion: "Pick a random whole number between 1 and 40." },
  { id: "builtin-02", normalQuestion: "How many doughnuts could you eat in one sitting?", impostorQuestion: "How many slices of pizza could you eat in one sitting?" },
  { id: "builtin-03", normalQuestion: "How old were you when you had your first crush?", impostorQuestion: "How old were you when you got your first phone?" },
  { id: "builtin-04", normalQuestion: "How many alarms do you set in the morning?", impostorQuestion: "How many times do you hit snooze before getting up?" },
  { id: "builtin-05", normalQuestion: "How many minutes does it take you to get ready to go out?", impostorQuestion: "How many minutes do you spend in the shower?" },
  { id: "builtin-06", normalQuestion: "How many hours do you usually sleep each night?", impostorQuestion: "How many hours of screen time do you have each day?" },
  { id: "builtin-07", normalQuestion: "How many countries have you visited?", impostorQuestion: "How many different cities have you lived in?" },
  { id: "builtin-08", normalQuestion: "How many cups of coffee do you drink in a week?", impostorQuestion: "How many cups of tea do you drink in a week?" },
  { id: "builtin-09", normalQuestion: "How many seconds can you hold a plank?", impostorQuestion: "How many seconds can you hold your breath?" },
  { id: "builtin-10", normalQuestion: "How many different apps do you open in a day?", impostorQuestion: "How many messages do you send in a day?" },
  { id: "builtin-11", normalQuestion: "How many pets have you had in your life?", impostorQuestion: "How many houseplants are in your home?" },
  { id: "builtin-12", normalQuestion: "How many minutes is your usual commute?", impostorQuestion: "How many minutes would you wait in line for your favourite food?" },
  { id: "builtin-13", normalQuestion: "How old were you when you learned to swim?", impostorQuestion: "How old were you when you learned to ride a bike?" },
  { id: "builtin-14", normalQuestion: "How many browser tabs do you have open right now?", impostorQuestion: "How many unread emails do you have right now?" },
  { id: "builtin-15", normalQuestion: "How many movies do you watch in a month?", impostorQuestion: "How many TV episodes do you watch in a week?" },
  { id: "builtin-16", normalQuestion: "How many days would your ideal holiday last?", impostorQuestion: "How many days could you go without the internet?" },
  { id: "builtin-17", normalQuestion: "How many pairs of shoes do you own?", impostorQuestion: "How many hats do you own?" },
  { id: "builtin-18", normalQuestion: "How many pizza slices would you buy for a small party?", impostorQuestion: "How many people would you invite to a small party?" },
  { id: "builtin-19", normalQuestion: "How many sit-ups can you do in a row?", impostorQuestion: "How many squats can you do in a row?" },
  { id: "builtin-20", normalQuestion: "How many books have you read in the last year?", impostorQuestion: "How many video games have you finished in the last year?" },
  { id: "builtin-21", normalQuestion: "How many minutes do you walk on a typical day?", impostorQuestion: "How many minutes do you exercise on a typical day?" },
  { id: "builtin-22", normalQuestion: "How old were you at your first concert?", impostorQuestion: "How old were you on your first trip without your parents?" },
  { id: "builtin-23", normalQuestion: "How many photos did you take last week?", impostorQuestion: "How many times do you unlock your phone in a day?" },
  { id: "builtin-24", normalQuestion: "How many passwords can you remember without checking?", impostorQuestion: "How many phone numbers do you know by heart?" },
];

const WEAK_BUILTIN_IDS = new Set([
  "builtin-07",
  "builtin-10",
  "builtin-14",
  "builtin-16",
  "builtin-18",
  "builtin-23",
]);

const GOOD_BUILTIN_PAIRS: readonly QuestionPair[] = BUILTIN_QUESTION_PAIRS.filter(
  (pair) => !WEAK_BUILTIN_IDS.has(pair.id),
);

const WILDCARD_IMPOSTOR_PROMPTS: Readonly<Record<string, string>> = {
  animals: "Pick a random animal off the top of your head.",
  movies: "Name any random movie title.",
  tv_series: "Name any random TV series.",
  games: "Name any random video game.",
  numbers_small: "Pick a random whole number between 0 and 12.",
  superpowers: "Make up a completely random superpower.",
  island_person: "Name a random friend or celebrity.",
  things_objects: "Name a random everyday object.",
  table_players: "Pick a random player at this table.",
  songs: "Name any random song off the top of your head.",
  music_artists: "Name any random singer, rapper, or band.",
  foods: "Name any random food or drink.",
  places: "Name any random country or city.",
  characters: "Name any random fictional character.",
  apps: "Name any random app or website.",
  jobs: "Name any random job or profession.",
  spicy_scenarios: "Name any random place or location.",
  spicy_person: "Name any random person or celebrity.",
  spicy_numbers: "Pick a random whole number between 0 and 10.",
  spicy_confessions: "Make up a random chaotic 1-line confession.",
};

function buildMixedPoolPairs(items: readonly QuestionPoolItem[]): QuestionPair[] {
  const byPool = new Map<string, QuestionPoolItem[]>();
  for (const item of items) {
    const list = byPool.get(item.pool) ?? [];
    list.push(item);
    byPool.set(item.pool, list);
  }
  const pairs: QuestionPair[] = [];
  for (const [pool, group] of byPool) {
    for (let i = 0; i < group.length; i += 1) {
      const normal = group[i]!;
      for (let j = 0; j < group.length; j += 1) {
        if (i === j) continue;
        const impostor = group[j]!;
        if (normal.angle && impostor.angle && normal.angle === impostor.angle) continue;
        if (normal.text.trim().toLowerCase() === impostor.text.trim().toLowerCase()) continue;
        pairs.push({
          id: `mix:${pool}:${normal.id}:${impostor.id}`,
          normalQuestion: normal.text,
          impostorQuestion: impostor.text,
        });
      }
      const wildcard = WILDCARD_IMPOSTOR_PROMPTS[pool];
      if (wildcard) {
        pairs.push({
          id: `wild:${pool}:${normal.id}`,
          normalQuestion: normal.text,
          impostorQuestion: wildcard,
        });
      }
    }
  }
  return pairs;
}

const ALL_POOL_ITEMS: readonly QuestionPoolItem[] = [
  ...POP_QUESTION_ITEMS,
  ...PARTY_QUESTION_ITEMS,
  ...TOPIC_QUESTION_ITEMS,
];
const FRIENDLY_MIXED_PAIRS: readonly QuestionPair[] = buildMixedPoolPairs(
  ALL_POOL_ITEMS.filter((item) => !item.spicy),
);
const ALL_MIXED_PAIRS: readonly QuestionPair[] = buildMixedPoolPairs(ALL_POOL_ITEMS);

const FRIENDLY_BUILTIN_CATALOGUE: readonly QuestionPair[] = [
  ...GOOD_BUILTIN_PAIRS,
  ...FRIENDLY_MIXED_PAIRS,
];
const SPICY_BUILTIN_CATALOGUE: readonly QuestionPair[] = [
  ...GOOD_BUILTIN_PAIRS,
  ...ALL_MIXED_PAIRS,
];

let approvedSuggestions: readonly QuestionSuggestion[] = [];

const TOPIC_DEFAULT_POOL: Readonly<Record<QuestionTopicId, string>> = {
  animals: "animals",
  movies_tv: "movies",
  games: "games",
  music: "songs",
  friends: "island_person",
  superpowers: "superpowers",
  food_places: "foods",
  everyday: "things_objects",
  pop_life: "characters",
};

export function setApprovedSuggestions(suggestions: readonly QuestionSuggestion[]): void {
  approvedSuggestions = [...suggestions];
}

function getApprovedSuggestionPairs(
  spicyMode: boolean,
  language: GameLanguage,
): QuestionPair[] {
  return approvedSuggestions
    .filter((item) => item.language === language && (!item.spicy || spicyMode))
    .map((item) => {
      const pool = TOPIC_DEFAULT_POOL[item.topic];
      const wildcard = WILDCARD_IMPOSTOR_PROMPTS[pool] ?? "Make up a fitting answer.";
      return {
        id: `sug:${pool}:${item.id}`,
        normalQuestion: item.text,
        impostorQuestion: wildcard,
      };
    });
}

function isPairInAllowedPools(pairId: string, allowedPools: ReadonlySet<string>): boolean {
  if (pairId.startsWith("builtin-")) return allowedPools.has("classic");
  const parts = pairId.split(":");
  const prefix = parts[0];
  if (prefix === "mix" || prefix === "wild" || prefix === "loc" || prefix === "locwild" || prefix === "sug") {
    return parts[1] ? allowedPools.has(parts[1]) : false;
  }
  if (prefix === "native") {
    return parts[2] ? allowedPools.has(parts[2]) : false;
  }
  return false;
}

export function getBuiltinQuestionPairs(
  spicyMode: boolean,
  language: GameLanguage = "en",
  enabledTopics?: readonly QuestionTopicId[],
): readonly QuestionPair[] {
  const base = spicyMode ? SPICY_BUILTIN_CATALOGUE : FRIENDLY_BUILTIN_CATALOGUE;
  const localized = language === "en" ? [] : getLocalizedPairs(language, spicyMode);
  const community = getApprovedSuggestionPairs(spicyMode, language);
  const combinedBase = localized.length > 0 ? [...localized, ...base] : base;
  const all = community.length > 0 ? [...combinedBase, ...community] : combinedBase;
  if (!enabledTopics || enabledTopics.length === 0) return all;

  const topicSet = new Set(enabledTopics);
  const allowedPools = new Set<string>();
  for (const topic of QUESTION_TOPIC_LIST) {
    if (topicSet.has(topic.id)) {
      for (const pool of topic.pools) allowedPools.add(pool);
    }
  }
  return all.filter((pair) => isPairInAllowedPools(pair.id, allowedPools));
}

export function getQuestionCatalog() {
  const englishPoolQuestions = ALL_POOL_ITEMS.map((item) => ({
    id: item.id,
    pool: item.pool,
    language: "en",
    angle: item.angle ?? "weird",
    spicy: Boolean(item.spicy),
    text: item.text,
  }));
  const classicQuestions = GOOD_BUILTIN_PAIRS.flatMap((pair) => [
    { id: `${pair.id}-a`, pool: "classic", language: "en", angle: "classic", spicy: false, text: pair.normalQuestion },
    { id: `${pair.id}-b`, pool: "classic", language: "en", angle: "classic", spicy: false, text: pair.impostorQuestion },
  ]);
  const localizedQuestions = getLocalizedItems().map((item) => ({
    id: item.id,
    pool: item.pool,
    language: item.language,
    angle: item.angle,
    spicy: Boolean(item.spicy),
    text: item.text,
  }));
  const communityQuestions = approvedSuggestions.map((item) => ({
    id: `sug-${item.id}`,
    pool: TOPIC_DEFAULT_POOL[item.topic],
    language: item.language,
    angle: "community",
    spicy: item.spicy,
    text: item.text,
  }));
  const questions = [...communityQuestions, ...englishPoolQuestions, ...localizedQuestions, ...classicQuestions];
  return {
    version: APP_VERSION,
    totalQuestions: questions.length,
    friendlyCombos: FRIENDLY_BUILTIN_CATALOGUE.length,
    spicyCombos: SPICY_BUILTIN_CATALOGUE.length,
    questions,
  };
}
