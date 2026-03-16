export interface TelegramLog {
  id: string
  category: string
  caller: string
  text: string
  chat_id: string
  status: string
  error_message: string | null
  telegram_message_id: number | null
  created_at: string
}
