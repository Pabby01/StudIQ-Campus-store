export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
                <div className="prose max-w-none text-muted-text">
                    <p>We value your privacy. This policy explains how we collect and protect your data.</p>
                    <h3 className="text-black font-semibold mt-4">1. Data Collection</h3>
                    <p>We collect only essential information required for transactions and profile verification.</p>
                    <h3 className="text-black font-semibold mt-4">2. Wallet Security</h3>
                    <p>Your private keys are never stored on our servers. Transactions are signed locally by your wallet.</p>
                    <p className="mt-8 italic">Last updated: {new Date().toLocaleDateString()}</p>
                </div>
            </div>
        </div>
    );
}
