# P2P Coin Flip Gambling System

A peer-to-peer coin flip gambling web application where two players can place bets and compete in a fair, computer-generated coin flip.

## 🎮 Features

- **Peer-to-Peer Betting**: Two players can create and join games
- **Quick Join**: See available games directly on the main page and join with one click
- **Fair Random Generation**: Cryptographically secure random coin flips
- **Real-time Updates**: Live game state updates using Gun.js P2P network
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Mobile Friendly**: Optimized for all device sizes
- **Cross-Browser Sync**: Games sync in real-time across different browsers

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **P2P Network**: Gun.js for real-time data synchronization
- **Build Tool**: Vite
- **Package Manager**: pnpm
- **Deployment**: GitHub Pages
- **Styling**: Modern CSS with animations and glass morphism

## 🚀 Getting Started

### Prerequisites
- Node.js (18+)
- pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/p2p-coinflip.git
cd p2p-coinflip

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Building for Production

```bash
# Build the project
pnpm run build

# Preview the build
pnpm run preview
```

### Deployment

The project is automatically deployed to GitHub Pages when you push to the main branch.

For manual deployment:
```bash
pnpm run deploy
```

## 🎯 How to Play

1. **Quick Join**: Click on any available game on the main page to join instantly
2. **Create a Game**: Set your bet amount and coin choice, wait for an opponent
3. **Coin Flip**: Watch the animated coin flip determine the winner
4. **Collect Winnings**: Winner takes the entire pot
5. **Play Again**: Start a new game or join another player's game

## 🔧 Development

### Project Structure
```
src/
├── js/
│   ├── game.js     # Game logic and state management
│   ├── ui.js       # UI components and interactions
│   └── utils.js    # Utility functions
├── css/
│   ├── main.css    # Main styles
│   └── animations.css # Coin flip animations
└── assets/         # Images and other assets
```

### Key Features Implemented
- ✅ Game creation and joining
- ✅ Secure random number generation
- ✅ Animated coin flip visualization
- ✅ Winner determination and payout
- ✅ Responsive design
- ✅ Error handling and validation

## 📱 Demo

Visit the live demo: [P2P Coin Flip](https://yourusername.github.io/p2p-coinflip/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a demonstration project for educational purposes. Do not use real money for gambling.
