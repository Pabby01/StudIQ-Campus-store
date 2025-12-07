export class APIError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "APIError";
    }
}

export function handleAPIError(error: unknown): Response {
    console.error("API Error:", error);

    if (error instanceof APIError) {
        return Response.json(
            {
                ok: false,
                error: error.message,
                code: error.code,
                details: error.details,
            },
            { status: error.statusCode }
        );
    }

    if (error instanceof Error) {
        return Response.json(
            {
                ok: false,
                error: error.message,
                code: "INTERNAL_ERROR",
            },
            { status: 500 }
        );
    }

    return Response.json(
        {
            ok: false,
            error: "An unexpected error occurred",
            code: "UNKNOWN_ERROR",
        },
        { status: 500 }
    );
}

export function validateRequired(
    data: Record<string, unknown>,
    fields: string[]
): void {
    const missing = fields.filter((field) => !data[field]);
    if (missing.length > 0) {
        throw new APIError(
            400,
            "MISSING_FIELDS",
            `Missing required fields: ${missing.join(", ")}`,
            { missing }
        );
    }
}
