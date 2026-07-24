declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL?: string
    NEXT_PUBLIC_APP_NAME?: string
    NEXT_PUBLIC_DEFAULT_LOCALE?: string
    NEXT_PUBLIC_NOTIFICATION_SOUND_URL?: string
    NEXTAUTH_SECRET?: string
    NEXTAUTH_URL?: string
  }
}

interface ImportMetaEnv {
  NEXT_PUBLIC_APP_URL?: string
  NEXT_PUBLIC_APP_NAME?: string
  NEXT_PUBLIC_DEFAULT_LOCALE?: string
  NEXT_PUBLIC_NOTIFICATION_SOUND_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
