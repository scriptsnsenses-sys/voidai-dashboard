// app/not-found.tsx
import Link from 'next/link'
import { ShimmerButton } from '@/components/ui/ShimmerButton'
 
export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen w-full bg-grid-white/[0.02]">
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h1 className="text-9xl font-bold text-white/20">404</h1>
        <h2 className="mt-4 text-4xl font-bold">Page Not Found</h2>
        <p className="mt-4 text-xl text-muted-foreground">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link href="/" passHref>
            <ShimmerButton className="px-8 py-4">
              Return to Home
            </ShimmerButton>
          </Link>
        </div>
      </div>
    </div>
  )
}