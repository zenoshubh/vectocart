import React, { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { AuthForm } from '@/components/auth/AuthForm';
import { UsernameSetup } from '@/components/auth/UsernameSetup';
import { RoomsView } from '@/components/rooms/RoomsView';
import { RoomDetail } from '@/components/rooms/RoomDetail';
import { RoomMembers } from '@/components/rooms/RoomMembers';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';
import { Loading } from '@/components/layout/Loading';
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

  function handleLeaveRoom() {
    // Navigate to dashboard (rooms list) after leaving
    setCurrentView('rooms');
    setSelectedRoom(null);
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

  // Show loading state until authentication and profile states are confirmed
  // This prevents flashing of auth/username screens when user is already authenticated
  const isLoading = authLoading || (isAuthenticated && profileLoading);

  if (isLoading) {
    // Determine loading text based on what we're checking
    let loadingText = 'Loading...';
    let loadingSubtitle: string | undefined;

    if (authLoading) {
      loadingText = 'Checking authentication...';
      loadingSubtitle = 'Verifying your session';
    } else if (isAuthenticated && profileLoading) {
      loadingText = 'Loading your profile...';
      loadingSubtitle = 'Getting your account ready';
    }

    return (
      <ErrorBoundary>
        <Loading text={loadingText} subtitle={loadingSubtitle} />
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
      <div className="min-h-dvh bg-white text-[#111827] flex flex-col overflow-hidden">
        <Header
          showBack={showBack}
          onBack={handleBack}
          onRefresh={showRefresh ? handleRefresh : undefined}
          refreshing={refreshing}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden">
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
            <RoomMembers room={selectedRoom} onBack={handleBack} onLeave={handleLeaveRoom} />
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
