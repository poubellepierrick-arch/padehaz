
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  databaseURL: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface FullAppData {
  content: any; // Changed from string to any to support the complex Atelier object structure
  lastUpdated: string;
}
