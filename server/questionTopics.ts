export type QuestionAngle = "pos" | "neg" | "weird";

export interface TopicEntry {
  id: string;
  angle: QuestionAngle;
  spicy?: boolean;
  phrase: string;
}

export interface TopicGroup {
  pool: string;
  template: (phrase: string) => string;
  topics: readonly TopicEntry[];
}

export interface GeneratedTopicQuestion {
  id: string;
  pool: string;
  spicy?: boolean;
  angle: QuestionAngle;
  text: string;
}

export function buildTopicQuestions(groups: readonly TopicGroup[]): GeneratedTopicQuestion[] {
  const items: GeneratedTopicQuestion[] = [];
  for (const group of groups) {
    for (const topic of group.topics) {
      items.push({
        id: `topic-${group.pool}-${topic.id}`,
        pool: group.pool,
        ...(topic.spicy ? { spicy: true } : {}),
        angle: topic.angle,
        text: group.template(topic.phrase),
      });
    }
  }
  return items;
}

const TABLE_PLAYER_TOPICS: readonly TopicEntry[] = [
  // Positive / Brag-worthy ("pos")
  { id: "smartest", angle: "pos", phrase: "is the smartest" },
  { id: "prettiest", angle: "pos", phrase: "is the prettiest" },
  { id: "boxing", angle: "pos", phrase: "would win in a boxing match" },
  { id: "island", angle: "pos", phrase: "would survive longest on an uninhabited island" },
  { id: "millionaire", angle: "pos", phrase: "is most likely to become a millionaire" },
  { id: "president", angle: "pos", phrase: "would make the best president" },
  { id: "chef", angle: "pos", phrase: "is the best cook" },
  { id: "funniest", angle: "pos", phrase: "is the funniest when not even trying" },
  { id: "loyal", angle: "pos", phrase: "would never snitch under interrogation" },
  { id: "clutch", angle: "pos", phrase: "is the most clutch in an emergency" },
  { id: "style", angle: "pos", phrase: "has the best style" },
  { id: "famous", angle: "pos", phrase: "is most likely to accidentally go viral" },

  // Negative / Roast ("neg")
  { id: "dumbest", angle: "neg", phrase: "would do the dumbest thing for $20" },
  { id: "dies-first", angle: "neg", phrase: "would die first in a horror movie" },
  { id: "worst-driver", angle: "neg", phrase: "is the worst driver" },
  { id: "always-late", angle: "neg", phrase: "is always the last one ready" },
  { id: "worst-liar", angle: "neg", phrase: "is the worst liar" },
  { id: "broke-first", angle: "neg", phrase: "would blow a lottery win in one week" },
  { id: "ghosts", angle: "neg", phrase: "is most likely to leave everyone on read" },
  { id: "drama", angle: "neg", phrase: "starts the most drama in the group chat" },
  { id: "scam", angle: "neg", phrase: "would fall for an obvious internet scam" },
  { id: "snitch", angle: "neg", phrase: "would snitch immediately for a free meal" },
  { id: "cry", angle: "neg", phrase: "cries the easiest at movies" },
  { id: "clumsy", angle: "neg", phrase: "is most likely to break something in a museum" },

  // Chaotic / Weird ("weird")
  { id: "arrested", angle: "weird", phrase: "would get arrested first on a group trip" },
  { id: "cult", angle: "weird", phrase: "would accidentally start a cult" },
  { id: "aliens", angle: "weird", phrase: "is most likely to be an alien in disguise" },
  { id: "zombie", angle: "weird", phrase: "would try to pet a zombie" },
  { id: "fbi", angle: "weird", phrase: "has the most concerning search history" },
  { id: "karaoke", angle: "weird", phrase: "takes karaoke way too seriously" },
  { id: "pigeon", angle: "weird", phrase: "would lose a fight against a goose" },
  { id: "sleepwalk", angle: "weird", phrase: "would sleepwalk out of a hotel room" },
  { id: "rename", angle: "weird", phrase: "would fake their death and move to an island" },
  { id: "tattoo", angle: "weird", phrase: "is most likely to get a terrible impulse tattoo" },
  { id: "floor-food", angle: "weird", phrase: "still eats food off the floor after 10 seconds" },
  { id: "own-jokes", angle: "weird", phrase: "laughs hardest at their own jokes" },
  { id: "mirror-talk", angle: "weird", phrase: "practices speeches in the bathroom mirror" },
  { id: "blame-dog", angle: "neg", phrase: "would fart in a crowded elevator and blame someone else" },
  { id: "you-too", angle: "neg", phrase: "always says 'you too' when the delivery driver says enjoy" },
  { id: "pigeon-fight", angle: "neg", phrase: "would lose a staring contest to a pigeon" },
  { id: "least-funny", angle: "neg", phrase: "thinks they are hilarious but is the least funny" },
  { id: "best-liar", angle: "neg", phrase: "is dangerously good at lying with a straight face" },
  { id: "most-gullible", angle: "neg", phrase: "believes every fake TikTok fact they see" },
  { id: "worst-advice", angle: "neg", phrase: "gives the absolute worst life advice" },
  { id: "lawyer", angle: "pos", phrase: "would you want defending you in court" },
  { id: "worst-roommate", angle: "neg", phrase: "would be the worst roommate" },
  { id: "best-neighbor", angle: "pos", phrase: "would be the best neighbor" },
  { id: "cool-teacher", angle: "weird", phrase: "would be the coolest high school teacher" },

  // Spicy 18+ ("spicy: true")
  { id: "flirt", angle: "pos", spicy: true, phrase: "is the smoothest flirt" },
  { id: "rizz", angle: "pos", spicy: true, phrase: "gets the most attention on a night out" },
  { id: "red-flag", angle: "neg", spicy: true, phrase: "is a walking red flag" },
  { id: "ex-text", angle: "neg", spicy: true, phrase: "is most likely to text an ex at 2 a.m." },
  { id: "toxic", angle: "neg", spicy: true, phrase: "has the worst taste in partners" },
  { id: "truth-dare", angle: "weird", spicy: true, phrase: "would fold fastest in Truth or Dare" },
  { id: "walk-shame", angle: "weird", spicy: true, phrase: "has the wildest weekend stories" },
  { id: "onlyfans", angle: "weird", spicy: true, phrase: "would actually survive on reality TV dating" },
];

