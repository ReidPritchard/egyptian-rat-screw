# Online Egyptian Rat Screw

![Current UI](./docs/images/current-ui.png)

## Project Structure

This project is organized as follows:

### Packages

- `game-core`: Contains the core game logic and rules.
- `logger`: Contains the logger utility (used for debugging, but honestly not that useful).
- `config-eslint/typescript`: Contains shared ESLint and Typescript configuration files.
- `jest-preset`: Contains shared Jest configuration files (not currently used).

### Apps

- `api`: Contains the server-side code for both REST and WebSocket APIs.
- `frontend`: Contains the client-side code for the game written in Svelte.

## Installation

To install the game, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory.
3. Run `yarn` to install the dependencies.
4. Run `yarn dev` to start both the server and client. The urls for the server and client will be displayed in the terminal.

## Contributing

Contributions are welcome!

## License

This project is licensed under the MIT License.
