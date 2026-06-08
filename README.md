# 🎁 WishSnap

Snap a photo of your child holding an item they want — WishSnap uses AI to identify it and helps you find the best deals across your favorite retailers.

## Features

- **AI-powered photo recognition** — powered by GPT-4o Vision, identifies toys, games, books, and more from a photo
- **Christmas & Birthday lists** — organize wishes by occasion
- **Multi-retailer search** — search Amazon, Walmart, or Target instantly
- **Cloud sync** — lists are saved to the cloud so parents can view from any device
- **Family accounts** — sign up and log in with email/password via Firebase Auth

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 54) |
| AI Vision | OpenAI GPT-4o |
| Auth & Database | Firebase (Auth + Firestore) |
| Retailer Search | Amazon, Walmart, Target (WebView) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Expo Go](https://expo.dev/client) app on your phone
- OpenAI API key with billing enabled
- Firebase project with Auth and Firestore enabled

### Installation

1. **Clone the repo**
   ```bash
   git clone https://github.com/caffine247/WishSnap.git
   cd WishSnap
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create your `.env` file** in the project root:
   ```
   EXPO_PUBLIC_OPENAI_API_KEY=your_openai_key_here
   EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Start the app**
   ```bash
   npx expo start
   ```

5. Scan the QR code with **Expo Go** on your phone.

## Project Structure

```
WishSnap/
├── App.js                        # Navigation & auth routing
└── src/
    ├── context/
    │   └── AuthContext.js        # Firebase auth state
    ├── services/
    │   ├── firebase.js           # Firebase initialization
    │   ├── openai.js             # GPT-4o Vision API
    │   └── wishlist.js           # Firestore read/write
    └── screens/
        ├── LoginScreen.js        # Sign up / log in
        ├── CameraScreen.js       # Photo capture & AI identification
        ├── WishlistScreen.js     # View & manage saved items
        └── DealsScreen.js        # In-app retailer search
```

## How It Works

1. Parent opens the app and taps **Snap**
2. Take a photo of your child holding the item they want
3. GPT-4o Vision analyzes the photo and identifies the product
4. Choose to add it to the **Christmas** or **Birthday** list
5. Tap any retailer to search for current deals

## Roadmap

- [ ] Per-child lists (e.g. "Emma's List", "Jake's List")
- [ ] Price drop notifications
- [ ] Shareable list links for family members
- [ ] Direct product API integration for real-time pricing

## License

MIT
