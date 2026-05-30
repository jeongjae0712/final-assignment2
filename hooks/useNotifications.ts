'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types/database'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface UseNotificationsReturn {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  isLoading: boolean
}

export function useNotifications(userId: string | null): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const lastReceivedAtRef = useRef<string | null>(null)
  const supabase = createClient()

  const fetchNotifications = useCallback(async (after?: string) => {
    const url = after
      ? `/api/notifications?after=${encodeURIComponent(after)}`
      : '/api/notifications'
    const res = await fetch(url)
    if (!res.ok) return
    const json = await res.json()
    const fetched: Notification[] = json.notifications ?? []

    if (after) {
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id))
        const newOnes = fetched.filter(n => !existingIds.has(n.id))
        return [...newOnes, ...prev]
      })
    } else {
      setNotifications(fetched)
      setUnreadCount(json.unread_count ?? 0)
    }

    if (fetched.length > 0) {
      lastReceivedAtRef.current = fetched[0].created_at
    }
  }, [])

  const subscribe = useCallback(() => {
    if (!userId) return

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on<Notification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const n = payload.new as Notification
          setNotifications(prev => [n, ...prev])
          if (!n.is_read) setUnreadCount(c => c + 1)
          lastReceivedAtRef.current = n.created_at
        },
      )
      .on<Notification>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: RealtimePostgresChangesPayload<Notification>) => {
          const updated = payload.new as Notification
          const old = payload.old as Partial<Notification>
          setNotifications(prev =>
            prev.map(n => (n.id === updated.id ? updated : n)),
          )
          setUnreadCount(prev =>
            Math.max(0, prev - (updated.is_read && !old.is_read ? 1 : 0)),
          )
        },
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED' && lastReceivedAtRef.current) {
          fetchNotifications(lastReceivedAtRef.current)
        }
      })

    channelRef.current = channel
  }, [userId, supabase, fetchNotifications])

  useEffect(() => {
    if (!userId) return

    setIsLoading(true)
    fetchNotifications().finally(() => setIsLoading(false))
    subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, fetchNotifications, subscribe, supabase])

  const markAsRead = useCallback(async (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, is_read: true } : n)),
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }, [])

  const markAllAsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    })
  }, [])

  return { notifications, unreadCount, markAsRead, markAllAsRead, isLoading }
}
