import Seo from '@/components/layout/Seo'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function GuidePage() {
  return (
    <>
      <Seo
        title="가이드"
        description="zetrun 레이스 규칙, 장애물 판정, 순위 계산 방식, 공정성 원칙과 콘텐츠 정책을 안내합니다."
      />

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
            <AccordionItem value="q1">
              <AccordionTrigger>결과는 매번 동일한가요?</AccordionTrigger>
              <AccordionContent>아니요. 레이스마다 속도/장애물 영향이 달라 결과가 달라질 수 있습니다.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q2">
              <AccordionTrigger>입력한 이름은 어디에 저장되나요?</AccordionTrigger>
              <AccordionContent>입력한 정보는 이 기기 안에서만 저장되며 외부로 전송되지 않습니다.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="q3">
              <AccordionTrigger>광고가 보이지 않을 때는 어떻게 하나요?</AccordionTrigger>
              <AccordionContent>광고 심사가 완료되면 광고 영역이 자동으로 표시됩니다.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </>
  )
}

export default GuidePage
