"use client";

import { useEffect } from "react";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("GlobalError caught:", error);
    }, [error]);

    return (
        <html lang="en">
            <body
                style={{
                    margin: 0,
                    fontFamily:
                        "'Outfit', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
                    backgroundColor: "#0f172a",
                    color: "#f8fafc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "100vh",
                }}
            >
                <div
                    style={{
                        textAlign: "center",
                        padding: "2rem",
                        maxWidth: "480px",
                    }}
                >
                    {/* Shield Icon */}
                    <div
                        style={{
                            width: "80px",
                            height: "80px",
                            borderRadius: "24px",
                            background: "linear-gradient(135deg, #22c55e, #16a34a)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 2rem",
                            boxShadow: "0 20px 40px rgba(34,197,94,0.3)",
                        }}
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                    </div>

                    <h1
                        style={{
                            fontSize: "1.5rem",
                            fontWeight: 900,
                            marginBottom: "0.75rem",
                            letterSpacing: "-0.02em",
                        }}
                    >
                        Something went wrong
                    </h1>
                    <p
                        style={{
                            color: "#94a3b8",
                            marginBottom: "2rem",
                            lineHeight: 1.6,
                            fontSize: "0.95rem",
                        }}
                    >
                        An unexpected error occurred in the EcoGuard dashboard. Please try
                        refreshing the page.
                    </p>

                    {error?.digest && (
                        <p
                            style={{
                                color: "#475569",
                                fontSize: "0.75rem",
                                fontFamily: "monospace",
                                marginBottom: "1.5rem",
                            }}
                        >
                            Error ID: {error.digest}
                        </p>
                    )}

                    <div
                        style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}
                    >
                        <button
                            onClick={reset}
                            style={{
                                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                                color: "white",
                                border: "none",
                                padding: "0.75rem 2rem",
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                                boxShadow: "0 8px 20px rgba(34,197,94,0.3)",
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => (window.location.href = "/")}
                            style={{
                                background: "rgba(255,255,255,0.08)",
                                color: "#f8fafc",
                                border: "1px solid rgba(255,255,255,0.1)",
                                padding: "0.75rem 2rem",
                                borderRadius: "12px",
                                fontWeight: 700,
                                fontSize: "0.875rem",
                                cursor: "pointer",
                                letterSpacing: "0.05em",
                                textTransform: "uppercase",
                            }}
                        >
                            Go Home
                        </button>
                    </div>
                </div>
            </body>
        </html>
    );
}
