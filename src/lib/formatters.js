/**
 * Normalize Indonesian WhatsApp number to international format
 * 08xx -> 628xx
 */
export function normalizeWhatsApp(number) {
  const cleaned = number.replace(/\D/g, '')
  if (cleaned.startsWith('62')) return cleaned
  if (cleaned.startsWith('0')) return '62' + cleaned.slice(1)
  if (cleaned.startsWith('8')) return '62' + cleaned
  return cleaned
}

/**
 * Validate Indonesian phone number
 */
export function isValidIndonesianPhone(number) {
  const cleaned = number.replace(/\D/g, '')
  return /^(0|62)?8[0-9]{8,11}$/.test(cleaned)
}

/**
 * Build WhatsApp message URL for claiming food
 */
export function buildWhatsAppUrl(donorWhatsapp, params) {
  const { claimerName, pickupCode, foodTitle, portions } = params
  const number = normalizeWhatsApp(donorWhatsapp)
  const message = encodeURIComponent(
    `Halo! Saya *${claimerName}* ingin mengambil pesanan dari BagiRasa.\n\n` +
    `🎫 *Kode Ambil:* ${pickupCode}\n` +
    `🍱 *Makanan:* ${foodTitle}\n` +
    `🍽️ *Jumlah Porsi:* ${portions} porsi\n\n` +
    `Mohon konfirmasinya, terima kasih! 🙏`
  )
  return `https://wa.me/${number}?text=${message}`
}

/**
 * Calculate expires_at from duration in hours
 */
export function calculateExpiresAt(hours) {
  const now = new Date()
  now.setHours(now.getHours() + hours)
  return now.toISOString()
}

/**
 * Format remaining time as HH:MM:SS
 */
export function formatCountdown(totalSeconds) {
  if (totalSeconds <= 0) return '00:00:00'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

/**
 * Generate local storage key for claimed posts
 */
export function getClaimedPostsKey() {
  return 'bagirasa_claimed_posts'
}

/**
 * Check if post is claimed on this device
 */
export function isPostClaimedLocally(postId) {
  try {
    const claimed = JSON.parse(localStorage.getItem(getClaimedPostsKey()) || '{}')
    return claimed[postId] || null
  } catch {
    return null
  }
}

/**
 * Save claim to localStorage
 */
export function saveClaimLocally(postId, claimData) {
  try {
    const claimed = JSON.parse(localStorage.getItem(getClaimedPostsKey()) || '{}')
    claimed[postId] = claimData
    localStorage.setItem(getClaimedPostsKey(), JSON.stringify(claimed))
  } catch {
    // ignore
  }
}

/**
 * Remove claim from localStorage
 */
export function removeClaimLocally(postId) {
  try {
    const claimed = JSON.parse(localStorage.getItem(getClaimedPostsKey()) || '{}')
    delete claimed[postId]
    localStorage.setItem(getClaimedPostsKey(), JSON.stringify(claimed))
  } catch {
    // ignore
  }
}

/**
 * Format weight saved from portions
 */
export function formatWeightSaved(portions) {
  const kg = (portions * 0.4).toFixed(1)
  return `${kg} kg`
}
