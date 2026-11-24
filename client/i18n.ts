import { useCallback, useEffect, useState } from "react";

export type SupportedLanguage = "en" | "pl" | "es" | "de" | "fr";

export type QuestionTopicId =
  | "animals"
  | "movies_tv"
  | "games"
  | "music"
  | "friends"
  | "superpowers"
  | "food_places"
  | "everyday"
  | "pop_life";

export const LANGUAGE_OPTIONS: ReadonlyArray<{ code: SupportedLanguage; label: string }> = [
  { code: "en", label: "English" },
  { code: "pl", label: "Polski" },
  { code: "es", label: "Español" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
];

const STORAGE_KEY = "impostor_lang";
const LANG_EVENT = "impostor-lang-change";
const SUPPORTED_LANGUAGES = new Set<string>(["en", "pl", "es", "de", "fr"]);

function isSupportedLanguage(value: string | null | undefined): value is SupportedLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.has(value);
}

export function detectInitialLanguage(): SupportedLanguage {
  try {
    if (typeof localStorage !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isSupportedLanguage(saved)) return saved;
    }
  } catch {
    // Ignore storage access errors
  }

  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    const prefix = navigator.language.toLowerCase().split("-")[0];
    if (isSupportedLanguage(prefix)) return prefix;
  }

  return "en";
}

export function useLanguage(): [SupportedLanguage, (lang: SupportedLanguage) => void] {
  const [lang, setLangState] = useState<SupportedLanguage>(() => detectInitialLanguage());

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const detail = (event as CustomEvent<SupportedLanguage>).detail;
      if (isSupportedLanguage(detail)) {
        setLangState(detail);
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY && isSupportedLanguage(event.newValue)) {
        setLangState(event.newValue);
      }
    };
    window.addEventListener(LANG_EVENT, handleEvent);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(LANG_EVENT, handleEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setLanguage = useCallback((nextLang: SupportedLanguage) => {
    setLangState(nextLang);
    try {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(STORAGE_KEY, nextLang);
      }
    } catch {
      // Ignore storage access errors
    }
    window.dispatchEvent(new CustomEvent<SupportedLanguage>(LANG_EVENT, { detail: nextLang }));
  }, []);

  return [lang, setLanguage];
}

export interface TranslationStrings {
  common: {
    brand: string;
    languageLabel: string;
    voiceOn: string;
    voiceOff: string;
    tryAgain: string;
    retry: string;
    retryConnection: string;
    leaveParty: string;
    backToHome: string;
    home: string;
    dismiss: string;
    dismissError: string;
    youSuffix: string;
    online: string;
    offline: string;
  };
  home: {
    eyebrow: string;
    enterName: string;
    nameMaxLength: string;
    invalidCode: string;
    removedKicked: string;
    removedExpired: string;
    removedLeft: string;
    seatSaved: string;
    partyTitle: (code: string) => string;
    returnCardCopy: string;
    partyConnected: string;
    partyReconnecting: string;
    returnToParty: string;
    heroEyebrow: string;
    heroTitleLine1: string;
    heroTitleLine2: string;
    heroBody: string;
    factHomies: string;
    factOddPrompt: string;
    factChill: string;
    demoAriaLabel: string;
    demoHeading: string;
    demoSusCount: string;
    demoMostHomies: string;
    demoExampleNormal: string;
    demoNormalStamp: string;
    demoTheImpostor: string;
    demoExampleSus: string;
    demoSusStamp: string;
    demoFooter: string;
    createEyebrow: string;
    createTitle: string;
    hostBadge: string;
    yourNickname: string;
    nicknamePlaceholder: string;
    whoCanFindIt: string;
    visibilityPrivateOption: string;
    visibilityPublicOption: string;
    creatingRoom: string;
    createButton: string;
    joinEyebrow: string;
    joinTitle: string;
    sixChars: string;
    joinCopy: string;
    partyCode: string;
    letMeIn: string;
    publicEyebrow: string;
    publicTitle: string;
    liveCount: (count: number) => string;
    refresh: string;
    gettingSeatReady: string;
    scoutingLobbies: string;
    couldNotLoadParties: (error: string) => string;
    noPublicParties: string;
    hostRoom: (hostName: string) => string;
    roomMeta: (code: string, playerCount: number, maxPlayers: number) => string;
    returnShort: string;
    leavePartyFirst: string;
    join: string;
    publicDisclaimer: string;
    footerLeft: string;
    footerRight: string;
    questionsButton: string;
  };
  questions: {
    eyebrow: string;
    title: string;
    backToHome: string;
    topicsHeading: string;
    allTopics: string;
    allLanguages: string;
    allPools: string;
    allAngles: string;
    allSpicy: string;
    friendlyOnly: string;
    spicyOnly: string;
    searchPlaceholder: string;
    shownCount: (shown: number, total: number) => string;
    friendlyCombos: (count: number) => string;
    spicyCombos: (count: number) => string;
    loading: string;
    noMatches: string;
    prevPage: string;
    nextPage: string;
    pageOf: (page: number, totalPages: number) => string;
    suggestButton: string;
    suggestTitle: string;
    suggestPlaceholder: string;
    suggestSpicy: string;
    suggestSubmit: string;
    suggestSuccess: string;
    adminButton: string;
    adminTokenPlaceholder: string;
    adminLoad: string;
    adminApprove: string;
    adminReject: string;
    adminEmpty: string;
  };
  join: {
    inviteDrop: string;
    pullUpTitle: string;
    roomCodeLabel: string;
    invalidInviteCode: string;
    alreadySeatInParty: string;
    alreadyInOtherParty: (code: string) => string;
    connectedDot: string;
    reconnectingPaused: string;
    returnToCurrentParty: string;
    leaveCurrentParty: string;
    joinNicknamePlaceholder: string;
    joinSeatNote: string;
    joining: string;
  };
  lobby: {
    eyebrow: string;
    removedKicked: string;
    removedExpired: string;
    removedLeft: string;
    goHome: string;
    seatRemoved: string;
    liveAtTable: string;
    reconnectingShort: string;
    roomCode: string;
    hideCode: string;
    showCode: string;
    copied: string;
    copyInviteLink: string;
    copyThisLink: string;
    selectableInviteLink: string;
    inviteNote: string;
    partySeats: string;
    seatNumber: (num: string) => string;
    waitingForHomie: string;
    hostTag: string;
    pickYourVibe: string;
    chooseYourColour: string;
    selectedColour: (name: string) => string;
    occupied: string;
    selected: string;
    squadMember: string;
    removePlayerAria: (name: string) => string;
    bootPlayer: string;
    houseRules: string;
    settings: string;
    hostOnly: string;
    visibility: string;
    visibilityAria: string;
    visibilityPrivateDesc: string;
    visibilityPublicDesc: string;
    privateLabel: string;
    publicLabel: string;
    questionReveal: string;
    questionRevealAria: string;
    questionRevealDesc: string;
    everyoneReady: string;
    after8Seconds: string;
    answerTime: string;
    answerTimeAria: string;
    answerTimeDesc: string;
    answerTimeOff: string;
    answerTimeSeconds: (seconds: number) => string;
    roundCount: string;
    roundCountAria: string;
    roundCountDesc: string;
    scoreBadge: (points: number) => string;
    generalSettings: string;
    advancedSettings: string;
    voiceSynthesizer: string;
    voiceSynthesizerDesc: string;
    spicyMode: string;
    spicyModeAria: string;
    spicyOnDesc: string;
    spicyOffDesc: string;
    spicyOff: string;
    spicyOn: string;
    gameLanguage: string;
    gameLanguageAria: string;
    gameLanguageDesc: string;
    topicsLabel: string;
    topicsDescription: string;
    topics: Record<QuestionTopicId, string>;
    kickConfirm: (name: string) => string;
    privateRoom: string;
    publicRoom: string;
    waitingRoom: string;
    hostedBy: (name: string, count: number) => string;
    aPlayer: string;
    reconnectingNotice: string;
    roundCancelled: (name: string) => string;
    whosAtTable: string;
    squad: string;
    youAreHost: string;
    offlineGraceNote: string;
    startRound: string;
    footerTagline: string;
    invalidPartyCode: string;
    enterCodeFromHome: string;
    loadingParty: string;
    oneSeatPerGuest: string;
    alreadyInParty: string;
    alreadyInPartyBody: (code: string) => string;
    leaving: string;
    reconnectToLeave: string;
    joinThisParty: string;
    inviteRequired: string;
    notInParty: string;
    notInPartyBody: string;
    joinParty: string;
    couldNotLoadParty: string;
  };
  round: {
    phases: {
      answering: string;
      answers: string;
      question: string;
      voting: string;
      results: string;
    };
    impostorBadge: string;
    answerUnavailable: string;
    flipsIn: (seconds: number) => string;
    votedForAria: (name: string) => string;
    votedForTitle: (voter: string, target: string) => string;
    noVotes: string;
    sharedQuestionAria: string;
    theRealQuestion: string;
    roundUnavailable: string;
    noActiveRound: string;
    noActiveRoundBody: string;
    lockedInProgress: (done: number, total: number) => string;
    questionInProgress: (seconds: number) => string;
    readyProgress: (done: number, total: number) => string;
    votedProgress: (done: number, total: number) => string;
    revealQuestion: string;
    readyToVote: string;
    answerSubmitted: string;
    waiting: string;
    eyebrowAnswers: string;
    eyebrowQuestion: string;
    eyebrowVoting: string;
    eyebrowResults: string;
    titleVoting: string;
    titleResults: string;
    titleDefault: string;
    roundLabel: (num: number, phaseName: string) => string;
    answerProgressAria: string;
    eyesOnly: string;
    spicyQuestionBadge: string;
    promptLive: string;
    shufflingCard: string;
    yourAnswer: string;
    answerPlaceholder: string;
    answerHelp: string;
    answerLocked: string;
    submitAnswer: string;
    answerLockedStatus: string;
    editAnswer: string;
    answerTimerLeft: (seconds: number) => string;
    leaderboard: string;
    pointsEarned: (points: number) => string;
    answersHiddenNote: string;
    caughtIn4K: string;
    caseClosed: string;
    impostorWas: (name: string) => string;
    impostorNotIdentified: string;
    impostorsQuestionAria: string;
    impostorsQuestion: string;
    autoFlipNote: string;
    flippingNow: string;
    realQuestionDropsIn: (seconds: number) => string;
    noButtonNeeded: string;
    cardsFlipping: string;
    readyForRealQuestion: string;
    flipTogetherPrompt: string;
    notReady: string;
    lockedInForVoting: string;
    roastAnswersPrompt: string;
    voteLockedIn: string;
    taggedAsSus: (name: string) => string;
    yourSelectedPlayer: string;
    selectedAsSus: (name: string) => string;
    playerGeneric: string;
    tapAnswerToPick: string;
    lockInVote: string;
    impostorCantVote: string;
    votesLockIn: (seconds: number) => string;
    allCardsFlipped: string;
    flippingCardOf: (current: number, total: number) => string;
    readyForRealQ: string;
    oneCardPerSec: string;
    votingInstruction: string;
    skipRerollRound: string;
    rerollVote: (votes: number, needed: number) => string;
    rerollVoted: (votes: number, needed: number) => string;
    nextRound: string;
    backToLobby: string;
  };
}

