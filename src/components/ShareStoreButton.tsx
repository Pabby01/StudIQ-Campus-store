import { useState } from "react";
import Button from "@/components/ui/Button";
import { Share2, Check, Copy } from "lucide-react";

interface ShareStoreButtonProps {
    storeId: string;
    storeName?: string;
    variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
    size?: "sm" | "md" | "lg";
    className?: string;
}

export default function ShareStoreButton({
    storeId,
    storeName,
    variant = "outline",
    size = "sm",
    className = ""
}: ShareStoreButtonProps) {
    const [copied, setCopied] = useState(false);

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const url = `${window.location.origin}/store/${storeId}`;

        if (navigator.share) {
            navigator.share({
                title: storeName || 'My Store',
                text: `Check out ${storeName ? storeName : 'my store'} on StudIQ!`,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Button
            variant={variant}
            size={size}
            onClick={handleShare}
            className={className}
        >
            {copied ? (
                <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                </>
            ) : (
                <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Store
                </>
            )}
        </Button>
    );
}
