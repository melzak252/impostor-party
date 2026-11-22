export type QuestionAngle = "pos" | "neg" | "weird";

export interface TopicEntry {
  id: string;
  angle: QuestionAngle;
  spicy?: boolean;
  shape?: string;
  conflictGroup?: string;
  noWildcard?: boolean;
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
  shape?: string;
  conflictGroup?: string;
  noWildcard?: boolean;
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
        ...(topic.shape ? { shape: topic.shape } : {}),
        ...(topic.conflictGroup ? { conflictGroup: topic.conflictGroup } : {}),
        ...(topic.noWildcard ? { noWildcard: true } : {}),
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
  { id: "funniest", angle: "pos", conflictGroup: "humor_funny", phrase: "is the funniest when not even trying" },
  { id: "loyal", angle: "pos", conflictGroup: "honesty_lying", phrase: "would never snitch under interrogation" },
  { id: "clutch", angle: "pos", phrase: "is the most clutch in an emergency" },
  { id: "style", angle: "pos", phrase: "has the best style" },
  { id: "famous", angle: "pos", phrase: "is most likely to accidentally go viral" },

  // Negative / Roast ("neg")
  { id: "dumbest", angle: "neg", phrase: "would do the dumbest thing for $20" },
  { id: "dies-first", angle: "neg", phrase: "would die first in a horror movie" },
  { id: "worst-driver", angle: "neg", phrase: "is the worst driver" },
  { id: "always-late", angle: "neg", phrase: "is always the last one ready" },
  { id: "worst-liar", angle: "neg", conflictGroup: "honesty_lying", phrase: "is the worst liar" },
  { id: "broke-first", angle: "neg", phrase: "would blow a lottery win in one week" },
  { id: "ghosts", angle: "neg", phrase: "is most likely to leave everyone on read" },
  { id: "drama", angle: "neg", phrase: "starts the most drama in the group chat" },
  { id: "scam", angle: "neg", phrase: "would fall for an obvious internet scam" },
  { id: "snitch", angle: "neg", conflictGroup: "honesty_lying", phrase: "would snitch immediately for a free meal" },
  { id: "cry", angle: "neg", phrase: "cries the easiest at movies" },
  { id: "clumsy", angle: "neg", phrase: "is most likely to break something in a museum" },

  // Chaotic / Weird ("weird")
  { id: "arrested", angle: "weird", phrase: "would get arrested first on a group trip" },
  { id: "cult", angle: "weird", phrase: "would accidentally start a cult" },
  { id: "aliens", angle: "weird", phrase: "is most likely to be an alien in disguise" },
  { id: "zombie", angle: "weird", phrase: "would try to pet a zombie" },
  { id: "fbi", angle: "weird", phrase: "has the most concerning search history" },
  { id: "karaoke", angle: "weird", phrase: "takes karaoke way too seriously" },
  { id: "pigeon", angle: "weird", conflictGroup: "bird_lose", phrase: "would lose a fight against a goose" },
  { id: "sleepwalk", angle: "weird", phrase: "would sleepwalk out of a hotel room" },
  { id: "rename", angle: "weird", phrase: "would fake their death and move to an island" },
  { id: "tattoo", angle: "weird", phrase: "is most likely to get a terrible impulse tattoo" },
  { id: "floor-food", angle: "weird", phrase: "still eats food off the floor after 10 seconds" },
  { id: "own-jokes", angle: "weird", conflictGroup: "humor_funny", phrase: "laughs hardest at their own jokes" },
  { id: "mirror-talk", angle: "weird", phrase: "practices speeches in the bathroom mirror" },
  { id: "blame-dog", angle: "neg", phrase: "would fart in a crowded elevator and blame someone else" },
  { id: "you-too", angle: "neg", phrase: "always says 'you too' when the delivery driver says enjoy" },
  { id: "pigeon-fight", angle: "neg", conflictGroup: "bird_lose", phrase: "would lose a staring contest to a pigeon" },
  { id: "least-funny", angle: "neg", conflictGroup: "humor_funny", phrase: "thinks they are hilarious but is the least funny" },
  { id: "best-liar", angle: "neg", conflictGroup: "honesty_lying", phrase: "is dangerously good at lying with a straight face" },
  { id: "most-gullible", angle: "neg", phrase: "believes every fake TikTok fact they see" },
  { id: "worst-advice", angle: "neg", phrase: "gives the absolute worst life advice" },
  { id: "lawyer", angle: "pos", phrase: "would you want defending you in court" },
  { id: "worst-roommate", angle: "neg", phrase: "would be the worst roommate" },
  { id: "best-neighbor", angle: "pos", phrase: "would be the best neighbor" },
  { id: "cool-teacher", angle: "weird", phrase: "would be the coolest high school teacher" },
  { id: "murder", angle: "weird", conflictGroup: "murder_killer", phrase: "would get away with murder" },
  { id: "royalty", angle: "pos", phrase: "would be the best king or queen" },
  { id: "devil-soul", angle: "weird", phrase: "would sell their soul to the devil" },