const en: TranslationStrings = {
  common: {
    brand: "Impostor Party",
    languageLabel: "Language",
    voiceOn: "Voice on",
    voiceOff: "Voice off",
    tryAgain: "Try again",
    retry: "Retry",
    retryConnection: "Retry connection",
    leaveParty: "Leave party",
    backToHome: "Back to home",
    home: "Home",
    dismiss: "Dismiss",
    dismissError: "Dismiss error",
    youSuffix: " (you)",
    online: "Online",
    offline: "Offline",
  },
  home: {
    eyebrow: "3-6 players · 1 sus prompt",
    enterName: "Enter your name to continue.",
    nameMaxLength: "Names can be up to 20 characters.",
    invalidCode: "Enter a valid six-character party code.",
    removedKicked: "You were removed from your previous party.",
    removedExpired: "Your previous party seat expired.",
    removedLeft: "You left your previous party.",
    seatSaved: "Seat saved",
    partyTitle: (code) => `Party ${code}`,
    returnCardCopy: "Return to your room, or leave it before joining another.",
    partyConnected: "Party connection active.",
    partyReconnecting: "Reconnecting to your party; leaving is paused.",
    returnToParty: "Return to party",
    heroEyebrow: "SPOT THE FAKE",
    heroTitleLine1: "Read the room.",
    heroTitleLine2: "Who's sus?",
    heroBody:
      "Everyone answers a secret prompt. One player gets a slightly different one. Compare answers, talk it out, and vote out the impostor.",
    factHomies: "players",
    factOddPrompt: "odd prompt",
    factChill: "stress",
    demoAriaLabel: "Illustrative question pair, not part of the live deck",
    demoHeading: "Example round",
    demoSusCount: "1 sus prompt",
    demoMostHomies: "Most players",
    demoExampleNormal: "What snack are you sneaking into the movie theater?",
    demoNormalStamp: "Normal prompt",
    demoTheImpostor: "The impostor",
    demoExampleSus: "What snack would you eat at 3 AM over the sink?",
    demoSusStamp: "Sus prompt",
    demoFooter: "Same topic, different question.",
    createEyebrow: "01 / Host",
    createTitle: "Create a room",
    hostBadge: "Host",
    yourNickname: "Your nickname",
    nicknamePlaceholder: "e.g. Alex",
    whoCanFindIt: "Who can find it?",
    visibilityPrivateOption: "Private (invite only)",
    visibilityPublicOption: "Public (listed in lobby)",
    creatingRoom: "Creating…",
    createButton: "Create room",
    joinEyebrow: "02 / Join",
    joinTitle: "Join a party",
    sixChars: "6 chars",
    joinCopy: "Enter a 6-character room code or open an invite link.",
    partyCode: "Party code",
    letMeIn: "Join room",
    publicEyebrow: "Open rooms",
    publicTitle: "Public parties",
    liveCount: (count) => `${count} live`,
    refresh: "Refresh",
    gettingSeatReady: "Getting your guest seat ready…",
    scoutingLobbies: "Loading open rooms…",
    couldNotLoadParties: (error) => `Could not load public parties: ${error}`,
    noPublicParties: "No public rooms open right now. Create one or use an invite code.",
    hostRoom: (hostName) => `${hostName}'s room`,
    roomMeta: (code, playerCount, maxPlayers) => `${code} · ${playerCount}/${maxPlayers} players`,
    returnShort: "Return",
    leavePartyFirst: "Leave your party first",
    join: "Join",
    publicDisclaimer: "Public parties are lobby-only and show open seats. Private rooms never appear here.",
    footerLeft: "Impostor Party",
    footerRight: "Private rooms stay out of discovery.",
    questionsButton: "Questions & Topics",
  },
  questions: {
    eyebrow: "Question & Topic Browser",
    title: "All Questions & Topics",
    backToHome: "Back to home",
    topicsHeading: "Topics",
    allTopics: "All topics",
    allLanguages: "All languages",
    allPools: "All pools",
    allAngles: "All angles",
    allSpicy: "Friendly & 18+",
    friendlyOnly: "Friendly only",
    spicyOnly: "18+ Spicy only",
    searchPlaceholder: "Search questions or IDs...",
    shownCount: (shown, total) => `${shown} / ${total} shown`,
    friendlyCombos: (count) => `${count} friendly combos`,
    spicyCombos: (count) => `${count} spicy combos`,
    loading: "Loading questions...",
    noMatches: "No questions match the current filters.",
    prevPage: "Previous",
    nextPage: "Next",
    pageOf: (page, totalPages) => `Page ${page} of ${totalPages}`,
    suggestButton: "Suggest a question",
    suggestTitle: "Suggestion Box",
    suggestPlaceholder: "Write a short, clear question (8–140 chars)...",
    suggestSpicy: "18+ Spicy",
    suggestSubmit: "Send suggestion",
    suggestSuccess: "Thanks! Your question was sent for review.",
    adminButton: "Moderation",
    adminTokenPlaceholder: "Admin token...",
    adminLoad: "Load queue",
    adminApprove: "Approve",
    adminReject: "Reject",
    adminEmpty: "No suggestions in this queue.",
  },
  join: {
    inviteDrop: "Invite drop",
    pullUpTitle: "Pull up to the party",
    roomCodeLabel: "Room code",
    invalidInviteCode: "That code is not valid. Check the invite and try again.",
    alreadySeatInParty: "You already have a seat in this party.",
    alreadyInOtherParty: (code) =>
      `You are already in party ${code}. Leave it before joining this one.`,
    connectedDot: "Connected.",
    reconnectingPaused: "Reconnecting; leave is paused.",
    returnToCurrentParty: "Return to current party",
    leaveCurrentParty: "Leave current party",
    joinNicknamePlaceholder: "What should the squad call you?",
    joinSeatNote: "Opening an invite does not take a seat. Join only when you pick a name and hop in.",
    joining: "Joining…",
  },
  lobby: {
    eyebrow: "Squad up & spot the fake",
    removedKicked: "You got booted from this party.",
    removedExpired: "Your reserved seat expired while you were away.",
    removedLeft: "You left this party.",
    goHome: "Go to home",
    seatRemoved: "Seat removed",
    liveAtTable: "Live at the table",
    reconnectingShort: "Reconnecting · actions paused",
    roomCode: "Room code",
    hideCode: "Hide code",
    showCode: "Show code",
    copied: "Copied!",
    copyInviteLink: "Copy invite link",
    copyThisLink: "Copy this invite link",
    selectableInviteLink: "Selectable invite link",
    inviteNote: "Drop this link in the group chat to fill the seats.",
    partySeats: "Party seats",
    seatNumber: (num) => `Seat ${num}`,
    waitingForHomie: "Waiting for a homie…",
    hostTag: "★ Host",
    pickYourVibe: "Pick your vibe",
    chooseYourColour: "Choose your colour",
    selectedColour: (name) => `Selected: ${name}`,
    occupied: "occupied",
    selected: "selected",
    squadMember: "Squad member",
    removePlayerAria: (name) => `Remove ${name} from the party`,
    bootPlayer: "Boot player",
    houseRules: "House rules",
    settings: "Settings",
    hostOnly: "Host only",
    visibility: "Visibility",
    visibilityAria: "Party visibility",
    visibilityPrivateDesc: "Only people with the invite link can join.",
    visibilityPublicDesc: "Your open lobby appears in public discovery.",
    privateLabel: "Private",
    publicLabel: "Public",
    questionReveal: "Question reveal",
    questionRevealAria: "Question reveal timing",
    questionRevealDesc: "Choose how the normal question is revealed later in the round.",
    everyoneReady: "Everyone ready",
    after8Seconds: "Automatic",
    answerTime: "Answer timer",
    answerTimeAria: "Answer timer duration",
    answerTimeDesc: "How long players have to write their answer.",
    answerTimeOff: "No limit",
    answerTimeSeconds: (seconds: number) => `${seconds}s`,
    roundCount: "Rounds",
    roundCountAria: "Number of rounds",
    roundCountDesc: "How many rounds are played per match.",
    scoreBadge: (points: number) => `${points} pts`,
    generalSettings: "General",
    advancedSettings: "Advanced settings",
    voiceSynthesizer: "Voice narrator",
    voiceSynthesizerDesc: "Read answers and the real question aloud.",
    spicyMode: "Spicy mode (18+)",
    spicyModeAria: "Spicy mode",
    spicyOnDesc: "Includes cheeky and adult-leaning prompts.",
    spicyOffDesc: "Keeps built-in prompts friendly for everyone.",
    spicyOff: "Off",
    spicyOn: "On",
    gameLanguage: "Game language",
    gameLanguageAria: "Game language",
    gameLanguageDesc: "Language used for built-in prompts during rounds.",
    topicsLabel: "Topics",
    topicsDescription: "Choose which built-in question topics can appear. At least one must stay active.",
    topics: {
      animals: "Animals",
      movies_tv: "Movies & TV",
      games: "Games",
      music: "Music",
      friends: "Friends",
      superpowers: "Superpowers",
      food_places: "Food & Places",
      everyday: "Everyday",
      pop_life: "Pop & Life",
    },
    kickConfirm: (name) => `Remove ${name} from this party?`,
    privateRoom: "Private room",
    publicRoom: "Public room",
    waitingRoom: "The Waiting Room",
    hostedBy: (name, count) => `Hosted by ${name} · ${count}/8 homies`,
    aPlayer: "a player",
    reconnectingNotice: "Reconnecting to your party. Actions are paused until the connection returns.",
    roundCancelled: (name) =>
      `The round ended because ${name} left. Everyone is back in the lobby.`,
    whosAtTable: "Who's at the table",
    squad: "Squad",
    youAreHost: "★ You are host",
    offlineGraceNote: "Offline homies keep their seat and colour for 60 seconds while they reconnect.",
    startRound: "Start round",
    footerTagline: "Guard your prompt with your life.",
    invalidPartyCode: "That party code is not valid.",
    enterCodeFromHome: "Enter a code from the home page.",
    loadingParty: "Loading your party…",
    oneSeatPerGuest: "One seat per guest",
    alreadyInParty: "Already in a party",
    alreadyInPartyBody: (code) =>
      `You are currently in party ${code}. Leave it before opening this room.`,
    leaving: "Leaving…",
    reconnectToLeave: "Reconnect to leave",
    joinThisParty: "Join this party",
    inviteRequired: "Invite required",
    notInParty: "You are not in this party",
    notInPartyBody: "Choose a name and join explicitly to take an open seat.",
    joinParty: "Join party",
    couldNotLoadParty: "Could not load this party.",
  },
  round: {
    phases: {
      answering: "Secret Prompt",
      answers: "Answer Drop",
      question: "Group Interrogation",
      voting: "Sus Check",
      results: "The Big Reveal",
    },
    impostorBadge: "IMPOSTOR",
    answerUnavailable: "Answer unavailable.",
    flipsIn: (seconds) => (seconds === 1 ? "Flips in 1 second" : `Flips in ${seconds} seconds`),
    votedForAria: (name) => `Voted for ${name}`,
    votedForTitle: (voter, target) => `${voter} voted for ${target}`,
    noVotes: "No votes",
    sharedQuestionAria: "The shared question",
    theRealQuestion: "The real question",
    roundUnavailable: "Round unavailable",
    noActiveRound: "No active round",
    noActiveRoundBody: "Nothing is cooking right now. Hang tight for the host or bounce back home.",
    lockedInProgress: (done, total) => `${done}/${total} locked in`,
    questionInProgress: (seconds) => `Question in ${seconds}s`,
    readyProgress: (done, total) => `${done}/${total} ready`,
    votedProgress: (done, total) => `${done}/${total} voted`,
    revealQuestion: "Reveal question",
    readyToVote: "Ready to vote",
    answerSubmitted: "Answer submitted",
    waiting: "Cooking the answer...",
    eyebrowAnswers: "Answers only",
    eyebrowQuestion: "Compare answers",
    eyebrowVoting: "Secret ballot",
    eyebrowResults: "The Big Reveal",
    titleVoting: "Vote for the impostor",
    titleResults: "Every answer & vote",
    titleDefault: "Players' answers",
    roundLabel: (num, phaseName) => `Round ${num} · ${phaseName}`,
    answerProgressAria: "Answer progress by player",
    eyesOnly: "Eyes only · keep your prompt secret",
    spicyQuestionBadge: "Spicy question",
    promptLive: "Your prompt is live. Act natural.",
    shufflingCard: "Shuffling your secret card…",
    yourAnswer: "Your answer",
    answerPlaceholder: "Write a short, believable answer...",
    answerHelp: "Keep it short. Reloading only keeps a submitted answer.",
    answerLocked: "Answer locked!",
    submitAnswer: "Submit answer",
    answerLockedStatus: "Answer locked. Waiting for other players.",
    editAnswer: "Unlock & edit answer",
    answerTimerLeft: (seconds: number) => `${seconds}s left`,
    leaderboard: "Scoreboard",
    pointsEarned: (points: number) => `+${points}`,
    answersHiddenNote: "Your answer stays hidden until everyone submits.",
    caughtIn4K: "Impostor caught!",
    caseClosed: "Case closed",
    impostorWas: (name) => `IMPOSTOR WAS ${name}!`,
    impostorNotIdentified: "IMPOSTOR NOT IDENTIFIED!",
    impostorsQuestionAria: "The impostor's question",
    impostorsQuestion: "Impostor's question",
    autoFlipNote: "The real question will flip automatically.",
    flippingNow: "Flipping the real question now…",
    realQuestionDropsIn: (seconds) =>
      `Real question in ${seconds} ${seconds === 1 ? "second" : "seconds"}…`,
    noButtonNeeded: "Wait for the timer.",
    cardsFlipping: "Cards are flipping one by one...",
    readyForRealQuestion: "You're ready to see the real question.",
    flipTogetherPrompt: "Once everyone has read the answers, reveal the real question.",
    notReady: "Not ready",
    lockedInForVoting: "Ready for voting.",
    roastAnswersPrompt: "Compare answers, discuss, and mark ready when it's time to vote.",
    voteLockedIn: "Vote locked!",
    taggedAsSus: (name) => `You voted for ${name}. Waiting for others…`,
    yourSelectedPlayer: "your selected player",
    selectedAsSus: (name) => `Selected ${name}`,
    playerGeneric: "player",
    tapAnswerToPick: "Tap a player's card to select them.",
    lockInVote: "Lock in vote",
    impostorCantVote: "You are the impostor. Sit tight while everyone else votes!",
    votesLockIn: (seconds: number) => `All votes in! Locking in ${seconds}s...`,
    allCardsFlipped: "All cards flipped!",
    flippingCardOf: (current, total) => `Flipping card ${current} of ${total}…`,
    readyForRealQ: "Ready for the real question",
    oneCardPerSec: "1 card / 2 sec",
    votingInstruction: "Pick the player you think had the fake prompt, then lock in your vote.",
    skipRerollRound: "Skip / Reroll round",
    rerollVote: (votes, needed) => `Reroll question (${votes}/${needed})`,
    rerollVoted: (votes, needed) => `Reroll voted (${votes}/${needed})`,
    nextRound: "Next round",
    backToLobby: "Back to lobby",
  },
};

