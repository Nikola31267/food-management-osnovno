"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";
import SignInCard from "@/components/auth/SignInCard";
import axios from "axios";

export default function Login() {
  const [error, setError] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if already authenticated via cookie
    axios
      .get("/api/auth/me")
      .then(() => router.push("/dashboard"))
      .catch(() => setLoadingAuth(false)); // Not logged in, show sign-in
  }, [router]);

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    const token = credentialResponse.credential;
    setLoadingLogin(true);
    try {
      const response = await axios.post("/api/auth/google-signin", { token });
      if (response.data.user.role === "teacher") {
        router.push("/dashboard");
      } else {
        router.push("/grade");
      }
    } catch (error) {
      console.error(
        "Google login failed:",
        error.response ? error.response.data : error.message,
      );
      setError("Google login failed. Please try again.");
      setLoadingLogin(false); // only reset on error — on success we're navigating away
    }
  };

  const handleGoogleLoginFailure = () => {
    setError("Google login failed");
  };

  if (loadingAuth || loadingLogin) {
    return <Loader />;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignInCard
          handleGoogleLoginSuccess={handleGoogleLoginSuccess}
          handleGoogleLoginFailure={handleGoogleLoginFailure}
          error={error}
        />
      </div>
    </main>
  );
}

