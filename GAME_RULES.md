# GAME_RULES.md

# PickleUP Game Rules & Analytics Specification

**Document status:** Normative product specification  
**Rule baseline:** USA Pickleball Official Rulebook — 2026 edition  
**Primary scope:** Standard singles and doubles play, with explicit support for 2026 rally scoring and tournament scoring formats  
**Audience:** Product, frontend, backend, scoring-engine, analytics, QA, and data teams

---

## 1. Purpose

This file defines the game rules and the machine-readable game logic that PickleUP should use when recording, validating, displaying, replaying, and analyzing pickleball matches.

The goal is not merely to describe how pickleball is played. The goal is to define a deterministic event model so that:

1. A live score can never become internally inconsistent.
2. Every rally has an unambiguous outcome.
3. Server/receiver state can be reconstructed from historical events.
4. Match state can be replayed from an event log.
5. Analytics can distinguish points, rallies, faults, side-outs, serves, returns, and game/match transitions.
6. Standard side-out scoring and rally scoring can coexist without corrupting historical data.
7. UI behavior can be derived from the same source of truth as analytics.
8. Future rule changes can be introduced as versioned rule configurations instead of hard-coded assumptions.

---

## 2. Normative Language

The following terms are used deliberately:

- **MUST** — mandatory for a compliant implementation.
- **MUST NOT** — prohibited.
- **SHOULD** — recommended unless the product has a documented reason not to.
- **MAY** — optional.
- **RULE** — behavior required by the governing ruleset.
- **PRODUCT DEFAULT** — PickleUP's chosen default for the application; it is not necessarily a universal tournament rule.
- **ANALYTICS DERIVATION** — a metric calculated from recorded events, not an independent rule.

---

# 3. Rule Baseline

PickleUP's authoritative ruleset for the current implementation is the **2026 USA Pickleball Official Rulebook**.

The 2026 rulebook separates:

- general rules of play,
- standard scoring,
- serving and player positions,
- rally situations,
- non-volley zone rules,
- tournament formats,
- rally scoring,
- and inclusive/adaptive play.

The rules engine SHOULD therefore store a rulebook/version identifier with each match.

Recommended:

```text
rulebook = "USA_PICKLEBALL"
rulebook_version = "2026"
```

The app MUST NOT silently reinterpret historical matches when the rules change.

A historical match should retain the ruleset that was active when the match was created or explicitly selected.

---

# 4. Supported Match Concepts

PickleUP should model the sport at four levels:

```text
Match
  └── Game(s)
        └── Rally
              └── Shot / Event
```

### 4.1 Match

A match is a collection of one or more games between two sides.

A match has:

- match ID
- ruleset
- format
- game target
- win-by requirement
- game count target
- scoring mode
- side/end state
- participants
- start/end timestamps
- status
- event history

### 4.2 Game

A game is a scored unit within a match.

Typical game targets:

- 11 points
- 15 points
- 21 points

The standard winning condition is:

```text
team_score >= game_target
AND
team_score - opponent_score >= win_by
```

The normal win-by value is `2`.

The rules engine MUST support configurable targets rather than assuming 11 forever.

### 4.3 Rally

A rally begins after the score is correctly called and the serve is legally initiated.

A rally ends when:

- a fault occurs,
- the ball becomes dead,
- a valid hinder causes a replay,
- or a rules-based replay is declared.

A replay does **not** count as a completed rally for scoring analytics.

### 4.4 Shot

A shot is an optional lower-level event describing a player's contact with the ball.

Shot tracking is not required for scorekeeping, but it is strongly recommended for future analytics.

---

# 5. Court Fundamentals

## 5.1 Court Dimensions

Standard pickleball uses:

```text
Court width: 20 ft
Court length: 44 ft
```

The dimensions apply to both singles and doubles.

## 5.2 Non-Volley Zone (NVZ / Kitchen)

The non-volley zone is:

```text
7 ft deep
20 ft wide
```

on each side of the net.

The NVZ line itself is part of the NVZ.

Therefore:

- touching the NVZ line counts as being in the NVZ;
- a player may enter the NVZ;
- a player may volley only when the volley is initiated outside the NVZ;
- momentum caused by a volley can still create a fault after ball contact.

## 5.3 Service Courts

Each end has:

- right service court
- left service court
- baseline
- sidelines
- centerline
- NVZ boundary

The serving area is behind the baseline.

---

# 6. Core Scoring Modes

PickleUP MUST distinguish the scoring mode explicitly.

```text
SIDE_OUT
RALLY
```

Do not infer scoring mode from the current score.

---

# 7. Standard Side-Out Scoring

## 7.1 Fundamental Rule

Under standard scoring:

> A point is scored only by the serving player/team when the serving side wins the rally.

Therefore:

### Serving side wins rally

```text
servering_side.score += 1
server remains server
service position switches
```

### Serving side loses rally

```text
no point is awarded
service state changes
```

In singles, service changes to the opponent immediately.

In doubles, the service normally moves from:

```text
first server -> second server -> side out
```

---

# 8. Rally Scoring

Rally scoring is a 2026 ruleset option.

Under rally scoring:

```text
the side that wins the rally receives the point
```

Therefore:

### Serving side wins rally

```text
serving_side.score += 1
same server continues
serving area changes
```

### Receiving side wins rally

```text
receiving_side.score += 1
service changes to receiving side
```

For doubles rally scoring, only one server serves before the side out.

This is different from standard doubles side-out scoring.

The rules engine MUST NOT reuse standard doubles server-rotation logic when `scoring_mode = RALLY`.

---

# 9. Game-Winning Condition

Default:

```text
game_target = 11
win_by = 2
```

A game ends when a side reaches or exceeds the target **and** has the required margin.

Examples for a game to 11:

```text
11-9  -> game over
11-10 -> continue
12-10 -> game over
13-11 -> game over
14-14 -> continue
15-14 -> continue
15-13 -> game over
```

The implementation MUST NOT terminate a game merely because a team reaches 11.

For a game to 15:

```text
15-13 -> game over
16-14 -> game over
```

For a game to 21:

```text
21-19 -> game over
22-20 -> game over
```

## 9.1 Configurable Score Cap

A score cap should be represented as an optional configuration:

```text
score_cap: null | integer
```

The default should be `null`.

Do not invent a cap for standard play unless the match format explicitly defines one.

---

# 10. Match Formats

PickleUP SHOULD support at least:

### Format A — One Game

```text
games_to_win = 1
game_target = 11
win_by = 2
```

### Format B — Best 2 of 3

```text
games_to_win = 2
game_target = 11
win_by = 2
```

### Format C — Best 3 of 5

```text
games_to_win = 3
game_target = 11
win_by = 2
```

### Format D — One Game to 15

```text
games_to_win = 1
game_target = 15
win_by = 2
```

### Format E — One Game to 21

```text
games_to_win = 1
game_target = 21
win_by = 2
```

The exact format must be stored on the match.

---

# 11. Match Completion

A match is complete when one side reaches the required number of game wins.

Example:

```text
Best of 3

Game 1: Team A wins
Game 2: Team A wins

Match winner = Team A
Games won = 2-0
```

In best-of-3:

```text
2 game wins ends the match
```

In best-of-5:

```text
3 game wins ends the match
```

Do not generate a phantom additional game after the match-winning game.

---

# 12. Singles Serving Logic

## 12.1 Server Position

The server's side depends on the server's score.

```text
even score -> right serving area
odd score  -> left serving area
```

Examples:

```text
0 -> right
1 -> left
2 -> right
3 -> left
```

## 12.2 Holding Serve

When the server wins the rally:

```text
score increases by 1
same player serves again
serving side changes
```

## 12.3 Side Out

When the server loses the rally:

```text
no point in side-out scoring
opponent becomes server
```

In rally scoring:

```text
opponent gets the point
opponent becomes server
```

---

# 13. Doubles Serving Logic — Standard Scoring

Doubles has two servers during a normal service turn.

The serving sequence is:

```text
Team gains service
    |
    v
First server
    |
    | wins rally
    v
First server again, opposite service area
    |
    | loses rally
    v
Second server
    |
    | wins rally
    v
Second server again, opposite service area
    |
    | loses rally
    v
Side out
```

## 13.1 Starting Server Exception

At the beginning of a game, the starting server is designated as the **second server**.

Therefore:

```text
0-0-2
```

is the standard opening doubles score call.

The first service loss immediately creates a side out.

---

# 14. Doubles Position Logic

The starting server and partner have score-dependent positions.

For the starting server:

```text
team score even -> right
team score odd  -> left
```

For the partner:

```text
team score even -> left
team score odd  -> right
```

During an active rally, players are free to move and are not required to remain in those initial service/receiving locations.

The server and receiver must, however, be the correct players in the correct positions for the serve.

---

# 15. Server Number

Standard doubles score calls contain three values:

```text
serving team score
receiving team score
server number
```

Examples:

```text
0-0-2
5-3-1
5-3-2
```

Interpretation:

```text
5-3-1
```

means:

- serving team has 5 points,
- receiving team has 3 points,
- the first server is currently serving.

In rally scoring, the score call is reduced to two numbers under the rally-scoring rule.

The internal event model should still record the server identity directly.

---

# 16. Serve Lifecycle

A serve should move through these logical states:

```text
SCORE_CALLED
    |
    v
READY
    |
    v
SERVE_INITIATED
    |
    v
SERVE_LEGALITY_CHECK
    |
    +---- fault/replay ----> DEAD / REPLAY
    |
    v
SERVE_IN_PLAY
    |
    v
RECEIVER_BOUNCE_REQUIRED
    |
    v
RALLY_LIVE
```

A scoring system does not need to model every visual state on screen, but the backend event model should be capable of representing the sequence.

---

# 17. Score Call Rules

Before serving:

- players should be in or moving into the correct positions;
- the server normally calls the score;
- the full score must be called before the serve is hit.

### Singles

Two numbers:

```text
server_score - receiver_score
```

Starting score:

```text
0-0
```

### Doubles

Three numbers:

```text
serving_team_score - receiving_team_score - server_number
```

Starting score:

```text
0-0-2
```

### Early Serve

If the server hits while the score is still being called:

```text
fault against server
```

---

# 18. Ten-Second Serve Rule

After the score call is completed, the server must serve within 10 seconds.

Recommended event:

```json
{
  "event_type": "serve_clock_started",
  "deadline_ms": 10000
}
```

A violation should be represented as:

```text
fault_code = "TEN_SECOND_VIOLATION"
```

The scoring engine SHOULD allow this rule to be disabled for casual product modes if PickleUP explicitly marks that match as casual/non-officiated.

---

# 19. Server Positioning Rules

When the serve is hit:

1. At least one server foot must be in contact with the correct serving area.
2. Neither foot may be contacting the court itself.
3. Neither foot may be outside the correct serving area while contacting the playing surface.

Relevant state fields:

```text
server_left_foot_location
server_right_foot_location
expected_serving_area
foot_fault
```

The app does not need to infer these from video unless video officiating is enabled. They can be manually recorded.

---

# 20. Serve Types

PickleUP should classify:

```text
VOLLEY_SERVE
DROP_SERVE
```

## 20.1 Volley Serve

At contact:

- paddle moves in an upward arc;
- paddle head is not above the highest part of the wrist;
- ball is no higher than the server's waist;
- forehand or backhand motion is allowed.

Invalidity results in:

```text
fault_code = "ILLEGAL_VOLLEY_SERVE"
```

## 20.2 Drop Serve

For a drop serve:

- ball is released from a natural, unaided height;
- ball must not be propelled before the serve contact;
- the ball may bounce any number of times before being hit;
- the bounce may occur anywhere on the playing surface;
- forehand or backhand is allowed.

Invalidity results in:

```text
fault_code = "ILLEGAL_DROP_SERVE"
```

---

# 21. Serve Release Rules

The ball must be released:

- from one hand, or
- from the paddle.

The server must not manipulate the ball to add spin before paddle contact.

Natural rotation is permitted.

Spin may be generated by the paddle at contact.

The receiver may call for a replay for certain release violations before returning the serve.

---

# 22. Serve Visibility

The receiver must be able to see the ball release.

If the release is not visible to the receiver:

```text
replay requested before return
```

No point or server rotation occurs.

Analytics should record:

```text
rally_status = "REPLAY"
replay_reason = "BALL_RELEASE_NOT_VISIBLE"
```

---

# 23. Serve Placement

The serve must:

1. travel diagonally,
2. clear the opponent's NVZ,
3. land in the correct service court.

The serve may touch the net and still be legal as long as it lands correctly.

### Automatic service faults

```text
serve lands outside correct service court
serve lands in NVZ
serve contacts permanent object before landing
serve hits server or server partner
```

A serve that hits the receiver or receiver's partner before landing creates a fault against the receiver.

---

# 24. Service Line Rule

For a serve:

```text
NVZ line = out
```

The serve must clear the NVZ and land beyond it in the correct service court.

Other service-court boundary lines are part of the service court.

This distinction is critical for automated court geometry.

---

# 25. General Line Rules

Players are responsible for out calls on their end of the court in standard play.

A ball is considered:

```text
IN
```

when it lands in the applicable playing area.

A ball is:

```text
OUT
```

when it lands outside the applicable boundary.

### Special rule

A served ball landing on the NVZ line is out.

### Benefit of the doubt

A player should not call a ball out unless they can clearly see space between the ball and the line.

If uncertain:

```text
IN
```

This principle should be reflected in player-facing rules guidance.

---

# 26. Two-Bounce Rule

The serve and return of serve must each bounce before being hit.

Sequence:

```text
Serve
  -> bounce
Return
  -> bounce
Normal rally
  -> volleying becomes possible
```

### Violations

Receiver volleys serve:

```text
fault against receiver
```

Serving side volleys return before bounce:

```text
fault against serving side
```

---

# 27. Maximum Bounce Rule

After the two-bounce sequence, each player must return the ball before it bounces a second time.

If the player fails:

```text
fault_code = "DOUBLE_BOUNCE"
```

The rally ends.

---

# 28. Valid Return

A return must cause the ball to:

- land on the opponent's end of the court, or
- contact an opponent / their worn or carried item before landing.

If it lands outside the opponent's court:

```text
fault against hitter
```

If it fails to cross the net and lands on the hitter's own side:

```text
fault against hitter
```

---

# 29. Ball Hitting Player

After the serve, if the ball hits a player or their clothing/equipment, it is generally a fault against that player.

Exception:

- the player's paddle is permitted;
- hands below the wrist while in contact with the paddle are treated as part of the paddle contact.

Analytics should preserve the specific hit target whenever known.

---

# 30. Permanent Objects

Permanent objects may include:

- net posts,
- connected net hardware,
- fencing,
- walls,
- ceiling,
- lights,
- seating,
- referee stands,
- other fixed objects affecting play.