const pl: TranslationStrings = {
  common: {
    brand: "Impostor Party",
    languageLabel: "Język",
    voiceOn: "Głos wł.",
    voiceOff: "Głos wył.",
    tryAgain: "Spróbuj ponownie",
    retry: "Ponów",
    retryConnection: "Ponów połączenie",
    leaveParty: "Opuść pokój",
    backToHome: "Wróć na start",
    home: "Start",
    dismiss: "Zamknij",
    dismissError: "Zamknij błąd",
    youSuffix: " (ty)",
    online: "Online",
    offline: "Offline",
  },
  home: {
    eyebrow: "3–6 ziomków · 1 podejrzane pytanie",
    enterName: "Wpisz swoje imię, aby kontynuować.",
    nameMaxLength: "Imię może mieć maksymalnie 20 znaków.",
    invalidCode: "Wpisz poprawny sześciocyfrowy kod pokoju.",
    removedKicked: "Usunięto Cię z poprzedniego pokoju.",
    removedExpired: "Twoje miejsce w poprzednim pokoju wygasło.",
    removedLeft: "Opuszczono poprzedni pokój.",
    seatSaved: "Miejsce zapisane",
    partyTitle: (code) => `Pokój ${code}`,
    returnCardCopy: "Wróć do swojego pokoju albo opuść go przed dołączeniem do innej ekipy.",
    partyConnected: "Połączenie z pokojem aktywne.",
    partyReconnecting: "Ponowne łączenie z pokojem; opuszczanie wstrzymane.",
    returnToParty: "Wróć do pokoju",
    heroEyebrow: "ZNAJDŹ OSZUSTA",
    heroTitleLine1: "Wybadaj ekipę.",
    heroTitleLine2: "Kto kręci?",
    heroBody:
      "Każdy odpowiada na tajne pytanie. Jedna osoba dostaje nieco inne. Wyśmiejcie odpowiedzi, nie ufajcie nikomu i wygłosujcie impostora.",
    factHomies: "graczy przy stole",
    factOddPrompt: "inne pytanie",
    factChill: "litości",
    demoAriaLabel: "Przykładowa para pytań, spoza aktywnej talii",
    demoHeading: "Runda demo · spoza talii",
    demoSusCount: "1 podejrzane pytanie",
    demoMostHomies: "Większość graczy",
    demoExampleNormal: "Jaką przekąskę przemycasz do kina?",
    demoNormalStamp: "Zwykłe pytanie",
    demoTheImpostor: "Impostor",
    demoExampleSus: "Jaką przekąskę jesz o 3 w nocy nad zlewem?",
    demoSusStamp: "Podejrzane pytanie",
    demoFooter: "Ten sam klimat. Inne pytanie. Natychmiastowa paranoja.",
    createEyebrow: "01 / Załóż grę",
    createTitle: "Stwórz pokój",
    hostBadge: "Host",
    yourNickname: "Twój nick",
    nicknamePlaceholder: "np. MistrzBlefów",
    whoCanFindIt: "Kto może go znaleźć?",
    visibilityPrivateOption: "Prywatny (tylko z zaproszeniem)",
    visibilityPublicOption: "Publiczny (widoczny na liście)",
    creatingRoom: "Tworzenie…",
    createButton: "Stwórz pokój",
    joinEyebrow: "02 / Wbijaj do gry",
    joinTitle: "Dołącz do pokoju",
    sixChars: "6 znaków",
    joinCopy: "Masz kod pokoju od znajomych? Wpisz go tutaj albo otwórz link z zaproszeniem.",
    partyCode: "Kod pokoju",
    letMeIn: "Wchodzę",
    publicEyebrow: "Gracze online",
    publicTitle: "Publiczne pokoje",
    liveCount: (count) => `${count} aktywne`,
    refresh: "Odśwież",
    gettingSeatReady: "Przygotowujemy Twoje miejsce…",
    scoutingLobbies: "Szukamy otwartych pokoi…",
    couldNotLoadParties: (error) => `Nie udało się pobrać pokoi: ${error}`,
    noPublicParties: "Brak wolnych publicznych pokoi. Stwórz własny albo użyj kodu.",
    hostRoom: (hostName) => `Pokój gracza ${hostName}`,
    roomMeta: (code, playerCount, maxPlayers) => `${code} · ${playerCount}/${maxPlayers} graczy`,
    returnShort: "Wróć",
    leavePartyFirst: "Najpierw opuść swój pokój",
    join: "Dołącz",
    publicDisclaimer: "Publiczne pokoje pokazują tylko lobby z wolnymi miejscami. Prywatne nigdy się tu nie pojawiają.",
    footerLeft: "Jedno podejrzane pytanie. Zero alibi.",
    footerRight: "Prywatne pokoje pozostają ukryte.",
    questionsButton: "Pytania i tematy",
  },
  questions: {
    eyebrow: "Przeglądarka pytań i tematów",
    title: "Wszystkie pytania i tematy",
    backToHome: "Wróć na start",
    topicsHeading: "Tematy",
    allTopics: "Wszystkie tematy",
    allLanguages: "Wszystkie języki",
    allPools: "Wszystkie pule",
    allAngles: "Wszystkie typy",
    allSpicy: "Zwykłe i 18+",
    friendlyOnly: "Tylko zwykłe",
    spicyOnly: "Tylko 18+",
    searchPlaceholder: "Szukaj pytań lub ID...",
    shownCount: (shown, total) => `${shown} / ${total} pokazanych`,
    friendlyCombos: (count) => `${count} zwykłych par`,
    spicyCombos: (count) => `${count} pikantnych par`,
    loading: "Ładowanie pytań...",
    noMatches: "Brak pytań pasujących do wybranych filtrów.",
    prevPage: "Poprzednia",
    nextPage: "Następna",
    pageOf: (page, totalPages) => `Strona ${page} z ${totalPages}`,
    suggestButton: "Zaproponuj pytanie",
    suggestTitle: "Skrzynka propozycji",
    suggestPlaceholder: "Napisz krótkie, jasne pytanie (8–140 znaków)...",
    suggestSpicy: "18+ Pikantne",
    suggestSubmit: "Wyślij propozycję",
    suggestSuccess: "Dzięki! Twoje pytanie trafiło do weryfikacji.",
    adminButton: "Moderacja",
    adminTokenPlaceholder: "Token admina...",
    adminLoad: "Wczytaj",
    adminApprove: "Zatwierdź",
    adminReject: "Odrzuć",
    adminEmpty: "Brak propozycji w tej kolejce.",
  },
  join: {
    inviteDrop: "Zaproszenie",
    pullUpTitle: "Wbijaj do pokoju",
    roomCodeLabel: "Kod pokoju",
    invalidInviteCode: "Ten kod jest nieprawidłowy. Sprawdź zaproszenie i spróbuj ponownie.",
    alreadySeatInParty: "Masz już miejsce w tym pokoju.",
    alreadyInOtherParty: (code) =>
      `Jesteś już w pokoju ${code}. Opuść go przed dołączeniem tutaj.`,
    connectedDot: "Połączono.",
    reconnectingPaused: "Ponowne łączenie; opuszczanie wstrzymane.",
    returnToCurrentParty: "Wróć do obecnego pokoju",
    leaveCurrentParty: "Opuść obecny pokój",
    joinNicknamePlaceholder: "Jak ekipa ma na Ciebie mówić?",
    joinSeatNote: "Samo otwarcie linku nie zajmuje miejsca. Dołączasz dopiero po wpisaniu nicku.",
    joining: "Dołączanie…",
  },
  lobby: {
    eyebrow: "Zbierz ekipę i znajdź oszusta",
    removedKicked: "Wyrzucono Cię z tego pokoju.",
    removedExpired: "Twoje zarezerwowane miejsce wygasło podczas nieobecności.",
    removedLeft: "Opuszczono ten pokój.",
    goHome: "Wróć na start",
    seatRemoved: "Miejsce usunięte",
    liveAtTable: "Przy stole",
    reconnectingShort: "Łączenie · akcje wstrzymane",
    roomCode: "Kod pokoju",
    hideCode: "Ukryj kod",
    showCode: "Pokaż kod",
    copied: "Skopiowano!",
    copyInviteLink: "Kopiuj link zaproszenia",
    copyThisLink: "Skopiuj ten link zaproszenia",
    selectableInviteLink: "Link zaproszenia do zaznaczenia",
    inviteNote: "Wrzuć ten link na czat, żeby zapełnić miejsca.",
    partySeats: "Miejsca w pokoju",
    seatNumber: (num) => `Miejsce ${num}`,
    waitingForHomie: "Czekamy na gracza…",
    hostTag: "★ Host",
    pickYourVibe: "Wybierz kolor",
    chooseYourColour: "Wybierz swój kolor",
    selectedColour: (name) => `Wybrano: ${name}`,
    occupied: "zajęty",
    selected: "wybrany",
    squadMember: "Członek ekipy",
    removePlayerAria: (name) => `Usuń gracza ${name} z pokoju`,
    bootPlayer: "Wyrzuć gracza",
    houseRules: "Zasady pokoju",
    settings: "Ustawienia",
    hostOnly: "Tylko host",
    visibility: "Widoczność",
    visibilityAria: "Widoczność pokoju",
    visibilityPrivateDesc: "Dołączyć mogą tylko osoby z linkiem.",
    visibilityPublicDesc: "Twój pokój pojawia się na liście publicznej.",
    privateLabel: "Prywatny",
    publicLabel: "Publiczny",
    questionReveal: "Odkrycie pytania",
    questionRevealAria: "Czas odkrycia pytania",
    questionRevealDesc: "Wybierz, kiedy w rundzie pojawi się prawdziwe pytanie.",
    everyoneReady: "Gdy wszyscy gotowi",
    after8Seconds: "Automatycznie",
    answerTime: "Czas na odpowiedź",
    answerTimeAria: "Limit czasu na odpowiedź",
    answerTimeDesc: "Ile czasu mają gracze na wpisanie odpowiedzi.",
    answerTimeOff: "Bez limitu",
    answerTimeSeconds: (seconds: number) => `${seconds} s`,
    roundCount: "Liczba rund",
    roundCountAria: "Liczba rund",
    roundCountDesc: "Ile rund trwa jedna gra.",
    scoreBadge: (points: number) => `${points} pkt`,
    generalSettings: "Ogólne",
    advancedSettings: "Ustawienia zaawansowane",
    voiceSynthesizer: "Syntezator mowy",
    voiceSynthesizerDesc: "Czyta na głos odpowiedzi i prawdziwe pytanie.",
    spicyMode: "Tryb pikantny (18+)",
    spicyModeAria: "Tryb pikantny",
    spicyOnDesc: "Zawiera odważniejsze i dorosłe pytania.",
    spicyOffDesc: "Trzyma wbudowane pytania w bezpiecznym klimacie.",
    spicyOff: "Wył.",
    spicyOn: "Wł.",
    gameLanguage: "Język gry",
    gameLanguageAria: "Język gry",
    gameLanguageDesc: "Język wbudowanych pytań podczas rund.",
    topicsLabel: "Tematy",
    topicsDescription: "Wybierz tematy wbudowanych pytań. Co najmniej jeden musi pozostać aktywny.",
    topics: {
      animals: "Zwierzęta",
      movies_tv: "Filmy i seriale",
      games: "Gry",
      music: "Muzyka",
      friends: "Znajomi",
      superpowers: "Supermoce",
      food_places: "Jedzenie i miejsca",
      everyday: "Codzienność",
      pop_life: "Popkultura i życie",
    },
    kickConfirm: (name) => `Usunąć gracza ${name} z tego pokoju?`,
    privateRoom: "Pokój prywatny",
    publicRoom: "Pokój publiczny",
    waitingRoom: "Poczekalnia",
    hostedBy: (name, count) => `Host: ${name} · ${count}/8 graczy`,
    aPlayer: "gracz",
    reconnectingNotice: "Ponowne łączenie z pokojem. Akcje są wstrzymane do powrotu połączenia.",
    roundCancelled: (name) =>
      `Runda zakończyła się, ponieważ ${name} wyszedł. Wszyscy wrócili do lobby.`,
    whosAtTable: "Kto jest przy stole",
    squad: "Ekipa",
    youAreHost: "★ Jesteś hostem",
    offlineGraceNote: "Gracze offline zachowują miejsce i kolor przez 60 sekund na powrót.",
    startRound: "Rozpocznij rundę",
    footerTagline: "Strzeż swojego pytania jak oka w głowie.",
    invalidPartyCode: "Ten kod pokoju jest nieprawidłowy.",
    enterCodeFromHome: "Wpisz kod na stronie głównej.",
    loadingParty: "Ładowanie pokoju…",
    oneSeatPerGuest: "Jedno miejsce na gracza",
    alreadyInParty: "Jesteś już w pokoju",
    alreadyInPartyBody: (code) =>
      `Obecnie jesteś w pokoju ${code}. Opuść go przed wejściem tutaj.`,
    leaving: "Opuszczanie…",
    reconnectToLeave: "Połącz ponownie, aby wyjść",
    joinThisParty: "Dołącz do tego pokoju",
    inviteRequired: "Wymagane zaproszenie",
    notInParty: "Nie jesteś w tym pokoju",
    notInPartyBody: "Wybierz nick i dołącz, aby zająć wolne miejsce.",
    joinParty: "Dołącz do pokoju",
    couldNotLoadParty: "Nie udało się wczytać tego pokoju.",
  },
  round: {
    phases: {
      answering: "Tajne pytanie",
      answers: "Ujawnienie odpowiedzi",
      question: "Przesłuchanie",
      voting: "Głosowanie",
      results: "Wielki finał",
    },
    impostorBadge: "IMPOSTOR",
    answerUnavailable: "Odpowiedź niedostępna.",
    flipsIn: (seconds) => (seconds === 1 ? "Odkrycie za 1 s" : `Odkrycie za ${seconds} s`),
    votedForAria: (name) => `Głosy na ${name}`,
    votedForTitle: (voter, target) => `${voter} zagłosował(a) na ${target}`,
    noVotes: "Brak głosów",
    sharedQuestionAria: "Wspólne pytanie",
    theRealQuestion: "Prawdziwe pytanie",
    roundUnavailable: "Runda niedostępna",
    noActiveRound: "Brak aktywnej rundy",
    noActiveRoundBody: "Nic się teraz nie dzieje. Poczekaj na hosta albo wróć na stronę główną.",
    lockedInProgress: (done, total) => `${done}/${total} gotowych`,
    questionInProgress: (seconds) => `Pytanie za ${seconds}s`,
    readyProgress: (done, total) => `${done}/${total} gotowych`,
    votedProgress: (done, total) => `${done}/${total} zagłosowało`,
    revealQuestion: "Odkryj pytanie",
    readyToVote: "Gotów do głosowania",
    answerSubmitted: "Wysłano odpowiedź",
    waiting: "Szykuje odpowiedź...",
    eyebrowAnswers: "Tylko odpowiedzi",
    eyebrowQuestion: "Porównajcie odpowiedzi",
    eyebrowVoting: "Tajne głosowanie",
    eyebrowResults: "Wielki finał",
    titleVoting: "Wskaż podejrzanego",
    titleResults: "Wszystkie odpowiedzi i głosy",
    titleDefault: "Co napisała ekipa",
    roundLabel: (num, phaseName) => `Runda ${num} · ${phaseName}`,
    answerProgressAria: "Postęp odpowiedzi graczy",
    eyesOnly: "Tylko dla Twoich oczu · nie zdradzaj pytania",
    spicyQuestionBadge: "Pikantne pytanie",
    promptLive: "Twoje pytanie jest gotowe. Zachowuj się naturalnie.",
    shufflingCard: "Tasowanie Twojej tajnej karty…",
    yourAnswer: "Twoja odpowiedź",
    answerPlaceholder: "Wpisz krótką, wiarygodną odpowiedź...",
    answerHelp: "Jedno zwięzłe zdanie. Odświeżenie zachowuje tylko wysłaną odpowiedź.",
    answerLocked: "Odpowiedź wysłana!",
    submitAnswer: "Wyślij odpowiedź",
    answerLockedStatus: "Odpowiedź zapisana! Czekamy na resztę ekipy.",
    editAnswer: "Odblokuj i zmień",
    answerTimerLeft: (seconds: number) => `Zostało ${seconds} s`,
    leaderboard: "Tabela wyników",
    pointsEarned: (points: number) => `+${points}`,
    answersHiddenNote: "Cii! Twoja odpowiedź pozostaje ukryta, dopóki wszyscy nie odpowiedzą.",
    caughtIn4K: "Złapany na gorącym uczynku!",
    caseClosed: "Sprawa zamknięta",
    impostorWas: (name) => `IMPOSTOREM BYŁ(A) ${name}!`,
    impostorNotIdentified: "NIE WYKRYTO IMPOSTORA!",
    impostorsQuestionAria: "Pytanie impostora",
    impostorsQuestion: "Pytanie impostora",
    autoFlipNote: "Prawdziwe pytanie odkryje się automatycznie.",
    flippingNow: "Odkrywamy prawdziwe pytanie…",
    realQuestionDropsIn: (seconds) => `Prawdziwe pytanie za ${seconds} s…`,
    noButtonNeeded: "Poczekaj na odliczanie.",
    cardsFlipping: "Karty odkrywają się po kolei...",
    readyForRealQuestion: "Gotowość na prawdziwe pytanie zgłoszona!",
    flipTogetherPrompt: "Gdy wszyscy przeczytają odpowiedzi, odkryjcie prawdziwe pytanie.",
    notReady: "Cofnij gotowość",
    lockedInForVoting: "Gotowość do głosowania zgłoszona!",
    roastAnswersPrompt: "Przepytujcie się nawzajem i kliknijcie gotowość, gdy przyjdzie czas głosować.",
    voteLockedIn: "Głos oddany!",
    taggedAsSus: (name) => `Oznaczono gracza ${name} jako podejrzanego. Czekamy na ekipę…`,
    yourSelectedPlayer: "wybranego gracza",
    selectedAsSus: (name) => `Wybrano ${name} jako podejrzanego`,
    playerGeneric: "gracza",
    tapAnswerToPick: "Kliknij kartę odpowiedzi, aby wskazać podejrzanego.",
    lockInVote: "Zatwierdź głos",
    impostorCantVote: "Jesteś impostorem. Czekaj spokojnie, aż reszta zagłosuje!",
    votesLockIn: (seconds: number) => `Wszyscy zagłosowali! Blokada za ${seconds} s...`,
    allCardsFlipped: "Wszystkie karty odkryte!",
    flippingCardOf: (current, total) => `Odkrywanie karty ${current} z ${total}…`,
    readyForRealQ: "Gotowi na prawdziwe pytanie",
    oneCardPerSec: "1 karta / 2 s",
    votingInstruction: "Wybierz gracza, który Twoim zdaniem miał inne pytanie, i zatwierdź głos.",
    skipRerollRound: "Pomiń / Nowa runda",
    rerollVote: (votes, needed) => `Zmień pytanie (${votes}/${needed})`,
    rerollVoted: (votes, needed) => `Chcesz zmiany (${votes}/${needed})`,
    nextRound: "Następna runda",
    backToLobby: "Powrót do lobby",
  },
};

