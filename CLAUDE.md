# CLAUDE.md - AI Assistant Guide for Egyptian Rat Screw

This document provides comprehensive guidance for AI assistants working on this codebase. Last updated: 2025-11-18

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Directory Structure](#directory-structure)
5. [Development Workflow](#development-workflow)
6. [Key Conventions](#key-conventions)
7. [Common Tasks](#common-tasks)
8. [Important Files Reference](#important-files-reference)

---

## Project Overview

**Online Egyptian Rat Screw** is a real-time multiplayer card game built as a TypeScript monorepo. The game implements the fast-paced card game Egyptian Rat Screw with custom slap rules, face card challenges, and a voting system.

### Key Features
- Real-time multiplayer via WebSocket
- Flexible rule engine for custom slap conditions
- Bot/AI player support
- Lobby system for game management
- Vote-based game actions
- Animated UI with sprite support

### Monorepo Structure
- **Package Manager:** pnpm 9.1.0 with workspaces
- **Build System:** Turbo 2.4.4
- **Code Quality:** Biome 2.0.0 (formatter + linter)
- **Apps:** Client (React + Vite), Server (Express + WebSocket)
- **Packages:** Shared types, message system, configuration

---

## Tech Stack

### Frontend
- **Framework:** React 18.2.0 with TypeScript 5.0
- **Build Tool:** Vite 4.4.5
- **State Management:** Zustand 5.0.0-rc.2
- **UI Libraries:** Mantine UI 7.16.0, DaisyUI 5.0.43, Tailwind CSS 4.1.11
- **Animation:** Framer Motion 11.5.4
- **Communication:** Native WebSocket API

### Backend
- **Runtime:** Node.js 20
- **Framework:** Express 4.18.2
- **WebSocket:** ws 8.18.0
- **Logging:** Pino 9.4.0 + pino-pretty 11.2.2
- **Utilities:** uuid, compression, cors

### Development Tools
- **TypeScript:** Target ES2022, Module NodeNext
- **Testing:** Cypress 14.1.0 (E2E tests)
- **Dev Tools:** tsx 3.12.7, nodemon 3.1.7, concurrently 9.0.1

---

## Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Client                       │
│  React UI + Zustand Stores + WebSocket MessageClient  │
└────────────────────┬────────────────────────────────────┘
                     │ WebSocket (ws://)
                     │
┌────────────────────▼────────────────────────────────────┐
│              Express + WebSocket Server                 │
│  MessageServer → GameManager → Game → Services        │
└─────────────────────────────────────────────────────────┘
```

### Server Architecture Layers

```
WebSocket Connection
    ↓
MessageServer (Room/Messenger pattern from @oer/message)
    ↓
MessageHandlers (Event dispatcher)
    ↓
GameManager (Singleton managing all games)
    ↓
Game (Public API) → GameCore (Internal orchestrator)
    ↓
Service Managers:
    ├── CardPlayManager (turn-based card playing)
    ├── SlappingService (slap validation via RuleEngine)
    ├── FaceCardService (J/Q/K/A challenges)
    ├── WinConditionManager (game end detection)
    └── VotingSystem (player voting)
    ↓
Models: Player, Deck, Game state
    ↓
GameNotifier (broadcasts to all clients)
```

### Client Architecture Layers

```
WebSocket
    ↓
MessageClient (Wrapper around Messenger from @oer/message)
    ↓
Api (Singleton with methods for each game action)
    ↓
ApiContext (React Context provider)
    ↓
Zustand Stores:
    ├── useGameStore (game state, players, cards)
    ├── useApplicationStore (user location, local player)
    └── useLobbyStore (available games, lobby players)
    ↓
React Components
```

### Message Flow Example: Playing a Card

1. User clicks "Play Card" in `GameBoard.tsx`
2. `useGameStore.playCard()` called
3. `api.playCard()` sends `PLAY_CARD` WebSocket event
4. Server `GameManager` routes to appropriate `Game` instance
5. `CardPlayManager.handlePlayCard()` executes:
   - Validates turn
   - Removes card from player hand
   - Adds card to central pile
   - Advances turn
   - Logs action to `GameEventLogger`
6. `GameNotifier` broadcasts:
   - `CARD_PLAYED` event
   - `TURN_CHANGED` event
   - `GAME_STATE_UPDATED` with full state
7. Client `MessageClient` receives events
8. Zustand stores update
9. React components re-render
10. Animation plays

---

## Directory Structure

```
egyptian-rat-screw/
├── apps/
│   ├── client/                    # React frontend
│   │   ├── src/
│   │   │   ├── App.tsx           # Main app with ApiProvider
│   │   │   ├── client.tsx        # React DOM entry
│   │   │   ├── api.ts            # WebSocket API client singleton
│   │   │   ├── logger.ts         # Client logging
│   │   │   ├── contexts/
│   │   │   │   └── ApiContext.tsx
│   │   │   ├── store/
│   │   │   │   ├── useApplicationStore.ts
│   │   │   │   ├── useGameStore.ts
│   │   │   │   └── useLobbyStore.ts
│   │   │   ├── hooks/
│   │   │   │   ├── useLocalStorage.ts
│   │   │   │   ├── useHotkeys.ts
│   │   │   │   └── useSprite.ts
│   │   │   ├── components/
│   │   │   │   ├── AppContainer.tsx
│   │   │   │   ├── Lobby.tsx
│   │   │   │   ├── PreGame.tsx
│   │   │   │   ├── Game.tsx
│   │   │   │   ├── GameBoard.tsx
│   │   │   │   ├── PlayerActions.tsx
│   │   │   │   ├── CardStack.tsx
│   │   │   │   └── PlayingCard.tsx
│   │   │   └── message/
│   │   │       └── client.ts    # MessageClient wrapper
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── server/                   # Express + WebSocket backend
│       ├── src/
│       │   ├── index.ts         # Main entry: Express + WS setup
│       │   ├── logger.ts        # Pino logger config
│       │   ├── bot/
│       │   │   └── index.ts     # AI bot player
│       │   ├── manager/
│       │   │   └── GameManager.ts  # Singleton game manager
│       │   ├── message/
│       │   │   ├── messageServer.ts
│       │   │   ├── messageHandlers.ts
│       │   │   └── utils.ts
│       │   ├── game/
│       │   │   ├── GameCore.ts     # Core game orchestrator
│       │   │   ├── Game.ts         # Public game API
│       │   │   ├── GameNotifier.ts # State broadcaster
│       │   │   ├── GameEventLogger.ts
│       │   │   ├── VotingSystem.ts
│       │   │   ├── models/
│       │   │   │   ├── Player.ts
│       │   │   │   └── Deck.ts
│       │   │   ├── rules/
│       │   │   │   ├── RuleEngine.ts   # Slap validation
│       │   │   │   ├── SlapRules.ts    # Default rules
│       │   │   │   └── Condition.ts
│       │   │   └── services/
│       │   │       ├── CardPlayManager.ts
│       │   │       ├── SlappingService.ts
│       │   │       ├── FaceCardService.ts
│       │   │       └── WinConditionManager.ts
│       │   └── cypress/e2e/        # Cypress tests
│       └── package.json
│
├── packages/                      # Shared workspace packages
│   ├── configuration/
│   │   └── src/index.ts          # App settings (ports, log level)
│   ├── message/
│   │   └── src/index.ts          # Messenger, Room classes
│   └── shared/
│       └── src/
│           ├── types.ts          # Card, Player, Game types
│           └── socketEvents.ts   # WebSocket event definitions
│
├── biome.json                    # Formatter + linter config
├── turbo.json                    # Monorepo build orchestration
├── pnpm-workspace.yaml           # pnpm workspace config
├── package.json                  # Root package
├── dockerfile                    # Multi-stage Docker build
└── README.md
```

---

## Development Workflow

### Installation

```bash
pnpm install
```

### Running Locally

**Development mode (recommended):**
```bash
pnpm dev
```
- Starts client (Vite) on http://localhost:3000
- Starts server (Express + WS) on http://localhost:8000
- Client proxies to server in dev
- Access at: http://localhost:8000

**Production mode:**
```bash
pnpm build      # Build all apps
pnpm start      # Start production server
```

### Available Scripts

**Root level:**
- `pnpm dev` - Run all apps in dev mode
- `pnpm build` - Build all apps
- `pnpm start` - Start production server
- `pnpm format-and-lint` - Check code style
- `pnpm format-and-lint:fix` - Fix code style issues
- `pnpm clean` - Remove dist directories
- `pnpm clean:full` - Remove dist + node_modules
- `pnpm test` - Run tests (server Cypress)

**Client app:**
- `pnpm --filter @oer/client dev` - Dev server only
- `pnpm --filter @oer/client build` - Build only
- `pnpm --filter @oer/client typecheck` - Type check only

**Server app:**
- `pnpm --filter @oer/server dev` - Dev server only
- `pnpm --filter @oer/server build` - Build only
- `pnpm --filter @oer/server start` - Start built server
- `pnpm --filter @oer/server test` - Open Cypress

### Testing

**Cypress E2E tests:**
```bash
pnpm test              # Opens Cypress UI
pnpm cy:open          # Same as above
```

**Test files:**
- `apps/server/cypress/e2e/game.cy.ts` - Game logic tests
- `apps/server/cypress/e2e/index.cy.ts` - UI/integration tests

**Custom Cypress commands:**
- `cy.createPlayer(id, name, gameId?)` - Create test player
- `cy.setPlayerReady(id)` - Mark player ready
- `cy.disconnectPlayer(id)` - Disconnect player
- `cy.createGameAsHost(hostName)` - Create game via UI
- `cy.slapCard(id?)` - Simulate slap action

**Testing endpoints (dev mode only):**
- `GET /connect?url=ws://...&id=player-id` - Create test WS connection
- `GET /message?id=player-id&m=JSON_MESSAGE` - Send message
- `GET /disconnect?id=player-id` - Disconnect player
- `GET /disconnect-all` - Disconnect all test players

### Code Quality

**Format and lint:**
```bash
pnpm format-and-lint        # Check only
pnpm format-and-lint:fix    # Fix issues
```

**Biome configuration (`biome.json`):**
- Tab indentation (size: 2)
- Double quotes
- Trailing commas (all)
- Organize imports
- No unused imports
- Warns on explicit `any`
- Multiline attribute positioning

---

## Key Conventions

### Naming Conventions

- **Files:** camelCase (except React components: PascalCase)
- **Functions:** camelCase
- **Classes/Components:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **React hooks:** `useXxx`
- **Zustand stores:** `useXxxStore`
- **Event handlers:** `handleXxx`
- **Getters:** `getXxx`, `isXxx`, `hasXxx`

### Code Organization

1. **No barrel exports** - Import each module explicitly (enforced by Biome)
2. **Strict TypeScript** - No `any` types, all types defined upfront
3. **Monorepo imports** - Use `workspace:*` protocol in package.json
4. **Named exports** - Prefer named exports over default
5. **Separation of concerns** - Hooks, services, managers separate from UI

### TypeScript

- **Target:** ES2022
- **Module:** NodeNext (ESM)
- **Strict mode:** Enabled
- **Source maps:** Enabled
- **Declaration files:** Generated for packages

### WebSocket Events

All events defined in `packages/shared/src/socketEvents.ts`:

**Connection events:**
- `CONNECT`, `DISCONNECT`, `DISCONNECTING`

**Lobby events:**
- `JOIN_LOBBY`, `LEAVE_LOBBY`
- `LOBBY_GAME_UPDATE`, `LOBBY_PLAYER_UPDATE`

**Game lifecycle:**
- `CREATE_GAME`, `JOIN_GAME`, `LEAVE_GAME`
- `GAME_CREATED`, `GAME_STARTED`, `GAME_ENDED`
- `GAME_STATE_UPDATED`, `PLAYER_JOINED_GAME`, `PLAYER_LEFT_GAME`

**Game actions:**
- `PLAY_CARD`, `SLAP_PILE`, `PLAYER_READY`, `LEAVE_GAME`
- `SET_GAME_SETTINGS`, `START_GAME_VOTING`, `RESTART_GAME`
- `CARD_PLAYED`, `SLAP_RESULT`, `TURN_CHANGED`

**Voting:**
- `VOTE_STARTED`, `VOTE_UPDATED`, `VOTE_ENDED`, `SUBMIT_VOTE`

**Special:**
- `ADD_BOT`, `NOTIFICATION`, `ERROR`

All events have strictly typed payloads via `ISocketPayloads` interface.

### Shared Types

Defined in `packages/shared/src/types.ts`:

**Core types:**
- `Card` - id, code, suit, rank
- `Player` - id, name, isBot, cardCount, status, settings
- `GameStatus` - 11 possible states (enum)
- `GameSettings` - rules, player limits, slap conditions
- `SlapRule` - name, conditions, action
- `Condition` - field, operator, value
- `Vote` - playerId, choice
- `VoteState` - topic, votes, startTime
- `GameAction` - type, playerId, metadata, timestamp

**Important enums:**
- `GameStatus`: WAITING_FOR_PLAYERS, PRE_GAME, IN_PROGRESS, FACE_CARD_SEQUENCE, GAME_OVER, etc.
- `GameActionType`: ADD_PLAYER, REMOVE_PLAYER, PLAY_CARD, VALID_SLAP, INVALID_SLAP, etc.
- `SlapRuleAction`: TAKE_PILE, SKIP, DRINK, DRINK_ALL

### State Management

**Server state (in GameCore):**
- `players: Player[]` - All players
- `turnIndex: number` - Current player index
- `centralPile: Card[]` - Cards in center
- `status: GameStatus` - Current phase
- `winner: PlayerInfo | null` - Game winner
- `settings: GameSettings` - Game rules

**Client state (Zustand):**

`useGameStore`:
- `gameState: ClientGameState | null`
- `isLocalPlayerTurn: boolean`
- `isGameStarting: boolean`
- `isCardPlayedAnimationVisible: boolean`

`useApplicationStore`:
- `localPlayer: PlayerInfo | null`
- `userLocation: "lobby" | "game"`
- `userSettings: PlayerSettings`

`useLobbyStore`:
- `games: GameInfo[]`
- `players: PlayerInfo[]`

### Error Handling

- Server errors emitted via `SocketEvents.ERROR`
- Client displays errors using Mantine notifications
- All async operations wrapped in try-catch
- Logging via Pino (server) and custom logger (client)

### Logging

**Server (Pino):**
```typescript
logger.info("Message");
logger.error("Error message");
logger.debug("Debug info");
```

**Client:**
```typescript
logger.info("Message");
logger.error("Error message");
logger.debug("Debug info");
```

Log levels: `error`, `warn`, `info`, `debug`
Configurable via `SETTINGS.LOG_LEVEL` in `packages/configuration`

---

## Common Tasks

### Adding a New Socket Event

1. **Define event in `packages/shared/src/socketEvents.ts`:**
   ```typescript
   export enum SocketEvents {
       // ... existing events
       MY_NEW_EVENT = "MY_NEW_EVENT",
   }

   export interface ISocketPayloads {
       // ... existing payloads
       [SocketEvents.MY_NEW_EVENT]: {
           someField: string;
       };
   }
   ```

2. **Add server handler in `apps/server/src/message/messageHandlers.ts`:**
   ```typescript
   messenger.on(SocketEvents.MY_NEW_EVENT, (data) => {
       // Handle event
       gameManager.handleMyNewEvent(messenger, data);
   });
   ```

3. **Add client method in `apps/client/src/api.ts`:**
   ```typescript
   public myNewAction(someField: string): void {
       this.client.emit(SocketEvents.MY_NEW_EVENT, { someField });
   }
   ```

4. **Use in component:**
   ```typescript
   const api = useApi();
   api.myNewAction("value");
   ```

### Adding a New Slap Rule

1. **Define rule in `apps/server/src/game/rules/SlapRules.ts`:**
   ```typescript
   export const myNewRule: SlapRule = {
       name: "My New Rule",
       conditions: [
           {
               field: "centralPile[0].rank",
               operator: "===",
               value: "A",
           },
       ],
       action: SlapRuleAction.TAKE_PILE,
   };
   ```

2. **Add to default rules array:**
   ```typescript
   export const defaultSlapRules: SlapRule[] = [
       // ... existing rules
       myNewRule,
   ];
   ```

### Adding a New Game Service

1. **Create service file in `apps/server/src/game/services/`:**
   ```typescript
   import type { Messenger } from "@oer/message";
   import type { GameCore } from "../GameCore";

   export class MyNewService {
       constructor(private gameCore: GameCore) {}

       public handleMyAction(messenger: Messenger): void {
           // Service logic
       }
   }
   ```

2. **Initialize in `GameCore.ts`:**
   ```typescript
   private myNewService: MyNewService;

   constructor(...) {
       // ... other services
       this.myNewService = new MyNewService(this);
   }
   ```

3. **Add public method in `Game.ts`:**
   ```typescript
   public myAction(messenger: Messenger): void {
       this.gameCore.myNewService.handleMyAction(messenger);
   }
   ```

### Adding a New React Component

1. **Create component file in `apps/client/src/components/`:**
   ```typescript
   import { type FC } from "react";

   interface MyComponentProps {
       title: string;
   }

   export const MyComponent: FC<MyComponentProps> = ({ title }) => {
       return <div>{title}</div>;
   };
   ```

2. **Use in parent component:**
   ```typescript
   import { MyComponent } from "./MyComponent";

   <MyComponent title="Hello" />
   ```

### Adding a New Zustand Store State

1. **Update store interface in `apps/client/src/store/useXxxStore.ts`:**
   ```typescript
   interface XxxStore {
       // ... existing state
       myNewField: string;
       setMyNewField: (value: string) => void;
   }
   ```

2. **Add to store implementation:**
   ```typescript
   export const useXxxStore = create<XxxStore>((set) => ({
       // ... existing state
       myNewField: "",
       setMyNewField: (value) => set({ myNewField: value }),
   }));
   ```

3. **Use in component:**
   ```typescript
   const myNewField = useXxxStore((state) => state.myNewField);
   const setMyNewField = useXxxStore((state) => state.setMyNewField);
   ```

### Modifying Game Settings

Game settings are defined in `packages/shared/src/types.ts`:

```typescript
export interface GameSettings {
    minPlayers: number;
    maxPlayers: number;
    slapRules: SlapRule[];
    faceCardCounts: Record<string, number>;
    challengeCounterCards: string[];
}
```

To add a new setting:

1. Add field to `GameSettings` interface
2. Update default settings in `apps/server/src/game/GameCore.ts`
3. Update client UI in `apps/client/src/components/GameSettingsDrawer.tsx`
4. Handle in `SET_GAME_SETTINGS` event handler

### Running Database Migrations

**Note:** This project currently does not use a database. Game state is in-memory.

If you need to add persistence:
1. Choose database (PostgreSQL, MongoDB, etc.)
2. Add ORM/ODM (Prisma, TypeORM, Mongoose, etc.)
3. Create migration system
4. Update GameManager to persist/restore state

### Debugging WebSocket Communication

**Server-side:**
```typescript
messenger.on(SocketEvents.ANY_EVENT, (data) => {
    logger.debug(`Received ${SocketEvents.ANY_EVENT}:`, data);
});
```

**Client-side:**
```typescript
// In MessageClient constructor
this.client.on(SocketEvents.ANY_EVENT, (data) => {
    logger.debug(`Received ${SocketEvents.ANY_EVENT}:`, data);
});
```

**Browser DevTools:**
- Open Network tab
- Filter by WS (WebSocket)
- Click connection to see messages
- Use `api.client` to access WebSocket instance

---

## Important Files Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `/biome.json` | Code formatter and linter config |
| `/turbo.json` | Monorepo build orchestration |
| `/pnpm-workspace.yaml` | pnpm workspace config |
| `/package.json` | Root package with scripts |
| `/dockerfile` | Multi-stage Docker build |
| `/apps/client/vite.config.ts` | Vite build config |
| `/apps/client/tsconfig.json` | Client TypeScript config |
| `/apps/server/tsconfig.json` | Server TypeScript config |

### Core Application Files

| File | Purpose |
|------|---------|
| `/apps/server/src/index.ts` | Server entry point |
| `/apps/server/src/manager/GameManager.ts` | Singleton managing all games |
| `/apps/server/src/game/GameCore.ts` | Core game logic orchestrator |
| `/apps/server/src/game/Game.ts` | Public game API |
| `/apps/server/src/message/messageHandlers.ts` | WebSocket event handlers |
| `/apps/client/src/client.tsx` | Client React entry point |
| `/apps/client/src/App.tsx` | Main app component |
| `/apps/client/src/api.ts` | WebSocket API client singleton |

### Shared Packages

| File | Purpose |
|------|---------|
| `/packages/shared/src/types.ts` | Shared TypeScript types |
| `/packages/shared/src/socketEvents.ts` | WebSocket event definitions |
| `/packages/message/src/index.ts` | Message/Room communication system |
| `/packages/configuration/src/index.ts` | App configuration settings |

### Game Logic

| File | Purpose |
|------|---------|
| `/apps/server/src/game/services/CardPlayManager.ts` | Turn-based card playing |
| `/apps/server/src/game/services/SlappingService.ts` | Slap validation |
| `/apps/server/src/game/services/FaceCardService.ts` | Face card challenges |
| `/apps/server/src/game/rules/RuleEngine.ts` | Rule condition evaluator |
| `/apps/server/src/game/rules/SlapRules.ts` | Default slap rules |
| `/apps/server/src/game/models/Player.ts` | Player model |
| `/apps/server/src/game/models/Deck.ts` | Card deck |
| `/apps/server/src/game/VotingSystem.ts` | Voting mechanism |
| `/apps/server/src/game/GameNotifier.ts` | State broadcaster |

### Client State & UI

| File | Purpose |
|------|---------|
| `/apps/client/src/store/useGameStore.ts` | Game state management |
| `/apps/client/src/store/useApplicationStore.ts` | App-wide state |
| `/apps/client/src/store/useLobbyStore.ts` | Lobby state |
| `/apps/client/src/contexts/ApiContext.tsx` | API context provider |
| `/apps/client/src/components/Game.tsx` | Main game view |
| `/apps/client/src/components/GameBoard.tsx` | Game board UI |
| `/apps/client/src/components/Lobby.tsx` | Lobby UI |
| `/apps/client/src/components/PlayerActions.tsx` | Player action buttons |

### Testing

| File | Purpose |
|------|---------|
| `/apps/server/cypress/e2e/game.cy.ts` | Game logic tests |
| `/apps/server/cypress/e2e/index.cy.ts` | UI integration tests |

---

## Game-Specific Knowledge

### Slap Rules

The game supports customizable slap rules. Default rules include:

1. **Pair** - Two consecutive cards with same rank
2. **Sandwich** - Same rank cards with one card between
3. **Triple** - Three consecutive cards with same rank
4. **Run of Three** - Three consecutive ranks (e.g., 5-6-7)
5. **Marriage** - King and Queen (any suits)
6. **Divorce** - King of Spades + Queen of Hearts
7. **Ten-Jack** - Ten followed by Jack
8. **Four in a Row** - Four cards same suit

Rules are defined with conditions and actions:
- **Actions:** TAKE_PILE, SKIP, DRINK, DRINK_ALL
- **Operators:** ===, !==, >, <, >=, <=, in
- **Fields:** Can reference `centralPile[n].rank`, `centralPile[n].suit`, etc.

### Face Card Challenges

When a face card (J/Q/K/A) is played:
1. Next player must play another face card or exhaust their chances
2. Chances given: J=1, Q=2, K=3, A=4
3. If successful counter-challenge: Pile goes to counter-challenger
4. If failed: Pile goes to original face card player
5. Can be interrupted by valid slap

Counter cards (default: "10") can extend the challenge when played.

### Game Status Flow

```
WAITING_FOR_PLAYERS
    ↓ (all players ready)
PRE_GAME
    ↓ (start game)
IN_PROGRESS
    ↓ (face card played)
FACE_CARD_SEQUENCE
    ↓ (challenge resolved or slapped)
IN_PROGRESS
    ↓ (player out of cards)
GAME_OVER
    ↓ (restart vote)
WAITING_FOR_PLAYERS
```

### Voting System

Players can vote on:
- Starting the game
- Restarting the game
- Changing game settings
- Kicking players (future)

Vote passes when majority (>50%) votes YES.

---

## Performance Considerations

### Server
- Games are in-memory (no database)
- O(1) game lookups via Map
- O(n) player searches within game
- WebSocket broadcasts use Room pattern (efficient multicast)

### Client
- Zustand stores use selectors for fine-grained updates
- Mantine components are optimized
- Vite code-splits automatically
- Animation throttling via `useThrottledCallback`

### Build Optimization
- Turbo caching speeds up rebuilds
- Multi-stage Docker build minimizes image size
- Production serves pre-built static assets
- Compression middleware reduces payload size

---

## Deployment

### Docker

**Build:**
```bash
docker build -t egyptian-rat-screw .
```

**Run:**
```bash
docker run -p 3000:3000 egyptian-rat-screw
```

**Environment variables:**
- `NODE_ENV` - production/development (default: development)
- `PORT` - Server port (default: 8000)
- `APP_ENV` - App environment for config

### Production Checklist

- [ ] Run `pnpm build` successfully
- [ ] Run `pnpm format-and-lint` with no errors
- [ ] Run `pnpm test` (all Cypress tests pass)
- [ ] Set `NODE_ENV=production`
- [ ] Configure reverse proxy (nginx/caddy)
- [ ] Set up HTTPS/TLS for WebSocket
- [ ] Configure CORS for production domain
- [ ] Set up monitoring/logging
- [ ] Configure environment variables
- [ ] Test WebSocket connectivity

---

## Troubleshooting

### Common Issues

**WebSocket connection fails:**
- Check server is running on correct port
- Verify WS_SERVER_URL in client config
- Check CORS settings
- Ensure no firewall blocking WebSocket

**Turbo build fails:**
- Run `pnpm clean:full` to reset
- Check for TypeScript errors: `pnpm typecheck`
- Verify all workspace dependencies installed

**Client can't connect to server in dev:**
- Ensure server started before client
- Check Vite proxy config in `vite.config.ts`
- Verify ports 3000 and 8000 not in use

**Biome linting errors:**
- Run `pnpm format-and-lint:fix` to auto-fix
- Check for unused imports
- Verify tab indentation (not spaces)

**State not updating in React:**
- Check Zustand store subscription
- Verify WebSocket events received (Network tab)
- Ensure proper store selectors used

---

## Additional Resources

- **README.md** - Project overview and structure
- **Biome Docs** - https://biomejs.dev/
- **Turbo Docs** - https://turbo.build/repo/docs
- **Zustand Docs** - https://docs.pmnd.rs/zustand/
- **Mantine Docs** - https://mantine.dev/
- **WebSocket API** - https://developer.mozilla.org/en-US/docs/Web/API/WebSocket

---

## Contributing Guidelines

When making changes:

1. **Follow existing patterns** - Match code style and architecture
2. **Use TypeScript strictly** - No `any` types
3. **Update types** - Keep shared types in sync
4. **Test changes** - Add/update Cypress tests
5. **Format code** - Run `pnpm format-and-lint:fix` before commit
6. **Document changes** - Update this file if architecture changes
7. **Keep monorepo clean** - Don't add dependencies to root unnecessarily

---

## Questions?

If you encounter issues or need clarification on any part of the codebase, check:

1. Relevant source files (see Important Files Reference)
2. Type definitions in `packages/shared/src/types.ts`
3. Socket events in `packages/shared/src/socketEvents.ts`
4. Existing tests in `apps/server/cypress/e2e/`
5. README.md for high-level overview

For AI assistants: When unsure, read the relevant source files directly rather than making assumptions. The codebase is well-typed and self-documenting through TypeScript interfaces.