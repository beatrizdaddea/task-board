import { Card, CardContent, CardHeader } from '@/shared/components/ui/card'
import { Skeleton } from '@/shared/components/ui/skeleton'

export function AuthRouteSkeleton() {
  return (
    <main className="bg-muted/40 grid min-h-svh place-items-center p-6">
      <Card
        className="w-full max-w-sm"
        aria-label="Verificando autenticação"
        aria-busy="true"
      >
        <CardHeader className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    </main>
  )
}
