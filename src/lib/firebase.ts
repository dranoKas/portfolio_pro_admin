
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getAuth, Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPzjFyqtOUfjuv0RGotHDiiqfLIfNMxfY",
  authDomain: "materialx-9be3b.firebaseapp.com",
  projectId: "materialx-9be3b",
  storageBucket: "materialx-9be3b.appspot.com",
  messagingSenderId: "977422050142",
  appId: "1:977422050142:web:faaa96ca2e34460561a5cf"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);
const auth: Auth = getAuth(app);

export { app, db, storage, auth };
