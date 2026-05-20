// Placeholder database type used until Supabase generated types exist.
// Do not treat this as the real remote schema.
//
// After the local or confirmed `reeditpro` Supabase schema is available, run
// the documented type-generation command and replace this placeholder with:
//
// export type { Database } from './generated-database.types'
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface PlaceholderTableDefinition {
  Row: Record<string, Json>
  Insert: Record<string, Json | undefined>
  Update: Record<string, Json | undefined>
  Relationships: []
}

export interface PlaceholderFunctionDefinition {
  Args: Record<string, Json | undefined>
  Returns: Json
}

export interface Database {
  public: {
    Tables: Record<string, PlaceholderTableDefinition>
    Views: Record<string, PlaceholderTableDefinition>
    Functions: Record<string, PlaceholderFunctionDefinition>
    Enums: Record<string, string>
    CompositeTypes: Record<string, unknown>
  }
}

export type PublicTableName = keyof Database['public']['Tables'] | string
