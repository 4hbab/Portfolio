export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type DraftRow = {
    id: number;
    content: Json;
    base_revision: number;
    version: number;
    updated_by: string;
    updated_at: string;
};

type PublishedRow = {
    id: number;
    revision: number;
    content: Json;
    published_by: string;
    published_at: string;
};

export type Database = {
    public: {
        Tables: {
            content_drafts: { Row: DraftRow; Insert: Partial<DraftRow>; Update: Partial<DraftRow>; Relationships: [] };
            content_revisions: { Row: Omit<PublishedRow, "id">; Insert: never; Update: never; Relationships: [] };
            published_snapshots: { Row: PublishedRow; Insert: never; Update: never; Relationships: [] };
            owner_accounts: { Row: { user_id: string; created_at: string }; Insert: never; Update: never; Relationships: [] };
        };
        Views: Record<string, never>;
        Functions: {
            initialize_portfolio_draft: { Args: { initial_content: Json }; Returns: DraftRow };
            save_portfolio_draft: { Args: { next_content: Json; expected_version: number }; Returns: DraftRow };
            publish_portfolio: { Args: { expected_draft_version: number; expected_base_revision: number }; Returns: PublishedRow };
            restore_portfolio_revision: { Args: { target_revision: number; expected_version: number }; Returns: DraftRow };
        };
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
};

