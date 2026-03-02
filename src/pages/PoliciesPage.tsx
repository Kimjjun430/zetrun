import Seo from '@/components/layout/Seo'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

function PoliciesPage() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'wnsgud4300@naver.com',
      },
    ],
    name: 'zetrun',
    url: 'https://zetrun.app/',
  }

  return (
    <>
      <Seo
        title="정책"
        description="zetrun 개인정보처리방침, 이용약관, 광고 운영 원칙과 문의 정보를 확인할 수 있습니다."
        keywords={['개인정보처리방침', '이용약관', '광고 정책', 'zetrun 문의']}
        structuredData={organizationSchema}
      />

      <section className="mb-4 rounded-xl border border-slate-700/70 bg-slate-900/65 p-5">
        <h1 className="title-font text-2xl font-black text-cyan-100 md:text-3xl">정책 및 운영 정보</h1>
        <p className="mt-2 text-sm text-slate-300">서비스 이용 전에 확인해야 할 정책과 운영 원칙을 한곳에서 볼 수 있습니다.</p>
      </section>

      <Card id="policies">
        <CardHeader>
          <CardTitle>정책 및 운영 원칙</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="privacy">
            <TabsList>
              <TabsTrigger value="privacy">개인정보처리방침</TabsTrigger>
              <TabsTrigger value="terms">이용약관</TabsTrigger>
              <TabsTrigger value="ads">광고 원칙</TabsTrigger>
            </TabsList>

            <TabsContent value="privacy" className="space-y-4 text-sm text-slate-300">
              <p>zetrun은 사용자 인증, DB 저장, 서버 로그인을 사용하지 않는 클라이언트 기반 게임 서비스입니다.</p>
              <Separator />
              <ul className="list-disc space-y-2 pl-5">
                <li>수집 정보: 브라우저에 입력한 비행기 이름/설정(로컬 저장).</li>
                <li>저장 위치: 현재 사용 중인 기기 내부 저장소.</li>
                <li>외부 전송: 광고 스크립트 로드 외 게임 데이터 전송 없음.</li>
                <li>문의: wnsgud4300@naver.com</li>
              </ul>
            </TabsContent>

            <TabsContent id="terms" value="terms" className="space-y-4 text-sm text-slate-300">
              <p>zetrun은 오락용 서비스이며 금전/투자/도박 목적의 결과 보장을 제공하지 않습니다.</p>
              <Separator />
              <ul className="list-disc space-y-2 pl-5">
                <li>사용자는 타인의 권리를 침해하는 이름/콘텐츠를 입력할 수 없습니다.</li>
                <li>서비스 품질 개선을 위해 UI/로직은 사전 고지 없이 업데이트될 수 있습니다.</li>
                <li>서비스 이용 중 발생한 데이터 손실에 대해 운영자는 법적 책임 범위 내에서 대응합니다.</li>
              </ul>
            </TabsContent>

            <TabsContent value="ads" className="space-y-4 text-sm text-slate-300">
              <p>광고는 콘텐츠를 방해하지 않는 위치에만 노출하고, 클릭 유도 문구를 사용하지 않습니다.</p>
              <Separator />
              <ul className="list-disc space-y-2 pl-5">
                <li>광고와 게임 콘텐츠를 시각적으로 명확히 구분합니다.</li>
                <li>정책 위반 가능성이 있는 콘텐츠(불법, 성인, 위험 행위 유도)를 게시하지 않습니다.</li>
                <li>사용자 경험 우선 원칙: 레이아웃 흔들림/오버레이 광고 지양.</li>
                <li>검색 엔진 가이드라인에 맞춰 색인 가능한 정보 페이지를 유지합니다.</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>운영자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-300">
          <p>서비스명: zetrun</p>
          <p>문의 이메일: wnsgud4300@naver.com</p>
          <p>정책 시행일: 2026-03-02</p>
        </CardContent>
      </Card>
    </>
  )
}

export default PoliciesPage
