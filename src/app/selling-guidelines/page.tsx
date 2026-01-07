export default function SellingGuidelinesPage() {
    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold mb-6">Selling Guidelines</h1>
                <ul className="space-y-4 text-muted-text list-disc pl-5">
                    <li><strong className="text-black">Honesty:</strong> Accurately describe item conditions.</li>
                    <li><strong className="text-black">Fair Pricing:</strong> Set competitive prices for quick sales.</li>
                    <li><strong className="text-black">No Prohibited Items:</strong> Do not list illegal or banned substances/items.</li>
                    <li><strong className="text-black">Communication:</strong> Respond to buyer inquiries promptly.</li>
                    <li><strong className="text-black">Safety:</strong> Meet in safe, public campus locations for physical handovers.</li>
                </ul>
            </div>
        </div>
    );
}
