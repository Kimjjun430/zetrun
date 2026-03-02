import { Link } from 'react-router-dom'

function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-700/70 bg-slate-950/85">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-slate-300 md:flex-row md:items-center md:justify-between md:px-6">
        <p>© {new Date().getFullYear()} zetrun. All rights reserved.</p>
        <div className="flex flex-wrap gap-4">
          <Link to="/policies" className="hover:text-cyan-300">
            개인정보처리방침
          </Link>
          <Link to="/policies#terms" className="hover:text-cyan-300">
            이용약관
          </Link>
          <a href="mailto:wnsgud4300@naver.com" className="hover:text-cyan-300">
            문의: wnsgud4300@naver.com
          </a>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