const es: TranslationStrings = {
  common: {
    brand: "Impostor Party",
    languageLabel: "Idioma",
    voiceOn: "Voz sí",
    voiceOff: "Voz no",
    tryAgain: "Intentar de nuevo",
    retry: "Reintentar",
    retryConnection: "Reintentar conexión",
    leaveParty: "Salir de la sala",
    backToHome: "Volver al inicio",
    home: "Inicio",
    dismiss: "Cerrar",
    dismissError: "Cerrar error",
    youSuffix: " (tú)",
    online: "En línea",
    offline: "Desconectado",
  },
  home: {
    eyebrow: "3–6 amigos · 1 pregunta falsa",
    enterName: "Escribe tu nombre para continuar.",
    nameMaxLength: "El nombre puede tener hasta 20 caracteres.",
    invalidCode: "Introduce un código de sala válido de seis caracteres.",
    removedKicked: "Te expulsaron de tu sala anterior.",
    removedExpired: "Tu lugar en la sala anterior expiró.",
    removedLeft: "Saliste de tu sala anterior.",
    seatSaved: "Lugar guardado",
    partyTitle: (code) => `Sala ${code}`,
    returnCardCopy: "Vuelve a tu sala o sal de ella antes de unirte a otro grupo.",
    partyConnected: "Conexión a la sala activa.",
    partyReconnecting: "Reconectando a tu sala; salir está en pausa.",
    returnToParty: "Volver a la sala",
    heroEyebrow: "DESCUBRE AL FALSO",
    heroTitleLine1: "Lee el ambiente.",
    heroTitleLine2: "¿Quién miente?",
    heroBody:
      "Todos responden una pregunta secreta. Alguien recibe una ligeramente distinta. Búrlense de las respuestas, no confíen en nadie y voten al impostor.",
    factHomies: "amigos en la mesa",
    factOddPrompt: "pregunta rara",
    factChill: "piedad",
    demoAriaLabel: "Par de preguntas de ejemplo, fuera del mazo en vivo",
    demoHeading: "Ronda demo · fuera del mazo",
    demoSusCount: "1 pregunta rara",
    demoMostHomies: "La mayoría",
    demoExampleNormal: "¿Qué snack metes a escondidas al cine?",
    demoNormalStamp: "Pregunta normal",
    demoTheImpostor: "El impostor",
    demoExampleSus: "¿Qué snack comerías a las 3 AM sobre el fregadero?",
    demoSusStamp: "Pregunta falsa",
    demoFooter: "Misma vibra. Distinta pregunta. Paranoia instantánea.",
    createEyebrow: "01 / Crea el caos",
    createTitle: "Crear sala",
    hostBadge: "Anfitrión",
    yourNickname: "Tu apodo",
    nicknamePlaceholder: "ej. ElSospechoso",
    whoCanFindIt: "¿Quién puede verla?",
    visibilityPrivateOption: "Privada (solo con invitación)",
    visibilityPublicOption: "Pública (mostrar en lista)",
    creatingRoom: "Creando…",
    createButton: "Crear sala",
    joinEyebrow: "02 / Toma asiento",
    joinTitle: "Unirse a una sala",
    sixChars: "6 car.",
    joinCopy: "¿Tienes un código del chat grupal? Escríbelo aquí o abre su enlace.",
    partyCode: "Código de sala",
    letMeIn: "Entrar",
    publicEyebrow: "Amigos en línea",
    publicTitle: "Salas públicas",
    liveCount: (count) => `${count} activas`,
    refresh: "Actualizar",
    gettingSeatReady: "Preparando tu asiento…",
    scoutingLobbies: "Buscando salas abiertas…",
    couldNotLoadParties: (error) => `No se pudieron cargar las salas públicas: ${error}`,
    noPublicParties: "No hay salas públicas con lugar ahora. Crea una o usa un código.",
    hostRoom: (hostName) => `Sala de ${hostName}`,
    roomMeta: (code, playerCount, maxPlayers) => `${code} · ${playerCount}/${maxPlayers} amigos`,
    returnShort: "Volver",
    leavePartyFirst: "Sal primero de tu sala",
    join: "Unirse",
    publicDisclaimer: "Las salas públicas solo muestran lobbies con lugar. Las privadas nunca aparecen aquí.",
    footerLeft: "Una pregunta falsa. Cero coartadas.",
    footerRight: "Las salas privadas no aparecen en la lista.",
    questionsButton: "Preguntas y temas",
  },
  questions: {
    eyebrow: "Explorador de preguntas y temas",
    title: "Todas las preguntas y temas",
    backToHome: "Volver al inicio",
    topicsHeading: "Temas",
    allTopics: "Todos los temas",
    allLanguages: "Todos los idiomas",
    allPools: "Todos los grupos",
    allAngles: "Todos los ángulos",
    allSpicy: "Normales y 18+",
    friendlyOnly: "Solo normales",
    spicyOnly: "Solo 18+",
    searchPlaceholder: "Buscar preguntas o ID...",
    shownCount: (shown, total) => `${shown} / ${total} mostradas`,
    friendlyCombos: (count) => `${count} pares normales`,
    spicyCombos: (count) => `${count} pares picantes`,
    loading: "Cargando preguntas...",
    noMatches: "Ninguna pregunta coincide con los filtros.",
    prevPage: "Anterior",
    nextPage: "Siguiente",
    pageOf: (page, totalPages) => `Página ${page} de ${totalPages}`,
    suggestButton: "Sugerir pregunta",
    suggestTitle: "Buzón de sugerencias",
    suggestPlaceholder: "Escribe una pregunta corta y clara (8–140 caracteres)...",
    suggestSpicy: "18+ Picante",
    suggestSubmit: "Enviar sugerencia",
    suggestSuccess: "¡Gracias! Tu pregunta se envió para revisión.",
    adminButton: "Moderación",
    adminTokenPlaceholder: "Token de admin...",
    adminLoad: "Cargar",
    adminApprove: "Aprobar",
    adminReject: "Rechazar",
    adminEmpty: "No hay sugerencias en esta cola.",
  },
  join: {
    inviteDrop: "Invitación",
    pullUpTitle: "Únete a la sala",
    roomCodeLabel: "Código de sala",
    invalidInviteCode: "Ese código no es válido. Revisa la invitación e inténtalo de nuevo.",
    alreadySeatInParty: "Ya tienes un lugar en esta sala.",
    alreadyInOtherParty: (code) =>
      `Ya estás en la sala ${code}. Sal de ella antes de unirte a esta.`,
    connectedDot: "Conectado.",
    reconnectingPaused: "Reconectando; salir está en pausa.",
    returnToCurrentParty: "Volver a la sala actual",
    leaveCurrentParty: "Salir de la sala actual",
    joinNicknamePlaceholder: "¿Cómo debería llamarte el grupo?",
    joinSeatNote: "Abrir una invitación no ocupa un lugar. Te unes al elegir un nombre y entrar.",
    joining: "Entrando…",
  },
  lobby: {
    eyebrow: "Reúne al grupo y descubre al falso",
    removedKicked: "Te expulsaron de esta sala.",
    removedExpired: "Tu lugar reservado expiró mientras no estabas.",
    removedLeft: "Saliste de esta sala.",
    goHome: "Ir al inicio",
    seatRemoved: "Lugar eliminado",
    liveAtTable: "En la mesa",
    reconnectingShort: "Reconectando · acciones en pausa",
    roomCode: "Código de sala",
    hideCode: "Ocultar código",
    showCode: "Mostrar código",
    copied: "¡Copiado!",
    copyInviteLink: "Copiar enlace",
    copyThisLink: "Copia este enlace de invitación",
    selectableInviteLink: "Enlace de invitación seleccionable",
    inviteNote: "Pasa este enlace al chat para llenar los asientos.",
    partySeats: "Asientos de la sala",
    seatNumber: (num) => `Asiento ${num}`,
    waitingForHomie: "Esperando jugador…",
    hostTag: "★ Anfitrión",
    pickYourVibe: "Elige tu estilo",
    chooseYourColour: "Elige tu color",
    selectedColour: (name) => `Seleccionado: ${name}`,
    occupied: "ocupado",
    selected: "seleccionado",
    squadMember: "Miembro del grupo",
    removePlayerAria: (name) => `Expulsar a ${name} de la sala`,
    bootPlayer: "Expulsar",
    houseRules: "Reglas de la casa",
    settings: "Ajustes",
    hostOnly: "Solo anfitrión",
    visibility: "Visibilidad",
    visibilityAria: "Visibilidad de la sala",
    visibilityPrivateDesc: "Solo pueden unirse quienes tengan el enlace.",
    visibilityPublicDesc: "Tu sala abierta aparece en la lista pública.",
    privateLabel: "Privada",
    publicLabel: "Pública",
    questionReveal: "Revelar pregunta",
    questionRevealAria: "Momento de revelar pregunta",
    questionRevealDesc: "Elige cómo se revela la pregunta real más adelante en la ronda.",
    everyoneReady: "Cuando todos estén listos",
    after8Seconds: "Automático",
    answerTime: "Tiempo para responder",
    answerTimeAria: "Duración del tiempo para responder",
    answerTimeDesc: "Cuánto tiempo tienen los jugadores para escribir su respuesta.",
    answerTimeOff: "Sin límite",
    answerTimeSeconds: (seconds: number) => `${seconds} s`,
    roundCount: "Rondas",
    roundCountAria: "Número de rondas",
    roundCountDesc: "Cuántas rondas se juegan por partida.",
    scoreBadge: (points: number) => `${points} pts`,
    generalSettings: "General",
    advancedSettings: "Ajustes avanzados",
    voiceSynthesizer: "Sintetizador de voz",
    voiceSynthesizerDesc: "Lee en voz alta las respuestas y la pregunta real.",
    spicyMode: "Modo picante (18+)",
    spicyModeAria: "Modo picante",
    spicyOnDesc: "Incluye preguntas atrevidas y para adultos.",
    spicyOffDesc: "Mantiene las preguntas aptas para todos.",
    spicyOff: "No",
    spicyOn: "Sí",
    gameLanguage: "Idioma del juego",
    gameLanguageAria: "Idioma del juego",
    gameLanguageDesc: "Idioma usado para las preguntas integradas en las rondas.",
    topicsLabel: "Temas",
    topicsDescription: "Elige qué temas de preguntas integradas pueden salir. Al menos uno debe seguir activo.",
    topics: {
      animals: "Animales",
      movies_tv: "Cine y TV",
      games: "Juegos",
      music: "Música",
      friends: "Amigos",
      superpowers: "Superpoderes",
      food_places: "Comida y lugares",
      everyday: "Día a día",
      pop_life: "Pop y vida",
    },
    kickConfirm: (name) => `¿Expulsar a ${name} de esta sala?`,
    privateRoom: "Sala privada",
    publicRoom: "Sala pública",
    waitingRoom: "Sala de espera",
    hostedBy: (name, count) => `Anfitrión: ${name} · ${count}/8 jugadores`,
    aPlayer: "un jugador",
    reconnectingNotice: "Reconectando a tu sala. Las acciones están en pausa hasta que vuelva la conexión.",
    roundCancelled: (name) =>
      `La ronda terminó porque ${name} salió. Todos están de vuelta en la sala.`,
    whosAtTable: "Quién está en la mesa",
    squad: "Grupo",
    youAreHost: "★ Eres anfitrión",
    offlineGraceNote: "Quienes se desconecten conservan su asiento y color 60 segundos para volver.",
    startRound: "Iniciar ronda",
    footerTagline: "Protege tu pregunta con tu vida.",
    invalidPartyCode: "Ese código de sala no es válido.",
    enterCodeFromHome: "Introduce un código desde la página de inicio.",
    loadingParty: "Cargando tu sala…",
    oneSeatPerGuest: "Un asiento por jugador",
    alreadyInParty: "Ya estás en una sala",
    alreadyInPartyBody: (code) =>
      `Actualmente estás en la sala ${code}. Sal de ella antes de abrir esta.`,
    leaving: "Saliendo…",
    reconnectToLeave: "Reconecta para salir",
    joinThisParty: "Unirse a esta sala",
    inviteRequired: "Se requiere invitación",
    notInParty: "No estás en esta sala",
    notInPartyBody: "Elige un nombre y únete para ocupar un asiento libre.",
    joinParty: "Unirse a la sala",
    couldNotLoadParty: "No se pudo cargar esta sala.",
  },
  round: {
    phases: {
      answering: "Pregunta secreta",
      answers: "Respuestas",
      question: "Interrogatorio",
      voting: "Votación",
      results: "La gran revelación",
    },
    impostorBadge: "IMPOSTOR",
    answerUnavailable: "Respuesta no disponible.",
    flipsIn: (seconds) => (seconds === 1 ? "Se gira en 1 s" : `Se gira en ${seconds} s`),
    votedForAria: (name) => `Votaron por ${name}`,
    votedForTitle: (voter, target) => `${voter} votó por ${target}`,
    noVotes: "Sin votos",
    sharedQuestionAria: "La pregunta compartida",
    theRealQuestion: "La pregunta real",
    roundUnavailable: "Ronda no disponible",
    noActiveRound: "Sin ronda activa",
    noActiveRoundBody: "No hay nada en marcha ahora. Espera al anfitrión o vuelve al inicio.",
    lockedInProgress: (done, total) => `${done}/${total} listos`,
    questionInProgress: (seconds) => `Pregunta en ${seconds}s`,
    readyProgress: (done, total) => `${done}/${total} listos`,
    votedProgress: (done, total) => `${done}/${total} votaron`,
    revealQuestion: "Revelar pregunta",
    readyToVote: "Listo para votar",
    answerSubmitted: "Respuesta enviada",
    waiting: "Cocinando respuesta...",
    eyebrowAnswers: "Solo respuestas",
    eyebrowQuestion: "Comparar respuestas",
    eyebrowVoting: "Voto secreto",
    eyebrowResults: "La gran revelación",
    titleVoting: "Toca quién parece sospechoso",
    titleResults: "Cada respuesta y voto",
    titleDefault: "Lo que dijo el grupo",
    roundLabel: (num, phaseName) => `Ronda ${num} · ${phaseName}`,
    answerProgressAria: "Progreso de respuestas por jugador",
    eyesOnly: "Solo para tus ojos · mantén tu pregunta en secreto",
    spicyQuestionBadge: "Pregunta picante",
    promptLive: "¡Tu pregunta está activa. Actúa normal!",
    shufflingCard: "Barajando tu carta secreta…",
    yourAnswer: "Tu respuesta",
    answerPlaceholder: "Escribe una respuesta corta y creíble...",
    answerHelp: "Una frase directa. Recargar solo conserva una respuesta enviada.",
    answerLocked: "¡Respuesta enviada!",
    submitAnswer: "Enviar respuesta",
    answerLockedStatus: "¡Respuesta guardada! Esperando al resto del grupo.",
    editAnswer: "Desbloquear y editar",
    answerTimerLeft: (seconds: number) => `Quedan ${seconds} s`,
    leaderboard: "Puntuación",
    pointsEarned: (points: number) => `+${points}`,
    answersHiddenNote: "¡Shhh! Tu respuesta sigue oculta hasta que todos respondan.",
    caughtIn4K: "¡Pillado en 4K!",
    caseClosed: "Caso cerrado",
    impostorWas: (name) => `¡EL IMPOSTOR ERA ${name}!`,
    impostorNotIdentified: "¡IMPOSTOR NO IDENTIFICADO!",
    impostorsQuestionAria: "La pregunta del impostor",
    impostorsQuestion: "Pregunta del impostor",
    autoFlipNote: "La pregunta real se revelará automáticamente.",
    flippingNow: "Revelando la pregunta real ahora…",
    realQuestionDropsIn: (seconds) => `La pregunta real sale en ${seconds} s…`,
    noButtonNeeded: "Espera el temporizador.",
    cardsFlipping: "Las cartas se revelan una por una...",
    readyForRealQuestion: "¡Listo para ver la pregunta real!",
    flipTogetherPrompt: "Cuando todos lean las respuestas, revelen la pregunta real juntos.",
    notReady: "No listo",
    lockedInForVoting: "¡Listo para votar!",
    roastAnswersPrompt: "Búrlense de las respuestas, interroguen al grupo y pulsen listo para votar.",
    voteLockedIn: "¡Voto confirmado!",
    taggedAsSus: (name) => `Marcaste a ${name} como sospechoso. Esperando al grupo…`,
    yourSelectedPlayer: "tu jugador seleccionado",
    selectedAsSus: (name) => `Seleccionaste a ${name} como sospechoso`,
    playerGeneric: "jugador",
    tapAnswerToPick: "Toca una tarjeta de respuesta para elegir al sospechoso.",
    lockInVote: "Confirmar voto",
    impostorCantVote: "Eres el impostor. ¡Espera mientras los demás votan!",
    votesLockIn: (seconds: number) => `¡Todos votaron! Se cierra en ${seconds} s...`,
    allCardsFlipped: "¡Todas las cartas reveladas!",
    flippingCardOf: (current, total) => `Revelando carta ${current} de ${total}…`,
    readyForRealQ: "Listos para la pregunta real",
    oneCardPerSec: "1 carta / 2 seg",
    votingInstruction: "Elige al jugador que crees que tuvo la pregunta falsa y confirma tu voto.",
    skipRerollRound: "Saltar / Repetir ronda",
    rerollVote: (votes, needed) => `Cambiar pregunta (${votes}/${needed})`,
    rerollVoted: (votes, needed) => `Votado cambiar (${votes}/${needed})`,
    nextRound: "Siguiente ronda",
    backToLobby: "Volver al lobby",
  },
};

