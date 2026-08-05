export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      chrono_games: {
        Row: {
          created_at: string
          current_round: number
          current_team_id: string | null
          duration_seconds: number
          id: string
          room_id: string
          rounds: number
          status: string
          turn_ends_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_round?: number
          current_team_id?: string | null
          duration_seconds?: number
          id?: string
          room_id: string
          rounds?: number
          status?: string
          turn_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_round?: number
          current_team_id?: string | null
          duration_seconds?: number
          id?: string
          room_id?: string
          rounds?: number
          status?: string
          turn_ends_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chrono_games_current_team_id_fkey"
            columns: ["current_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chrono_games_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chrono_scores: {
        Row: {
          created_at: string
          found_words: Json
          game_id: string
          id: string
          points: number
          round: number
          skipped_words: Json
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          found_words?: Json
          game_id: string
          id?: string
          points?: number
          round?: number
          skipped_words?: Json
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          found_words?: Json
          game_id?: string
          id?: string
          points?: number
          round?: number
          skipped_words?: Json
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chrono_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "chrono_games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chrono_scores_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          current_word: string | null
          has_word: boolean | null
          id: string
          name: string
          room_id: string
          token: string
        }
        Insert: {
          created_at?: string
          current_word?: string | null
          has_word?: boolean | null
          id?: string
          name: string
          room_id: string
          token?: string
        }
        Update: {
          created_at?: string
          current_word?: string | null
          has_word?: boolean | null
          id?: string
          name?: string
          room_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          code: string
          created_at: string
          id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          player_id: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          room_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          room_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      word_suggestions: {
        Row: {
          author_name: string
          author_player_id: string | null
          created_at: string
          id: string
          room_id: string
          status: string
          target_player_id: string
          text: string
          updated_at: string
        }
        Insert: {
          author_name: string
          author_player_id?: string | null
          created_at?: string
          id?: string
          room_id: string
          status?: string
          target_player_id: string
          text: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_player_id?: string | null
          created_at?: string
          id?: string
          room_id?: string
          status?: string
          target_player_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "word_suggestions_author_player_id_fkey"
            columns: ["author_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_suggestions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "word_suggestions_target_player_id_fkey"
            columns: ["target_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      words: {
        Row: {
          category: string
          created_at: string
          id: string
          text: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          text: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          text?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_room: {
        Args: { p_code: string }
        Returns: {
          code: string
          id: string
        }[]
      }
      find_room: {
        Args: { p_code: string }
        Returns: {
          code: string
          id: string
        }[]
      }
      join_room: {
        Args: { p_name: string; p_room_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          room_id: string
          token: string
        }[]
      }
      my_suggestion: {
        Args: { p_player_id: string; p_token: string }
        Returns: {
          author_name: string
          author_player_id: string
          created_at: string
          id: string
          room_id: string
          status: string
          target_player_id: string
          text: string
        }[]
      }
      resolve_suggestion: {
        Args: {
          p_player_id: string
          p_status: string
          p_suggestion_id: string
          p_token: string
        }
        Returns: undefined
      }
      send_suggestion: {
        Args: {
          p_author_name: string
          p_author_player_id: string
          p_author_token: string
          p_room_id: string
          p_target_player_id: string
          p_text: string
        }
        Returns: undefined
      }
      set_player_word: {
        Args: { p_player_id: string; p_token: string; p_word: string }
        Returns: undefined
      }
      sync_player: {
        Args: { p_name: string; p_player_id: string; p_token: string }
        Returns: {
          created_at: string
          id: string
          name: string
          room_id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
