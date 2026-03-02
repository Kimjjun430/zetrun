import { Link } from 'react-router-dom'

import Seo from '@/components/layout/Seo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function NotFoundPage() {
  return (
    <>
      <Seo title="페이지 없음" description="요청하신 페이지를 찾을 수 없습니다." />
      <Card className="mx-auto max-w-xl">
        <CardHeader>
          <CardTitle>페이지를 찾을 수 없습니다</CardTitle>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">홈으로 이동</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  )
}

export default NotFoundPage
