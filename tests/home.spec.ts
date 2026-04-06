import { test, expect } from '@playwright/test';

test('homepage has expected titles and structure', async ({ page }) => {
  // Navigate to the homepage
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Assuming the Next.js app has a title, we can also check for specific text on the page.
  
  // Check for the Trending Masterpieces section
  await expect(page.locator('text=Trending Masterpieces')).toBeVisible();

  // Check for the Notable Exhibitions section
  await expect(page.locator('text=Notable Exhibitions')).toBeVisible();

  // Check for the Top Artists section
  await expect(page.locator('text=Top Artists')).toBeVisible();
});

test('navigation to explore page', async ({ page }) => {
  await page.goto('/');

  // Find the 'View All' link that goes to /explore
  // There are two 'View All' instances, we can target the one in the top right of Trending Masterpieces
  // Since one is hidden on small screens and another on large screens, we will target the visible one.
  const exploreButton = page.locator('a[href="/explore"]').first();
  await expect(exploreButton).toBeVisible();

  // Click it
  await exploreButton.click();

  // Verify navigation to /explore
  await expect(page).toHaveURL(/.*\/explore/);
});
