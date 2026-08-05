import { createServerFn } from "@tanstack/react-start";

export const findRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { findRoomImpl } = await import("./api.server");
    return findRoomImpl(data.code);
  });

export const createRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: { code: string }) => data)
  .handler(async ({ data }) => {
    const { createRoomImpl } = await import("./api.server");
    return createRoomImpl(data.code);
  });

export const joinRoomFn = createServerFn({ method: "POST" })
  .inputValidator((data: { roomId: string; name: string }) => data)
  .handler(async ({ data }) => {
    const { joinRoomImpl } = await import("./api.server");
    return joinRoomImpl(data);
  });

export const syncPlayerFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; name: string }) => data)
  .handler(async ({ data }) => {
    const { syncPlayerImpl } = await import("./api.server");
    return syncPlayerImpl(data);
  });

export const listPlayersFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; roomId: string }) => data)
  .handler(async ({ data }) => {
    const { listPlayersImpl } = await import("./api.server");
    return listPlayersImpl(data);
  });

export const setPlayerWordFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; word: string }) => data)
  .handler(async ({ data }) => {
    const { setPlayerWordImpl } = await import("./api.server");
    return setPlayerWordImpl(data);
  });

export const sendSuggestionFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      playerId: string;
      token: string;
      roomId: string;
      targetPlayerId: string;
      authorName: string;
      text: string;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { sendSuggestionImpl } = await import("./api.server");
    return sendSuggestionImpl(data);
  });

export const mySuggestionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string }) => data)
  .handler(async ({ data }) => {
    const { mySuggestionImpl } = await import("./api.server");
    return mySuggestionImpl(data);
  });

export const resolveSuggestionFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; id: string; status: "used" | "skipped" }) => data)
  .handler(async ({ data }) => {
    const { resolveSuggestionImpl } = await import("./api.server");
    return resolveSuggestionImpl(data);
  });

export const listTeamsFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; roomId: string }) => data)
  .handler(async ({ data }) => {
    const { listTeamsImpl } = await import("./api.server");
    return listTeamsImpl(data);
  });

export const listTeamMembersFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; roomId: string }) => data)
  .handler(async ({ data }) => {
    const { listTeamMembersImpl } = await import("./api.server");
    return listTeamMembersImpl(data);
  });

export const createTeamFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; roomId: string; name: string; color: string }) => data)
  .handler(async ({ data }) => {
    const { createTeamImpl } = await import("./api.server");
    return createTeamImpl(data);
  });

export const deleteTeamFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; teamId: string }) => data)
  .handler(async ({ data }) => {
    const { deleteTeamImpl } = await import("./api.server");
    return deleteTeamImpl(data);
  });

export const joinTeamFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; teamId: string }) => data)
  .handler(async ({ data }) => {
    const { joinTeamImpl } = await import("./api.server");
    return joinTeamImpl(data);
  });

export const activeGameFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; roomId: string }) => data)
  .handler(async ({ data }) => {
    const { activeGameImpl } = await import("./api.server");
    return activeGameImpl(data);
  });

export const createGameFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      playerId: string;
      token: string;
      roomId: string;
      rounds: number;
      firstTeamId: string;
      durationSeconds: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { createGameImpl } = await import("./api.server");
    return createGameImpl(data);
  });

export const archiveGameFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; gameId: string }) => data)
  .handler(async ({ data }) => {
    const { archiveGameImpl } = await import("./api.server");
    return archiveGameImpl(data);
  });

export const startTurnFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; gameId: string }) => data)
  .handler(async ({ data }) => {
    const { startTurnImpl } = await import("./api.server");
    return startTurnImpl(data);
  });

export const listScoresFn = createServerFn({ method: "POST" })
  .inputValidator((data: { playerId: string; token: string; gameId: string }) => data)
  .handler(async ({ data }) => {
    const { listScoresImpl } = await import("./api.server");
    return listScoresImpl(data);
  });

export const submitTurnFn = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      playerId: string;
      token: string;
      gameId: string;
      points: number;
      found: { text: string; value: number }[];
      skipped: string[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const { submitTurnImpl } = await import("./api.server");
    return submitTurnImpl(data);
  });
