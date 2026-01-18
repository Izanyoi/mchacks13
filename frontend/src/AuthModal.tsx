import { useState, useEffect } from "react";
import { auth } from "./api";

export default function AuthModal() {
    const [showModal, setShowModal] = useState(false);
    const [mode, setMode] = useState<"login" | "register">("register");

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // If viewing a shared calendar, do not show auth modal
        if (window.location.pathname.includes("/calendar/view/")) {
            return;
        }

        const hasVisited = localStorage.getItem("hasVisited");
        const token = localStorage.getItem("token");
        if (!hasVisited || !token) {
            setShowModal(true);
        }
    }, []);

    const handleAuth = async () => {
        setError("");
        try {
            if (mode === "register") {
                await auth.register(username, email, password);
                // After register, login to get token
                await auth.login(username, password);
            } else {
                await auth.login(username, password);
            }

            localStorage.setItem("hasVisited", "true");
            setShowModal(false);
            window.location.reload(); // Reload to fetch user data/schedule
        } catch (e) {
            console.error(e);
            setError("Authentication failed. Please check your credentials.");
        }
    };

    if (!showModal) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-white rounded-xl shadow-2xl w-96 p-8 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-600" />

                <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
                    {mode === "login" ? "Welcome Back" : "Get Started"}
                </h2>
                <p className="text-gray-500 text-center mb-8 text-sm">
                    {mode === "login"
                        ? "Enter your details to access your calendar"
                        : "Create an account to verify your identity"}
                </p>

                {error && (
                    <div className="mb-4 p-2 bg-red-100 text-red-700 text-sm rounded text-center">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
                            placeholder="username"
                        />
                    </div>
                    {mode === "register" && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
                                placeholder="name@example.com"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 bg-white"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        onClick={handleAuth}
                        className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/30"
                    >
                        {mode === "login" ? "Sign In" : "Create Account"}
                    </button>
                </div>

                <div className="mt-6 text-center text-sm text-gray-600">
                    {mode === "login" ? (
                        <>
                            Don't have an account?{" "}
                            <button
                                onClick={() => {
                                    setMode("register");
                                    setError("");
                                }}
                                className="text-blue-600 font-medium hover:underline bg-transparent p-0 border-none"
                            >
                                Sign up
                            </button>
                        </>
                    ) : (
                        <>
                            Already have an account?{" "}
                            <button
                                onClick={() => {
                                    setMode("login");
                                    setError("");
                                }}
                                className="text-blue-600 font-medium hover:underline bg-transparent p-0 border-none"
                            >
                                Log in
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
