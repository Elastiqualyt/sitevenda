'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function VendedorDashboardPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/vendedor/produtos');
  }, [router]);
  return null;
}
