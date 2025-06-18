import React, { useState, useEffect } from 'react'
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc,
  getDocs,
  where
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { onAuthStateChange } from '../lib/auth'
import { formatPrice, formatDate, getPlatformColor, generateRoomCode, isValidProduct } from '../lib/utils'
import { Users, Plus, Filter, ArrowUpDown, ShoppingCart, ExternalLink, X, Copy, Check } from 'lucide-react'
import LoginForm from './LoginForm'
import UserProfile from './UserProfile'

function App() {
  // Authentication state
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  
  // Existing state
  const [currentRoom, setCurrentRoom] = useState(null)
  const [products, setProducts] = useState([])
  const [view, setView] = useState('rooms') // 'rooms', 'cart'
  const [sortBy, setSortBy] = useState('recent') // 'recent', 'price-low', 'price-high'
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Room management state
  const [roomForm, setRoomForm] = useState({
    roomName: '',
    roomCode: ''
  })  
  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      setAuthLoading(false)
      
      // Clear room data when user logs out
      if (!user) {
        setCurrentRoom(null)
        setProducts([])
        setView('rooms')
        chrome.storage.local.remove(['currentRoom'])
      }
    })
    
    return () => unsubscribe()
  }, [])
  
  // Listen to products in current room
  useEffect(() => {
    if (!currentRoom || !user) return
    
    const q = query(
      collection(db, 'rooms', currentRoom.id, 'products'),
      orderBy('addedAt', 'desc')
    )
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setProducts(productsData)
    })
    
    return () => unsubscribe()
  }, [currentRoom])
    // Load current room from storage
  useEffect(() => {
    if (!user) return
    
    chrome.storage.local.get(['currentRoom'], (result) => {
      if (result.currentRoom) {
        setCurrentRoom(result.currentRoom)
        setView('cart')
      }
    })
  }, [user])
    const createRoom = async () => {
    if (!roomForm.roomName.trim() || !user) return
    
    setIsLoading(true)
    try {
      const roomCode = generateRoomCode()
      const roomData = {
        name: roomForm.roomName,
        code: roomCode,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        memberCount: 1
      }
      
      const docRef = await addDoc(collection(db, 'rooms'), roomData)
      const newRoom = { id: docRef.id, ...roomData, code: roomCode }
      
      setCurrentRoom(newRoom)
      chrome.storage.local.set({ currentRoom: newRoom })
      setView('cart')
      setMessage(`Room created! Share code: ${roomCode}`)
      setRoomForm({ roomName: '', roomCode: '' })
    } catch (error) {
      setMessage('Error creating room: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }
    const joinRoom = async () => {
    if (!roomForm.roomCode.trim() || !user) return
    
    setIsLoading(true)
    try {
      // Query rooms by code
      const roomsRef = collection(db, 'rooms')
      const snapshot = await getDocs(query(roomsRef, where('code', '==', roomForm.roomCode.toUpperCase())))
      
      if (snapshot.empty) {
        setMessage('Room not found!')
        return
      }
      
      const roomDoc = snapshot.docs[0]
      const roomData = { id: roomDoc.id, ...roomDoc.data() }
      
      setCurrentRoom(roomData)
      chrome.storage.local.set({ currentRoom: roomData })
      setView('cart')
      setMessage('Joined room successfully!')
      setRoomForm({ roomName: '', roomCode: '' })
    } catch (error) {
      setMessage('Error joining room: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  const leaveRoom = () => {
    setCurrentRoom(null)
    setProducts([])
    chrome.storage.local.remove(['currentRoom'])
    setView('rooms')
    setMessage('Left room successfully')
  }
    const removeProduct = async (productId) => {
    if (!currentRoom || !user) return
    
    try {
      await deleteDoc(doc(db, 'rooms', currentRoom.id, 'products', productId))
      setMessage('Product removed!')
      setTimeout(() => setMessage(''), 3000)
    } catch (error) {
      setMessage('Error removing product: ' + error.message)
    }
  }
    const copyRoomCode = async () => {
    if (!currentRoom) return
    
    try {
      await navigator.clipboard.writeText(currentRoom.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = currentRoom.code
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }
  
  // Auth handlers
  const handleLogin = (user) => {
    setUser(user)
    setMessage('Successfully signed in!')
    setTimeout(() => setMessage(''), 3000)
  }
  
  const handleLogout = () => {
    setUser(null)
    setCurrentRoom(null)
    setProducts([])
    setView('rooms')
    chrome.storage.local.remove(['currentRoom'])
    setMessage('Successfully signed out!')
    setTimeout(() => setMessage(''), 3000)
  }
  
  // Show loading spinner during auth initialization
  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Show login form if user is not authenticated
  if (!user) {
    return <LoginForm onLogin={handleLogin} />
  }
  
  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter(product => {
      if (filterPlatform === 'all') return true
      return product.platform.toLowerCase().includes(filterPlatform.toLowerCase())
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
        default:
          return new Date(b.addedAt?.toDate?.() || 0) - new Date(a.addedAt?.toDate?.() || 0)
      }
    })
  
  const platforms = ['all', ...new Set(products.map(p => p.platform))]
  
  if (view === 'rooms') {
    return (
      <div className='min-h-screen w-full bg-white flex flex-col'>
        <UserProfile user={user} onLogout={handleLogout} />
        
        <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6'>
          <h1 className='text-2xl font-bold flex items-center gap-3'>
            <ShoppingCart className='w-8 h-8' />
            VectoCart
          </h1>
          <p className='text-sm opacity-90 mt-1'>Collaborative Shopping Made Easy</p>
        </div>
        
        <div className='flex-1 p-6 space-y-8 overflow-y-auto'>
          <div>
            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
              <Plus className='w-6 h-6' />
              Create Room
            </h2>
            <div className='space-y-4'>
              <input
                type="text"
                placeholder="Enter room name (e.g., Family Shopping, Weekend Trip)"
                value={roomForm.roomName}
                onChange={(e) => setRoomForm({...roomForm, roomName: e.target.value})}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-base'
                onKeyPress={(e) => e.key === 'Enter' && createRoom()}
              />
              <button
                onClick={createRoom}
                disabled={isLoading || !roomForm.roomName.trim()}
                className='w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium'
              >
                {isLoading ? 'Creating Room...' : 'Create Room'}
              </button>
            </div>
          </div>
          
          <div className='border-t border-gray-200 pt-8'>
            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
              <Users className='w-6 h-6' />
              Join Room
            </h2>
            <div className='space-y-4'>              <input
                type="text"
                placeholder="Enter 6-digit room code"
                value={roomForm.roomCode}
                onChange={(e) => setRoomForm({...roomForm, roomCode: e.target.value.toUpperCase()})}
                className='w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-mono text-center tracking-wider'
                onKeyPress={(e) => e.key === 'Enter' && joinRoom()}
                maxLength={6}
              />
              <button
                onClick={joinRoom}
                disabled={isLoading || !roomForm.roomCode.trim()}
                className='w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base font-medium'
              >
                {isLoading ? 'Joining Room...' : 'Join Room'}
              </button>
            </div>
          </div>
          
          <div className='bg-blue-50 rounded-xl p-6 text-blue-700'>
            <h3 className='font-semibold mb-3 text-lg'>How to use VectoCart:</h3>
            <ul className='space-y-2 text-sm leading-relaxed'>
              <li className='flex items-start gap-2'>
                <span className='text-blue-500 font-bold'>1.</span>
                Create or join a room with friends & family
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-500 font-bold'>2.</span>
                Browse Amazon, Flipkart, Myntra, AJIO, or Meesho
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-500 font-bold'>3.</span>
                Click "Add to VectoCart" button on product pages
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-blue-500 font-bold'>4.</span>
                See everyone's products in real-time shared cart
              </li>
            </ul>
          </div>
        </div>
        
        {message && (
          <div className={`m-6 p-4 rounded-lg text-sm ${
            message.includes('Error') 
              ? 'bg-red-100 text-red-700 border border-red-200' 
              : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    )
  }
    return (
    <div className='min-h-screen w-full bg-white flex flex-col'>
      <UserProfile user={user} onLogout={handleLogout} />
      
      <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sticky top-0 z-10'>
        <div className='flex items-center justify-between'>
          <div className='flex-1 min-w-0'>
            <h1 className='text-xl font-bold truncate'>{currentRoom?.name}</h1>
            <div className='flex items-center gap-2'>
              <span className='text-sm opacity-90'>Code: {currentRoom?.code}</span>
              <button
                onClick={copyRoomCode}
                className='p-1 hover:bg-white/20 rounded transition-colors'
                title='Copy room code'
              >
                {copiedCode ? (
                  <Check className='w-4 h-4' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>
          <button
            onClick={leaveRoom}
            className='p-2 hover:bg-white/20 rounded transition-colors ml-2'
            title='Leave room'
          >
            <X className='w-5 h-5' />
          </button>
        </div>
      </div>
      
      <div className='p-4 border-b border-gray-200 bg-gray-50 sticky top-[88px] z-10'>
        <div className='flex gap-3 mb-4'>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            <option value="recent">Recent First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
          <select
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            className='flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform === 'all' ? 'All Sites' : platform}
              </option>
            ))}
          </select>
        </div>
        <div className='text-sm text-gray-600 flex items-center gap-2'>
          <ShoppingCart className='w-4 h-4' />
          {filteredAndSortedProducts.length} products in shared cart
        </div>
      </div>
      
      <div className='flex-1 overflow-y-auto pb-6'>
        {filteredAndSortedProducts.length === 0 ? (
          <div className='p-12 text-center text-gray-500'>
            <ShoppingCart className='w-20 h-20 mx-auto mb-4 opacity-30' />
            <h3 className='text-xl font-medium mb-2'>No products yet</h3>
            <p className='text-base mb-4'>Start adding products from any supported e-commerce site!</p>
            <div className='text-sm text-gray-400'>
              <p>Supported: Amazon • Flipkart • Myntra • AJIO • Meesho</p>
            </div>
          </div>
        ) : (
          <div className='p-4 space-y-4'>
            {filteredAndSortedProducts.map(product => (
              <div key={product.id} className='border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-blue-300 bg-white'>
                <div className='flex gap-4'>
                  {product.image && (
                    <div className='flex-shrink-0'>
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className='w-24 h-24 object-cover rounded-lg border'
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                  <div className='flex-1 min-w-0'>
                    <h3 className='font-semibold text-base leading-tight mb-3 line-clamp-2'>
                      {product.name}
                    </h3>
                    <div className='flex items-center gap-3 mb-3'>
                      <span className='text-xl font-bold text-green-600'>
                        {formatPrice(product.price)}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getPlatformColor(product.platform)}`}>
                        {product.platform}
                      </span>
                    </div>
                    <div className='flex justify-between items-center'>
                      <a 
                        href={product.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className='text-blue-600 text-sm hover:underline flex items-center gap-1 transition-colors font-medium'
                      >
                        View Product <ExternalLink className='w-4 h-4' />
                      </a>
                      <div className='flex items-center gap-3'>
                        {product.addedAt && (
                          <span className='text-xs text-gray-500'>
                            {formatDate(product.addedAt.toDate())}
                          </span>
                        )}
                        <button
                          onClick={() => removeProduct(product.id)}
                          className='text-red-500 text-sm hover:text-red-700 transition-colors px-3 py-1 hover:bg-red-50 rounded-lg font-medium'
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {message && (
        <div className={`m-4 p-3 rounded-lg text-sm transition-all ${
          message.includes('Error') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message}
        </div>
      )}
    </div>
  )
}

export default App