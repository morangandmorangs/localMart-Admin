import {
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Package,
  PackagePlus,
  ShieldCheck,
  Sprout,
  Store,
  Truck,
  Wheat,
  type LucideIcon,
} from 'lucide-react'
import { Fragment } from 'react'
import { Link, Outlet, matchPath, useLocation } from 'react-router-dom'

import { useMeQuery } from '@/api/auth-api'
import { usePendingProposalCountQuery } from '@/api/catalog-api'
import { usePartnersQuery } from '@/api/partners-api'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { signedOut } from '@/store/auth-slice'
import { useAppDispatch } from '@/store/store'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Match the path exactly, so `/` isn't active on every page. */
  end?: boolean
}

/**
 * The sidebar, in groups shown with a separator between them: the catalogue,
 * the partners, and the records and reviews. Each entry has a route in
 * router.tsx.
 */
const NAV_GROUPS: NavItem[][] = [
  [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/products/new', label: 'Add Products', icon: PackagePlus },
    { to: '/products', label: 'Read Products', icon: Package, end: true },
  ],
  [
    { to: '/merchants', label: 'Merchants List', icon: Store },
    { to: '/drivers', label: 'Driver List', icon: Truck },
    { to: '/farmers', label: 'Farmer List', icon: Sprout },
  ],
  [
    { to: '/cultivation', label: 'Cultivation Records', icon: Wheat },
    { to: '/approvals', label: 'Approvals', icon: ClipboardCheck },
  ],
]

const NAV = NAV_GROUPS.flat()

/** Everything waiting on an admin: proposed products, and partners whose documents are in. */
function usePendingApprovals(): number {
  const proposals = usePendingProposalCountQuery()
  const merchants = usePartnersQuery({ kind: 'merchants', status: 'under-review' })
  const drivers = usePartnersQuery({ kind: 'drivers', status: 'under-review' })
  return (proposals.data ?? 0) + (merchants.data?.length ?? 0) + (drivers.data?.length ?? 0)
}

/** The frame around every signed-in screen: sidebar, top bar, and the page. */
export default function AdminLayout() {
  const dispatch = useAppDispatch()
  const me = useMeQuery()
  const pending = usePendingApprovals()
  const { pathname } = useLocation()
  const current = NAV.find((item) => matchPath({ path: item.to, end: item.end ?? false }, pathname))

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" render={<Link to="/" />}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-linear-to-br from-primary to-secondary text-foreground">
                  <ShieldCheck className="size-4" aria-hidden />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Local Mart</span>
                  <span className="truncate text-xs text-muted-foreground">Admin</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="justify-center">
          {NAV_GROUPS.map((group, i) => (
            <Fragment key={group[0].to}>
              {i > 0 && <SidebarSeparator />}
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-3">
                    {group.map((item) => (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          render={<Link to={item.to} />}
                          isActive={item === current}
                          tooltip={item.label}
                        >
                          <item.icon aria-hidden />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                        {item.to === '/approvals' && pending > 0 && (
                          <SidebarMenuBadge aria-label={`${pending} waiting`}>{pending}</SidebarMenuBadge>
                        )}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </Fragment>
          ))}
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="grid px-2 py-1.5 text-sm leading-tight group-data-[collapsible=icon]:hidden">
                {me.data ? (
                  <>
                    <span className="truncate font-medium">{me.data.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{me.data.designation}</span>
                  </>
                ) : (
                  <Skeleton className="h-8 w-full" />
                )}
              </div>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Sign out" onClick={() => dispatch(signedOut())}>
                <LogOut aria-hidden />
                <span>Sign out</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="relative flex h-14 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="mx-1 data-vertical:h-4 data-vertical:self-center" />
          <h1 className="text-sm font-medium">{current?.label}</h1>
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-primary to-secondary" />
        </header>
        <main className="flex-1 p-4 md:p-6">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
