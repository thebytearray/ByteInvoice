"use client"

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export function StoreInitializer() {
  const { initializeData } = useStore()

  useEffect(() => {
    initializeData()
  }, [initializeData])

  return null
} 