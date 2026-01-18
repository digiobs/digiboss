import { createContext, useContext, useState, ReactNode } from 'react';

type DateRange = '7d' | '14d' | '30d' | '90d' | 'ytd' | 'custom';
type CompareMode = 'previous' | 'year' | 'none';

interface DateRangeContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  compareMode: CompareMode;
  setCompareMode: (mode: CompareMode) => void;
}

const DateRangeContext = createContext<DateRangeContextType | undefined>(undefined);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [compareMode, setCompareMode] = useState<CompareMode>('previous');

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, compareMode, setCompareMode }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error('useDateRange must be used within a DateRangeProvider');
  }
  return context;
}
