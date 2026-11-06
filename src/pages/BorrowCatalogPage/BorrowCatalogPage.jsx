import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Space, Typography, message } from 'antd'
import { BorrowCatalogFilters, BorrowCatalogList } from 'components/borrow-catalog'
import { fetchBorrowableEquipment } from 'entities/borrow'
import { useAuthStore, isStudentUser } from 'entities/auth'
import { ROUTES } from 'shared/constants/routes'

const { Title, Text } = Typography

export const BorrowCatalogPage = () => {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const { logout } = useAuthStore()
  const [keyword, setKeyword] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [borrowType, setBorrowType] = useState('')
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState([])

  const load = async () => {
    setLoading(true)
    try {
      const data = await fetchBorrowableEquipment({
        keyword: keyword.trim() || undefined,
        roomCode: roomCode.trim() || undefined,
        borrowType: borrowType || undefined,
      })
      setList(Array.isArray(data) ? data : [])
    } catch (e) {
      message.error(e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Title level={3} style={{ margin: 0 }}>可借设备</Title>
          <Text type="secondary">{user?.name || user?.username}</Text>
        </div>
        <Space wrap>
          {isStudentUser(user) && (
            <Button onClick={() => navigate(ROUTES.BORROW_MINE)}>我的申请</Button>
          )}
          {!isStudentUser(user) && (
            <Button onClick={() => navigate(ROUTES.HOME)}>清查首页</Button>
          )}
          <Button onClick={async () => { await logout(); navigate(ROUTES.LOGIN) }}>退出</Button>
        </Space>
      </div>

      <BorrowCatalogFilters
        keyword={keyword}
        onKeywordChange={setKeyword}
        roomCode={roomCode}
        onRoomCodeChange={setRoomCode}
        borrowType={borrowType}
        onBorrowTypeChange={setBorrowType}
        loading={loading}
        onSearch={load}
      />

      <BorrowCatalogList
        loading={loading}
        list={list}
        emptyText="暂无可借设备（需管理员先开放借用）"
        showApplyAction={isStudentUser(user)}
      />
    </div>
  )
}
