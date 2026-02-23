import { redirect } from 'next/navigation';

export default function AdminPage() {
    redirect('/crowdsource/admin/task-management');
}