# 🎁 WishSnap

Snap a photo of your child holding an item they want — WishSnap uses AI to identify it, confirms with you, looks up live prices across retailers, and lets you share the list with family.

## Features

- **AI-powered photo recognition** — powered by GPT-4o Vision, identifies toys, games, books, and more from a photo
- **AI confidence confirmation** — shows a confidence message (🎯 high / 🤔 medium / ❓ low) and lets you correct the item name before saving
- **Multi-retailer price comparison** — fetches live prices from Amazon, Walmart, and Target simultaneously, shown side-by-side on the result card
- **Christmas & Birthday lists** — organize wishes by occasion per child
- **Per-child profiles** — add a profile for each child with name, avatar color, and birthday; age and upcoming birthday badge shown automatically
- **Wishlist management** — move items between children or remove them via an action sheet
- **Shareable links** — generate a public link to share any child's list with grandparents and family — no app needed, opens in any browser
- **User profiles** — first/last name captured at registration, editable from the Profile tab
- **Cloud sync** — everything saved to Firestore, accessible from any device
- **Family accounts** — sign up and log in with email/password via Firebase Auth

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
- RapidAPI key (free tier) for [Real-Time Product Search](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-product-search)

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

3. **Create your `.env` file** in the project root (never commit this file):
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
    │   └── AuthContext.js        # Firebase auth state + profile management
    ├── services/
    │   ├── firebase.js           # Firebase initialization
    │   ├── openai.js             # GPT-4o Vision API
    │   ├── priceService.js       # RapidAPI price lookup (all 3 retailers in parallel)
    │   ├── profileService.js     # Firestore user profile read/write
    │   ├── childrenService.js    # Firestore children sub-collection
    │   ├── shareService.js       # Firestore share link generation
    │   └── wishlist.js           # Firestore wishlist read/write/move
    └── screens/
        ├── LoginScreen.js        # Sign up (with name) / log in
        ├── CameraScreen.js       # Photo capture, AI ID, confidence confirm, price compare
        ├── WishlistScreen.js     # View, filter by child/occasion, manage & share items
        ├── ChildrenScreen.js     # Child profiles with birthday tracking
        ├── DealsScreen.js        # In-app retailer WebView search
        └── SettingsScreen.js     # User profile, preferred retailer, log out
```

## How It Works

1. **Register** with your name and email — a profile is created automatically
2. **Add your children** in the Children tab — name, avatar color, and birthday
3. Tap **Snap**, take a photo of your child holding the item they want
4. GPT-4o Vision identifies the product and shows a **confidence card**
5. Confirm the item (or correct the name)
6. Live prices are fetched from **Amazon, Walmart, and Target** simultaneously
7. Pick which child and which list (Christmas 🎄 or Birthday 🎂), then save
8. On the **Wishlist** tab, tap `•••` on any item to move it to another child or remove it
9. Tap **Share List** to generate a public link you can text to grandparents or family

## Running Outside Your Network

Use Expo tunnel mode for testing anywhere with internet:

```bash
# Install ngrok auth token first (free at ngrok.com)
npx ngrok config add-authtoken YOUR_NGROK_TOKEN

# Then start with tunnel
npx expo start --tunnel
```

## Roadmap

- [ ] Deep links — shared URL opens directly in app
- [ ] Price drop notifications
- [ ] Mark items as purchased (for family members viewing the shared list)
- [ ] App Store / TestFlight release

## License

MIT
