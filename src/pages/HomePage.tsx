import { Link } from 'react-router-dom'
import { CircleCheck, Rocket, ShieldCheck, Sparkles } from 'lucide-react'

import AdSlot from '@/components/ads/AdSlot'
import Seo from '@/components/layout/Seo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function HomePage() {
  return (
    <>
      <Seo
        title="홈"
        description="zetrun은 로컬에서만 동작하는 비행기 레이스 게임입니다. 실시간 순위, 장애물, 추락 판정, 리더 카메라를 제공합니다."
      />

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
            <CardTitle>검색 친화 구성</CardTitle>
            <CardDescription>크롤링과 인덱싱에 필요한 기본 파일 포함</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-300">
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              메타 설명, favicon, 사이트맵
            </p>
            <p className="flex gap-2">
              <CircleCheck className="mt-0.5 h-4 w-4 text-cyan-300" />
              robots.txt 및 고정 라우트 구성
            </p>
          </CardContent>
        </Card>
      </section>
    </>
  )
}

export default HomePage
