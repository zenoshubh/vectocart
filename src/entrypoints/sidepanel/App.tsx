import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { AuthForm } from '@/components/AuthForm';
import { UsernameSetup } from '@/components/UsernameSetup';
import { RoomsView } from '@/components/RoomsView';
import { RoomDetail } from '@/components/RoomDetail';
import { RoomMembers } from '@/components/RoomMembers';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/hooks/useAuth';
import { UserProfileProvider, useUserProfileContext } from '@/contexts/UserProfileContext';
import type { Room } from '@/types/rooms';

type View = 'rooms' | 'room-detail' | 'room-members';

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { hasUsername, loading: profileLoading } = useUserProfileContext();
  const [currentView, setCurrentView] = useState<View>('rooms');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleRoomClick(room: Room) {
    setSelectedRoom(room);
    setCurrentView('room-detail');
  }

  function handleBack() {
    if (currentView === 'room-members') {
      setCurrentView('room-detail');
    } else {
      setCurrentView('rooms');
      setSelectedRoom(null);
    }
  }

  function handleMembersClick() {
    setCurrentView('room-members');
  }

  async function handleRefresh() {
    setRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    // Small delay to show loading animation
    await new Promise((resolve) => setTimeout(resolve, 500));
    setRefreshing(false);
  }

  const showBack = currentView !== 'rooms';
  const showRefresh = currentView === 'rooms';

  // Show loading state while checking auth (but not during username setup)
  if (authLoading || (profileLoading && isAuthenticated && hasUsername)) {
    return (
      <ErrorBoundary>
        <div className="min-h-dvh bg-white flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-lg bg-[#E40046] flex items-center justify-center animate-pulse">
              <span className="text-white text-sm font-bold">V</span>
            </div>
            <p className="text-sm text-[#6B7280]">Loading...</p>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  // Show sign-in screen when not authenticated
  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <div className="min-h-dvh bg-white">
          <AuthForm />
          <Toaster />
        </div>
      </ErrorBoundary>
    );
  }

  // Show username setup if user doesn't have a username
  // Don't show loading during username setup - let the component handle its own loading state
  if (!hasUsername) {
    return (
      <ErrorBoundary>
        <div className="min-h-dvh bg-white">
          <UsernameSetup />
          <Toaster />
        </div>
      </ErrorBoundary>
    );
  }

  // Show main app when authenticated
  return (
    <ErrorBoundary>
      <div className="min-h-dvh bg-white text-[#111827] flex flex-col">
        <Header
          showBack={showBack}
          onBack={handleBack}
          onRefresh={showRefresh ? handleRefresh : undefined}
          refreshing={refreshing}
        />

        <main className="flex-1 overflow-y-auto">
          {currentView === 'rooms' && (
            <RoomsView
              onRoomClick={handleRoomClick}
              onRefresh={handleRefresh}
              loading={refreshing}
              refreshTrigger={refreshTrigger}
            />
          )}

          {currentView === 'room-detail' && selectedRoom && (
            <RoomDetail room={selectedRoom} onBack={handleBack} onMembersClick={handleMembersClick} />
          )}

          {currentView === 'room-members' && selectedRoom && (
            <RoomMembers room={selectedRoom} onBack={handleBack} />
          )}
        </main>
        <Toaster />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <UserProfileProvider>
      <AppContent />
    </UserProfileProvider>
  );
}

export default App;
