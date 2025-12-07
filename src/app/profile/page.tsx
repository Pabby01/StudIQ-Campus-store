import Card from "@/components/ui/Card";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-soft-gray-bg">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <User className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Profile</h1>
            <p className="text-muted-text">Manage your account details and preferences</p>
          </div>
        </div>

        <Card>
          <div className="text-center py-12">
            <User className="w-16 h-16 text-muted-text mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-black mb-2">Profile Management</h3>
            <p className="text-muted-text">View and edit your profile information</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
