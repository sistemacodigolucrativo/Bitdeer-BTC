/**
 * Safe clipboard copy utility
 * Handles iframe restrictions, unfocused documents, and browser compatibility
 * without throwing unhandled exceptions.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try standard Navigator Clipboard API if available and document is focused
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Continue to textarea fallback
  }

  // 2. Fallback using temporary textarea element (works in iframes and when document focus is restricted)
  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Prevent scrolling to bottom
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      textArea.style.opacity = '0';
      textArea.setAttribute('readonly', '');

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch {
    // Fallback failed gracefully
  }

  return false;
}