const de: TranslationStrings = {
  common: {
    brand: "Impostor Party",
    languageLabel: "Sprache",
    voiceOn: "Stimme an",
    voiceOff: "Stimme aus",
    tryAgain: "Erneut versuchen",
    retry: "Wiederholen",
    retryConnection: "Verbindung wiederholen",
    leaveParty: "Raum verlassen",
    backToHome: "Zur Startseite",
    home: "Start",
    dismiss: "Schließen",
    dismissError: "Fehler schließen",
    youSuffix: " (du)",
    online: "Online",
    offline: "Offline",
  },
  home: {
    eyebrow: "3–6 Leute · 1 verdächtige Frage",
    enterName: "Gib deinen Namen ein, um fortzufahren.",
    nameMaxLength: "Namen dürfen maximal 20 Zeichen lang sein.",
    invalidCode: "Gib einen gültigen sechsstelligen Raumcode ein.",
    removedKicked: "Du wurdest aus deinem vorherigen Raum entfernt.",
    removedExpired: "Dein Platz im vorherigen Raum ist abgelaufen.",
    removedLeft: "Du hast deinen vorherigen Raum verlassen.",
    seatSaved: "Platz gespeichert",
    partyTitle: (code) => `Raum ${code}`,
    returnCardCopy: "Spring zurück in deinen Raum oder verlasse ihn, bevor du woanders beitrittst.",
    partyConnected: "Raumverbindung aktiv.",
    partyReconnecting: "Verbindung wird wiederhergestellt; Verlassen pausiert.",
    returnToParty: "Zurück zum Raum",
    heroEyebrow: "FINDE DEN FAKE",
    heroTitleLine1: "Lies den Raum.",
    heroTitleLine2: "Wer ist sus?",
    heroBody:
      "Alle beantworten eine geheime Frage. Eine Person bekommt eine leicht andere. Zerlegt die Antworten, traut niemandem und wählt den Impostor raus.",
    factHomies: "Leute am Tisch",
    factOddPrompt: "andere Frage",
    factChill: "Gnade",
    demoAriaLabel: "Beispiel-Fragenpaar, nicht im aktiven Deck",
    demoHeading: "Demo-Runde · nicht im Deck",
    demoSusCount: "1 verdächtige Frage",
    demoMostHomies: "Die meisten",
    demoExampleNormal: "Welchen Snack schmuggelst du ins Kino?",
    demoNormalStamp: "Normale Frage",
    demoTheImpostor: "Der Impostor",
    demoExampleSus: "Welchen Snack isst du um 3 Uhr nachts über der Spüle?",
    demoSusStamp: "Verdächtige Frage",
    demoFooter: "Gleicher Vibe. Andere Frage. Sofortige Paranoia.",
    createEyebrow: "01 / Chaos starten",
    createTitle: "Raum erstellen",
    hostBadge: "Host",
    yourNickname: "Dein Spitzname",
    nicknamePlaceholder: "z. B. BluffMeister",
    whoCanFindIt: "Wer darf ihn sehen?",
    visibilityPrivateOption: "Privat (nur per Einladung)",
    visibilityPublicOption: "Öffentlich (in der Liste zeigen)",
    creatingRoom: "Wird erstellt…",
    createButton: "Raum erstellen",
    joinEyebrow: "02 / Platz nehmen",
    joinTitle: "Raum beitreten",
    sixChars: "6 Zeichen",
    joinCopy: "Raumcode aus dem Gruppenchat bekommen? Gib ihn ein oder öffne den Einladungslink.",
    partyCode: "Raumcode",
    letMeIn: "Rein da",
    publicEyebrow: "Spieler online",
    publicTitle: "Öffentliche Räume",
    liveCount: (count) => `${count} aktiv`,
    refresh: "Aktualisieren",
    gettingSeatReady: "Dein Gästeplatz wird vorbereitet…",
    scoutingLobbies: "Suche nach offenen Lobbys…",
    couldNotLoadParties: (error) => `Öffentliche Räume konnten nicht geladen werden: ${error}`,
    noPublicParties: "Gerade hat kein öffentlicher Raum freie Plätze. Erstelle einen oder nutze einen Code.",
    hostRoom: (hostName) => `Raum von ${hostName}`,
    roomMeta: (code, playerCount, maxPlayers) => `${code} · ${playerCount}/${maxPlayers} Leute`,
    returnShort: "Zurück",
    leavePartyFirst: "Erst aktuellen Raum verlassen",
    join: "Beitreten",
    publicDisclaimer: "Öffentliche Räume zeigen nur Lobbys mit freien Plätzen. Private Räume erscheinen hier nie.",
    footerLeft: "Eine verdächtige Frage. Null Alibis.",
    footerRight: "Private Räume bleiben unsichtbar.",
    questionsButton: "Fragen & Themen",
  },
  questions: {
    eyebrow: "Fragen- & Themenübersicht",
    title: "Alle Fragen & Themen",
    backToHome: "Zurück zur Startseite",
    topicsHeading: "Themen",
    allTopics: "Alle Themen",
    allLanguages: "Alle Sprachen",
    allPools: "Alle Pools",
    allAngles: "Alle Typen",
    allSpicy: "Normal & 18+",
    friendlyOnly: "Nur normale",
    spicyOnly: "Nur 18+",
    searchPlaceholder: "Fragen oder IDs suchen...",
    shownCount: (shown, total) => `${shown} / ${total} angezeigt`,
    friendlyCombos: (count) => `${count} normale Paare`,
    spicyCombos: (count) => `${count} scharfe Paare`,
    loading: "Fragen werden geladen...",
    noMatches: "Keine Fragen entsprechen den Filtern.",
    prevPage: "Zurück",
    nextPage: "Weiter",
    pageOf: (page, totalPages) => `Seite ${page} von ${totalPages}`,
    suggestButton: "Frage vorschlagen",
    suggestTitle: "Vorschlagsbox",
    suggestPlaceholder: "Kurze, klare Frage schreiben (8–140 Zeichen)...",
    suggestSpicy: "18+ Scharf",
    suggestSubmit: "Vorschlag senden",
    suggestSuccess: "Danke! Dein Vorschlag wird geprüft.",
    adminButton: "Moderation",
    adminTokenPlaceholder: "Admin-Token...",
    adminLoad: "Laden",
    adminApprove: "Freigeben",
    adminReject: "Ablehnen",
    adminEmpty: "Keine Vorschläge in dieser Liste.",
  },
  join: {
    inviteDrop: "Einladung",
    pullUpTitle: "Ab in den Raum",
    roomCodeLabel: "Raumcode",
    invalidInviteCode: "Dieser Code ist ungültig. Prüfe die Einladung und versuche es erneut.",
    alreadySeatInParty: "Du hast in diesem Raum bereits einen Platz.",
    alreadyInOtherParty: (code) =>
      `Du bist schon in Raum ${code}. Verlasse ihn, bevor du hier beitrittst.`,
    connectedDot: "Verbunden.",
    reconnectingPaused: "Verbindung wird wiederhergestellt; Verlassen pausiert.",
    returnToCurrentParty: "Zum aktuellen Raum",
    leaveCurrentParty: "Aktuellen Raum verlassen",
    joinNicknamePlaceholder: "Wie soll dich die Runde nennen?",
    joinSeatNote: "Das Öffnen einer Einladung belegt noch keinen Platz. Du trittst erst mit deinem Namen bei.",
    joining: "Beitritt…",
  },
  lobby: {
    eyebrow: "Trommle die Runde zusammen",
    removedKicked: "Du wurdest aus diesem Raum geworfen.",
    removedExpired: "Dein reservierter Platz ist während deiner Abwesenheit abgelaufen.",
    removedLeft: "Du hast diesen Raum verlassen.",
    goHome: "Zur Startseite",
    seatRemoved: "Platz entfernt",
    liveAtTable: "Live am Tisch",
    reconnectingShort: "Verbinden · Aktionen pausiert",
    roomCode: "Raumcode",
    hideCode: "Code verbergen",
    showCode: "Code zeigen",
    copied: "Kopiert!",
    copyInviteLink: "Einladungslink kopieren",
    copyThisLink: "Diesen Einladungslink kopieren",
    selectableInviteLink: "Auswählbarer Einladungslink",
    inviteNote: "Schick diesen Link in den Gruppenchat, um die Plätze zu füllen.",
    partySeats: "Plätze im Raum",
    seatNumber: (num) => `Platz ${num}`,
    waitingForHomie: "Warte auf Mitspieler…",
    hostTag: "★ Host",
    pickYourVibe: "Wähle deinen Stil",
    chooseYourColour: "Wähle deine Farbe",
    selectedColour: (name) => `Gewählt: ${name}`,
    occupied: "belegt",
    selected: "gewählt",
    squadMember: "Mitspieler",
    removePlayerAria: (name) => `${name} aus dem Raum entfernen`,
    bootPlayer: "Rauswerfen",
    houseRules: "Hausregeln",
    settings: "Einstellungen",
    hostOnly: "Nur Host",
    visibility: "Sichtbarkeit",
    visibilityAria: "Sichtbarkeit des Raums",
    visibilityPrivateDesc: "Nur Personen mit Einladungslink können beitreten.",
    visibilityPublicDesc: "Dein offener Raum erscheint in der öffentlichen Liste.",
    privateLabel: "Privat",
    publicLabel: "Öffentlich",
    questionReveal: "Frage aufdecken",
    questionRevealAria: "Zeitpunkt für die echte Frage",
    questionRevealDesc: "Wähle, wie die normale Frage später in der Runde aufgedeckt wird.",
    everyoneReady: "Alle bereit",
    after8Seconds: "Automatisch",
    answerTime: "Antwortzeit",
    answerTimeAria: "Dauer der Antwortzeit",
    answerTimeDesc: "Wie lange Spieler Zeit haben, ihre Antwort zu schreiben.",
    answerTimeOff: "Kein Limit",
    answerTimeSeconds: (seconds: number) => `${seconds} s`,
    roundCount: "Runden",
    roundCountAria: "Anzahl der Runden",
    roundCountDesc: "Wie viele Runden pro Spiel gespielt werden.",
    scoreBadge: (points: number) => `${points} Pkt`,
    generalSettings: "Allgemein",
    advancedSettings: "Erweiterte Einstellungen",
    voiceSynthesizer: "Sprachausgabe",
    voiceSynthesizerDesc: "Liest Antworten und die echte Frage laut vor.",
    spicyMode: "Spicy-Modus (18+)",
    spicyModeAria: "Spicy-Modus",
    spicyOnDesc: "Enthält freche und erwachsenere Fragen.",
    spicyOffDesc: "Hält eingebaute Fragen für alle freundlich.",
    spicyOff: "Aus",
    spicyOn: "An",
    gameLanguage: "Spielsprache",
    gameLanguageAria: "Spielsprache",
    gameLanguageDesc: "Sprache für eingebaute Fragen in den Runden.",
    topicsLabel: "Themen",
    topicsDescription: "Wähle aus, welche eingebauten Fragenthemen vorkommen können. Mindestens eines muss aktiv bleiben.",
    topics: {
      animals: "Tiere",
      movies_tv: "Filme & Serien",
      games: "Spiele",
      music: "Musik",
      friends: "Freunde",
      superpowers: "Superkräfte",
      food_places: "Essen & Orte",
      everyday: "Alltag",
      pop_life: "Pop & Leben",
    },
    kickConfirm: (name) => `${name} aus diesem Raum entfernen?`,
    privateRoom: "Privater Raum",
    publicRoom: "Öffentlicher Raum",
    waitingRoom: "Warteraum",
    hostedBy: (name, count) => `Host: ${name} · ${count}/8 Spieler`,
    aPlayer: "ein Spieler",
    reconnectingNotice: "Verbindung zum Raum wird wiederhergestellt. Aktionen pausieren bis dahin.",
    roundCancelled: (name) =>
      `Die Runde wurde beendet, weil ${name} gegangen ist. Alle sind zurück in der Lobby.`,
    whosAtTable: "Wer am Tisch sitzt",
    squad: "Runde",
    youAreHost: "★ Du bist Host",
    offlineGraceNote: "Offline-Spieler behalten Platz und Farbe 60 Sekunden lang zur Rückkehr.",
    startRound: "Runde starten",
    footerTagline: "Behüte deine Frage wie deinen Augapfel.",
    invalidPartyCode: "Dieser Raumcode ist ungültig.",
    enterCodeFromHome: "Gib einen Code auf der Startseite ein.",
    loadingParty: "Raum wird geladen…",
    oneSeatPerGuest: "Ein Platz pro Gast",
    alreadyInParty: "Bereits in einem Raum",
    alreadyInPartyBody: (code) =>
      `Du bist aktuell in Raum ${code}. Verlasse ihn, bevor du diesen Raum öffnest.`,
    leaving: "Verlassen…",
    reconnectToLeave: "Zum Verlassen neu verbinden",
    joinThisParty: "Diesem Raum beitreten",
    inviteRequired: "Einladung erforderlich",
    notInParty: "Du bist nicht in diesem Raum",
    notInPartyBody: "Wähle einen Namen und tritt bei, um einen freien Platz zu nehmen.",
    joinParty: "Raum beitreten",
    couldNotLoadParty: "Dieser Raum konnte nicht geladen werden.",
  },
  round: {
    phases: {
      answering: "Geheime Frage",
      answers: "Antworten",
      question: "Verhör",
      voting: "Abstimmung",
      results: "Die Auflösung",
    },
    impostorBadge: "IMPOSTOR",
    answerUnavailable: "Antwort nicht verfügbar.",
    flipsIn: (seconds) => (seconds === 1 ? "Deckt in 1 Sek. auf" : `Deckt in ${seconds} Sek. auf`),
    votedForAria: (name) => `Stimmen für ${name}`,
    votedForTitle: (voter, target) => `${voter} hat für ${target} gestimmt`,
    noVotes: "Keine Stimmen",
    sharedQuestionAria: "Die gemeinsame Frage",
    theRealQuestion: "Die echte Frage",
    roundUnavailable: "Runde nicht verfügbar",
    noActiveRound: "Keine aktive Runde",
    noActiveRoundBody: "Gerade läuft nichts. Warte auf den Host oder geh zurück zur Startseite.",
    lockedInProgress: (done, total) => `${done}/${total} fertig`,
    questionInProgress: (seconds) => `Frage in ${seconds}s`,
    readyProgress: (done, total) => `${done}/${total} bereit`,
    votedProgress: (done, total) => `${done}/${total} abgestimmt`,
    revealQuestion: "Frage aufdecken",
    readyToVote: "Bereit zum Abstimmen",
    answerSubmitted: "Antwort gesendet",
    waiting: "Kocht eine Antwort...",
    eyebrowAnswers: "Nur Antworten",
    eyebrowQuestion: "Antworten vergleichen",
    eyebrowVoting: "Geheime Wahl",
    eyebrowResults: "Die Auflösung",
    titleVoting: "Tippe auf den Verdächtigen",
    titleResults: "Alle Antworten & Stimmen",
    titleDefault: "Was die Runde gesagt hat",
    roundLabel: (num, phaseName) => `Runde ${num} · ${phaseName}`,
    answerProgressAria: "Antwortfortschritt nach Spieler",
    eyesOnly: "Nur für deine Augen · halte deine Frage geheim",
    spicyQuestionBadge: "Spicy Frage",
    promptLive: "Deine Frage ist da. Bleib ganz normal.",
    shufflingCard: "Deine geheime Karte wird gemischt…",
    yourAnswer: "Deine Antwort",
    answerPlaceholder: "Schreib eine kurze, glaubwürdige Antwort...",
    answerHelp: "Halte es kurz und knackig. Neuladen behält nur eine gesendete Antwort.",
    answerLocked: "Antwort gesendet!",
    submitAnswer: "Antwort senden",
    answerLockedStatus: "Antwort gespeichert! Warte auf den Rest der Runde.",
    editAnswer: "Freigeben & ändern",
    answerTimerLeft: (seconds: number) => `Noch ${seconds} s`,
    leaderboard: "Punktestand",
    pointsEarned: (points: number) => `+${points}`,
    answersHiddenNote: "Pssst! Deine Antwort bleibt verborgen, bis alle geantwortet haben.",
    caughtIn4K: "In 4K erwischt!",
    caseClosed: "Fall abgeschlossen",
    impostorWas: (name) => `IMPOSTOR WAR ${name}!`,
    impostorNotIdentified: "IMPOSTOR NICHT ERKANNT!",
    impostorsQuestionAria: "Die Frage des Impostors",
    impostorsQuestion: "Frage des Impostors",
    autoFlipNote: "Die echte Frage wird automatisch aufgedeckt.",
    flippingNow: "Die echte Frage wird jetzt aufgedeckt…",
    realQuestionDropsIn: (seconds) => `Echte Frage in ${seconds} Sek.…`,
    noButtonNeeded: "Kein Knopf nötig. Mach dich bereit.",
    cardsFlipping: "Karten werden nacheinander aufgedeckt...",
    readyForRealQuestion: "Du bist bereit für die echte Frage!",
    flipTogetherPrompt: "Wenn alle die Antworten gelesen haben, deckt gemeinsam die echte Frage auf.",
    notReady: "Nicht bereit",
    lockedInForVoting: "Du bist bereit für die Abstimmung!",
    roastAnswersPrompt: "Hinterfragt die Antworten, grillt eure Freunde und drückt Bereit zum Abstimmen.",
    voteLockedIn: "Stimme bestätigt!",
    taggedAsSus: (name) => `Du hast ${name} als verdächtig markiert. Warte auf die anderen…`,
    yourSelectedPlayer: "deinen gewählten Spieler",
    selectedAsSus: (name) => `${name} als verdächtig gewählt`,
    playerGeneric: "Spieler",
    tapAnswerToPick: "Tippe auf eine Antwortkarte, um jemanden zu verdächtigen.",
    lockInVote: "Stimme abgeben",
    impostorCantVote: "Du bist der Impostor. Warte, bis die anderen abgestimmt haben!",
    votesLockIn: (seconds: number) => `Alle haben gewählt! Sperre in ${seconds} s...`,
    allCardsFlipped: "Alle Karten aufgedeckt!",
    flippingCardOf: (current, total) => `Decke Karte ${current} von ${total} auf…`,
    readyForRealQ: "Bereit für die echte Frage",
    oneCardPerSec: "1 Karte / 2 Sek.",
    votingInstruction: "Wähle die Person, die vermutlich die falsche Frage hatte, und gib deine Stimme ab.",
    skipRerollRound: "Runde überspringen",
    rerollVote: (votes, needed) => `Frage neu würfeln (${votes}/${needed})`,
    rerollVoted: (votes, needed) => `Für Neu-Wurf (${votes}/${needed})`,
    nextRound: "Nächste Runde",
    backToLobby: "Zurück zur Lobby",
  },
};

