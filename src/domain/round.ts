import { blackjackRules } from "@/domain/blackjackRules";
import { Shoe } from "@/domain/Shoe";
import { getHandValue, isPair } from "@/domain/hand";
import type {
  AllowedActions,
  Card,
  HandStatus,
  SettledHand,
} from "@/domain/types";

export interface PlayerRoundHand {
  cards: Card[];
  bet: number;
  hasDoubled: boolean;
  originatedFromSplit: boolean;
  status: HandStatus;
}

export const getAllowedActions = (
  hand: PlayerRoundHand,
  totalHands: number,
): AllowedActions => {
  const handValue = getHandValue(hand.cards);
  const canContinue = hand.status === "playing" && !handValue.isBust && handValue.total < 21;
  const isInitialTwoCardHand = hand.cards.length === 2 && !hand.hasDoubled;

  return {
    hit: canContinue,
    stand: hand.status === "playing" && !handValue.isBust,
    double:
      hand.status === "playing" &&
      isInitialTwoCardHand &&
      blackjackRules.doubleOnAnyTwoCards,
    split:
      hand.status === "playing" &&
      hand.cards.length === 2 &&
      totalHands < blackjackRules.maxHandsPerRound &&
      isPair(hand.cards),
  };
};

export const deriveHandStatus = (
  cards: Card[],
  originatedFromSplit: boolean,
  explicitlyStood = false,
): HandStatus => {
  const handValue = getHandValue(cards);

  if (handValue.isBust) {
    return "busted";
  }

  if (handValue.isBlackjack && !originatedFromSplit) {
    return "blackjack";
  }

  if (explicitlyStood || handValue.total === 21) {
    return "stood";
  }

  return "playing";
};

export const playDealerHand = (cards: Card[], shoe: Shoe): Card[] => {
  const dealerCards = [...cards];

  while (true) {
    const handValue = getHandValue(dealerCards);
    const shouldHit =
      handValue.total < 17 ||
      (!blackjackRules.dealerStandsOnSoft17 && handValue.total === 17 && handValue.isSoft);

    if (!shouldHit) {
      return dealerCards;
    }

    dealerCards.push(shoe.drawCard());
  }
};

export const settleHand = (hand: PlayerRoundHand, dealerCards: Card[]): SettledHand => {
  const playerValue = getHandValue(hand.cards);
  const dealerValue = getHandValue(dealerCards);
  const isNaturalBlackjack =
    playerValue.isBlackjack && !hand.originatedFromSplit && hand.cards.length === 2;
  const dealerHasBlackjack = dealerValue.isBlackjack;

  if (playerValue.isBust) {
    return {
      result: "loss",
      net: -hand.bet,
      summary: `Bust for ${playerValue.total}.`,
    };
  }

  if (dealerHasBlackjack && isNaturalBlackjack) {
    return {
      result: "push",
      net: 0,
      summary: "Both sides have blackjack.",
    };
  }

  if (isNaturalBlackjack) {
    return {
      result: "blackjack",
      net: hand.bet * blackjackRules.blackjackPayout,
      summary: "Blackjack pays 3:2.",
    };
  }

  if (dealerHasBlackjack) {
    return {
      result: "loss",
      net: -hand.bet,
      summary: "Dealer blackjack.",
    };
  }

  if (dealerValue.isBust) {
    return {
      result: "win",
      net: hand.bet,
      summary: `Dealer busts with ${dealerValue.total}.`,
    };
  }

  if (playerValue.total > dealerValue.total) {
    return {
      result: "win",
      net: hand.bet,
      summary: `${playerValue.total} beats dealer ${dealerValue.total}.`,
    };
  }

  if (playerValue.total < dealerValue.total) {
    return {
      result: "loss",
      net: -hand.bet,
      summary: `Dealer ${dealerValue.total} beats ${playerValue.total}.`,
    };
  }

  return {
    result: "push",
    net: 0,
    summary: `Push at ${playerValue.total}.`,
  };
};
