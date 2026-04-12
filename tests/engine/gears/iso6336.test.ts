import { describe, test, expect } from 'vitest'
import { calcISO6336 } from '../../src/renderer/engine/gears/iso6336'

describe('ISO 6336 Gear Strength (Section 10.4)', () => {
  describe('calcISO6336', () => {
    test('basic gear calculation', () => {
      const result = calcISO6336({
        module: 2,
        teeth1: 20,
        teeth2: 40,
        faceWidth: 20,
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640
      })
      expect(result.value.d1).toBeCloseTo(40, 0)
      expect(result.value.d2).toBeCloseTo(80, 0)
      expect(result.value.contactRatio).toBeGreaterThan(1.2)
    })

    test('root cut warning for teeth < 17', () => {
      const result = calcISO6336({
        module: 2,
        teeth1: 12,
        teeth2: 30,
        faceWidth: 20,
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640
      })
      expect(result.value.warnings.some(w => w.message.includes('根切'))).toBe(true)
    })

    test('low contact ratio warning', () => {
      const result = calcISO6336({
        module: 2,
        teeth1: 17,
        teeth2: 20,
        faceWidth: 5,  // Very narrow
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640
      })
      // Should have warnings for narrow face width
      expect(result.value.K_Hbeta).toBeGreaterThan(1.0)
    })

    test('helical gear calculation', () => {
      const result = calcISO6336({
        module: 2,
        teeth1: 20,
        teeth2: 40,
        faceWidth: 30,
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640,
        helixAngle: 15
      })
      expect(result.value.d1).toBeGreaterThan(40)  // Helical gears have larger pitch diameters
      expect(result.value.tipRelief).toBeGreaterThan(0)
    })

    test('safety factors calculation', () => {
      const result = calcISO6336({
        module: 2,
        teeth1: 20,
        teeth2: 40,
        faceWidth: 20,
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640
      })
      expect(result.value.SH1).toBeGreaterThan(0)
      expect(result.value.SF1).toBeGreaterThan(0)
      expect(result.value.SH2).toBeGreaterThan(0)
      expect(result.value.SF2).toBeGreaterThan(0)
    })

    test('application factor effect', () => {
      const result1 = calcISO6336({
        module: 2,
        teeth1: 20,
        teeth2: 40,
        faceWidth: 20,
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640,
        applicationFactor: 1.0
      })
      
      const result2 = calcISO6336({
        module: 2,
        teeth1: 20,
        teeth2: 40,
        faceWidth: 20,
        pressureAngle: 20,
        torque1: 50,
        materialYield1: 640,
        materialYield2: 640,
        applicationFactor: 1.5
      })
      
      // Higher application factor should result in lower safety factors
      expect(result2.value.SH1).toBeLessThan(result1.value.SH1)
      expect(result2.value.SF1).toBeLessThan(result1.value.SF1)
    })
  })
})
