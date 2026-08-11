import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ChronoResult } from "@/components/chrono/chrono-result";
import { ChronoRound } from "@/components/chrono/chrono-round";
import { FinalStandings } from "@/components/themes/final-standings";
import { TeamSetup, type TeamDraft } from "@/components/themes/team-setup";
import { ThemeBoard, type TeamState } from "@/components/themes/theme-board";
import { THEME_SECONDS, type RoundResult } from "@/lib/chrono";
import { drawThemes, type Theme } from "@/lib/themes";
import { unlockAudio } from "@/lib/sfx";
import { vibrate } from "@/lib/haptics";

export const Route = createFileRoute("/themes")({
  head: () => ({
    meta: [
      { title: "Thèmes par équipes — Devine Tête" },
      {
        name: "description",
        content:
          "Deux ou trois équipes, un thème tiré au sort et 1 min 30 pour marquer le maximum de points. Classement final et revanche immédiate.",
      },
      { property: "og:title", content: "Thèmes par équipes — Devine Tête" },
      {
        property: "og:description",
        content: "Choisissez un thème, 1 min 30 par équipe, le meilleur score gagne la partie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ThemesMode,
});

const THEME_COUNT = 6;

function ThemesMode() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"setup" | "board" | "playing" | "result" | "final">("setup");
  const [teams, setTeams] = useState<TeamState[]>([]);
  const [rounds, setRounds] = useState(3);
  const [round, setRound] = useState(1);
  const [turn, setTurn] = useState(0);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [usedIds, setUsedIds] = useState<string[]>([]);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [seenWords, setSeenWords] = useState<string[]>([]);

  const goHome = () => void navigate({ to: "/" });

  const startGame = (drafts: TeamDraft[]) => {
    void unlockAudio();
    vibrate("tap");
    setTeams(drafts.map((draft) => ({ ...draft, points: 0 })));
    setRounds(drafts.length === 2 ? 3 : 2);
    setRound(1);
    setTurn(0);
    setThemes(drawThemes(THEME_COUNT));
    setUsedIds([]);
    setSeenWords([]);
    setPhase("board");
  };

  const replay = () => {
    setTeams((current) => current.map((team) => ({ ...team, points: 0 })));
    setRound(1);
    setTurn(0);
    setThemes(drawThemes(THEME_COUNT));
    setUsedIds([]);
    setSeenWords([]);
    setPhase("board");
  };

  /** Stores the turn score, greys the theme out and hands over to the next team. */
  const handOver = () => {
    const playedId = theme?.id;
    const nextUsed = playedId ? [...usedIds, playedId] : usedIds;
    if (nextUsed.length >= themes.length) {
      setThemes(drawThemes(THEME_COUNT, nextUsed));
      setUsedIds([]);
    } else {
      setUsedIds(nextUsed);
    }
    setTheme(null);
    setResult(null);

    const nextTurn = turn + 1;
    if (nextTurn < teams.length) {
      setTurn(nextTurn);
      setPhase("board");
      return;
    }
    setTurn(0);
    if (round >= rounds) {
      setPhase("final");
      return;
    }
    setRound(round + 1);
    setPhase("board");
  };

  if (phase === "setup") {
    return <TeamSetup onBack={goHome} onStart={startGame} />;
  }

  if (phase === "playing" && theme) {
    const activeTeam = teams[turn];
    return (
      <ChronoRound
        durationSeconds={THEME_SECONDS}
        theme={theme}
        excludeWords={seenWords}
        label={`${activeTeam?.name ?? ""} · ${theme.label}`}
        onFinish={(round_) => {
          setResult(round_);
          if (round_.seen) setSeenWords(round_.seen);
          setTeams((current) =>
            current.map((team, index) =>
              index === turn ? { ...team, points: team.points + round_.points } : team,
            ),
          );
          setPhase("result");
        }}
      />
    );
  }

  if (phase === "result" && result) {
    return (
      <ChronoResult
        result={result}
        subtitle={`${teams[turn]?.name ?? ""} · manche ${round}/${rounds}`}
      >
        <Button onClick={handOver} className="h-14 w-full rounded-2xl text-base font-bold">
          {turn + 1 >= teams.length && round >= rounds ? "Voir le classement" : "Passer la main"}
        </Button>
      </ChronoResult>
    );
  }

  if (phase === "final") {
    return <FinalStandings teams={teams} onReplay={replay} onHome={goHome} />;
  }

  return (
    <ThemeBoard
      themes={themes}
      usedIds={usedIds}
      teams={teams}
      activeTeamId={teams[turn]?.id ?? ""}
      round={round}
      rounds={rounds}
      onPick={(picked) => {
        void unlockAudio();
        setTheme(picked);
        setPhase("playing");
      }}
      onBack={goHome}
    />
  );
}
