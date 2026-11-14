import { expect, test } from '@playwright/test'

const BLOCKED_HOST_PATTERNS = [/copernicusmarine\.eu/i, /marine\.copernicus\.eu/i]

test.describe('The static OceanDrift demo', () => {
  test('runs the core storyboard without secrets or live Copernicus calls', async ({ page }) => {
    const blockedRequests: string[] = []
    page.on('request', (request) => {
      const url = request.url()
      if (BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(url))) {
        blockedRequests.push(url)
      }
    })

    await page.goto('/')

    await expect(page.getByRole('status').first()).toContainText(/synthetic/i)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Mediterranean surface currents',
    )

    await expect(page.getByText('Loading map…')).toBeHidden({ timeout: 60_000 })

    const map = page.getByRole('application', {
      name: 'Ocean map. Click the sea to set a drift origin.',
    })
    const box = await map.boundingBox()
    if (!box) {
      throw new Error('Map canvas has no bounding box')
    }

    await map.click({
      position: { x: box.width / 2, y: box.height / 2 },
    })

    await expect(page.getByText(/Origin set\. Choose horizon and run drift\./)).toBeVisible()
    await expect(page.locator('.mono').first()).toContainText(/°E/)

    const runButton = page.getByRole('button', { name: 'Run drift' })
    await expect(runButton).toBeEnabled()
    await runButton.click()

    await expect(page.getByRole('button', { name: 'Play' })).toBeEnabled({ timeout: 30_000 })
    await expect(page.getByRole('heading', { name: 'Exposure ranking' })).toBeVisible()

    const scrub = page.locator('#scrub')
    await expect(scrub).toBeEnabled()
    await scrub.fill('10')

    await page.getByRole('button', { name: 'Origin Δ' }).click()
    await runButton.click()
    await expect(page.getByRole('heading', { name: 'Difference summary' })).toBeVisible({
      timeout: 30_000,
    })

    const downloadPromise = page.waitForEvent('download')
    await page.getByRole('button', { name: 'JSON' }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toMatch(/^oceandrift-run-.*\.json$/)

    const exportPath = await download.path()
    if (!exportPath) {
      throw new Error('JSON export download missing path')
    }
    const body = await download.createReadStream()
    const chunks: Buffer[] = []
    if (!body) {
      throw new Error('JSON export download missing stream')
    }
    for await (const chunk of body) {
      chunks.push(Buffer.from(chunk))
    }
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as {
      episode?: { kind?: string }
      schemaVersion?: string
    }
    expect(parsed.schemaVersion).toBe('1.0.0')
    expect(parsed.episode?.kind).toBe('synthetic')

    await page.setViewportSize({ width: 390, height: 844 })
    await expect(page.getByRole('complementary', { name: 'Simulation controls' })).toBeVisible()

    expect(blockedRequests).toEqual([])
  })
})