If a player hits the ball and it contacts a permanent object before landing:

```text
fault against hitter
```

If the ball has already bounced and then contacts a permanent object before the player returns it, the resulting failure is a fault against the player who failed to return it.

---

# 31. Double Hit

A player may hit the ball more than once only when the contacts form one continuous stroke in one direction.

A non-continuous double hit is a fault.

Two players on the same team both striking the ball during one return attempt is a fault.

Analytics:

```text
fault_code = "DOUBLE_HIT"
```

or:

```text
fault_code = "TEAM_DOUBLE_CONTACT"
```

---

# 32. Missed Shot

A complete swing-and-miss does not automatically end the rally.

The ball remains live until:

- a valid bounce condition ends the rally,
- a fault occurs,
- the ball becomes dead,
- or the rally is otherwise terminated.

This is important for shot analytics.

Do not count a swing-and-miss as a shot result equivalent to a fault unless the rally actually ends because of it.

---

# 33. Distraction

A player must not distract an opponent who is about to hit the ball.

Examples can include deliberate distracting behavior.

In analytics:

```text
fault_code = "DISTRACTION"
fault_actor = player_id
```

Avoid attempting to infer intent automatically without human/officiated input.

---

# 34. Damaged Ball

A broken, cracked, soft, or degraded ball does not automatically stop the rally.

The rally normally continues to completion.

A replacement may occur when the players agree.

If all players agree that a broken/cracked ball affected the rally outcome:

```text
replay
```

If they do not agree:

```text
rally result stands
```

Soft/degraded ball:

```text
previous rally result stands
```

---

# 35. Injury During Rally

If a player is injured during a rally:

```text
rally continues to completion
```

unless another rules-based stoppage applies.

The scoring engine should not retroactively cancel a rally merely because an injury occurred.

---

# 36. Equipment/Apparel Problem During Rally

If a player has an equipment or apparel problem during a rally:

```text
rally continues
```

unless a separate fault or stoppage rule applies.

---

# 37. Hinders

A hinder is an event that legitimately interrupts play and results in a replay.

Any player may call a hinder.

When a valid hinder is called:

```text
rally_status = REPLAY
points_awarded = 0
server_state = unchanged
score = unchanged
```

The exact `replay_reason` should be recorded.

Recommended values:

```text
HINDER
BALL_RELEASE_NOT_VISIBLE
SERVE_RELEASE_SPIN
POSITION_ERROR_CORRECTED
INCORRECT_SCORE_CALLED
NET_SYSTEM_MALFUNCTION
BROKEN_BALL_AFFECTED_RALLY
```

---

# 38. Position / Server Errors

Before the serve, players may ask:

- who is the correct server;
- who is the correct receiver;
- whether players are positioned correctly.

During a rally, a player may stop play to identify an error.

### Correctly identified error before the rally result is finalized

```text
REPLAY
```

### Incorrect claim

```text
FAULT against player making the incorrect claim
```

### Correct server/receiver was actually positioned correctly

An incorrect return by the wrong receiver can produce a fault against that receiver.

### Error discovered after the rally

The completed rally result normally stands, with correction applied before the next serve.

This distinction is essential for event auditing.

---

# 39. Score-Call Corrections

A player may challenge the score call before the return of serve is hit and before the ball becomes dead.

### Incorrect score was called

```text
replay with correct score
```

### Correct score was called but player challenged it

```text
fault against challenger
```

### Challenge happens after return of serve

```text
fault against challenger
```

### Incorrect score discovered after rally completion

```text
rally result stands
score corrected before next serve
```

The historical event log should record the original call and subsequent correction.

---

# 40. Non-Volley Zone Rules

## 40.1 General Rule

A player may stand in the NVZ.

A player may hit a ball after it bounces while standing in the NVZ.

The restriction is specifically on volleying.

## 40.2 Volleying

A volley must be initiated outside the NVZ.

A fault occurs if:

- the volleying player touches the NVZ;
- anything in contact with the player touches the NVZ;
- their partner is contacted and is in contact with the NVZ;
- momentum caused by the volley results in contact with the NVZ;
- the player has contacted the NVZ and has not fully exited before volleying.

## 40.3 Momentum

The ball can already be dead, but momentum from the volley can still create an NVZ fault.

This is an important post-rally event.

The analytics model must allow a fault to be registered immediately after ball contact.

---

# 41. Paddle Rules

During a rally:

- player may use/carry only one paddle;
- player must possess the paddle when hitting the ball;
- paddle may be held in one or both hands;
- paddle may be transferred between hands.

A player must not catch or carry the ball on the paddle.

Recommended fault codes:

```text
MULTIPLE_PADDLES
PADDLE_NOT_IN_POSSESSION
BALL_CAUGHT_OR_CARRIED
```

---

# 42. Net Rules

## 42.1 Ball Touching Net

A ball contacting the net or net cord normally remains live.

## 42.2 Ball Caught in Net

When a returned ball crosses the net and becomes caught in the net, the rally is replayed.

## 42.3 Net Support System

A served ball must not contact the net support system.

A returned ball must not contact the net support system before crossing to the opponent.

Specific support-system contacts inside the court may produce a replay under the rules.

Therefore, analytics must distinguish:

```text
NET_CONTACT
NET_SUPPORT_CONTACT
NET_REPLAY
```

## 42.4 Around the Net Post

A player may return a ball around the outside of the net post.

The ball does not have to travel directly over the net if the legal around-post return conditions are satisfied.

## 42.5 Between Net and Post

A ball must not be hit between the net and net post.

```text
fault_code = "BALL_BETWEEN_NET_POST"
```

## 42.6 Under the Net

A ball must not be hit under the net.

```text
fault_code = "BALL_UNDER_NET"
```

## 42.7 Ball Crossing Net Plane

The ball must completely cross the plane of the net before being struck by the receiving player.

Hitting it before it crosses is a fault.

---

# 43. Player / Net Contact

While the ball is live:

- a player must not touch the net;
- a player must not touch the net support system;
- worn/carried objects must not touch the net/support system.

Such contact is a fault against that player.

---

# 44. Player Crossing Net Plane

A player or their worn/carried item normally must not cross the net plane while the ball is live.

Exception:

A player may cross the plane immediately after hitting the ball, when the crossing is a natural continuation of that strike.

The player may also legally cross in the special situation where the ball bounces on the receiving side and returns back over the net before being hit, subject to the relevant timing conditions.

The rules engine should support an explicit:

```text
net_plane_crossing_context
```

rather than treating every cross-net movement as a fault.

---

# 45. Rally Lifecycle — Canonical

The canonical server-side sequence should be:

```text
1. READ_CURRENT_STATE
2. DETERMINE_SERVER
3. DETERMINE_RECEIVER
4. DETERMINE_EXPECTED_SERVING_AREA
5. CALL_SCORE
6. START_SERVE_CLOCK
7. SERVE
8. VALIDATE_SERVE
9. APPLY_FIRST_BOUNCE_REQUIREMENT
10. VALIDATE_RETURN
11. APPLY_SECOND_BOUNCE_REQUIREMENT
12. PROCESS_RALLY
13. DETECT_FAULT / DEAD_BALL / REPLAY
14. RESOLVE_RALLY
15. UPDATE_SCORE
16. UPDATE_SERVER_STATE
17. CHECK_GAME_END
18. CHECK_MATCH_END
19. PREPARE_NEXT_RALLY
```

---