const fr: TranslationStrings = {
  common: {
    brand: "Impostor Party",
    languageLabel: "Langue",
    voiceOn: "Voix on",
    voiceOff: "Voix off",
    tryAgain: "Réessayer",
    retry: "Réessayer",
    retryConnection: "Relancer la connexion",
    leaveParty: "Quitter le salon",
    backToHome: "Retour à l'accueil",
    home: "Accueil",
    dismiss: "Fermer",
    dismissError: "Fermer l'erreur",
    youSuffix: " (toi)",
    online: "En ligne",
    offline: "Hors ligne",
  },
  home: {
    eyebrow: "3–6 joueurs · 1 question louche",
    enterName: "Entre ton pseudo pour continuer.",
    nameMaxLength: "Le pseudo peut contenir jusqu'à 20 caractères.",
    invalidCode: "Entre un code de salon valide à six caractères.",
    removedKicked: "Tu as été exclu de ton salon précédent.",
    removedExpired: "Ta place dans le salon précédent a expiré.",
    removedLeft: "Tu as quitté ton salon précédent.",
    seatSaved: "Place sauvegardée",
    partyTitle: (code) => `Salon ${code}`,
    returnCardCopy: "Retourne dans ton salon ou quitte-le avant de rejoindre un autre groupe.",
    partyConnected: "Connexion au salon active.",
    partyReconnecting: "Reconnexion au salon ; le départ est en pause.",
    returnToParty: "Retourner au salon",
    heroEyebrow: "DÉMASQUE L'IMPOSTEUR",
    heroTitleLine1: "Observe le groupe.",
    heroTitleLine2: "Qui est louche ?",
    heroBody:
      "Tout le monde répond à une question secrète. Une personne en reçoit une légèrement différente. Moquez-vous des réponses, ne faites confiance à personne et votez contre l'imposteur.",
    factHomies: "joueurs à table",
    factOddPrompt: "question piège",
    factChill: "pitié",
    demoAriaLabel: "Paire de questions d'exemple, hors du jeu en direct",
    demoHeading: "Manche démo · hors paquet",
    demoSusCount: "1 question louche",
    demoMostHomies: "La majorité",
    demoExampleNormal: "Quel snack fais-tu entrer en cachette au cinéma ?",
    demoNormalStamp: "Question normale",
    demoTheImpostor: "L'imposteur",
    demoExampleSus: "Quel snack mangerais-tu à 3 h du matin au-dessus de l'évier ?",
    demoSusStamp: "Question louche",
    demoFooter: "Même ambiance. Question différente. Paranoïa immédiate.",
    createEyebrow: "01 / Lance le chaos",
    createTitle: "Créer un salon",
    hostBadge: "Hôte",
    yourNickname: "Ton pseudo",
    nicknamePlaceholder: "ex. RoiDuBluff",
    whoCanFindIt: "Qui peut le trouver ?",
    visibilityPrivateOption: "Privé (sur invitation)",
    visibilityPublicOption: "Public (visible dans la liste)",
    creatingRoom: "Création…",
    createButton: "Créer un salon",
    joinEyebrow: "02 / Prends place",
    joinTitle: "Rejoindre un salon",
    sixChars: "6 car.",
    joinCopy: "Tu as reçu un code dans la discussion ? Saisis-le ou ouvre le lien d'invitation.",
    partyCode: "Code du salon",
    letMeIn: "Entrer",
    publicEyebrow: "Joueurs en ligne",
    publicTitle: "Salons publics",
    liveCount: (count) => `${count} en ligne`,
    refresh: "Actualiser",
    gettingSeatReady: "Préparation de ta place…",
    scoutingLobbies: "Recherche de salons ouverts…",
    couldNotLoadParties: (error) => `Impossible de charger les salons publics : ${error}`,
    noPublicParties: "Aucun salon public n'a de place libre. Crée un salon ou utilise un code.",
    hostRoom: (hostName) => `Salon de ${hostName}`,
    roomMeta: (code, playerCount, maxPlayers) => `${code} · ${playerCount}/${maxPlayers} joueurs`,
    returnShort: "Revenir",
    leavePartyFirst: "Quitte d'abord ton salon",
    join: "Rejoindre",
    publicDisclaimer: "Les salons publics n'affichent que les lobbies avec des places libres. Les salons privés n'y apparaissent jamais.",
    footerLeft: "Une question louche. Zéro alibi.",
    footerRight: "Les salons privés restent invisibles.",
    questionsButton: "Questions & thèmes",
  },
  questions: {
    eyebrow: "Explorateur de questions et thèmes",
    title: "Toutes les questions et thèmes",
    backToHome: "Retour à l'accueil",
    topicsHeading: "Thèmes",
    allTopics: "Tous les thèmes",
    allLanguages: "Toutes les langues",
    allPools: "Toutes les catégories",
    allAngles: "Tous les angles",
    allSpicy: "Classiques & 18+",
    friendlyOnly: "Classiques uniquement",
    spicyOnly: "18+ uniquement",
    searchPlaceholder: "Rechercher des questions ou ID...",
    shownCount: (shown, total) => `${shown} / ${total} affichées`,
    friendlyCombos: (count) => `${count} paires classiques`,
    spicyCombos: (count) => `${count} paires 18+`,
    loading: "Chargement des questions...",
    noMatches: "Aucune question ne correspond aux filtres.",
    prevPage: "Précédent",
    nextPage: "Suivant",
    pageOf: (page, totalPages) => `Page ${page} sur ${totalPages}`,
    suggestButton: "Suggérer une question",
    suggestTitle: "Boîte à suggestions",
    suggestPlaceholder: "Écris une question courte et claire (8–140 car.)...",
    suggestSpicy: "18+ Pimenté",
    suggestSubmit: "Envoyer",
    suggestSuccess: "Merci ! Ta question a été envoyée pour validation.",
    adminButton: "Modération",
    adminTokenPlaceholder: "Jeton admin...",
    adminLoad: "Charger",
    adminApprove: "Approuver",
    adminReject: "Rejeter",
    adminEmpty: "Aucune suggestion dans cette file.",
  },
  join: {
    inviteDrop: "Invitation",
    pullUpTitle: "Rejoins le salon",
    roomCodeLabel: "Code du salon",
    invalidInviteCode: "Ce code est invalide. Vérifie l'invitation et réessaie.",
    alreadySeatInParty: "Tu as déjà une place dans ce salon.",
    alreadyInOtherParty: (code) =>
      `Tu es déjà dans le salon ${code}. Quitte-le avant de rejoindre celui-ci.`,
    connectedDot: "Connecté.",
    reconnectingPaused: "Reconnexion ; le départ est en pause.",
    returnToCurrentParty: "Retourner au salon actuel",
    leaveCurrentParty: "Quitter le salon actuel",
    joinNicknamePlaceholder: "Comment le groupe doit-il t'appeler ?",
    joinSeatNote: "Ouvrir une invitation ne prend pas de place. Tu rejoins uniquement en validant ton pseudo.",
    joining: "Connexion…",
  },
  lobby: {
    eyebrow: "Rassemble l'équipe et trouve le menteur",
    removedKicked: "Tu as été exclu de ce salon.",
    removedExpired: "Ta place réservée a expiré pendant ton absence.",
    removedLeft: "Tu as quitté ce salon.",
    goHome: "Aller à l'accueil",
    seatRemoved: "Place retirée",
    liveAtTable: "À table",
    reconnectingShort: "Reconnexion · actions en pause",
    roomCode: "Code du salon",
    hideCode: "Masquer le code",
    showCode: "Afficher le code",
    copied: "Copié !",
    copyInviteLink: "Copier le lien d'invitation",
    copyThisLink: "Copie ce lien d'invitation",
    selectableInviteLink: "Lien d'invitation sélectionnable",
    inviteNote: "Envoie ce lien dans le groupe pour remplir les places.",
    partySeats: "Places du salon",
    seatNumber: (num) => `Place ${num}`,
    waitingForHomie: "En attente d'un joueur…",
    hostTag: "★ Hôte",
    pickYourVibe: "Choisis ton style",
    chooseYourColour: "Choisis ta couleur",
    selectedColour: (name) => `Sélectionnée : ${name}`,
    occupied: "occupée",
    selected: "sélectionnée",
    squadMember: "Membre du groupe",
    removePlayerAria: (name) => `Exclure ${name} du salon`,
    bootPlayer: "Exclure",
    houseRules: "Règles du salon",
    settings: "Paramètres",
    hostOnly: "Hôte uniquement",
    visibility: "Visibilité",
    visibilityAria: "Visibilité du salon",
    visibilityPrivateDesc: "Seules les personnes ayant le lien peuvent rejoindre.",
    visibilityPublicDesc: "Ton salon ouvert apparaît dans la liste publique.",
    privateLabel: "Privé",
    publicLabel: "Public",
    questionReveal: "Révélation",
    questionRevealAria: "Moment de révélation de la question",
    questionRevealDesc: "Choisis comment la vraie question est révélée plus tard dans la manche.",
    everyoneReady: "Quand tout le monde est prêt",
    after8Seconds: "Automatique",
    answerTime: "Temps de réponse",
    answerTimeAria: "Durée du temps de réponse",
    answerTimeDesc: "Temps dont disposent les joueurs pour écrire leur réponse.",
    answerTimeOff: "Sans limite",
    answerTimeSeconds: (seconds: number) => `${seconds} s`,
    roundCount: "Manches",
    roundCountAria: "Nombre de manches",
    roundCountDesc: "Combien de manches sont jouées par partie.",
    scoreBadge: (points: number) => `${points} pts`,
    generalSettings: "Général",
    advancedSettings: "Paramètres avancés",
    voiceSynthesizer: "Synthèse vocale",
    voiceSynthesizerDesc: "Lit à voix haute les réponses et la vraie question.",
    spicyMode: "Mode piquant (18+)",
    spicyModeAria: "Mode piquant",
    spicyOnDesc: "Inclut des questions osées et pour adultes.",
    spicyOffDesc: "Garde les questions intégrées adaptées à tous.",
    spicyOff: "Désactivé",
    spicyOn: "Activé",
    gameLanguage: "Langue du jeu",
    gameLanguageAria: "Langue du jeu",
    gameLanguageDesc: "Langue utilisée pour les questions intégrées pendant les manches.",
    topicsLabel: "Thèmes",
    topicsDescription: "Choisis les thèmes de questions intégrées actifs. Au moins un thème doit rester actif.",
    topics: {
      animals: "Animaux",
      movies_tv: "Films et séries",
      games: "Jeux",
      music: "Musique",
      friends: "Amis",
      superpowers: "Superpouvoirs",
      food_places: "Cuisine et lieux",
      everyday: "Quotidien",
      pop_life: "Pop et vie",
    },
    kickConfirm: (name) => `Exclure ${name} de ce salon ?`,
    privateRoom: "Salon privé",
    publicRoom: "Salon public",
    waitingRoom: "Salle d'attente",
    hostedBy: (name, count) => `Hôte : ${name} · ${count}/8 joueurs`,
    aPlayer: "un joueur",
    reconnectingNotice: "Reconnexion au salon. Les actions sont en pause jusqu'au retour du réseau.",
    roundCancelled: (name) =>
      `La manche s'est terminée car ${name} est parti. Tout le monde est de retour au salon.`,
    whosAtTable: "Qui est à table",
    squad: "Équipe",
    youAreHost: "★ Tu es l'hôte",
    offlineGraceNote: "Les joueurs hors ligne gardent leur place et couleur 60 secondes pour revenir.",
    startRound: "Lancer la manche",
    footerTagline: "Garde ta question secrète coûte que coûte.",
    invalidPartyCode: "Ce code de salon est invalide.",
    enterCodeFromHome: "Entre un code depuis la page d'accueil.",
    loadingParty: "Chargement du salon…",
    oneSeatPerGuest: "Une place par joueur",
    alreadyInParty: "Déjà dans un salon",
    alreadyInPartyBody: (code) =>
      `Tu es actuellement dans le salon ${code}. Quitte-le avant d'ouvrir celui-ci.`,
    leaving: "Départ…",
    reconnectToLeave: "Reconnecte-toi pour quitter",
    joinThisParty: "Rejoindre ce salon",
    inviteRequired: "Invitation requise",
    notInParty: "Tu n'es pas dans ce salon",
    notInPartyBody: "Choisis un pseudo et rejoins pour prendre une place libre.",
    joinParty: "Rejoindre le salon",
    couldNotLoadParty: "Impossible de charger ce salon.",
  },
  round: {
    phases: {
      answering: "Question secrète",
      answers: "Réponses",
      question: "Interrogatoire",
      voting: "Vote secret",
      results: "Révélation finale",
    },
    impostorBadge: "IMPOSTEUR",
    answerUnavailable: "Réponse indisponible.",
    flipsIn: (seconds) => (seconds === 1 ? "Révélée dans 1 s" : `Révélée dans ${seconds} s`),
    votedForAria: (name) => `Votes contre ${name}`,
    votedForTitle: (voter, target) => `${voter} a voté contre ${target}`,
    noVotes: "Aucun vote",
    sharedQuestionAria: "La question partagée",
    theRealQuestion: "La vraie question",
    roundUnavailable: "Manche indisponible",
    noActiveRound: "Aucune manche active",
    noActiveRoundBody: "Rien en cours pour l'instant. Attends l'hôte ou retourne à l'accueil.",
    lockedInProgress: (done, total) => `${done}/${total} validés`,
    questionInProgress: (seconds) => `Question dans ${seconds}s`,
    readyProgress: (done, total) => `${done}/${total} prêts`,
    votedProgress: (done, total) => `${done}/${total} ont voté`,
    revealQuestion: "Révéler la question",
    readyToVote: "Prêt à voter",
    answerSubmitted: "Réponse envoyée",
    waiting: "Prépare sa réponse...",
    eyebrowAnswers: "Réponses seules",
    eyebrowQuestion: "Comparer les réponses",
    eyebrowVoting: "Vote secret",
    eyebrowResults: "Révélation finale",
    titleVoting: "Touche qui semble louche",
    titleResults: "Toutes les réponses & votes",
    titleDefault: "Ce que le groupe a dit",
    roundLabel: (num, phaseName) => `Manche ${num} · ${phaseName}`,
    answerProgressAria: "Progression des réponses par joueur",
    eyesOnly: "Confidentiel · garde ta question secrète",
    spicyQuestionBadge: "Question piquante",
    promptLive: "Ta question est prête. Reste naturel.",
    shufflingCard: "Mélange de ta carte secrète…",
    yourAnswer: "Ta réponse",
    answerPlaceholder: "Écris une réponse courte et crédible...",
    answerHelp: "Une phrase percutante. Recharger ne conserve qu'une réponse envoyée.",
    answerLocked: "Réponse envoyée !",
    submitAnswer: "Envoyer la réponse",
    answerLockedStatus: "Réponse enregistrée ! En attente du reste du groupe.",
    editAnswer: "Débloquer et modifier",
    answerTimerLeft: (seconds: number) => `Reste ${seconds} s`,
    leaderboard: "Classement",
    pointsEarned: (points: number) => `+${points}`,
    answersHiddenNote: "Chut ! Ta réponse reste cachée jusqu'à ce que tout le monde valide.",
    caughtIn4K: "Pris la main dans le sac !",
    caseClosed: "Affaire classée",
    impostorWas: (name) => `L'IMPOSTEUR ÉTAIT ${name} !`,
    impostorNotIdentified: "IMPOSTEUR NON IDENTIFIÉ !",
    impostorsQuestionAria: "La question de l'imposteur",
    impostorsQuestion: "Question de l'imposteur",
    autoFlipNote: "La vraie question s'affichera automatiquement.",
    flippingNow: "Affichage de la vraie question…",
    realQuestionDropsIn: (seconds) => `Vraie question dans ${seconds} s…`,
    noButtonNeeded: "Pas besoin de bouton. Préparez-vous.",
    cardsFlipping: "Les cartes se retournent une par une...",
    readyForRealQuestion: "Tu es prêt pour la vraie question !",
    flipTogetherPrompt: "Quand tout le monde a lu les réponses, révélez la vraie question ensemble.",
    notReady: "Pas prêt",
    lockedInForVoting: "Tu es prêt pour le vote !",
    roastAnswersPrompt: "Chambre les réponses, questionne tes amis et clique quand tu es prêt à voter.",
    voteLockedIn: "Vote confirmé !",
    taggedAsSus: (name) => `Tu as désigné ${name} comme suspect. En attente du groupe…`,
    yourSelectedPlayer: "le joueur choisi",
    selectedAsSus: (name) => `${name} sélectionné comme suspect`,
    playerGeneric: "joueur",
    tapAnswerToPick: "Touche une carte de réponse pour désigner le suspect.",
    lockInVote: "Confirmer le vote",
    impostorCantVote: "Tu es l'imposteur. Patiente pendant que les autres votent !",
    votesLockIn: (seconds: number) => `Tous les votes sont là ! Verrouillage dans ${seconds} s...`,
    allCardsFlipped: "Toutes les cartes sont révélées !",
    flippingCardOf: (current, total) => `Révélation de la carte ${current} sur ${total}…`,
    readyForRealQ: "Prêts pour la vraie question",
    oneCardPerSec: "1 carte / 2 sec",
    votingInstruction: "Choisis la personne qui avait selon toi la fausse question, puis confirme ton vote.",
    skipRerollRound: "Passer / Relancer",
    rerollVote: (votes, needed) => `Changer la question (${votes}/${needed})`,
    rerollVoted: (votes, needed) => `Vote pour changer (${votes}/${needed})`,
    nextRound: "Manche suivante",
    backToLobby: "Retour au salon",
  },
};

const DICTIONARIES: Record<SupportedLanguage, TranslationStrings> = {
  en,
  pl,
  es,
  de,
  fr,
};

export function getStrings(lang: SupportedLanguage): TranslationStrings {
  return DICTIONARIES[lang] ?? DICTIONARIES.en;
}
