import type { GameLanguage, QuestionPair } from "../shared/protocol";

interface LocalizedPoolItem {
  id: string;
  language: Exclude<GameLanguage, "en">;
  pool: string;
  spicy?: boolean;
  angle: "pos" | "neg" | "weird";
  text: string;
}

const LOCALIZED_WILDCARDS: Readonly<Record<string, string>> = {
  // Polish
  pl_food: "Wymień dowolne polskie jedzenie lub przekąskę z Żabki.",
  pl_places: "Wymień dowolne polskie miasto lub miejscowość.",
  pl_table: "Wskaż dowolną osobę przy tym stole.",
  pl_spicy: "Wskaż dowolną osobę przy tym stole.",
  // French
  fr_life: "Cite un plat, un snack de boulangerie ou une boisson d'apéro.",
  fr_table: "Désigne quelqu'un autour de cette table.",
  fr_spicy: "Désigne quelqu'un autour de cette table.",
  // Spanish
  es_fiesta: "Di una tapa, comida o bebida típica al azar.",
  es_table: "Señala a alguien de esta mesa.",
  es_spicy: "Señala a alguien de esta mesa.",
  // German
  de_alltag: "Nenne ein deutsches Essen, einen Snack oder ein Getränk.",
  de_table: "Zeige auf eine Person hier am Tisch.",
  de_spicy: "Zeige auf eine Person hier am Tisch.",
};

