# Firebase setup for Google sign-in and synced favourites

The website works without Firebase: everyone can browse, and guest favourites stay in the browser. Complete these steps only to enable optional Google sign-in and cross-device favourite synchronization.

## 1. Create or select a Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/).
2. Choose **Create a project**, or select a project you already control.
3. Analytics is not required for this website; you can leave Google Analytics disabled.

## 2. Add the website as a Web App

1. On **Project overview**, select the Web icon (`</>`).
2. Enter a nickname such as `Hindu Devotional Collections Website`.
3. Do not enable Firebase Hosting; GitHub Pages remains the host.
4. Select **Register app**.
5. Copy the `firebaseConfig` values shown by Firebase.

## 3. Paste the public Web configuration

Open `docs/javascripts/abp-firebase-config.js`. Replace each `REPLACE_ME` value with the matching value from Firebase Console. Keep the property names and quotation marks unchanged.

Firebase Web configuration identifies the project; it is not a service-account secret. Never add a service-account JSON file, private key, Admin SDK credential, or password to this repository.

## 4. Enable Google Authentication

1. In Firebase Console, open **Build → Authentication**.
2. Select **Get started** if prompted.
3. Open **Sign-in method → Add new provider → Google**.
4. Enable Google, choose the required support email, and save.
5. Under **Authentication → Settings → Authorized domains**, add `ashishbharani.github.io`.
6. For local testing, ensure `localhost` is also authorized. Add it manually if it is not listed.

## 5. Create Cloud Firestore and install the rules

1. Open **Build → Firestore Database → Create database**.
2. Choose the production/locked mode and the region you prefer.
3. Open the **Rules** tab.
4. Copy the complete contents of `firestore.rules` from this repository into the editor.
5. Select **Publish**.

The supplied rules allow a signed-in user to access only `users/{their uid}/favourites/*`. They deny all other reads and writes. Do not use open test-mode rules in production.

## 6. Test locally

1. Run `uv sync`.
2. Run `uv run mkdocs serve`.
3. Open the exact localhost address printed in the terminal (normally `http://127.0.0.1:8000/devotional/`).
4. Select **Sign in**, allow the popup, and choose your Google account.
5. Add a heart beside a work, open **My Favourites**, then sign out and back in.

If Firebase reports `auth/unauthorized-domain`, add the hostname shown in the error to **Authentication → Settings → Authorized domains**. If the popup is blocked, allow popups for the site and select **Sign in** again. If Firestore reports `permission-denied`, republish `firestore.rules` and confirm the user is signed in.

## 7. Test on GitHub Pages

After the feature branch is reviewed and merged, wait for the GitHub Pages workflow to finish, then open <https://ashishbharani.github.io/devotional/> in a private window. Test sign-in, add/remove favourites, refresh, and confirm the same favourites on another signed-in device.

The Japa Counter is deliberately separate. Its practice name and counts stay only in that browser and are never sent to Firebase.
