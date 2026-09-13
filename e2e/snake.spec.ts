import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  // ensure the app is mounted (and its key listeners attached) before interacting
  await expect(page.getByTestId("overlay-start")).toBeVisible();
});

test("shows the start screen", async ({ page }) => {
  await expect(page).toHaveTitle("Rainbow Snake");
  await expect(page.getByTestId("overlay-start")).toBeVisible();
  await expect(page.getByTestId("score")).toHaveText("0");
  await expect(page.getByTestId("board")).toBeVisible();
});

test("starts the game with an arrow key", async ({ page }) => {
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("overlay-start")).toBeHidden();
});

test("pauses and resumes with space", async ({ page }) => {
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");
  await expect(page.getByTestId("overlay-paused")).toBeVisible();
  await page.keyboard.press("Space");
  await expect(page.getByTestId("overlay-paused")).toBeHidden();
});

test("running into a wall ends the game and Enter restarts", async ({ page }) => {
  // board is 20x20 and the snake starts centered moving right at ~160ms per
  // tick, so driving straight up hits the wall within a few seconds
  await page.keyboard.press("ArrowUp");
  await expect(page.getByTestId("overlay-gameover")).toBeVisible({ timeout: 10_000 });
  await page.keyboard.press("Enter");
  await expect(page.getByTestId("overlay-gameover")).toBeHidden();
  await expect(page.getByTestId("score")).toHaveText("0");
});

test("high score survives a reload", async ({ page }) => {
  await page.evaluate(() => localStorage.setItem("rainbow-snake.highscore", "42"));
  await page.reload();
  await expect(page.getByTestId("highscore")).toHaveText("42");
});

test("registers a service worker for offline play", async ({ page }) => {
  const registered = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    return registration.active !== null;
  });
  expect(registered).toBe(true);
});

test("still loads while offline", async ({ page, context }) => {
  // first visit precaches everything; wait for the SW to take control
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("overlay-start")).toBeVisible();
  await context.setOffline(false);
});
