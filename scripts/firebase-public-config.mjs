const EXPECTED_CONFIG_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const EXPECTED_DOMAINS = ['gc.hebron.edu.hk', 'lsc.edu.hk'];

function readStringObject(source, assignment) {
  const match = source.match(new RegExp(`global\\.${assignment}\\s*=\\s*Object\\.freeze\\(\\{([\\s\\S]*?)\\}\\);`));
  if (!match) throw new Error('public Firebase configuration has an invalid shape');
  const entries = [...match[1].matchAll(/^\s*([A-Za-z][A-Za-z0-9]*)\s*:\s*'([^']*)'\s*,?\s*$/gm)];
  if (entries.length !== EXPECTED_CONFIG_KEYS.length) throw new Error('public Firebase configuration has an invalid field count');
  const result = Object.fromEntries(entries.map((entry) => [entry[1], entry[2]]));
  if (Object.keys(result).length !== entries.length || EXPECTED_CONFIG_KEYS.some((key) => !(key in result))) {
    throw new Error('public Firebase configuration has unexpected fields');
  }
  return result;
}

function readStringArray(source, assignment) {
  const match = source.match(new RegExp(`global\\.${assignment}\\s*=\\s*Object\\.freeze\\(\\[([^\\]]*)\\]\\);`));
  if (!match) throw new Error('public Firebase authorization list has an invalid shape');
  const values = [...match[1].matchAll(/'([^']*)'/g)].map((entry) => entry[1]);
  if (assignment !== 'AUTHORIZED_EMAIL_DOMAINS' || values.join('\n') !== EXPECTED_DOMAINS.join('\n')) {
    throw new Error('public Firebase authorization domains differ from approved school domains');
  }
  return values;
}

export function assertPublicFirebaseConfig(source) {
  if ((source.match(/global\.FIREBASE_CONFIG\s*=/g) || []).length !== 1 ||
      (source.match(/global\.AUTHORIZED_EMAIL_DOMAINS\s*=/g) || []).length !== 1 ||
      /AUTHORIZED_EMAILS|\b[A-Z0-9._%+-]+@gmail\.com\b/i.test(source)) {
    throw new Error('public Firebase configuration has unexpected assignments');
  }
  if (/private.?key|client.?secret|service.?account|admin.?sdk|oauth.?secret|teacher.?password|student.?data/i.test(source)) {
    throw new Error('public Firebase configuration contains a prohibited credential or private-data reference');
  }

  const config = readStringObject(source, 'FIREBASE_CONFIG');
  if (!/^AIza[A-Za-z0-9_-]{30,}$/.test(config.apiKey) ||
      config.authDomain !== 'math-rpg-1eebc.firebaseapp.com' ||
      config.projectId !== 'math-rpg-1eebc' ||
      config.storageBucket !== 'math-rpg-1eebc.firebasestorage.app' ||
      config.messagingSenderId !== '838577745797' ||
      config.appId !== '1:838577745797:web:2b10e228500e6c91285eec') {
    throw new Error('public Firebase configuration does not match the approved web app');
  }
  readStringArray(source, 'AUTHORIZED_EMAIL_DOMAINS');
}
