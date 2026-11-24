import { z } from "zod";

export const APP_VERSION = "1.3.1";

export const PhaseSchema = z.enum(["lobby", "answering", "answers", "question", "voting", "results"]);
export type Phase = z.infer<typeof PhaseSchema>;
export const GameLanguageSchema = z.enum(["en", "pl", "es", "de", "fr"]);
export type GameLanguage = z.infer<typeof GameLanguageSchema>;
export const QuestionTopicIdSchema = z.enum([
  "animals",
  "movies_tv",
  "games",
  "music",
  "friends",
  "superpowers",
  "food_places",
  "everyday",
  "pop_life",
]);
export type QuestionTopicId = z.infer<typeof QuestionTopicIdSchema>;
export const QUESTION_TOPIC_LIST: ReadonlyArray<{ id: QuestionTopicId; pools: readonly string[] }> = [
  { id: "animals", pools: ["animals"] },
  { id: "movies_tv", pools: ["movies", "tv_series"] },
  { id: "games", pools: ["games"] },
  { id: "music", pools: ["songs", "music_artists"] },
  {
    id: "friends",
    pools: [
      "table_players",
      "island_person",
      "spicy_person",
      "spicy_scenarios",
      "spicy_confessions",
      "pl_table",
      "pl_spicy",
      "fr_table",
      "fr_spicy",
      "es_table",
      "es_spicy",
      "de_table",
      "de_spicy",
    ],
  },
  { id: "superpowers", pools: ["superpowers"] },
  { id: "food_places", pools: ["foods", "places", "pl_food", "pl_places", "fr_life", "es_fiesta", "de_alltag"] },
  { id: "everyday", pools: ["things_objects", "numbers_small", "spicy_numbers", "classic"] },
  { id: "pop_life", pools: ["characters", "apps", "jobs"] },
];
export const PartySettingsSchema = z.object({
  visibility: z.enum(["private", "public"]),
  questionRevealMode: z.enum(["ready", "auto"]),
  questionSource: z.enum(["builtin", "custom", "mixed"]),
  spicyMode: z.boolean().optional(),
  language: GameLanguageSchema.optional(),
  enabledTopics: z.array(QuestionTopicIdSchema).min(1).optional(),
  answerTimeSeconds: z.number().int().min(0).max(300).optional(),
  roundCount: z.number().int().min(1).max(20).optional(),
}).strict();
export type PartySettings = z.infer<typeof PartySettingsSchema>;
export const ColorIdSchema = z.enum(["coral", "amber", "mint", "cyan", "blue", "violet", "rose", "lime"]);
export type ColorId = z.infer<typeof ColorIdSchema>;
export const COLOR_PALETTE: ReadonlyArray<{ id: ColorId; name: string; swatch: string }> = [
  { id: "coral", name: "Coral", swatch: "#F97066" }, { id: "amber", name: "Amber", swatch: "#FBBF24" },
  { id: "mint", name: "Mint", swatch: "#34D399" }, { id: "cyan", name: "Cyan", swatch: "#22D3EE" },
  { id: "blue", name: "Blue", swatch: "#60A5FA" }, { id: "violet", name: "Violet", swatch: "#A78BFA" },
  { id: "rose", name: "Rose", swatch: "#FB7185" }, { id: "lime", name: "Lime", swatch: "#A3E635" },
];
export const QuestionPairSchema = z.object({ id: z.string().min(1), normalQuestion: z.string(), impostorQuestion: z.string() }).strict();
export type QuestionPair = z.infer<typeof QuestionPairSchema>;
const actionSchemas = [
  z.object({ type: z.literal("set_color"), colorId: ColorIdSchema }).strict(),
  z.object({ type: z.literal("set_settings"), settings: PartySettingsSchema }).strict(),
  z.object({ type: z.literal("set_room_name"), roomName: z.string() }).strict(),
  z.object({ type: z.literal("kick"), playerId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("leave") }).strict(),
  z.object({ type: z.literal("add_question"), normalQuestion: z.string(), impostorQuestion: z.string() }).strict(),
  z.object({ type: z.literal("edit_question"), questionId: z.string().uuid(), normalQuestion: z.string(), impostorQuestion: z.string() }).strict(),
  z.object({ type: z.literal("delete_question"), questionId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("start_round") }).strict(),
  z.object({ type: z.literal("skip_round") }).strict(),
  z.object({ type: z.literal("next_round") }).strict(),
  z.object({ type: z.literal("submit_answer"), answer: z.string() }).strict(),
  z.object({ type: z.literal("save_draft"), answer: z.string() }).strict(),
  z.object({ type: z.literal("set_ready"), ready: z.boolean() }).strict(),
  z.object({ type: z.literal("vote_reroll") }).strict(),
  z.object({ type: z.literal("vote"), targetPlayerId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("return_to_lobby") }).strict(),
] as const;
export const PartyActionSchema = z.discriminatedUnion("type", actionSchemas);
export type PartyAction = z.infer<typeof PartyActionSchema>;
export const ActionRequestSchema = z.object({ expectedPhase: PhaseSchema, roundId: z.string().uuid().nullable(), action: PartyActionSchema }).strict();
export type ActionRequest = z.infer<typeof ActionRequestSchema>;
export interface PlayerSnapshot { id: string; name: string; colorId: ColorId; connected: boolean; hasAnswered: boolean; isReady: boolean; hasVoted: boolean; score: number }
export interface RoundSnapshot {
  id: string; number: number; matchRound: number; totalRounds: number; isSpicy: boolean; canVote: boolean; participants: Array<{ id: string; name: string; colorId: ColorId }>;
  privateQuestion: string; myAnswer: string | null; myVote: string | null; answerDeadlineAt: number | null; questionRevealAt: number | null; voteDeadlineAt: number | null;
  rerollVotes: number; rerollThreshold: number; myRerollVote: boolean;
  answers?: Record<string, string>; normalQuestion?: string; impostorQuestion?: string; impostorId?: string; votes?: Record<string, string>;
  roundPoints?: Record<string, number>;
}
export interface PartySnapshot {
  code: string; roomName?: string; version: number; phase: Phase; hostId: string; selfId: string; settings: PartySettings;
  players: PlayerSnapshot[]; round: RoundSnapshot | null; notice: { type: "round_cancelled"; playerName: string } | null;
  customQuestions?: QuestionPair[];
}
export const ActionRequestBodySchema = ActionRequestSchema;

export const SuggestionStatusSchema = z.enum(["pending", "approved", "rejected"]);
export type SuggestionStatus = z.infer<typeof SuggestionStatusSchema>;

export const CreateSuggestionBodySchema = z.object({
  topic: QuestionTopicIdSchema,
  language: GameLanguageSchema,
  spicy: z.boolean(),
  text: z.string(),
  honeypot: z.string().optional(),
}).strict();
export type CreateSuggestionBody = z.infer<typeof CreateSuggestionBodySchema>;

export const UpdateSuggestionStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
}).strict();
export type UpdateSuggestionStatus = z.infer<typeof UpdateSuggestionStatusSchema>;

export interface QuestionSuggestion {
  id: string;
  topic: QuestionTopicId;
  language: GameLanguage;
  spicy: boolean;
  text: string;
  status: SuggestionStatus;
  createdAt: number;
  reviewedAt: number | null;
}
