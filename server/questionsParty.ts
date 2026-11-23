export interface QuestionPoolItem {
  id: string;
  pool: string;
  spicy?: boolean;
  angle?: "pos" | "neg" | "weird";
  shape?: string;
  conflictGroup?: string;
  noWildcard?: boolean;
  text: string;
}

export const PARTY_QUESTION_ITEMS: readonly QuestionPoolItem[] = [
  {
    "id": "party-super-01",
    "pool": "superpowers",
    "angle": "pos",
    "text": "Best superpower for everyday life?"
  },
  {
    "id": "party-super-02",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Most useless superpower imaginable?"
  },
  {
    "id": "party-super-03",
    "pool": "superpowers",
    "angle": "pos",
    "text": "Superpower that makes you rich fastest?"
  },
  {
    "id": "party-super-04",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Superpower that would ruin all your friendships?"
  },
  {
    "id": "party-super-05",
    "pool": "superpowers",
    "angle": "pos",
    "text": "Best superpower for surviving a boring family dinner?"
  },
  {
    "id": "party-super-06",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Superpower that turns you into a supervillain?"
  },
  {
    "id": "party-super-08",
    "pool": "superpowers",
    "angle": "weird",
    "text": "Superpower that sounds cool until it gets gross?"
  },
  {
    "id": "party-super-09",
    "pool": "superpowers",
    "angle": "pos",
    "text": "Superpower to win every argument?"
  },
  {
    "id": "party-super-10",
    "pool": "superpowers",
    "angle": "weird",
    "text": "Superpower you'd give your pet?"
  },
  {
    "id": "party-super-12",
    "pool": "superpowers",
    "angle": "weird",
    "text": "Superpower that only works when you're drunk?"
  },
  {
    "id": "party-super-13",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Superpower that makes you the worst roommate?"
  },
  {
    "id": "party-super-15",
    "pool": "superpowers",
    "angle": "weird",
    "text": "Superpower you'd hide from the government forever?"
  },
  {
    "id": "party-super-18",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Superpower that gets you fired on day one?"
  },
  {
    "id": "party-super-23",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Superpower that causes the most accidental property damage?"
  },
  {
    "id": "party-super-26",
    "pool": "superpowers",
    "angle": "weird",
    "text": "Most useless superpower in a zombie apocalypse?"
  },
  {
    "id": "party-super-27",
    "pool": "superpowers",
    "angle": "neg",
    "text": "Superpower that's cool in movies but miserable IRL?"
  },
  {
    "id": "party-person-01",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who are you bringing to a deserted island?",
    "shape": "general_person"
  },
  {
    "id": "party-person-02",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who survives the zombie apocalypse?",
    "shape": "general_person"
  },
  {
    "id": "party-person-03",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who do you trust with a secret for 10 years?",
    "shape": "friend_person",
    "conflictGroup": "trust_betrayal"
  },
  {
    "id": "party-person-04",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who are you calling for bail money at 3 a.m.?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-05",
    "pool": "island_person",
    "angle": "neg",
    "text": "Worst person to get stuck in an elevator with?",
    "shape": "general_person"
  },
  {
    "id": "party-person-06",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who should represent Earth to aliens?",
    "shape": "general_person"
  },
  {
    "id": "party-person-07",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who would kill your plants in a week?",
    "shape": "friend_person",
    "noWildcard": true
  },
  {
    "id": "party-person-08",
    "pool": "island_person",
    "angle": "weird",
    "text": "Best person for a chaotic road trip?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-09",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who would accidentally start a cult with a megaphone?",
    "shape": "general_person"
  },
  {
    "id": "party-person-10",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who should play you in a movie about your life?",
    "shape": "celebrity_person",
    "noWildcard": true
  },
  {
    "id": "party-person-11",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who gets kicked out of a fancy restaurant first?",
    "shape": "general_person"
  },
  {
    "id": "party-person-12",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who do you trust to plan your surprise party?",
    "shape": "friend_person",
    "conflictGroup": "surprise_party"
  },
  {
    "id": "party-person-13",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who cries at mildly sad dog commercials?",
    "shape": "general_person"
  },
  {
    "id": "party-person-14",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who would you swap lives with for a weekend?",
    "shape": "general_person"
  },
  {
    "id": "party-person-15",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who is banned from the aux cord forever?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-16",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd win a trashy reality dating show?",
    "shape": "general_person"
  },
  {
    "id": "party-person-17",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who's your first pick for million-dollar trivia?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-18",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who would you never let drive your car?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-19",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd get lost in a one-room IKEA?",
    "shape": "general_person"
  },
  {
    "id": "party-person-20",
    "pool": "island_person",
    "angle": "neg",
    "text": "Worst person to share a tiny tent with?",
    "shape": "general_person"
  },
  {
    "id": "party-person-21",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd try to haggle with a vending machine?",
    "shape": "general_person"
  },
  {
    "id": "party-person-22",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who'd snitch on everyone to the cops immediately?",
    "shape": "friend_person",
    "conflictGroup": "trust_betrayal"
  },
  {
    "id": "party-person-23",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd adopt a stray raccoon and name it?",
    "shape": "general_person"
  },
  {
    "id": "party-person-24",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who is the worst cook you know?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-25",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd get kicked out of an all-you-can-eat buffet?",
    "shape": "general_person"
  },
  {
    "id": "party-person-26",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who'd spoil a surprise party in five minutes?",
    "shape": "friend_person",
    "conflictGroup": "surprise_party"
  },
  {
    "id": "party-person-27",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who's most likely to go viral by pure accident?",
    "shape": "general_person"
  },
  {
    "id": "party-person-28",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who is probably a villain in real life?",
    "shape": "general_person"
  },
  {
    "id": "party-person-29",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who has the most iconic voice?",
    "shape": "celebrity_person",
    "noWildcard": true,
    "conflictGroup": "voice_narrator"
  },
  {
    "id": "party-person-30",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who do you want narrating your life?",
    "shape": "celebrity_person",
    "noWildcard": true,
    "conflictGroup": "voice_narrator"
  },
  {
    "id": "party-person-31",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who do you want defending you in court?",
    "shape": "general_person"
  },
  {
    "id": "party-person-32",
    "pool": "island_person",
    "angle": "neg",
    "text": "Worst person to have as a roommate?",
    "shape": "general_person"
  },
  {
    "id": "party-person-33",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who would you want as a neighbor?",
    "shape": "general_person"
  },
  {
    "id": "party-person-34",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who would be the coolest high school teacher?",
    "shape": "general_person"
  },
  {
    "id": "party-person-35",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who's the biggest drama queen?",
    "shape": "general_person"
  },
  {
    "id": "party-person-36",
    "pool": "island_person",
    "spicy": true,
    "angle": "pos",
    "text": "Sexiest celebrity?",
    "shape": "celebrity_person",
    "noWildcard": true
  },
  {
    "id": "party-person-37",
    "pool": "island_person",
    "spicy": true,
    "angle": "pos",
    "text": "Celebrity with the best boobs?",
    "shape": "celebrity_person",
    "noWildcard": true
  },
  {
    "id": "party-person-38",
    "pool": "island_person",
    "spicy": true,
    "angle": "pos",
    "text": "Celebrity with the best ass?",
    "shape": "celebrity_person",
    "noWildcard": true
  },
  {
    "id": "party-person-39",
    "pool": "island_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who has the biggest dick energy?",
    "shape": "general_person"
  },
  {
    "id": "party-person-40",
    "pool": "island_person",
    "spicy": true,
    "angle": "pos",
    "text": "Celebrity you'd definitely sleep with?",
    "shape": "celebrity_person",
    "noWildcard": true
  },
  {
    "id": "party-person-41",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd get away with murder?",
    "shape": "general_person"
  },
  {
    "id": "party-person-42",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who'd survive prison the longest?",
    "shape": "general_person"
  },
  {
    "id": "party-person-43",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who's most likely to wake up in another country?",
    "shape": "friend_person"
  },
  {
    "id": "party-person-44",
    "pool": "island_person",
    "angle": "neg",
    "text": "Who'd sell out the group for $10,000?",
    "shape": "friend_person",
    "conflictGroup": "trust_betrayal"
  },
  {
    "id": "party-person-45",
    "pool": "island_person",
    "angle": "pos",
    "text": "Who'd be the best king or queen?",
    "shape": "general_person"
  },
  {
    "id": "party-person-46",
    "pool": "island_person",
    "angle": "weird",
    "text": "Who'd sell their soul to the devil?",
    "shape": "general_person"
  },
  {
    "id": "party-thing-01",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "weapon_joke",
    "conflictGroup": "weapon_best_worst",
    "text": "Worst object to use as a weapon?"
  },
  {
    "id": "party-thing-29",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "weapon_useful",
    "conflictGroup": "weapon_best_worst",
    "text": "Best everyday object to use as a weapon?",
    "noWildcard": true
  },
  {
    "id": "party-thing-30",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "household",
    "text": "Thing in your room you keep meaning to throw away?"
  },
  {
    "id": "party-thing-02",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "carry",
    "text": "One thing you never leave home without?"
  },
  {
    "id": "party-thing-03",
    "pool": "foods",
    "angle": "neg",
    "text": "Food that's spoiled in your fridge right now?"
  },
  {
    "id": "party-thing-05",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "carry",
    "text": "Thing you lose at least once a week?"
  },
  {
    "id": "party-thing-06",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "weird_object",
    "text": "Weirdest thing to find in someone's pockets?",
    "noWildcard": true
  },
  {
    "id": "party-thing-07",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "household",
    "text": "Household item you couldn't survive 24 hours without?"
  },
  {
    "id": "party-thing-08",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "weird_object",
    "text": "Weirdest thing you ever bought online?",
    "noWildcard": true
  },
  {
    "id": "party-thing-09",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "weapon_joke",
    "text": "Funniest object to bring to a fistfight?"
  },
  {
    "id": "party-thing-10",
    "pool": "foods",
    "angle": "neg",
    "text": "Worst leftover to find in a shared fridge?"
  },
  {
    "id": "party-thing-11",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "buy",
    "text": "Cheap thing you bought that changed your life?"
  },
  {
    "id": "party-thing-13",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "household",
    "text": "First thing you grab if your place catches fire?"
  },
  {
    "id": "party-thing-15",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "household",
    "text": "Thing everyone owns way too many of?"
  },
  {
    "id": "party-thing-16",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "gift",
    "text": "Worst birthday gift to give someone?"
  },
  {
    "id": "party-thing-17",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "hotel_item",
    "text": "Hotel item you're always tempted to steal?",
    "noWildcard": true
  },
  {
    "id": "party-thing-18",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "weird_object",
    "text": "Weirdest thing to find in someone's bathroom?",
    "noWildcard": true
  },
  {
    "id": "party-thing-19",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "buy",
    "text": "Everyday item that's ridiculously overpriced?"
  },
  {
    "id": "party-thing-20",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "toy",
    "text": "Childhood toy you secretly miss?",
    "noWildcard": true
  },
  {
    "id": "party-thing-21",
    "pool": "things_objects",
    "angle": "weird",
    "shape": "weapon_useful",
    "text": "Object you'd want with you in a zombie apocalypse?",
    "noWildcard": true
  },
  {
    "id": "party-thing-22",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "carry",
    "text": "Thing you borrow from friends and never return?"
  },
  {
    "id": "party-thing-23",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "kitchen_gadget",
    "text": "Kitchen gadget you bought and used once?",
    "noWildcard": true
  },
  {
    "id": "party-thing-25",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "household",
    "text": "Object you'd put in a 2026 time capsule?"
  },
  {
    "id": "party-thing-26",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "household",
    "text": "Thing you refuse to share even with your best friend?"
  },
  {
    "id": "party-thing-27",
    "pool": "things_objects",
    "angle": "pos",
    "shape": "household",
    "text": "Object at home that instantly boosts your mood?"
  },
  {
    "id": "party-thing-28",
    "pool": "things_objects",
    "angle": "neg",
    "shape": "buy",
    "text": "Thing you keep buying even though you own three?"
  },
  {
    "id": "party-num-01",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "hours_short",
    "text": "Hours you can last without checking your phone?"
  },
  {
    "id": "party-num-02",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_tiny",
    "text": "Pillows required for you to sleep?",
    "noWildcard": true
  },
  {
    "id": "party-num-03",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Alarms you set just to actually wake up?"
  },
  {
    "id": "party-num-04",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_tiny",
    "text": "Cups of coffee or tea you drink in a day?",
    "noWildcard": true
  },
  {
    "id": "party-num-05",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_small",
    "text": "Tacos you could destroy if nobody was watching?"
  },
  {
    "id": "party-num-06",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_large",
    "text": "Unread texts you're ignoring right now?",
    "noWildcard": true
  },
  {
    "id": "party-num-07",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "days_short",
    "text": "Days you'll wear the same hoodie before washing it?"
  },
  {
    "id": "party-num-08",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Times a week you order takeout?"
  },
  {
    "id": "party-num-09",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Houseplants you've accidentally murdered?"
  },
  {
    "id": "party-num-10",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "minutes",
    "text": "Minutes late you are to plans on average?",
    "noWildcard": true
  },
  {
    "id": "party-num-11",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_0_10",
    "text": "Streaming subscriptions you're paying for right now?"
  },
  {
    "id": "party-num-12",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "hours_short",
    "text": "Hours of sleep needed so you're not a menace?",
    "noWildcard": true
  },
  {
    "id": "party-num-13",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_0_10",
    "text": "Times you've rewatched your favorite comfort show?"
  },
  {
    "id": "party-num-14",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Pairs of socks with holes in your drawer?"
  },
  {
    "id": "party-num-15",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Group chats you currently have muted?"
  },
  {
    "id": "party-num-16",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "minutes",
    "text": "Minutes you can survive small talk with a stranger?",
    "noWildcard": true
  },
  {
    "id": "party-num-17",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_0_10",
    "text": "Drinks before you start oversharing?",
    "conflictGroup": "alcohol_tolerance"
  },
  {
    "id": "party-num-18",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_small",
    "text": "Times a month you actually cook a real meal?",
    "noWildcard": true
  },
  {
    "id": "party-num-19",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_0_10",
    "text": "Friends you'd trust with your spare key?"
  },
  {
    "id": "party-num-20",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "days_short",
    "text": "Days you could survive on just instant noodles?",
    "noWildcard": true
  },
  {
    "id": "party-num-21",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_small",
    "text": "Times a day you check the fridge for no reason?"
  },
  {
    "id": "party-num-22",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_small",
    "text": "Countries you've visited so far?"
  },
  {
    "id": "party-num-23",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_tiny",
    "text": "Times you poop on a normal day?",
    "noWildcard": true
  },
  {
    "id": "party-num-24",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Times a week you drop your phone on your face?"
  },
  {
    "id": "party-num-25",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_small",
    "text": "Times you fake-laugh on a normal day?",
    "noWildcard": true
  },
  {
    "id": "party-num-26",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Times this week you forgot why you entered a room?"
  },
  {
    "id": "party-num-27",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_0_10",
    "text": "Single orphaned socks in your drawer right now?"
  },
  {
    "id": "party-num-28",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_small",
    "text": "10-year-olds you could beat in dodgeball at once?",
    "noWildcard": true
  },
  {
    "id": "party-num-29",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Times you've tripped over literally nothing this month?"
  },
  {
    "id": "party-num-30",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_0_10",
    "text": "Fake arguments you rehearse in the shower weekly?"
  },
  {
    "id": "party-num-31",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "days_short",
    "text": "Days in a row you've worn the same jeans?"
  },
  {
    "id": "party-num-35",
    "pool": "numbers_small",
    "angle": "neg",
    "spicy": true,
    "shape": "count_tiny",
    "text": "Most days acceptable to wear the same underwear?",
    "noWildcard": true
  },
  {
    "id": "party-num-32",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "count_medium",
    "text": "Chicken nuggets you could crush in one sitting?",
    "noWildcard": true
  },
  {
    "id": "party-num-33",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "count_0_10",
    "text": "Times a week you fake-text to avoid eye contact?"
  },
  {
    "id": "party-num-34",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "count_0_10",
    "text": "Times you've said 'you too' to a waiter?"
  },
  {
    "id": "party-num-39",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "minutes",
    "text": "How many minutes do you spend on the toilet?",
    "noWildcard": true
  },
  {
    "id": "party-num-40",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "height_cm",
    "text": "From what height does a man count as tall (cm)?",
    "conflictGroup": "tall_netherlands",
    "noWildcard": true
  },
  {
    "id": "party-num-41",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "height_cm",
    "text": "Average height in the Netherlands (cm)?",
    "noWildcard": true,
    "conflictGroup": "tall_netherlands"
  },
  {
    "id": "party-num-42",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "height_cm",
    "text": "Average height in your country (cm)?",
    "noWildcard": true
  },
  {
    "id": "party-num-43",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "weight_kg",
    "text": "Average adult weight in the USA (kg)?",
    "noWildcard": true
  },
  {
    "id": "party-num-44",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "weight_kg",
    "text": "Average adult weight in your country (kg)?",
    "noWildcard": true
  },
  {
    "id": "party-num-45",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "neg",
    "shape": "weight_kg",
    "text": "From what weight does a woman count as a 'whale' (kg)?",
    "noWildcard": true
  },
  {
    "id": "party-num-46",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "height_cm",
    "text": "From what height is a guy considered short (cm)?",
    "conflictGroup": "male_height",
    "noWildcard": true
  },
  {
    "id": "party-num-47",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "height_cm",
    "text": "Minimum height to play in the NBA (cm)?",
    "noWildcard": true
  },
  {
    "id": "party-num-48",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "cm_small",
    "text": "Length of a standard pencil (cm)?",
    "noWildcard": true
  },
  {
    "id": "party-num-49",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "cm_small",
    "text": "Length of a standard smartphone (cm)?",
    "noWildcard": true
  },
  {
    "id": "party-num-50",
    "pool": "numbers_small",
    "angle": "neg",
    "shape": "minutes",
    "text": "How many minutes can you wait in a queue before leaving?",
    "noWildcard": true
  },
  {
    "id": "party-num-51",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "minutes_long",
    "text": "Ideal length of a movie (minutes)?",
    "noWildcard": true
  },
  {
    "id": "party-num-52",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "age_young",
    "text": "How old were you when you found out Santa isn't real?",
    "conflictGroup": "santa_vs_consent",
    "noWildcard": true
  },
  {
    "id": "party-num-53",
    "pool": "numbers_small",
    "angle": "pos",
    "shape": "age_young",
    "text": "Average age of a first kiss?",
    "noWildcard": true
  },
  {
    "id": "party-num-54",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "age_young",
    "text": "Average age of a woman's first period?",
    "noWildcard": true
  },
  {
    "id": "party-num-55",
    "pool": "numbers_small",
    "angle": "weird",
    "shape": "fixed_fact",
    "text": "How many genders are there?",
    "noWildcard": true
  },
  {
    "id": "party-num-56",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "pos",
    "shape": "cm_small",
    "text": "From what size is a dick big (cm)?",
    "conflictGroup": "dick_size",
    "noWildcard": true
  },
  {
    "id": "party-num-57",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "weird",
    "shape": "cm_small",
    "text": "Average dick size (cm)?",
    "conflictGroup": "dick_size",
    "noWildcard": true
  },
  {
    "id": "party-num-58",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "neg",
    "shape": "cm_small",
    "text": "Below what size is a small dick (cm)?",
    "conflictGroup": "dick_size",
    "noWildcard": true
  },
  {
    "id": "party-num-59",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "pos",
    "shape": "minutes",
    "text": "How many minutes should sex last?",
    "noWildcard": true
  },
  {
    "id": "party-num-60",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "neg",
    "shape": "age_young",
    "text": "Minimum legal age of consent?",
    "conflictGroup": "santa_vs_consent",
    "noWildcard": true
  },
  {
    "id": "party-num-61",
    "pool": "numbers_small",
    "spicy": true,
    "angle": "weird",
    "shape": "age_young",
    "text": "Average age of first masturbation?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-place-03",
    "pool": "spicy_scenarios",
    "spicy": true,
    "angle": "neg",
    "text": "Worst place to have sex?"
  },
  {
    "id": "party-spicy-place-05",
    "pool": "spicy_scenarios",
    "spicy": true,
    "angle": "neg",
    "text": "Worst place to run into an ex?"
  },
  {
    "id": "party-spicy-place-08",
    "pool": "spicy_scenarios",
    "spicy": true,
    "angle": "weird",
    "text": "Strangest place to wake up after a party?"
  },
  {
    "id": "party-spicy-place-09",
    "pool": "spicy_scenarios",
    "spicy": true,
    "angle": "neg",
    "text": "Worst possible place for a first date?"
  },
  {
    "id": "party-spicy-place-12",
    "pool": "spicy_scenarios",
    "spicy": true,
    "angle": "pos",
    "text": "Best place for a quickie?"
  },
  {
    "id": "party-spicy-place-16",
    "pool": "spicy_scenarios",
    "spicy": true,
    "angle": "weird",
    "text": "Best place to hide a dead body?"
  },
  {
    "id": "party-spicy-person-01",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who at this table has the worst dating history?"
  },
  {
    "id": "party-spicy-person-02",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who here is most likely to text their ex tonight?"
  },
  {
    "id": "party-spicy-person-03",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who here is most likely to send nudes?"
  },
  {
    "id": "party-spicy-person-04",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "text": "Who in this room is the best kisser?"
  },
  {
    "id": "party-spicy-person-05",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who here falls in love way too fast?"
  },
  {
    "id": "party-spicy-person-06",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who in this room has a secret dating app profile?"
  },
  {
    "id": "party-spicy-person-07",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "text": "Who here flirts without even realizing it?"
  },
  {
    "id": "party-spicy-person-08",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who in this room couldn't survive a month without sex?"
  },
  {
    "id": "party-spicy-person-09",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "conflictGroup": "drinking_contest",
    "text": "Who'd win a drinking contest?"
  },
  {
    "id": "party-spicy-person-10",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "conflictGroup": "drinking_contest",
    "text": "Who'd lose a drinking contest first?"
  },
  {
    "id": "party-spicy-person-11",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who here has the worst type?"
  },
  {
    "id": "party-spicy-person-14",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "text": "Who here has the wildest 'I accidentally slept with...' story?",
    "conflictGroup": "wild_stories"
  },
  {
    "id": "party-spicy-person-15",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who at this table is least trustworthy in Vegas?"
  },
  {
    "id": "party-spicy-person-16",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "text": "Who here is the best wingman at a bar?"
  },
  {
    "id": "party-spicy-person-18",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who here would do 'dirty stuff' for $100 if broke?"
  },
  {
    "id": "party-spicy-person-19",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "text": "Who in this room has the strongest flirting game?"
  },
  {
    "id": "party-spicy-person-20",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who here holds a breakup grudge the longest?"
  },
  {
    "id": "party-spicy-person-21",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who here is secretly a furry?"
  },
  {
    "id": "party-spicy-person-23",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who in this room catches feelings for walking red flags?"
  },
  {
    "id": "party-spicy-person-24",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who here would send a risky screenshot to the wrong chat?"
  },
  {
    "id": "party-spicy-person-26",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who here could be a serial killer in disguise?",
    "conflictGroup": "murder_killer"
  },
  {
    "id": "party-spicy-person-28",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "text": "Who here is the best hype person before a date?"
  },
  {
    "id": "party-spicy-person-29",
    "pool": "island_person",
    "spicy": true,
    "angle": "neg",
    "text": "Worst person to get a spicy text from?",
    "shape": "relationship_role",
    "noWildcard": true
  },
  {
    "id": "party-spicy-person-30",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "weird",
    "text": "Who here is most likely to start an OnlyFans?"
  },
  {
    "id": "party-spicy-person-31",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "text": "Who's most likely to hook up with a friend's ex?"
  },
  {
    "id": "party-spicy-person-32",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "neg",
    "conflictGroup": "in_bed",
    "text": "Who in this room is the worst in bed?"
  },
  {
    "id": "party-spicy-person-33",
    "pool": "spicy_person",
    "spicy": true,
    "angle": "pos",
    "conflictGroup": "in_bed",
    "text": "Who in this room is the best in bed?"
  },
  {
    "id": "party-spicy-num-02",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "scale_1_10",
    "text": "1 to 10, how good are you at flirting?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-03",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "scale_1_10",
    "text": "1 to 10, how toxic is your type?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-04",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "count_0_10",
    "text": "How many people have you ghosted?"
  },
  {
    "id": "party-spicy-num-05",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "count_0_10",
    "text": "How many dates before letting someone stay the night?"
  },
  {
    "id": "party-spicy-num-06",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "scale_1_10",
    "text": "1 to 10, how wild is your Hidden photo folder?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-07",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "count_0_10",
    "text": "How many times have you faked an excuse to bail on a bad date?"
  },
  {
    "id": "party-spicy-num-09",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "scale_1_10",
    "text": "1 to 10, how jealous do you get?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-10",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "count_tiny",
    "text": "How many contacts in your phone have a sketchy nickname?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-12",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "scale_1_10",
    "text": "1 to 10, how honest are you about your body count?",
    "conflictGroup": "body_count",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-13",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "hours_short",
    "text": "Shortest hours you knew someone before kissing?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-14",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "count_tiny",
    "text": "How many exes do you think still want you back?",
    "conflictGroup": "exes_relationships",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-16",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "count_0_10",
    "text": "How many red flags will you ignore if they're hot?"
  },
  {
    "id": "party-spicy-num-17",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "scale_1_10",
    "text": "1 to 10, how good are you at reading flirting signals?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-19",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "count_0_10",
    "text": "How many dating apps have you downloaded and deleted?"
  },
  {
    "id": "party-spicy-num-20",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "scale_1_10",
    "text": "1 to 10, how bold are you making the first move?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-21",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "count_0_10",
    "text": "How many bad dates before you admit it's not happening?"
  },
  {
    "id": "party-spicy-num-23",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "pos",
    "shape": "count_0_10",
    "text": "How many compliments does it take to fold you?"
  },
  {
    "id": "party-spicy-num-24",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "count_tiny",
    "text": "How many bad relationships did you stay in too long?",
    "conflictGroup": "exes_relationships",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-25",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "minutes",
    "text": "Minutes you wait to text back so you seem chill?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-27",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "count_0_10",
    "text": "How many people in this city do you pray you never run into?"
  },
  {
    "id": "party-spicy-num-28",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "scale_1_10",
    "text": "1 to 10, how feral are you after two tequila shots?",
    "conflictGroup": "alcohol_tolerance",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-29",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "count_tiny",
    "text": "How many people in this room have you kissed?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-30",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "weird",
    "shape": "scale_1_10",
    "text": "1 to 10, how freaky are you?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-num-31",
    "pool": "spicy_numbers",
    "spicy": true,
    "angle": "neg",
    "shape": "count_small",
    "text": "How many shots before you black out?",
    "noWildcard": true,
    "conflictGroup": "alcohol_tolerance"
  },
  {
    "id": "party-spicy-conf-03",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "weird",
    "shape": "dating_flag",
    "text": "Biggest red flag you secretly find hot?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-04",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "neg",
    "shape": "pickup_line",
    "text": "Worst pickup line that actually worked on you?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-29",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "pos",
    "shape": "pickup_line",
    "text": "Best pickup line you know?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-06",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "weird",
    "shape": "excuse_lie",
    "text": "Dumbest lie you told to impress a crush?"
  },
  {
    "id": "party-spicy-conf-08",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "neg",
    "shape": "trait_habit",
    "text": "Instant turn-off that kills the mood in seconds?"
  },
  {
    "id": "party-spicy-conf-09",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "weird",
    "shape": "text_fail",
    "text": "Weirdest compliment someone gave you in bed?"
  },
  {
    "id": "party-spicy-conf-17",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "pos",
    "shape": "dating_flag",
    "text": "Green flag that makes someone 10x hotter?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-30",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "pos",
    "shape": "dating_flag",
    "text": "Biggest green flag in a partner?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-31",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "neg",
    "shape": "dating_flag",
    "text": "Red flag you ignore if they're hot?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-20",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "pos",
    "shape": "kink_turnon",
    "conflictGroup": "fetish",
    "text": "Best fetish or kink?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-21",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "neg",
    "shape": "kink_turnon",
    "conflictGroup": "fetish",
    "text": "Worst fetish or kink?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-26",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "pos",
    "shape": "drunk_stunt",
    "text": "Best party drug or substance?"
  },
  {
    "id": "party-spicy-conf-28",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "weird",
    "shape": "kink_turnon",
    "conflictGroup": "fetish",
    "text": "Wildest kink you'd actually try?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-32",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "pos",
    "shape": "sex_position",
    "text": "Best sex position?",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-33",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "neg",
    "shape": "sex_position",
    "text": "Worst sex position?",
    "conflictGroup": "sex_pos_bad_weird",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-34",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "weird",
    "shape": "sex_position",
    "text": "Weirdest sex position?",
    "conflictGroup": "sex_pos_bad_weird",
    "noWildcard": true
  },
  {
    "id": "party-spicy-conf-35",
    "pool": "spicy_confessions",
    "spicy": true,
    "angle": "neg",
    "shape": "dating_flag",
    "text": "Small habit that's an instant red flag (like milk before cereal)?",
    "noWildcard": true
  },
  {
    "id": "party-char-creature-smash",
    "pool": "characters",
    "spicy": true,
    "angle": "weird",
    "conflictGroup": "char_smash",
    "text": "Which creature would you hook up with?"
  }
];
