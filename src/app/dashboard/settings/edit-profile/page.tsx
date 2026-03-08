/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCivicWallet } from "@/hooks/useCivicWallet";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { updateProfileSchema } from "@/lib/validators";
import { motion } from "framer-motion";

export default function EditProfilePage() {
    const router = useRouter();
    const { walletAddress, isAuthenticated, email: userEmail } = useCivicWallet();
    const toast = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        school: "",
        campus: "",
        level: "",
        phone: "",
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const address = walletAddress;

    useEffect(() => {
        if (address) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [address]);

    const fetchProfile = async () => {
        if (!address) return;

        try {
            const res = await fetch(`/api/profile/get?address=${address}`);
            if (res.ok) {
                const profile = await res.json();
                setFormData({
                    name: profile.name || "",
                    email: profile.email || "",
                    school: profile.school || "",
                    campus: profile.campus || "",
                    level: profile.level || "",
                    phone: profile.phone || "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            toast.error("Error", "Failed to load profile");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!address) {
            toast.error("Error", "Please sign in first");
            return;
        }

        const result = updateProfileSchema.safeParse({
            address,
            ...formData,
        });

        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors as Record<string, string[]>;
            const formatted: { [key: string]: string } = {};
            for (const key in fieldErrors) {
                const messages = fieldErrors[key];
                if (messages && messages.length > 0) {
                    formatted[key] = messages[0];
                }
            }
            setErrors(formatted);
            toast.error("Invalid profile information", "Please fix the highlighted fields");
            return;
        }

        setSaving(true);

        try {
            const res = await fetch("/api/profile/update", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    address,
                    ...formData,
                }),
            });

            if (res.ok) {
                toast.success("Success", "Profile updated successfully");
                router.push("/dashboard/settings");
            } else {
                const error = await res.json();
                toast.error("Error", error.error || "Failed to update profile");
            }
        } catch (error) {
            console.error("Update error:", error);
            toast.error("Error", "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 flex items-center justify-center">
                <Card className="p-8 text-center border-white/60">
                    <h2 className="text-xl font-bold mb-4">Sign In Required</h2>
                    <p className="text-muted-text">Please sign in to edit your profile</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg mesh-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg mesh-bg px-4 py-6 sm:px-6 lg:px-8 w-full max-w-full overflow-x-hidden">
            <div className="max-w-2xl mx-auto space-y-6 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="glass-panel rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
                >
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/settings")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-black">Edit Profile</h1>
                        <p className="text-sm text-muted-text">Update your account information</p>
                    </div>
                </motion.div>

                {/* Edit Form */}
                <Card className="p-6 border-white/60">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            name="name"
                            label="Full Name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            error={errors.name}
                        />

                        <Input
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="john@university.edu"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            error={errors.email}
                        />

                        <Input
                            name="school"
                            label="University/School"
                            placeholder="University of Example"
                            value={formData.school}
                            onChange={handleChange}
                            required
                            error={errors.school}
                        />

                        <Input
                            name="campus"
                            label="Campus"
                            placeholder="Main Campus"
                            value={formData.campus}
                            onChange={handleChange}
                            required
                            error={errors.campus}
                        />

                        <div>
                            <label className="block text-sm font-medium text-black mb-2">
                                Level <span className="text-red-600">*</span>
                            </label>
                            <select
                                name="level"
                                value={formData.level}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 bg-white/80 border border-white/70 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            >
                                <option value="">Select your level</option>
                                <option value="Freshman">Freshman</option>
                                <option value="Sophomore">Sophomore</option>
                                <option value="Junior">Junior</option>
                                <option value="Senior">Senior</option>
                                <option value="Graduate">Graduate</option>
                                <option value="Other">Other</option>
                            </select>
                            {errors.level && (
                                <p className="mt-1 text-sm text-red-600">{errors.level}</p>
                            )}
                        </div>

                        <Input
                            name="phone"
                            label="Phone Number"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={handleChange}
                            error={errors.phone}
                        />

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={saving}
                                className="flex-1"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push("/dashboard/settings")}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}
