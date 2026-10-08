import { useWindowDimensions } from 'react-native';

export interface ResponsiveInfo {
  width: number;
  height: number;
  isTablet: boolean;
  isMobile: boolean;
  isLandscape: boolean;
  kpiColumns: number;
  gridWidth: string;
}

export const useResponsive = (): ResponsiveInfo => {
  const { width, height } = useWindowDimensions();

  const isTablet = width >= 600;
  const isMobile = width < 600;
  const isLandscape = width > height;

  const kpiColumns = isTablet ? (width >= 900 ? 4 : 3) : 2;
  const gridWidth = isTablet ? (width >= 900 ? '24%' : '31%') : '48%';

  return {
    width,
    height,
    isTablet,
    isMobile,
    isLandscape,
    kpiColumns,
    gridWidth,
  };
};
