// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./Dialog";

let root: Root;
let host: HTMLDivElement;
let trigger: HTMLButtonElement;
const close = vi.fn();
const confirm = vi.fn();
const view = (open = true) => <ConfirmDialog isOpen={open} title="Excluir ficha" description="Mover para a lixeira?" onClose={close} onConfirm={confirm} />;
const key = (value: string, shiftKey = false) => {
  const event = new KeyboardEvent("keydown", { key: value, shiftKey, bubbles: true, cancelable: true });
  act(() => { document.activeElement?.dispatchEvent(event); });
  return event;
};
const dialog = () => host.querySelector<HTMLElement>('[role="alertdialog"]')!;

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  vi.clearAllMocks();
  trigger = document.createElement("button");
  host = document.createElement("div");
  document.body.append(trigger, host);
  trigger.focus();
  root = createRoot(host);
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  trigger.remove();
});

it("keeps forward and reverse Tab inside, including from the initial container focus", () => {
  act(() => root.render(view()));
  const buttons = dialog().querySelectorAll("button");
  expect(document.activeElement).toBe(dialog());
  expect(key("Tab", true).defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(buttons[1]);
  key("Tab");
  expect(document.activeElement).toBe(buttons[0]);
  key("Tab", true);
  expect(document.activeElement).toBe(buttons[1]);
  dialog().focus();
  key("Tab");
  expect(document.activeElement).toBe(buttons[0]);
});

it("excludes disabled and hidden buttons from keyboard traversal", () => {
  act(() => root.render(view()));
  const buttons = dialog().querySelectorAll("button");
  buttons[1].disabled = true;
  key("Tab", true);
  expect(document.activeElement).toBe(buttons[0]);
  buttons[0].hidden = true;
  dialog().focus();
  expect(key("Tab").defaultPrevented).toBe(true);
  expect(document.activeElement).toBe(dialog());
});

it("recaptures escaped focus and returns focus to the trigger when closed", () => {
  act(() => root.render(view()));
  trigger.focus();
  expect(document.activeElement).toBe(dialog());
  key("Escape");
  expect(close).toHaveBeenCalledTimes(1);
  expect(confirm).not.toHaveBeenCalled();
  act(() => root.render(view(false)));
  expect(document.activeElement).toBe(trigger);
});

it("only closes the upper dialog and restores focus inside its parent", () => {
  const closeUpper = vi.fn();
  const stack = (upper: boolean) => <>{view()}<ConfirmDialog isOpen={upper} title="Outra confirmação" description="Confirme" onClose={closeUpper} onConfirm={confirm} /></>;
  act(() => root.render(stack(false)));
  const parent = dialog();
  act(() => root.render(stack(true)));
  const upper = host.querySelectorAll('[role="alertdialog"]')[1];
  expect(document.activeElement).toBe(upper);
  key("Escape");
  expect(closeUpper).toHaveBeenCalledTimes(1);
  expect(close).not.toHaveBeenCalled();
  act(() => root.render(stack(false)));
  expect(document.activeElement).toBe(parent);
  key("Escape");
  expect(close).toHaveBeenCalledTimes(1);
});
