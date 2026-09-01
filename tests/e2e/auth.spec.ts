import { expect, test } from "@playwright/test";

test.describe("acesso por conta", () => {
  test("exibe somente o fluxo autenticado", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "Entrar no Mestre Arcano" })).toBeVisible();
    await expect(page.getByLabel("E-mail do Aventureiro")).toBeVisible();
    await expect(page.getByLabel("Senha", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Adentrar o Santuário" })).toBeVisible();
    await expect(page.getByText(/acesso rápido|modo demonstração|continuar sem conta/i)).toHaveCount(0);
  });

  test("cadastro exige dados válidos e consentimento", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Criar Nova Conta" }).click();

    const submit = page.getByRole("button", { name: "Criar conta" });
    await expect(submit).toBeDisabled();

    await page.getByLabel("Nome de exibição").fill("Aventureira de Teste");
    await page.getByLabel("E-mail", { exact: true }).fill("teste@example.com");
    await page.getByLabel("Senha", { exact: true }).fill("senha-segura-123");
    await page.getByLabel("Confirmar senha").fill("senha-segura-123");
    await expect(submit).toBeDisabled();

    await page.getByRole("checkbox").check();
    await expect(submit).toBeEnabled();
    await expect(page.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute("href", "/terms.html");
    await expect(page.getByRole("link", { name: "Política de Privacidade" })).toHaveAttribute("href", "/privacy.html");
  });

  test("documentos legais são públicos", async ({ request }) => {
    for (const path of ["/terms.html", "/privacy.html"]) {
      const response = await request.get(path);
      expect(response.ok()).toBeTruthy();
      expect(await response.text()).toContain("Mestre Arcano");
    }
  });
});