const SONG_TOPICS: readonly TopicEntry[] = [
  { id: "karaoke", angle: "pos", phrase: "is your undefeated karaoke anthem" },
  { id: "gym", angle: "pos", phrase: "instantly gives you main-character energy" },
  { id: "roadtrip", angle: "pos", phrase: "everyone in the car has to scream along to" },
  { id: "repeat", angle: "pos", phrase: "you could listen to on repeat for an hour" },
  { id: "timeless", angle: "pos", phrase: "will still be a banger 30 years from now" },
  { id: "vibe", angle: "pos", phrase: "is the ultimate late-night drive track" },
  { id: "dance", angle: "pos", phrase: "instantly gets everyone onto the dance floor" },
  { id: "summer", angle: "pos", phrase: "is the ultimate sunny-day windows-down anthem" },
  { id: "intro", angle: "pos", phrase: "has the best opening five seconds in music history" },
  { id: "overplayed", angle: "neg", phrase: "is so overplayed you never want to hear it again" },
  { id: "skip", angle: "neg", phrase: "makes you hit skip in under two seconds" },
  { id: "stuck", angle: "neg", phrase: "is the most annoying earworm ever made" },
  { id: "cringe", angle: "neg", phrase: "you used to love but now makes you cringe" },
  { id: "alarm", angle: "neg", phrase: "would make the worst morning alarm" },
  { id: "wedding-ban", angle: "neg", phrase: "should be permanently banned from wedding receptions" },
  { id: "mall", angle: "neg", phrase: "makes you want to leave a store immediately when it plays" },
  { id: "lyrics-wrong", angle: "neg", phrase: "does everyone confidently sing the wrong lyrics to" },
  { id: "too-long", angle: "neg", phrase: "feels three times longer than it actually is" },
  { id: "breakup", angle: "neg", spicy: true, phrase: "hits way too hard after a breakup" },
  { id: "villain", angle: "weird", phrase: "would play during your villain entrance" },
  { id: "funeral", angle: "weird", phrase: "would be hilarious to play at a funeral" },
  { id: "shower", angle: "weird", phrase: "you secretly belt out in the shower" },
  { id: "guilty", angle: "weird", phrase: "is your biggest guilty-pleasure banger" },
  { id: "fight", angle: "weird", phrase: "would be your walk-out song for a boxing match" },
  { id: "cooking", angle: "weird", phrase: "would you play while dramatically cooking pasta" },
  { id: "alien-greeting", angle: "weird", phrase: "should humanity play to welcome visiting aliens" },
  { id: "elevator", angle: "weird", phrase: "would be the funniest to hear as quiet elevator music" },
  { id: "pet-theme", angle: "weird", phrase: "would be your pet's personal theme song" },
  { id: "spicy-mood", angle: "weird", spicy: true, phrase: "belongs on a questionable 2 a.m. playlist" },
];

