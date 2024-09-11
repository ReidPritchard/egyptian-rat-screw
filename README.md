# Online Egyptian Rat Screw

![Current UI](./docs/images/current-ui.png)

## Project Structure

### Overview

This project is organized as follows:

```
Server:
+------------------+     +------------------+     +------------------+
|      Lobby       |     |      Game        |     |      Deck        |
|------------------|     |------------------|     |------------------|
| - players        |     | - players        |     | - cards          |
| - gameInstance   |     | - deck           |     | - shuffle()      |
| - createGame()   |     | - pile           |     | - deal()         |
| - joinGame()     |     | - currentPlayer  |     +------------------+
+------------------+     | - slapRules      |
                         | - playCard()     |
                         | - checkSlap()    |
                         | - updateState()  |
                         +------------------+

Client:
+------------------+     +------------------+
|   ClientPlayer   |     |    ClientGame    |
|------------------|     |------------------|
| - id             |     | - gameState      |
| - name           |     | - localPlayer    |
| - hand (hidden)  |     | - otherPlayers   |
| - playCard()     |     | - pile           |
| - slap()         |     | - updateUI()     |
+------------------+     +------------------+
```

### Packages

- 

### Apps

- 

## Installation

To install the game, follow these steps:

1. 

## Contributing

Contributions are welcome!

## License

This project is licensed under the MIT License.
