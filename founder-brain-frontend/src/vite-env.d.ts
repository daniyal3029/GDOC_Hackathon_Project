/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_POLLING_INTERVAL: string;
  readonly VITE_DEMO_USER_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
