import { useNavigate } from 'react-router-dom'
import { Button, List, Space, Tag } from 'antd'
import { AllowedBorrowTypeTag } from './AllowedBorrowTypeTag'
import { ROUTES } from 'shared/constants/routes'

export const BorrowCatalogList = ({ loading, list, emptyText, showApplyAction = false }) => {
  const navigate = useNavigate()

  return (
    <List
      loading={loading}
      dataSource={list}
      locale={{ emptyText }}
      renderItem={(item) => (
        <List.Item
          actions={showApplyAction ? [
            <Button type="link" key="apply" onClick={() => navigate(ROUTES.BORROW_APPLY(item.assetCode))}>
              申请借用
            </Button>,
          ] : undefined}
        >
          <List.Item.Meta
            title={`${item.assetCode} · ${item.name}`}
            description={
              <Space size={[4, 4]} wrap>
                <span>{item.roomCode || '-'} · {item.usageStatus || '-'}</span>
                <AllowedBorrowTypeTag allowedBorrowTypes={item.allowedBorrowTypes} />
                {item.externalBorrowBlocked && <Tag color="orange">外借占用中</Tag>}
                {(item.inLabActiveCount || 0) > 0 && (
                  <Tag color="blue">室内 {item.inLabActiveCount} 人使用中</Tag>
                )}
              </Space>
            }
          />
        </List.Item>
      )}
    />
  )
}
