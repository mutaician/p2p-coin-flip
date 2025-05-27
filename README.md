# P2P Coin Flip Gambling System

A peer-to-peer coin flip gambling web application where two players can place bets and compete in a fair, computer-generated coin flip.

## 🎮 Features

- **Peer-to-Peer Betting**: Two players can create and join games
- **Fair Random Generation**: Cryptographically secure random coin flips
- **Modern UI**: Beautiful, responsive design with smooth animations
- **Real-time Updates**: Live game state updates and notifications
- **Mobile Friendly**: Optimized for all device sizes

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
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

1. **Create a Game**: Set your bet amount and wait for an opponent
2. **Join a Game**: Find an existing game and match the bet
3. **Coin Flip**: Watch the animated coin flip determine the winner
4. **Collect Winnings**: Winner takes the entire pot

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
