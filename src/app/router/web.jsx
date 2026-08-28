import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { routes } from './routes'
import { ProtectedRoute } from 'components/protected-route'

export const WebRouter = () => (
  <BrowserRouter>
    <Routes>
      {routes.map((route) => {
        const element = route.protected ? (
          <ProtectedRoute>
            <route.component />
          </ProtectedRoute>
        ) : (
          <route.component />
        )
        return <Route key={route.path} path={route.path} element={element} />
      })}
    </Routes>
  </BrowserRouter>
)
