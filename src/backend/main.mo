import List "mo:core/List";
import Iter "mo:core/Iter";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Order "mo:core/Order";

actor {
  type ScoreEntry = {
    playerName : Text;
    score : Nat;
  };

  module ScoreEntry {
    public func compare(entry1 : ScoreEntry, entry2 : ScoreEntry) : Order.Order {
      Nat.compare(entry2.score, entry1.score);
    };
  };

  let scores = List.empty<ScoreEntry>();

  public shared ({ caller }) func saveScore(playerName : Text, score : Nat) : async () {
    let newScore : ScoreEntry = {
      playerName;
      score;
    };
    scores.add(newScore);
  };

  public query ({ caller }) func getLeaderboard() : async [ScoreEntry] {
    scores.sliceToArray(0, 10).values().sort().toArray();
  };
};
