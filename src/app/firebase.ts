import { initializeApp } from "firebase/app";
import { firebaseConfig } from "./firebaseConfig";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";

const app = initializeApp(firebaseConfig)
const googleProvider = new GoogleAuthProvider()
const auth = getAuth(app)

export { auth, googleProvider }
