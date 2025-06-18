// Utility functions for VectoCart

export const formatPrice = (price) => {
  if (!price || isNaN(price)) return 'Price not available'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(price)
}

export const formatDate = (date) => {
  if (!date) return ''
  const now = new Date()
  const diff = now - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export const generateRoomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const validateUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export const extractDomain = (url) => {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return 'Unknown'
  }
}

export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

export const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Platform-specific helpers
export const platformColors = {
  'Amazon': 'bg-orange-100 text-orange-800',
  'Flipkart': 'bg-blue-100 text-blue-800',
  'Myntra': 'bg-pink-100 text-pink-800',
  'AJIO': 'bg-purple-100 text-purple-800',
  'Meesho': 'bg-green-100 text-green-800',
  'default': 'bg-gray-100 text-gray-800'
}

export const getPlatformColor = (platform) => {
  return platformColors[platform] || platformColors.default
}

export const isValidProduct = (product) => {
  return product && 
         product.name && 
         product.name.trim().length > 0 && 
         product.url && 
         validateUrl(product.url)
}
