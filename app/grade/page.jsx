"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "@/components/layout/Loader";
import { ChevronRight } from "lucide-react";
import { ShinyButton } from "@/components/ui/shiny-button";
import axios from "axios";

const CLASSES = {
  1: ["1А", "1Б", "1В"],
  2: ["2А", "2Б", "2В"],
  3: ["3А", "3Б", "3В"],
  4: ["4А", "4Б", "4В"],
  5: ["5А", "5Б", "5В", "5Г"],
  6: ["6А", "6Б", "6В", "6Г"],
  7: ["7А", "7Б", "7В"],

};

export default function DropdownMenuBasic() {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndAccess = async () => {
      try {
        // Cookie sent automatically — no token needed
        const response = await axios.get("/api/auth/user");
        setUser(response.data);

        if (response.data.grade) {
          router.push("/dashboard");
        } else {
          setLoadingAuth(false);
        }
      } catch (error) {
        router.push("/sign-in");
      }
    };

    checkAuthAndAccess();
  }, [router]);

  const handleSave = async () => {
    if (!selectedGrade) {
      console.error("Моля изберете клас първо!");
      return;
    }

    try {
      setLoading(true);

      // Cookie sent automatically — no token needed
      await axios.put("/api/auth/grade", { grade: selectedGrade });

      alert("Класът е запазен успешно. Добре дошли!");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      console.error("Грешка при запазването на класа!");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await axios.post("/api/auth/sign-out");
    router.push("/sign-in");
  };

  if (loadingAuth) {
    return <Loader />;
  }

  return (
    <div className="flex gap-3 items-center">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#478BAF] text-sm font-medium text-white">
                1
              </div>
              <span className="text-lg font-medium text-foreground">
                Здравей {user?.fullName},
              </span>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              Моля изберете клас за да можем да ви разпределим правилно и да
              получите Вашата храната спокойно
            </p>
            <div className="flex flex-col gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#478BAF] focus-visible:ring-offset-2"
                  >
                    {selectedGrade || "Изберете клас"}
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent className="w-full min-w-[var(--radix-dropdown-menu-trigger-width)] max-h-64 overflow-y-auto">
                  {Object.values(CLASSES).map((group, index) => (
                    <div key={index}>
                      <DropdownMenuGroup>
                        {group.map((item) => (
                          <DropdownMenuItem
                            key={item}
                            onClick={() => setSelectedGrade(item)}
                          >
                            {item}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuGroup>

                      {index < Object.values(CLASSES).length - 1 && (
                        <DropdownMenuSeparator />
                      )}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <ShinyButton
                href="#"
                onClick={handleSave}
                disabled={!selectedGrade || loading}
                className="w-full h-12 text-base font-medium gap-2"
              >
                Напред
                <ChevronRight className="h-4 w-4" />
              </ShinyButton>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Грешен профил?{" "}
            <button
              type="button"
              onClick={signOut}
              className="text-[#478BAF] hover:underline font-medium transition-all duration-200"
            >
              Излез
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}