# 46. Rally Resolution Algorithm

Pseudo-code:

```ts
function resolveRally(state, rally) {
  if (rally.status === "REPLAY") {
    return state;
  }

  const loserSide = rally.faultSide;
  const winnerSide = loserSide === "A" ? "B" : "A";

  if (state.scoringMode === "SIDE_OUT") {
    if (state.servingSide === winnerSide) {
      state.score[winnerSide] += 1;
      advanceServingPositionAfterPoint(state);
    } else {
      advanceServiceAfterServeLoss(state);
    }
  }

  if (state.scoringMode === "RALLY") {
    state.score[winnerSide] += 1;

    if (state.servingSide === winnerSide) {
      advanceServingPositionAfterPoint(state);
    } else {
      assignServiceTo(winnerSide);
    }
  }

  return state;
}
```

This is a conceptual model. The production implementation should use explicit state transitions rather than hidden mutations.

---

# 47. Recommended Service-State Model

Represent service state with:

```ts
type ServiceState = {
  servingSideId: string;
  serverPlayerId: string;
  receiverPlayerId: string;

  serverNumber?: 1 | 2;

  servingArea: "RIGHT" | "LEFT";

  firstServerPlayerId?: string;
  secondServerPlayerId?: string;

  startingServerPlayerId?: string;

  sideOutCount: number;
};
```

---

# 48. Recommended Match-State Model

```ts
type MatchState = {
  matchId: string;

  ruleset: {
    provider: "USA_PICKLEBALL";
    version: "2026";
    scoringMode: "SIDE_OUT" | "RALLY";
    gameTarget: number;
    winBy: number;
    gamesToWin: number;
    scoreCap: number | null;
  };

  sides: {
    A: TeamState;
    B: TeamState;
  };

  currentGame: GameState;

  completedGames: GameSummary[];

  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "ABANDONED";

  currentEnd: "A_LEFT" | "A_RIGHT";

  eventSequence: number;
};
```

---

# 49. Recommended Game-State Model

```ts
type GameState = {
  gameNumber: number;

  scoreA: number;
  scoreB: number;

  gamesWonA: number;
  gamesWonB: number;

  servingSideId: string;
  serverPlayerId: string;
  receiverPlayerId: string;

  serverNumber?: 1 | 2;

  rallyNumber: number;

  completedRallies: number;
  replayedRallies: number;

  sideOuts: number;

  status: "NOT_STARTED" | "LIVE" | "COMPLETED";

  endChanged: boolean;
  endChangeScore?: {
    scoreA: number;
    scoreB: number;
  };
};
```

---

# 50. Event-Sourced Analytics Model

Every meaningful game transition should be represented as an immutable event.

Recommended top-level event structure:

```json
{
  "event_id": "evt_123",
  "match_id": "match_123",
  "game_id": "game_2",
  "rally_id": "rally_48",
  "sequence": 184,
  "event_type": "RALLY_COMPLETE",
  "timestamp": "2026-09-24T12:30:11.341Z",
  "side": "A",
  "player_id": "player_1",
  "payload": {},
  "rulebook": "USA_PICKLEBALL",
  "rulebook_version": "2026"
}
```

---

# 51. Core Event Types

At minimum:

```text
MATCH_CREATED
MATCH_STARTED
GAME_STARTED

SCORE_CALLED
SERVE_CLOCK_STARTED
SERVE_CLOCK_EXPIRED

SERVE_ATTEMPTED
SERVE_VALID
SERVE_FAULT

RALLY_STARTED
SHOT_RECORDED
BOUNCE_RECORDED
VOLLEY_RECORDED

RALLY_COMPLETE
RALLY_REPLAYED

FAULT_COMMITTED
FAULT_CONFIRMED

SIDE_OUT

SCORE_POINT_A
SCORE_POINT_B

END_CHANGE
TIMEOUT_STARTED
TIMEOUT_ENDED

GAME_COMPLETED
MATCH_COMPLETED

POSITION_ERROR
POSITION_ERROR_REPLAY

SCORE_CORRECTION
RULEBOOK_CORRECTION
```

---

# 52. Fault Taxonomy

Use a controlled vocabulary.

## Serve faults

```text
SERVER_NOT_GROUNDED
SERVER_TOUCHING_COURT
SERVER_OUTSIDE_SERVING_AREA
ILLEGAL_VOLLEY_SERVE
ILLEGAL_DROP_SERVE
SERVE_OUT
SERVE_IN_NZV
SERVE_HITS_PERMANENT_OBJECT
SERVE_HITS_SERVER
SERVE_HITS_SERVER_PARTNER
SERVE_HITS_RECEIVER
SERVE_HITS_RECEIVER_PARTNER
TEN_SECOND_VIOLATION
EARLY_SERVE
```

## Rally faults

```text
NO_BOUNCE_RECEIVER
NO_BOUNCE_SERVING_SIDE
DOUBLE_BOUNCE
BALL_OUT
BALL_ON_OWN_SIDE
BALL_HITS_PLAYER
BALL_HITS_PERMANENT_OBJECT
DOUBLE_HIT
TEAM_DOUBLE_CONTACT
DISTRACTION
```

## NVZ faults

```text
NVZ_CONTACT_WHILE_VOLLEYING
NVZ_MOMENTUM
NVZ_NOT_EXITED
```

## Paddle faults

```text
MULTIPLE_PADDLES
PADDLE_NOT_IN_POSSESSION
BALL_CAUGHT_OR_CARRIED
```

## Net faults

```text
BALL_BETWEEN_NET_POST
BALL_UNDER_NET
BALL_HIT_BEFORE_NET_CROSS
PLAYER_TOUCHES_NET
PLAYER_TOUCHES_NET_SUPPORT
PLAYER_TOUCHES_OPPONENT_COURT
ILLEGAL_NET_PLANE_CROSSING
```

## Procedure faults

```text
INCORRECT_POSITION_CLAIM
INCORRECT_RECEIVER
CORRECT_SCORE_CHALLENGED
LATE_SCORE_CHALLENGE
UNAUTHORIZED_STOPPAGE
```

---

# 53. Replay Taxonomy

Replays MUST NOT count as completed scoring rallies.

Recommended replay codes:

```text
HINDER
BALL_RELEASE_NOT_VISIBLE
SERVE_RELEASE_SPIN
CORRECT_POSITION_ERROR
INCORRECT_SCORE_CALLED
BROKEN_BALL_AFFECTED_RALLY
NET_REPLAY
NET_SUPPORT_REPLAY
NET_SYSTEM_MALFUNCTION
OFFICIATING_REPLAY
OTHER_VALID_REPLAY
```

---

# 54. Fault Attribution

Every fault should have:

```ts
{
  fault_code,
  fault_side_id,
  fault_player_id?,
  opposing_side_id,
  phase,
  is_scoring_fault,
  was_self_called,
  was_officially_called,
  confidence
}
```

`fault_player_id` should be nullable because some manually recorded faults are team-level events.

---

# 55. Rally Outcome Model

Recommended:

```ts
type RallyOutcome = {
  result:
    | "SIDE_A_POINT"
    | "SIDE_B_POINT"
    | "SIDE_A_RALLY_WIN_NO_POINT"
    | "SIDE_B_RALLY_WIN_NO_POINT"
    | "REPLAY";

  winnerSideId?: string;

  scoringSideId?: string;

  faultCode?: string;
  faultSideId?: string;
  faultPlayerId?: string;

  pointAwarded: boolean;

  sideOut: boolean;

  replayReason?: string;
};
```

