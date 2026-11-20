import type { GameLanguage } from "../shared/protocol";
import { isNativeLocalizedQuestion } from "./questionsLocalized";
import { PL_POP_TRANSLATIONS } from "./questionsPlPop";
import { PL_PARTY_TRANSLATIONS } from "./questionsPlParty";
import { PL_TOPICS_TRANSLATIONS } from "./questionsPlTopics";

const translationCache = new Map<string, string>();
const TRANSLATE_TIMEOUT_MS = 2500;

const POLISH_OVERRIDES: Readonly<Record<string, string>> = {
  ...PL_POP_TRANSLATIONS,
  ...PL_PARTY_TRANSLATIONS,
  ...PL_TOPICS_TRANSLATIONS,
  "Pick a random whole number between 1 and 40.": "Wybierz losową liczbę całkowitą od 1 do 40.",
  "Pick a random whole number between 0 and 12.": "Wybierz losową liczbę całkowitą od 0 do 12.",
  "Pick a random whole number between 0 and 10.": "Wybierz losową liczbę całkowitą od 0 do 10.",
  "Pick a random animal off the top of your head.": "Wymień losowe zwierzę, które pierwsze przyjdzie Ci do głowy.",
  "Name a random actor or actress right now.": "Podaj teraz losowego aktora lub aktorkę.",
  "Name any random movie title.": "Podaj dowolny losowy tytuł filmu.",
  "Name any random TV series.": "Podaj dowolny losowy serial.",
  "Name any random video game.": "Podaj dowolną losową grę wideo.",
  "Make up a completely random superpower.": "Wymyśl zupełnie losową supermoc.",
  "Name a random friend or celebrity.": "Podaj losowego znajomego lub celebrytę.",
  "Name a random everyday object.": "Wymień losowy przedmiot codziennego użytku.",
  "Pick a random player at this table.": "Wskaż losową osobę przy tym stole.",
  "Name any random song off the top of your head.": "Podaj losową piosenkę, która pierwsza przyjdzie Ci do głowy.",
  "Name any random singer, rapper, or band.": "Podaj losowego piosenkarza, rapera lub zespół.",
  "Name any random food or drink.": "Podaj losowe jedzenie lub napój.",
  "Name any random country or city.": "Podaj losowy kraj lub miasto.",
  "Name any random fictional character.": "Podaj losową fikcyjną postać.",
  "Name any random app or website.": "Podaj losową aplikację lub stronę internetową.",
  "Name any random job or profession.": "Podaj losowy zawód lub profesję.",
  "Name any random place or location.": "Podaj losowe miejsce lub lokalizację.",
  "Name any random person or celebrity.": "Podaj losową osobę lub celebrytę.",
  "Make up a random chaotic 1-line confession.": "Wymyśl losowe, chaotyczne wyznanie w jednej linijce.",
  "How many times do you poop on a normal day?": "Ile razy dziennie robisz kupę?",
  "How many days in a row is the longest you have worn the same underwear?": "Ile dni z rzędu najdłużej nosiłeś(-aś) tę samą bieliznę?",
};

export async function translateText(text: string, targetLang: GameLanguage): Promise<string> {
  if (targetLang === "en" || !text.trim()) return text;
  if (isNativeLocalizedQuestion(targetLang, text)) return text;
  if (targetLang === "pl") {
    const override = POLISH_OVERRIDES[text];
    if (override) return override;
  }
  const cacheKey = `${targetLang}\u0000${text}`;
  const cached = translationCache.get(cacheKey);
  if (cached !== undefined) return cached;

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TRANSLATE_TIMEOUT_MS) });
    if (!response.ok) return text;
    const data: unknown = await response.json();
    if (!Array.isArray(data) || !Array.isArray(data[0])) return text;

    const parts: string[] = [];
    for (const part of data[0]) {
      if (!Array.isArray(part) || typeof part[0] !== "string") return text;
      parts.push(part[0]);
    }
    const translated = parts.join("");
    if (!translated) return text;

    translationCache.set(cacheKey, translated);
    return translated;
  } catch {
    return text;
  }
}
