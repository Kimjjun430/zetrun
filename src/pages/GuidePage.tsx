import Seo from '@/components/layout/Seo'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const GUIDE_FAQ = [
  {
    answer: '아니요. 레이스마다 속도와 장애물 영향이 달라 결과가 달라질 수 있습니다.',
    question: '결과는 매번 동일한가요?',
  },
  {
    answer: '입력한 정보는 이 기기 안에서만 저장되며 외부로 전송되지 않습니다.',
    question: '입력한 이름은 어디에 저장되나요?',
  },
  {
    answer: '광고 심사가 완료되면 광고 영역이 자동으로 표시됩니다.',
    question: '광고가 보이지 않을 때는 어떻게 하나요?',
  },
]

function GuidePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: GUIDE_FAQ.map((item) => ({
      '@type': 'Question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
      name: item.question,
    })),
  }

  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'zetrun 레이스 시작 방법',
    step: [
      { '@type': 'HowToStep', name: '비행기 이름 입력', text: '수식 입력 또는 목록 편집으로 참가 비행기 이름을 정합니다.' },
      { '@type': 'HowToStep', name: '레이스 시작', text: '레이스 시작 버튼을 누르면 비행기가 하단에서 상단 결승선으로 이동합니다.' },
      { '@type': 'HowToStep', name: '결과 확인', text: '실시간 순위와 최종 1~3등 결과 패널을 확인합니다.' },
    ],
  }

  return (
    <>
      <Seo
        title="가이드"
        description="zetrun 레이스 규칙, 장애물 판정, 순위 계산 방식, 공정성 원칙과 콘텐츠 정책을 안내합니다."
        keywords={['레이스 규칙', '게임 가이드', 'zetrun 사용법', '비행기 레이스 방법']}
        structuredData={[faqSchema, howToSchema]}
      />

      <section className="mb-4 rounded-xl border border-slate-700/70 bg-slate-900/65 p-5">
        <h1 className="title-font text-2xl font-black text-cyan-100 md:text-3xl">zetrun 가이드</h1>
        <p className="mt-2 text-sm text-slate-300">
          규칙, 진행 방식, 결과 해석 방법을 한 번에 확인할 수 있는 안내 페이지입니다. 처음 플레이하는 사용자도 빠르게 이해할 수 있도록 작성했습니다.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>zetrun 게임 가이드</CardTitle>
          <CardDescription>게임 규칙과 계산 방식을 공개해 결과 해석이 명확하도록 구성했습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="rules">
            <TabsList>
              <TabsTrigger value="rules">규칙</TabsTrigger>
              <TabsTrigger value="system">시스템</TabsTrigger>
              <TabsTrigger value="quality">품질 기준</TabsTrigger>
            </TabsList>

            <TabsContent value="rules">
              <ul className="space-y-2 text-sm text-slate-300">
                <li>모든 비행기는 하단에서 출발해 상단 결승선으로 이동합니다.</li>
                <li>속도는 기본 랜덤값 + 프레임별 가감속 + 장애물 영향으로 결정됩니다.</li>
                <li>장애물 영향이 임계값을 넘으면 해당 비행기는 추락 처리됩니다.</li>
                <li>완주/추락이 모두 결정되면 레이스가 종료됩니다.</li>
              </ul>
            </TabsContent>

            <TabsContent value="system">
              <ul className="space-y-2 text-sm text-slate-300">
                <li>실시간 순위는 완료 순위 우선, 미완료는 진행률로 정렬합니다.</li>
                <li>리더 추적 카메라는 선두 중심이지만 전체 기체 경계를 벗어나지 않도록 제한합니다.</li>
                <li>입력한 데이터는 현재 사용 중인 기기 안에서만 저장됩니다.</li>
              </ul>
            </TabsContent>

            <TabsContent value="quality">
              <ul className="space-y-2 text-sm text-slate-300">
                <li>광고는 콘텐츠와 구분된 고정 영역에만 배치합니다.</li>
                <li>정책/문의/서비스 정보 페이지를 명시적으로 제공합니다.</li>
                <li>기만적 클릭 유도, 자동 리다이렉트, 숨김 텍스트를 사용하지 않습니다.</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>자주 묻는 질문</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible>
            {GUIDE_FAQ.map((item, index) => (
              <AccordionItem key={item.question} value={`q${index + 1}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </>
  )
}

export default GuidePage
