/**
 * Button creation utilities for content script
 */

/**
 * Creates a cart icon SVG element
 */
export function createCartIcon(): HTMLElement {
  const icon = document.createElement('span');
  icon.className = 'vectocart-cart-icon';
  icon.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8" cy="21" r="1"></circle>
      <circle cx="19" cy="21" r="1"></circle>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
    </svg>
  `;
  return icon;
}

/**
 * Sets the button text while preserving the icon
 */
export function setButtonText(button: HTMLButtonElement, text: string): void {
  // Find existing icon
  const icon = button.querySelector('.vectocart-cart-icon');
  
  // Remove all child nodes
  while (button.firstChild) {
    button.removeChild(button.firstChild);
  }
  
  // Re-add icon (preserve existing or create new)
  if (icon) {
    button.appendChild(icon);
  } else {
    button.appendChild(createCartIcon());
  }
  
  // Add text
  button.appendChild(document.createTextNode(text));
}

/**
 * Creates the main VectoCart button
 */
export function createButton(): HTMLButtonElement {
  const button = document.createElement('button');
  button.className = 'vectocart-button';
  
  // Add cart icon
  const icon = createCartIcon();
  button.appendChild(icon);
  
  // Add text
  const text = document.createTextNode('Add to VectoCart');
  button.appendChild(text);
  
  button.setAttribute('aria-label', 'Add product to VectoCart');
  
  return button;
}

