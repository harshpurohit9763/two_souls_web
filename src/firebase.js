import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';


// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDlpFHsXc4A3Wh3f7AhbhXVNq8nE8L60-c",
  authDomain: "twosouls-d8ee8.firebaseapp.com",
  projectId: "twosouls-d8ee8",
  storageBucket: "twosouls-d8ee8.firebasestorage.app",
  messagingSenderId: "870375556612",
  appId: "1:870375556612:web:05341f0a5930e58f7f9751",
  measurementId: "G-FDFPWS11KJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Waitlist Subscriptions
export const submitWaitlist = async (email) => {
  try {
    const formattedEmail = email.toLowerCase().trim();
    const waitlistRef = doc(db, 'waitlist', formattedEmail);

    // Save to waitlist collection using email as Document ID to ensure uniqueness
    // If the rules only allow 'create' and not 'update', this will throw a permission-denied
    // error if the email already exists, which is exactly what we want to prevent duplicates securely!
    await setDoc(waitlistRef, {
      email: formattedEmail,
      createdAt: serverTimestamp()
    });

    // Increment counter ONLY if the above succeeded (i.e. it was a new email)
    const counterRef = doc(db, 'stats', 'counters');
    await setDoc(counterRef, {
      waitlistCount: increment(1)
    }, { merge: true });

    return true;
  } catch (error) {
    if (error.code === 'permission-denied') {
      // The rules only allow create. So a permission-denied means the document already exists.
      throw new Error('already-exists');
    }
    console.error("Error submitting waitlist: ", error);
    throw error;
  }
};

export const withdrawWaitlist = async (email) => {
  try {
    const formattedEmail = email.toLowerCase().trim();
    if (!formattedEmail) return false;

    // 1. Add to withdraw_requests collection
    await setDoc(doc(db, 'withdraw_requests', formattedEmail), {
      email: formattedEmail,
      withdrawnAt: serverTimestamp()
    });

    // 2. Delete from waitlist collection
    await deleteDoc(doc(db, 'waitlist', formattedEmail));

    // 3. Decrement waitlist counter
    const counterRef = doc(db, 'stats', 'counters');
    await setDoc(counterRef, {
      waitlistCount: increment(-1)
    }, { merge: true });

    return true;
  } catch (error) {
    console.error("Error withdrawing from waitlist: ", error);
    throw error;
  }
};

export const subscribeWaitlistCount = (onUpdate) => {
  const counterRef = doc(db, 'stats', 'counters');
  return onSnapshot(counterRef, (doc) => {
    if (doc.exists()) {
      onUpdate(doc.data().waitlistCount || 0);
    } else {
      onUpdate(0);
    }
  }, (error) => {
    console.error("Error subscribing to waitlist count: ", error);
  });
};

// Suggestion Subscriptions
export const submitSuggestion = async (text, deviceId) => {
  try {
    await addDoc(collection(db, 'suggestions'), {
      text,
      deviceId,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Error submitting suggestion: ", error);
    throw error;
  }
};

// Feature Voting System
export const subscribeFeatureVotes = (onUpdate) => {
  return onSnapshot(collection(db, 'feature_votes'), (snapshot) => {
    const votes = {};
    snapshot.forEach((doc) => {
      votes[doc.id] = doc.data().votes || 0;
    });
    onUpdate(votes);
  }, (error) => {
    console.error("Error subscribing to feature votes: ", error);
  });
};

export const toggleVote = async (deviceId, featureId, title) => {
  try {
    const featureRef = doc(db, 'feature_votes', featureId.toString());
    const userVoteRef = doc(db, 'feature_user_votes', `${deviceId}_${featureId}`);

    const userVoteSnap = await getDoc(userVoteRef);

    if (userVoteSnap.exists()) {
      // User has already voted, remove vote
      await deleteDoc(userVoteRef);
      await setDoc(featureRef, {
        title,
        votes: increment(-1)
      }, { merge: true });
      return false; // Result is un-voted
    } else {
      // User hasn't voted, add vote
      await setDoc(userVoteRef, {
        deviceId,
        featureId,
        createdAt: serverTimestamp()
      });
      await setDoc(featureRef, {
        title,
        votes: increment(1)
      }, { merge: true });
      return true; // Result is voted
    }
  } catch (error) {
    console.error("Error toggling vote: ", error);
    throw error;
  }
};

export const initializeFeatureVotes = async (features) => {
  // Optional: Set initial features in Firestore if they don't exist
  for (const feature of features) {
    const featureRef = doc(db, 'feature_votes', feature.id.toString());
    const snap = await getDoc(featureRef);
    if (!snap.exists()) {
      await setDoc(featureRef, {
        title: feature.title,
        votes: feature.votes
      }, { merge: true });
    }
  }
};
