import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { CloudSavePayload } from '../types/game';

export const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

let cachedAuth: ReturnType<typeof getAuth> | null = null;
let cachedProvider: GoogleAuthProvider | null = null;

function ensureFirebaseAuth() {
  if (!cachedAuth) {
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    cachedAuth = getAuth(app);
  }
  if (!cachedProvider) {
    cachedProvider = new GoogleAuthProvider();
    for (const scope of SCOPES) {
      cachedProvider.addScope(scope);
    }
  }
  return { auth: cachedAuth, provider: cachedProvider };
}

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export interface DriveSaveFileMeta {
  id: string;
  name: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
}

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  try {
    const { auth } = ensureFirebaseAuth();
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        if (cachedAccessToken) {
          if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
        } else if (!isSigningIn) {
          cachedAccessToken = null;
          if (onAuthFailure) onAuthFailure();
        }
      } else {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    });
  } catch (err) {
    console.error('Firebase Auth init warning:', err);
    if (onAuthFailure) onAuthFailure();
    return () => {};
  }
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const { auth, provider } = ensureFirebaseAuth();
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to get access token from Firebase Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getCurrentAuthUser = (): User | null => {
  try {
    return ensureFirebaseAuth().auth.currentUser;
  } catch {
    return null;
  }
};

export const logout = async (): Promise<void> => {
  const { auth } = ensureFirebaseAuth();
  await auth.signOut();
  cachedAccessToken = null;
};

async function requireToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }
  return token;
}

export async function listCampusSaveFiles(): Promise<DriveSaveFileMeta[]> {
  const token = await requireToken();
  const q = encodeURIComponent(
    "name contains 'campus-escape-vit' and mimeType = 'application/json' and trashed = false"
  );
  const fields = encodeURIComponent('files(id,name,modifiedTime,size,webViewLink)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=modifiedTime desc&pageSize=20`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive list failed (${res.status}): ${errText}`);
  }

  const data = (await res.json()) as { files?: DriveSaveFileMeta[] };
  return data.files || [];
}

export async function createDriveSaveFile(
  fileName: string,
  payload: CloudSavePayload
): Promise<DriveSaveFileMeta> {
  const token = await requireToken();
  const metadata = {
    name: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
    mimeType: 'application/json',
    description: 'Campus Escape – VIT Edition Cloud Save & Leaderboard Backup',
  };

  const boundary = 'campus_escape_drive_boundary_v1';
  const multipartBody =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(payload, null, 2) +
    `\r\n--${boundary}--`;

  const fields = encodeURIComponent('id,name,modifiedTime,size,webViewLink');
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=${fields}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive create failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as DriveSaveFileMeta;
}

export async function overwriteDriveSaveFile(
  fileId: string,
  payload: CloudSavePayload
): Promise<DriveSaveFileMeta> {
  const token = await requireToken();
  const fields = encodeURIComponent('id,name,modifiedTime,size,webViewLink');
  const res = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(
      fileId
    )}?uploadType=media&fields=${fields}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload, null, 2),
    }
  );

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive update failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as DriveSaveFileMeta;
}

export async function downloadDriveSaveFile(fileId: string): Promise<CloudSavePayload> {
  const token = await requireToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive download failed (${res.status}): ${errText}`);
  }

  return (await res.json()) as CloudSavePayload;
}

export async function deleteDriveSaveFile(fileId: string): Promise<void> {
  const token = await requireToken();
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (res.status === 401) {
    cachedAccessToken = null;
    throw new Error('AUTH_REQUIRED');
  }
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Drive delete failed (${res.status}): ${errText}`);
  }
}
