import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MobileLayout } from "@/components/MobileLayout";

export default function ConsumerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute allowedRoles={['consumer']}>
            <MobileLayout>
                {children}
            </MobileLayout>
        </ProtectedRoute>
    );
}
