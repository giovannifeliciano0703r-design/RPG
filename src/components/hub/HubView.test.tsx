// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HubView } from "./HubView";

let host: HTMLDivElement;
let root: Root;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  host = document.createElement("div");
  document.body.append(host);
  root = createRoot(host);
});

afterEach(() => {
  act(() => root.unmount());
  host.remove();
});

it("shows account tools immediately after a compact welcome", () => {
  const action = vi.fn();
  act(() => root.render(
    <HubView
      activeCharacter={null}
      characters={[]}
      onNavigateView={action}
      onOpenCharacterSheet={action}
      onDeleteCharacter={action}
      onOpenTrash={action}
      onOpenBestiary={action}
      onOpenMacroManager={action}
      onOpenMediaLibrary={action}
      onOpenNpcFolders={action}
      onOpenCampaignManager={action}
      onOpenDiceRoller={action}
    />,
  ));

  expect(host.querySelector("h1")?.textContent).toMatch(/Mestre Arcano/i);
  expect(host.querySelector(".min-h-\\[320px\\]")).not.toBeNull();
  expect(host.textContent).not.toMatch(/role para baixo/i);
  expect(host.textContent).toMatch(/Ferramentas & Funções Rápidas/i);
});
