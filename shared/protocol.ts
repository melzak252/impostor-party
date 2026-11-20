import { z } from "zod";

export const PhaseSchema = z.enum(["lobby", "answering", "answers", "question", "voting", "results"]);
export type Phase = z.infer<typeof PhaseSchema>;
export const GameLanguageSchema = z.enum(["en", "pl", "es", "de", "fr"]);
export type GameLanguage = z.infer<typeof GameLanguageSchema>;
export const PartySettingsSchema = z.object({
  visibility: z.enum(["private", "public"]),
  questionRevealMode: z.enum(["ready", "auto"]),
  questionSource: z.enum(["builtin", "custom", "mixed"]),
  spicyMode: z.boolean().optional(),
  language: GameLanguageSchema.optional(),
}).strict();
export type PartySettings = z.infer<typeof PartySettingsSchema>;
export const ColorIdSchema = z.enum(["coral", "amber", "mint", "cyan", "blue", "violet"]);
export type ColorId = z.infer<typeof ColorIdSchema>;
export const COLOR_PALETTE: ReadonlyArray<{ id: ColorId; name: string; swatch: string }> = [
  { id: "coral", name: "Coral", swatch: "#F97066" }, { id: "amber", name: "Amber", swatch: "#FBBF24" },
  { id: "mint", name: "Mint", swatch: "#34D399" }, { id: "cyan", name: "Cyan", swatch: "#22D3EE" },
  { id: "blue", name: "Blue", swatch: "#60A5FA" }, { id: "violet", name: "Violet", swatch: "#A78BFA" },
];
export const QuestionPairSchema = z.object({ id: z.string().min(1), normalQuestion: z.string(), impostorQuestion: z.string() }).strict();
export type QuestionPair = z.infer<typeof QuestionPairSchema>;
const actionSchemas = [
  z.object({ type: z.literal("set_color"), colorId: ColorIdSchema }).strict(),
  z.object({ type: z.literal("set_settings"), settings: PartySettingsSchema }).strict(),
  z.object({ type: z.literal("kick"), playerId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("leave") }).strict(),
  z.object({ type: z.literal("add_question"), normalQuestion: z.string(), impostorQuestion: z.string() }).strict(),
  z.object({ type: z.literal("edit_question"), questionId: z.string().uuid(), normalQuestion: z.string(), impostorQuestion: z.string() }).strict(),
  z.object({ type: z.literal("delete_question"), questionId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("start_round") }).strict(),
  z.object({ type: z.literal("skip_round") }).strict(),
  z.object({ type: z.literal("next_round") }).strict(),
  z.object({ type: z.literal("submit_answer"), answer: z.string() }).strict(),
  z.object({ type: z.literal("set_ready"), ready: z.boolean() }).strict(),
  z.object({ type: z.literal("vote"), targetPlayerId: z.string().uuid() }).strict(),
  z.object({ type: z.literal("return_to_lobby") }).strict(),
] as const;
export const PartyActionSchema = z.discriminatedUnion("type", actionSchemas);
export type PartyAction = z.infer<typeof PartyActionSchema>;
export const ActionRequestSchema = z.object({ expectedPhase: PhaseSchema, roundId: z.string().uuid().nullable(), action: PartyActionSchema }).strict();
export type ActionRequest = z.infer<typeof ActionRequestSchema>;
export interface PlayerSnapshot { id: string; name: string; colorId: ColorId; connected: boolean; hasAnswered: boolean; isReady: boolean; hasVoted: boolean }
export interface RoundSnapshot {
  id: string; number: number; participants: Array<{ id: string; name: string; colorId: ColorId }>;
  privateQuestion: string; myAnswer: string | null; myVote: string | null; questionRevealAt: number | null;
  answers?: Record<string, string>; normalQuestion?: string; impostorQuestion?: string; impostorId?: string; votes?: Record<string, string>;
}
export interface PartySnapshot {
  code: string; version: number; phase: Phase; hostId: string; selfId: string; settings: PartySettings;
  players: PlayerSnapshot[]; round: RoundSnapshot | null; notice: { type: "round_cancelled"; playerName: string } | null;
  customQuestions?: QuestionPair[];
}
export const ActionRequestBodySchema = ActionRequestSchema;