const MUSIC_ARTIST_TOPICS: readonly TopicEntry[] = [
  { id: "concert", angle: "pos", phrase: "would you pay way too much to see live" },
  { id: "genius", angle: "pos", phrase: "is a genuine musical genius" },
  { id: "top-played", angle: "pos", phrase: "dominates your playlists every year" },
  { id: "collab", angle: "pos", phrase: "would you trust to write your theme song" },
  { id: "dj-party", angle: "pos", phrase: "would throw the best house party" },
  { id: "legend", angle: "pos", phrase: "never misses with an album" },
  { id: "soundtrack", angle: "pos", phrase: "should score the movie of your life" },
  { id: "vocals", angle: "pos", phrase: "has the most unreal live vocals" },
  { id: "timeless", angle: "pos", phrase: "will still be iconic a hundred years from now" },
  { id: "overrated", angle: "neg", phrase: "do you think is wildly overrated" },
  { id: "mute", angle: "neg", phrase: "makes you instantly reach for the volume knob" },
  { id: "drama", angle: "neg", phrase: "has the most unhinged fanbase" },
  { id: "fell-off", angle: "neg", phrase: "fell off the hardest" },
  { id: "aux-ban", angle: "neg", phrase: "gets you banned from the aux cord" },
  { id: "one-hit", angle: "neg", phrase: "only ever made one truly good song" },
  { id: "ticket-price", angle: "neg", phrase: "charges way too much for concert tickets" },
  { id: "same-song", angle: "neg", phrase: "just keeps releasing the exact same song over and over" },
  { id: "bad-live", angle: "neg", phrase: "sounds way better in the studio than live" },
  { id: "toxic-lyrics", angle: "neg", spicy: true, phrase: "makes music strictly for toxic people" },
  { id: "roommate", angle: "weird", phrase: "would be the weirdest roommate" },
  { id: "president", angle: "weird", phrase: "would be the funniest world leader" },
  { id: "guilty-fan", angle: "weird", phrase: "do you secretly listen to without telling friends" },
  { id: "alien", angle: "weird", phrase: "is probably from another planet" },
  { id: "boxing", angle: "weird", phrase: "would survive a zombie apocalypse" },
  { id: "karaoke-judge", angle: "weird", phrase: "would be the harshest karaoke judge" },
  { id: "cooking-show", angle: "weird", phrase: "should host a chaotic cooking competition" },
  { id: "haunted", angle: "weird", phrase: "would you trust to investigate a haunted house with you" },
  { id: "museum", angle: "weird", phrase: "deserves their own bizarre wax museum" },
  { id: "crush", angle: "pos", spicy: true, phrase: "is your biggest celebrity musician crush" },
];