const LOCALIZED_ITEMS: readonly LocalizedPoolItem[] = [
  // =========================================================================
  // POLISH (pl) — 40 questions across 4 pools
  // =========================================================================

  // pl_food (10) — Żabka, kebab, pierogi, polskie klasyki
  {
    id: "pl-food-01",
    language: "pl",
    pool: "pl_food",
    angle: "pos",
    text: "Najlepszy hot-dog lub przekąska z Żabki po północy?",
  },
  {
    id: "pl-food-02",
    language: "pl",
    pool: "pl_food",
    angle: "pos",
    text: "Ulubiony farsz do pierogów, który nigdy się nie nudzi?",
  },
  {
    id: "pl-food-03",
    language: "pl",
    pool: "pl_food",
    angle: "pos",
    text: "Idealny kebab na kacu — jaki sos lub rodzaj?",
  },
  {
    id: "pl-food-04",
    language: "pl",
    pool: "pl_food",
    angle: "pos",
    text: "Polski słodycz z dzieciństwa, za który oddałbyś nerkę?",
  },
  {
    id: "pl-food-05",
    language: "pl",
    pool: "pl_food",
    angle: "neg",
    text: "Polskie danie ze stołówki, na sam widok którego uciekasz?",
  },
  {
    id: "pl-food-06",
    language: "pl",
    pool: "pl_food",
    angle: "neg",
    text: "Najbardziej przereklamowana przekąska z Żabki?",
  },
  {
    id: "pl-food-07",
    language: "pl",
    pool: "pl_food",
    angle: "neg",
    text: "Zapiekanka lub fast-food, po którym zawsze żałujesz decyzji?",
  },
  {
    id: "pl-food-08",
    language: "pl",
    pool: "pl_food",
    angle: "weird",
    text: "Co wrzucasz do koszyka w Biedronce o 21:55 przed zamknięciem?",
  },
  {
    id: "pl-food-09",
    language: "pl",
    pool: "pl_food",
    angle: "weird",
    text: "Jedyne jedzenie, które potrafisz ugotować bez patrzenia w telefon?",
  },
  {
    id: "pl-food-10",
    language: "pl",
    pool: "pl_food",
    angle: "weird",
    text: "Co stoi na polskim stole na każdym weselu i imieninach?",
  },

  // pl_places (10) — polskie miasta, wakacje, miejscówki
  {
    id: "pl-places-01",
    language: "pl",
    pool: "pl_places",
    angle: "pos",
    text: "Najlepsze polskie miasto na spontaniczny weekend ze znajomymi?",
  },
  {
    id: "pl-places-02",
    language: "pl",
    pool: "pl_places",
    angle: "pos",
    text: "Wymarzone miejsce nad Bałtykiem albo w górach na długi weekend?",
  },
  {
    id: "pl-places-03",
    language: "pl",
    pool: "pl_places",
    angle: "pos",
    text: "Miasto w Polsce, w którym zjadłeś najlepsze jedzenie w życiu?",
  },
  {
    id: "pl-places-04",
    language: "pl",
    pool: "pl_places",
    angle: "neg",
    text: "Polskie miasto, do którego nie chcesz wracać nawet za darmo?",
  },
  {
    id: "pl-places-05",
    language: "pl",
    pool: "pl_places",
    angle: "neg",
    text: "Gdzie w Polsce korki i parawany doprowadzają cię do szału?",
  },
  {
    id: "pl-places-06",
    language: "pl",
    pool: "pl_places",
    angle: "neg",
    text: "Najbardziej przereklamowany kurort wakacyjny w Polsce?",
  },
  {
    id: "pl-places-07",
    language: "pl",
    pool: "pl_places",
    angle: "weird",
    text: "Miasto, w którym najłatwiej zgubić się po imprezie?",
  },
  {
    id: "pl-places-08",
    language: "pl",
    pool: "pl_places",
    angle: "weird",
    text: "Skąd pochodzi najbardziej memiczny stereotyp w Polsce?",
  },
  {
    id: "pl-places-09",
    language: "pl",
    pool: "pl_places",
    angle: "weird",
    text: "Gdzie w Polsce wysiadałeś z pociągu PKP z totalnym opóźnieniem?",
  },
  {
    id: "pl-places-10",
    language: "pl",
    pool: "pl_places",
    angle: "pos",
    text: "Polskie miasto z najlepszym klimatem nocnego życia?",
  },

  // pl_table (10) — "Kto przy tym stole..."
  {
    id: "pl-table-01",
    language: "pl",
    pool: "pl_table",
    angle: "pos",
    text: "Kto przy tym stole jako pierwszy ogarnie jedzenie na kacu dla całej ekipy?",
  },
  {
    id: "pl-table-02",
    language: "pl",
    pool: "pl_table",
    angle: "pos",
    text: "Kto przy tym stole ma najlepszą gadkę i wyjdzie z każdego mandatu?",
  },
  {
    id: "pl-table-03",
    language: "pl",
    pool: "pl_table",
    angle: "pos",
    text: "Kto przy tym stole zawsze robi najlepsze memy i zdjęcia z wyjazdów?",
  },
  {
    id: "pl-table-04",
    language: "pl",
    pool: "pl_table",
    angle: "neg",
    text: "Kto przy tym stole zawsze spóźnia się minimum 40 minut i mówi, że już jedzie?",
  },
  {
    id: "pl-table-05",
    language: "pl",
    pool: "pl_table",
    angle: "neg",
    text: "Kto przy tym stole nigdy nie oddaje BLIK-a bez przypomnienia?",
  },
  {
    id: "pl-table-06",
    language: "pl",
    pool: "pl_table",
    angle: "neg",
    text: "Kto przy tym stole odpada z imprezy jako pierwszy przed 23:00?",
  },
  {
    id: "pl-table-07",
    language: "pl",
    pool: "pl_table",
    angle: "weird",
    text: "Kto przy tym stole napisałby po pijaku do byłej/byłego o 3 w nocy?",
  },
  {
    id: "pl-table-08",
    language: "pl",
    pool: "pl_table",
    angle: "weird",
    text: "Kto przy tym stole zamówi kebab z ostrym sosem i będzie płakać?",
  },
  {
    id: "pl-table-09",
    language: "pl",
    pool: "pl_table",
    angle: "weird",
    text: "Kto przy tym stole ma najdziwniejszą historię z przejazdu PKP lub Uberem?",
  },
  {
    id: "pl-table-10",
    language: "pl",
    pool: "pl_table",
    angle: "pos",
    text: "Kto przy tym stole przeżyłby najdłużej w polskim survivalu bez zasięgu?",
  },

  // pl_spicy (10) — 18+ pikantne polskie pytania przy stole
  {
    id: "pl-spicy-01",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "pos",
    text: "Kto przy tym stole najlepiej całuje według legend tej ekipy?",
  },
  {
    id: "pl-spicy-02",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "pos",
    text: "Kto przy tym stole ma najbardziej pikantną historię z wakacji w Polsce?",
  },
  {
    id: "pl-spicy-03",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "pos",
    text: "Kto przy tym stole mógłby podbić każdego na Tinderze w 5 minut?",
  },
  {
    id: "pl-spicy-04",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "neg",
    text: "Kto przy tym stole wysłał kiedyś ryzykowną fotkę nie do tej osoby?",
  },
  {
    id: "pl-spicy-05",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "neg",
    text: "Kto przy tym stole ma na koncie najbardziej niezręczną randkę roku?",
  },
  {
    id: "pl-spicy-06",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "neg",
    text: "Kto przy tym stole najbardziej udaje grzecznego, a ma najwięcej za uszami?",
  },
  {
    id: "pl-spicy-07",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "weird",
    text: "Kto przy tym stole skusiłby się na szybki numer w toalecie klubu?",
  },
  {
    id: "pl-spicy-08",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "weird",
    text: "Kto przy tym stole ma najdziwniejszy fetysz lub guilty pleasure?",
  },
  {
    id: "pl-spicy-09",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "weird",
    text: "Kto przy tym stole wróciłby do łóżka z eks po dwóch głębszych?",
  },
  {
    id: "pl-spicy-10",
    language: "pl",
    pool: "pl_spicy",
    spicy: true,
    angle: "pos",
    text: "Kto przy tym stole rozkręciłby najostrzejsze afterparty po tym wieczorze?",
  },

  // =========================================================================
  // FRENCH (fr) — 24 questions across 3 pools
  // =========================================================================

  // fr_life (8) — apéro, boulangerie, gastronomie
  {
    id: "fr-life-01",
    language: "fr",
    pool: "fr_life",
    angle: "pos",
    text: "La meilleure viennoiserie de boulangerie pour sauver un dimanche matin ?",
  },
  {
    id: "fr-life-02",
    language: "fr",
    pool: "fr_life",
    angle: "pos",
    text: "Ton incontournable absolu sur une planche d'apéro parfaite ?",
  },
  {
    id: "fr-life-03",
    language: "fr",
    pool: "fr_life",
    angle: "pos",
    text: "Le meilleur sandwich grec ou kebab de fin de soirée ?",
  },
  {
    id: "fr-life-04",
    language: "fr",
    pool: "fr_life",
    angle: "neg",
    text: "Le truc de cantine ou de frigo que tu refuses de manger même affamé ?",
  },
  {
    id: "fr-life-05",
    language: "fr",
    pool: "fr_life",
    angle: "neg",
    text: "La boisson d'apéro la plus surcotée selon toi ?",
  },
  {
    id: "fr-life-06",
    language: "fr",
    pool: "fr_life",
    angle: "neg",
    text: "Le fromage ou plat français dont l'odeur te fait fuir ?",
  },
  {
    id: "fr-life-07",
    language: "fr",
    pool: "fr_life",
    angle: "weird",
    text: "Ce que tu achètes en urgence à la supérette avant qu'elle ferme à 22h ?",
  },
  {
    id: "fr-life-08",
    language: "fr",
    pool: "fr_life",
    angle: "weird",
    text: "Le seul truc que tu commandes quand tu veux faire semblant d'être chic ?",
  },

  // fr_table (8) — French friend banter
  {
    id: "fr-table-01",
    language: "fr",
    pool: "fr_table",
    angle: "pos",
    text: "Qui autour de cette table organise toujours les meilleurs apéros ?",
  },
  {
    id: "fr-table-02",
    language: "fr",
    pool: "fr_table",
    angle: "pos",
    text: "Qui autour de cette table a le meilleur bagout pour éviter une amende ?",
  },
  {
    id: "fr-table-03",
    language: "fr",
    pool: "fr_table",
    angle: "pos",
    text: "Qui autour de cette table connaît les meilleurs bons plans bouffe ?",
  },
  {
    id: "fr-table-04",
    language: "fr",
    pool: "fr_table",
    angle: "neg",
    text: "Qui autour de cette table râle le plus fort dès que le métro a 2 minutes de retard ?",
  },
  {
    id: "fr-table-05",
    language: "fr",
    pool: "fr_table",
    angle: "neg",
    text: "Qui autour de cette table disparaît au moment de payer l'addition ?",
  },
  {
    id: "fr-table-06",
    language: "fr",
    pool: "fr_table",
    angle: "neg",
    text: "Qui autour de cette table s'endort sur le canapé avant minuit ?",
  },
  {
    id: "fr-table-07",
    language: "fr",
    pool: "fr_table",
    angle: "weird",
    text: "Qui autour de cette table pourrait rater son arrêt de RER à cause d'un débat inutile ?",
  },
  {
    id: "fr-table-08",
    language: "fr",
    pool: "fr_table",
    angle: "weird",
    text: "Qui autour de cette table dit « j'arrive dans 5 min » alors qu'il est sous la douche ?",
  },

  // fr_spicy (8) — French 18+ spicy
  {
    id: "fr-spicy-01",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "pos",
    text: "Qui autour de cette table embrasse le mieux selon la légende ?",
  },
  {
    id: "fr-spicy-02",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "pos",
    text: "Qui autour de cette table a le plus de succès en soirée après deux verres ?",
  },
  {
    id: "fr-spicy-03",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "neg",
    text: "Qui autour de cette table a déjà envoyé un message très chaud au mauvais destinataire ?",
  },
  {
    id: "fr-spicy-04",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "neg",
    text: "Qui autour de cette table cache le dossier le plus gênant sur son ex ?",
  },
  {
    id: "fr-spicy-05",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "neg",
    text: "Qui autour de cette table fait semblant d'être sage alors que pas du tout ?",
  },
  {
    id: "fr-spicy-06",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "weird",
    text: "Qui autour de cette table serait capable de ghoster quelqu'un après un date parfait ?",
  },
  {
    id: "fr-spicy-07",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "weird",
    text: "Qui autour de cette table a le fantasme le plus improbable ?",
  },
  {
    id: "fr-spicy-08",
    language: "fr",
    pool: "fr_spicy",
    spicy: true,
    angle: "pos",
    text: "Qui autour de cette table pourrait séduire n'importe qui en terrasse ?",
  },

  // =========================================================================
  // SPANISH (es) — 24 questions across 3 pools
  // =========================================================================

  // es_fiesta (8) — tapas, fiesta, comida
  {
    id: "es-fiesta-01",
    language: "es",
    pool: "es_fiesta",
    angle: "pos",
    text: "¿La mejor tapa para pedir siempre en cualquier bar?",
  },
  {
    id: "es-fiesta-02",
    language: "es",
    pool: "es_fiesta",
    angle: "pos",
    text: "¿Tu bebida favorita para empezar una buena noche de fiesta?",
  },
  {
    id: "es-fiesta-03",
    language: "es",
    pool: "es_fiesta",
    angle: "pos",
    text: "¿El mejor desayuno de resaca después de volver a las 7 de la mañana?",
  },
  {
    id: "es-fiesta-04",
    language: "es",
    pool: "es_fiesta",
    angle: "neg",
    text: "¿La tapa o plato típico más sobrevalorado que existe?",
  },
  {
    id: "es-fiesta-05",
    language: "es",
    pool: "es_fiesta",
    angle: "neg",
    text: "¿Qué comida de bar te da ardor solo de mirarla?",
  },
  {
    id: "es-fiesta-06",
    language: "es",
    pool: "es_fiesta",
    angle: "neg",
    text: "¿El chupito que juraste no volver a tomar nunca más?",
  },
  {
    id: "es-fiesta-07",
    language: "es",
    pool: "es_fiesta",
    angle: "weird",
    text: "¿Qué compras en el chino de la esquina a las 2 de la madrugada?",
  },
  {
    id: "es-fiesta-08",
    language: "es",
    pool: "es_fiesta",
    angle: "weird",
    text: "¿Qué plato nunca falta en casa de tu abuela aunque haga 40 grados?",
  },

  // es_table (8) — Spanish friend banter
  {
    id: "es-table-01",
    language: "es",
    pool: "es_table",
    angle: "pos",
    text: "¿Quién de esta mesa aguanta la fiesta hasta el último after?",
  },
  {
    id: "es-table-02",
    language: "es",
    pool: "es_table",
    angle: "pos",
    text: "¿Quién de esta mesa siempre encuentra el mejor bar con tapas gratis?",
  },
  {
    id: "es-table-03",
    language: "es",
    pool: "es_table",
    angle: "pos",
    text: "¿Quién de esta mesa tiene más labia para entrar gratis en la discoteca?",
  },
  {
    id: "es-table-04",
    language: "es",
    pool: "es_table",
    angle: "neg",
    text: "¿Quién de esta mesa dice 'ya estoy bajando' cuando aún está en pijama?",
  },
  {
    id: "es-table-05",
    language: "es",
    pool: "es_table",
    angle: "neg",
    text: "¿Quién de esta mesa siempre se olvida de hacer el Bizum?",
  },
  {
    id: "es-table-06",
    language: "es",
    pool: "es_table",
    angle: "neg",
    text: "¿Quién de esta mesa se echa una siesta de 20 minutos y se despierta de noche?",
  },
  {
    id: "es-table-07",
    language: "es",
    pool: "es_table",
    angle: "weird",
    text: "¿Quién de esta mesa acaba hablando con desconocidos en la cola del baño?",
  },
  {
    id: "es-table-08",
    language: "es",
    pool: "es_table",
    angle: "weird",
    text: "¿Quién de esta mesa manda audios de 6 minutos por WhatsApp?",
  },

  // es_spicy (8) — Spanish 18+ spicy
  {
    id: "es-spicy-01",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "pos",
    text: "¿Quién de esta mesa liga más rápido con solo una mirada?",
  },
  {
    id: "es-spicy-02",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "pos",
    text: "¿Quién de esta mesa tiene la historia más picante de un verano en la playa?",
  },
  {
    id: "es-spicy-03",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "neg",
    text: "¿Quién de esta mesa volvería con su ex después de tres copas?",
  },
  {
    id: "es-spicy-04",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "neg",
    text: "¿Quién de esta mesa tiene el historial de citas más desastroso?",
  },
  {
    id: "es-spicy-05",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "neg",
    text: "¿Quién de esta mesa parece un ángel pero tiene más peligro que nadie?",
  },
  {
    id: "es-spicy-06",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "weird",
    text: "¿Quién de esta mesa mandaría una foto subida de tono por error al grupo familiar?",
  },
  {
    id: "es-spicy-07",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "weird",
    text: "¿Quién de esta mesa tiene el fetiche o gusto más raro en secreto?",
  },
  {
    id: "es-spicy-08",
    language: "es",
    pool: "es_spicy",
    spicy: true,
    angle: "pos",
    text: "¿Quién de esta mesa besa mejor según los rumores del grupo?",
  },

  // =========================================================================
  // GERMAN (de) — 24 questions across 3 pools
  // =========================================================================

  // de_alltag (8) — Döner, Feierabend, Essen
  {
    id: "de-alltag-01",
    language: "de",
    pool: "de_alltag",
    angle: "pos",
    text: "Welches Feierabend-Getränk rettet dir jeden miesen Tag?",
  },
  {
    id: "de-alltag-02",
    language: "de",
    pool: "de_alltag",
    angle: "pos",
    text: "Was gehört für dich unbedingt in den perfekten Döner?",
  },
  {
    id: "de-alltag-03",
    language: "de",
    pool: "de_alltag",
    angle: "pos",
    text: "Der beste deutsche Snack vom Bäcker oder Späti um 2 Uhr nachts?",
  },
  {
    id: "de-alltag-04",
    language: "de",
    pool: "de_alltag",
    angle: "neg",
    text: "Welches typisch deutsche Essen kannst du absolut nicht ausstehen?",
  },
  {
    id: "de-alltag-05",
    language: "de",
    pool: "de_alltag",
    angle: "neg",
    text: "Welches Bier oder Mischgetränk ist komplett überbewertet?",
  },
  {
    id: "de-alltag-06",
    language: "de",
    pool: "de_alltag",
    angle: "neg",
    text: "Welcher Imbiss-Klassiker liegt dir immer wie ein Stein im Magen?",
  },
  {
    id: "de-alltag-07",
    language: "de",
    pool: "de_alltag",
    angle: "weird",
    text: "Was kaufst du panisch um 20:58 Uhr bei Aldi vor Ladenschluss?",
  },
  {
    id: "de-alltag-08",
    language: "de",
    pool: "de_alltag",
    angle: "weird",
    text: "Was isst du heimlich direkt aus dem Kühlschrank, wenn niemand guckt?",
  },

  // de_table (8) — German friend banter
  {
    id: "de-table-01",
    language: "de",
    pool: "de_table",
    angle: "pos",
    text: "Wer hier am Tisch kennt den besten Dönerladen in der ganzen Stadt?",
  },
  {
    id: "de-table-02",
    language: "de",
    pool: "de_table",
    angle: "pos",
    text: "Wer hier am Tisch plant jeden Urlaub mit perfektem Excel-Sheet?",
  },
  {
    id: "de-table-03",
    language: "de",
    pool: "de_table",
    angle: "pos",
    text: "Wer hier am Tisch hält beim Feiern immer bis zum ersten Zug durch?",
  },
  {
    id: "de-table-04",
    language: "de",
    pool: "de_table",
    angle: "neg",
    text: "Wer hier am Tisch regt sich am lautesten über die Deutsche Bahn auf?",
  },
  {
    id: "de-table-05",
    language: "de",
    pool: "de_table",
    angle: "neg",
    text: "Wer hier am Tisch schickt dir für 1,20 € noch eine PayPal-Anfrage?",
  },
  {
    id: "de-table-06",
    language: "de",
    pool: "de_table",
    angle: "neg",
    text: "Wer hier am Tisch verschwindet auf Partys einfach ohne Tschüss zu sagen?",
  },
  {
    id: "de-table-07",
    language: "de",
    pool: "de_table",
    angle: "weird",
    text: "Wer hier am Tisch hat schon mal im Nachtbus geschlafen und die Endstation verpasst?",
  },
  {
    id: "de-table-08",
    language: "de",
    pool: "de_table",
    angle: "weird",
    text: "Wer hier am Tisch reserviert am liebsten schon morgens die Liege mit dem Handtuch?",
  },

  // de_spicy (8) — German 18+ spicy
  {
    id: "de-spicy-01",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "pos",
    text: "Wer hier am Tisch küsst angeblich am besten?",
  },
  {
    id: "de-spicy-02",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "pos",
    text: "Wer hier am Tisch hat die wildeste Geschichte aus dem letzten Club-Abend?",
  },
  {
    id: "de-spicy-03",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "neg",
    text: "Wer hier am Tisch schreibt nach drei Bier garantiert dem oder der Ex?",
  },
  {
    id: "de-spicy-04",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "neg",
    text: "Wer hier am Tisch hatte schon das peinlichste Tinder-Date des Jahres?",
  },
  {
    id: "de-spicy-05",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "neg",
    text: "Wer hier am Tisch tut am bravsten, hat es aber faustdick hinter den Ohren?",
  },
  {
    id: "de-spicy-06",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "weird",
    text: "Wer hier am Tisch würde heimlich ein heißes Foto aus Versehen in die Familiengruppe schicken?",
  },
  {
    id: "de-spicy-07",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "weird",
    text: "Wer hier am Tisch hat den seltsamsten geheimen Kink?",
  },
  {
    id: "de-spicy-08",
    language: "de",
    pool: "de_spicy",
    spicy: true,
    angle: "pos",
    text: "Wer hier am Tisch könnte an der Bar innerhalb von fünf Minuten jeden klarmachen?",
  },
];

