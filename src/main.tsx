import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Protege a árvore do React contra crashes periódicos de DOM (removeChild / insertBefore)
// causados por extensões do navegador ou tradutores automáticos durante atualizações de cronômetro.
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(child: T): T {
    if (child.parentNode !== this) {
      return child;
    }
    return originalRemoveChild.apply(this, arguments as any) as T;
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments as any) as T;
  };
}

createRoot(document.getElementById('root')!).render(<App />);

