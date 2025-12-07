import Card from "@/components/ui/Card";
import { Settings } from "lucide-react";

export default function DashboardSettingsPage() {
  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Settings className="w-6 h-6 text-primary-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Settings</h1>
            <p className="text-muted-text">Manage your account preferences</p>
          </div>
        </div>

        {/* Settings Sections */}
        <Card>
          <h3 className="text-lg font-semibold text-black mb-4">Account Settings</h3>
          <p className="text-muted-text">Configure your account preferences and settings</p>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-black mb-4">Seller Tier</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-black">Current Tier</p>
                <p className="text-sm text-muted-text">Free (10% platform fee)</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-muted-text rounded-full text-sm font-medium">
                Free
              </span>
            </div>
            <p className="text-sm text-muted-text">
              Upgrade to Premium for 3% fees and unlimited products
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
