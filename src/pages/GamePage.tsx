import AdSlot from '@/components/ads/AdSlot'
import Seo from '@/components/layout/Seo'
import RaceGame from '@/components/race/RaceGame'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function GamePage() {
  const gamePlaySchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'zetrun 게임 플레이 순서',
    step: [
      { '@type': 'HowToStep', name: '참가 비행기 설정', text: '비행기 수와 이름을 입력합니다.' },
      { '@type': 'HowToStep', name: '레이스 시작', text: '시작 버튼을 누르면 장애물과 함께 레이스가 진행됩니다.' },
      { '@type': 'HowToStep', name: '결과 확인', text: '실시간 순위와 최종 결과 패널에서 1~3등을 확인합니다.' },
    ],
  }

  return (
    <>
      <Seo
        title="게임"
        description="zetrun 비행기 레이스를 바로 플레이하세요. 실시간 순위, 장애물, 리더 추적 카메라가 적용됩니다."
        keywords={['비행기 레이스 게임', '브라우저 레이스', '실시간 순위 게임']}
        structuredData={gamePlaySchema}
      />

      <section className="mb-4 rounded-xl border border-slate-700/70 bg-slate-900/65 p-5">
        <h1 className="title-font text-2xl font-black text-cyan-100 md:text-3xl">게임 플레이</h1>
        <p className="mt-2 text-sm text-slate-300">참가 이름을 정하고 시작 버튼을 누르면 바로 레이스가 진행됩니다.</p>
      </section>

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
