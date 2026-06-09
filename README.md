# 🎁 WishSnap

Snap a photo of your child holding an item they want — WishSnap uses AI to identify it, confirms with you, looks up the current price, and helps you share the list with family.

## Features

- **AI-powered photo recognition** — powered by GPT-4o Vision, identifies toys, games, books, and more from a photo
- **AI confidence confirmation** — shows a confidence message (🎯 high / 🤔 medium / ❓ low) and lets you correct the item name before saving
- **Live price lookup** — fetches the current price from your preferred retailer automatically
- **Christmas & Birthday lists** — organize wishes by occasion
- **Multi-retailer search** — search Amazon, Walmart, or Target instantly
- **Shareable links** — generate a public link to share the wishlist with grandparents and family — no app needed, opens in any browser
- **Cloud sync** — lists are saved to the cloud so parents can view from any device
- **Family accounts** — sign up and log in with email/password via Firebase Auth
- **Settings** — choose your preferred retailer for price lookups

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo SDK 54) |
| AI Vision | OpenAI GPT-4o |
| Auth & Database | Firebase (Auth + Firestore) |
| Price Lookup | RapidAPI Real-Time Product Search |
| Web Sharing | Firebase Hosting |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Expo Go](https://expo.dev/client) app on your phone
- OpenAI API key with billing enabled
- Firebase project with Auth and Firestore enabled
- RapidAPI key (free tier) for price lookup

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
   EXPO_PUBLIC_RAPIDAPI_KEY=your_rapidapi_key_here
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
   For testing outside your local network:
   ```bash
   npx expo start --tunnel
   ```

5. Scan the QR code with **Expo Go** on your phone.

### Firebase Hosting (Shared Lists)

To enable the shareable web links feature, deploy to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore:rules --project your_project_id
```

## Project Structure

```
WishSnap/
├── App.js                        # Navigation & auth routing
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── firebase.json                 # Firebase Hosting config
├── firestore.rules               # Firestore security rules
├── public/
│   └── share.html                # Public shareable list web page
└── src/
    ├── context/
    │   └── AuthContext.js        # Firebase auth state
    ├── services/
    │   ├── firebase.js           # Firebase initialization
    │   ├── openai.js             # GPT-4o Vision API
    │   ├── priceService.js       # RapidAPI price lookup
    │   ├── shareService.js       # Firestore share link generation
    │   └── wishlist.js           # Firestore read/write
    └── screens/
        ├── LoginScreen.js        # Sign up / log in
        ├── CameraScreen.js       # Photo capture, AI ID, confidence confirm
        ├── WishlistScreen.js     # View, manage & share saved items
        ├── DealsScreen.js        # In-app retailer search
        └── SettingsScreen.js     # Preferred retailer selection
```

## How It Works

1. Parent opens the app and taps **Snap**
2. Take a photo of your child holding the item they want
3. GPT-4o Vision analyzes the photo and identifies the product
4. A **confidence card** appears — confirm the item or correct it
5. The app automatically looks up the current price from your preferred retailer
6. Choose to add it to the **Christmas** or **Birthday** list
7. Tap **Share List** to generate a link you can text to grandparents or family

## Running Outside Your Network

Use Expo tunnel mode for testing anywhere with internet:

```bash
# Install ngrok auth token first (free at ngrok.com)
npx ngrok config add-authtoken YOUR_NGROK_TOKEN

# Then start with tunnel
npx expo start --tunnel
```

## Roadmap

- [ ] Per-child lists (e.g. "Emma's List", "Jake's List")
- [ ] Deep links — shared URL opens directly in app
- [ ] Price drop notifications
- [ ] Mark items as purchased (for family members)
- [ ] App Store / TestFlight release

## License

MIT
