"use client";

import Link from "next/link";
import { Facebook, Twitter, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-white border-t border-border-gray pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <span className="text-xl font-bold text-black">StudiQ Store</span>
                        </div>
                        <p className="text-muted-text text-sm leading-relaxed">
                            The premier decentralized marketplace for students. Buy, sell, and trade campus essentials with crypto or cash.
                        </p>
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="text-gray-400 hover:text-primary-blue transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-blue transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-blue transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-blue transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Shop Links */}
                    <div>
                        <h3 className="font-semibold text-black mb-6">Shop</h3>
                        <ul className="space-y-4 text-sm text-muted-text">
                            <li><Link href="/search?category=textbooks" className="hover:text-primary-blue transition-colors">Textbooks</Link></li>
                            <li><Link href="/search?category=electronics" className="hover:text-primary-blue transition-colors">Electronics</Link></li>
                            <li><Link href="/search?category=services" className="hover:text-primary-blue transition-colors">Campus Services</Link></li>
                            <li><Link href="/search?category=food" className="hover:text-primary-blue transition-colors">Food & Snacks</Link></li>
                            <li><Link href="/search" className="hover:text-primary-blue transition-colors">All Products</Link></li>
                        </ul>
                    </div>

                    {/* Support Links */}
                    <div>
                        <h3 className="font-semibold text-black mb-6">Support</h3>
                        <ul className="space-y-4 text-sm text-muted-text">
                            <li><Link href="/dashboard/orders" className="hover:text-primary-blue transition-colors">Track Order</Link></li>
                            <li><Link href="#" className="hover:text-primary-blue transition-colors">Help Center</Link></li>
                            <li><Link href="#" className="hover:text-primary-blue transition-colors">Selling Guidelines</Link></li>
                            <li><Link href="#" className="hover:text-primary-blue transition-colors">Returns & Refunds</Link></li>
                            <li><Link href="#" className="hover:text-primary-blue transition-colors">Safety Tips</Link></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-semibold text-black mb-6">Contact</h3>
                        <ul className="space-y-4 text-sm text-muted-text">
                            <li className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary-blue shrink-0" />
                                <span>123 University Ave,<br />San Francisco, CA 94105</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Phone className="w-5 h-5 text-primary-blue shrink-0" />
                                <span>+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-5 h-5 text-primary-blue shrink-0" />
                                <span>support@studiq.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-border-gray pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-text">
                    <p>&copy; {new Date().getFullYear()} StudiQ Campus Store. All rights reserved.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-black transition-colors">Privacy Policy</Link>
                        <Link href="#" className="hover:text-black transition-colors">Terms of Service</Link>
                        <Link href="#" className="hover:text-black transition-colors">Cookie Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
