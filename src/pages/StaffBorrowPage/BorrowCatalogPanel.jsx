import { useEffect, useState } from 'react'
import { Card, message } from 'antd'
import { BorrowCatalogFilters, BorrowCatalogList } from 'components/borrow-catalog'
import { fetchBorrowableEquipment } from 'entities/borrow'
export const BorrowCatalogPanel = () => {
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
    <>
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

      <Card>
        <BorrowCatalogList
          loading={loading}
          list={list}
          emptyText="暂无可借设备（需管理员在设备详情中开放借用）"
        />
      </Card>
    </>
  )
}