Why separate `winnerSideId` and `scoringSideId`?

Because under side-out scoring:

```text
winnerSideId != scoringSideId
```

can occur.

Example:

```text
Receiving team wins the rally
Receiving team does NOT get a point
Serving team loses service
```

That distinction is essential for analytics.

---

# 56. Rally Numbering

Every attempted rally gets a sequential ID.

A replay should retain its identity but should not advance the completed-rally counter.

Example:

```text
Rally 41 -> replay
Rally 41 -> replay
Rally 41 -> completed
```

or, alternatively:

```text
Attempt 41.1 -> replay
Attempt 41.2 -> replay
Attempt 41.3 -> completed
```

Recommended implementation:

```text
completed_rally_number = 41
attempt_number = 3
```

This preserves analytics accuracy.

---

# 57. Point Numbering

A point should only increment when the ruleset awards a point.

Under standard scoring:

```text
server wins rally -> point increment
receiver wins rally -> no point increment
```

Under rally scoring:

```text
every completed rally -> one point increment
```

Do not equate:

```text
rally count == point count
```

for side-out scoring.

---

# 58. Side-Out Analytics

A `SIDE_OUT` event occurs whenever service changes because the serving side lost the rally.

Under standard doubles:

```text
first server loses
    -> second server
```

This is **not** yet a full side out.

A true side out occurs when the second server loses.

Therefore analytics should distinguish:

```text
SERVER_SWITCH
SIDE_OUT
```

This matters for service efficiency analysis.

---

# 59. Server Hold Analytics

Define:

```text
server_hold = serving side wins rally
```

For standard scoring:

```text
server_hold_rate =
  serving_side_rallies_won /
  serving_side_rallies_attempted
```

For doubles, this can be further split by server number.

Recommended:

```text
first_server_hold_rate
second_server_hold_rate
```

---

# 60. Break-Point / Conversion Analytics

For side-out scoring, a receiving side's rally win does not automatically equal a point.

Useful derived metrics:

```text
receiving_rally_win_rate
side_out_conversion_rate
service_hold_rate
points_per_service_turn
```

A practical definition:

```text
side_out_conversion_rate =
  number_of_side_outs_created /
  number_of_receive_opportunities
```

A receiving opportunity ends when:

- the receiving side wins a rally and creates a side out, or
- the serving side successfully holds.

---

# 61. Rally Length

If shot events are recorded:

```text
rally_shot_count
```

should count contacts, not bounces.

Also track:

```text
serve_contact
return_contact
third_shot_contact
fourth_shot_contact
...
```

Recommended derived metrics:

```text
average_rally_shots
median_rally_shots
long_rally_rate
short_rally_rate
```

Do not infer shot count from total rally duration.

---

# 62. Serve Analytics

Each legal serve should support:

```text
serve_attempt
serve_result
serve_type
server_id
serve_target
serve_fault
```

Recommended serve result categories:

```text
IN_PLAY
FAULT
REPLAY
```

Derived:

```text
serve_in_percentage
serve_fault_rate
serve_winner_rate
serve_sideout_rate
```

---

# 63. Return Analytics

A return attempt should support:

```text
returner_id
return_result
return_depth
return_direction
return_type
fault_code
```

Minimum result:

```text
IN_PLAY
FAULT
REPLAY
```

Useful derived metrics:

```text
return_in_rate
return_fault_rate
first_ball_return_win_rate
```

---

# 64. Third-Shot Analytics

The analytics layer should be capable of identifying the third shot in a rally.

Expected sequence:

```text
1. Serve
2. Return
3. Serving side's next shot
```

Recommended classification:

```text
THIRD_SHOT_DROP
THIRD_SHOT_DRIVE
THIRD_SHOT_LOB
THIRD_SHOT_OTHER
```

This classification is not a scoring rule. It is an analytics taxonomy.

Do not let analytics classifications alter score resolution.

---

# 65. NVZ Analytics

Track:

```text
nvz_entry
nvz_exit
volley_from_outside_nvz
nvz_fault
nvz_momentum_fault
```

Useful derived metrics:

```text
NVZ time
NVZ entry frequency
volley percentage
NVZ fault rate
forced NVZ fault rate
```

For automated tracking, a player's physical location can be sampled independently from the official scoring event stream.

---

# 66. Point Differential

At any point in a game:

```text
point_differential = scoreA - scoreB
```

For a given team:

```text
team_point_differential =
    team_points_scored
    - opponent_points_scored
```

For a match:

```text
match_point_differential =
    sum(game_point_differentials)
```

In tournament round-robin analytics, point differential may also be used as a formal tiebreak metric. Do not assume it is a ranking rule outside the competition format.

---

# 67. Lead Analytics

Track:

```text
current_lead
largest_lead
time_at_lead
lead_changes
tie_states
```

A tie is:

```text
scoreA === scoreB
```

A lead change occurs when the sign of the score differential changes.

---

# 68. Game Momentum

Do not make “momentum” a primitive scoring state.

Instead derive it from event data.

Possible definitions:

```text
last_N_rallies_win_rate
last_N_points_win_rate
rolling_point_differential
rolling_service_hold_rate
```

The definition must be stored with the analytics result so that two dashboards do not use different meanings for “momentum.”

---

# 69. End Changes

For officiated/tournament play, end changes occur at the rule-defined midpoint.

Typical values:

```text
game to 11 -> 6
game to 15 -> 8
game to 21 -> 11
```

For the applicable single-game or tie-breaker context.

After an end change:

```text
same server continues
score does not change
service state does not reset
```

Recommended event:

```json
{
  "event_type": "END_CHANGE",
  "trigger_score": {
    "side_a": 6,
    "side_b": 3
  },
  "server_player_id": "p1"
}
```

The app should treat court-end orientation as a presentation/state property, not as a scoring reset.

---

# 70. End-Change Handling

The implementation must store:

```text
physical_end_before
physical_end_after
end_change_trigger_score
server_before
server_after
```

Expected invariant:

```text
server_before === server_after
score_before === score_after
```

unless another independent technical adjustment occurred.

---

# 71. Timeouts

Timeouts do not change score or server state.

Represent them as:

```text
TIMEOUT_STARTED
TIMEOUT_ENDED
```

with:

```text
timeout_type
requesting_side
requesting_player
duration
```

Potential types:

```text
STANDARD
END_CHANGE
MEDICAL
REFEREE
EQUIPMENT
BETWEEN_GAMES
```

Do not count timeout duration as rally duration.

---

# 72. Match Abandonment

A match may end without a normal game-winning rally because of:

```text
retirement
withdrawal
forfeit
administrative termination
```

The final match status must distinguish:

```text
COMPLETED
RETIRED
FORFEITED
WITHDRAWN
ABANDONED
```

Do not label an administrative win as a normal on-court game win.

---

# 73. Rulebook Versioning

Every match MUST store:

```text
rulebook_provider
rulebook_version
ruleset_created_at
scoring_mode
game_target
win_by
match_format
```

Example:

```json
{
  "rulebook_provider": "USA_PICKLEBALL",
  "rulebook_version": "2026",
  "scoring_mode": "SIDE_OUT",
  "game_target": 11,
  "win_by": 2,
  "match_format": "BEST_OF_3"
}
```

If the app later supports 2027 rules, old matches remain on `2026`.

---

# 74. Casual vs Official Match Mode

PickleUP should support a rules profile:

```text
OFFICIAL
TOURNAMENT
CASUAL
CUSTOM
```

