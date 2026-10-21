import { createBrowserRouter } from 'react-router-dom'

import AdminLayout from '@/components/AdminLayout'
import RequireAuth from '@/components/RequireAuth'
import AddProductPage from '@/pages/AddProductPage'
import CultivationPage from '@/pages/CultivationPage'
import ApprovalsPage from '@/pages/ApprovalsPage'
import DashboardPage from '@/pages/DashboardPage'
import LoginPage from '@/pages/LoginPage'
import NotFoundPage from '@/pages/NotFoundPage'
import PartnersPage from '@/pages/PartnersPage'
import ProductsPage from '@/pages/ProductsPage'

/**
 * Every screen. Signed-in screens go under RequireAuth and AdminLayout, and
 * get a sidebar entry in AdminLayout's NAV.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'products/new', element: <AddProductPage /> },
          { path: 'approvals', element: <ApprovalsPage /> },
          // Keyed, so switching between the two lists starts each from its own filter.
          { path: 'merchants', element: <PartnersPage key="merchants" kind="merchants" /> },
          { path: 'drivers', element: <PartnersPage key="drivers" kind="drivers" /> },
          { path: 'farmers', element: <PartnersPage key="farmers" kind="farmers" /> },
          { path: 'cultivation', element: <CultivationPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
