(() => {
  const stage = document.querySelector('.visual-stage')
  const canvas = document.querySelector('.evolution-canvas')
  const lifeCanvas = document.querySelector('.life-cycle-canvas')
  const ecosystemCanvas = document.querySelector('.ecosystem-canvas')
  const storyTrack = document.querySelector('.story-track')
  const badge = document.querySelector('.era-badge')
  const eraName = document.querySelector('.readout-era')
  const visualCredit = document.querySelector('.visual-credit')
  const chapterCount = document.querySelector('.chapter-count')
  const progressFill = document.querySelector('.progress-fill')
  const steps = [...document.querySelectorAll('.era-step')]
  const progressStops = [...document.querySelectorAll('.progress-stop')]
  const context = canvas?.getContext('2d', { alpha: false })
  const lifeContext = lifeCanvas?.getContext('2d')
  const ecosystemContext = ecosystemCanvas?.getContext('2d')

  if (!stage || !canvas || !context || !storyTrack || !steps.length) return

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const hasGsap = Boolean(window.gsap && window.ScrollTrigger)
  const gsap = window.gsap
  const ScrollTrigger = window.ScrollTrigger
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value))
  const smoothstep = (value) => value * value * (3 - 2 * value)
  const sceneState = { progress: 0 }
  const lifeMetrics = { width: 0, height: 0 }
  const ecosystemMetrics = { width: 0, height: 0 }
  const lifecycleData = {
    butterfly: {
      name: 'Monarch butterfly',
      cycle: 'METAMORPHOSIS',
      stages: [
        { name: 'Egg', title: 'A beginning, barely seen.', description: 'An egg is placed on a host plant, where the next generation begins its transformation.' },
        { name: 'Caterpillar', title: 'Growth without pause.', description: 'The larva feeds and molts repeatedly, turning plant energy into the material for change.' },
        { name: 'Chrysalis', title: 'A body reassembled.', description: 'Inside the chrysalis, larval tissues reorganize into the structures of an adult butterfly.' },
        { name: 'Adult', title: 'The cycle takes flight.', description: 'The adult emerges, feeds, migrates, and eventually lays eggs to begin the cycle again.' },
      ],
    },
    frog: {
      name: 'Common frog',
      cycle: 'METAMORPHOSIS',
      stages: [
        { name: 'Spawn', title: 'Life begins in water.', description: 'Clusters of eggs develop in sheltered freshwater, surrounded by a protective jelly.' },
        { name: 'Tadpole', title: 'A world of gills.', description: 'The tadpole swims and feeds underwater as its body grows and its lungs begin to form.' },
        { name: 'Froglet', title: 'Between two worlds.', description: 'Limbs emerge, the tail shrinks, and the young frog starts moving between water and land.' },
        { name: 'Adult', title: 'Land, water, and return.', description: 'Adults breathe air and return to freshwater to reproduce, completing the amphibian cycle.' },
      ],
    },
    bee: {
      name: 'Honeybee',
      cycle: 'COMPLETE METAMORPHOSIS',
      stages: [
        { name: 'Egg', title: 'One egg in a wax cell.', description: 'A queen lays a single egg in a honeycomb cell, where it begins developing.' },
        { name: 'Larva', title: 'Growth inside the comb.', description: 'Workers feed the growing larva until it is large enough for its cell to be capped.' },
        { name: 'Pupa', title: 'An adult takes shape.', description: 'Inside the sealed cell, the pupa develops the wings, legs, and body of an adult bee.' },
        { name: 'Adult bee', title: 'A new worker emerges.', description: 'The adult chews through its wax cap and joins the colony, eventually helping raise the next generation.' },
      ],
    },
  }
  const simulationDefaults = { temperature: 18, rainfall: 90, oxygen: 21, diversity: 68 }
  const simulationValues = { ...simulationDefaults }
  let selectedSpecies = 'butterfly'
  let selectedLifeStage = 0
  let cyclePlaying = !reducedMotion
  let lifeCycleTimer = 0
  let stageVisible = true
  let lifeCycleVisible = false
  let ecosystemVisible = false
  let visibilityObserver = null
  const stars = Array.from({ length: 96 }, (_, index) => ({
    x: ((index * 127.1) % 997) / 997,
    y: ((index * 311.7) % 991) / 991,
    size: 0.4 + ((index * 17) % 12) / 10,
    phase: (index * 2.399) % (Math.PI * 2),
  }))
  const earthTexture = new Image()
  let canvasWidth = 0
  let canvasHeight = 0
  let scenePosition = 0
  let lenis = null
  let frameId = 0
  let gsapContext = null

  earthTexture.crossOrigin = 'anonymous'
  earthTexture.src = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Blue_Marble_Western_Hemisphere.jpg/1280px-Blue_Marble_Western_Hemisphere.jpg'
  earthTexture.addEventListener('load', () => drawFrame(performance.now() / 1000))

  if (hasGsap) gsap.registerPlugin(ScrollTrigger)

  if (!reducedMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({
      duration: 1.15,
      autoRaf: true,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 0.86,
      touchMultiplier: 1.05,
    })
  }

  const resizeCanvas = () => {
    const bounds = canvas.getBoundingClientRect()
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6)
    canvasWidth = Math.max(1, bounds.width)
    canvasHeight = Math.max(1, bounds.height)
    canvas.width = Math.round(canvasWidth * pixelRatio)
    canvas.height = Math.round(canvasHeight * pixelRatio)
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    drawFrame(performance.now() / 1000)
  }

  const fillAtmosphere = (ctx, width, height, topColor, midColor, bottomColor) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, topColor)
    gradient.addColorStop(0.58, midColor)
    gradient.addColorStop(1, bottomColor)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }

  const drawStars = (ctx, width, height, time, opacity = 1) => {
    ctx.save()
    stars.forEach((star) => {
      const shimmer = reducedMotion ? 0.65 : 0.4 + (Math.sin(time * 1.1 + star.phase) + 1) * 0.3
      ctx.globalAlpha = opacity * shimmer
      ctx.fillStyle = '#eaf5f1'
      ctx.beginPath()
      ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.restore()
  }

  const drawMountainRange = (ctx, width, height, baseline, peaks, fill) => {
    ctx.beginPath()
    ctx.moveTo(0, height)
    ctx.lineTo(0, baseline)
    peaks.forEach(([x, y]) => ctx.lineTo(x * width, y * height))
    ctx.lineTo(width, baseline + height * 0.035)
    ctx.lineTo(width, height)
    ctx.closePath()
    ctx.fillStyle = fill
    ctx.fill()
  }

  const drawHadean = (ctx, width, height, time, progress) => {
    fillAtmosphere(ctx, width, height, '#090d1a', '#271b25', '#101016')
    drawStars(ctx, width, height, time, 0.76)

    const glow = ctx.createRadialGradient(width * 0.66, height * 0.55, 2, width * 0.66, height * 0.55, height * 0.56)
    const corePulse = (reducedMotion ? 0.76 : 0.68 + (Math.sin(time * 1.8) + 1) * 0.055) * (1 - progress * 0.42)
    glow.addColorStop(0, `rgba(255, 160, 73, ${corePulse})`)
    glow.addColorStop(0.2, `rgba(212, 74, 42, ${corePulse * 0.46})`)
    glow.addColorStop(1, 'rgba(67, 23, 27, 0)')
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)

    const planetX = width * 0.67
    const planetY = height * 0.57
    const planetRadius = Math.min(width, height) * (0.29 - progress * 0.012)
    const planetGradient = ctx.createRadialGradient(planetX - planetRadius * 0.48, planetY - planetRadius * 0.54, planetRadius * 0.06, planetX, planetY, planetRadius * 1.28)
    planetGradient.addColorStop(0, progress > 0.72 ? '#c79676' : '#f5aa61')
    planetGradient.addColorStop(0.28, progress > 0.72 ? '#825447' : '#b84e37')
    planetGradient.addColorStop(0.76, progress > 0.72 ? '#343039' : '#512830')
    planetGradient.addColorStop(1, '#170f19')
    ctx.fillStyle = planetGradient
    ctx.beginPath()
    ctx.arc(planetX, planetY, planetRadius, 0, Math.PI * 2)
    ctx.fill()

    ctx.save()
    ctx.beginPath()
    ctx.arc(planetX, planetY, planetRadius * 0.995, 0, Math.PI * 2)
    ctx.clip()
    for (let craterIndex = 0; craterIndex < 15; craterIndex += 1) {
      const craterX = planetX + Math.sin(craterIndex * 4.7) * planetRadius * 0.78
      const craterY = planetY + Math.cos(craterIndex * 2.83) * planetRadius * 0.73
      const craterRadius = planetRadius * (0.035 + (craterIndex % 3) * 0.018)
      ctx.fillStyle = craterIndex % 2 ? 'rgba(44, 22, 27, 0.35)' : 'rgba(255, 178, 93, 0.22)'
      ctx.beginPath()
      ctx.arc(craterX, craterY, craterRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    const impactPhase = reducedMotion ? 0.42 : (time * 0.2 + progress * 0.72) % 1
    const impactX = planetX - planetRadius * 0.28
    const impactY = planetY - planetRadius * 0.2
    ctx.beginPath()
    ctx.arc(impactX, impactY, planetRadius * (0.04 + impactPhase * 0.34), 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(255, 215, 145, ${(1 - impactPhase) * 0.68})`
    ctx.lineWidth = Math.max(1, planetRadius * 0.018 * (1 - impactPhase * 0.5))
    ctx.shadowColor = '#ffb467'
    ctx.shadowBlur = 16
    ctx.stroke()
    ctx.shadowBlur = 0

    const fissureShift = reducedMotion ? 0 : Math.sin(time * 0.55) * 5
    for (let fissureIndex = 0; fissureIndex < 7; fissureIndex += 1) {
      const startX = planetX - planetRadius + fissureIndex * planetRadius * 0.32
      const startY = planetY + planetRadius * 0.3
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.bezierCurveTo(startX + 18, startY + 28, startX - 12 + fissureShift, startY + 58, startX + 21, startY + planetRadius)
      const fissureAlpha = 0.82 - progress * 0.48
      ctx.strokeStyle = fissureIndex % 2 ? `rgba(255, 119, 52, ${fissureAlpha})` : `rgba(255, 191, 102, ${fissureAlpha})`
      ctx.lineWidth = 1.2 + (fissureIndex % 3) * 0.6
      ctx.shadowColor = '#f56338'
      ctx.shadowBlur = 12
      ctx.stroke()
    }
    ctx.restore()

    drawMountainRange(ctx, width, height, height * 0.76, [[0.0, 0.73], [0.11, 0.64], [0.2, 0.7], [0.34, 0.59], [0.45, 0.68], [0.57, 0.61], [0.72, 0.7], [0.84, 0.58], [1, 0.71]], '#180f16')
    const ground = ctx.createLinearGradient(0, height * 0.7, 0, height)
    ground.addColorStop(0, '#3b1a1a')
    ground.addColorStop(0.35, '#21141a')
    ground.addColorStop(1, '#090d13')
    ctx.fillStyle = ground
    ctx.beginPath()
    ctx.moveTo(0, height * 0.77)
    ctx.bezierCurveTo(width * 0.27, height * 0.69, width * 0.39, height * 0.86, width * 0.62, height * 0.75)
    ctx.bezierCurveTo(width * 0.78, height * 0.68, width * 0.88, height * 0.76, width, height * 0.7)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

    ctx.save()
    ctx.lineCap = 'round'
    for (let riverIndex = 0; riverIndex < 4; riverIndex += 1) {
      const originX = width * (0.24 + riverIndex * 0.22)
      ctx.beginPath()
      ctx.moveTo(originX, height * 0.76)
      ctx.bezierCurveTo(originX - 28, height * 0.84, originX + 45, height * 0.89, originX + 6, height)
      const riverAlpha = 0.78 - progress * 0.5
      ctx.strokeStyle = riverIndex % 2 ? `rgba(255, 106, 46, ${riverAlpha})` : `rgba(255, 191, 94, ${riverAlpha})`
      ctx.lineWidth = 2 + riverIndex % 3
      ctx.shadowColor = '#ff5f32'
      ctx.shadowBlur = 13
      ctx.stroke()
    }
    ctx.restore()

    if (!reducedMotion) {
      const meteorProgress = (time * 0.12 + progress * 0.55) % 1
      ctx.save()
      ctx.globalAlpha = 0.7 * (1 - meteorProgress)
      ctx.strokeStyle = '#ffd39a'
      ctx.lineWidth = 1.3
      ctx.shadowColor = '#ffb05c'
      ctx.shadowBlur = 11
      ctx.beginPath()
      ctx.moveTo(width * (0.13 + meteorProgress * 0.2), height * (0.16 + meteorProgress * 0.13))
      ctx.lineTo(width * (0.21 + meteorProgress * 0.2), height * (0.21 + meteorProgress * 0.13))
      ctx.stroke()
      ctx.restore()
    }

    for (let ember = 0; ember < 22; ember += 1) {
      const drift = reducedMotion ? 0 : Math.sin(time * 0.8 + ember * 1.7) * width * 0.018
      const phase = reducedMotion ? 0.48 : (time * 0.07 + ember * 0.047) % 1
      const emberX = width * (0.08 + ((ember * 53) % 83) / 100) + drift
      const emberY = height * (0.9 - phase * 0.43)
      ctx.beginPath()
      ctx.arc(emberX, emberY, 1 + (ember % 3) * 0.65, 0, Math.PI * 2)
      const emberOpacity = Math.sin(phase * Math.PI) * 0.72 * (1 - progress * 0.65)
      ctx.fillStyle = `rgba(255, ${126 + (ember % 4) * 22}, 75, ${emberOpacity})`
      ctx.shadowColor = '#ff6d38'
      ctx.shadowBlur = 8
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }

  const drawKelp = (ctx, x, floor, length, sway, time, color) => {
    const bend = reducedMotion ? 0 : Math.sin(time * 0.8 + sway) * 12
    ctx.save()
    ctx.strokeStyle = color
    ctx.lineWidth = 2.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, floor)
    ctx.bezierCurveTo(x + bend * 0.4, floor - length * 0.34, x - bend, floor - length * 0.7, x + bend * 0.5, floor - length)
    ctx.stroke()
    for (let leafIndex = 0; leafIndex < 6; leafIndex += 1) {
      const leafY = floor - length * (0.2 + leafIndex * 0.12)
      const direction = leafIndex % 2 ? 1 : -1
      const leafX = x + bend * ((floor - leafY) / length)
      ctx.beginPath()
      ctx.moveTo(leafX, leafY)
      ctx.quadraticCurveTo(leafX + direction * 13, leafY - 2, leafX + direction * 24 + bend * 0.3, leafY - 12)
      ctx.quadraticCurveTo(leafX + direction * 10, leafY + 1, leafX, leafY)
      ctx.fillStyle = color
      ctx.fill()
    }
    ctx.restore()
  }

  const drawAnomalocaris = (ctx, centerX, centerY, size, time) => {
    const bob = reducedMotion ? 0 : Math.sin(time * 1.4) * size * 0.035
    ctx.save()
    ctx.translate(centerX, centerY + bob)

    ctx.fillStyle = 'rgba(245, 167, 89, 0.2)'
    ctx.beginPath()
    ctx.ellipse(0, 0, size * 0.58, size * 0.29, 0, 0, Math.PI * 2)
    ctx.fill()

    for (let lobeIndex = 0; lobeIndex < 7; lobeIndex += 1) {
      const lobeX = -size * 0.38 + lobeIndex * size * 0.105
      const lobeAngle = reducedMotion ? 0 : Math.sin(time * 2.2 + lobeIndex * 0.75) * 0.08
      ctx.save()
      ctx.translate(lobeX, 0)
      ctx.rotate(lobeAngle)
      ctx.fillStyle = lobeIndex % 2 ? '#b66b47' : '#d18a57'
      ctx.beginPath()
      ctx.ellipse(0, -size * 0.16, size * 0.075, size * 0.16, -0.28, 0, Math.PI * 2)
      ctx.ellipse(0, size * 0.16, size * 0.075, size * 0.16, 0.28, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }

    ctx.fillStyle = '#c47a4e'
    ctx.beginPath()
    ctx.ellipse(-size * 0.03, 0, size * 0.49, size * 0.19, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#edb171'
    ctx.beginPath()
    ctx.ellipse(size * 0.39, -size * 0.015, size * 0.12, size * 0.105, 0, 0, Math.PI * 2)
    ctx.fill()

    for (let eyeIndex = 0; eyeIndex < 2; eyeIndex += 1) {
      const eyeY = eyeIndex ? -size * 0.105 : size * 0.105
      ctx.fillStyle = '#172c31'
      ctx.beginPath()
      ctx.arc(size * 0.35, eyeY, size * 0.045, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#a9d2c1'
      ctx.beginPath()
      ctx.arc(size * 0.36, eyeY - size * 0.012, size * 0.012, 0, Math.PI * 2)
      ctx.fill()
    }

    for (let appendage = 0; appendage < 2; appendage += 1) {
      const direction = appendage ? -1 : 1
      const wave = reducedMotion ? 0 : Math.sin(time * 1.7 + appendage) * size * 0.045
      ctx.beginPath()
      ctx.moveTo(size * 0.44, direction * size * 0.04)
      ctx.bezierCurveTo(size * 0.67, direction * size * 0.02 + wave, size * 0.75, direction * size * 0.18 + wave, size * 0.61, direction * size * 0.31 + wave)
      ctx.strokeStyle = '#d9965c'
      ctx.lineWidth = size * 0.038
      ctx.lineCap = 'round'
      ctx.stroke()
      for (let claw = 0; claw < 3; claw += 1) {
        ctx.beginPath()
        ctx.arc(size * (0.52 + claw * 0.06), direction * size * (0.16 + claw * 0.045) + wave, size * 0.018, 0, Math.PI * 2)
        ctx.fillStyle = '#eab46e'
        ctx.fill()
      }
    }
    ctx.restore()
  }

  const drawTrilobite = (ctx, centerX, centerY, size, time, phase) => {
    const drift = reducedMotion ? 0 : Math.sin(time * 0.42 + phase) * size * 0.25
    const bob = reducedMotion ? 0 : Math.sin(time * 1.1 + phase) * size * 0.035
    ctx.save()
    ctx.translate(centerX + drift, centerY + bob)
    ctx.fillStyle = 'rgba(10, 30, 37, 0.38)'
    ctx.beginPath()
    ctx.ellipse(0, size * 0.08, size * 0.61, size * 0.26, 0, 0, Math.PI * 2)
    ctx.fill()

    const shell = ctx.createLinearGradient(0, -size * 0.28, 0, size * 0.28)
    shell.addColorStop(0, '#b4a274')
    shell.addColorStop(0.48, '#796d50')
    shell.addColorStop(1, '#4e5144')
    ctx.fillStyle = shell
    ctx.beginPath()
    ctx.ellipse(0, 0, size * 0.55, size * 0.27, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#d0bb83'
    ctx.beginPath()
    ctx.ellipse(-size * 0.34, 0, size * 0.19, size * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#71684f'
    ctx.beginPath()
    ctx.ellipse(size * 0.08, 0, size * 0.16, size * 0.17, 0, 0, Math.PI * 2)
    ctx.fill()

    for (let segment = 0; segment < 5; segment += 1) {
      const segmentX = size * (0.19 + segment * 0.065)
      ctx.beginPath()
      ctx.ellipse(segmentX, 0, size * 0.047, size * (0.2 - segment * 0.018), 0, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(34, 45, 43, 0.62)'
      ctx.lineWidth = Math.max(0.8, size * 0.018)
      ctx.stroke()
    }

    ctx.strokeStyle = 'rgba(203, 188, 144, 0.72)'
    ctx.lineWidth = Math.max(0.75, size * 0.018)
    for (let limb = 0; limb < 4; limb += 1) {
      const limbX = -size * 0.18 + limb * size * 0.16
      const flutter = reducedMotion ? 0 : Math.sin(time * 3 + phase + limb) * size * 0.025
      ctx.beginPath()
      ctx.moveTo(limbX, size * 0.12)
      ctx.lineTo(limbX - size * 0.035, size * 0.28 + flutter)
      ctx.moveTo(limbX, -size * 0.12)
      ctx.lineTo(limbX - size * 0.035, -size * 0.28 - flutter)
      ctx.stroke()
    }
    ctx.restore()
  }

  const drawPaleozoic = (ctx, width, height, time, progress) => {
    fillAtmosphere(ctx, width, height, '#062533', '#0a4a5a', '#101b27')
    const causticDrift = (reducedMotion ? 0 : Math.sin(time * 0.24) * width * 0.09) + (progress - 0.5) * width * 0.12
    const causticX = width * 0.62 + causticDrift
    const caustic = ctx.createRadialGradient(causticX, 0, 3, causticX, height * 0.2, height * 0.85)
    caustic.addColorStop(0, 'rgba(113, 230, 211, 0.3)')
    caustic.addColorStop(1, 'rgba(66, 190, 203, 0)')
    ctx.fillStyle = caustic
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.globalAlpha = reducedMotion ? 0.1 : 0.09 + (Math.sin(time * 0.65) + 1) * 0.035
    ctx.fillStyle = '#a3fff0'
    for (let ray = 0; ray < 5; ray += 1) {
      const raySway = reducedMotion ? 0 : Math.sin(time * 0.22 + ray) * width * 0.018
      const rayX = width * (0.12 + ray * 0.2) + raySway
      ctx.beginPath()
      ctx.moveTo(rayX, 0)
      ctx.lineTo(rayX + width * 0.06, 0)
      ctx.lineTo(rayX + width * 0.24, height * 0.64)
      ctx.lineTo(rayX + width * 0.13, height * 0.64)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    const seabedTop = height * (0.76 - progress * 0.13)
    const seabed = ctx.createLinearGradient(0, seabedTop, 0, height)
    seabed.addColorStop(0, 'rgba(42, 93, 83, 0)')
    seabed.addColorStop(0.22, '#193b3b')
    seabed.addColorStop(1, '#101822')
    ctx.fillStyle = seabed
    ctx.fillRect(0, seabedTop, width, height - seabedTop)

    for (let rock = 0; rock < 7; rock += 1) {
      const rockX = width * (rock * 0.17 - 0.04)
      const rockY = height * (0.89 + (rock % 3) * 0.03)
      ctx.fillStyle = rock % 2 ? '#244744' : '#31534a'
      ctx.beginPath()
      ctx.ellipse(rockX, rockY, width * (0.06 + (rock % 2) * 0.02), height * 0.06, -0.2 + rock * 0.08, Math.PI, Math.PI * 2)
      ctx.fill()
    }

    const kelpCount = 9 - Math.round(progress * 4)
    for (let plant = 0; plant < kelpCount; plant += 1) {
      const plantX = width * (0.04 + plant * 0.12)
      const plantLength = height * (0.2 + (plant % 4) * 0.055)
      drawKelp(ctx, plantX, height * (0.91 - progress * 0.1), plantLength, plant * 0.7 + progress * 2, time, plant % 2 ? '#518775' : '#74a16f')
    }

    const oceanScale = Math.min(width, height)
    drawTrilobite(ctx, width * (0.18 + progress * 0.17), height * 0.57, oceanScale * 0.12, time, 0.7 + progress * 3)
    drawTrilobite(ctx, width * (0.82 - progress * 0.14), height * 0.39, oceanScale * 0.095, time, 2.1 + progress * 2)
    drawAnomalocaris(ctx, width * (0.32 + progress * 0.38 + (reducedMotion ? 0 : Math.sin(time * 0.35) * 0.025)), height * (0.53 - progress * 0.07), oceanScale * 0.34, time + progress * 3)

    if (progress > 0.42) {
      const shoreline = smoothstep(clamp((progress - 0.42) / 0.58, 0, 1))
      const shoreX = width * (0.84 - shoreline * 0.2)
      ctx.save()
      ctx.globalAlpha = shoreline * 0.94
      const land = ctx.createLinearGradient(shoreX, height * 0.55, width, height)
      land.addColorStop(0, '#6b8050')
      land.addColorStop(0.35, '#405c40')
      land.addColorStop(1, '#1a302d')
      ctx.fillStyle = land
      ctx.beginPath()
      ctx.moveTo(shoreX, height * (0.77 - shoreline * 0.1))
      ctx.bezierCurveTo(width * 0.9, height * 0.67, width * 0.94, height * 0.73, width, height * 0.64)
      ctx.lineTo(width, height)
      ctx.lineTo(shoreX, height)
      ctx.closePath()
      ctx.fill()
      for (let plant = 0; plant < Math.round(shoreline * 5); plant += 1) {
        const plantX = width * (0.84 + plant * 0.033)
        const plantHeight = height * (0.12 + (plant % 3) * 0.04)
        drawTree(ctx, plantX, height * (0.79 - shoreline * 0.08), plantHeight, plant % 2 ? '#294736' : '#426b4c', Math.sin(plant + progress) * 3)
      }
      ctx.restore()
    }

    for (let bubble = 0; bubble < 24; bubble += 1) {
      const rise = reducedMotion ? 0 : (time * (9 + bubble % 7) + bubble * 37) % (height * 0.86)
      const bubbleX = ((bubble * 89.3) % 991) / 991 * width
      const bubbleY = height - rise
      const bubbleRadius = 1.2 + (bubble % 4) * 0.7
      ctx.strokeStyle = 'rgba(183, 239, 222, 0.34)'
      ctx.lineWidth = 0.8
      ctx.beginPath()
      ctx.arc(bubbleX, bubbleY, bubbleRadius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  const drawTree = (ctx, x, ground, scale, color, lean = 0) => {
    ctx.save()
    ctx.translate(x, ground)
    ctx.fillStyle = '#17251c'
    ctx.fillRect(-scale * 0.025, -scale * 0.7, scale * 0.05, scale * 0.72)
    ctx.fillStyle = color
    for (let tier = 0; tier < 4; tier += 1) {
      const tierY = -scale * (0.2 + tier * 0.16)
      const tierWidth = scale * (0.28 - tier * 0.035)
      ctx.beginPath()
      ctx.moveTo(lean * tier, tierY - scale * 0.23)
      ctx.quadraticCurveTo(tierWidth + lean * tier, tierY - scale * 0.02, tierWidth * 0.8, tierY + scale * 0.035)
      ctx.lineTo(-tierWidth * 0.8, tierY + scale * 0.035)
      ctx.quadraticCurveTo(-tierWidth + lean * tier, tierY - scale * 0.02, lean * tier, tierY - scale * 0.23)
      ctx.fill()
    }
    ctx.restore()
  }

  const drawSauropod = (ctx, x, ground, size, time) => {
    const stride = reducedMotion ? 0 : Math.sin(time * 3.2) * size * 0.045
    ctx.save()
    ctx.translate(x, ground)
    const bodyGradient = ctx.createLinearGradient(0, -size * 0.72, 0, size * 0.18)
    bodyGradient.addColorStop(0, '#a6a47c')
    bodyGradient.addColorStop(0.42, '#78815d')
    bodyGradient.addColorStop(1, '#34412f')

    ctx.fillStyle = 'rgba(7, 13, 8, 0.5)'
    ctx.beginPath()
    ctx.ellipse(-size * 0.05, size * 0.12, size * 0.57, size * 0.09, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = bodyGradient

    ctx.beginPath()
    ctx.moveTo(-size * 0.31, -size * 0.24)
    ctx.quadraticCurveTo(-size * 0.72, -size * 0.16, -size * 0.98, -size * 0.28)
    ctx.quadraticCurveTo(-size * 0.75, -size * 0.02, -size * 0.31, size * 0.03)
    ctx.quadraticCurveTo(-size * 0.17, 0, -size * 0.16, -size * 0.1)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(202, 203, 155, 0.28)'
    ctx.lineWidth = size * 0.012
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(size * 0.14, -size * 0.2)
    ctx.quadraticCurveTo(size * 0.18, -size * 0.48, size * 0.32, -size * 0.76)
    ctx.lineTo(size * 0.41, -size * 0.75)
    ctx.quadraticCurveTo(size * 0.31, -size * 0.4, size * 0.39, -size * 0.2)
    ctx.quadraticCurveTo(size * 0.43, -size * 0.15, size * 0.52, -size * 0.18)
    ctx.quadraticCurveTo(size * 0.58, -size * 0.2, size * 0.55, -size * 0.13)
    ctx.quadraticCurveTo(size * 0.46, -size * 0.05, size * 0.34, -size * 0.11)
    ctx.closePath()
    ctx.fillStyle = bodyGradient
    ctx.fill()
    ctx.strokeStyle = 'rgba(202, 203, 155, 0.28)'
    ctx.stroke()

    ctx.beginPath()
    ctx.ellipse(-size * 0.08, -size * 0.15, size * 0.39, size * 0.2, 0, 0, Math.PI * 2)
    ctx.fillStyle = bodyGradient
    ctx.fill()
    ctx.strokeStyle = 'rgba(202, 203, 155, 0.28)'
    ctx.stroke()

    ctx.save()
    ctx.beginPath()
    ctx.ellipse(-size * 0.08, -size * 0.15, size * 0.38, size * 0.19, 0, 0, Math.PI * 2)
    ctx.clip()
    for (let row = 0; row < 3; row += 1) {
      for (let scale = 0; scale < 7; scale += 1) {
        const scaleX = -size * 0.39 + scale * size * 0.095
        const scaleY = -size * 0.28 + row * size * 0.085 + (scale % 2) * size * 0.025
        ctx.fillStyle = row === 0 ? 'rgba(222, 213, 159, 0.18)' : 'rgba(29, 42, 28, 0.16)'
        ctx.beginPath()
        ctx.ellipse(scaleX, scaleY, size * 0.025, size * 0.018, -0.2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()

    ctx.fillStyle = bodyGradient
    ctx.beginPath()
    ctx.moveTo(-size * 0.26, -size * 0.06)
    ctx.lineTo(-size * 0.28 + stride, size * 0.2)
    ctx.lineTo(-size * 0.32 + stride, size * 0.42)
    ctx.lineTo(-size * 0.2 + stride, size * 0.42)
    ctx.lineTo(-size * 0.1, size * 0.1)
    ctx.lineTo(size * 0.05, size * 0.09)
    ctx.lineTo(size * 0.02 - stride, size * 0.27)
    ctx.lineTo(size * 0.04 - stride, size * 0.42)
    ctx.lineTo(size * 0.16 - stride, size * 0.42)
    ctx.lineTo(size * 0.19, size * 0.03)
    ctx.lineTo(size * 0.27, -size * 0.08)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = 'rgba(204, 204, 158, 0.28)'
    ctx.lineWidth = size * 0.008
    ctx.stroke()

    ctx.fillStyle = '#202a20'
    ctx.beginPath()
    ctx.arc(size * 0.465, -size * 0.18, size * 0.018, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#eee0b0'
    ctx.beginPath()
    ctx.arc(size * 0.47, -size * 0.187, size * 0.006, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#273225'
    ctx.beginPath()
    ctx.arc(size * 0.545, -size * 0.16, size * 0.009, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = 'rgba(41, 49, 34, 0.48)'
    ctx.lineWidth = size * 0.008
    ctx.beginPath()
    ctx.moveTo(size * 0.42, -size * 0.1)
    ctx.quadraticCurveTo(size * 0.49, -size * 0.08, size * 0.55, -size * 0.12)
    ctx.stroke()
    ctx.restore()
  }

  const drawPterosaur = (ctx, x, y, scale, flap) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.beginPath()
    ctx.moveTo(-18, 0)
    ctx.quadraticCurveTo(-7, -3 - flap, 0, 0)
    ctx.quadraticCurveTo(8, -3 - flap, 19, 0)
    ctx.quadraticCurveTo(8, -2, 0, 2)
    ctx.quadraticCurveTo(-8, -2, -18, 0)
    ctx.fillStyle = '#101b19'
    ctx.fill()
    ctx.restore()
  }

  const drawDinosaurEggClutch = (ctx, centerX, groundY, size, time) => {
    const bob = reducedMotion ? 0 : Math.sin(time * 0.7) * size * 0.006
    const eggs = [
      { x: -0.43, y: 0.01, rotation: -0.18, shade: '#c6ad77' },
      { x: -0.22, y: -0.13, rotation: 0.1, shade: '#d3bd88' },
      { x: 0.02, y: -0.04, rotation: -0.1, shade: '#c5aa72' },
      { x: 0.27, y: -0.14, rotation: 0.16, shade: '#d8c28f' },
      { x: 0.45, y: 0.03, rotation: -0.12, shade: '#c4a970' },
      { x: -0.19, y: 0.12, rotation: 0.2, shade: '#cbb47e' },
      { x: 0.18, y: 0.12, rotation: -0.18, shade: '#d4bd87' },
    ]

    ctx.save()
    ctx.translate(centerX, groundY + bob)
    ctx.fillStyle = 'rgba(4, 10, 7, 0.48)'
    ctx.beginPath()
    ctx.ellipse(0, size * 0.08, size * 0.69, size * 0.24, 0, 0, Math.PI * 2)
    ctx.fill()

    eggs.forEach((egg, index) => {
      const eggWidth = size * (index % 3 === 0 ? 0.34 : 0.32)
      const eggHeight = size * 0.2
      const x = egg.x * size
      const y = egg.y * size
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(egg.rotation)

      const eggGradient = ctx.createLinearGradient(-eggWidth * 0.4, -eggHeight, eggWidth * 0.5, eggHeight)
      eggGradient.addColorStop(0, '#ead9ad')
      eggGradient.addColorStop(0.42, egg.shade)
      eggGradient.addColorStop(1, '#756b4f')
      ctx.beginPath()
      ctx.moveTo(-eggWidth * 0.5, 0)
      ctx.bezierCurveTo(-eggWidth * 0.48, -eggHeight * 0.68, -eggWidth * 0.17, -eggHeight, 0, -eggHeight * 0.92)
      ctx.bezierCurveTo(eggWidth * 0.31, -eggHeight * 0.8, eggWidth * 0.51, -eggHeight * 0.35, eggWidth * 0.5, 0)
      ctx.bezierCurveTo(eggWidth * 0.49, eggHeight * 0.58, eggWidth * 0.19, eggHeight, 0, eggHeight * 0.9)
      ctx.bezierCurveTo(-eggWidth * 0.31, eggHeight * 0.78, -eggWidth * 0.51, eggHeight * 0.36, -eggWidth * 0.5, 0)
      ctx.closePath()
      ctx.fillStyle = eggGradient
      ctx.fill()
      ctx.strokeStyle = 'rgba(245, 228, 188, 0.36)'
      ctx.lineWidth = Math.max(1, size * 0.004)
      ctx.stroke()

      ctx.save()
      ctx.clip()
      ctx.fillStyle = 'rgba(91, 75, 49, 0.36)'
      for (let spot = 0; spot < 7; spot += 1) {
        const spotX = Math.sin((spot + 1) * 8.13 + index) * eggWidth * 0.34
        const spotY = Math.cos((spot + 2) * 5.37 + index) * eggHeight * 0.58
        ctx.beginPath()
        ctx.ellipse(spotX, spotY, size * 0.008, size * 0.005, spot * 0.4, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(255, 241, 205, 0.48)'
      ctx.lineWidth = Math.max(1, size * 0.009)
      ctx.beginPath()
      ctx.ellipse(-eggWidth * 0.13, -eggHeight * 0.17, eggWidth * 0.2, eggHeight * 0.36, -0.25, Math.PI * 1.1, Math.PI * 1.8)
      ctx.stroke()
      ctx.restore()
      ctx.restore()
    })
    ctx.restore()
  }

  const drawMesozoic = (ctx, width, height, time, progress) => {
    fillAtmosphere(ctx, width, height, '#101b27', '#31443a', '#182017')
    const sunX = width * 0.69
    const sunY = height * 0.34
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 1, sunX, sunY, height * 0.45)
    const sunPulse = reducedMotion ? 0.4 : 0.34 + (Math.sin(time * 0.8) + 1) * 0.03
    sunGlow.addColorStop(0, `rgba(236, 189, 120, ${sunPulse})`)
    sunGlow.addColorStop(0.28, 'rgba(186, 146, 90, 0.12)')
    sunGlow.addColorStop(1, 'rgba(68, 83, 65, 0)')
    ctx.fillStyle = sunGlow
    ctx.fillRect(0, 0, width, height)

    drawMountainRange(ctx, width, height, height * 0.64, [[0, 0.52], [0.14, 0.31], [0.23, 0.46], [0.38, 0.25], [0.53, 0.49], [0.7, 0.34], [0.84, 0.48], [1, 0.29]], '#26352f')
    drawMountainRange(ctx, width, height, height * 0.72, [[0, 0.63], [0.14, 0.55], [0.26, 0.68], [0.43, 0.5], [0.59, 0.66], [0.76, 0.53], [0.88, 0.66], [1, 0.57]], '#1a2920')

    const forestGlow = ctx.createLinearGradient(0, height * 0.5, 0, height)
    forestGlow.addColorStop(0, 'rgba(94, 127, 73, 0)')
    forestGlow.addColorStop(0.3, 'rgba(74, 103, 58, 0.18)')
    forestGlow.addColorStop(1, 'rgba(9, 18, 13, 0.35)')
    ctx.fillStyle = forestGlow
    ctx.fillRect(0, height * 0.5, width, height * 0.5)

    for (let tree = 0; tree < 15; tree += 1) {
      const treeX = width * (tree / 14)
      const scale = height * (0.17 + (tree % 5) * 0.035)
      const canopySway = reducedMotion ? 0 : Math.sin(time * 0.48 + tree * 0.72) * 6
      drawTree(ctx, treeX, height * (0.78 + (tree % 3) * 0.025), scale, tree % 2 ? '#243c2b' : '#304a30', Math.sin(tree) * 4 + canopySway)
    }

    const dinosaurSize = Math.min(width, height)
    ctx.save()
    ctx.globalAlpha = 0.72
    drawSauropod(ctx, width * 0.17, height * 0.68, dinosaurSize * 0.19, time + progress * 4)
    ctx.restore()
    drawSauropod(
      ctx,
      width * (0.69 + (reducedMotion ? 0 : Math.sin(time * 0.26) * 0.015)) + progress * width * 0.025,
      height * 0.64,
      dinosaurSize * 0.34,
      time + progress * 6,
    )
    drawDinosaurEggClutch(ctx, width * 0.37 + progress * width * 0.025, height * 0.79, dinosaurSize * 0.31, time)

    ctx.fillStyle = 'rgba(216, 196, 151, 0.1)'
    for (let mote = 0; mote < 18; mote += 1) {
      const rise = reducedMotion ? 0 : (time * (3 + mote % 4) + mote * 19) % height
      ctx.beginPath()
      ctx.arc(((mote * 73) % 997) / 997 * width, height - rise, 1.2 + mote % 3, 0, Math.PI * 2)
      ctx.fill()
    }

    const extinction = smoothstep(clamp((progress - 0.78) / 0.22, 0, 1))
    if (extinction > 0) {
      ctx.fillStyle = `rgba(10, 13, 20, ${extinction * 0.62})`
      ctx.fillRect(0, 0, width, height)
      if (!reducedMotion) {
        const impactProgress = clamp((progress - 0.84) / 0.16, 0, 1)
        const impactX = width * (0.84 - impactProgress * 0.2)
        const impactY = height * (0.12 + impactProgress * 0.18)
        ctx.save()
        ctx.globalAlpha = extinction
        ctx.strokeStyle = 'rgba(255, 199, 135, 0.78)'
        ctx.lineWidth = 2
        ctx.shadowColor = '#ff9e62'
        ctx.shadowBlur = 18
        ctx.beginPath()
        ctx.moveTo(impactX - width * 0.12, impactY - height * 0.08)
        ctx.lineTo(impactX, impactY)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(impactX, impactY, impactProgress * Math.min(width, height) * 0.16, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(255, 190, 131, ${1 - impactProgress})`
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  const drawModernEarth = (ctx, width, height, time, progress) => {
    fillAtmosphere(ctx, width, height, '#050b15', '#0b1a29', '#080d16')
    drawStars(ctx, width, height, time, 0.9)

    const centerX = width * 0.67
    const centerY = height * 0.53
    const radius = Math.min(width * 0.42, height * 0.34)
    const halo = ctx.createRadialGradient(centerX, centerY, radius * 0.72, centerX, centerY, radius * 1.75)
    halo.addColorStop(0, 'rgba(54, 190, 232, 0.2)')
    halo.addColorStop(1, 'rgba(29, 112, 173, 0)')
    ctx.fillStyle = halo
    ctx.fillRect(0, 0, width, height)

    ctx.save()
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.clip()
    if (earthTexture.complete && earthTexture.naturalWidth > 0) {
      const drift = reducedMotion ? 0 : Math.sin(time * 0.14) * radius * 0.035
      ctx.save()
      ctx.translate(centerX + drift, centerY)
      ctx.rotate(reducedMotion ? 0 : time * 0.035 + progress * Math.PI * 0.72)
      ctx.drawImage(earthTexture, -radius, -radius, radius * 2, radius * 2)
      ctx.restore()
    } else {
      const ocean = ctx.createRadialGradient(centerX - radius * 0.42, centerY - radius * 0.44, radius * 0.05, centerX, centerY, radius * 1.4)
      ocean.addColorStop(0, '#6dc1cc')
      ocean.addColorStop(0.4, '#267c9a')
      ocean.addColorStop(1, '#071b31')
      ctx.fillStyle = ocean
      ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2)
      ctx.fillStyle = '#779d68'
      ctx.beginPath()
      ctx.ellipse(centerX - radius * 0.18, centerY - radius * 0.06, radius * 0.35, radius * 0.54, -0.38, 0, Math.PI * 2)
      ctx.ellipse(centerX + radius * 0.45, centerY - radius * 0.32, radius * 0.29, radius * 0.2, 0.2, 0, Math.PI * 2)
      ctx.fill()
    }

    const shade = ctx.createRadialGradient(centerX - radius * 0.38, centerY - radius * 0.4, radius * 0.12, centerX, centerY, radius * 1.18)
    shade.addColorStop(0, 'rgba(255,255,255,0.12)')
    shade.addColorStop(0.58, 'rgba(4,12,24,0.04)')
    shade.addColorStop(1, 'rgba(1,6,18,0.66)')
    ctx.fillStyle = shade
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2)

    ctx.save()
    ctx.globalAlpha = 0.42
    ctx.strokeStyle = '#e3f7f1'
    ctx.lineWidth = Math.max(2, radius * 0.035)
    for (let cloud = 0; cloud < 4; cloud += 1) {
      const cloudY = centerY - radius * 0.56 + cloud * radius * 0.37
      const cloudDrift = reducedMotion ? 0 : Math.sin(time * 0.38 + cloud * 1.8) * radius * 0.2 + progress * radius * 0.16
      ctx.beginPath()
      ctx.ellipse(centerX + cloudDrift, cloudY, radius * (0.75 - cloud * 0.06), radius * 0.085, -0.23, Math.PI * 1.05, Math.PI * 1.92)
      ctx.stroke()
    }
    ctx.restore()
    ctx.restore()

    ctx.strokeStyle = 'rgba(142, 224, 245, 0.6)'
    ctx.lineWidth = 1.3
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius + 2, -Math.PI * 0.28, Math.PI * 0.73)
    ctx.stroke()

    const orbitAngle = reducedMotion ? -0.82 : time * 0.19 + progress * Math.PI * 1.4 - 0.82
    const satelliteX = centerX + Math.cos(orbitAngle) * radius * 1.43
    const satelliteY = centerY + Math.sin(orbitAngle) * radius * 1.1
    ctx.save()
    ctx.strokeStyle = 'rgba(158, 213, 226, 0.15)'
    ctx.lineWidth = 0.8
    ctx.beginPath()
    ctx.ellipse(centerX, centerY, radius * 1.43, radius * 1.1, 0, 0, Math.PI * 2)
    ctx.stroke()
    ctx.translate(satelliteX, satelliteY)
    ctx.rotate(orbitAngle + Math.PI * 0.5)
    ctx.fillStyle = '#d6e6de'
    ctx.fillRect(-3, -2, 6, 4)
    ctx.fillStyle = '#66fcf1'
    ctx.fillRect(-8, -1.2, 4, 2.4)
    ctx.fillRect(4, -1.2, 4, 2.4)
    ctx.restore()
  }

  const drawFrame = (time) => {
    if (!canvasWidth || !canvasHeight) return
    context.setTransform(canvas.width / canvasWidth, 0, 0, canvas.height / canvasHeight, 0, 0)
    context.globalAlpha = 1
    context.fillStyle = '#080c13'
    context.fillRect(0, 0, canvasWidth, canvasHeight)

    const sectionPhase = clamp(sceneState.progress * steps.length, 0, steps.length)
    const sectionIndex = Math.min(steps.length - 1, Math.floor(sectionPhase))
    const sectionFraction = sectionPhase >= steps.length ? 1 : sectionPhase - sectionIndex
    const transition = smoothstep(clamp((sectionFraction - 0.72) / 0.28, 0, 1))
    scenePosition = Math.min(steps.length - 1, sectionIndex + transition)
    stage.dataset.sceneProgress = scenePosition.toFixed(3)

    const currentScene = Math.floor(scenePosition)
    const sceneFraction = scenePosition - currentScene
    const nextScene = Math.min(steps.length - 1, currentScene + 1)
    const sceneDrawers = [drawHadean, drawPaleozoic, drawMesozoic, drawModernEarth]
    const currentWeight = nextScene === currentScene ? 1 : 1 - sceneFraction

    context.save()
    context.globalAlpha = currentWeight
    const currentProgress = reducedMotion ? 0 : clamp(sectionFraction, 0, 1)
    sceneDrawers[currentScene](context, canvasWidth, canvasHeight, reducedMotion ? 0 : time, currentProgress)
    context.restore()

    if (nextScene !== currentScene && sceneFraction > 0) {
      context.save()
      context.globalAlpha = sceneFraction
      sceneDrawers[nextScene](context, canvasWidth, canvasHeight, reducedMotion ? 0 : time, 0)
      context.restore()
    }
  }

  const updateProgress = (progress) => {
    const value = clamp(progress, 0, 1)
    if (hasGsap && progressFill) {
      gsap.set(progressFill, { scaleY: value, transformOrigin: 'top' })
    } else if (progressFill) {
      progressFill.style.transform = `scaleY(${value})`
    }
  }

  const activateStep = (step, index) => {
    steps.forEach((item, itemIndex) => {
      const active = itemIndex === index
      item.classList.toggle('active', active)
      if (active) item.setAttribute('aria-current', 'step')
      else item.removeAttribute('aria-current')
    })

    progressStops.forEach((stop, stopIndex) => {
      const active = stopIndex === index
      stop.classList.toggle('is-active', active)
      if (active) stop.setAttribute('aria-current', 'step')
      else stop.removeAttribute('aria-current')
    })

    stage.dataset.era = step.dataset.era
    canvas.setAttribute('aria-label', `Animated scene: ${step.dataset.label.toLowerCase()} Earth`)
    if (badge) badge.textContent = step.dataset.period
    if (eraName) eraName.textContent = step.dataset.label
    if (visualCredit) visualCredit.textContent = step.dataset.credit
    if (chapterCount) chapterCount.innerHTML = `${String(index + 1).padStart(2, '0')} <i></i> 04`
  }

  const updateWithoutGsap = () => {
    const bounds = storyTrack.getBoundingClientRect()
    const travel = Math.max(1, storyTrack.offsetHeight - window.innerHeight)
    const progress = clamp(-bounds.top / travel, 0, 1)
    sceneState.progress = progress
    updateProgress(progress)

    const midpoint = window.innerHeight * 0.5
    const activeIndex = steps.findIndex((step) => {
      const rect = step.getBoundingClientRect()
      return rect.top <= midpoint && rect.bottom > midpoint
    })
    if (activeIndex >= 0) activateStep(steps[activeIndex], activeIndex)
  }

  const initializeScroll = () => {
    if (hasGsap) {
      gsapContext = gsap.context(() => {
        steps.forEach((step, index) => {
          ScrollTrigger.create({
            trigger: step,
            start: 'top 50%',
            end: 'bottom 50%',
            onEnter: () => activateStep(step, index),
            onEnterBack: () => activateStep(step, index),
          })
        })

        gsap.to(sceneState, {
          progress: 1,
          ease: 'none',
          onUpdate: () => {
            if (stageVisible) drawFrame(performance.now() / 1000)
          },
          scrollTrigger: {
            trigger: storyTrack,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1.2,
            invalidateOnRefresh: true,
            onUpdate: (self) => updateProgress(self.progress),
          },
        })
      }, storyTrack)
      if (lenis) lenis.scrollTo(window.scrollY, { immediate: true, force: true })
      ScrollTrigger.refresh()
      ScrollTrigger.update()
    } else {
      window.addEventListener('scroll', updateWithoutGsap, { passive: true })
      updateWithoutGsap()
    }
  }

  const resizeAuxiliaryCanvases = () => {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6)
    const canvases = [
      [lifeCanvas, lifeContext, lifeMetrics],
      [ecosystemCanvas, ecosystemContext, ecosystemMetrics],
    ]

    canvases.forEach(([auxCanvas, auxContext, metrics]) => {
      if (!auxCanvas || !auxContext) return
      const bounds = auxCanvas.getBoundingClientRect()
      metrics.width = Math.max(1, bounds.width)
      metrics.height = Math.max(1, bounds.height)
      auxCanvas.width = Math.round(metrics.width * pixelRatio)
      auxCanvas.height = Math.round(metrics.height * pixelRatio)
      auxContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    })
  }

  const drawButterflyStage = (ctx, stageIndex, time, size) => {
    ctx.save()
    ctx.scale(size, size)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    if (stageIndex === 0) {
      const eggs = [
        { x: -0.15, y: 0.025, rotation: -0.12 },
        { x: 0, y: -0.015, rotation: 0.04 },
        { x: 0.15, y: 0.025, rotation: 0.14 },
      ]
      eggs.forEach((egg) => {
        ctx.save()
        ctx.translate(egg.x, egg.y)
        ctx.rotate(egg.rotation)
        ctx.beginPath()
        ctx.moveTo(0, -0.105)
        ctx.bezierCurveTo(0.04, -0.09, 0.057, -0.035, 0.052, 0.02)
        ctx.bezierCurveTo(0.047, 0.075, 0.022, 0.105, 0, 0.105)
        ctx.bezierCurveTo(-0.022, 0.105, -0.047, 0.075, -0.052, 0.02)
        ctx.bezierCurveTo(-0.057, -0.035, -0.04, -0.09, 0, -0.105)
        const eggGradient = ctx.createLinearGradient(-0.05, -0.04, 0.05, 0.04)
        eggGradient.addColorStop(0, '#fff1c9')
        eggGradient.addColorStop(0.5, '#e9d99e')
        eggGradient.addColorStop(1, '#b9a873')
        ctx.fillStyle = eggGradient
        ctx.fill()
        ctx.strokeStyle = 'rgba(255, 248, 217, 0.8)'
        ctx.lineWidth = 0.009
        ctx.stroke()

        ctx.save()
        ctx.clip()
        ctx.strokeStyle = 'rgba(145, 125, 82, 0.48)'
        ctx.lineWidth = 0.006
        for (let ridge = -2; ridge <= 2; ridge += 1) {
          ctx.beginPath()
          ctx.moveTo(ridge * 0.014, 0.1)
          ctx.quadraticCurveTo(ridge * 0.012, -0.005, 0, -0.1)
          ctx.stroke()
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.52)'
        ctx.beginPath()
        ctx.ellipse(-0.016, -0.055, 0.009, 0.026, -0.2, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
        ctx.restore()
      })
    } else if (stageIndex === 1) {
      const bodyColors = ['#a9bd69', '#90ad5d', '#779957', '#63884e', '#4f744b']
      for (let segment = 0; segment < bodyColors.length; segment += 1) {
        const segmentX = -0.4 + segment * 0.16
        const wave = reducedMotion ? 0 : Math.sin(time * 2.2 + segment * 0.75) * 0.025
        ctx.beginPath()
        ctx.ellipse(segmentX, wave, 0.105, 0.13, 0, 0, Math.PI * 2)
        ctx.fillStyle = bodyColors[segment]
        ctx.fill()
        ctx.fillStyle = '#e5d27e'
        ctx.beginPath()
        ctx.arc(segmentX, wave - 0.04, 0.022, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#6d7550'
        ctx.lineWidth = 0.018
        ctx.beginPath()
        ctx.moveTo(segmentX, wave + 0.09)
        ctx.lineTo(segmentX - 0.025, wave + 0.17)
        ctx.stroke()
      }
      ctx.fillStyle = '#546f46'
      ctx.beginPath()
      ctx.arc(0.38, -0.012, 0.11, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d9e5a7'
      ctx.beginPath()
      ctx.arc(0.42, -0.045, 0.018, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#81985c'
      ctx.lineWidth = 0.018
      ctx.beginPath()
      ctx.moveTo(0.4, -0.1)
      ctx.quadraticCurveTo(0.4, -0.23, 0.33, -0.27)
      ctx.moveTo(0.45, -0.1)
      ctx.quadraticCurveTo(0.52, -0.22, 0.54, -0.25)
      ctx.stroke()
    } else if (stageIndex === 2) {
      ctx.strokeStyle = '#8b9971'
      ctx.lineWidth = 0.045
      ctx.beginPath()
      ctx.moveTo(-0.7, -0.54)
      ctx.quadraticCurveTo(0, -0.48, 0.68, -0.6)
      ctx.stroke()
      ctx.strokeStyle = '#d7c49a'
      ctx.lineWidth = 0.018
      ctx.beginPath()
      ctx.moveTo(0.05, -0.53)
      ctx.lineTo(0.05, -0.32)
      ctx.stroke()
      ctx.fillStyle = '#7b9b69'
      ctx.beginPath()
      ctx.moveTo(0.05, -0.34)
      ctx.bezierCurveTo(0.34, -0.22, 0.25, 0.33, 0.04, 0.48)
      ctx.bezierCurveTo(-0.2, 0.25, -0.19, -0.22, 0.05, -0.34)
      ctx.fill()
      ctx.strokeStyle = 'rgba(224, 234, 184, 0.55)'
      ctx.lineWidth = 0.018
      ctx.beginPath()
      ctx.moveTo(0.04, -0.26)
      ctx.quadraticCurveTo(0.16, 0.03, 0.04, 0.4)
      ctx.stroke()
    } else {
      const wingBeat = reducedMotion ? 0 : Math.sin(time * 4.2) * 0.12
      ctx.translate(0, wingBeat)
      const wingColors = ['#d47a3f', '#e69a55', '#a84734', '#e4c27d']
      for (let wing = 0; wing < 4; wing += 1) {
        const isUpper = wing < 2
        const isRight = wing % 2 === 1
        ctx.save()
        ctx.translate(isRight ? 0.04 : -0.04, 0)
        ctx.scale(isRight ? 1 : -1, 1)
        ctx.beginPath()
        if (isUpper) {
          ctx.moveTo(0.02, 0)
          ctx.bezierCurveTo(0.16, -0.42, 0.68, -0.55, 0.61, -0.08)
          ctx.bezierCurveTo(0.54, 0.13, 0.28, 0.19, 0.02, 0.07)
        } else {
          ctx.moveTo(0.02, 0.03)
          ctx.bezierCurveTo(0.2, 0.03, 0.57, 0.17, 0.44, 0.43)
          ctx.bezierCurveTo(0.3, 0.64, 0.08, 0.43, 0.02, 0.12)
        }
        ctx.closePath()
        ctx.fillStyle = wingColors[wing]
        ctx.fill()
        ctx.strokeStyle = 'rgba(30, 32, 30, 0.66)'
        ctx.lineWidth = 0.025
        ctx.stroke()
        ctx.restore()
      }
      ctx.fillStyle = '#28282a'
      ctx.beginPath()
      ctx.ellipse(0, 0.06, 0.045, 0.34, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#e7d8b0'
      ctx.lineWidth = 0.018
      ctx.beginPath()
      ctx.moveTo(-0.015, -0.2)
      ctx.quadraticCurveTo(-0.11, -0.38, -0.16, -0.35)
      ctx.moveTo(0.015, -0.2)
      ctx.quadraticCurveTo(0.11, -0.38, 0.16, -0.35)
      ctx.stroke()
    }
    ctx.restore()
  }

  const drawFrogStage = (ctx, stageIndex, time, size) => {
    ctx.save()
    ctx.scale(size, size)
    const bodyColor = stageIndex === 3 ? '#789968' : '#88a66c'
    if (stageIndex === 0) {
      for (let egg = 0; egg < 13; egg += 1) {
        const angle = egg * 2.399
        const distance = 0.08 + (egg % 4) * 0.085
        const eggX = Math.cos(angle) * distance
        const eggY = Math.sin(angle) * distance
        ctx.fillStyle = 'rgba(220, 242, 220, 0.16)'
        ctx.beginPath()
        ctx.arc(eggX, eggY, 0.105, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#d3d19a'
        ctx.beginPath()
        ctx.arc(eggX, eggY, 0.046, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = 'rgba(129, 208, 210, 0.36)'
      ctx.lineWidth = 0.018
      ctx.beginPath()
      ctx.ellipse(0, 0.46, 0.86, 0.14, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else if (stageIndex === 1) {
      ctx.fillStyle = '#997a4c'
      ctx.beginPath()
      ctx.ellipse(-0.08, -0.06, 0.32, 0.2, 0.1, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#b39358'
      ctx.lineWidth = 0.075
      ctx.beginPath()
      ctx.moveTo(-0.3, -0.02)
      ctx.bezierCurveTo(-0.59, -0.3, -0.75, 0.12 + Math.sin(time * 2) * 0.04, -0.98, 0.06)
      ctx.stroke()
      ctx.fillStyle = '#e2d9a2'
      ctx.beginPath()
      ctx.arc(0.18, -0.1, 0.035, 0, Math.PI * 2)
      ctx.fill()
    } else {
      ctx.fillStyle = bodyColor
      ctx.beginPath()
      ctx.ellipse(0, 0.03, stageIndex === 2 ? 0.34 : 0.42, stageIndex === 2 ? 0.27 : 0.33, 0, 0, Math.PI * 2)
      ctx.fill()
      for (let eye = 0; eye < 2; eye += 1) {
        const eyeX = eye ? 0.22 : -0.22
        ctx.fillStyle = bodyColor
        ctx.beginPath()
        ctx.arc(eyeX, -0.24, 0.13, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#d7ddac'
        ctx.beginPath()
        ctx.arc(eyeX, -0.25, 0.075, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#172320'
        ctx.beginPath()
        ctx.arc(eyeX + 0.015, -0.25, 0.033, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.strokeStyle = '#66875f'
      ctx.lineWidth = 0.09
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-0.2, 0.15)
      ctx.lineTo(-0.52, 0.43)
      ctx.lineTo(-0.68, 0.36)
      ctx.moveTo(0.2, 0.15)
      ctx.lineTo(0.52, 0.43)
      ctx.lineTo(0.68, 0.36)
      ctx.moveTo(-0.1, 0.22)
      ctx.lineTo(-0.32, 0.54)
      ctx.lineTo(-0.5, 0.53)
      ctx.moveTo(0.1, 0.22)
      ctx.lineTo(0.32, 0.54)
      ctx.lineTo(0.5, 0.53)
      ctx.stroke()
      if (stageIndex === 2) {
        ctx.strokeStyle = 'rgba(188, 153, 91, 0.75)'
        ctx.lineWidth = 0.035
        ctx.beginPath()
        ctx.moveTo(-0.32, 0.02)
        ctx.quadraticCurveTo(-0.55, -0.12, -0.69, 0.0)
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  const drawBeeStage = (ctx, stageIndex, time, size) => {
    ctx.save()
    ctx.scale(size, size)
    ctx.strokeStyle = '#d4a943'
    ctx.lineCap = 'round'
    if (stageIndex === 0) {
      ctx.fillStyle = '#f1e2ad'
      ctx.beginPath()
      ctx.ellipse(0, 0, 0.12, 0.2, -0.25, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#ad965e'
      ctx.lineWidth = 0.025
      ctx.stroke()
    } else if (stageIndex === 1) {
      for (let segment = 0; segment < 5; segment += 1) {
        ctx.fillStyle = segment % 2 ? '#e8d6a1' : '#f5e8c5'
        ctx.beginPath()
        ctx.ellipse(-0.26 + segment * 0.13, 0.02 + Math.sin(segment * 0.7) * 0.07, 0.14, 0.11, 0.15, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#b49b66'
        ctx.lineWidth = 0.018
        ctx.stroke()
      }
      ctx.fillStyle = '#40392c'
      ctx.beginPath()
      ctx.arc(0.36, -0.07, 0.07, 0, Math.PI * 2)
      ctx.fill()
    } else {
      if (stageIndex === 2) {
        ctx.fillStyle = 'rgba(236, 204, 129, 0.2)'
        ctx.beginPath()
        ctx.roundRect(-0.3, -0.55, 0.6, 1.1, 0.28)
        ctx.fill()
        ctx.strokeStyle = '#d4a943'
        ctx.lineWidth = 0.035
        ctx.stroke()
        ctx.fillStyle = '#d6a83e'
        ctx.beginPath()
        ctx.ellipse(0, 0.05, 0.15, 0.32, 0, 0, Math.PI * 2)
        ctx.fill()
      } else {
        const wingFlutter = reducedMotion ? 0 : Math.sin(time * 12) * 0.06
        ctx.fillStyle = 'rgba(201, 225, 214, 0.72)'
        ctx.beginPath()
        ctx.ellipse(-0.12, -0.21, 0.14, 0.28, -0.55 - wingFlutter, 0, Math.PI * 2)
        ctx.ellipse(0.14, -0.21, 0.14, 0.28, 0.55 + wingFlutter, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#d4a943'
        ctx.lineWidth = 0.04
        ctx.beginPath()
        ctx.moveTo(-0.1, -0.04)
        ctx.lineTo(-0.2, -0.38)
        ctx.moveTo(0.1, -0.04)
        ctx.lineTo(0.2, -0.38)
        ctx.stroke()
        ctx.fillStyle = '#d9a63b'
        ctx.beginPath()
        ctx.ellipse(0, 0.1, 0.15, 0.28, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#322a20'
        for (const stripeY of [0.02, 0.16, 0.29]) {
          ctx.fillRect(-0.14, stripeY, 0.28, 0.045)
        }
        ctx.beginPath()
        ctx.arc(0, -0.22, 0.095, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = '#322a20'
        ctx.lineWidth = 0.022
        ctx.beginPath()
        ctx.moveTo(-0.035, -0.29)
        ctx.quadraticCurveTo(-0.12, -0.42, -0.17, -0.39)
        ctx.moveTo(0.035, -0.29)
        ctx.quadraticCurveTo(0.12, -0.42, 0.17, -0.39)
        ctx.stroke()
      }
    }
    ctx.restore()
  }

  const drawLifeCycle = (time) => {
    if (!lifeContext || !lifeMetrics.width || !lifeMetrics.height) return
    const width = lifeMetrics.width
    const height = lifeMetrics.height
    const ctx = lifeContext
    ctx.clearRect(0, 0, width, height)

    const backdrop = ctx.createRadialGradient(width * 0.54, height * 0.47, 2, width * 0.54, height * 0.47, height * 0.62)
    backdrop.addColorStop(0, 'rgba(78, 185, 165, 0.2)')
    backdrop.addColorStop(1, 'rgba(6, 15, 20, 0)')
    ctx.fillStyle = backdrop
    ctx.fillRect(0, 0, width, height)

    const centerX = width * 0.52
    const centerY = height * 0.5
    const orbitRadius = Math.min(width, height) * 0.31
    ctx.strokeStyle = 'rgba(181, 224, 204, 0.14)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 8])
    ctx.beginPath()
    ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])

    const speciesDrawer = selectedSpecies === 'butterfly' ? drawButterflyStage : selectedSpecies === 'frog' ? drawFrogStage : drawBeeStage
    const miniatureSize = Math.min(width, height) * 0.085
    for (let marker = 0; marker < 4; marker += 1) {
      const angle = -Math.PI * 0.5 + marker * Math.PI * 0.5
      const markerX = centerX + Math.cos(angle) * orbitRadius
      const markerY = centerY + Math.sin(angle) * orbitRadius
      const active = marker === selectedLifeStage

      ctx.save()
      ctx.translate(markerX, markerY)
      ctx.beginPath()
      ctx.arc(0, 0, miniatureSize * 1.18, 0, Math.PI * 2)
      ctx.fillStyle = active ? 'rgba(48, 117, 108, 0.92)' : 'rgba(11, 28, 32, 0.94)'
      ctx.fill()
      ctx.strokeStyle = active ? 'rgba(102, 252, 241, 0.92)' : 'rgba(181, 224, 204, 0.32)'
      ctx.lineWidth = active ? 1.5 : 1
      ctx.shadowColor = active ? 'rgba(102, 252, 241, 0.58)' : 'transparent'
      ctx.shadowBlur = active ? 15 : 0
      ctx.stroke()
      ctx.shadowBlur = 0
      ctx.save()
      ctx.beginPath()
      ctx.arc(0, 0, miniatureSize, 0, Math.PI * 2)
      ctx.clip()
      speciesDrawer(ctx, marker, reducedMotion ? 0 : time, miniatureSize * 0.88)
      ctx.restore()
      ctx.restore()
    }

    const size = Math.min(width, height) * 0.31
    ctx.save()
    ctx.translate(centerX, centerY)
    speciesDrawer(ctx, selectedLifeStage, reducedMotion ? 0 : time, size)
    ctx.restore()

    const lifeStage = lifecycleData[selectedSpecies].stages[selectedLifeStage]
    lifeCanvas.setAttribute('aria-label', `${lifecycleData[selectedSpecies].name}, ${lifeStage.name} stage illustration`)
  }

  const simulationScoreComponents = () => {
    const temperatureFit = Math.max(0, 100 - Math.abs(simulationValues.temperature - 19) * 3.1)
    const rainfallFit = Math.max(0, 100 - Math.abs(simulationValues.rainfall - 100) * 0.55)
    const oxygenFit = Math.max(0, 100 - Math.abs(simulationValues.oxygen - 21) * 5)
    return {
      temperatureFit,
      rainfallFit,
      oxygenFit,
      diversityFit: simulationValues.diversity,
      score: Math.round(temperatureFit * 0.26 + rainfallFit * 0.27 + oxygenFit * 0.22 + simulationValues.diversity * 0.25),
    }
  }

  const simulationHabitat = () => {
    if (simulationValues.temperature <= 5) return 'Alpine tundra'
    if (simulationValues.temperature >= 30 && simulationValues.rainfall < 65) return 'Arid scrubland'
    if (simulationValues.rainfall >= 145 && simulationValues.temperature > 21) return 'Warm wetland forest'
    if (simulationValues.rainfall >= 125) return 'Temperate wetland'
    return 'Temperate meadow'
  }

  const drawEcosystem = (time) => {
    if (!ecosystemContext || !ecosystemMetrics.width || !ecosystemMetrics.height) return
    const width = ecosystemMetrics.width
    const height = ecosystemMetrics.height
    const ctx = ecosystemContext
    const warmth = clamp((simulationValues.temperature + 5) / 45, 0, 1)
    const wetness = clamp(simulationValues.rainfall / 200, 0, 1)
    const diversity = clamp(simulationValues.diversity / 100, 0, 1)
    const skyTop = simulationValues.temperature < 5 ? '#101b32' : simulationValues.temperature > 29 ? '#493322' : '#16323a'
    const skyMid = wetness > 0.68 ? '#355d5b' : '#37606a'
    const skyBottom = simulationValues.temperature > 29 ? '#8f6840' : '#70866c'
    fillAtmosphere(ctx, width, height, skyTop, skyMid, skyBottom)

    const sunX = width * (0.72 - wetness * 0.12)
    const sunY = height * 0.28
    const sunRadius = height * (0.045 + warmth * 0.025)
    const sunGlow = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.1, sunX, sunY, sunRadius * (wetness > 0.7 ? 5 : 3.5))
    sunGlow.addColorStop(0, `rgba(255, 221, 158, ${0.3 + warmth * 0.12})`)
    sunGlow.addColorStop(1, 'rgba(255, 221, 158, 0)')
    ctx.fillStyle = sunGlow
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#f4d7a0'
    ctx.beginPath()
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2)
    ctx.fill()

    const cloudCount = Math.round(1 + wetness * 6)
    for (let cloud = 0; cloud < cloudCount; cloud += 1) {
      const cloudX = width * (0.08 + cloud * 0.15) + (reducedMotion ? 0 : Math.sin(time * 0.1 + cloud) * 8)
      const cloudY = height * (0.2 + (cloud % 3) * 0.09)
      ctx.fillStyle = `rgba(204, 223, 212, ${0.045 + wetness * 0.035})`
      ctx.beginPath()
      ctx.ellipse(cloudX, cloudY, width * 0.11, height * 0.035, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    drawMountainRange(ctx, width, height, height * 0.71, [[0, 0.55], [0.16, 0.38], [0.28, 0.57], [0.45, 0.35], [0.62, 0.59], [0.78, 0.41], [1, 0.57]], simulationValues.temperature < 5 ? '#334451' : '#3a5145')
    drawMountainRange(ctx, width, height, height * 0.78, [[0, 0.7], [0.17, 0.61], [0.33, 0.72], [0.52, 0.58], [0.71, 0.73], [0.88, 0.61], [1, 0.7]], simulationValues.temperature > 30 ? '#48402a' : '#263e36')

    const groundTop = ctx.createLinearGradient(0, height * 0.7, 0, height)
    groundTop.addColorStop(0, simulationValues.temperature > 30 ? '#6d5934' : '#456342')
    groundTop.addColorStop(1, simulationValues.temperature > 30 ? '#27251d' : '#172c26')
    ctx.fillStyle = groundTop
    ctx.beginPath()
    ctx.moveTo(0, height * 0.75)
    ctx.bezierCurveTo(width * 0.24, height * 0.68, width * 0.4, height * 0.79, width * 0.61, height * 0.73)
    ctx.bezierCurveTo(width * 0.82, height * 0.68, width * 0.91, height * 0.77, width, height * 0.71)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()

    if (wetness > 0.28) {
      ctx.fillStyle = wetness > 0.72 ? 'rgba(30, 106, 119, 0.84)' : 'rgba(31, 112, 125, 0.62)'
      ctx.beginPath()
      ctx.ellipse(width * 0.55, height * (0.87 + (1 - wetness) * 0.08), width * (0.12 + wetness * 0.16), height * 0.045, -0.025, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(188, 228, 210, 0.35)'
      ctx.lineWidth = 1
      for (let ripple = 0; ripple < 4; ripple += 1) {
        ctx.beginPath()
        ctx.ellipse(width * 0.55, height * 0.88, width * (0.05 + ripple * 0.035), height * (0.012 + ripple * 0.003), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const plantCount = Math.round(2 + diversity * 9)
    const plantColor = simulationValues.temperature < 5 ? '#67766a' : simulationValues.temperature > 30 && wetness < 0.3 ? '#8c7943' : '#6a9b62'
    for (let plant = 0; plant < plantCount; plant += 1) {
      const plantX = width * (0.04 + (plant / Math.max(1, plantCount - 1)) * 0.92)
      const plantScale = height * (0.095 + diversity * 0.09 + (plant % 3) * 0.015)
      drawTree(ctx, plantX, height * (0.82 + (plant % 3) * 0.025), plantScale, plantColor, Math.sin(plant) * 3)
    }

    ctx.strokeStyle = simulationValues.temperature > 30 && wetness < 0.3 ? 'rgba(191, 151, 91, 0.7)' : 'rgba(148, 182, 111, 0.76)'
    ctx.lineWidth = 1.1
    for (let grass = 0; grass < 48; grass += 1) {
      const grassX = ((grass * 83) % 997) / 997 * width
      const grassY = height * (0.8 + (grass % 7) * 0.025)
      const sway = reducedMotion ? 0 : Math.sin(time * 1.4 + grass) * 3
      ctx.beginPath()
      ctx.moveTo(grassX, grassY)
      ctx.quadraticCurveTo(grassX + sway, grassY - height * 0.025, grassX + sway * 1.8, grassY - height * (0.045 + (grass % 4) * 0.008))
      ctx.stroke()
    }

    if (wetness > 0.76 && !reducedMotion) {
      ctx.strokeStyle = 'rgba(191, 224, 222, 0.35)'
      ctx.lineWidth = 1
      for (let drop = 0; drop < 18; drop += 1) {
        const rainX = ((drop * 67) % 997) / 997 * width
        const fall = (time * 140 + drop * 41) % height
        ctx.beginPath()
        ctx.moveTo(rainX, fall)
        ctx.lineTo(rainX - 3, fall + 8)
        ctx.stroke()
      }
    }
  }

  const updateLifeCyclePlayback = () => {
    const playButton = document.querySelector('.life-play-button')
    playButton.setAttribute('aria-pressed', String(cyclePlaying))
    playButton.innerHTML = cyclePlaying ? 'PAUSE CYCLE <span aria-hidden="true">Ⅱ</span>' : 'PLAY CYCLE <span aria-hidden="true">▶</span>'
    syncLifeCycleTimer()
  }

  const syncLifeCycleTimer = () => {
    if (!reducedMotion && cyclePlaying && lifeCycleVisible && !lifeCycleTimer) {
      lifeCycleTimer = window.setInterval(() => {
        selectedLifeStage = (selectedLifeStage + 1) % lifecycleData[selectedSpecies].stages.length
        updateLifeCycleUI()
      }, 4200)
    } else if ((!cyclePlaying || !lifeCycleVisible || reducedMotion) && lifeCycleTimer) {
      window.clearInterval(lifeCycleTimer)
      lifeCycleTimer = 0
    }
  }

  const updateLifeCycleUI = () => {
    const data = lifecycleData[selectedSpecies]
    const lifeStage = data.stages[selectedLifeStage]
    document.querySelectorAll('.species-tab').forEach((tab) => {
      const selected = tab.dataset.species === selectedSpecies
      tab.classList.toggle('is-selected', selected)
      tab.setAttribute('aria-selected', String(selected))
      tab.tabIndex = selected ? 0 : -1
      if (selected) document.querySelector('.life-copy').setAttribute('aria-labelledby', tab.id)
    })
    document.querySelector('.life-species-name').textContent = data.name
    document.querySelector('.life-stage-name').textContent = lifeStage.name
    document.querySelector('.life-copy-kicker').innerHTML = `${data.cycle} / <span>${String(selectedLifeStage + 1).padStart(2, '0')} OF 04</span>`
    document.querySelector('.life-stage-title').textContent = lifeStage.title
    document.querySelector('.life-stage-description').textContent = lifeStage.description
    updateLifeCyclePlayback()
    document.querySelectorAll('.life-stage-button').forEach((button, index) => {
      const selected = index === selectedLifeStage
      button.classList.toggle('is-current', selected)
      if (selected) button.setAttribute('aria-current', 'step')
      else button.removeAttribute('aria-current')
      button.querySelector('.life-stage-button-name').textContent = data.stages[index].name
    })
    lifeCanvas.setAttribute('aria-label', `${data.name}, ${lifeStage.name} stage illustration`)
    if (lifeCycleVisible || reducedMotion) drawLifeCycle(reducedMotion ? 0 : performance.now() / 1000)
  }

  const updateSimulationUI = () => {
    const components = simulationScoreComponents()
    const stability = components.score
    const habitat = simulationHabitat()
    const status = stability >= 75 ? 'resilient' : stability >= 50 ? 'adapting' : 'under stress'
    const outputMap = {
      temperature: `${simulationValues.temperature}°C`,
      rainfall: `${simulationValues.rainfall} cm`,
      oxygen: `${simulationValues.oxygen}%`,
      diversity: `${simulationValues.diversity}%`,
    }
    Object.entries(outputMap).forEach(([key, output]) => {
      document.getElementById(`${key}-output`).textContent = output
    })
    document.querySelector('.habitat-name').textContent = habitat
    document.querySelector('.stability-value strong').textContent = stability
    document.querySelector('.ecosystem-meter span').style.width = `${stability}%`
    document.querySelector('.ecosystem-status-dot').dataset.stability = status
    ecosystemCanvas.setAttribute('aria-label', `${habitat} ecosystem, ${status}, stability ${stability} percent`)
    document.getElementById('score-temperature').textContent = Math.round(components.temperatureFit)
    document.getElementById('score-rainfall').textContent = Math.round(components.rainfallFit)
    document.getElementById('score-oxygen').textContent = Math.round(components.oxygenFit)
    document.getElementById('score-diversity').textContent = Math.round(components.diversityFit)

    const note = stability >= 75
      ? 'Conditions support a resilient habitat, with room for many forms of life.'
      : stability >= 50
        ? 'The ecosystem is adapting. Small shifts could change which species thrive.'
        : 'These conditions put the habitat under stress and reduce its capacity to recover.'
    document.querySelector('.simulation-note').textContent = note
    if (ecosystemVisible || reducedMotion) drawEcosystem(reducedMotion ? 0 : performance.now() / 1000)
  }

  const updateSimulationFromInputs = () => {
    simulationValues.temperature = Number(document.getElementById('temperature-slider').value)
    simulationValues.rainfall = Number(document.getElementById('rainfall-slider').value)
    simulationValues.oxygen = Number(document.getElementById('oxygen-slider').value)
    simulationValues.diversity = Number(document.getElementById('diversity-slider').value)
    document.querySelectorAll('.simulation-presets button').forEach((button) => button.classList.remove('is-selected'))
    updateSimulationUI()
  }

  document.querySelectorAll('.species-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      selectedSpecies = tab.dataset.species
      selectedLifeStage = 0
      updateLifeCycleUI()
    })

    tab.addEventListener('keydown', (event) => {
      const tabs = [...document.querySelectorAll('.species-tab')]
      const currentIndex = tabs.indexOf(tab)
      let nextIndex = currentIndex
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length
      else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length
      else if (event.key === 'Home') nextIndex = 0
      else if (event.key === 'End') nextIndex = tabs.length - 1
      else return
      event.preventDefault()
      selectedSpecies = tabs[nextIndex].dataset.species
      selectedLifeStage = 0
      updateLifeCycleUI()
      tabs[nextIndex].focus()
    })
  })

  document.querySelectorAll('.life-stage-button').forEach((button) => {
    button.addEventListener('click', () => {
      selectedLifeStage = Number(button.dataset.stageIndex)
      updateLifeCycleUI()
    })
  })

  document.querySelector('.cycle-previous').addEventListener('click', () => {
    const stageCount = lifecycleData[selectedSpecies].stages.length
    selectedLifeStage = (selectedLifeStage - 1 + stageCount) % stageCount
    updateLifeCycleUI()
  })

  document.querySelector('.cycle-next').addEventListener('click', () => {
    const stageCount = lifecycleData[selectedSpecies].stages.length
    selectedLifeStage = (selectedLifeStage + 1) % stageCount
    updateLifeCycleUI()
  })

  document.querySelector('.life-play-button').addEventListener('click', () => {
    cyclePlaying = !cyclePlaying
    updateLifeCyclePlayback()
  })

  document.querySelectorAll('.simulation-slider input').forEach((slider) => {
    slider.addEventListener('input', updateSimulationFromInputs)
  })

  const climatePresets = {
    carboniferous: { temperature: 24, rainfall: 160, oxygen: 30, diversity: 84 },
    steppe: { temperature: 5, rainfall: 50, oxygen: 19, diversity: 51 },
    arid: { temperature: 35, rainfall: 20, oxygen: 18, diversity: 22 },
  }

  document.querySelectorAll('.simulation-presets button').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = climatePresets[button.dataset.preset]
      Object.assign(simulationValues, preset)
      Object.entries(preset).forEach(([key, value]) => {
        document.getElementById(`${key}-slider`).value = value
      })
      document.querySelectorAll('.simulation-presets button').forEach((item) => item.classList.toggle('is-selected', item === button))
      updateSimulationUI()
    })
  })

  document.querySelector('.simulation-reset').addEventListener('click', () => {
    Object.assign(simulationValues, simulationDefaults)
    Object.entries(simulationDefaults).forEach(([key, value]) => {
      document.getElementById(`${key}-slider`).value = value
    })
    document.querySelectorAll('.simulation-presets button').forEach((button) => button.classList.remove('is-selected'))
    updateSimulationUI()
  })

  const renderLoop = (time) => {
    const animationTime = reducedMotion ? 0 : time / 1000
    if (stageVisible) drawFrame(animationTime)
    if (lifeCycleVisible) drawLifeCycle(animationTime)
    if (ecosystemVisible) drawEcosystem(animationTime)

    if (!reducedMotion && (stageVisible || lifeCycleVisible || ecosystemVisible)) {
      frameId = window.requestAnimationFrame(renderLoop)
    } else {
      frameId = 0
    }
  }

  const startRenderLoop = () => {
    if (!frameId) frameId = window.requestAnimationFrame(renderLoop)
  }

  visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target === stage) {
        stageVisible = entry.isIntersecting
        if (stageVisible) drawFrame(reducedMotion ? 0 : performance.now() / 1000)
      } else if (entry.target === lifeCanvas) {
        lifeCycleVisible = entry.isIntersecting
        syncLifeCycleTimer()
        if (lifeCycleVisible) drawLifeCycle(reducedMotion ? 0 : performance.now() / 1000)
      } else if (entry.target === ecosystemCanvas) {
        ecosystemVisible = entry.isIntersecting
        if (ecosystemVisible) drawEcosystem(reducedMotion ? 0 : performance.now() / 1000)
      }
    })
    startRenderLoop()
  }, { rootMargin: '120px 0px' })

  visibilityObserver.observe(stage)
  if (lifeCanvas) visibilityObserver.observe(lifeCanvas)
  if (ecosystemCanvas) visibilityObserver.observe(ecosystemCanvas)

  const resizeObserver = new ResizeObserver(() => {
    resizeCanvas()
    if (hasGsap) ScrollTrigger.refresh()
  })

  resizeObserver.observe(stage)
  resizeCanvas()
  resizeAuxiliaryCanvases()
  updateLifeCycleUI()
  updateSimulationUI()
  activateStep(steps[0], 0)
  initializeScroll()

  if (lenis && hasGsap) lenis.on('scroll', ScrollTrigger.update)
  startRenderLoop()

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const target = document.querySelector(link.getAttribute('href'))
      if (!target) return
      event.preventDefault()
      if (lenis) lenis.scrollTo(target)
      else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    })
  })

  const refreshAfterFonts = () => {
    resizeAuxiliaryCanvases()
    if (hasGsap) ScrollTrigger.refresh()
  }

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshAfterFonts)

  window.addEventListener('resize', refreshAfterFonts, { passive: true })
  window.addEventListener('pagehide', () => {
    window.cancelAnimationFrame(frameId)
    window.clearInterval(lifeCycleTimer)
    if (lenis) lenis.destroy()
    resizeObserver.disconnect()
    if (visibilityObserver) visibilityObserver.disconnect()
    if (gsapContext) gsapContext.revert()
  }, { once: true })
})()