const FOOD_TOPICS: readonly TopicEntry[] = [
  { id: "3am", angle: "pos", phrase: "is the ultimate 3 a.m. snack" },
  { id: "forever", angle: "pos", phrase: "could you eat every day for a month" },
  { id: "comfort", angle: "pos", phrase: "fixes your mood instantly" },
  { id: "date", angle: "pos", phrase: "is the best first-date meal" },
  { id: "cook", angle: "pos", phrase: "is the best thing you know how to cook" },
  { id: "birthday", angle: "pos", phrase: "is your non-negotiable birthday request" },
  { id: "roadtrip", angle: "pos", phrase: "is the greatest road-trip fuel ever invented" },
  { id: "leftovers", angle: "pos", phrase: "tastes even better as next-day leftovers" },
  { id: "worth-wait", angle: "pos", phrase: "is actually worth waiting an hour in line for" },
  { id: "refuse", angle: "neg", phrase: "do you refuse to eat under any circumstances" },
  { id: "overrated", angle: "neg", phrase: "is way too overrated" },
  { id: "regret", angle: "neg", phrase: "always gives you instant stomach regret" },
  { id: "smell", angle: "neg", phrase: "smells terrible even if people love it" },
  { id: "childhood-hate", angle: "neg", phrase: "traumatized you as a kid" },
  { id: "messy", angle: "neg", phrase: "is impossible to eat without making a total mess" },
  { id: "expensive", angle: "neg", phrase: "is ridiculously overpriced for what it is" },
  { id: "texture", angle: "neg", phrase: "has a texture that immediately ruins it for you" },
  { id: "disappointing", angle: "neg", phrase: "looks amazing in photos but always disappoints" },
  { id: "weird-combo", angle: "weird", phrase: "sounds gross but actually slaps" },
  { id: "last-meal", angle: "weird", phrase: "would you pick as your dramatic last meal" },
  { id: "weapon", angle: "weird", phrase: "would make the weirdest weapon in a food fight" },
  { id: "sneak", angle: "weird", phrase: "would be funniest to sneak into a movie theater" },
  { id: "microwave", angle: "weird", phrase: "should be illegal to microwave in an office kitchen" },
  { id: "currency", angle: "weird", phrase: "would make the best replacement for paper money" },
  { id: "pigeon-bait", angle: "weird", phrase: "would you use to summon an army of seagulls" },
  { id: "candle", angle: "weird", phrase: "would make the most cursed scented candle" },
  { id: "museum", angle: "weird", phrase: "deserves its own national holiday" },
  { id: "hangover", angle: "weird", spicy: true, phrase: "is your undefeated hangover cure" },
];

const PLACE_TOPICS: readonly TopicEntry[] = [
  { id: "dream", angle: "pos", phrase: "is your #1 dream vacation spot" },
  { id: "move", angle: "pos", phrase: "would you move to tomorrow if money was free" },
  { id: "food-trip", angle: "pos", phrase: "has the best food in the world" },
  { id: "honeymoon", angle: "pos", phrase: "is the most romantic destination" },
  { id: "retire", angle: "pos", phrase: "would you love to retire in" },
  { id: "weekend", angle: "pos", phrase: "is the ultimate 48-hour weekend getaway" },
  { id: "friendly", angle: "pos", phrase: "has the warmest, friendliest locals" },
  { id: "scenery", angle: "pos", phrase: "looks like a real-life postcard from every angle" },
  { id: "festivals", angle: "pos", phrase: "has the best street markets and festivals" },
  { id: "tourist-trap", angle: "neg", phrase: "is the biggest overrated tourist trap" },
  { id: "never-again", angle: "neg", phrase: "would you never visit again" },
  { id: "lost", angle: "neg", phrase: "would be the worst place to lose your phone and wallet" },
  { id: "weather", angle: "neg", phrase: "has the most miserable weather" },
  { id: "traffic", angle: "neg", phrase: "sounds exhausting to live in" },
  { id: "expensive", angle: "neg", phrase: "destroys your bank account the fastest" },
  { id: "jetlag", angle: "neg", phrase: "is way too far away to be worth the flight" },
  { id: "crowded", angle: "neg", phrase: "is ruined by massive tourist crowds" },
  { id: "confusing", angle: "neg", phrase: "has the most confusing transit system to navigate" },
  { id: "fake-death", angle: "weird", phrase: "would you flee to if you faked your death" },
  { id: "aliens", angle: "weird", phrase: "would aliens probably invade first" },
  { id: "survival", angle: "weird", phrase: "would be the hardest place to survive a week in" },
  { id: "movie-set", angle: "weird", phrase: "looks like it was built as a sci-fi movie set" },
  { id: "time-travel", angle: "weird", phrase: "would you visit first if you had a time machine" },
  { id: "raccoon-king", angle: "weird", phrase: "could you probably become mayor of by accident" },
  { id: "heist", angle: "weird", phrase: "would be the coolest setting for a heist movie" },
  { id: "zombie-fort", angle: "weird", phrase: "would be your top pick during a zombie apocalypse" },
  { id: "postcard-lie", angle: "weird", phrase: "sounds completely made up until you see it on a map" },
  { id: "bachelor", angle: "weird", spicy: true, phrase: "would host the most chaotic bachelor/bachelorette trip" },
  { id: "honeymoon-flop", angle: "neg", spicy: true, phrase: "would be the worst place for a romantic getaway" },
];

