// src/environments/environment.ts
// Used by default `ng build` (production). Angular CLI's "development"
// configuration applies a fileReplacement to swap this for
// environment.development.ts during `ng serve`.
export const environment = {
  production: true,
  //apiUrl: 'http://10.20.16.17:3000/api',
  apiUrl: `${window.location.protocol}//${window.location.hostname}:3000/api`,
  // Dev-only fields kept as empty stubs so production code that reads
  // them still type-checks, but the Dev Quick Login panel is gated by
  // `production: true` and never renders (and is tree-shaken out).
  devPassword: '',
  devPersonas: [] as {
    username: string;
    fullName: string;
    role: string;
  }[],
};