function buildLocalizedPairs(
  language: Exclude<GameLanguage, "en">,
  spicyMode: boolean,
): readonly QuestionPair[] {
  const byPool = new Map<string, LocalizedPoolItem[]>();
  for (const item of LOCALIZED_ITEMS) {
    if (item.language !== language) continue;
    if (!spicyMode && item.spicy) continue;
    const list = byPool.get(item.pool) ?? [];
    list.push(item);
    byPool.set(item.pool, list);
  }

  const pairs: QuestionPair[] = [];
  byPool.forEach((group, pool) => {
    for (let i = 0; i < group.length; i += 1) {
      const normal = group[i]!;
      for (let j = 0; j < group.length; j += 1) {
        if (i === j) continue;
        const impostor = group[j]!;
        if (normal.angle === impostor.angle) continue;
        if (normal.text.trim().toLowerCase() === impostor.text.trim().toLowerCase()) continue;
        pairs.push({
          id: `loc:${pool}:${normal.id}:${impostor.id}`,
          normalQuestion: normal.text,
          impostorQuestion: impostor.text,
        });
      }
      const wildcard = LOCALIZED_WILDCARDS[pool];
      if (wildcard) {
        pairs.push({
          id: `locwild:${pool}:${normal.id}`,
          normalQuestion: normal.text,
          impostorQuestion: wildcard,
        });
      }
    }
  });
  return pairs;
}

