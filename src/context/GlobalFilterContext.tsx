import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { formatDateToYYYYMMDD } from '../utils/formatters';

export type DatePreset = 'TODAY' | 'YESTERDAY' | 'LAST7' | 'THIS_MONTH' | 'CUSTOM';

export interface GlobalFilterState {
  fromDate: string;
  toDate: string;
  selectedPreset: DatePreset;
  selectedBranchCodes: string[];
  isFilterModalOpen: boolean;
}

export interface GlobalFilterContextValue extends GlobalFilterState {
  openFilterModal: () => void;
  closeFilterModal: () => void;
  setFromDate: (date: string) => void;
  setToDate: (date: string) => void;
  setSelectedPreset: (preset: DatePreset) => void;
  setSelectedBranchCodes: (branches: string[]) => void;
  applyPreset: (preset: DatePreset) => void;
  resetFilters: () => void;
  setFilterState: (from: string, to: string, preset: DatePreset, branches: string[]) => void;
}

const getTodayString = (): string => formatDateToYYYYMMDD(new Date());

const getYesterdayString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return formatDateToYYYYMMDD(d);
};

const getLast7DaysString = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return formatDateToYYYYMMDD(d);
};

const getFirstDayOfMonthString = (): string => {
  const d = new Date();
  d.setDate(1);
  return formatDateToYYYYMMDD(d);
};

const defaultState: GlobalFilterState = {
  fromDate: getTodayString(),
  toDate: getTodayString(),
  selectedPreset: 'TODAY',
  selectedBranchCodes: [],
  isFilterModalOpen: false,
};

const GlobalFilterContext = createContext<GlobalFilterContextValue | undefined>(undefined);

export const GlobalFilterProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fromDate, setFromDateState] = useState<string>(defaultState.fromDate);
  const [toDate, setToDateState] = useState<string>(defaultState.toDate);
  const [selectedPreset, setSelectedPresetState] = useState<DatePreset>(defaultState.selectedPreset);
  const [selectedBranchCodes, setSelectedBranchCodesState] = useState<string[]>(defaultState.selectedBranchCodes);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  const openFilterModal = useCallback(() => setIsFilterModalOpen(true), []);
  const closeFilterModal = useCallback(() => setIsFilterModalOpen(false), []);

  const setFromDate = useCallback((date: string) => {
    setFromDateState(date);
    setSelectedPresetState('CUSTOM');
  }, []);

  const setToDate = useCallback((date: string) => {
    setToDateState(date);
    setSelectedPresetState('CUSTOM');
  }, []);

  const setSelectedPreset = useCallback((preset: DatePreset) => {
    setSelectedPresetState(preset);
  }, []);

  const setSelectedBranchCodes = useCallback((branches: string[]) => {
    setSelectedBranchCodesState(branches);
  }, []);

  const applyPreset = useCallback((preset: DatePreset) => {
    const today = getTodayString();
    setSelectedPresetState(preset);

    switch (preset) {
      case 'TODAY':
        setFromDateState(today);
        setToDateState(today);
        break;
      case 'YESTERDAY': {
        const yest = getYesterdayString();
        setFromDateState(yest);
        setToDateState(yest);
        break;
      }
      case 'LAST7':
        setFromDateState(getLast7DaysString());
        setToDateState(today);
        break;
      case 'THIS_MONTH':
        setFromDateState(getFirstDayOfMonthString());
        setToDateState(today);
        break;
      default:
        break;
    }
  }, []);

  const resetFilters = useCallback(() => {
    const today = getTodayString();
    setFromDateState(today);
    setToDateState(today);
    setSelectedPresetState('TODAY');
    setSelectedBranchCodesState([]);
  }, []);

  const setFilterState = useCallback((from: string, to: string, preset: DatePreset, branches: string[]) => {
    setFromDateState(from);
    setToDateState(to);
    setSelectedPresetState(preset);
    setSelectedBranchCodesState(branches);
  }, []);

  const contextValue = React.useMemo(
    () => ({
      fromDate,
      toDate,
      selectedPreset,
      selectedBranchCodes,
      isFilterModalOpen,
      openFilterModal,
      closeFilterModal,
      setFromDate,
      setToDate,
      setSelectedPreset,
      setSelectedBranchCodes,
      applyPreset,
      resetFilters,
      setFilterState,
    }),
    [
      fromDate,
      toDate,
      selectedPreset,
      selectedBranchCodes,
      isFilterModalOpen,
      openFilterModal,
      closeFilterModal,
      setFromDate,
      setToDate,
      setSelectedPreset,
      setSelectedBranchCodes,
      applyPreset,
      resetFilters,
      setFilterState,
    ]
  );

  return (
    <GlobalFilterContext.Provider value={contextValue}>
      {children}
    </GlobalFilterContext.Provider>
  );
};

export const useGlobalFilter = (): GlobalFilterContextValue => {
  const context = useContext(GlobalFilterContext);
  if (!context) {
    throw new Error('useGlobalFilter must be used within a GlobalFilterProvider');
  }
  return context;
};
