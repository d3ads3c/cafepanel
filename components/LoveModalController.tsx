"use client"
import React, { useEffect, useState, useRef } from 'react'
import LoveModal from './LoveModal'

export default function LoveModalController() {
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null)
  const [visible, setVisible] = useState(false)
  const hasShownRef = useRef(false)

  useEffect(() => {
    // fetch stored status from server
    let mounted = true
    fetch('/api/love-modal')
      .then(res => res.json())
      .then(data => {
        if (!mounted) return
        setAcknowledged(Boolean(data?.acknowledged))
      })
      .catch(() => {
        if (!mounted) return
        setAcknowledged(false)
      })
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      try {
        const path = (e.composedPath && e.composedPath()) || (e as any).path || []
        // if click happened inside the modal, ignore
        if (path.some((el: any) => el && el.id === 'love-modal')) return

        const target = e.target as HTMLElement | null
        if (!target) return
        if (target.tagName === 'BUTTON' || target.closest && target.closest('button')) {
          if (acknowledged) return
          // only show once per page load
          if (hasShownRef.current) return
          hasShownRef.current = true
          setVisible(true)
        }
      } catch (err) {
        // ignore
      }
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [acknowledged])

  const handleClose = async (ackParam?: boolean | string) => {
    setVisible(false)
    if (ackParam === undefined) return
    const body: any = { acknowledged: true }
    // If OK was clicked, ackParam === 'ok' -> save 'ok', otherwise save true
    body.result = ackParam === 'ok' ? 'ok' : true
    try {
      await fetch('/api/love-modal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      setAcknowledged(true)
    } catch (e) {
      // ignore errors for now
    }
  }

  // don't render anything until we know the acknowledged status
  if (acknowledged === null) return null

  return <LoveModal visible={visible} onClose={handleClose} />
}
