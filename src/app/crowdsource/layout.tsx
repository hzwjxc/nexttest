import { Box } from "@chakra-ui/react"
import CrowdsourceNav from "./_components/CrowdsourceNav"
import AdminGuard from '@/app/_components/AdminGuard';
import { ROLES } from "../const/status";

export default function CrowdsourceLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AdminGuard allowedRoles={[ROLES.SUPER_ADMIN, ROLES.TEST_ADMIN, ROLES.LIAISON, ROLES.TESTER, ROLES.DEPT_MANAGER, ROLES.GENERAL_MANAGER]}>
            <CrowdsourceNav />
            <Box pt="72px">
                {children}
            </Box>
        </AdminGuard>
    )
}
