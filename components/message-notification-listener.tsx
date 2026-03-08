"use client"

import { useMessageNotifications } from "@/hooks/use-message-notifications"

export function MessageNotificationListener() {
  useMessageNotifications()
  return null
}
