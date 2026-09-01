import { useCallback, useEffect, useRef, useState } from "react";
import type { BattleMapData, Campaign, ChatMessage, InitiativeState, UserProfile } from "../types";
import { getCampaignPermissions } from "../domain/campaignPermissions";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  createRemoteCampaign,
  loadCampaignMessages,
  loadCampaignState,
  saveCampaignState,
  sendCampaignMessage,
  subscribeToCampaignMessages,
  subscribeToCampaignState,
  type RemoteCampaignMessage,
  CampaignStateConflictError,
} from "../services/supabaseCampaigns";

type Options = {
  campaign: Campaign | null;
  user: UserProfile | null;
  battlemap: BattleMapData;
  initiative: InitiativeState;
  setCampaign: (campaign: Campaign) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setBattlemap: React.Dispatch<React.SetStateAction<BattleMapData>>;
  setInitiative: React.Dispatch<React.SetStateAction<InitiativeState>>;
};

function toChatMessage(message: RemoteCampaignMessage, user: UserProfile | null): ChatMessage {
  const isCurrentUser = message.author_id === user?.id;
  return {
    id: message.id,
    senderId: message.author_id,
    senderName: isCurrentUser ? user!.name : "Aventureiro online",
    senderAvatar: isCurrentUser ? user!.avatar : "wizard",
    channel: message.channel === "IC" ? "IC" : "OOC",
    content: message.body,
    timestamp: new Date(message.created_at).getTime(),
    type: "TEXT",
  };
}

export function useLiveCampaign(options: Options) {
  const { campaign, user, battlemap, initiative, setCampaign, setMessages, setBattlemap, setInitiative } = options;
  const [status, setStatus] = useState<"offline" | "connecting" | "online" | "error">("offline");
  const [error, setError] = useState<string | null>(null);
  const applyingRemoteRef = useRef(false);
  const revisionsRef = useRef<Record<string, number>>({ battlemap: 0, initiative: 0 });
  const remoteId = campaign?.remoteId;
  const { canEditMaps, canManageInitiative } = getCampaignPermissions(campaign, user?.id);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase || !campaign || !user || campaign.remoteId) return;
    let cancelled = false;
    setStatus("connecting");
    void createRemoteCampaign(campaign).then((id) => {
      if (!cancelled) setCampaign({ ...campaign, remoteId: id, gmUserId: user.id, gmUserName: user.name });
    }).catch((cause) => {
      if (!cancelled) {
        setStatus("error");
        setError(cause instanceof Error ? cause.message : "Não foi possível hospedar a campanha.");
      }
    });
    return () => { cancelled = true; };
  }, [campaign, setCampaign, user]);

  useEffect(() => {
    const client = supabase;
    if (!remoteId || !client) return;
    let cancelled = false;
    setStatus("connecting");
    void Promise.all([
      loadCampaignMessages(remoteId),
      loadCampaignState<BattleMapData>(remoteId, "battlemap"),
      loadCampaignState<InitiativeState>(remoteId, "initiative"),
    ]).then(([remoteMessages, remoteMap, remoteInitiative]) => {
      if (cancelled) return;
      applyingRemoteRef.current = true;
      if (remoteMessages.length) setMessages(remoteMessages.map((message) => toChatMessage(message, user)));
      if (remoteMap) { revisionsRef.current.battlemap = remoteMap.revision; setBattlemap(remoteMap.payload); }
      if (remoteInitiative) { revisionsRef.current.initiative = remoteInitiative.revision; setInitiative(remoteInitiative.payload); }
      queueMicrotask(() => { applyingRemoteRef.current = false; });
      setStatus("online");
    }).catch((cause) => {
      if (!cancelled) { setStatus("error"); setError(cause instanceof Error ? cause.message : "Falha na sincronização."); }
    });
    const messageChannel = subscribeToCampaignMessages(remoteId, (message) => {
      setMessages((previous) => previous.some((item) => item.id === message.id) ? previous : [...previous, toChatMessage(message, user)]);
    });
    const stateChannel = subscribeToCampaignState(remoteId, (key, payload, revision) => {
      applyingRemoteRef.current = true;
      revisionsRef.current[key] = revision;
      if (key === "battlemap") setBattlemap(payload as BattleMapData);
      if (key === "initiative") setInitiative(payload as InitiativeState);
      queueMicrotask(() => { applyingRemoteRef.current = false; });
    });
    return () => {
      cancelled = true;
      if (messageChannel) void client.removeChannel(messageChannel);
      if (stateChannel) void client.removeChannel(stateChannel);
    };
  }, [remoteId, setBattlemap, setInitiative, setMessages, user]);

  useEffect(() => {
    if (!remoteId || applyingRemoteRef.current || !canEditMaps) return;
    const timer = window.setTimeout(() => void saveCampaignState(remoteId, "battlemap", battlemap, revisionsRef.current.battlemap)
      .then((revision) => { revisionsRef.current.battlemap = revision; setStatus("online"); })
      .catch(async (cause) => {
        setStatus("error");
        if (cause instanceof CampaignStateConflictError) {
          const latest = await loadCampaignState<BattleMapData>(remoteId, "battlemap");
          if (latest) { revisionsRef.current.battlemap = latest.revision; setBattlemap(latest.payload); }
          setError(cause.message);
        } else setError(cause instanceof Error ? cause.message : "Falha ao salvar o mapa.");
      }), 900);
    return () => window.clearTimeout(timer);
  }, [battlemap, canEditMaps, remoteId, setBattlemap]);

  useEffect(() => {
    if (!remoteId || applyingRemoteRef.current || !canManageInitiative) return;
    const timer = window.setTimeout(() => void saveCampaignState(remoteId, "initiative", initiative, revisionsRef.current.initiative)
      .then((revision) => { revisionsRef.current.initiative = revision; setStatus("online"); })
      .catch(async (cause) => {
        setStatus("error");
        if (cause instanceof CampaignStateConflictError) {
          const latest = await loadCampaignState<InitiativeState>(remoteId, "initiative");
          if (latest) { revisionsRef.current.initiative = latest.revision; setInitiative(latest.payload); }
          setError(cause.message);
        } else setError(cause instanceof Error ? cause.message : "Falha ao salvar a iniciativa.");
      }), 700);
    return () => window.clearTimeout(timer);
  }, [canManageInitiative, initiative, remoteId, setInitiative]);

  const sendMessage = useCallback(async (message: Partial<ChatMessage>) => {
    if (!remoteId) return false;
    try {
      await sendCampaignMessage(remoteId, message.content || "", message.channel === "IC" ? "IC" : "OOC");
      setStatus("online");
      return true;
    } catch (cause) {
      setStatus("error");
      setError(cause instanceof Error ? cause.message : "Mensagem mantida apenas neste dispositivo.");
      return false;
    }
  }, [remoteId]);

  return { status, error, clearError: () => setError(null), sendMessage };
}
