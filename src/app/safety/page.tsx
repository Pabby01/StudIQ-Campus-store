export default function SafetyPage() {
    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold mb-6">Safety Tips</h1>
                <div className="grid gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-800 mb-2">Meet in Public</h3>
                        <p className="text-blue-700 text-sm">Always meet in busy, well-lit campus areas like the student center or library.</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-800 mb-2">Check Profiles</h3>
                        <p className="text-blue-700 text-sm">Trade with verified students. Check their reviews and reputation score.</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-bold text-blue-800 mb-2">Secure Payment</h3>
                        <p className="text-blue-700 text-sm">Use the platform's crypto payment or POD system. Avoid transferring money externally before meeting.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