const CHARACTER_TOPICS: readonly TopicEntry[] = [
  { id: "fight-ally", angle: "pos", phrase: "would you want on your team in a street fight" },
  { id: "swap", angle: "pos", phrase: "would you swap lives with for a week" },
  { id: "smartest", angle: "pos", phrase: "could outsmart anyone at this table" },
  { id: "best-friend", angle: "pos", phrase: "would make the most loyal best friend" },
  { id: "coolest", angle: "pos", phrase: "is effortlessly the coolest" },
  { id: "mentor", angle: "pos", phrase: "would you want as your life coach" },
  { id: "boss", angle: "pos", phrase: "would be the best boss to work for" },
  { id: "trivia", angle: "pos", phrase: "would carry your team to victory at trivia night" },
  { id: "style", angle: "pos", phrase: "has the most iconic wardrobe of all time" },
  { id: "annoying", angle: "neg", phrase: "is the most annoying main character ever" },
  { id: "roommate-bad", angle: "neg", phrase: "would be a nightmare roommate" },
  { id: "punch", angle: "neg", phrase: "do you want to punch in the face" },
  { id: "ruin-plan", angle: "neg", phrase: "would instantly ruin a heist" },
  { id: "overrated", angle: "neg", phrase: "is way too hyped up by fans" },
  { id: "text-back", angle: "neg", phrase: "would never text you back in an emergency" },
  { id: "group-project", angle: "neg", phrase: "would do zero work on a group project" },
  { id: "dramatic", angle: "neg", phrase: "is way too dramatic over tiny problems" },
  { id: "bad-advice", angle: "neg", phrase: "gives the worst advice in fiction" },
  { id: "president", angle: "weird", phrase: "would be the funniest world president" },
  { id: "driver", angle: "weird", phrase: "would you never let drive your car" },
  { id: "cooking", angle: "weird", phrase: "would burn water trying to cook" },
  { id: "grocery", angle: "weird", phrase: "would cause total chaos in a grocery store" },
  { id: "karaoke", angle: "weird", phrase: "would steal the mic at karaoke and refuse to leave" },
  { id: "podcast", angle: "weird", phrase: "should definitely not be allowed to start a podcast" },
  { id: "crush", angle: "pos", spicy: true, phrase: "was your biggest fictional crush growing up" },
  { id: "red-flag", angle: "neg", spicy: true, phrase: "is the biggest fictional red flag you'd still date" },
];

const APP_TOPICS: readonly TopicEntry[] = [
  { id: "first", angle: "pos", phrase: "do you open first every morning" },
  { id: "cant-live", angle: "pos", phrase: "could you never delete from your phone" },
  { id: "useful", angle: "pos", phrase: "actually improves your life the most" },
  { id: "music-chill", angle: "pos", phrase: "do you spend the happiest hours on" },
  { id: "worth-paying", angle: "pos", phrase: "is actually worth paying a subscription for" },
  { id: "learn", angle: "pos", phrase: "has taught you the most genuinely useful things" },
  { id: "clean-ui", angle: "pos", phrase: "is actually a joy to use because the design is so clean" },
  { id: "travel", angle: "pos", phrase: "saves your life every time you travel" },
  { id: "recommend", angle: "pos", phrase: "do you immediately tell all your friends to download" },
  { id: "waste", angle: "neg", phrase: "wastes the most hours of your life" },
  { id: "toxic", angle: "neg", phrase: "has the most toxic comment sections" },
  { id: "delete", angle: "neg", phrase: "should be deleted from the internet forever" },
  { id: "battery", angle: "neg", phrase: "kills your phone battery the fastest" },
  { id: "regret", angle: "neg", phrase: "makes you regret opening it every time" },
  { id: "notifications", angle: "neg", phrase: "sends the most annoying unnecessary notifications" },
  { id: "ads", angle: "neg", phrase: "has been completely ruined by ads" },
  { id: "slow", angle: "neg", phrase: "feels stuck in 2009 and desperately needs an update" },
  { id: "paywall", angle: "neg", phrase: "puts way too many basic features behind a paywall" },
  { id: "rabbit-hole", angle: "weird", phrase: "sends you down the weirdest 2 a.m. rabbit holes" },
  { id: "screen-time", angle: "weird", phrase: "would embarrass you most if your screen time leaked" },
  { id: "grandma", angle: "weird", phrase: "would be funniest to explain to your grandparents" },
  { id: "nostalgia", angle: "weird", phrase: "do you miss most from the early internet era" },
  { id: "museum", angle: "weird", phrase: "belongs in a digital history museum" },
  { id: "bored", angle: "weird", phrase: "do you open purely out of muscle memory when bored" },
  { id: "dating", angle: "neg", spicy: true, phrase: "is the worst place to meet a romantic partner" },
  { id: "stalk", angle: "weird", spicy: true, phrase: "is best for shameless late-night stalking" },
];