Example:

```json
{
  "competition_level": "CASUAL",
  "ruleset": "USA_PICKLEBALL_2026",
  "enforce_ten_second_rule": false,
  "enable_manual_faults": true
}
```

The application must not modify official rules invisibly.

A custom rule must be visible in the match configuration.

---

# 75. Analytics Invariants

These invariants should be checked automatically.

## Invariant 1 — Score monotonicity

A normal scoring event must never reduce a score.

Exception:

```text
technical foul / official score correction
```

which must be an explicit event.

## Invariant 2 — Replay neutrality

Replay:

```text
must not change score
must not create a point
must not create a completed rally
must not advance server state
```

## Invariant 3 — Side-out neutrality

Under side-out scoring, losing a rally while receiving:

```text
does not create a point
```

## Invariant 4 — Server continuity

When server wins a rally:

```text
same server continues
```

unless a rules-specific correction occurs.

## Invariant 5 — Match completion

Once `MATCH_COMPLETED` occurs:

```text
no normal rally may be appended afterward
```

An administrative correction may be appended only through a correction workflow.

## Invariant 6 — Game completion

Once a game is complete:

```text
no normal rally may be added to that game
```

## Invariant 7 — Winning margin

A normal game winner MUST satisfy:

```text
winner_score >= game_target
winner_score - loser_score >= win_by
```

unless a custom match configuration explicitly overrides this.

---

# 76. State Transition Table

| Current State | Event | Side-Out Result | Rally Result | Next State |
|---|---|---|---|---|
| READY | legal serve | none | rally live | LIVE |
| READY | serve fault | depends on server | serving side loses rally | NEXT_SERVICE_STATE |
| LIVE | serving side wins | +1 point | server holds | READY |
| LIVE | receiving side wins | no point | server loses service | READY |
| LIVE | rally replay | no change | replay | READY |
| LIVE | NVZ fault | fault-dependent | rally ends | NEXT_SERVICE_STATE |
| LIVE | out ball | fault | rally ends | NEXT_SERVICE_STATE |
| LIVE | double bounce | fault | rally ends | NEXT_SERVICE_STATE |
| LIVE | hinder | no change | replay | READY |
| GAME_COMPLETE | next game setup | n/a | n/a | NEXT_GAME / MATCH_COMPLETE |

For rally scoring, replace the point behavior with:

```text
winner of every completed rally gets +1
```

---

# 77. Standard Doubles State Transition

Example:

```text
Score: 4-3-1
Server: A1

A1 wins
-> score 5-3-1
-> A1 remains server
-> serving area switches

A1 loses
-> score remains 5-3
-> server changes to A2
-> score call becomes 5-3-2

A2 wins
-> score 6-3-2
-> A2 remains server
-> serving area switches

A2 loses
-> score remains 6-3
-> side out
-> Team B begins serving
```

The scoreboard should never increment the receiving team's score in the standard side-out example.

---

# 78. Rally-Scoring Doubles State Transition

Example:

```text
Score: 4-3
Team A serving
Server: A1

A1 wins
-> score 5-3
-> A1 continues serving
-> service area switches

A1 loses
-> score 5-4
-> Team B receives point
-> Team B becomes serving side
-> Team B selects the correctly positioned single server
```

Only one server operates during each service turn.

---

# 79. Analytics: Required Raw Fields

Every completed rally should ideally store:

```text
match_id
game_id
rally_id
sequence
timestamp_start
timestamp_end

scoring_mode

score_before_A
score_before_B
score_after_A
score_after_B

serving_side_before
server_player_id
receiver_player_id
server_number

serving_area
receive_area

winner_side_id
scoring_side_id

rally_status
point_awarded
side_out

fault_code
fault_player_id
fault_side_id

replay_reason

shot_count
serve_type
return_result
third_shot_type
```

---

# 80. Analytics: Derived Metrics

The analytics layer should compute at least:

### Match

```text
wins
losses
games_won
games_lost
points_for
points_against
point_differential
rallies_won
rallies_lost
average_rally_length
```

### Serving

```text
service_points
service_rallies
service_wins
service_losses
service_hold_rate
serve_faults
serve_fault_rate
first_server_hold_rate
second_server_hold_rate
```

### Receiving

```text
receive_rallies
receive_wins
receive_losses
side_outs_created
side_out_conversion_rate
return_fault_rate
```

### NVZ

```text
nvz_faults
nvz_volley_attempts
nvz_volley_success_rate
nvz_momentum_faults
```

### Pressure

```text
game_points
match_points
break_points
break_point_conversion
close_game_record
```

Definitions for these metrics must be fixed in analytics code and documented with the metric.

---

# 81. Pressure-State Detection

A rally can be tagged as a pressure rally.

Recommended flags:

```text
is_game_point
is_set_point
is_match_point
is_break_point
is_deuce_or_near_deuce
```

Example:

```text
game target = 11
win by = 2

Score 10-9:
is_game_point = true for Team A
```

But:

```text
Score 10-10:
no team has an immediate winning point under win-by-two rules
```

This distinction should be reflected in UI and analytics.

---

# 82. Game Point Logic

Under standard scoring:

```text
team is one or more points from satisfying the game-winning condition
AND
team is serving
```

For rally scoring:

```text
team is one or more points from satisfying the game-winning condition
```

because either side can score on every rally.

Do not hard-code the concept of “game point requires serve” outside the applicable scoring mode.

---

# 83. Deuce / Extended Play

A game can continue beyond the nominal target.

Example:

```text
10-10
11-10
11-11
12-11
12-12
...
```

The first side to satisfy:

```text
score >= target
AND
margin >= 2
```

wins.

The analytics layer should record:

```text
extended_game = true
```

when:

```text
both teams have reached the target - 1
```

or when the score exceeds the nominal target.

---

# 84. Game Length Analytics

Recommended:

```text
total_points_awarded
total_completed_rallies
total_replays
total_side_outs
score_at_completion
game_duration
```

For side-out scoring:

```text
completed_rallies >= total_points_awarded
```

because some receiving-side rally wins do not produce points.

---

# 85. Rally Win vs Point Win

These are separate concepts.

Example under side-out:

```text
Team A serves
Team B wins rally
```

Then:

```text
Team B rally win = 1
Team B point win = 0
Team A service loss = 1
```

Analytics must not collapse these values.

---

# 86. Service-Turn Analytics

Define a service turn as the period beginning when a team gains service and ending when a true side out occurs.

Track:

```text
service_turn_id
service_turn_started_at
service_turn_ended_at
server_1_rallies
server_2_rallies
service_turn_points
service_turn_rallies_won
service_turn_rallies_lost
```

This makes service efficiency much more useful than simply counting serves.

---

# 87. Rally Quality Categories

Optional application taxonomy:

```text
CLEAN_WIN
FORCED_ERROR
UNFORCED_ERROR
SERVE_FAULT
RETURN_FAULT
NVZ_ERROR
OUT_ERROR
NET_ERROR
SECOND_BOUNCE
PROCEDURAL_ERROR
REPLAY
```

These categories are analytics labels, not official rule terminology.

Do not present them as official rule classifications.

---

# 88. Player Attribution

For every player-level statistic, analytics should preserve:

```text
player_id
team_id
role_at_rally
action_type
outcome
```

Roles may include:

```text
SERVER
RECEIVER
PARTNER
HITTER
FAULT_ACTOR
WINNER
```

For doubles, never infer player responsibility solely from team-level scoring.