  // Spicy 18+ ("spicy: true")
  { id: "flirt", angle: "pos", spicy: true, phrase: "is the smoothest flirt" },
  { id: "red-flag", angle: "neg", spicy: true, phrase: "is a walking red flag" },
  { id: "ex-text", angle: "neg", spicy: true, phrase: "is most likely to text an ex at 2 a.m." },
  { id: "toxic", angle: "neg", spicy: true, phrase: "has the worst taste in partners" },
  { id: "truth-dare", angle: "weird", spicy: true, phrase: "would fold fastest in Truth or Dare" },
  { id: "walk-shame", angle: "weird", spicy: true, conflictGroup: "wild_stories", phrase: "has the wildest weekend stories" },
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
  { id: "cringe", angle: "neg", phrase: "did you used to love but now makes you cringe" },
  { id: "alarm", angle: "neg", phrase: "would make the worst morning alarm" },
  { id: "wedding-ban", angle: "neg", phrase: "should be permanently banned from wedding receptions" },
  { id: "mall", angle: "neg", phrase: "makes you want to leave a store immediately when it plays" },
  { id: "lyrics-wrong", angle: "neg", phrase: "does everyone confidently sing the wrong lyrics to" },
  { id: "too-long", angle: "neg", phrase: "feels three times longer than it actually is" },
  { id: "breakup", angle: "neg", phrase: "hits way too hard after a breakup" },
  { id: "villain", angle: "weird", phrase: "would play during your villain entrance" },
  { id: "funeral", angle: "weird", phrase: "would be hilarious to play at a funeral" },
  { id: "shower", angle: "weird", phrase: "you secretly belt out in the shower" },
  { id: "guilty", angle: "weird", phrase: "is your biggest guilty-pleasure banger" },
  { id: "fight", angle: "weird", phrase: "would be your walk-out song for a boxing match" },
  { id: "cooking", angle: "weird", phrase: "would you play while dramatically cooking pasta" },
  { id: "alien-greeting", angle: "weird", phrase: "should humanity play to welcome visiting aliens" },
  { id: "elevator", angle: "weird", phrase: "would be the funniest to hear as quiet elevator music" },
  { id: "pet-theme", angle: "weird", phrase: "would be your pet's personal theme song" },
  { id: "best-sex", angle: "pos", spicy: true, conflictGroup: "sex_song", phrase: "is the best song for sex" },
  { id: "worst-sex", angle: "neg", spicy: true, conflictGroup: "sex_song", phrase: "is the worst song for sex" },
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
  { id: "crush", angle: "pos", phrase: "is your biggest celebrity musician crush" },
];

