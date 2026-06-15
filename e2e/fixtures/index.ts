import { test as base } from '@playwright/test';
import { Topbar } from '../pages/Topbar';
import { DashboardPage } from '../pages/DashboardPage';
import { VehiclesPage } from '../pages/VehiclesPage';
import { FencePage } from '../pages/FencePage';
import { RiskPage } from '../pages/RiskPage';
import { DrivingPage } from '../pages/DrivingPage';
import { BatteryPage } from '../pages/BatteryPage';
import { TripsPage } from '../pages/TripsPage';
import { RepairPage } from '../pages/RepairPage';
import { VehicleSignalPage } from '../pages/VehicleSignalPage';
import { DataExportPage } from '../pages/DataExportPage';
import { SysUsersPage } from '../pages/SysUsersPage';

type Fixtures = {
  topbar: Topbar;
  dashboardPage: DashboardPage;
  vehiclesPage: VehiclesPage;
  fencePage: FencePage;
  riskPage: RiskPage;
  drivingPage: DrivingPage;
  batteryPage: BatteryPage;
  tripsPage: TripsPage;
  repairPage: RepairPage;
  vehicleSignalPage: VehicleSignalPage;
  dataExportPage: DataExportPage;
  sysUsersPage: SysUsersPage;
};

export const test = base.extend<Fixtures>({
  topbar: async ({ page }, use) => use(new Topbar(page)),
  dashboardPage: async ({ page }, use) => use(new DashboardPage(page)),
  vehiclesPage: async ({ page }, use) => use(new VehiclesPage(page)),
  fencePage: async ({ page }, use) => use(new FencePage(page)),
  riskPage: async ({ page }, use) => use(new RiskPage(page)),
  drivingPage: async ({ page }, use) => use(new DrivingPage(page)),
  batteryPage: async ({ page }, use) => use(new BatteryPage(page)),
  tripsPage: async ({ page }, use) => use(new TripsPage(page)),
  repairPage: async ({ page }, use) => use(new RepairPage(page)),
  vehicleSignalPage: async ({ page }, use) => use(new VehicleSignalPage(page)),
  dataExportPage: async ({ page }, use) => use(new DataExportPage(page)),
  sysUsersPage: async ({ page }, use) => use(new SysUsersPage(page)),
});

export { expect } from '@playwright/test';
