import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export function usePushNotifications(session: any) {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  // Sync token to IndexedDB for the Service Worker to access during background push actions
  useEffect(() => {
    if (!session?.access_token) return
    const request = indexedDB.open('supabase-auth', 1)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains('tokens')) {
        db.createObjectStore('tokens')
      }
    }
    request.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (db.objectStoreNames.contains('tokens')) {
        const tx = db.transaction('tokens', 'readwrite')
        tx.objectStore('tokens').put(session.access_token, 'access_token')
      }
    }
  }, [session?.access_token])

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      setPermission(Notification.permission)
      checkSubscription()
    }
  }, [])

  const checkSubscription = async () => {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    setIsSubscribed(!!subscription)
  }

  const subscribe = useCallback(async () => {
    if (!isSupported) return false

    try {
      const p = await Notification.requestPermission()
      setPermission(p)
      if (p !== 'granted') return false

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) {
        alert('Error: VITE_VAPID_PUBLIC_KEY is missing from environment variables!')
        return false
      }
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
      })

      // Store in Supabase
      const subJSON = subscription.toJSON()
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: session?.user?.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys?.p256dh,
        auth: subJSON.keys?.auth
      }, { onConflict: 'endpoint' })

      if (error) {
        console.error('Failed to save push subscription to DB:', error)
        alert(`DB Save Error: ${error.message}`)
        return false
      }

      setIsSubscribed(true)
      return true
    } catch (err: any) {
      console.error('Failed to subscribe to push notifications:', err)
      alert(`Push Subscribe Error: ${err?.message || 'Check console'}`)
      return false
    }
  }, [isSupported, session?.user?.id])

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        
        // Remove from DB
        await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
      }
      setIsSubscribed(false)
    } catch (err) {
      console.error('Failed to unsubscribe:', err)
    }
  }, [])

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe
  }
}

function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