const FOOD_TOPICS: readonly TopicEntry[] = [
  { id: "3am", angle: "pos", shape: "snack_drink", phrase: "is the ultimate 3 a.m. snack" },
  { id: "forever", angle: "pos", shape: "general_food", phrase: "could you eat every day for a month" },
  { id: "comfort", angle: "pos", shape: "general_food", phrase: "fixes your mood instantly" },
  { id: "date", angle: "pos", shape: "meal_food", phrase: "is the best first-date meal" },
  { id: "cook", angle: "pos", shape: "meal_food", phrase: "is the best thing you know how to cook" },
  { id: "birthday", angle: "pos", shape: "general_food", phrase: "is your non-negotiable birthday request" },
  { id: "roadtrip", angle: "pos", shape: "snack_drink", phrase: "is the greatest road-trip fuel ever invented" },
  { id: "leftovers", angle: "pos", shape: "meal_food", phrase: "tastes even better as next-day leftovers" },
  { id: "worth-wait", angle: "pos", shape: "general_food", phrase: "is actually worth waiting an hour in line for" },
  { id: "refuse", angle: "neg", shape: "general_food", phrase: "do you refuse to eat under any circumstances" },
  { id: "overrated", angle: "neg", shape: "general_food", phrase: "is way too overrated" },
  { id: "regret", angle: "neg", shape: "general_food", phrase: "always gives you instant stomach regret" },
  { id: "smell", angle: "neg", shape: "smelly_food", conflictGroup: "smelly_food", phrase: "smells terrible even if people love it" },
  { id: "childhood-hate", angle: "neg", shape: "general_food", phrase: "traumatized you as a kid" },
  { id: "messy", angle: "neg", shape: "general_food", phrase: "is impossible to eat without making a total mess" },
  { id: "expensive", angle: "neg", shape: "general_food", phrase: "is ridiculously overpriced for what it is" },
  { id: "texture", angle: "neg", shape: "general_food", phrase: "has a texture that immediately ruins it for you" },
  { id: "disappointing", angle: "neg", shape: "general_food", phrase: "looks amazing in photos but always disappoints" },
  { id: "weird-combo", angle: "weird", shape: "food_combo", noWildcard: true, phrase: "sounds gross but actually slaps" },
  { id: "last-meal", angle: "weird", shape: "meal_food", phrase: "would you pick as your dramatic last meal" },
  { id: "weapon", angle: "weird", shape: "food_prop", noWildcard: true, phrase: "would make the weirdest weapon in a food fight" },
  { id: "sneak", angle: "weird", shape: "food_prop", noWildcard: true, phrase: "would be funniest to sneak into a movie theater" },
  { id: "microwave", angle: "weird", shape: "smelly_food", conflictGroup: "smelly_food", noWildcard: true, phrase: "should be illegal to microwave in an office kitchen" },
  { id: "candle", angle: "weird", shape: "smelly_food", noWildcard: true, phrase: "would make the most cursed scented candle" },
  { id: "museum", angle: "weird", shape: "general_food", phrase: "deserves its own national holiday" },
  { id: "hangover", angle: "weird", shape: "snack_drink", phrase: "is your undefeated hangover cure" },
];

