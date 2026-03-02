import AdSlot from '@/components/ads/AdSlot'
import Seo from '@/components/layout/Seo'
import RaceGame from '@/components/race/RaceGame'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function GamePage() {
  return (
    <>
      <Seo title="게임" description="zetrun 비행기 레이스를 바로 플레이하세요. 실시간 순위와 장애물 시스템이 적용됩니다." />

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>플레이 가이드</CardTitle>
          <CardDescription>비행기 이름을 입력하고 레이스를 시작하세요. 장애물 충돌 시 추락하며, 결과 패널에서 1~3등이 표시됩니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>수식 입력 예시: `비행기1 * 30`, `Falcon * 12, Hawk * 8`</p>
          <p>레이스 중에는 실시간 순위와 리더 추적 카메라가 동작합니다.</p>
        </CardContent>
      </Card>

      <AdSlot className="mb-4 min-h-[90px]" />

      <RaceGame />
    </>
  )
}

export default GamePage
