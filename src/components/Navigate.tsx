import  { useEffect } from 'react';

interface NavigateProps {
  to: string;
}

// Simple navigation component since we don't have react-router
export function Navigate({ to }: NavigateProps) {
  useEffect(() => {
    window.history.pushState({}, '', to);
    // Dispatch a custom event to notify about navigation
    window.dispatchEvent(new CustomEvent('navigation', { detail: { path: to } }));
  }, [to]);
  
  return null;
}
 