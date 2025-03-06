import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDw36-l_b3g3df3BGw5JiO2wQlsf1jw2zg",
    authDomain: "filxconnect.firebaseapp.com",
    projectId: "filxconnect",
    storageBucket: "filxconnect.firebasestorage.app",
    messagingSenderId: "753135672640",
    appId: "1:753135672640:web:80929bc09921e13ed7eea5",
    measurementId: "G-RCLHMWDD0W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const database = getDatabase(app);