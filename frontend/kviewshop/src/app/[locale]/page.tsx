import { redirect } from 'next/navigation';

// KviewShop is strictly private - no main page
// All access must be through creator shop links
export default function HomePage({ params }: { params: { locale: string } }) {
  // Redirect to login for now, or show a minimal landing page
  return redirect(`/${params.locale}/login`);
}
