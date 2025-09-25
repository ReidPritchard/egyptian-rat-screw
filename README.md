# Online Egyptian Rat Screw

![Current UI](https://github.com/user-attachments/assets/196acbd3-534a-470d-998d-07f2a80402cc)

![Current In-Game](https://github.com/user-attachments/assets/a767c5d1-40fd-4613-be59-7c6bf2692726)

## Project Structure

### Overview

This is a monorepo built with pnpm workspaces and Turbo, organized into two main applications (`apps/`) and shared packages (`packages/`).

### Applications

#### Server (`apps/server/`)

The server-side code is located in the `apps/server/src` directory:

- `index.ts`: The main entry point for the server, setting up the Express app and Socket.IO server.
- `logger.ts`: Logging utilities for the server.
- `manager/GameManager.ts`: Manages the creation and tracking of game instances.
- `game/GameCore.ts`: Implements the core game logic and state management for individual game instances.
- `game/GameEventLogger.ts`: Handles logging of game events.
- `game/GameNotifier.ts`: Manages notifications to players.
- `game/VotingSystem.ts`: Implements the voting mechanism for game actions.
- `game/models/`: Contains data models for game entities.
- `game/rules/`: Handles the game rules and validates player actions.
- `game/services/`: Contains game service layers.

#### Client (`apps/client/`)

The client-side code is a React/TypeScript application built with Vite:

- `src/client.tsx`: The main entry point for the React application.
- `src/App.tsx`: The main App component.
- `src/components/`: Reusable UI components including the Sprite component for game graphics.
- `src/hooks/`: Custom React hooks like `useSprite` for sprite management.
- `src/contexts/`: React context providers for state management.
- `src/store/`: Application state management.

### Shared Packages

#### Configuration (`packages/configuration/`)

Contains shared configuration settings including server ports, logging levels, and name generators.

#### Shared (`packages/shared/`)

- `socketEvents.ts`: Defines the socket event types used for communication between the server and clients.
- `types.ts`: Defines TypeScript interfaces and types used throughout both client and server.

#### Message (`packages/message/`)

Handles message passing and communication utilities.

### Key Components

1. **Game Management**
   The `GameManager` class in `apps/server/src/manager/GameManager.ts` is responsible for creating, tracking, and managing game instances. It handles player joins, leaves, and coordinates game actions. It also manages the lobby state and player information.

2. **Game Logic**
   The `GameCore` class in `apps/server/src/game/GameCore.ts` implements the core game logic, including:

   - Turn management
   - Card playing
   - Slap handling
   - Face card challenges
   - Integration with the voting system

3. **Voting System**
   The `VotingSystem` class in `apps/server/src/game/VotingSystem.ts` manages voting mechanisms for game actions, adding an element of group decision-making to the gameplay.

4. **Event System**
   - `GameEventLogger` handles logging of all game events
   - `GameNotifier` manages real-time notifications to players via Socket.IO

5. **Client-Side Components**
   The React client includes:
   - Sprite system for pixelated game graphics (`Sprite` component and `useSprite` hook)
   - Real-time state management and Socket.IO integration
   - Responsive UI built with Tailwind CSS and DaisyUI

6. **Type Definitions**
   Shared TypeScript interfaces and types in `packages/shared/src/types.ts` ensure type safety and consistency across the entire application.

7. **Configuration Management**
   The `packages/configuration` package centralizes all configuration settings, including server ports, logging levels, and game-specific generators.

### Key Features

1. **Real-time Multiplayer**
   The game uses Socket.IO for real-time communication between the server and clients, enabling instant updates and responsive gameplay.

2. **Modern Monorepo Architecture**
   Built with pnpm workspaces and Turbo for efficient development and building, with shared packages for code reuse.

3. **Pixelated Game Graphics**
   Custom sprite system supporting Aseprite JSON format for authentic retro gaming visuals with proper sprite frame management.

4. **Lobby System**
   Players can join a lobby before entering a game, allowing for game setup and player management.

5. **Voting Mechanism**
   The game includes a comprehensive voting system for certain game actions, adding an element of group decision-making to the gameplay.

6. **Event-Driven Architecture**
   Comprehensive event logging and notification system for tracking game state and player actions.

7. **Type-Safe Development**
   Full TypeScript implementation with shared types across client and server for enhanced development experience and runtime safety.

8. **Modern Frontend**
   React-based client with Vite bundling, Tailwind CSS styling, and DaisyUI components for a polished user interface.