const PLACE_TOPICS: readonly TopicEntry[] = [
  { id: "dream", angle: "pos", shape: "normal_place", phrase: "is your #1 dream vacation spot" },
  { id: "move", angle: "pos", shape: "normal_place", phrase: "would you move to tomorrow if money was free" },
  { id: "food-trip", angle: "pos", shape: "normal_place", phrase: "has the best food in the world" },
  { id: "honeymoon", angle: "pos", shape: "normal_place", conflictGroup: "romance_trip", phrase: "is the most romantic destination" },
  { id: "retire", angle: "pos", shape: "normal_place", phrase: "would you love to retire in" },
  { id: "weekend", angle: "pos", shape: "normal_place", phrase: "is the ultimate 48-hour weekend getaway" },
  { id: "friendly", angle: "pos", shape: "normal_place", phrase: "has the warmest, friendliest locals" },
  { id: "scenery", angle: "pos", shape: "normal_place", phrase: "looks like a real-life postcard from every angle" },
  { id: "festivals", angle: "pos", shape: "normal_place", phrase: "has the best street markets and festivals" },
  { id: "tourist-trap", angle: "neg", shape: "normal_place", phrase: "is the biggest overrated tourist trap" },
  { id: "never-again", angle: "neg", shape: "normal_place", phrase: "would you never visit again" },
  { id: "lost", angle: "neg", shape: "normal_place", phrase: "would be the worst place to lose your phone and wallet" },
  { id: "weather", angle: "neg", shape: "normal_place", phrase: "has the most miserable weather" },
  { id: "traffic", angle: "neg", shape: "normal_place", phrase: "sounds exhausting to live in" },
  { id: "expensive", angle: "neg", shape: "normal_place", phrase: "destroys your bank account the fastest" },
  { id: "jetlag", angle: "neg", shape: "normal_place", phrase: "is way too far away to be worth the flight" },
  { id: "crowded", angle: "neg", shape: "normal_place", phrase: "is ruined by massive tourist crowds" },
  { id: "confusing", angle: "neg", shape: "normal_place", phrase: "has the most confusing transit system to navigate" },
  { id: "fake-death", angle: "weird", shape: "normal_place", phrase: "would you flee to if you faked your death" },
  { id: "aliens", angle: "weird", shape: "normal_place", phrase: "would aliens probably invade first" },
  { id: "survival", angle: "weird", shape: "normal_place", phrase: "would be the hardest place to survive a week in" },
  { id: "movie-set", angle: "weird", shape: "normal_place", phrase: "looks like it was built as a sci-fi movie set" },
  { id: "time-travel", angle: "weird", shape: "obscure_name_place", noWildcard: true, phrase: "would you visit first if you had a time machine" },
  { id: "raccoon-king", angle: "weird", shape: "normal_place", phrase: "could you probably become mayor of by accident" },
  { id: "heist", angle: "weird", shape: "normal_place", phrase: "would be the coolest setting for a heist movie" },
  { id: "zombie-fort", angle: "weird", shape: "normal_place", phrase: "would be your top pick during a zombie apocalypse" },
  { id: "postcard-lie", angle: "weird", shape: "obscure_name_place", noWildcard: true, phrase: "sounds completely made up until you see it on a map" },
  { id: "bachelor", angle: "weird", shape: "normal_place", phrase: "would host the most chaotic bachelor/bachelorette trip" },
  { id: "honeymoon-flop", angle: "neg", shape: "normal_place", conflictGroup: "romance_trip", phrase: "would be the worst place for a romantic getaway" },
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
  { id: "crush", angle: "pos", phrase: "was your biggest fictional crush growing up" },
  { id: "red-flag", angle: "neg", spicy: true, phrase: "is the biggest fictional red flag you'd still date" },
  { id: "big-d", angle: "weird", spicy: true, phrase: "has the biggest dick" },
  { id: "best-boobs", angle: "pos", spicy: true, phrase: "has the best boobs" },
  { id: "best-ass", angle: "pos", spicy: true, phrase: "has the best ass" },
  { id: "smash", angle: "pos", spicy: true, phrase: "would you definitely sleep with" },
  { id: "bad-in-bed", angle: "neg", spicy: true, conflictGroup: "char_in_bed", phrase: "would be terrible in bed" },
  { id: "good-in-bed", angle: "pos", spicy: true, conflictGroup: "char_in_bed", phrase: "would be amazing in bed" },
];

const APP_TOPICS: readonly TopicEntry[] = [
  { id: "first", angle: "pos", shape: "social_app", phrase: "do you open first every morning" },
  { id: "cant-live", angle: "pos", shape: "general_app", phrase: "could you never delete from your phone" },
  { id: "useful", angle: "pos", shape: "utility_app", phrase: "actually improves your life the most" },
  { id: "music-chill", angle: "pos", shape: "general_app", phrase: "do you spend the happiest hours on" },
  { id: "worth-paying", angle: "pos", shape: "utility_app", phrase: "is actually worth paying a subscription for" },
  { id: "learn", angle: "pos", shape: "utility_app", phrase: "has taught you the most genuinely useful things" },
  { id: "clean-ui", angle: "pos", shape: "utility_app", phrase: "is actually a joy to use because the design is so clean" },
  { id: "travel", angle: "pos", shape: "utility_app", phrase: "saves your life every time you travel" },
  { id: "recommend", angle: "pos", shape: "general_app", phrase: "do you immediately tell all your friends to download" },
  { id: "waste", angle: "neg", shape: "social_app", phrase: "wastes the most hours of your life" },
  { id: "toxic", angle: "neg", shape: "social_app", phrase: "has the most toxic comment sections" },
  { id: "delete", angle: "neg", shape: "social_app", phrase: "should be deleted from the internet forever" },
  { id: "battery", angle: "neg", shape: "general_app", phrase: "kills your phone battery the fastest" },
  { id: "regret", angle: "neg", shape: "social_app", phrase: "makes you regret opening it every time" },
  { id: "notifications", angle: "neg", shape: "general_app", phrase: "sends the most annoying unnecessary notifications" },
  { id: "ads", angle: "neg", shape: "general_app", phrase: "has been completely ruined by ads" },
  { id: "slow", angle: "neg", shape: "utility_app", phrase: "feels stuck in 2009 and desperately needs an update" },
  { id: "paywall", angle: "neg", shape: "utility_app", phrase: "puts way too many basic features behind a paywall" },
  { id: "rabbit-hole", angle: "weird", shape: "social_app", phrase: "sends you down the weirdest 2 a.m. rabbit holes" },
  { id: "screen-time", angle: "weird", shape: "social_app", phrase: "would embarrass you most if your screen time leaked" },
  { id: "grandma", angle: "weird", shape: "general_app", phrase: "would be funniest to explain to your grandparents" },
  { id: "nostalgia", angle: "weird", shape: "retro_app", noWildcard: true, phrase: "do you miss most from the early internet era" },
  { id: "museum", angle: "weird", shape: "general_app", phrase: "belongs in a digital history museum" },
  { id: "bored", angle: "weird", shape: "social_app", phrase: "do you open purely out of muscle memory when bored" },
  { id: "dating", angle: "neg", shape: "social_app", phrase: "is the worst place to meet a romantic partner" },
  { id: "stalk", angle: "weird", spicy: true, shape: "social_app", phrase: "is best for shameless late-night stalking" },
];

