import { useEffect, useMemo, useState } from 'react'
import { Button, Card, Input, Select, Space } from 'antd'
import { fetchRooms } from 'entities/equipment'

export const BorrowCatalogFilters = ({
  keyword,
  onKeywordChange,
  roomCode,
  onRoomCodeChange,
  borrowType,
  onBorrowTypeChange,
  loading,
  onSearch,
}) => {
  const [rooms, setRooms] = useState([])

  useEffect(() => {
    fetchRooms()
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
  }, [])

  const roomOptions = useMemo(
    () =>
      [...rooms]
        .sort((a, b) => String(a.roomCode).localeCompare(String(b.roomCode), 'zh-CN'))
        .map((r) => ({ label: r.roomCode, value: r.roomCode })),
    [rooms]
  )

  return (
    <Card style={{ marginBottom: 16 }}>
      <Space wrap style={{ width: '100%' }}>
        <Select
          allowClear
          showSearch
          placeholder="房间号"
          style={{ width: 160 }}
          value={roomCode || undefined}
          onChange={(v) => onRoomCodeChange(v || '')}
          options={roomOptions}
          optionFilterProp="label"
        />
        <Input
          placeholder="编号或名称"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          onPressEnter={onSearch}
          style={{ width: 200 }}
        />
        <Select
          allowClear
          placeholder="借用类型"
          style={{ width: 140 }}
          value={borrowType || undefined}
          onChange={(v) => onBorrowTypeChange(v || '')}
          options={[
            { label: '外借带走', value: 'EXTERNAL' },
            { label: '室内使用', value: 'IN_LAB' },
          ]}
        />
        <Button type="primary" onClick={onSearch} loading={loading}>
          查询
        </Button>
      </Space>
    </Card>
  )
}
