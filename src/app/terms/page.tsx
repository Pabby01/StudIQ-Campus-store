export default function TermsPage() {
    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
                <div className="prose max-w-none text-muted-text">
                    <p>Welcome to StudIQ Campus Store. By accessing our platform, you agree to these terms.</p>
                    <h3 className="text-black font-semibold mt-4">1. Use of Service</h3>
                    <p>Our marketplace is designed for university students to buy, sell, and trade safely.</p>
                    <h3 className="text-black font-semibold mt-4">2. User Conduct</h3>
                    <p>Users must provide accurate information and respect community guidelines.</p>
                    <p className="mt-8 italic">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
