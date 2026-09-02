export interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

export interface MessageAttachment {
  file: File;
  previewUrl: string;
}
