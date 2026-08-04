import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, PartyPopper, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        content: "Crée une partie, partage le QR code et fais deviner tes amis.",
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
    <main className="party-gradient relative flex min-h-[100dvh] flex-col items-center justify-center gap-8 px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm text-center"
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs font-medium uppercase tracking-widest text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" /> Jeu de soirée
        </span>
        <h1 className="mt-5 text-5xl font-bold leading-[0.95] text-foreground">
          Devine
          <span className="block text-word text-glow">Tête</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Le mot s'affiche en grand sur ton front. À toi de le faire deviner… sans le voir.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card/80 p-5 backdrop-blur"
      >
        <div className="space-y-2 text-left">
          <label htmlFor="pseudo" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Ton pseudo
          </label>
          <Input
            id="pseudo"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ex. Léa"
            maxLength={18}
            className="h-12 rounded-2xl text-base"
          />
        </div>

        <Button
          onClick={onCreate}
          disabled={busy !== null}
          className="h-14 w-full rounded-2xl text-base font-bold"
        >
          {busy === "create" ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <PartyPopper className="size-5" />
          )}
          Créer une partie
        </Button>

        {mode === "idle" ? (
          <Button
            variant="secondary"
            onClick={() => setMode("join")}
            className="h-14 w-full rounded-2xl text-base font-bold"
          >
            <Users className="size-5" />
            Rejoindre une partie
          </Button>
        ) : (
          <div className="space-y-3">
            <Input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase().slice(0, 4))}
              placeholder="CODE"
              inputMode="text"
              autoCapitalize="characters"
              className="h-16 rounded-2xl text-center text-3xl font-bold tracking-[0.4em]"
            />
            <Button
              variant="secondary"
              onClick={onJoin}
              disabled={busy !== null}
              className="h-14 w-full rounded-2xl text-base font-bold"
            >
              {busy === "join" ? <Loader2 className="size-5 animate-spin" /> : <Users className="size-5" />}
              Rejoindre
            </Button>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Astuce : scanne le QR code d'un ami pour entrer directement dans sa partie.
        </p>
      </motion.div>
    </main>
  );
}
