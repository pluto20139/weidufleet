/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DIFY_BASE_URL: string;
  readonly VITE_DIFY_TOKEN: string;
  readonly VITE_DIFY_EMBED_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
