import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Martini, PartyPopper, Timer, Users, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { vibrate } from "@/lib/haptics";
import { createRoom, joinRoom, rememberName, savedName } from "@/lib/game";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Devine Tête — Le jeu de soirée sur ton front" },
      {
        name: "description",
        content:
          "Crée une partie, partage le QR code, colle le téléphone sur ton front et fais deviner. Jeu de soirée gratuit, sans inscription.",
      },
      { property: "og:title", content: "Devine Tête — Le jeu de soirée sur ton front" },
      {
        property: "og:description",
        content: "Crée une partie, partage le QR code, colle le téléphone sur ton front et fais deviner. Jeu de soirée gratuit, sans inscription.",
      },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { room?: string } => {
    const raw = search["room"];
    return typeof raw === "string" ? { room: raw.toUpperCase().slice(0, 4) } : {};
  },
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const { room } = Route.useSearch();
  const [name, setName] = useState("");
  const [code, setCode] = useState(room ?? "");
  const [mode, setMode] = useState<"idle" | "join">(room ? "join" : "idle");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);

  useEffect(() => {
    setName(savedName());
  }, []);

  const requireName = () => {
    if (name.trim().length < 2) {
      toast.error("Choisis un pseudo (2 lettres minimum).");
      return false;
    }
    rememberName(name.trim());
    return true;
  };

  const onCreate = async () => {
    if (!requireName()) return;
    setBusy("create");
    try {
      const newCode = await createRoom(name.trim());
      await navigate({ to: "/room/$code", params: { code: newCode } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  };

  const onJoin = async () => {
    if (!requireName()) return;
    if (code.trim().length !== 4) {
      toast.error("Le code contient 4 lettres.");
      return;
    }
    setBusy("join");
    try {
      await joinRoom(code.trim().toUpperCase(), name.trim());
      await navigate({ to: "/room/$code", params: { code: code.trim().toUpperCase() } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur inattendue.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="party-gradient relative flex min-h-[100dvh] flex-col justify-center gap-10 px-6 py-12">
      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto w-full max-w-sm"
      >
        <span className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          <Martini className="size-3.5 text-primary" /> Party game
        </span>
        <h1 className="mt-4 text-6xl font-bold leading-[0.9] tracking-tight text-foreground">
          Devine
          <span className="block text-word text-glow">Tête</span>
        </h1>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mx-auto w-full max-w-sm space-y-3"
      >
        <Button
          onClick={() => void navigate({ to: "/solo" })}
          className="h-16 w-full justify-between rounded-2xl px-5 text-lg font-bold"
        >
          Jouer
          <Zap className="size-5" />
        </Button>

        <Button
          variant="secondary"
          onClick={() => void navigate({ to: "/chrono" })}
          className="h-16 w-full justify-between rounded-2xl px-5 text-lg font-bold"
        >
          Chrono 3 min
          <Timer className="size-5" />
        </Button>

        {mode === "idle" ? (
          <button
            type="button"
            onClick={() => {
              vibrate("tap");
              setMode("join");
            }}
            className="w-full pt-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Jouer à plusieurs (lobby)
          </button>
        ) : (
          <div className="space-y-3 border-t border-border pt-5">
            <Input
              id="pseudo"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ton pseudo"
              maxLength={18}
              className="h-12 rounded-2xl text-base"
            />
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 4))}
              placeholder="CODE"
              inputMode="text"
              autoCapitalize="characters"
              className="h-14 rounded-2xl text-center text-2xl font-bold tracking-[0.4em]"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onJoin}
                disabled={busy !== null}
                className="h-12 flex-1 rounded-2xl text-sm font-bold"
              >
                {busy === "join" ? <Loader2 className="size-4 animate-spin" /> : <Users className="size-4" />}
                Rejoindre
              </Button>
              <Button
                variant="outline"
                onClick={onCreate}
                disabled={busy !== null}
                className="h-12 flex-1 rounded-2xl text-sm font-bold"
              >
                {busy === "create" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <PartyPopper className="size-4" />
                )}
                Créer
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </main>
  );
}
