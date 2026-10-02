/* Optional Firebase Authentication and per-user Firestore favourites. */
(() => {
  "use strict";

  const SDK = "12.19.0";
  const base = `https://www.gstatic.com/firebasejs/${SDK}/`;
  const config = window.abpFirebaseConfig || {};
  const configured = ["apiKey", "authDomain", "projectId", "appId"]
    .every((key) => config[key] && config[key] !== "REPLACE_ME");
  const observers = new Set();
  let state = { user: null, configured, ready: false, error: null };
  let servicesPromise = null;

  const publish = (next) => {
    state = { ...state, ...next };
    observers.forEach((callback) => callback(state));
    document.dispatchEvent(new CustomEvent("abp-authchange", { detail: state }));
  };

  async function services() {
    if (!configured) throw Object.assign(new Error("Firebase is not configured."), { code: "abp/not-configured" });
    if (!servicesPromise) {
      servicesPromise = Promise.all([
        import(`${base}firebase-app.js`),
        import(`${base}firebase-auth.js`),
        import(`${base}firebase-firestore.js`),
      ]).then(async ([appApi, authApi, dbApi]) => {
        const app = appApi.initializeApp(config);
        const auth = authApi.getAuth(app);
        await authApi.setPersistence(auth, authApi.browserLocalPersistence);
        const db = dbApi.getFirestore(app);
        authApi.onAuthStateChanged(auth,
          (user) => publish({ user, ready: true, error: null }),
          (error) => publish({ user: null, ready: true, error }));
        return { auth, db, authApi, dbApi };
      }).catch((error) => {
        servicesPromise = null;
        publish({ ready: true, error });
        throw error;
      });
    }
    return servicesPromise;
  }

  function friendlyError(error) {
    const key = {
      "abp/not-configured": "firebaseNotConfigured",
      "auth/popup-blocked": "popupBlocked",
      "auth/network-request-failed": "networkError",
      "auth/user-token-expired": "sessionExpired",
      "auth/requires-recent-login": "sessionExpired",
    }[error?.code];
    return key || (error?.code === "auth/popup-closed-by-user" ? "signInCancelled" : "signInFailed");
  }

  async function signIn() {
    const { auth, authApi } = await services();
    const provider = new authApi.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    return authApi.signInWithPopup(auth, provider);
  }

  async function signOut() {
    const { auth, authApi } = await services();
    return authApi.signOut(auth);
  }

  async function readFavourites(uid) {
    const { db, dbApi } = await services();
    const snapshot = await dbApi.getDocs(dbApi.collection(db, "users", uid, "favourites"));
    return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }));
  }

  async function writeFavourites(uid, operations) {
    const { db, dbApi } = await services();
    for (let start = 0; start < operations.length; start += 400) {
      const batch = dbApi.writeBatch(db);
      operations.slice(start, start + 400).forEach((operation) => {
        const ref = dbApi.doc(db, "users", uid, "favourites", operation.id);
        if (operation.action === "delete") batch.delete(ref);
        else batch.set(ref, { ...operation.record, id: operation.id, updatedAt: Date.now() }, { merge: true });
      });
      await batch.commit();
    }
  }

  function observe(callback) {
    observers.add(callback);
    callback(state);
    return () => observers.delete(callback);
  }

  window.abpFirebase = { configured, observe, services, signIn, signOut, readFavourites, writeFavourites, friendlyError };
  if (configured) services().catch(() => {});
  else queueMicrotask(() => publish({ ready: true }));
})();
