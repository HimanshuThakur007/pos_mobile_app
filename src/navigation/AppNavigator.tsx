import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { POSSalesDashboardScreen } from '../screens/POSSalesDashboardScreen';
import { SalesReportsScreen } from '../screens/SalesReportsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BillComparisonScreen } from '../screens/BillComparisonScreen';
import { ErpPosComparisonScreen } from '../screens/ErpPosComparisonScreen';
import { BranchWiseSalesScreen } from '../screens/BranchWiseSalesScreen';
import { BranchWiseSalesMatrixScreen } from '../screens/BranchWiseSalesMatrixScreen';
import { BranchWiseDailySalesScreen } from '../screens/BranchWiseDailySalesScreen';
import { BranchWiseDailySalesMatrixScreen } from '../screens/BranchWiseDailySalesMatrixScreen';
import { BranchWiseHourlySalesScreen } from '../screens/BranchWiseHourlySalesScreen';
import { BranchWiseHourlySalesMatrixScreen } from '../screens/BranchWiseHourlySalesMatrixScreen';
import { BranchWisePaymentModeScreen } from '../screens/BranchWisePaymentModeScreen';
import { BranchWiseSubCategorySalesScreen } from '../screens/BranchWiseSubCategorySalesScreen';
import { TopSellingItemsScreen } from '../screens/TopSellingItemsScreen';
import { BranchWiseDiscountOfferScreen } from '../screens/BranchWiseDiscountOfferScreen';
import { SalesPeriodComparisonScreen } from '../screens/SalesPeriodComparisonScreen';
import { ReconciliationDashboardScreen } from '../screens/ReconciliationDashboardScreen';
import { DepartmentTargetScreen } from '../screens/DepartmentTargetScreen';
import { DayWiseStoreSaleScreen } from '../screens/DayWiseStoreSaleScreen';
import { CustomBottomTabBar } from '../components/CustomBottomTabBar';
import { NavigationDrawer } from '../components/NavigationDrawer';
import { drawerEvents } from '../utils/drawerEvents';

export type MainTabParamList = {
  POSSales: undefined;
  Reports: undefined;
  Settings: undefined;
  ReconciliationDashboard: undefined;
  BillComparison: undefined;
  ErpPosComparison: undefined;
  SalesPeriodComparison: undefined;
  BranchWiseSales: undefined;
  BranchWiseSalesMatrix: undefined;
  BranchWiseDailySales: undefined;
  BranchWiseDailySalesMatrix: undefined;
  BranchWiseHourlySales: undefined;
  BranchWiseHourlySalesMatrix: undefined;
  BranchWisePaymentMode: undefined;
  BranchWiseSubCategorySales: undefined;
  TopSellingItems: undefined;
  BranchWiseDiscountOffer: undefined;
  DepartmentTarget: undefined;
  DayWiseStoreSale: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export const AppNavigator: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeScreenName, setActiveScreenName] = useState<string>('POSSales');

  useEffect(() => {
    const unsub = drawerEvents.subscribe((isOpen) => setDrawerOpen(isOpen));
    return () => unsub();
  }, []);

  const handleRouteNameChange = React.useCallback((routeName: string) => {
    setActiveScreenName((prev) => (prev !== routeName ? routeName : prev));
  }, []);

  return (
    <View style={styles.container}>
      <Tab.Navigator
        tabBar={(props) => (
          <CustomBottomTabBar
            {...props}
            activeRouteName={activeScreenName}
            onRouteNameChange={handleRouteNameChange}
          />
        )}
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
          },
        }}
      >
        <Tab.Screen name="POSSales" component={POSSalesDashboardScreen} />
        <Tab.Screen
          name="Reports"
          component={SalesReportsScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="ReconciliationDashboard"
          component={ReconciliationDashboardScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BillComparison"
          component={BillComparisonScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="ErpPosComparison"
          component={ErpPosComparisonScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="SalesPeriodComparison"
          component={SalesPeriodComparisonScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseSales"
          component={BranchWiseSalesScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseSalesMatrix"
          component={BranchWiseSalesMatrixScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseDailySales"
          component={BranchWiseDailySalesScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseDailySalesMatrix"
          component={BranchWiseDailySalesMatrixScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseHourlySales"
          component={BranchWiseHourlySalesScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseHourlySalesMatrix"
          component={BranchWiseHourlySalesMatrixScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWisePaymentMode"
          component={BranchWisePaymentModeScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseSubCategorySales"
          component={BranchWiseSubCategorySalesScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="TopSellingItems"
          component={TopSellingItemsScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="BranchWiseDiscountOffer"
          component={BranchWiseDiscountOfferScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="DepartmentTarget"
          component={DepartmentTargetScreen}
          options={{ tabBarButton: () => null }}
        />
        <Tab.Screen
          name="DayWiseStoreSale"
          component={DayWiseStoreSaleScreen}
          options={{ tabBarButton: () => null }}
        />
      </Tab.Navigator>

      <NavigationDrawer
        visible={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          drawerEvents.closeDrawer();
        }}
        activeScreen={activeScreenName}
        onNavigate={(screen) => {
          setDrawerOpen(false);
          drawerEvents.closeDrawer();
          if (navigation) {
            navigation.navigate('Main', { screen: screen });
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