const JOB_TOPICS: readonly TopicEntry[] = [
  { id: "dream", angle: "pos", phrase: "would be your dream job if pay didn't matter" },
  { id: "rich", angle: "pos", phrase: "sounds like the easiest way to get rich" },
  { id: "respect", angle: "pos", phrase: "deserves way more respect and money" },
  { id: "good-at", angle: "pos", phrase: "do you think you'd secretly crush" },
  { id: "fun", angle: "pos", phrase: "looks like the most fun day-to-day" },
  { id: "chill", angle: "pos", phrase: "has the most relaxed work-life balance" },
  { id: "perks", angle: "pos", phrase: "comes with the coolest free perks" },
  { id: "hero", angle: "pos", phrase: "makes the biggest positive difference every day" },
  { id: "kid-dream", angle: "pos", phrase: "did you desperately want as a seven-year-old" },
  { id: "fired", angle: "neg", phrase: "would you get fired from on your very first day" },
  { id: "never", angle: "neg", phrase: "could you never do even for triple pay" },
  { id: "boring", angle: "neg", phrase: "sounds like the most soul-crushing job ever" },
  { id: "stress", angle: "neg", phrase: "would give you grey hairs in a week" },
  { id: "scammy", angle: "neg", phrase: "feels like a fake job title" },
  { id: "underpaid", angle: "neg", phrase: "is criminally underpaid for how hard it is" },
  { id: "early", angle: "neg", phrase: "requires waking up way too early for you to survive" },
  { id: "customers", angle: "neg", phrase: "forces you to deal with the worst customers" },
  { id: "ai-risk", angle: "neg", phrase: "feels most likely to be replaced by a robot" },
  { id: "weird-skill", angle: "weird", phrase: "sounds fake but is actually a real job" },
  { id: "movie", angle: "weird", phrase: "would make you look coolest in an action movie" },
  { id: "undercover", angle: "weird", phrase: "is the best cover identity for a spy" },
  { id: "lottery", angle: "weird", phrase: "would you do just for fun after winning the lottery" },
  { id: "tv-show", angle: "weird", phrase: "deserves its own wildly dramatic reality TV show" },
  { id: "uniform", angle: "weird", phrase: "has the best or funniest uniform" },
  { id: "date-redflag", angle: "neg", spicy: true, phrase: "is an instant red flag on a dating profile" },
  { id: "spicy-rich", angle: "weird", spicy: true, phrase: "would you do if you needed $10,000 by Friday" },
];

export const TOPIC_QUESTION_ITEMS: readonly GeneratedTopicQuestion[] = buildTopicQuestions([
  {
    pool: "table_players",
    template: (phrase) => `Who at this table ${phrase}?`,
    topics: TABLE_PLAYER_TOPICS,
  },
  {
    pool: "songs",
    template: (phrase) => `What song ${phrase}?`,
    topics: SONG_TOPICS,
  },
  {
    pool: "music_artists",
    template: (phrase) => `Which music artist or band ${phrase}?`,
    topics: MUSIC_ARTIST_TOPICS,
  },
  {
    pool: "foods",
    template: (phrase) => `What food or drink ${phrase}?`,
    topics: FOOD_TOPICS,
  },
  {
    pool: "places",
    template: (phrase) => `What country or city ${phrase}?`,
    topics: PLACE_TOPICS,
  },
  {
    pool: "characters",
    template: (phrase) => `Which fictional character ${phrase}?`,
    topics: CHARACTER_TOPICS,
  },
  {
    pool: "apps",
    template: (phrase) => `What app or website ${phrase}?`,
    topics: APP_TOPICS,
  },
  {
    pool: "jobs",
    template: (phrase) => `What job or career ${phrase}?`,
    topics: JOB_TOPICS,
  },
]);
