"use client";

import { useState } from "react";
import StoreForm from "@/components/StoreForm";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { Store, Plus } from "lucide-react";

export default function DashboardStorePage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="min-h-screen bg-soft-gray-bg p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Store className="w-6 h-6 text-primary-blue" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">My Store</h1>
              <p className="text-muted-text">Manage your store details and settings</p>
            </div>
          </div>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Store
            </Button>
          )}
        </div>

        {/* Store Form or Info */}
        {showForm ? (
          <StoreForm onSuccess={() => setShowForm(false)} />
        ) : (
          <Card>
            <div className="text-center py-12">
              <Store className="w-16 h-16 text-muted-text mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-black mb-2">No store created yet</h3>
              <p className="text-muted-text mb-6">Create your first store to start selling</p>
              <Button variant="primary" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your Store
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
