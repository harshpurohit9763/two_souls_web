import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDlpFHsXc4A3Wh3f7AhbhXVNq8nE8L60-c",
  authDomain: "twosouls-d8ee8.firebaseapp.com",
  projectId: "twosouls-d8ee8",
  storageBucket: "twosouls-d8ee8.firebasestorage.app",
  messagingSenderId: "870375556612",
  appId: "1:870375556612:web:05341f0a5930e58f7f9751",
  measurementId: "G-FDFPWS11KJ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const features = [
  { id: 1, title: 'Synchronized Music Playback', votes: 428 },
  { id: 2, title: 'Shared Memory Timeline', votes: 892 },
  { id: 3, title: 'Private Voice & Video Calling', votes: 512 },
  { id: 4, title: 'Opt-in Live Location sharing', votes: 356 }
];

async function initializeData() {
  console.log("Initializing data...");
  try {
    // 1. Initialize waitlist count if missing
    const counterRef = doc(db, 'stats', 'counters');
    const counterSnap = await getDoc(counterRef);
    if (!counterSnap.exists()) {
      await setDoc(counterRef, { waitlistCount: 4289 });
      console.log("Initialized waitlistCount to 4289");
    }

    // 2. Initialize feature votes
    for (const feature of features) {
      const featureRef = doc(db, 'feature_votes', feature.id.toString());
      const snap = await getDoc(featureRef);
      if (!snap.exists()) {
        await setDoc(featureRef, {
          title: feature.title,
          votes: feature.votes
        });
        console.log(`Initialized feature: ${feature.title}`);
      }
    }
    
    console.log("Done!");
    process.exit(0);
  } catch (error) {
    console.error("Error initializing data:", error);
    process.exit(1);
  }
}

initializeData();
