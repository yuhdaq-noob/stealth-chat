export interface ReplyPreview {
  id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  read_at: string | null;
  reply_to_message_id: string | null;
  reply_to_message: ReplyPreview | null;
}

export interface MessageAttachment {
  file: File;
  previewUrl: string;
}
