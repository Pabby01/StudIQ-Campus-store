export default function ReturnsPage() {
    return (
        <div className="min-h-screen bg-soft-gray-bg py-12 px-4">
            <div className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm">
                <h1 className="text-3xl font-bold mb-6">Returns & Refunds</h1>
                <div className="prose max-w-none text-muted-text">
                    <p>Our return policy ensures fair treatment for both buyers and sellers.</p>
                    <h3 className="text-black font-semibold mt-4">Disputes</h3>
                    <p>If an item differs significantly from its description, you may open a dispute within 24 hours of receipt.</p>
                    <h3 className="text-black font-semibold mt-4">Refund Process</h3>
                    <p>Approved refunds are processed to your wallet within 1-2 business days.</p>
                </div>
            </div>
        </div>
    );
}
