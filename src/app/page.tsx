import { redirect } from 'next/navigation';

export default function Home() {
    const homePath = process.env.NEXT_PUBLIC_DEFAULT_HOME_PATH ?? '/crowdsource/task-hall';
    redirect(homePath);
    return null;
}
