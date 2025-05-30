import OldHomePage from '@/components/OldHomePage';
import NewHomePage from '@/components/NewHomePage';

export default function Home() {
  // Environment variable to switch between old and new home page
  // Default to old (simple) home page when undefined or false
  const useNewHomePage = process.env.NEXT_PUBLIC_USE_NEW_HOME_PAGE === 'true';

  return useNewHomePage ? <NewHomePage /> : <OldHomePage />;
}