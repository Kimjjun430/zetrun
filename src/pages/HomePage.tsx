import { Link } from 'react-router-dom'
import { CircleCheck, Rocket, ShieldCheck, Sparkles } from 'lucide-react'

import AdSlot from '@/components/ads/AdSlot'
import Seo from '@/components/layout/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const QUICK_ANSWERS = [
  {
    answer: '비행기 이름을 입력하고 시작 버튼을 누르면 바로 레이스가 진행되는 웹 게임입니다.',
    question: 'zetrun은 어떤 서비스인가요?',
  },
  {
    answer: '입력한 이름과 설정은 현재 사용 중인 기기 안에서만 저장되고 외부로 전송되지 않습니다.',
    question: '개인정보는 어떻게 처리되나요?',
  },
  {
    answer: '레이스마다 속도와 장애물 영향이 달라져 결과가 달라질 수 있으며, 순위는 실시간으로 갱신됩니다.',
    question: '레이스 결과는 어떻게 정해지나요?',
  },
]

function HomePage() {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: QUICK_ANSWERS.map((item) => ({
      '@type': 'Question',
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
      name: item.question,
    })),
  }

  const gameSchema = {
    '@context': 'https://schema.org',
    '@type': 'VideoGame',
    applicationCategory: 'Game',
    description: '비행기 이름을 입력하면 바로 플레이 가능한 웹 기반 레이스 게임',
    inLanguage: 'ko-KR',
    name: 'zetrun',
    operatingSystem: 'Web Browser',
    url: 'https://zetrun.app/game',
  }

  return (
    <>
      <Seo
        title="비행기 레이스 게임"
        description="zetrun은 비행기 이름을 입력하면 바로 플레이할 수 있는 웹 레이스 게임입니다. 실시간 순위, 장애물, 결과 보드를 제공합니다."
        keywords={['비행기 레이스', '웹 게임', '실시간 순위', 'zetrun', '브라우저 게임']}
        structuredData={[gameSchema, faqSchema]}
      />

      <section className="mb-4 rounded-xl border border-cyan-400/25 bg-slate-900/65 p-5">
        <h1 className="title-font text-3xl font-black tracking-tight text-cyan-100 md:text-4xl">zetrun 비행기 레이스 게임</h1>
        <p className="mt-2 text-base text-slate-200">
          이름만 입력하면 바로 시작되는 실시간 레이스. 결과는 직관적으로, 화면은 보기 쉽게 구성해 처음 방문해도 빠르게 즐길 수 있습니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="overflow-hidden border-cyan-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30">
          <CardHeader>
            <div className="flex flex-wrap gap-2">
              <Badge>100% 클라이언트</Badge>
              <Badge variant="secondary">무로그인</Badge>
              <Badge variant="outline">실시간 레이스</Badge>
            </div>
            <CardTitle className="title-font text-3xl md:text-4xl">zetrun Sky Racing</CardTitle>
            <CardDescription className="text-base text-slate-200">
              비행기 이름만 입력하면 바로 시작되는 아케이드 레이스. 레이스 데이터는 브라우저 로컬에만 저장되며 외부 서버로 전송되지 않습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/game">게임 시작하기</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/guide">게임 가이드 보기</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>서비스 원칙</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-300">
            <p className="flex items-start gap-2">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-300" />
              사용자 입력 이름과 설정은 이 기기 안에서만 보관
            </p>
            <p className="flex items-start gap-2">
              <Rocket className="mt-0.5 h-4 w-4 text-cyan-300" />
              레이스 로직, 순위 계산, 카메라 연출 전부 클라이언트 처리
            </p>
            <p className="flex items-start gap-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-amber-300" />
              광고는 콘텐츠를 가리지 않도록 제한된 영역에만 노출
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-4">
        <AdSlot className="min-h-[90px]" />
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>처음 방문자를 위한 빠른 답변</CardTitle>
          <CardDescription>질문에 바로 답을 확인할 수 있도록 핵심 정보만 간단히 정리했습니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-200">
          {QUICK_ANSWERS.map((item) => (
            <article key={item.question} className="rounded-lg border border-slate-700/70 bg-slate-900/65 p-3">
              <h2 className="text-sm font-bold text-cyan-300">{item.question}</h2>
              <p className="mt-1 text-slate-300">{item.answer}</p>
            </article>
          ))}
        </CardContent>
      </Card>

      <section className="mt-4 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>풍부한 원본 콘텐츠</CardTitle>
            <CardDescription>게임 방식, 규칙, 팁, 정책을 페이지별로 제공</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              게임 소개 및 전략 가이드
            </p>
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              광고/개인정보/약관 고지
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>접근성과 탐색성</CardTitle>
            <CardDescription>모바일/데스크톱에서 빠르게 접근 가능한 구조</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              상단 고정 네비게이션
            </p>
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              명확한 섹션 타이틀과 정보 구조
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>편하게 즐기는 구성</CardTitle>
            <CardDescription>처음 방문해도 바로 이해하고 플레이할 수 있게 구성했습니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              필요한 메뉴를 한눈에 찾을 수 있는 화면
            </p>
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              게임 방법, 정책, 문의 정보를 쉽게 확인
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export default HomePage
