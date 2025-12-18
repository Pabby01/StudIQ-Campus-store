"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";

export default function EditProfilePage() {
    const router = useRouter();
    const wallet = useWallet();
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

    const address = wallet.connected && wallet.publicKey ? wallet.publicKey.toString() : null;

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

        if (!address) {
            toast.error("Error", "Please connect your wallet");
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

    if (!wallet.connected) {
        return (
            <div className="min-h-screen bg-soft-gray-bg p-8 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-xl font-bold mb-4">Connect Wallet</h2>
                    <p className="text-muted-text">Please connect your wallet to edit your profile</p>
                </Card>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-soft-gray-bg flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-soft-gray-bg px-4 py-6 md:p-8">
            <div className="max-w-2xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        onClick={() => router.push("/dashboard/settings")}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-black">Edit Profile</h1>
                        <p className="text-sm md:text-base text-muted-text">Update your account information</p>
                    </div>
                </div>

                {/* Edit Form */}
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            name="name"
                            label="Full Name"
                            placeholder="John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            name="email"
                            label="Email"
                            type="email"
                            placeholder="john@university.edu"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            name="school"
                            label="University/School"
                            placeholder="University of Example"
                            value={formData.school}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            name="campus"
                            label="Campus"
                            placeholder="Main Campus"
                            value={formData.campus}
                            onChange={handleChange}
                            required
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
                                className="w-full px-4 py-2 bg-white border border-border-gray rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue"
                            >
                                <option value="">Select your level</option>
                                <option value="Freshman">Freshman</option>
                                <option value="Sophomore">Sophomore</option>
                                <option value="Junior">Junior</option>
                                <option value="Senior">Senior</option>
                                <option value="Graduate">Graduate</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <Input
                            name="phone"
                            label="Phone Number"
                            type="tel"
                            placeholder="+1 (555) 123-4567"
                            value={formData.phone}
                            onChange={handleChange}
                            required
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
