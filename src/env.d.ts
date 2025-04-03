/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly DB_HOST: string
  readonly DB_USER: string
  readonly DB_PASSWORD: string
  readonly DB_NAME: string
  readonly DB_PORT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export {};