---

# 89. Team Attribution

Team-level metrics should be computed from player events.

Recommended:

```text
team_id
player_ids
side
service_turns
points
rallies
```

Do not store team totals independently unless they are derived/cached values with a clear source.

---

# 90. Data Integrity Checks

The backend should reject or flag:

### Invalid score increase

```text
score increases without a point-awarding event
```

### Invalid server

```text
server_player_id is not a member of serving side
```

### Invalid receiver

```text
receiver_player_id is not a member of receiving side
```

### Invalid server number

```text
server_number = 2 for a first-server-only rally scoring turn
```

### Replay with score change

```text
rally_status = REPLAY
AND
score_after != score_before
```

### Game ended too early

```text
game status = COMPLETE
AND
winner does not satisfy game condition
```

### Point awarded under side-out to receiver

Flag unless:

```text
event is an explicit technical adjustment/correction
```

---

# 91. Auditability

Every correction must be represented as an event.

Do not mutate historical rally rows silently.

Recommended:

```text
ORIGINAL_EVENT
CORRECTION_EVENT
CORRECTED_STATE
```

This makes score disputes and analytics recalculation possible.

---

# 92. Recalculation Strategy

The canonical source of truth should be the event stream.

Derived tables can be rebuilt from events.

Recommended architecture:

```text
Immutable Event Log
        |
        v
Rules Engine
        |
        +--> Live Match State
        |
        +--> Game Summary
        |
        +--> Player Analytics
        |
        +--> Match Analytics
```

Never make a dashboard total the authoritative source of score.

---

# 93. Idempotency

Every score-changing event MUST be idempotent.

Use:

```text
event_id
```

and reject duplicate event processing.

Example:

```text
evt_123 applied once
evt_123 replayed -> ignored
```

This avoids double-scoring caused by network retries.

---

# 94. Event Ordering

Events should carry:

```text
sequence
client_timestamp
server_timestamp
```

The scoring engine should use server-authoritative ordering.

If offline scoring is supported:

```text
device_sequence
client_event_id
sync_sequence
```

should also be recorded.

---

# 95. Offline Match Support

Offline mode should permit:

- rally entry,
- score updates,
- server rotation,
- replay recording,
- corrections.

When reconnecting:

```text
local events -> sync -> server validation -> canonical sequence
```

Conflicts must not be silently merged if both devices changed the score independently.

---

# 96. UI Rules Derived From State

The score UI should derive:

- visible score,
- server indicator,
- active server number,
- serving side,
- serving area,
- game point,
- match point,
- side-out transition,

from canonical game state.

The UI should not contain a separate server-rotation algorithm.

---

# 97. What Should Never Be Hard-Coded in UI

Do NOT hard-code:

```text
first to 11
always win by 2
always best of 3
always two servers
always side-out scoring
always three-number doubles score
```

All of those are ruleset/format dependent.

Instead the UI should consume:

```text
match.ruleset
match.format
game.target
game.scoring_mode
service_state
```

---

# 98. Recommended JSON Match Configuration

```json
{
  "rulebook": {
    "provider": "USA_PICKLEBALL",
    "version": "2026"
  },
  "competition_level": "CASUAL",
  "format": {
    "type": "BEST_OF_3",
    "games_to_win": 2,
    "game_target": 11,
    "win_by": 2,
    "score_cap": null
  },
  "scoring": {
    "mode": "SIDE_OUT"
  },
  "players": {
    "sideA": ["p1", "p2"],
    "sideB": ["p3", "p4"]
  },
  "starting_side": "A",
  "starting_server": "p1"
}
```

---

# 99. Recommended Score Snapshot

```json
{
  "score": {
    "A": 7,
    "B": 5
  },
  "games": {
    "A": 1,
    "B": 0
  },
  "serving": {
    "side": "A",
    "player": "p1",
    "server_number": 2,
    "area": "LEFT"
  },
  "status": {
    "game_point_A": false,
    "game_point_B": false,
    "match_point_A": false,
    "match_point_B": false
  }
}
```

---

# 100. Example Event — Standard Scoring Point

```json
{
  "event_type": "RALLY_COMPLETE",
  "match_id": "m1",
  "game_id": "g2",
  "rally_id": "r44",
  "sequence": 122,
  "scoring_mode": "SIDE_OUT",
  "score_before": {
    "A": 7,
    "B": 5
  },
  "serving_side": "A",
  "server_player_id": "p1",
  "receiver_player_id": "p3",
  "winner_side_id": "A",
  "scoring_side_id": "A",
  "point_awarded": true,
  "side_out": false,
  "fault_code": "RETURN_FAULT"
}
```

Result:

```text
8-5
```

---

# 101. Example Event — Standard Scoring Receiving Win

```json
{
  "event_type": "RALLY_COMPLETE",
  "scoring_mode": "SIDE_OUT",
  "score_before": {
    "A": 7,
    "B": 5
  },
  "serving_side": "A",
  "winner_side_id": "B",
  "scoring_side_id": null,
  "point_awarded": false,
  "side_out": true,
  "fault_side_id": "A",
  "fault_code": "BALL_OUT"
}
```

Result:

```text
7-5
service -> Team B
```

No point is added.

---

# 102. Example Event — Rally Scoring Receiving Win

```json
{
  "event_type": "RALLY_COMPLETE",
  "scoring_mode": "RALLY",
  "score_before": {
    "A": 7,
    "B": 5
  },
  "serving_side": "A",
  "winner_side_id": "B",
  "scoring_side_id": "B",
  "point_awarded": true,
  "side_out": true,
  "fault_side_id": "A",
  "fault_code": "BALL_OUT"
}
```

Result:

```text
7-6
service -> Team B
```

---

# 103. Example — Replay

```json
{
  "event_type": "RALLY_REPLAYED",
  "rally_id": "r45",
  "score_before": {
    "A": 7,
    "B": 5
  },
  "score_after": {
    "A": 7,
    "B": 5
  },
  "point_awarded": false,
  "server_unchanged": true,
  "replay_reason": "HINDER"
}
```

---

# 104. Example — Extended Game

For a game to 11:

```text
10-10
11-10
11-11
12-11
12-12
13-12
13-13
14-13
15-13 -> GAME COMPLETE
```

Analytics should record:

```text
extended_game = true
final_score = 15-13
```

---

# 105. Recommended Analytics Dimensions

All metrics should be sliceable by:

```text
match
game
player
team
opponent
serve/receive
server_number
serve_type
fault_type
rally_length
score_state
pressure_state
competition_level
scoring_mode
rulebook_version
```

This will make future dashboards substantially easier to build.

---

# 106. Recommended Score-State Buckets

For product analytics, maintain normalized state buckets:

```text
EARLY_GAME
MID_GAME
LATE_GAME
GAME_POINT
DEUCE
EXTENDED_GAME
MATCH_POINT
```

The exact score threshold should be derived from game configuration.

Do not hard-code “late game = 8+” across every format.

---

# 107. Pressure Situation Examples

For a game to 11:

```text
10-8 -> Team A may be at game point if serving under the applicable scoring mode
10-9 -> Team A may be at game point
10-10 -> extended/deuce state
11-10 -> still not finished under win-by-two
12-10 -> game complete
```

The scoring engine should compute pressure state from:

```text
game_target
win_by
current_scores
scoring_mode
serving_side
```

---

# 108. Match Point

Match point means:

```text
the team can win the entire match by winning the current scoring opportunity
```

The implementation should derive it from:

```text
games_won
games_to_win
current_game_winning_condition
```

Do not identify match point merely because the score is 10-9.

A match can be at:

```text
game point but not match point
```

or:

```text
match point but not game point
```

depending on the game count.

---

# 109. Analytics Event Naming Convention

Use past-tense names for completed facts:

```text
RALLY_COMPLETED
GAME_COMPLETED
MATCH_COMPLETED
```

Use present/process names for state transitions:

```text
RALLY_STARTED
SERVE_CLOCK_STARTED
TIMEOUT_STARTED
```

Use explicit command-like names only for user actions:

```text
START_MATCH
RECORD_FAULT
REQUEST_REPLAY
CORRECT_SCORE
```

---

# 110. Recommended Database Separation

Separate:

### Raw facts

```text
match_events
rally_events
shot_events
```

### Canonical state

```text
match_state
game_state
service_state
```

### Derived analytics

```text
player_match_stats
team_match_stats
game_stats
rally_stats
serve_stats
return_stats
```

This prevents analytics queries from becoming the game engine.

---

# 111. Analytics Reproducibility

Every analytics row SHOULD contain:

```text
calculation_version
ruleset_version
source_event_sequence
```

Example:

```json
{
  "metric": "service_hold_rate",
  "value": 0.684,
  "ruleset_version": "2026",
  "calculation_version": "analytics-v3",
  "source_event_sequence": 912
}
```

This allows historical reports to be reproduced.

---

# 112. QA Test Matrix

The rules engine should have automated tests for at least:

### Singles

```text
even-score serve from right
odd-score serve from left
server hold
side out
game to 11
extended game
game to 15
game to 21
```

### Doubles

```text
starting 0-0-2
first server hold
first server loss
second server hold
second server loss
side out
player position parity
wrong receiver
```

### Serve

```text
illegal volley serve
legal drop serve
serve into NVZ
serve onto NVZ line
serve out
net-touching legal serve
ten-second violation
```

### Rally

```text
receiver volleys serve
server volleys return too early
second bounce
ball out
ball hits player
double hit
partner double contact
```

### NVZ

```text
legal NVZ standing
illegal volley in NVZ
momentum NVZ fault
failure to exit before volley
```

### Net

```text
net touch
net support hit
around-post return
between-post hit
under-net hit
hit before ball crosses net
legal post-hit plane crossing
```

### Replay

```text
hinder
incorrect score
position correction
invisible release
broken ball
net malfunction
```

---

# 113. Golden Test Scenarios

The following examples should exist as deterministic integration tests.

## Scenario 1 — Standard Singles

```text
Start:
A serving
score 0-0

A wins rally
=> 1-0
A remains server
serve from left

A loses rally
=> 1-0
B becomes server
```

## Scenario 2 — Standard Doubles

```text
Start:
A1 serving
score 0-0-2

A1 loses
=> 0-0
side out
B begins service
```

## Scenario 3 — Standard Doubles, First Server Holds

```text
0-0-2
A1 wins
=> 1-0-2

A1 loses
=> 1-0-1 or second-server state according to the team rotation
```

The implementation MUST store actual player identities rather than relying only on server number.

## Scenario 4 — Rally Scoring

```text
0-0
A serves
B wins rally
=> 0-1
B now serves
```

---

# 114. Important Product Principle

The rules engine should distinguish these three questions:

```text
Who won the rally?
Who received the point?
Who serves next?
```

They are:

- identical in rally scoring often,
- but not identical in standard side-out scoring.

This distinction is the foundation of correct pickleball analytics.

---

# 115. Recommended Canonical Function Boundaries

The production rules service should expose functions similar to:

```ts
getCurrentServer(state)
getExpectedServingArea(state)
getExpectedReceiver(state)

validateServe(state, serveEvent)
validateReturn(state, returnEvent)

resolveFault(state, fault)
resolveReplay(state, replay)

applyRallyResult(state, rallyResult)

shouldAwardPoint(state, rallyResult)

advanceService(state, rallyResult)

shouldEndGame(state)
shouldEndMatch(state)

calculatePressureState(state)

calculateGamePoint(state)
calculateMatchPoint(state)
```

Each function should be deterministic and unit tested.

---

# 116. Rules vs Analytics Boundary

Official game rules determine:

```text
fault
replay
point
side out
server
receiver
game end
match end
```

Analytics determines:

```text
performance
efficiency
patterns
rates
trends
momentum
shot classification
```

Analytics MUST NOT modify official scoring state.

---

# 117. Recommended Default for PickleUP

Unless a different match format is explicitly selected:

```yaml
rulebook:
  provider: USA_PICKLEBALL
  version: "2026"

competition_level: CASUAL

format:
  type: BEST_OF_3
  games_to_win: 2
  game_target: 11
  win_by: 2
  score_cap: null

scoring:
  mode: SIDE_OUT

doubles:
  start_server_number: 2
  server_count: 2

timing:
  enforce_ten_second_rule: false
```

This is a **PickleUP product default**, not a claim that every pickleball match uses these exact settings.

For official/tournament modes, use the selected tournament configuration.

---

# 118. Tournament Rule Support

The 2026 USA Pickleball rules allow tournament scoring formats including:

```text
best 2-of-3 to 11
best 3-of-5 to 11
one game to 15
one game to 21
one game to 11 in qualifying round-robin contexts
```

Rally scoring is also provisionally available for specified tournament formats, with documented exceptions.

PickleUP SHOULD therefore make the tournament configuration explicit rather than assuming standard recreational scoring.

---

# 119. What This File Is Not

This file is not intended to replace the official USA Pickleball rulebook.

It is an **application implementation specification** based on the 2026 rules and adapted for:

- digital scoring,
- event sourcing,
- validation,
- analytics,
- dashboards,
- automated QA,
- and future ruleset versioning.

Where a tournament/officiating edge case is not implemented, the product should record that the case requires manual/officiated resolution instead of guessing.

---

# 120. Source References

Primary:

- USA Pickleball — Official Rules: https://usapickleball.org/rules/
- 2026 USA Pickleball Official Rulebook: https://fliphtml5.com/cksih/USAP-Official-Rulebook/

Relevant 2026 rule sections:

```text
Section 1   The Game
Section 3   Court and Equipment
Section 4   Point Scoring
Section 5   Player Positions and Serving Sequence
Section 6   Player Readiness and Calling the Score
Section 7   Serving
Section 8   Line Calls
Section 9   Dead Balls, Faults, and Hinders
Section 10  Rally Situations
Section 11  Non-Volley Zone Infractions
Section 12  The Paddle During Play
Section 13  The Net and Net Support System During Play
Section 14  Variations on Standard Pickleball
Section 15  Tournament Event and Scoring Options
Section 21  Time-Outs and Breaks
Section 22  Unsportsmanlike Conduct and Related Penalties
Section 23  Retirements and Withdrawals
Section 25  Wheelchair, Adaptive Standing and Hybrid Doubles Play
Appendix A  Faults and Replays
```

---

# 121. Final Implementation Rule

**Never calculate a score from a UI snapshot.**

The score must be the result of applying the configured ruleset to an ordered event stream.

Conceptually:

```text
EVENTS
  ↓
RULE ENGINE
  ↓
CANONICAL MATCH STATE
  ↓
GAME STATE
  ↓
RALLY/PLAYER ANALYTICS
  ↓
UI + REPORTS
```

This is the architecture that keeps scorekeeping, live match UI, replay, historical correction, and analytics consistent.
