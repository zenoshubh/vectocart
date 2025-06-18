// Background script for VectoCart
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { getAuth } from 'firebase/auth/web-extension'

// Firebase configuration (same as in lib/firebase.js)
const firebaseConfig = {
  apiKey: "AIzaSyAtH8JNp5pPetQNa_jsrAoM5ncMksINc5E",
  authDomain: "vectocart-8b068.firebaseapp.com",
  projectId: "vectocart-8b068",
  storageBucket: "vectocart-8b068.firebasestorage.app",
  messagingSenderId: "529205551001",
  appId: "1:529205551001:web:54dbedf465d1f8c06cbd08",
  measurementId: "G-1BNS8KDRJ5"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

console.log('VectoCart background script loaded')

// Context menu
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'addToVectoCart',
    title: 'Add to VectoCart',
    contexts: ['link']
  })
})

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'addToVectoCart') {
    try {
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: 'addProductFromContext'
      })
      
      if (response?.success) {
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: '/vite.svg',
          title: 'VectoCart',
          message: 'Product added to your cart!'
        })
      }
    } catch (error) {
      console.error('Error adding product from context menu:', error)
    }
  }
})

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'addProduct') {
    handleAddProduct(request.product)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('Error adding product:', error)
        sendResponse({ success: false, message: error.message })
      })
    return true // Keep message channel open for async response
  }
})

// Add product to Firebase
async function handleAddProduct(productInfo) {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      return { success: false, message: 'Please sign in to add products!' }
    }
    
    // Get current room from storage
    const result = await chrome.storage.local.get(['currentRoom'])
    const currentRoom = result.currentRoom
    
    if (!currentRoom) {
      return { success: false, message: 'Please join a room first to add products!' }
    }

    // Add product to Firebase
    const productData = {
      ...productInfo,
      addedAt: serverTimestamp(),
      addedBy: auth.currentUser.uid,
      roomId: currentRoom.id
    }

    await addDoc(collection(db, 'rooms', currentRoom.id, 'products'), productData)
    
    return { success: true, message: 'Product added successfully!' }
  } catch (error) {
    console.error('Error adding product:', error)
    return { success: false, message: 'Failed to add product: ' + error.message }
  }
}

// Handle extension icon click to open sidebar
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.sidePanel.open({ tabId: tab.id })
  } catch (error) {
    console.error('Error opening side panel:', error)
    // Fallback: try to open side panel without tabId
    try {
      await chrome.sidePanel.open()
    } catch (fallbackError) {
      console.error('Fallback failed:', fallbackError)
    }
  }
})