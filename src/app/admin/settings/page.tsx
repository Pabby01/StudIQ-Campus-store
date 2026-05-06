"use client";

import { useState } from "react";
import {
  Settings,
  Bell,
  Lock,
  Palette,
  Mail,
  Database,
  Shield,
} from "lucide-react";
import Card from "@/components/ui/Card";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [userReportNotifications, setUserReportNotifications] = useState(true);
  const [theme, setTheme] = useState("light");

  const settings = [
    {
      category: "Notifications",
      icon: <Bell className="w-6 h-6 text-blue-600" />,
      items: [
        {
          label: "Email Notifications",
          description: "Receive email updates on important events",
          enabled: emailNotifications,
          onChange: setEmailNotifications,
        },
        {
          label: "Order Alerts",
          description: "Get notified of new orders",
          enabled: orderNotifications,
          onChange: setOrderNotifications,
        },
        {
          label: "User Reports",
          description: "Receive alerts for user disputes",
          enabled: userReportNotifications,
          onChange: setUserReportNotifications,
        },
      ],
    },
    {
      category: "Appearance",
      icon: <Palette className="w-6 h-6 text-purple-600" />,
      items: [
        {
          label: "Theme",
          description: "Choose your dashboard theme",
          type: "select",
          value: theme,
          options: [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
            { value: "auto", label: "Auto" },
          ],
          onChange: setTheme,
        },
      ],
    },
    {
      category: "Security",
      icon: <Lock className="w-6 h-6 text-red-600" />,
      description: "Manage your security settings",
    },
    {
      category: "Data & Privacy",
      icon: <Database className="w-6 h-6 text-green-600" />,
      description: "Manage your data collection settings",
    },
    {
      category: "Access Control",
      icon: <Shield className="w-6 h-6 text-yellow-600" />,
      description: "Manage admin roles and permissions",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-8 h-8 text-blue-600" />
          Settings
        </h1>
        <p className="text-slate-600 mt-1">Manage your admin dashboard preferences</p>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {settings.map((section, index) => (
          <motion.div
            key={section.category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 1) }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-slate-100 rounded-lg">
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    {section.category}
                  </h2>
                  {section.description && (
                    <p className="text-sm text-slate-600">
                      {section.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Settings Items */}
              {section.items && (
                <div className="space-y-4 border-t border-slate-200 pt-4">
                  {section.items.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.label}
                        </p>
                        <p className="text-sm text-slate-600">
                          {item.description}
                        </p>
                      </div>
                      {item.type === "select" ? (
                        <select
                          value={item.value}
                          onChange={(e) => item.onChange(e.target.value)}
                          className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {item.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() =>
                            item.onChange && item.onChange(!item.enabled)
                          }
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            item.enabled
                              ? "bg-blue-600"
                              : "bg-slate-300"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              item.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