const LOCALIZED_PAIR_CACHE: Record<
  Exclude<GameLanguage, "en">,
  { friendly: readonly QuestionPair[]; spicy: readonly QuestionPair[] }
> = {
  pl: {
    friendly: buildLocalizedPairs("pl", false),
    spicy: buildLocalizedPairs("pl", true),
  },
  fr: {
    friendly: buildLocalizedPairs("fr", false),
    spicy: buildLocalizedPairs("fr", true),
  },
  es: {
    friendly: buildLocalizedPairs("es", false),
    spicy: buildLocalizedPairs("es", true),
  },
  de: {
    friendly: buildLocalizedPairs("de", false),
    spicy: buildLocalizedPairs("de", true),
  },
};

const NATIVE_TEXTS_BY_LANGUAGE: Record<Exclude<GameLanguage, "en">, ReadonlySet<string>> = (() => {
  const sets: Record<Exclude<GameLanguage, "en">, Set<string>> = {
    pl: new Set<string>(),
    fr: new Set<string>(),
    es: new Set<string>(),
    de: new Set<string>(),
  };
  for (const item of LOCALIZED_ITEMS) {
    sets[item.language].add(item.text.trim().toLowerCase());
    const wildcard = LOCALIZED_WILDCARDS[item.pool];
    if (wildcard) {
      sets[item.language].add(wildcard.trim().toLowerCase());
    }
  }
  return sets;
})();

export function getLocalizedPairs(language: GameLanguage, spicyMode: boolean): readonly QuestionPair[] {
  if (language === "en") return [];
  const entry = LOCALIZED_PAIR_CACHE[language];
  return spicyMode ? entry.spicy : entry.friendly;
}

export function isNativeLocalizedQuestion(language: GameLanguage, text: string): boolean {
  if (language === "en") return false;
  return NATIVE_TEXTS_BY_LANGUAGE[language].has(text.trim().toLowerCase());
}

export function getLocalizedItems() {
  return LOCALIZED_ITEMS;
}
