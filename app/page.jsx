"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/layout/Loader";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function Home() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get("/api/auth/user");
        setUser(response.data);
        if (response.data) {
          router.push("/dashboard");
        }
      } catch (error) {
        router.push("/sign-in");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (loading) return <Loader />;

  if (error) return <div>Error: {error}</div>;

  return;
}

