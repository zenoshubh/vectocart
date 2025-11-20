/**
 * Dropdown utilities for content script
 */

import type { Room } from '@/types/rooms';

/**
 * Creates a dropdown menu for room selection
 */
export function createDropdown(
  rooms: Room[], 
  onRoomClick: (room: Room) => void,
  onRemove: (dropdown: HTMLElement) => void
): HTMLElement {
  const dropdown = document.createElement('div');
  dropdown.className = 'vectocart-dropdown';
  
  if (rooms.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'vectocart-dropdown-empty';
    empty.textContent = 'No rooms available';
    dropdown.appendChild(empty);
  } else {
    rooms.forEach((room) => {
      const item = document.createElement('div');
      item.className = 'vectocart-dropdown-item';
      item.textContent = room.name;
      item.setAttribute('role', 'button');
      item.setAttribute('tabindex', '0');
      item.addEventListener('click', () => {
        onRoomClick(room);
        onRemove(dropdown);
      });
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onRoomClick(room);
          onRemove(dropdown);
        }
      });
      dropdown.appendChild(item);
    });
  }
  
  return dropdown;
}

