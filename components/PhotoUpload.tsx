'use client'

import { useRef, useState } from 'react'
import { uploadFiles } from '@/lib/uploadthing'

interface PhotoUploadProps {
  challengeId: string
  playerId: string
  existingUrl?: string | null
  disabled?: boolean
  onUploaded: (url: string) => void
}

export function PhotoUpload({ challengeId, playerId, existingUrl, disabled, onUploaded }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(existingUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setPreview(URL.createObjectURL(file))
    setUploading(true)

    try {
      const [result] = await uploadFiles('photoUploader', { files: [file] })
      onUploaded(result.ufsUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt="Your submission" className="w-full max-w-xs rounded-xl object-cover aspect-square" />
      ) : (
        <div className="w-full max-w-xs aspect-square rounded-xl bg-amber-100 flex items-center justify-center border-2 border-dashed border-amber-300">
          <span className="text-amber-400 text-sm">No photo yet</span>
        </div>
      )}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {!disabled && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="bg-amber-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {uploading ? 'Uploading...' : preview ? 'Replace photo' : 'Upload photo'}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
