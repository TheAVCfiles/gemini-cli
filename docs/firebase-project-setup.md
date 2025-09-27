# Set up a fresh Firebase project

This guide walks through creating a brand-new Firebase project and wiring up the core services that Gemini CLI demos rely on: Authentication, Realtime Database, Hosting, and Cloud Functions. Follow the steps in order to establish a working environment for both web clients and Node.js back ends.

> **At a glance**
>
> * Works with the Firebase Spark (free) plan.
> * Covers both browser and Node.js usage.
> * Includes code snippets you can paste directly into your apps.

## 1. Create and initialize the Firebase project

1. Sign in to the [Firebase console](https://console.firebase.google.com/) with a Google account.
2. Click **Add project** (or **Create a project**), supply a project name, and review the generated Project ID.
3. Decide whether to enable Google Analytics for the project, then click **Create project**. Firebase provisions the project in a few seconds.
4. Install the Firebase CLI if you plan to deploy Hosting or Cloud Functions:

   ```bash
   npm install -g firebase-tools
   firebase login
   ```

## 2. Enable email/password authentication

1. In the Firebase console, open **Build → Authentication → Sign-in method**.
2. Enable **Email/Password** and click **Save**.
3. In your application, install the Firebase Web SDK:

   ```bash
   npm install firebase
   ```

4. Add the following code to initialize the client SDK and handle sign-up and sign-in. Replace the configuration object with the values from **Project settings → General → Your apps**.

   ```ts
   import { initializeApp } from "firebase/app";
   import {
     getAuth,
     createUserWithEmailAndPassword,
     signInWithEmailAndPassword,
   } from "firebase/auth";

   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID",
   };

   const app = initializeApp(firebaseConfig);
   const auth = getAuth(app);

   export async function register(email: string, password: string) {
     const credential = await createUserWithEmailAndPassword(auth, email, password);
     return credential.user;
   }

   export async function login(email: string, password: string) {
     const credential = await signInWithEmailAndPassword(auth, email, password);
     return credential.user;
   }
   ```

## 3. Use the Realtime Database from web and Node.js

1. In the console, open **Build → Realtime Database** and click **Create database**.
2. Choose a region, then start in **Test mode** while prototyping. (Switch to a locked-down rule set before production.)
3. From the web app, import the Realtime Database SDK and write data:

   ```ts
   import { getDatabase, ref, set } from "firebase/database";

   const database = getDatabase();

   export async function writeMessage(id: string, username: string, message: string) {
     await set(ref(database, `messages/${id}`), {
       username,
       message,
     });
   }
   ```

4. For trusted environments (Node.js servers, Cloud Functions) use the Firebase Admin SDK:

   ```bash
   npm install firebase-admin
   ```

   ```js
   const admin = require("firebase-admin");
   const serviceAccount = require("./serviceAccountKey.json");

   admin.initializeApp({
     credential: admin.credential.cert(serviceAccount),
     databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
   });

   const db = admin.database();

   async function writeServerMessage(id, username, message) {
     await db.ref(`messages/${id}`).set({ username, message });
   }
   ```

   Download the service account JSON from **Project settings → Service accounts** and store it outside of version control.

## 4. Deploy static assets with Firebase Hosting

1. Run the CLI initialization command from your project directory:

   ```bash
   firebase init hosting
   ```

2. Choose your Firebase project, specify the public directory (for example, `dist` or `public`), and opt into single-page app rewrites if needed.
3. Build your web assets, then deploy:

   ```bash
   npm run build
   firebase deploy --only hosting
   ```

   The command uploads the contents of the configured public directory to Firebase Hosting.

## 5. Add Cloud Functions for backend logic

1. Initialize the Functions workspace:

   ```bash
   firebase init functions
   ```

   Select JavaScript or TypeScript, enable ESLint if desired, and let the CLI install dependencies.

2. Replace the generated `functions/index.js` with a simple HTTPS-triggered function:

   ```js
   const functions = require("firebase-functions");
   const admin = require("firebase-admin");

   admin.initializeApp();

   exports.addMessage = functions.https.onRequest(async (req, res) => {
     const original = req.query.text;
     const snapshot = await admin.database().ref("/messages").push({ original });
     res.json({ result: `Message with ID ${snapshot.key} added.` });
   });
   ```

3. Deploy the function (alongside Hosting if desired):

   ```bash
   firebase deploy --only functions
   # or deploy both static content and functions
   firebase deploy --only hosting,functions
   ```

## 6. Next steps

* Review the generated `firebase.json` to customize Hosting rewrites, headers, and emulator settings.
* Tighten Realtime Database rules before launching publicly.
* Automate deployments through CI/CD by running `firebase deploy` with a service account or using GitHub Actions.
* When you are done testing, clean up with `firebase hosting:disable --site <site-id>` and `firebase functions:delete <name>`.

For a ready-to-deploy starter package that bundles a Firebase Hosting site and HTTPS function, download the [`mwra-glossary-firebase` archive](https://platform.openai.com/storage/vector_stores/vs_6859e43920848191a894dd36ecf0595a/mwra-glossary-firebase.zip?download=1) and follow the steps in [Firebase Hosting quick start](./firebase-hosting.md).
