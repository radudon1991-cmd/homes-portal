import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useLang } from '../lib/i18n'
import { compressImage } from '../lib/image'

// Account verification (migration19, simplified by the owner
// 2026-10-19 — "we are not the bank"): the member takes ONE
// live photo with the camera INSIDE this page (getUserMedia —
// there is no file picker, so gallery or downloaded photos
// cannot be used). No ID documents are collected. The photo
// goes to the private 'verification-photos' bucket; ONLY an
// admin can ever open it (the Moderation-page queue loads it
// through a short-lived signed URL). Verified members can see
// sellers' contact details and get a ✅ badge.
export default function VerifyAccount({ profile, onChanged }) {
  const { t } = useLang()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [phase, setPhase] = useState('idle') // idle | camera | captured | uploading
  const [shot, setShot] = useState(null) // { blob, url }
  const [error, setError] = useState('') // '' | denied | nocamera | failed

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((tr) => tr.stop())
      streamRef.current = null
    }
  }

  useEffect(() => stopCamera, [])

  const startCamera = async () => {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('nocamera')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      setPhase('camera')
      // The <video> renders after setPhase; attach next tick.
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream
      }, 50)
    } catch {
      setError('denied')
    }
  }

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const scale = Math.min(1, 1280 / (video.videoWidth || 1280))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round((video.videoWidth || 1280) * scale)
    canvas.height = Math.round((video.videoHeight || 960) * scale)
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError('failed')
          return
        }
        setShot({ blob, url: URL.createObjectURL(blob) })
        stopCamera()
        setPhase('captured')
      },
      'image/jpeg',
      0.85
    )
  }

  const cancel = () => {
    stopCamera()
    if (shot) URL.revokeObjectURL(shot.url)
    setShot(null)
    setPhase('idle')
  }

  const submit = async () => {
    if (!shot) return
    setPhase('uploading')
    setError('')
    try {
      const file = new File([shot.blob], 'verify.jpg', { type: 'image/jpeg' })
      const prepared = await compressImage(file)
      const path = `${profile.id}/verify-${Date.now()}.jpg`
      const { error: upErr } = await supabase.storage
        .from('verification-photos')
        .upload(path, prepared, { contentType: 'image/jpeg' })
      if (upErr) throw upErr
      if (profile.verification_photo_path) {
        // Best effort: remove the previous submission.
        await supabase.storage
          .from('verification-photos')
          .remove([profile.verification_photo_path])
      }
      const { error: updErr } = await supabase
        .from('profiles')
        .update({
          verification_photo_path: path,
          verification_status: 'pending',
          verification_requested_at: new Date().toISOString(),
        })
        .eq('id', profile.id)
      if (updErr) throw updErr
      if (shot) URL.revokeObjectURL(shot.url)
      setShot(null)
      setPhase('idle')
      onChanged()
    } catch {
      setError('failed')
      setPhase('captured')
    }
  }

  return (
    <div className="profile-card">
      <h3>🪪 {t('verify_title')}</h3>

      {profile.is_verified ? (
        <p className="verify-status ok">
          ✅ {t('verified_badge')} — {t('verify_done')}
        </p>
      ) : profile.verification_status === 'pending' && phase === 'idle' ? (
        <>
          <p className="verify-status">⏳ {t('verify_waiting')}</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={startCamera}>
            {t('verify_retake')}
          </button>
        </>
      ) : (
        <>
          {profile.verification_status === 'rejected' && (
            <p className="error-text">❌ {t('verify_rejected')}</p>
          )}
          <p className="hint">{t('verify_explain')}</p>

          {phase === 'idle' && (
            <button type="button" className="btn btn-primary" onClick={startCamera}>
              📷 {t('verify_start')}
            </button>
          )}

          {phase === 'camera' && (
            <div className="camera-box">
              <video ref={videoRef} autoPlay playsInline muted />
              <p className="hint">{t('verify_camera_tip')}</p>
              <div className="msg-actions">
                <button type="button" className="btn btn-ghost" onClick={cancel}>
                  {t('verify_cancel')}
                </button>
                <button type="button" className="btn btn-primary" onClick={capture}>
                  📸 {t('verify_capture')}
                </button>
              </div>
            </div>
          )}

          {(phase === 'captured' || phase === 'uploading') && shot && (
            <div className="camera-box">
              <img src={shot.url} alt="" />
              <div className="msg-actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={phase === 'uploading'}
                  onClick={() => {
                    if (shot) URL.revokeObjectURL(shot.url)
                    setShot(null)
                    startCamera()
                  }}
                >
                  {t('verify_retake')}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={phase === 'uploading'}
                  onClick={submit}
                >
                  {phase === 'uploading' ? t('verify_uploading') : t('verify_use_photo')}
                </button>
              </div>
            </div>
          )}

          {error === 'denied' && <p className="error-text">{t('verify_denied')}</p>}
          {error === 'nocamera' && <p className="error-text">{t('verify_no_camera')}</p>}
          {error === 'failed' && <p className="error-text">{t('verify_failed')}</p>}
        </>
      )}
    </div>
  )
}
