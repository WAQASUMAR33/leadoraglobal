import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to user login page as the main entry point
  redirect('/login');
}
