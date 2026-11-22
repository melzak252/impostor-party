export interface QuestionPoolItem {
  id: string;
  pool: string;
  angle: "pos" | "neg" | "weird";
  spicy?: boolean;
  shape?: string;
  conflictGroup?: string;
  noWildcard?: boolean;
  text: string;
}

export const POP_QUESTION_ITEMS: readonly QuestionPoolItem[] = [
  // =========================================================================
  // ANIMALS (28)
  // =========================================================================
  { id: "pop-animals-01", pool: "animals", angle: "pos", shape: "wild_animal", text: "What animal do you want as your bodyguard?" },
  { id: "pop-animals-02", pool: "animals", angle: "weird", shape: "general_animal", text: "What animal matches your Monday morning energy?" },
  { id: "pop-animals-03", pool: "animals", angle: "weird", shape: "wild_animal", noWildcard: true, text: "Biggest animal you could beat in a fistfight?" },
  { id: "pop-animals-04", pool: "animals", angle: "neg", shape: "wild_animal", text: "Scariest animal if it were bus-sized?" },
  { id: "pop-animals-05", pool: "animals", angle: "pos", shape: "companion_animal", text: "Best animal to be reincarnated as?" },
  { id: "pop-animals-06", pool: "animals", angle: "pos", shape: "companion_animal", text: "Dream pet if laws and money didn't exist?" },
  { id: "pop-animals-07", pool: "animals", angle: "neg", shape: "general_animal", text: "Worst animal to have as a roommate?" },
  { id: "pop-animals-08", pool: "animals", angle: "pos", shape: "general_animal", text: "What animal is secretly a genius?" },
  { id: "pop-animals-09", pool: "animals", angle: "weird", shape: "wild_animal", text: "What animal are you riding into battle?" },
  { id: "pop-animals-10", pool: "animals", angle: "weird", shape: "general_animal", text: "What animal is definitely plotting against humanity?" },
  { id: "pop-animals-11", pool: "animals", angle: "weird", shape: "companion_animal", text: "Funniest animal if it could talk?" },
  { id: "pop-animals-12", pool: "animals", angle: "neg", shape: "pest_animal", text: "Animal you're irrationally terrified of?" },
  { id: "pop-animals-13", pool: "animals", angle: "pos", shape: "companion_animal", text: "Best animal to have as a best friend?" },
  { id: "pop-animals-14", pool: "animals", angle: "pos", shape: "general_animal", text: "Coolest animal at the zoo?" },
  { id: "pop-animals-15", pool: "animals", angle: "weird", shape: "general_animal", text: "What animal would make the best detective?" },
  { id: "pop-animals-16", pool: "animals", angle: "weird", shape: "general_animal", text: "Goofiest animal when it runs?" },
  { id: "pop-animals-17", pool: "animals", angle: "neg", shape: "wild_animal", text: "Last animal you want to meet in a dark alley?" },
  { id: "pop-animals-18", pool: "animals", angle: "pos", shape: "companion_animal", text: "What animal is living life on easy mode?" },
  { id: "pop-animals-20", pool: "animals", angle: "weird", shape: "wild_animal", text: "What animal deserves to be on a national flag?" },
  { id: "pop-animals-21", pool: "animals", angle: "pos", shape: "companion_animal", text: "Cutest animal, no debate?" },
  { id: "pop-animals-22", pool: "animals", angle: "neg", shape: "wild_animal", text: "Worst animal to be stuck in an elevator with?" },
  { id: "pop-animals-23", pool: "animals", angle: "pos", shape: "wild_animal", text: "Animal with the sickest real-life superpower?" },
  { id: "pop-animals-25", pool: "animals", angle: "weird", shape: "general_animal", text: "Your spirit animal at a house party?" },
  { id: "pop-animals-26", pool: "animals", angle: "pos", shape: "companion_animal", text: "Best animal to bring to a deserted island?" },
  { id: "pop-animals-27", pool: "animals", angle: "neg", shape: "pest_animal", text: "Most overrated animal?" },
  { id: "pop-animals-29", pool: "animals", angle: "neg", shape: "pest_animal", text: "What animal is the biggest menace to society?" },
  { id: "pop-animals-30", pool: "animals", angle: "neg", shape: "pest_animal", text: "What animal would you instantly delete from Earth?" },

  // =========================================================================
  // ACTING (10, in movies pool)
  // =========================================================================
  { id: "pop-actors-04", pool: "movies", angle: "pos", shape: "actor", noWildcard: true, text: "Actor who carries even the worst movies?" },
  { id: "pop-actors-11", pool: "movies", angle: "neg", shape: "actor", noWildcard: true, text: "Actor who plays the same guy in every movie?" },
  { id: "pop-actors-13", pool: "movies", angle: "pos", shape: "actor", noWildcard: true, text: "Greatest action star of all time?" },
  { id: "pop-actors-15", pool: "movies", angle: "pos", shape: "actor", noWildcard: true, text: "Funniest actor alive?" },
  { id: "pop-actors-16", pool: "movies", angle: "neg", shape: "actor", noWildcard: true, text: "Most overrated A-list actor?" },
  { id: "pop-actors-17", pool: "movies", angle: "pos", shape: "actor", noWildcard: true, text: "Actor born to play a secret agent?" },
  { id: "pop-actors-24", pool: "movies", angle: "neg", shape: "actor", noWildcard: true, text: "Actor whose voice you can't stand?" },
  { id: "pop-actors-28", pool: "movies", angle: "pos", shape: "actor", noWildcard: true, text: "Best dramatic actor?" },
  { id: "pop-actors-29", pool: "movies", angle: "neg", shape: "actor", noWildcard: true, text: "Actor who's way too famous for their acting?" },
  { id: "pop-actors-30", pool: "movies", angle: "neg", shape: "actor", noWildcard: true, text: "Actor who instantly ruins a movie?" },

  // =========================================================================
  // MOVIES (28)
  // =========================================================================
  { id: "pop-movies-01", pool: "movies", angle: "pos", shape: "movie_title", text: "Movie you could watch 10 times in a row?" },
  { id: "pop-movies-02", pool: "movies", angle: "neg", shape: "movie_title", text: "Movie that wrecked you emotionally?" },
  { id: "pop-movies-03", pool: "movies", angle: "pos", shape: "movie_title", conflictGroup: "plot_twist", text: "Movie with the wildest plot twist?" },
  { id: "pop-movies-04", pool: "movies", angle: "pos", shape: "movie_title", text: "Movie you wish you could watch for the first time again?" },
  { id: "pop-movies-05", pool: "movies", angle: "pos", shape: "movie_title", text: "Movie with the best soundtrack?" },
  { id: "pop-movies-06", pool: "movies", angle: "pos", shape: "movie_title", text: "10/10 movie everyone must see?" },
  { id: "pop-movies-07", pool: "movies", angle: "neg", shape: "movie_title", text: "Movie that traumatized you as a kid?" },
  { id: "pop-movies-08", pool: "movies", angle: "neg", shape: "movie_title", text: "Most overrated movie?" },
  { id: "pop-movies-09", pool: "movies", angle: "pos", shape: "movie_title", text: "Instant good-mood movie?" },
  { id: "pop-movies-10", pool: "movies", angle: "weird", shape: "movie_title", text: "Movie universe you'd live in?" },
  { id: "pop-movies-11", pool: "movies", angle: "pos", shape: "movie_title", text: "Movie that was way better than expected?" },
  { id: "pop-movies-12", pool: "movies", angle: "neg", shape: "movie_title", text: "Movie that put you to sleep?" },
  { id: "pop-movies-13", pool: "movies", angle: "weird", shape: "movie_title", text: "Movie you quote way too much?" },
  { id: "pop-movies-14", pool: "movies", angle: "pos", shape: "movie_title", conflictGroup: "movie_sequels", text: "Sequel that's better than the original?" },
  { id: "pop-movies-15", pool: "movies", angle: "weird", shape: "movie_title", text: "Trashy movie you secretly love?" },
  { id: "pop-movies-17", pool: "movies", angle: "neg", shape: "movie_title", text: "Movie with the worst ending?" },
  { id: "pop-movies-18", pool: "movies", angle: "weird", shape: "movie_title", text: "Best movie for a chaotic night with friends?" },
  { id: "pop-movies-19", pool: "movies", angle: "pos", shape: "movie_title", text: "Ultimate cozy rainy-day movie?" },
  { id: "pop-movies-20", pool: "movies", angle: "neg", shape: "movie_title", text: "Scariest movie you've seen?" },
  { id: "pop-movies-21", pool: "movies", angle: "pos", shape: "movie_title", text: "Funniest movie you've seen?" },
  { id: "pop-movies-22", pool: "movies", angle: "neg", shape: "movie_title", conflictGroup: "movie_sequels", text: "Sequel that should've never existed?" },
  { id: "pop-movies-24", pool: "movies", angle: "weird", shape: "movie_title", text: "Classic movie you've lied about seeing?" },
  { id: "pop-movies-28", pool: "movies", angle: "weird", shape: "movie_title", conflictGroup: "plot_twist", text: "Movie that broke your brain?" },
  { id: "pop-movies-29", pool: "movies", angle: "neg", shape: "movie_title", text: "Worst movie you wasted 2 hours on?" },
  { id: "pop-movies-30", pool: "movies", angle: "neg", shape: "movie_title", text: "Movie you turned off in 20 minutes?" },

  // =========================================================================
  // TV SERIES (28)
  // =========================================================================
  { id: "pop-tv-series-01", pool: "tv_series", angle: "pos", text: "Show you wish you could forget and rewatch?" },
  { id: "pop-tv-series-02", pool: "tv_series", angle: "weird", text: "TV show universe you'd move to tomorrow?" },
  { id: "pop-tv-series-03", pool: "tv_series", angle: "weird", text: "Show you binged in an unhealthy weekend?" },
  { id: "pop-tv-series-04", pool: "tv_series", angle: "pos", text: "Show with a theme song you never skip?" },
  { id: "pop-tv-series-05", pool: "tv_series", angle: "neg", conflictGroup: "tv_finale", text: "Show with the worst finale?" },
  { id: "pop-tv-series-06", pool: "tv_series", angle: "pos", text: "Show you put on for background noise?" },
  { id: "pop-tv-series-07", pool: "tv_series", angle: "neg", text: "Show that got canceled way too soon?" },
  { id: "pop-tv-series-08", pool: "tv_series", angle: "pos", text: "Show with the funniest cast?" },
  { id: "pop-tv-series-09", pool: "tv_series", angle: "pos", text: "Show that hooked you in episode one?" },
  { id: "pop-tv-series-10", pool: "tv_series", angle: "neg", text: "Show that dragged on too many seasons?" },
  { id: "pop-tv-series-11", pool: "tv_series", angle: "pos", text: "Show you force your friends to watch?" },
  { id: "pop-tv-series-12", pool: "tv_series", angle: "pos", text: "Childhood show that still slaps?" },
  { id: "pop-tv-series-14", pool: "tv_series", angle: "neg", text: "Show you quit halfway through?" },
  { id: "pop-tv-series-15", pool: "tv_series", angle: "weird", text: "Show you'd love to be a character on?" },
  { id: "pop-tv-series-16", pool: "characters", angle: "neg", text: "Most hated fictional character?" },
  { id: "pop-tv-series-17", pool: "tv_series", angle: "pos", shape: "animated_tv", noWildcard: true, text: "Greatest animated show of all time?" },
  { id: "pop-tv-series-18", pool: "tv_series", angle: "pos", text: "Ultimate comfort sitcom?" },
  { id: "pop-tv-series-19", pool: "tv_series", angle: "pos", conflictGroup: "tv_finale", text: "Show that nailed its finale?" },
  { id: "pop-tv-series-20", pool: "tv_series", angle: "weird", text: "Show that ruined your sleep schedule?" },
  { id: "pop-tv-series-21", pool: "tv_series", angle: "neg", text: "Show with the most stressful cliffhangers?" },
  { id: "pop-tv-series-22", pool: "tv_series", angle: "neg", text: "Most overrated TV show?" },
  { id: "pop-tv-series-23", pool: "tv_series", angle: "weird", text: "Trashiest guilty-pleasure show?" },
  { id: "pop-tv-series-24", pool: "tv_series", angle: "weird", text: "Worst show to watch with your grandparents?" },
  { id: "pop-tv-series-25", pool: "tv_series", angle: "pos", text: "Show you rewatch every year?" },
  { id: "pop-tv-series-26", pool: "tv_series", angle: "weird", text: "Show whose plot went off the rails?" },
  { id: "pop-tv-series-27", pool: "tv_series", angle: "neg", text: "Show so slow you nearly gave up?" },
  { id: "pop-tv-series-28", pool: "tv_series", angle: "pos", text: "Show you can't live without?" },
  { id: "pop-tv-series-29", pool: "tv_series", angle: "neg", text: "Worst show you wasted time on?" },
  { id: "pop-tv-series-30", pool: "tv_series", angle: "neg", text: "Show everyone hypes that you don't get?" },

  // =========================================================================
  // GAMES (28)
  // =========================================================================
  { id: "pop-games-01", pool: "games", angle: "pos", conflictGroup: "main_game", text: "Game you've sunk the most hours into?" },
  { id: "pop-games-02", pool: "games", angle: "neg", text: "Game that ruins friendships the fastest?" },
  { id: "pop-games-03", pool: "games", angle: "pos", text: "Game with the best soundtrack?" },
  { id: "pop-games-04", pool: "games", angle: "weird", text: "Game world you'd live in for a year?" },
  { id: "pop-games-05", pool: "games", angle: "neg", conflictGroup: "rage_games", text: "Game that made you rage-quit the hardest?" },
  { id: "pop-games-06", pool: "games", angle: "pos", text: "Game with the best story?" },
  { id: "pop-games-07", pool: "games", angle: "pos", text: "Childhood game you still miss?" },
  { id: "pop-games-08", pool: "games", angle: "pos", text: "Go-to cozy game?" },
  { id: "pop-games-10", pool: "games", angle: "pos", text: "Best couch co-op game?" },
  { id: "pop-games-11", pool: "games", angle: "neg", text: "Most overrated video game?" },
  { id: "pop-games-12", pool: "games", angle: "weird", conflictGroup: "main_game", text: "Game you're best at?" },
  { id: "pop-games-13", pool: "games", angle: "neg", conflictGroup: "rage_games", text: "Game that's way harder than it looks?" },
  { id: "pop-games-14", pool: "games", angle: "weird", text: "Weirdest game you actually love?" },
  { id: "pop-games-15", pool: "games", angle: "pos", text: "Best-looking game you've played?" },
  { id: "pop-games-16", pool: "games", angle: "pos", text: "Game with the most iconic main character?" },
  { id: "pop-games-17", pool: "games", angle: "weird", text: "Game that kept you up until sunrise?" },
  { id: "pop-games-18", pool: "games", angle: "pos", text: "Favorite indie game?" },
  { id: "pop-games-19", pool: "games", angle: "weird", text: "Game you'd rather watch than play?" },
  { id: "pop-games-20", pool: "games", angle: "pos", text: "Game with the best open world?" },
  { id: "pop-games-21", pool: "games", angle: "neg", conflictGroup: "toxic_games", text: "Game with the most toxic lobbies?" },
  { id: "pop-games-22", pool: "games", angle: "neg", text: "Biggest gaming flop you played?" },
  { id: "pop-games-23", pool: "games", angle: "weird", text: "Funniest buggy game?" },
  { id: "pop-games-24", pool: "games", angle: "neg", conflictGroup: "rage_games", text: "Game with a boss fight that scarred you?" },
  { id: "pop-games-25", pool: "games", angle: "neg", text: "Most stressful video game?" },
  { id: "pop-games-26", pool: "games", angle: "weird", conflictGroup: "rage_games", text: "Game that tested your patience?" },
  { id: "pop-games-27", pool: "games", angle: "weird", text: "Most chaotic multiplayer game?" },
  { id: "pop-games-28", pool: "games", angle: "weird", text: "Game with the weirdest fanbase?" },
  { id: "pop-games-29", pool: "games", angle: "neg", text: "Worst game you paid full price for?" },
  { id: "pop-games-30", pool: "games", angle: "neg", conflictGroup: "rage_games", text: "Game that is pure ragebait?" },
  { id: "pop-games-31", pool: "games", angle: "neg", conflictGroup: "toxic_games", text: "Game with the most toxic fanbase?" },
];
