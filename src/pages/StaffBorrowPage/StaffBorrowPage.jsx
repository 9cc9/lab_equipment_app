import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, Typography } from 'antd'
import { isAdminUser, useAuthStore } from 'entities/auth'
import { AdminBorrowPanel } from './AdminBorrowPanel'
import { BorrowCatalogPanel } from './BorrowCatalogPanel'
import { OverdueWarningPanel } from './OverdueWarningPanel'

const { Text } = Typography

const TAB = {
  APPROVAL: 'approval',
  OVERDUE: 'overdue',
  CATALOG: 'catalog',
}

export const StaffBorrowPage = () => {
  const user = useAuthStore((s) => s.user)
  const isAdmin = isAdminUser(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const tab = searchParams.get('tab')
    if (tab === TAB.CATALOG) return TAB.CATALOG
    if (tab === TAB.OVERDUE && isAdmin) return TAB.OVERDUE
    if (tab === TAB.APPROVAL && isAdmin) return TAB.APPROVAL
    return isAdmin ? TAB.APPROVAL : TAB.CATALOG
  }, [searchParams, isAdmin])

  useEffect(() => {
    if (!isAdmin && (searchParams.get('tab') === TAB.APPROVAL || searchParams.get('tab') === TAB.OVERDUE)) {
      setSearchParams({ tab: TAB.CATALOG }, { replace: true })
    }
  }, [isAdmin, searchParams, setSearchParams])

  const items = [
    ...(isAdmin
      ? [
          { key: TAB.APPROVAL, label: '借用审批', children: <AdminBorrowPanel /> },
          { key: TAB.OVERDUE, label: '超时预警', children: <OverdueWarningPanel /> },
        ]
      : []),
    { key: TAB.CATALOG, label: '可借设备列表', children: <BorrowCatalogPanel /> },
  ]

  return (
    <div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        {isAdmin
          ? '处理借用/结束审批、查看超时预警，或查看可借设备'
          : '查看可借设备（借用申请需同学本人提交）'}
      </Text>
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setSearchParams({ tab: key }, { replace: true })}
        items={items}
      />
    </div>
  )
}
