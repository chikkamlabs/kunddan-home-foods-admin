'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

function RedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      router.replace(`/admin/products/openproduct?id=${encodeURIComponent(id)}`);
    } else {
      router.replace('/admin/products/dashboard');
    }
  }, [router, searchParams]);

  return (
    <div className="loading-container">
      <Loader2 className="h-8 w-8 animate-spin brand-spinner" />
    </div>
  );
}

export default function AdminOpenProductRedirect() {
  return (
    <Suspense fallback={<div className="loading-container"><Loader2 className="h-8 w-8 animate-spin brand-spinner" /></div>}>
      <RedirectContent />
    </Suspense>
  );
}