const JOB_TOPICS: readonly TopicEntry[] = [
  { id: "dream", angle: "pos", shape: "normal_job", phrase: "would be your dream job if pay didn't matter" },
  { id: "rich", angle: "pos", shape: "normal_job", phrase: "sounds like the easiest way to get rich" },
  { id: "respect", angle: "pos", shape: "normal_job", conflictGroup: "underpaid_essential", phrase: "deserves way more respect and money" },
  { id: "good-at", angle: "pos", shape: "normal_job", phrase: "do you think you'd secretly crush" },
  { id: "fun", angle: "pos", shape: "normal_job", phrase: "looks like the most fun day-to-day" },
  { id: "chill", angle: "pos", shape: "normal_job", phrase: "has the most relaxed work-life balance" },
  { id: "perks", angle: "pos", shape: "normal_job", phrase: "comes with the coolest free perks" },
  { id: "hero", angle: "pos", shape: "normal_job", phrase: "makes the biggest positive difference every day" },
  { id: "kid-dream", angle: "pos", shape: "normal_job", phrase: "did you desperately want as a seven-year-old" },
  { id: "fired", angle: "neg", shape: "normal_job", phrase: "would you get fired from on your very first day" },
  { id: "never", angle: "neg", shape: "normal_job", phrase: "could you never do even for triple pay" },
  { id: "boring", angle: "neg", shape: "normal_job", phrase: "sounds like the most soul-crushing job ever" },
  { id: "stress", angle: "neg", shape: "normal_job", phrase: "would give you grey hairs in a week" },
  { id: "scammy", angle: "neg", shape: "bizarre_job", conflictGroup: "fake_sounding_job", noWildcard: true, phrase: "feels like a fake job title" },
  { id: "underpaid", angle: "neg", shape: "normal_job", conflictGroup: "underpaid_essential", phrase: "is criminally underpaid for how hard it is" },
  { id: "early", angle: "neg", shape: "normal_job", phrase: "requires waking up way too early for you to survive" },
  { id: "customers", angle: "neg", shape: "normal_job", phrase: "forces you to deal with the worst customers" },
  { id: "ai-risk", angle: "neg", shape: "normal_job", phrase: "feels most likely to be replaced by a robot" },
  { id: "weird-skill", angle: "weird", shape: "bizarre_job", conflictGroup: "fake_sounding_job", noWildcard: true, phrase: "sounds fake but is actually a real job" },
  { id: "movie", angle: "weird", shape: "normal_job", phrase: "would make you look coolest in an action movie" },
  { id: "undercover", angle: "weird", shape: "normal_job", phrase: "is the best cover identity for a spy" },
  { id: "lottery", angle: "weird", shape: "normal_job", phrase: "would you do just for fun after winning the lottery" },
  { id: "tv-show", angle: "weird", shape: "normal_job", phrase: "deserves its own wildly dramatic reality TV show" },
  { id: "uniform", angle: "weird", shape: "normal_job", phrase: "has the best or funniest uniform" },
  { id: "date-redflag", angle: "neg", spicy: true, shape: "spicy_job", noWildcard: true, phrase: "is an instant red flag on a dating profile" },
  { id: "spicy-rich", angle: "weird", spicy: true, shape: "spicy_job", noWildcard: true, phrase: "would you do if you needed $10,000 by Friday" },
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
