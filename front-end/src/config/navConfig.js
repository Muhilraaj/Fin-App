import HomeIcon from '@mui/icons-material/Home';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ConstructionIcon from '@mui/icons-material/Construction';
import PaymentsIcon from '@mui/icons-material/Payments';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LabelIcon from '@mui/icons-material/Label';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';

export const DRAWER_WIDTH = 260;

export const navGroups = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      { label: 'Home', path: '/page/home', title: 'Home', icon: HomeIcon },
    ],
  },
  {
    id: 'entry',
    label: 'Add entry',
    items: [
      { label: 'Expense', path: '/page/expense', title: 'Expenditure', icon: ReceiptLongIcon },
      { label: 'Construction', path: '/page/construction', title: 'Construction Expense', icon: ConstructionIcon },
      { label: 'Income', path: '/page/income', title: 'Income', icon: PaymentsIcon },
    ],
  },
  {
    id: 'reports',
    label: 'Reports',
    items: [
      { label: 'Expense details', path: '/page/expenseDetails', title: 'Expense Details', icon: AssessmentIcon },
      { label: 'Construction details', path: '/page/expenseDetails/construction', title: 'Construction Details', icon: AssessmentIcon },
      { label: 'Income details', path: '/page/incomeDetails', title: 'Income Details', icon: AssessmentIcon },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    items: [
      { label: 'Expense labels', path: '/page/manageLabels/expense', title: 'Expense Labels', icon: LabelIcon },
      { label: 'Income labels', path: '/page/manageLabels/income', title: 'Income Labels', icon: LabelIcon },
      { label: 'On-behalf', path: '/page/manageOnBehalf', title: 'On-Behalf', icon: PeopleIcon },
    ],
  },
];

export const footerNavItem = {
  label: 'Sign out',
  path: '/page/login',
  icon: LogoutIcon,
};

export function getPageTitle(pathname) {
  for (const group of navGroups) {
    for (const item of group.items) {
      if (item.path === pathname) {
        return item.title;
      }
    }
  }
  return 'MyFinApp';
}

export function isNavItemActive(pathname, itemPath) {
  return pathname === itemPath;
}

export function getHomeShortcutGroups() {
  return navGroups.filter((group) => group.id !== 'overview');
}
