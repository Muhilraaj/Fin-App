import React, { createContext, useContext, useMemo, useState } from 'react';

const PageActionsContext = createContext(null);

export function PageActionsProvider({ children }) {
  const [actions, setActions] = useState(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);
  return (
    <PageActionsContext.Provider value={value}>
      {children}
    </PageActionsContext.Provider>
  );
}

export function usePageActions() {
  const context = useContext(PageActionsContext);
  if (!context) {
    throw new Error('usePageActions must be used within PageActionsProvider');
  }
  return context;
}
