
import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyDjowhLt-pq5DKd-phnS1Hwx7tdRomJCNQ",
  authDomain: "taurus-calling.firebaseapp.com",
  projectId: "taurus-calling",
  storageBucket: "taurus-calling.firebasestorage.app",
  messagingSenderId: "846393681682",
  appId: "1:846393681682:web:9c39fe6c96162f4073b5cb",
  measurementId: "G-WCYFJGX30G",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let messaging: ReturnType<typeof getMessaging> | null = null;

if (typeof window !== "undefined") {
  messaging = getMessaging(app);
}

export const requestFCMToken = async () => {
  try {
    if (!messaging) return null;

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("❌ Notification permission denied");
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey:
        "BNBlEVgdAX8Snm8DRtQG8nSnZQhTvuEUvnWiiEbIMtik3hJ-UqAQ1dPVzhZTNR8C2-xPYZilFdlnXGXFBY5ajGA",
    });

    console.log("✅ FCM Token:", token);
    return token;
  } catch (err) {
    console.error("❌ FCM Token Error:", err);
    return null;
  }
};

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log("📩 Message received:", payload);
    callback(payload);
  });
};